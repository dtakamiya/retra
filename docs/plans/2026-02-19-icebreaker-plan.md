# アイスブレイカー機能 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** WRITINGフェーズの前にICEBREAKフェーズを追加し、参加者がアイスブレイカー質問に回答を共有できるようにする

**Architecture:** 既存のPhase enumにICEBREAKを追加し、新規`icebreaker/`モジュールをKudosモジュールと同じパターンで構築。ボード作成時に`enableIcebreaker`フラグで有効/無効を切り替え、有効時はICEBREAKフェーズから開始する。

**Tech Stack:** Spring Boot 3.5 + Kotlin, React 19 + TypeScript + Zustand, SQLite + Flyway, WebSocket STOMP

**Design:** `docs/plans/2026-02-19-icebreaker-design.md`

---

## Phase 1: バックエンド基盤（DB + ドメイン）

### Task 1: Flyway マイグレーション

**Files:**
- Create: `backend/src/main/resources/db/migration/V16__add_icebreaker.sql`

**Step 1: マイグレーションファイルを作成**

```sql
-- boards テーブルに icebreaker 関連カラムを追加
ALTER TABLE boards ADD COLUMN enable_icebreaker INTEGER NOT NULL DEFAULT 0;
ALTER TABLE boards ADD COLUMN icebreaker_question TEXT;

-- icebreaker_answers テーブルを作成
CREATE TABLE icebreaker_answers (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

CREATE INDEX idx_icebreaker_answers_board_id ON icebreaker_answers(board_id);
CREATE INDEX idx_icebreaker_answers_participant_id ON icebreaker_answers(participant_id);
```

**Step 2: バックエンドビルドで検証**

Run: `cd backend && ./gradlew test`
Expected: PASS（既存テストがin-memoryで走るのでマイグレーションが適用される）

**Step 3: コミット**

```bash
git add backend/src/main/resources/db/migration/V16__add_icebreaker.sql
git commit -m "feat: add icebreaker migration (V16)"
```

---

### Task 2: Phase enum 更新 + テスト

**Files:**
- Modify: `backend/src/main/kotlin/com/retra/board/domain/Phase.kt`
- Modify: `backend/src/test/kotlin/com/retra/board/domain/PhaseTest.kt`

**Step 1: PhaseTest にICEBREAK遷移テストを追加（RED）**

`PhaseTest.kt` に以下のテストを追加:

```kotlin
@Test
fun `ICEBREAK can transition to WRITING`() {
    val result = Phase.ICEBREAK.transitionTo(Phase.WRITING)
    assertThat(result).isEqualTo(Phase.WRITING)
}

@Test
fun `ICEBREAK cannot transition to VOTING`() {
    assertThrows<InvalidPhaseTransitionException> {
        Phase.ICEBREAK.transitionTo(Phase.VOTING)
    }
}

@Test
fun `ICEBREAK cannot create card`() {
    assertThat(Phase.ICEBREAK.canCreateCard()).isFalse()
}

@Test
fun `ICEBREAK cannot vote`() {
    assertThat(Phase.ICEBREAK.canVote()).isFalse()
}

@Test
fun `ICEBREAK phase can answer icebreaker`() {
    assertThat(Phase.ICEBREAK.canAnswerIcebreaker()).isTrue()
}

@Test
fun `WRITING phase cannot answer icebreaker`() {
    assertThat(Phase.WRITING.canAnswerIcebreaker()).isFalse()
}
```

**Step 2: テスト実行で失敗を確認**

Run: `cd backend && ./gradlew test --tests "com.retra.board.domain.PhaseTest"`
Expected: FAIL（ICEBREAK が存在しない）

**Step 3: Phase.kt を更新**

```kotlin
enum class Phase {
    ICEBREAK,
    WRITING,
    VOTING,
    DISCUSSION,
    ACTION_ITEMS,
    CLOSED;

    fun canTransitionTo(target: Phase): Boolean {
        return validTransitions[this] == target
    }

    fun transitionTo(target: Phase): Phase {
        if (!canTransitionTo(target)) {
            throw InvalidPhaseTransitionException(
                "Invalid phase transition: $this -> $target"
            )
        }
        return target
    }

    fun canCreateCard(): Boolean = this == WRITING

    fun canVote(): Boolean = this == VOTING

    fun canMoveCard(): Boolean = this in MOVABLE_PHASES

    fun canMoveCardCrossColumn(): Boolean = this == WRITING

    fun requiresAuthorForMove(): Boolean = this == WRITING

    fun requiresFacilitatorForMove(): Boolean = this in FACILITATOR_MOVE_PHASES

    fun canCreateMemo(): Boolean = this in MEMO_PHASES

    fun canCreateActionItem(): Boolean = this == ACTION_ITEMS

    fun canMarkDiscussed(): Boolean = this in MEMO_PHASES

    fun canAnswerIcebreaker(): Boolean = this == ICEBREAK

    companion object {
        private val validTransitions = mapOf(
            ICEBREAK to WRITING,
            WRITING to VOTING,
            VOTING to DISCUSSION,
            DISCUSSION to ACTION_ITEMS,
            ACTION_ITEMS to CLOSED
        )

        private val MOVABLE_PHASES = listOf(WRITING, DISCUSSION, ACTION_ITEMS)
        private val FACILITATOR_MOVE_PHASES = listOf(DISCUSSION, ACTION_ITEMS)
        private val MEMO_PHASES = listOf(DISCUSSION, ACTION_ITEMS)
    }
}
```

**Step 4: テスト実行で成功を確認**

Run: `cd backend && ./gradlew test --tests "com.retra.board.domain.PhaseTest"`
Expected: PASS

**Step 5: コミット**

```bash
git add backend/src/main/kotlin/com/retra/board/domain/Phase.kt backend/src/test/kotlin/com/retra/board/domain/PhaseTest.kt
git commit -m "feat: add ICEBREAK phase to Phase enum"
```

---

### Task 3: Board エンティティ更新 + CreateBoardUseCase + DTOs + テスト

**Files:**
- Modify: `backend/src/main/kotlin/com/retra/board/domain/Board.kt`
- Modify: `backend/src/main/kotlin/com/retra/board/usecase/CreateBoardUseCase.kt`
- Modify: `backend/src/main/kotlin/com/retra/board/usecase/BoardDtos.kt`
- Modify: `backend/src/main/kotlin/com/retra/board/usecase/BoardMapper.kt`
- Modify: `backend/src/test/kotlin/com/retra/board/usecase/CreateBoardUseCaseTest.kt`

**Step 1: CreateBoardUseCaseTest にアイスブレイカー有効テストを追加（RED）**

```kotlin
@Test
fun `should create board with ICEBREAK phase when enableIcebreaker is true`() {
    val request = CreateBoardRequest(
        title = "Test Board",
        framework = Framework.KPT,
        enableIcebreaker = true
    )

    every { boardRepository.save(any()) } answers { firstArg() }

    val result = useCase.execute(request)

    assertThat(result.phase).isEqualTo(Phase.ICEBREAK)
    assertThat(result.enableIcebreaker).isTrue()
}

@Test
fun `should create board with WRITING phase when enableIcebreaker is false`() {
    val request = CreateBoardRequest(
        title = "Test Board",
        framework = Framework.KPT,
        enableIcebreaker = false
    )

    every { boardRepository.save(any()) } answers { firstArg() }

    val result = useCase.execute(request)

    assertThat(result.phase).isEqualTo(Phase.WRITING)
    assertThat(result.enableIcebreaker).isFalse()
}
```

**Step 2: テスト実行で失敗を確認**

Run: `cd backend && ./gradlew test --tests "com.retra.board.usecase.CreateBoardUseCaseTest"`
Expected: FAIL

**Step 3: Board.kt に enableIcebreaker と icebreakerQuestion を追加**

`Board.kt` のコンストラクタに追加:

```kotlin
@Column(name = "enable_icebreaker", nullable = false, updatable = false)
open var enableIcebreaker: Boolean = false,

@Column(name = "icebreaker_question")
open var icebreakerQuestion: String? = null,
```

`Board.create()` ファクトリを更新:

```kotlin
fun create(
    title: String,
    framework: Framework,
    maxVotesPerPerson: Int = 5,
    isAnonymous: Boolean = false,
    privateWriting: Boolean = false,
    teamName: String? = null,
    enableIcebreaker: Boolean = false
): Board {
    val slug = BoardSlug.generate()
    val now = Instant.now().toString()
    val board = Board(
        id = UUID.randomUUID().toString(),
        slug = slug.value,
        title = title,
        framework = framework,
        phase = if (enableIcebreaker) Phase.ICEBREAK else Phase.WRITING,
        maxVotesPerPerson = maxVotesPerPerson,
        isAnonymous = isAnonymous,
        privateWriting = privateWriting,
        teamName = teamName,
        enableIcebreaker = enableIcebreaker,
        createdAt = now,
        updatedAt = now
    )
    // ... columns setup unchanged
}
```

**Step 4: BoardDtos.kt を更新**

`CreateBoardRequest` に追加:
```kotlin
val enableIcebreaker: Boolean = false
```

`BoardResponse` に追加:
```kotlin
val enableIcebreaker: Boolean,
val icebreakerQuestion: String?,
```

**Step 5: BoardMapper.kt を更新**

`toBoardResponse()` に追加:
```kotlin
enableIcebreaker = board.enableIcebreaker,
icebreakerQuestion = board.icebreakerQuestion,
```

`isPrivateWritingActive` ロジックを更新（ICEBREAKフェーズ中もプライベートライティングは関係ない）:
```kotlin
val isPrivateWritingActive = board.privateWriting && board.phase == Phase.WRITING
```
→ 変更不要（WRITINGのみで正しい）

**Step 6: CreateBoardUseCase.kt を更新**

```kotlin
val board = Board.create(
    title = request.title,
    framework = request.framework,
    maxVotesPerPerson = request.maxVotesPerPerson,
    isAnonymous = request.isAnonymous,
    privateWriting = request.privateWriting,
    teamName = request.teamName,
    enableIcebreaker = request.enableIcebreaker
)
```

**Step 7: テスト実行で成功を確認**

Run: `cd backend && ./gradlew test --tests "com.retra.board.usecase.CreateBoardUseCaseTest"`
Expected: PASS

**Step 8: コミット**

```bash
git add backend/src/main/kotlin/com/retra/board/ backend/src/test/kotlin/com/retra/board/
git commit -m "feat: add enableIcebreaker to Board and CreateBoardUseCase"
```

---

### Task 4: IcebreakerAnswer ドメインエンティティ + イベント + リポジトリインターフェース

**Files:**
- Create: `backend/src/main/kotlin/com/retra/icebreaker/domain/IcebreakerAnswer.kt`
- Create: `backend/src/main/kotlin/com/retra/icebreaker/domain/IcebreakerEvent.kt`
- Create: `backend/src/main/kotlin/com/retra/icebreaker/domain/IcebreakerAnswerRepository.kt`
- Create: `backend/src/main/kotlin/com/retra/icebreaker/domain/IcebreakerQuestions.kt`
- Create: `backend/src/test/kotlin/com/retra/icebreaker/domain/IcebreakerAnswerTest.kt`
- Create: `backend/src/test/kotlin/com/retra/icebreaker/domain/IcebreakerQuestionsTest.kt`

**Step 1: IcebreakerAnswerTest を作成（RED）**

```kotlin
package com.retra.icebreaker.domain

import com.retra.shared.domain.BadRequestException
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class IcebreakerAnswerTest {

    @Test
    fun `create answer with valid content`() {
        val answer = IcebreakerAnswer.create(
            boardId = "board-1",
            participantId = "participant-1",
            answerText = "キャンプにハマっています"
        )
        assertThat(answer.id).isNotBlank()
        assertThat(answer.boardId).isEqualTo("board-1")
        assertThat(answer.participantId).isEqualTo("participant-1")
        assertThat(answer.answerText).isEqualTo("キャンプにハマっています")
        assertThat(answer.createdAt).isNotBlank()
    }

    @Test
    fun `create answer trims whitespace`() {
        val answer = IcebreakerAnswer.create(
            boardId = "board-1",
            participantId = "participant-1",
            answerText = "  テスト回答  "
        )
        assertThat(answer.answerText).isEqualTo("テスト回答")
    }

    @Test
    fun `create answer fails when content is blank`() {
        assertThrows<BadRequestException> {
            IcebreakerAnswer.create(
                boardId = "board-1",
                participantId = "participant-1",
                answerText = "   "
            )
        }
    }

    @Test
    fun `create answer fails when content exceeds 140 characters`() {
        assertThrows<BadRequestException> {
            IcebreakerAnswer.create(
                boardId = "board-1",
                participantId = "participant-1",
                answerText = "a".repeat(141)
            )
        }
    }

    @Test
    fun `update answer text`() {
        val answer = IcebreakerAnswer.create(
            boardId = "board-1",
            participantId = "participant-1",
            answerText = "元の回答"
        )
        answer.updateText("新しい回答")
        assertThat(answer.answerText).isEqualTo("新しい回答")
    }
}
```

**Step 2: IcebreakerQuestionsTest を作成（RED）**

```kotlin
package com.retra.icebreaker.domain

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class IcebreakerQuestionsTest {

    @Test
    fun `random returns a question from the list`() {
        val question = IcebreakerQuestions.random()
        assertThat(question).isIn(IcebreakerQuestions.ALL)
    }

    @Test
    fun `ALL contains at least 20 questions`() {
        assertThat(IcebreakerQuestions.ALL).hasSizeGreaterThanOrEqualTo(20)
    }
}
```

**Step 3: テスト実行で失敗を確認**

Run: `cd backend && ./gradlew test --tests "com.retra.icebreaker.domain.*"`
Expected: FAIL

**Step 4: IcebreakerAnswer.kt を作成**

```kotlin
package com.retra.icebreaker.domain

import com.retra.shared.domain.BadRequestException
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "icebreaker_answers")
open class IcebreakerAnswer(
    @Id
    open var id: String = "",

    @Column(name = "board_id", nullable = false)
    open var boardId: String = "",

    @Column(name = "participant_id", nullable = false)
    open var participantId: String = "",

    @Column(name = "answer_text", nullable = false)
    open var answerText: String = "",

    @Column(name = "created_at", nullable = false)
    open var createdAt: String = ""
) {
    fun updateText(newText: String) {
        val trimmed = newText.trim()
        validate(trimmed)
        answerText = trimmed
    }

    companion object {
        private const val MAX_LENGTH = 140

        private fun validate(text: String) {
            if (text.isBlank()) {
                throw BadRequestException("Answer text must not be blank")
            }
            if (text.length > MAX_LENGTH) {
                throw BadRequestException("Answer text must be $MAX_LENGTH characters or less")
            }
        }

        fun create(boardId: String, participantId: String, answerText: String): IcebreakerAnswer {
            val trimmed = answerText.trim()
            validate(trimmed)
            return IcebreakerAnswer(
                id = UUID.randomUUID().toString(),
                boardId = boardId,
                participantId = participantId,
                answerText = trimmed,
                createdAt = Instant.now().toString()
            )
        }
    }
}
```

**Step 5: IcebreakerEvent.kt を作成**

```kotlin
package com.retra.icebreaker.domain

import com.retra.shared.domain.DomainEvent

sealed class IcebreakerEvent : DomainEvent() {

    data class QuestionSet(
        val boardSlug: String,
        val question: String
    ) : IcebreakerEvent()

    data class AnswerSubmitted(
        val boardSlug: String,
        val answerId: String,
        val participantId: String,
        val participantNickname: String,
        val answerText: String,
        val createdAt: String
    ) : IcebreakerEvent()

    data class AnswerUpdated(
        val boardSlug: String,
        val answerId: String,
        val participantId: String,
        val participantNickname: String,
        val answerText: String
    ) : IcebreakerEvent()

    data class AnswerDeleted(
        val boardSlug: String,
        val answerId: String
    ) : IcebreakerEvent()
}
```

**Step 6: IcebreakerAnswerRepository.kt を作成**

```kotlin
package com.retra.icebreaker.domain

interface IcebreakerAnswerRepository {
    fun save(answer: IcebreakerAnswer): IcebreakerAnswer
    fun findById(id: String): IcebreakerAnswer?
    fun findByBoardId(boardId: String): List<IcebreakerAnswer>
    fun delete(answer: IcebreakerAnswer)
}
```

**Step 7: IcebreakerQuestions.kt を作成**

```kotlin
package com.retra.icebreaker.domain

object IcebreakerQuestions {
    val ALL = listOf(
        "最近ハマっていることは？",
        "子どものころの夢は？",
        "無人島に1つだけ持っていくなら？",
        "今一番行きたい場所は？",
        "最近読んで良かった本・記事は？",
        "自分を動物に例えると？",
        "スーパーパワーが1つ手に入るなら何がいい？",
        "最近の小さな幸せは？",
        "今年中に達成したいことは？",
        "チームメンバーに聞いてみたいことは？",
        "最近見た映画やドラマでおすすめは？",
        "朝型？夜型？",
        "好きな季節とその理由は？",
        "リモートワークで工夫していることは？",
        "最近チャレンジしたことは？",
        "10年後の自分はどうなっていると思う？",
        "週末の過ごし方は？",
        "最近感動したことは？",
        "好きな食べ物ベスト3は？",
        "仕事で一番やりがいを感じる瞬間は？",
        "ストレス解消法は？",
        "最近学んだ新しいことは？",
        "タイムマシンがあったらどの時代に行く？",
        "いま一番欲しいものは？",
        "チームの好きなところは？"
    )

    fun random(): String = ALL.random()
}
```

**Step 8: テスト実行で成功を確認**

Run: `cd backend && ./gradlew test --tests "com.retra.icebreaker.domain.*"`
Expected: PASS

**Step 9: コミット**

```bash
git add backend/src/main/kotlin/com/retra/icebreaker/ backend/src/test/kotlin/com/retra/icebreaker/
git commit -m "feat: add IcebreakerAnswer domain entity, events, and questions"
```

---

## Phase 2: バックエンド UseCase + Controller

### Task 5: DTOs + Mapper + GetIcebreakerUseCase + テスト

**Files:**
- Create: `backend/src/main/kotlin/com/retra/icebreaker/usecase/IcebreakerDtos.kt`
- Create: `backend/src/main/kotlin/com/retra/icebreaker/usecase/IcebreakerMapper.kt`
- Create: `backend/src/main/kotlin/com/retra/icebreaker/usecase/GetIcebreakerUseCase.kt`
- Create: `backend/src/test/kotlin/com/retra/icebreaker/usecase/GetIcebreakerUseCaseTest.kt`

**Step 1: テスト作成（RED）**

`GetIcebreakerUseCaseTest.kt`:
```kotlin
package com.retra.icebreaker.usecase

import com.retra.board.domain.Board
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Framework
import com.retra.board.domain.Phase
import com.retra.icebreaker.domain.IcebreakerAnswer
import com.retra.icebreaker.domain.IcebreakerAnswerRepository
import com.retra.shared.domain.NotFoundException
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class GetIcebreakerUseCaseTest {
    private val boardRepository = mockk<BoardRepository>()
    private val answerRepository = mockk<IcebreakerAnswerRepository>()
    private val useCase = GetIcebreakerUseCase(boardRepository, answerRepository)

    @Test
    fun `returns icebreaker data for board`() {
        val board = Board(id = "b1", slug = "test-slug", title = "Test",
            framework = Framework.KPT, phase = Phase.ICEBREAK,
            enableIcebreaker = true, icebreakerQuestion = "テスト質問")
        val answers = listOf(
            IcebreakerAnswer(id = "a1", boardId = "b1", participantId = "p1",
                answerText = "回答1", createdAt = "2026-01-01T00:00:00Z")
        )
        every { boardRepository.findBySlug("test-slug") } returns board
        every { answerRepository.findByBoardId("b1") } returns answers

        val result = useCase.execute("test-slug")

        assertThat(result.question).isEqualTo("テスト質問")
        assertThat(result.answers).hasSize(1)
        assertThat(result.answers[0].answerText).isEqualTo("回答1")
    }

    @Test
    fun `throws NotFoundException when board not found`() {
        every { boardRepository.findBySlug("bad-slug") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("bad-slug")
        }
    }
}
```

**Step 2: テスト失敗を確認**

Run: `cd backend && ./gradlew test --tests "com.retra.icebreaker.usecase.GetIcebreakerUseCaseTest"`
Expected: FAIL

**Step 3: IcebreakerDtos.kt を作成**

```kotlin
package com.retra.icebreaker.usecase

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class SetQuestionRequest(
    @field:NotBlank
    val participantId: String,
    @field:NotBlank
    val type: String, // "RANDOM" or "CUSTOM"
    @field:Size(max = 200)
    val questionText: String? = null
)

data class SubmitAnswerRequest(
    @field:NotBlank
    val participantId: String,
    @field:NotBlank
    @field:Size(max = 140)
    val answerText: String
)

data class UpdateAnswerRequest(
    @field:NotBlank
    val participantId: String,
    @field:NotBlank
    @field:Size(max = 140)
    val answerText: String
)

data class IcebreakerResponse(
    val question: String?,
    val answers: List<IcebreakerAnswerResponse>
)

data class IcebreakerAnswerResponse(
    val id: String,
    val participantId: String,
    val participantNickname: String,
    val answerText: String,
    val createdAt: String
)
```

**Step 4: IcebreakerMapper.kt を作成**

```kotlin
package com.retra.icebreaker.usecase

import com.retra.board.domain.Participant
import com.retra.icebreaker.domain.IcebreakerAnswer

object IcebreakerMapper {
    fun toAnswerResponse(answer: IcebreakerAnswer, participant: Participant): IcebreakerAnswerResponse {
        return IcebreakerAnswerResponse(
            id = answer.id,
            participantId = answer.participantId,
            participantNickname = participant.nickname,
            answerText = answer.answerText,
            createdAt = answer.createdAt
        )
    }
}
```

**Step 5: GetIcebreakerUseCase.kt を作成**

```kotlin
package com.retra.icebreaker.usecase

import com.retra.board.domain.BoardRepository
import com.retra.icebreaker.domain.IcebreakerAnswerRepository
import com.retra.shared.domain.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GetIcebreakerUseCase(
    private val boardRepository: BoardRepository,
    private val answerRepository: IcebreakerAnswerRepository
) {
    @Transactional(readOnly = true)
    fun execute(slug: String): IcebreakerResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")

        val answers = answerRepository.findByBoardId(board.id)
        val participantMap = board.participants.associateBy { it.id }

        return IcebreakerResponse(
            question = board.icebreakerQuestion,
            answers = answers.map { answer ->
                val participant = participantMap[answer.participantId]
                IcebreakerMapper.toAnswerResponse(
                    answer,
                    participant ?: throw NotFoundException("Participant not found")
                )
            }
        )
    }
}
```

**Step 6: テスト成功を確認**

Run: `cd backend && ./gradlew test --tests "com.retra.icebreaker.usecase.GetIcebreakerUseCaseTest"`
Expected: PASS

**Step 7: コミット**

```bash
git add backend/src/main/kotlin/com/retra/icebreaker/usecase/ backend/src/test/kotlin/com/retra/icebreaker/usecase/
git commit -m "feat: add GetIcebreakerUseCase with DTOs and Mapper"
```

---

### Task 6: SetIcebreakerQuestionUseCase + SubmitAnswerUseCase + Update/Delete + テスト

**Files:**
- Create: `backend/src/main/kotlin/com/retra/icebreaker/usecase/SetIcebreakerQuestionUseCase.kt`
- Create: `backend/src/main/kotlin/com/retra/icebreaker/usecase/SubmitIcebreakerAnswerUseCase.kt`
- Create: `backend/src/main/kotlin/com/retra/icebreaker/usecase/UpdateIcebreakerAnswerUseCase.kt`
- Create: `backend/src/main/kotlin/com/retra/icebreaker/usecase/DeleteIcebreakerAnswerUseCase.kt`
- Create: `backend/src/test/kotlin/com/retra/icebreaker/usecase/SetIcebreakerQuestionUseCaseTest.kt`
- Create: `backend/src/test/kotlin/com/retra/icebreaker/usecase/SubmitIcebreakerAnswerUseCaseTest.kt`
- Create: `backend/src/test/kotlin/com/retra/icebreaker/usecase/UpdateIcebreakerAnswerUseCaseTest.kt`
- Create: `backend/src/test/kotlin/com/retra/icebreaker/usecase/DeleteIcebreakerAnswerUseCaseTest.kt`

**パターン:** 各UseCaseは以下のフローに従う:
1. テストを書く（RED）
2. 実装する（GREEN）
3. テスト実行で成功確認

**SetIcebreakerQuestionUseCase のテスト例:**

```kotlin
@Test
fun `sets random question when type is RANDOM`() {
    val board = Board(id = "b1", slug = "test", phase = Phase.ICEBREAK, enableIcebreaker = true)
    board.participants.add(Participant(id = "p1", board = board, nickname = "Alice", isFacilitator = true))
    every { boardRepository.findBySlug("test") } returns board
    every { boardRepository.save(any()) } answers { firstArg() }

    val result = useCase.execute("test", SetQuestionRequest(participantId = "p1", type = "RANDOM"))

    assertThat(result.question).isNotBlank()
    assertThat(result.question).isIn(IcebreakerQuestions.ALL)
}

@Test
fun `throws ForbiddenException when not facilitator`() {
    val board = Board(id = "b1", slug = "test", phase = Phase.ICEBREAK, enableIcebreaker = true)
    board.participants.add(Participant(id = "p1", board = board, nickname = "Alice", isFacilitator = false))
    every { boardRepository.findBySlug("test") } returns board

    assertThrows<ForbiddenException> {
        useCase.execute("test", SetQuestionRequest(participantId = "p1", type = "RANDOM"))
    }
}

@Test
fun `throws BadRequestException when not in ICEBREAK phase`() {
    val board = Board(id = "b1", slug = "test", phase = Phase.WRITING, enableIcebreaker = true)
    board.participants.add(Participant(id = "p1", board = board, nickname = "Alice", isFacilitator = true))
    every { boardRepository.findBySlug("test") } returns board

    assertThrows<BadRequestException> {
        useCase.execute("test", SetQuestionRequest(participantId = "p1", type = "RANDOM"))
    }
}
```

**SetIcebreakerQuestionUseCase 実装:**

```kotlin
@Service
class SetIcebreakerQuestionUseCase(
    private val boardRepository: BoardRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {
    @Transactional
    fun execute(slug: String, request: SetQuestionRequest): IcebreakerResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")
        val participant = board.findParticipantById(request.participantId)
        if (!participant.isFacilitator) {
            throw ForbiddenException("Only facilitator can set icebreaker question")
        }
        if (!board.phase.canAnswerIcebreaker()) {
            throw BadRequestException("Can only set question during ICEBREAK phase")
        }

        val question = when (request.type.uppercase()) {
            "RANDOM" -> IcebreakerQuestions.random()
            "CUSTOM" -> request.questionText?.trim()
                ?: throw BadRequestException("questionText is required for CUSTOM type")
            else -> throw BadRequestException("Invalid type: ${request.type}")
        }

        board.icebreakerQuestion = question
        boardRepository.save(board)

        eventPublisher.publish(IcebreakerEvent.QuestionSet(boardSlug = slug, question = question))

        return IcebreakerResponse(question = question, answers = emptyList())
    }
}
```

**SubmitIcebreakerAnswerUseCase, UpdateIcebreakerAnswerUseCase, DeleteIcebreakerAnswerUseCase** は同じパターンで実装。各UseCaseは:
- ボードを取得、参加者を検証
- フェーズをチェック（Submit: ICEBREAKのみ、Update/Delete: 本人チェック）
- エンティティを操作
- イベントを発行

**Step: 全テスト実行**

Run: `cd backend && ./gradlew test --tests "com.retra.icebreaker.*"`
Expected: PASS

**Step: コミット**

```bash
git add backend/src/main/kotlin/com/retra/icebreaker/ backend/src/test/kotlin/com/retra/icebreaker/
git commit -m "feat: add icebreaker use cases (set question, submit/update/delete answer)"
```

---

### Task 7: JPA リポジトリ + Controller + DomainEventBroadcaster + テスト

**Files:**
- Create: `backend/src/main/kotlin/com/retra/icebreaker/gateway/db/SpringDataIcebreakerAnswerRepository.kt`
- Create: `backend/src/main/kotlin/com/retra/icebreaker/gateway/db/JpaIcebreakerAnswerRepository.kt`
- Create: `backend/src/main/kotlin/com/retra/icebreaker/gateway/controller/IcebreakerController.kt`
- Create: `backend/src/test/kotlin/com/retra/icebreaker/gateway/controller/IcebreakerControllerTest.kt`
- Modify: `backend/src/main/kotlin/com/retra/shared/gateway/websocket/DomainEventBroadcaster.kt`
- Modify: `backend/src/test/kotlin/com/retra/shared/gateway/websocket/DomainEventBroadcasterTest.kt`

**Step 1: SpringDataIcebreakerAnswerRepository.kt**

```kotlin
package com.retra.icebreaker.gateway.db

import com.retra.icebreaker.domain.IcebreakerAnswer
import org.springframework.data.jpa.repository.JpaRepository

interface SpringDataIcebreakerAnswerRepository : JpaRepository<IcebreakerAnswer, String> {
    fun findByBoardId(boardId: String): List<IcebreakerAnswer>
}
```

**Step 2: JpaIcebreakerAnswerRepository.kt**

```kotlin
package com.retra.icebreaker.gateway.db

import com.retra.icebreaker.domain.IcebreakerAnswer
import com.retra.icebreaker.domain.IcebreakerAnswerRepository
import org.springframework.stereotype.Repository

@Repository
class JpaIcebreakerAnswerRepository(
    private val springDataRepo: SpringDataIcebreakerAnswerRepository
) : IcebreakerAnswerRepository {
    override fun save(answer: IcebreakerAnswer): IcebreakerAnswer = springDataRepo.save(answer)
    override fun findById(id: String): IcebreakerAnswer? = springDataRepo.findById(id).orElse(null)
    override fun findByBoardId(boardId: String): List<IcebreakerAnswer> = springDataRepo.findByBoardId(boardId)
    override fun delete(answer: IcebreakerAnswer) = springDataRepo.delete(answer)
}
```

**Step 3: IcebreakerController.kt**

```kotlin
package com.retra.icebreaker.gateway.controller

import com.retra.icebreaker.usecase.*
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards/{slug}/icebreaker")
class IcebreakerController(
    private val getIcebreakerUseCase: GetIcebreakerUseCase,
    private val setIcebreakerQuestionUseCase: SetIcebreakerQuestionUseCase,
    private val submitAnswerUseCase: SubmitIcebreakerAnswerUseCase,
    private val updateAnswerUseCase: UpdateIcebreakerAnswerUseCase,
    private val deleteAnswerUseCase: DeleteIcebreakerAnswerUseCase
) {
    @GetMapping
    fun getIcebreaker(@PathVariable slug: String): IcebreakerResponse {
        return getIcebreakerUseCase.execute(slug)
    }

    @PostMapping("/question")
    fun setQuestion(
        @PathVariable slug: String,
        @Valid @RequestBody request: SetQuestionRequest
    ): IcebreakerResponse {
        return setIcebreakerQuestionUseCase.execute(slug, request)
    }

    @PostMapping("/answers")
    @ResponseStatus(HttpStatus.CREATED)
    fun submitAnswer(
        @PathVariable slug: String,
        @Valid @RequestBody request: SubmitAnswerRequest
    ): IcebreakerAnswerResponse {
        return submitAnswerUseCase.execute(slug, request)
    }

    @PutMapping("/answers/{answerId}")
    fun updateAnswer(
        @PathVariable slug: String,
        @PathVariable answerId: String,
        @Valid @RequestBody request: UpdateAnswerRequest
    ): IcebreakerAnswerResponse {
        return updateAnswerUseCase.execute(slug, answerId, request)
    }

    @DeleteMapping("/answers/{answerId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteAnswer(
        @PathVariable slug: String,
        @PathVariable answerId: String,
        @RequestParam participantId: String
    ) {
        deleteAnswerUseCase.execute(slug, answerId, participantId)
    }
}
```

**Step 4: DomainEventBroadcaster.kt にイベントハンドラー追加**

import に追加:
```kotlin
import com.retra.icebreaker.domain.IcebreakerEvent
```

ハンドラーを追加:
```kotlin
@TransactionalEventListener(fallbackExecution = true)
fun handleIcebreakerQuestionSet(event: IcebreakerEvent.QuestionSet) {
    messagingTemplate.convertAndSend(
        "/topic/board/${event.boardSlug}/icebreaker",
        WebSocketMessage("ICEBREAKER_QUESTION_SET", mapOf("question" to event.question))
    )
}

@TransactionalEventListener(fallbackExecution = true)
fun handleIcebreakerAnswerSubmitted(event: IcebreakerEvent.AnswerSubmitted) {
    messagingTemplate.convertAndSend(
        "/topic/board/${event.boardSlug}/icebreaker",
        WebSocketMessage("ICEBREAKER_ANSWER_SUBMITTED", mapOf(
            "id" to event.answerId,
            "participantId" to event.participantId,
            "participantNickname" to event.participantNickname,
            "answerText" to event.answerText,
            "createdAt" to event.createdAt
        ))
    )
}

@TransactionalEventListener(fallbackExecution = true)
fun handleIcebreakerAnswerUpdated(event: IcebreakerEvent.AnswerUpdated) {
    messagingTemplate.convertAndSend(
        "/topic/board/${event.boardSlug}/icebreaker",
        WebSocketMessage("ICEBREAKER_ANSWER_UPDATED", mapOf(
            "id" to event.answerId,
            "participantId" to event.participantId,
            "participantNickname" to event.participantNickname,
            "answerText" to event.answerText
        ))
    )
}

@TransactionalEventListener(fallbackExecution = true)
fun handleIcebreakerAnswerDeleted(event: IcebreakerEvent.AnswerDeleted) {
    messagingTemplate.convertAndSend(
        "/topic/board/${event.boardSlug}/icebreaker",
        WebSocketMessage("ICEBREAKER_ANSWER_DELETED", mapOf("answerId" to event.answerId))
    )
}
```

**Step 5: IcebreakerControllerTest + DomainEventBroadcasterTest を作成/更新**

IcebreakerControllerTest は KudosControllerTest のパターンに従い、各エンドポイントのテストを書く。

**Step 6: 全バックエンドテスト実行**

Run: `cd backend && ./gradlew test`
Expected: PASS

**Step 7: コミット**

```bash
git add backend/src/main/kotlin/com/retra/icebreaker/gateway/ backend/src/main/kotlin/com/retra/shared/gateway/websocket/DomainEventBroadcaster.kt backend/src/test/
git commit -m "feat: add IcebreakerController, JPA repos, and WebSocket broadcast"
```

---

## Phase 3: 既存バックエンドテストの修正

### Task 8: Phase変更に伴う既存テストの修正

**影響箇所:**
- `backend/src/test/kotlin/com/retra/board/domain/PhaseTest.kt` — 既存テストは壊れていないはず（ICEBREAK→WRITING追加のみ）
- `backend/src/test/kotlin/com/retra/board/usecase/CreateBoardUseCaseTest.kt` — BoardResponseに `enableIcebreaker`, `icebreakerQuestion` フィールド追加
- `backend/src/test/kotlin/com/retra/board/gateway/controller/BoardControllerTest.kt` — レスポンス構造変更
- `TestFixtures.kt` — Board生成にenableIcebreaker追加

**Step 1: TestFixtures.kt にアイスブレイカー用ヘルパー追加**

```kotlin
fun icebreakerAnswer(
    id: String = UUID.randomUUID().toString(),
    boardId: String = "board-1",
    participantId: String = "participant-1",
    answerText: String = "テスト回答",
    createdAt: String = Instant.now().toString()
) = IcebreakerAnswer(id = id, boardId = boardId, participantId = participantId, answerText = answerText, createdAt = createdAt)
```

**Step 2: 既存テストのBoardResponse参照箇所を修正**

BoardResponse を検証しているテストに `enableIcebreaker` と `icebreakerQuestion` の検証を追加。

**Step 3: 全テスト実行**

Run: `cd backend && ./gradlew test`
Expected: PASS

**Step 4: コミット**

```bash
git add backend/src/test/
git commit -m "fix: update existing tests for ICEBREAK phase compatibility"
```

---

## Phase 4: フロントエンド基盤

### Task 9: Types + API Client + Store + WebSocket

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/api/client.ts`
- Modify: `frontend/src/store/boardStore.ts`
- Modify: `frontend/src/websocket/useWebSocket.ts`
- Modify: corresponding test files

**Step 1: types/index.ts を更新**

Phase 型を更新:
```typescript
export type Phase = 'ICEBREAK' | 'WRITING' | 'VOTING' | 'DISCUSSION' | 'ACTION_ITEMS' | 'CLOSED';
```

Board インターフェースに追加:
```typescript
enableIcebreaker: boolean;
icebreakerQuestion: string | null;
```

新しい型を追加:
```typescript
export interface IcebreakerAnswer {
  id: string;
  participantId: string;
  participantNickname: string;
  answerText: string;
  createdAt: string;
}

export interface IcebreakerData {
  question: string | null;
  answers: IcebreakerAnswer[];
}

export interface IcebreakerAnswerSubmittedPayload {
  id: string;
  participantId: string;
  participantNickname: string;
  answerText: string;
  createdAt: string;
}

export interface IcebreakerAnswerUpdatedPayload {
  id: string;
  participantId: string;
  participantNickname: string;
  answerText: string;
}

export interface IcebreakerAnswerDeletedPayload {
  answerId: string;
}
```

**Step 2: api/client.ts にアイスブレイカーAPI追加**

`createBoard` に `enableIcebreaker` パラメータ追加:
```typescript
createBoard(title: string, framework: Framework, maxVotesPerPerson: number = 5, isAnonymous: boolean = false, teamName?: string, privateWriting: boolean = false, enableIcebreaker: boolean = false): Promise<Board> {
    return request('/boards', {
      method: 'POST',
      body: JSON.stringify({ title, framework, maxVotesPerPerson, isAnonymous, teamName, privateWriting, enableIcebreaker }),
    });
  },
```

新規API:
```typescript
// Icebreaker
getIcebreaker(slug: string): Promise<IcebreakerData> {
  return request(`/boards/${slug}/icebreaker`);
},

setIcebreakerQuestion(slug: string, participantId: string, type: 'RANDOM' | 'CUSTOM', questionText?: string): Promise<IcebreakerData> {
  return request(`/boards/${slug}/icebreaker/question`, {
    method: 'POST',
    body: JSON.stringify({ participantId, type, questionText }),
  });
},

submitIcebreakerAnswer(slug: string, participantId: string, answerText: string): Promise<IcebreakerAnswer> {
  return request(`/boards/${slug}/icebreaker/answers`, {
    method: 'POST',
    body: JSON.stringify({ participantId, answerText }),
  });
},

updateIcebreakerAnswer(slug: string, answerId: string, participantId: string, answerText: string): Promise<IcebreakerAnswer> {
  return request(`/boards/${slug}/icebreaker/answers/${answerId}`, {
    method: 'PUT',
    body: JSON.stringify({ participantId, answerText }),
  });
},

deleteIcebreakerAnswer(slug: string, answerId: string, participantId: string): Promise<void> {
  const params = new URLSearchParams({ participantId });
  return request(`/boards/${slug}/icebreaker/answers/${answerId}?${params}`, {
    method: 'DELETE',
  });
},
```

**Step 3: boardStore.ts にアイスブレイカー状態を追加**

```typescript
// State に追加
icebreakerData: IcebreakerData | null;
setIcebreakerData: (data: IcebreakerData) => void;
handleIcebreakerQuestionSet: (question: string) => void;
handleIcebreakerAnswerSubmitted: (answer: IcebreakerAnswer) => void;
handleIcebreakerAnswerUpdated: (payload: IcebreakerAnswerUpdatedPayload) => void;
handleIcebreakerAnswerDeleted: (payload: IcebreakerAnswerDeletedPayload) => void;
```

**Step 4: useWebSocket.ts にアイスブレイカートピック購読を追加**

```typescript
client.subscribe(`/topic/board/${slug}/icebreaker`, (message) => {
  const { type, payload } = JSON.parse(message.body);
  switch (type) {
    case 'ICEBREAKER_QUESTION_SET':
      handleIcebreakerQuestionSet(payload.question);
      break;
    case 'ICEBREAKER_ANSWER_SUBMITTED':
      handleIcebreakerAnswerSubmitted(payload as IcebreakerAnswer);
      break;
    case 'ICEBREAKER_ANSWER_UPDATED':
      handleIcebreakerAnswerUpdated(payload as IcebreakerAnswerUpdatedPayload);
      break;
    case 'ICEBREAKER_ANSWER_DELETED':
      handleIcebreakerAnswerDeleted(payload as IcebreakerAnswerDeletedPayload);
      break;
  }
});
```

**Step 5: テスト更新（fixtures.ts, boardStore.test.ts, useWebSocket.test.ts, client.test.ts）**

`fixtures.ts` の `createBoard` にデフォルト値追加:
```typescript
enableIcebreaker: false,
icebreakerQuestion: null,
```

**Step 6: テスト実行**

Run: `cd frontend && npm run test && npm run lint && npx tsc --noEmit`
Expected: PASS

**Step 7: コミット**

```bash
git add frontend/src/types/ frontend/src/api/ frontend/src/store/ frontend/src/websocket/ frontend/src/test/
git commit -m "feat: add icebreaker types, API client, store, and WebSocket"
```

---

### Task 10: PhaseControl + PhaseTransitionDialog 更新 + テスト

**Files:**
- Modify: `frontend/src/components/PhaseControl.tsx`
- Modify: `frontend/src/components/PhaseTransitionDialog.tsx`
- Modify: `frontend/src/components/PhaseControl.test.tsx`
- Modify: `frontend/src/components/PhaseTransitionDialog.test.tsx`

**Step 1: PhaseControl.tsx を更新**

```typescript
const PHASE_TOOLTIPS: Record<Phase, string> = {
  ICEBREAK: 'アイスブレイクで場を和ませましょう',
  WRITING: 'カードを追加して意見を書きましょう',
  // ... 既存
};

const PHASES: { key: Phase; label: string }[] = [
  { key: 'ICEBREAK', label: 'アイスブレイク' },
  { key: 'WRITING', label: '記入' },
  // ... 既存
];

const NEXT_PHASE: Record<Phase, Phase | null> = {
  ICEBREAK: 'WRITING',
  WRITING: 'VOTING',
  // ... 既存
};
```

注意: ICEBREAKフェーズはボードの `enableIcebreaker` が true の場合のみ表示。false の場合はICEBREAKをPHASES配列から除外:

```typescript
const visiblePhases = board.enableIcebreaker
  ? PHASES
  : PHASES.filter(p => p.key !== 'ICEBREAK');
```

**Step 2: PhaseTransitionDialog.tsx を更新**

```typescript
const PHASE_LABELS: Record<Phase, string> = {
  ICEBREAK: 'アイスブレイク',
  WRITING: '記入',
  // ... 既存
};

const PHASE_DESCRIPTIONS: Record<Phase, string> = {
  ICEBREAK: 'アイスブレイクで場を和ませます',
  WRITING: '参加者がカードを記入できます',
  // ... 既存
};

const PHASE_WARNINGS: Partial<Record<Phase, string>> = {
  WRITING: 'アイスブレイクフェーズが終了します',
  VOTING: '記入フェーズが終了し、新しいカードを追加できなくなります',
  // ... 既存
};
```

**Step 3: テスト更新**

PhaseControl.test.tsx, PhaseTransitionDialog.test.tsx に ICEBREAK関連テストを追加。
既存テストの`createBoard` fixture に `enableIcebreaker: false` を追加。

**Step 4: テスト実行**

Run: `cd frontend && npm run test -- --run`
Expected: PASS

**Step 5: コミット**

```bash
git add frontend/src/components/PhaseControl.tsx frontend/src/components/PhaseTransitionDialog.tsx frontend/src/components/PhaseControl.test.tsx frontend/src/components/PhaseTransitionDialog.test.tsx
git commit -m "feat: add ICEBREAK phase to PhaseControl and PhaseTransitionDialog"
```

---

## Phase 5: フロントエンド アイスブレイカーUI

### Task 11: IcebreakerPanel コンポーネント + テスト

**Files:**
- Create: `frontend/src/components/IcebreakerPanel.tsx`
- Create: `frontend/src/components/IcebreakerPanel.test.tsx`

**Step 1: テスト作成（RED）**

IcebreakerPanel.test.tsx を作成。以下をテスト:
- 質問が表示される
- 回答一覧が表示される
- 自分の回答がない場合はフォームが表示される
- 送信ボタンクリックで onSubmit が呼ばれる
- ファシリテーターにのみシャッフル/カスタムボタンが表示される
- 質問が設定されていない場合はプレースホルダーが表示される

**Step 2: IcebreakerPanel.tsx を実装**

デザインドキュメントのUI構成に従い:
- 質問エリア（大きめに表示）
- ファシリテーター用: シャッフルボタン + カスタム質問入力
- 回答入力フォーム（自分の回答がまだない場合）
- 回答一覧（グリッド表示、参加者名+回答テキスト）

ICEBREAKフェーズ時にBoardView の代わりに全画面で表示する。

**Step 3: テスト実行**

Run: `cd frontend && npm run test -- --run`
Expected: PASS

**Step 4: コミット**

```bash
git add frontend/src/components/IcebreakerPanel.tsx frontend/src/components/IcebreakerPanel.test.tsx
git commit -m "feat: add IcebreakerPanel component"
```

---

### Task 12: BoardPage + HomePage 統合 + テスト

**Files:**
- Modify: `frontend/src/pages/BoardPage.tsx`
- Modify: `frontend/src/pages/HomePage.tsx`
- Modify: `frontend/src/pages/BoardPage.test.tsx`
- Modify: `frontend/src/pages/HomePage.test.tsx`

**Step 1: BoardPage.tsx にアイスブレイカー統合**

- ICEBREAKフェーズ時は `BoardView` の代わりに `IcebreakerPanel` を表示
- アイスブレイカーデータの取得ロジック追加

```typescript
// BoardPage内
useEffect(() => {
  if (board?.enableIcebreaker && board.phase === 'ICEBREAK') {
    api.getIcebreaker(board.slug).then(setIcebreakerData).catch(() => {});
  }
}, [board?.slug, board?.phase, board?.enableIcebreaker]);

// レンダリング
{board.phase === 'ICEBREAK' ? (
  <IcebreakerPanel ... />
) : (
  <BoardView ... />
)}
```

**Step 2: HomePage.tsx にアイスブレイカートグル追加**

既存のオプション（匿名モード、プライベート記述モード）の後にアイスブレイカートグルを追加:

```typescript
const [enableIcebreaker, setEnableIcebreaker] = useState(false);

// オプションセクションに追加
<div className="flex items-center justify-between py-2">
  <div className="flex items-center gap-2.5">
    <Snowflake size={15} className="text-gray-400 dark:text-slate-500" />
    <div>
      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">アイスブレイク</span>
      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">レトロ開始前にチームの場を和ませる</p>
    </div>
  </div>
  <!-- toggle switch (same pattern as existing) -->
</div>

// createBoard 呼び出しに追加
await api.createBoard(title.trim(), framework, maxVotes, isAnonymous, teamName.trim() || undefined, isPrivateWriting, enableIcebreaker);
```

注意: `Snowflake` アイコンは `lucide-react` からインポート。

**Step 3: 既存テスト更新**

BoardPage.test.tsx, HomePage.test.tsx の既存テストに `enableIcebreaker: false` を追加し、新規テストも追加。

**Step 4: テスト実行**

Run: `cd frontend && npm run test -- --run && npm run lint && npx tsc --noEmit`
Expected: PASS

**Step 5: コミット**

```bash
git add frontend/src/pages/ frontend/src/components/
git commit -m "feat: integrate icebreaker into BoardPage and HomePage"
```

---

## Phase 6: 残りのフロントエンドテスト修正 + E2E

### Task 13: 既存フロントエンドテストの修正

**影響箇所:** Phase型に`'ICEBREAK'`を追加したことで、Phase型を使う全コンポーネントテストに影響する可能性がある。Board interfaceに`enableIcebreaker`と`icebreakerQuestion`を追加したことで、fixture の`createBoard`が影響を受ける。

主な修正箇所:
- `frontend/src/test/fixtures.ts` — createBoard に新フィールド追加
- 各コンポーネントテスト — Phase が ICEBREAK でないことを前提にしているものを確認

**Step 1: fixtures.ts を更新**

```typescript
export function createBoard(overrides: Partial<Board> = {}): Board {
  return {
    // ... existing fields
    enableIcebreaker: false,
    icebreakerQuestion: null,
    ...overrides,
  };
}
```

**Step 2: 全テスト実行**

Run: `cd frontend && npm run test -- --run`
Expected: PASS（修正が必要なら逐次対応）

**Step 3: コミット**

```bash
git add frontend/src/
git commit -m "fix: update existing frontend tests for ICEBREAK phase compatibility"
```

---

### Task 14: E2E テスト更新 + 新規テスト

**Files:**
- Modify: `frontend/e2e/helpers.ts`
- Modify: 影響を受ける既存E2Eテスト
- Create: `frontend/e2e/icebreaker.spec.ts`（オプション）

**Step 1: helpers.ts の advanceToPhase を更新**

ICEBREAKフェーズから始まるボード用に、ICEBREAK → WRITING のステップを追加:

```typescript
const steps = [
    { key: 'WRITING', name: '次へ: 記入', label: '記入' },
    { key: 'VOTING', name: '次へ: 投票', label: '投票' },
    { key: 'DISCUSSION', name: '次へ: 議論', label: '議論' },
    { key: 'ACTION_ITEMS', name: '次へ: アクション', label: 'アクション' },
    { key: 'CLOSED', name: '次へ: 完了', label: '完了' },
];
```

注意: 既存のE2Eテストはアイスブレイカー無効のボードを作成するので、ICEBREAKステップは通常スキップされる。既存テストは変更不要のはず。

**Step 2: helpers.ts に createBoardWithIcebreaker ヘルパー追加（オプション）**

```typescript
export async function createBoardAndJoinWithIcebreaker(page: Page, nickname: string) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('アイスブレイクテスト');
    // アイスブレイクトグルをONにする
    await page.getByLabel('アイスブレイク').click();
    await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);
    await page.getByPlaceholder('ニックネームを入力').fill(nickname);
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();
}
```

**Step 3: E2E テスト実行**

Run: `cd frontend && npm run test:e2e -- --workers=1`
Expected: PASS

**Step 4: コミット**

```bash
git add frontend/e2e/
git commit -m "feat: update E2E helpers for ICEBREAK phase support"
```

---

## Phase 7: 最終検証

### Task 15: 全テスト実行 + カバレッジ確認

**Step 1: バックエンド全テスト**

Run: `cd backend && ./gradlew test`
Expected: PASS with 80%+ coverage

**Step 2: フロントエンド全テスト + Lint + 型チェック**

Run: `cd frontend && npm run test -- --run && npm run lint && npx tsc --noEmit`
Expected: PASS

**Step 3: フロントエンドカバレッジ確認**

Run: `cd frontend && npm run test:coverage`
Expected: 80%+ coverage

**Step 4: E2E テスト**

Run: `cd frontend && npm run test:e2e -- --workers=1`
Expected: PASS

**Step 5: 最終コミット（必要があれば）**

```bash
git add .
git commit -m "chore: final adjustments for icebreaker feature"
```

---

## ファイル変更サマリー

### 新規作成（バックエンド: ~15ファイル）
- `backend/src/main/resources/db/migration/V16__add_icebreaker.sql`
- `backend/src/main/kotlin/com/retra/icebreaker/domain/` (4ファイル)
- `backend/src/main/kotlin/com/retra/icebreaker/usecase/` (7ファイル)
- `backend/src/main/kotlin/com/retra/icebreaker/gateway/` (3ファイル)
- `backend/src/test/kotlin/com/retra/icebreaker/` (テストミラー)

### 新規作成（フロントエンド: ~2ファイル）
- `frontend/src/components/IcebreakerPanel.tsx`
- `frontend/src/components/IcebreakerPanel.test.tsx`

### 既存変更（バックエンド: ~5ファイル）
- `Phase.kt` — ICEBREAK追加
- `Board.kt` — enableIcebreaker, icebreakerQuestion追加
- `CreateBoardUseCase.kt` — enableIcebreakerパラメータ
- `BoardDtos.kt` — リクエスト/レスポンスに追加
- `BoardMapper.kt` — マッピング追加
- `DomainEventBroadcaster.kt` — イベントハンドラー追加

### 既存変更（フロントエンド: ~10ファイル）
- `types/index.ts` — Phase型 + 新型追加
- `api/client.ts` — API追加
- `store/boardStore.ts` — 状態追加
- `websocket/useWebSocket.ts` — 購読追加
- `PhaseControl.tsx` — ICEBREAK対応
- `PhaseTransitionDialog.tsx` — ICEBREAK対応
- `BoardPage.tsx` — IcebreakerPanel統合
- `HomePage.tsx` — トグル追加
- `e2e/helpers.ts` — フェーズステップ更新
- 各テストファイル
