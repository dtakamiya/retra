# Kudosウォール実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** チームメンバーへの感謝・称賛を送る「Kudosウォール」機能をスライドインパネルとして実装する

**Architecture:** 既存のモジュラーモノリスパターンに従い、`kudos/` モジュールを新設。REST API → UseCase → DomainEvent → STOMP broadcast のイベント駆動フローを踏襲。フロントエンドはReactionPicker/Listパターンを参考にスライドインパネルUIを構築。

**Tech Stack:** Spring Boot + Kotlin (backend), React + TypeScript + Zustand + TailwindCSS (frontend), SQLite + Flyway (DB), STOMP WebSocket (realtime)

---

## Task 1: データベースマイグレーション

**Files:**
- Create: `backend/src/main/resources/db/migration/V13__create_kudos.sql`

**Step 1: マイグレーションファイルを作成**

```sql
CREATE TABLE kudos (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    category TEXT NOT NULL,
    message TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES participants(id) ON DELETE CASCADE
);

CREATE INDEX idx_kudos_board_id ON kudos(board_id);
CREATE INDEX idx_kudos_receiver_id ON kudos(receiver_id);
```

**Step 2: バックエンドのビルドが通ることを確認**

Run: `cd backend && ./gradlew build -x test`
Expected: BUILD SUCCESSFUL

**Step 3: コミット**

```bash
git add backend/src/main/resources/db/migration/V13__create_kudos.sql
git commit -m "feat: Kudosテーブルのマイグレーション追加 (V13)"
```

---

## Task 2: バックエンド ドメイン層

**Files:**
- Create: `backend/src/main/kotlin/com/retra/kudos/domain/KudosCategory.kt`
- Create: `backend/src/main/kotlin/com/retra/kudos/domain/Kudos.kt`
- Create: `backend/src/main/kotlin/com/retra/kudos/domain/KudosEvent.kt`
- Create: `backend/src/main/kotlin/com/retra/kudos/domain/KudosRepository.kt`
- Test: `backend/src/test/kotlin/com/retra/kudos/domain/KudosTest.kt`
- Test: `backend/src/test/kotlin/com/retra/kudos/domain/KudosCategoryTest.kt`

**Step 1: KudosCategory enumを作成**

```kotlin
// backend/src/main/kotlin/com/retra/kudos/domain/KudosCategory.kt
package com.retra.kudos.domain

enum class KudosCategory {
    GREAT_JOB,
    THANK_YOU,
    INSPIRING,
    HELPFUL,
    CREATIVE,
    TEAM_PLAYER
}
```

**Step 2: KudosCategoryのテストを作成**

```kotlin
// backend/src/test/kotlin/com/retra/kudos/domain/KudosCategoryTest.kt
package com.retra.kudos.domain

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertAll
import kotlin.test.assertEquals

class KudosCategoryTest {

    @Test
    fun `全カテゴリが6種類存在する`() {
        assertEquals(6, KudosCategory.entries.size)
    }

    @Test
    fun `文字列からカテゴリに変換できる`() {
        assertAll(
            { assertEquals(KudosCategory.GREAT_JOB, KudosCategory.valueOf("GREAT_JOB")) },
            { assertEquals(KudosCategory.THANK_YOU, KudosCategory.valueOf("THANK_YOU")) },
            { assertEquals(KudosCategory.INSPIRING, KudosCategory.valueOf("INSPIRING")) },
            { assertEquals(KudosCategory.HELPFUL, KudosCategory.valueOf("HELPFUL")) },
            { assertEquals(KudosCategory.CREATIVE, KudosCategory.valueOf("CREATIVE")) },
            { assertEquals(KudosCategory.TEAM_PLAYER, KudosCategory.valueOf("TEAM_PLAYER")) }
        )
    }
}
```

**Step 3: Kudosエンティティを作成**

```kotlin
// backend/src/main/kotlin/com/retra/kudos/domain/Kudos.kt
package com.retra.kudos.domain

import com.retra.board.domain.Board
import com.retra.board.domain.Participant
import com.retra.shared.domain.BadRequestException
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "kudos")
open class Kudos(
    @Id
    open var id: String = "",

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    open var board: Board? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    open var sender: Participant? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id")
    open var receiver: Participant? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    open var category: KudosCategory = KudosCategory.GREAT_JOB,

    @Column(name = "message")
    open var message: String? = null,

    @Column(name = "created_at")
    open var createdAt: String = ""
) {
    companion object {
        private const val MAX_MESSAGE_LENGTH = 140

        fun create(
            board: Board,
            sender: Participant,
            receiver: Participant,
            category: KudosCategory,
            message: String?
        ): Kudos {
            if (sender.id == receiver.id) {
                throw BadRequestException("Cannot send kudos to yourself")
            }
            if (message != null && message.length > MAX_MESSAGE_LENGTH) {
                throw BadRequestException("Message must be $MAX_MESSAGE_LENGTH characters or less")
            }
            return Kudos(
                id = UUID.randomUUID().toString(),
                board = board,
                sender = sender,
                receiver = receiver,
                category = category,
                message = message?.trim()?.ifEmpty { null },
                createdAt = Instant.now().toString()
            )
        }
    }
}
```

**Step 4: Kudosエンティティのテストを作成**

```kotlin
// backend/src/test/kotlin/com/retra/kudos/domain/KudosTest.kt
package com.retra.kudos.domain

import com.retra.TestFixtures
import com.retra.shared.domain.BadRequestException
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class KudosTest {

    @Test
    fun `Kudos作成に成功する`() {
        val board = TestFixtures.board()
        val sender = TestFixtures.participant(id = "sender-1")
        val receiver = TestFixtures.participant(id = "receiver-1")

        val kudos = Kudos.create(board, sender, receiver, KudosCategory.GREAT_JOB, "素晴らしい仕事でした！")

        assertNotNull(kudos.id)
        assertEquals(board, kudos.board)
        assertEquals(sender, kudos.sender)
        assertEquals(receiver, kudos.receiver)
        assertEquals(KudosCategory.GREAT_JOB, kudos.category)
        assertEquals("素晴らしい仕事でした！", kudos.message)
        assertNotNull(kudos.createdAt)
    }

    @Test
    fun `メッセージなしでKudos作成に成功する`() {
        val board = TestFixtures.board()
        val sender = TestFixtures.participant(id = "sender-1")
        val receiver = TestFixtures.participant(id = "receiver-1")

        val kudos = Kudos.create(board, sender, receiver, KudosCategory.THANK_YOU, null)

        assertNull(kudos.message)
    }

    @Test
    fun `空文字メッセージはnullに変換される`() {
        val board = TestFixtures.board()
        val sender = TestFixtures.participant(id = "sender-1")
        val receiver = TestFixtures.participant(id = "receiver-1")

        val kudos = Kudos.create(board, sender, receiver, KudosCategory.HELPFUL, "  ")

        assertNull(kudos.message)
    }

    @Test
    fun `自分自身にKudosを送れない`() {
        val board = TestFixtures.board()
        val participant = TestFixtures.participant(id = "same-id")

        assertThrows<BadRequestException> {
            Kudos.create(board, participant, participant, KudosCategory.GREAT_JOB, null)
        }
    }

    @Test
    fun `140文字を超えるメッセージは拒否される`() {
        val board = TestFixtures.board()
        val sender = TestFixtures.participant(id = "sender-1")
        val receiver = TestFixtures.participant(id = "receiver-1")
        val longMessage = "a".repeat(141)

        assertThrows<BadRequestException> {
            Kudos.create(board, sender, receiver, KudosCategory.GREAT_JOB, longMessage)
        }
    }
}
```

**Step 5: テストを実行して成功を確認**

Run: `cd backend && ./gradlew test --tests "com.retra.kudos.domain.*"`
Expected: 全テストPASS

**Step 6: KudosEvent sealed classを作成**

```kotlin
// backend/src/main/kotlin/com/retra/kudos/domain/KudosEvent.kt
package com.retra.kudos.domain

import com.retra.shared.domain.DomainEvent

sealed class KudosEvent : DomainEvent() {

    data class KudosSent(
        val boardSlug: String,
        val kudosId: String,
        val senderId: String,
        val senderNickname: String,
        val receiverId: String,
        val receiverNickname: String,
        val category: KudosCategory,
        val message: String?,
        val createdAt: String
    ) : KudosEvent()

    data class KudosDeleted(
        val boardSlug: String,
        val kudosId: String
    ) : KudosEvent()
}
```

**Step 7: KudosRepositoryインターフェースを作成**

```kotlin
// backend/src/main/kotlin/com/retra/kudos/domain/KudosRepository.kt
package com.retra.kudos.domain

interface KudosRepository {
    fun save(kudos: Kudos): Kudos
    fun findById(id: String): Kudos?
    fun findByBoardId(boardId: String): List<Kudos>
    fun delete(kudos: Kudos)
}
```

**Step 8: コミット**

```bash
git add backend/src/main/kotlin/com/retra/kudos/domain/ backend/src/test/kotlin/com/retra/kudos/domain/
git commit -m "feat: Kudosドメイン層（エンティティ、イベント、リポジトリ）を追加"
```

---

## Task 3: バックエンド DTO・マッパー

**Files:**
- Create: `backend/src/main/kotlin/com/retra/kudos/usecase/KudosDtos.kt`
- Create: `backend/src/main/kotlin/com/retra/kudos/usecase/KudosMapper.kt`

**Step 1: DTOを作成**

```kotlin
// backend/src/main/kotlin/com/retra/kudos/usecase/KudosDtos.kt
package com.retra.kudos.usecase

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class SendKudosRequest(
    @field:NotBlank
    val senderId: String,
    @field:NotBlank
    val receiverId: String,
    @field:NotBlank
    val category: String,
    @field:Size(max = 140)
    val message: String? = null
)

data class KudosResponse(
    val id: String,
    val boardId: String,
    val senderId: String,
    val senderNickname: String,
    val receiverId: String,
    val receiverNickname: String,
    val category: String,
    val message: String?,
    val createdAt: String
)
```

**Step 2: マッパーを作成**

```kotlin
// backend/src/main/kotlin/com/retra/kudos/usecase/KudosMapper.kt
package com.retra.kudos.usecase

import com.retra.kudos.domain.Kudos

object KudosMapper {
    fun toResponse(kudos: Kudos): KudosResponse {
        return KudosResponse(
            id = kudos.id,
            boardId = kudos.board?.id ?: "",
            senderId = kudos.sender?.id ?: "",
            senderNickname = kudos.sender?.nickname ?: "",
            receiverId = kudos.receiver?.id ?: "",
            receiverNickname = kudos.receiver?.nickname ?: "",
            category = kudos.category.name,
            message = kudos.message,
            createdAt = kudos.createdAt
        )
    }
}
```

**Step 3: コミット**

```bash
git add backend/src/main/kotlin/com/retra/kudos/usecase/
git commit -m "feat: Kudos DTO・マッパーを追加"
```

---

## Task 4: バックエンド ユースケース（テスト→実装）

**Files:**
- Create: `backend/src/main/kotlin/com/retra/kudos/usecase/SendKudosUseCase.kt`
- Create: `backend/src/main/kotlin/com/retra/kudos/usecase/GetKudosUseCase.kt`
- Create: `backend/src/main/kotlin/com/retra/kudos/usecase/DeleteKudosUseCase.kt`
- Test: `backend/src/test/kotlin/com/retra/kudos/usecase/SendKudosUseCaseTest.kt`
- Test: `backend/src/test/kotlin/com/retra/kudos/usecase/GetKudosUseCaseTest.kt`
- Test: `backend/src/test/kotlin/com/retra/kudos/usecase/DeleteKudosUseCaseTest.kt`
- Modify: `backend/src/test/kotlin/com/retra/TestFixtures.kt` (kudosファクトリ追加)

**Step 1: TestFixturesにkudosファクトリを追加**

`TestFixtures.kt` の末尾に以下を追加:

```kotlin
fun kudos(
    id: String = UUID.randomUUID().toString(),
    board: Board? = null,
    sender: Participant? = null,
    receiver: Participant? = null,
    category: KudosCategory = KudosCategory.GREAT_JOB,
    message: String? = null,
    createdAt: String = Instant.now().toString()
): Kudos = Kudos(
    id = id,
    board = board,
    sender = sender,
    receiver = receiver,
    category = category,
    message = message,
    createdAt = createdAt
)
```

インポートも追加:
```kotlin
import com.retra.kudos.domain.Kudos
import com.retra.kudos.domain.KudosCategory
```

**Step 2: SendKudosUseCaseテストを作成**

```kotlin
// backend/src/test/kotlin/com/retra/kudos/usecase/SendKudosUseCaseTest.kt
package com.retra.kudos.usecase

import com.retra.TestFixtures
import com.retra.board.domain.BoardRepository
import com.retra.kudos.domain.KudosCategory
import com.retra.kudos.domain.KudosEvent
import com.retra.kudos.domain.KudosRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals

class SendKudosUseCaseTest {

    private val boardRepository = mockk<BoardRepository>()
    private val kudosRepository = mockk<KudosRepository>()
    private val eventPublisher = mockk<SpringDomainEventPublisher>(relaxed = true)

    private val useCase = SendKudosUseCase(boardRepository, kudosRepository, eventPublisher)

    @BeforeEach
    fun setUp() {
        clearAllMocks()
    }

    @Test
    fun `Kudos送信に成功する`() {
        val sender = TestFixtures.participant(id = "sender-1", nickname = "Alice")
        val receiver = TestFixtures.participant(id = "receiver-1", nickname = "Bob", isFacilitator = false)
        val board = TestFixtures.board(participants = mutableListOf(sender, receiver))

        every { boardRepository.findBySlug("test-slug") } returns board
        every { kudosRepository.save(any()) } answers { firstArg() }

        val request = SendKudosRequest(
            senderId = "sender-1",
            receiverId = "receiver-1",
            category = "GREAT_JOB",
            message = "素晴らしい！"
        )

        val response = useCase.execute("test-slug", request)

        assertEquals("sender-1", response.senderId)
        assertEquals("Alice", response.senderNickname)
        assertEquals("receiver-1", response.receiverId)
        assertEquals("Bob", response.receiverNickname)
        assertEquals("GREAT_JOB", response.category)
        assertEquals("素晴らしい！", response.message)

        verify { kudosRepository.save(any()) }
        verify { eventPublisher.publish(match<KudosEvent.KudosSent> {
            it.senderId == "sender-1" && it.receiverId == "receiver-1" && it.category == KudosCategory.GREAT_JOB
        }) }
    }

    @Test
    fun `ボードが存在しない場合NotFoundException`() {
        every { boardRepository.findBySlug("missing") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("missing", SendKudosRequest("s", "r", "GREAT_JOB"))
        }
    }

    @Test
    fun `送信者がボードの参加者でない場合NotFoundException`() {
        val participant = TestFixtures.participant(id = "p-1")
        val board = TestFixtures.board(participants = mutableListOf(participant))

        every { boardRepository.findBySlug("test-slug") } returns board

        assertThrows<NotFoundException> {
            useCase.execute("test-slug", SendKudosRequest("unknown", "p-1", "GREAT_JOB"))
        }
    }

    @Test
    fun `受信者がボードの参加者でない場合NotFoundException`() {
        val participant = TestFixtures.participant(id = "p-1")
        val board = TestFixtures.board(participants = mutableListOf(participant))

        every { boardRepository.findBySlug("test-slug") } returns board

        assertThrows<NotFoundException> {
            useCase.execute("test-slug", SendKudosRequest("p-1", "unknown", "GREAT_JOB"))
        }
    }

    @Test
    fun `自分自身にKudosを送れない`() {
        val participant = TestFixtures.participant(id = "p-1")
        val board = TestFixtures.board(participants = mutableListOf(participant))

        every { boardRepository.findBySlug("test-slug") } returns board

        assertThrows<BadRequestException> {
            useCase.execute("test-slug", SendKudosRequest("p-1", "p-1", "GREAT_JOB"))
        }
    }

    @Test
    fun `不正なカテゴリの場合BadRequestException`() {
        val sender = TestFixtures.participant(id = "sender-1")
        val receiver = TestFixtures.participant(id = "receiver-1", isFacilitator = false)
        val board = TestFixtures.board(participants = mutableListOf(sender, receiver))

        every { boardRepository.findBySlug("test-slug") } returns board

        assertThrows<BadRequestException> {
            useCase.execute("test-slug", SendKudosRequest("sender-1", "receiver-1", "INVALID"))
        }
    }

    @Test
    fun `全フェーズでKudos送信可能`() {
        com.retra.board.domain.Phase.entries.forEach { phase ->
            clearAllMocks()

            val sender = TestFixtures.participant(id = "sender-1", nickname = "Alice")
            val receiver = TestFixtures.participant(id = "receiver-1", nickname = "Bob", isFacilitator = false)
            val board = TestFixtures.board(phase = phase, participants = mutableListOf(sender, receiver))

            every { boardRepository.findBySlug("test-slug") } returns board
            every { kudosRepository.save(any()) } answers { firstArg() }

            val response = useCase.execute("test-slug", SendKudosRequest("sender-1", "receiver-1", "THANK_YOU"))
            assertEquals("THANK_YOU", response.category)
        }
    }
}
```

**Step 3: テスト実行（RED）**

Run: `cd backend && ./gradlew test --tests "com.retra.kudos.usecase.SendKudosUseCaseTest"`
Expected: FAIL（SendKudosUseCaseが未実装）

**Step 4: SendKudosUseCaseを実装**

```kotlin
// backend/src/main/kotlin/com/retra/kudos/usecase/SendKudosUseCase.kt
package com.retra.kudos.usecase

import com.retra.board.domain.BoardRepository
import com.retra.kudos.domain.Kudos
import com.retra.kudos.domain.KudosCategory
import com.retra.kudos.domain.KudosEvent
import com.retra.kudos.domain.KudosRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class SendKudosUseCase(
    private val boardRepository: BoardRepository,
    private val kudosRepository: KudosRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {
    @Transactional
    fun execute(slug: String, request: SendKudosRequest): KudosResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")

        val sender = board.participants.find { it.id == request.senderId }
            ?: throw NotFoundException("Sender not found")
        val receiver = board.participants.find { it.id == request.receiverId }
            ?: throw NotFoundException("Receiver not found")

        val category = try {
            KudosCategory.valueOf(request.category)
        } catch (e: IllegalArgumentException) {
            throw BadRequestException("Invalid kudos category: ${request.category}")
        }

        val kudos = Kudos.create(board, sender, receiver, category, request.message)
        kudosRepository.save(kudos)

        val response = KudosMapper.toResponse(kudos)

        eventPublisher.publish(
            KudosEvent.KudosSent(
                boardSlug = slug,
                kudosId = kudos.id,
                senderId = sender.id,
                senderNickname = sender.nickname,
                receiverId = receiver.id,
                receiverNickname = receiver.nickname,
                category = category,
                message = kudos.message,
                createdAt = kudos.createdAt
            )
        )

        return response
    }
}
```

**Step 5: テスト実行（GREEN）**

Run: `cd backend && ./gradlew test --tests "com.retra.kudos.usecase.SendKudosUseCaseTest"`
Expected: 全テストPASS

**Step 6: GetKudosUseCaseテストを作成**

```kotlin
// backend/src/test/kotlin/com/retra/kudos/usecase/GetKudosUseCaseTest.kt
package com.retra.kudos.usecase

import com.retra.TestFixtures
import com.retra.board.domain.BoardRepository
import com.retra.kudos.domain.KudosCategory
import com.retra.kudos.domain.KudosRepository
import com.retra.shared.domain.NotFoundException
import io.mockk.clearAllMocks
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals

class GetKudosUseCaseTest {

    private val boardRepository = mockk<BoardRepository>()
    private val kudosRepository = mockk<KudosRepository>()

    private val useCase = GetKudosUseCase(boardRepository, kudosRepository)

    @BeforeEach
    fun setUp() {
        clearAllMocks()
    }

    @Test
    fun `ボードのKudos一覧を取得できる`() {
        val sender = TestFixtures.participant(id = "sender-1", nickname = "Alice")
        val receiver = TestFixtures.participant(id = "receiver-1", nickname = "Bob", isFacilitator = false)
        val board = TestFixtures.board(participants = mutableListOf(sender, receiver))
        val kudos1 = TestFixtures.kudos(id = "k-1", board = board, sender = sender, receiver = receiver, category = KudosCategory.GREAT_JOB)
        val kudos2 = TestFixtures.kudos(id = "k-2", board = board, sender = receiver, receiver = sender, category = KudosCategory.THANK_YOU)

        every { boardRepository.findBySlug("test-slug") } returns board
        every { kudosRepository.findByBoardId(board.id) } returns listOf(kudos1, kudos2)

        val result = useCase.execute("test-slug")

        assertEquals(2, result.size)
        assertEquals("k-1", result[0].id)
        assertEquals("k-2", result[1].id)
    }

    @Test
    fun `ボードが存在しない場合NotFoundException`() {
        every { boardRepository.findBySlug("missing") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("missing")
        }
    }

    @Test
    fun `Kudosが0件の場合は空リストを返す`() {
        val board = TestFixtures.board()
        every { boardRepository.findBySlug("test-slug") } returns board
        every { kudosRepository.findByBoardId(board.id) } returns emptyList()

        val result = useCase.execute("test-slug")
        assertEquals(0, result.size)
    }
}
```

**Step 7: GetKudosUseCaseを実装**

```kotlin
// backend/src/main/kotlin/com/retra/kudos/usecase/GetKudosUseCase.kt
package com.retra.kudos.usecase

import com.retra.board.domain.BoardRepository
import com.retra.kudos.domain.KudosRepository
import com.retra.shared.domain.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GetKudosUseCase(
    private val boardRepository: BoardRepository,
    private val kudosRepository: KudosRepository
) {
    @Transactional(readOnly = true)
    fun execute(slug: String): List<KudosResponse> {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")

        return kudosRepository.findByBoardId(board.id).map { KudosMapper.toResponse(it) }
    }
}
```

**Step 8: テスト実行**

Run: `cd backend && ./gradlew test --tests "com.retra.kudos.usecase.GetKudosUseCaseTest"`
Expected: 全テストPASS

**Step 9: DeleteKudosUseCaseテストを作成**

```kotlin
// backend/src/test/kotlin/com/retra/kudos/usecase/DeleteKudosUseCaseTest.kt
package com.retra.kudos.usecase

import com.retra.TestFixtures
import com.retra.board.domain.BoardRepository
import com.retra.kudos.domain.KudosEvent
import com.retra.kudos.domain.KudosRepository
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class DeleteKudosUseCaseTest {

    private val boardRepository = mockk<BoardRepository>()
    private val kudosRepository = mockk<KudosRepository>()
    private val eventPublisher = mockk<SpringDomainEventPublisher>(relaxed = true)

    private val useCase = DeleteKudosUseCase(boardRepository, kudosRepository, eventPublisher)

    @BeforeEach
    fun setUp() {
        clearAllMocks()
    }

    @Test
    fun `自分が送ったKudosを削除できる`() {
        val sender = TestFixtures.participant(id = "sender-1")
        val receiver = TestFixtures.participant(id = "receiver-1", isFacilitator = false)
        val board = TestFixtures.board(participants = mutableListOf(sender, receiver))
        val kudos = TestFixtures.kudos(id = "k-1", board = board, sender = sender, receiver = receiver)

        every { boardRepository.findBySlug("test-slug") } returns board
        every { kudosRepository.findById("k-1") } returns kudos
        every { kudosRepository.delete(kudos) } just runs

        useCase.execute("test-slug", "k-1", "sender-1")

        verify { kudosRepository.delete(kudos) }
        verify { eventPublisher.publish(match<KudosEvent.KudosDeleted> { it.kudosId == "k-1" }) }
    }

    @Test
    fun `他人のKudosは削除できない`() {
        val sender = TestFixtures.participant(id = "sender-1")
        val receiver = TestFixtures.participant(id = "receiver-1", isFacilitator = false)
        val board = TestFixtures.board(participants = mutableListOf(sender, receiver))
        val kudos = TestFixtures.kudos(id = "k-1", board = board, sender = sender, receiver = receiver)

        every { boardRepository.findBySlug("test-slug") } returns board
        every { kudosRepository.findById("k-1") } returns kudos

        assertThrows<ForbiddenException> {
            useCase.execute("test-slug", "k-1", "receiver-1")
        }
    }

    @Test
    fun `ボードが存在しない場合NotFoundException`() {
        every { boardRepository.findBySlug("missing") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("missing", "k-1", "p-1")
        }
    }

    @Test
    fun `Kudosが存在しない場合NotFoundException`() {
        val board = TestFixtures.board()
        every { boardRepository.findBySlug("test-slug") } returns board
        every { kudosRepository.findById("missing") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("test-slug", "missing", "p-1")
        }
    }

    @Test
    fun `別ボードのKudosは削除できない`() {
        val otherBoard = TestFixtures.board(id = "other-board")
        val sender = TestFixtures.participant(id = "sender-1")
        val kudos = TestFixtures.kudos(id = "k-1", board = otherBoard, sender = sender)
        val board = TestFixtures.board(id = "my-board")

        every { boardRepository.findBySlug("test-slug") } returns board
        every { kudosRepository.findById("k-1") } returns kudos

        assertThrows<NotFoundException> {
            useCase.execute("test-slug", "k-1", "sender-1")
        }
    }
}
```

**Step 10: DeleteKudosUseCaseを実装**

```kotlin
// backend/src/main/kotlin/com/retra/kudos/usecase/DeleteKudosUseCase.kt
package com.retra.kudos.usecase

import com.retra.board.domain.BoardRepository
import com.retra.kudos.domain.KudosEvent
import com.retra.kudos.domain.KudosRepository
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class DeleteKudosUseCase(
    private val boardRepository: BoardRepository,
    private val kudosRepository: KudosRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {
    @Transactional
    fun execute(slug: String, kudosId: String, participantId: String) {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")

        val kudos = kudosRepository.findById(kudosId)
            ?: throw NotFoundException("Kudos not found")

        if (kudos.board?.id != board.id) {
            throw NotFoundException("Kudos not found")
        }

        if (kudos.sender?.id != participantId) {
            throw ForbiddenException("Only the sender can delete kudos")
        }

        kudosRepository.delete(kudos)

        eventPublisher.publish(
            KudosEvent.KudosDeleted(
                boardSlug = slug,
                kudosId = kudosId
            )
        )
    }
}
```

**Step 11: 全ユースケーステスト実行**

Run: `cd backend && ./gradlew test --tests "com.retra.kudos.usecase.*"`
Expected: 全テストPASS

**Step 12: コミット**

```bash
git add backend/src/main/kotlin/com/retra/kudos/usecase/ backend/src/test/kotlin/com/retra/kudos/usecase/ backend/src/test/kotlin/com/retra/TestFixtures.kt
git commit -m "feat: Kudosユースケース（送信・取得・削除）をTDDで実装"
```

---

## Task 5: バックエンド ゲートウェイ層（DB + コントローラー）

**Files:**
- Create: `backend/src/main/kotlin/com/retra/kudos/gateway/db/SpringDataKudosRepository.kt`
- Create: `backend/src/main/kotlin/com/retra/kudos/gateway/db/JpaKudosRepository.kt`
- Create: `backend/src/main/kotlin/com/retra/kudos/gateway/controller/KudosController.kt`
- Test: `backend/src/test/kotlin/com/retra/kudos/gateway/controller/KudosControllerTest.kt`

**Step 1: Spring Dataインターフェースを作成**

```kotlin
// backend/src/main/kotlin/com/retra/kudos/gateway/db/SpringDataKudosRepository.kt
package com.retra.kudos.gateway.db

import com.retra.kudos.domain.Kudos
import org.springframework.data.jpa.repository.JpaRepository

interface SpringDataKudosRepository : JpaRepository<Kudos, String> {
    fun findByBoardId(boardId: String): List<Kudos>
}
```

**Step 2: JPA実装を作成**

```kotlin
// backend/src/main/kotlin/com/retra/kudos/gateway/db/JpaKudosRepository.kt
package com.retra.kudos.gateway.db

import com.retra.kudos.domain.Kudos
import com.retra.kudos.domain.KudosRepository
import org.springframework.stereotype.Repository

@Repository
class JpaKudosRepository(
    private val springDataRepo: SpringDataKudosRepository
) : KudosRepository {
    override fun save(kudos: Kudos): Kudos = springDataRepo.save(kudos)
    override fun findById(id: String): Kudos? = springDataRepo.findById(id).orElse(null)
    override fun findByBoardId(boardId: String): List<Kudos> = springDataRepo.findByBoardId(boardId)
    override fun delete(kudos: Kudos) = springDataRepo.delete(kudos)
}
```

**Step 3: コントローラーテストを作成**

```kotlin
// backend/src/test/kotlin/com/retra/kudos/gateway/controller/KudosControllerTest.kt
package com.retra.kudos.gateway.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.retra.kudos.usecase.*
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.runs
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

@WebMvcTest(KudosController::class)
class KudosControllerTest {

    @TestConfiguration
    class Config {
        @Bean fun sendKudosUseCase() = mockk<SendKudosUseCase>()
        @Bean fun getKudosUseCase() = mockk<GetKudosUseCase>()
        @Bean fun deleteKudosUseCase() = mockk<DeleteKudosUseCase>()
    }

    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var sendKudosUseCase: SendKudosUseCase
    @Autowired lateinit var getKudosUseCase: GetKudosUseCase
    @Autowired lateinit var deleteKudosUseCase: DeleteKudosUseCase

    private val objectMapper = ObjectMapper()

    @Test
    fun `POST kudos returns 201`() {
        val response = KudosResponse(
            id = "k-1", boardId = "b-1",
            senderId = "s-1", senderNickname = "Alice",
            receiverId = "r-1", receiverNickname = "Bob",
            category = "GREAT_JOB", message = "Good work!",
            createdAt = "2024-01-01T00:00:00Z"
        )
        every { sendKudosUseCase.execute("test-slug", any()) } returns response

        val body = objectMapper.writeValueAsString(
            SendKudosRequest("s-1", "r-1", "GREAT_JOB", "Good work!")
        )

        mockMvc.perform(
            post("/api/v1/boards/test-slug/kudos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body)
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.id").value("k-1"))
            .andExpect(jsonPath("$.senderNickname").value("Alice"))
            .andExpect(jsonPath("$.receiverNickname").value("Bob"))
            .andExpect(jsonPath("$.category").value("GREAT_JOB"))
            .andExpect(jsonPath("$.message").value("Good work!"))
    }

    @Test
    fun `GET kudos returns 200`() {
        val kudosList = listOf(
            KudosResponse("k-1", "b-1", "s-1", "Alice", "r-1", "Bob", "GREAT_JOB", null, "2024-01-01T00:00:00Z")
        )
        every { getKudosUseCase.execute("test-slug") } returns kudosList

        mockMvc.perform(get("/api/v1/boards/test-slug/kudos"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].id").value("k-1"))
    }

    @Test
    fun `DELETE kudos returns 204`() {
        every { deleteKudosUseCase.execute("test-slug", "k-1", "p-1") } just runs

        mockMvc.perform(
            delete("/api/v1/boards/test-slug/kudos/k-1")
                .param("participantId", "p-1")
        )
            .andExpect(status().isNoContent)
    }
}
```

**Step 4: コントローラーを実装**

```kotlin
// backend/src/main/kotlin/com/retra/kudos/gateway/controller/KudosController.kt
package com.retra.kudos.gateway.controller

import com.retra.kudos.usecase.*
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/boards/{slug}/kudos")
class KudosController(
    private val sendKudosUseCase: SendKudosUseCase,
    private val getKudosUseCase: GetKudosUseCase,
    private val deleteKudosUseCase: DeleteKudosUseCase
) {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun sendKudos(
        @PathVariable slug: String,
        @Valid @RequestBody request: SendKudosRequest
    ): KudosResponse {
        return sendKudosUseCase.execute(slug, request)
    }

    @GetMapping
    fun getKudos(@PathVariable slug: String): List<KudosResponse> {
        return getKudosUseCase.execute(slug)
    }

    @DeleteMapping("/{kudosId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteKudos(
        @PathVariable slug: String,
        @PathVariable kudosId: String,
        @RequestParam participantId: String
    ) {
        deleteKudosUseCase.execute(slug, kudosId, participantId)
    }
}
```

**Step 5: テスト実行**

Run: `cd backend && ./gradlew test --tests "com.retra.kudos.gateway.controller.*"`
Expected: 全テストPASS

**Step 6: コミット**

```bash
git add backend/src/main/kotlin/com/retra/kudos/gateway/ backend/src/test/kotlin/com/retra/kudos/gateway/
git commit -m "feat: Kudosゲートウェイ層（DB実装・コントローラー）を追加"
```

---

## Task 6: バックエンド イベントブロードキャスター更新

**Files:**
- Modify: `backend/src/main/kotlin/com/retra/shared/gateway/websocket/DomainEventBroadcaster.kt`
- Test: `backend/src/test/kotlin/com/retra/shared/gateway/websocket/DomainEventBroadcasterTest.kt`

**Step 1: DomainEventBroadcasterにKudosイベントハンドラを追加**

`DomainEventBroadcaster.kt` の末尾（最後の `}` の前）に以下を追加:

```kotlin
@TransactionalEventListener(fallbackExecution = true)
fun handleKudosSent(event: KudosEvent.KudosSent) {
    messagingTemplate.convertAndSend(
        "/topic/board/${event.boardSlug}/kudos",
        WebSocketMessage(
            "KUDOS_SENT",
            mapOf(
                "id" to event.kudosId,
                "senderId" to event.senderId,
                "senderNickname" to event.senderNickname,
                "receiverId" to event.receiverId,
                "receiverNickname" to event.receiverNickname,
                "category" to event.category.name,
                "message" to (event.message ?: ""),
                "createdAt" to event.createdAt
            )
        )
    )
}

@TransactionalEventListener(fallbackExecution = true)
fun handleKudosDeleted(event: KudosEvent.KudosDeleted) {
    messagingTemplate.convertAndSend(
        "/topic/board/${event.boardSlug}/kudos",
        WebSocketMessage(
            "KUDOS_DELETED",
            mapOf(
                "id" to event.kudosId
            )
        )
    )
}
```

インポートを追加:
```kotlin
import com.retra.kudos.domain.KudosEvent
```

**Step 2: DomainEventBroadcasterTestにKudosテストを追加**

既存テストファイルの末尾に以下を追加:

```kotlin
@Test
fun `handleKudosSent sends KUDOS_SENT`() {
    val event = KudosEvent.KudosSent(
        boardSlug = "test-slug",
        kudosId = "k-1",
        senderId = "s-1",
        senderNickname = "Alice",
        receiverId = "r-1",
        receiverNickname = "Bob",
        category = KudosCategory.GREAT_JOB,
        message = "Great work!",
        createdAt = "2024-01-01T00:00:00Z"
    )

    broadcaster.handleKudosSent(event)

    verify {
        messagingTemplate.convertAndSend(
            "/topic/board/test-slug/kudos",
            match<WebSocketMessage> { it.type == "KUDOS_SENT" }
        )
    }
}

@Test
fun `handleKudosDeleted sends KUDOS_DELETED`() {
    val event = KudosEvent.KudosDeleted(
        boardSlug = "test-slug",
        kudosId = "k-1"
    )

    broadcaster.handleKudosDeleted(event)

    verify {
        messagingTemplate.convertAndSend(
            "/topic/board/test-slug/kudos",
            match<WebSocketMessage> { it.type == "KUDOS_DELETED" }
        )
    }
}
```

インポートも追加:
```kotlin
import com.retra.kudos.domain.KudosCategory
import com.retra.kudos.domain.KudosEvent
```

**Step 3: 全バックエンドテスト実行**

Run: `cd backend && ./gradlew test`
Expected: 全テストPASS、カバレッジ80%以上

**Step 4: コミット**

```bash
git add backend/src/main/kotlin/com/retra/shared/gateway/websocket/DomainEventBroadcaster.kt backend/src/test/kotlin/com/retra/shared/gateway/websocket/DomainEventBroadcasterTest.kt
git commit -m "feat: KudosイベントのWebSocketブロードキャストを追加"
```

---

## Task 7: フロントエンド 型定義・APIクライアント

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/api/client.ts`
- Test: `frontend/src/api/client.test.ts` (既存テストに追加)

**Step 1: types/index.tsにKudos型を追加**

ファイル末尾に以下を追加:

```typescript
export type KudosCategory = 'GREAT_JOB' | 'THANK_YOU' | 'INSPIRING' | 'HELPFUL' | 'CREATIVE' | 'TEAM_PLAYER';

export interface Kudos {
  id: string;
  boardId: string;
  senderId: string;
  senderNickname: string;
  receiverId: string;
  receiverNickname: string;
  category: KudosCategory;
  message?: string;
  createdAt: string;
}

export interface KudosDeletedPayload {
  id: string;
}
```

**Step 2: api/client.tsにKudos APIメソッドを追加**

apiオブジェクト内の末尾に以下を追加:

```typescript
  // Kudos
  getKudos(slug: string): Promise<Kudos[]> {
    return request(`/boards/${slug}/kudos`);
  },

  sendKudos(slug: string, senderId: string, receiverId: string, category: string, message?: string): Promise<Kudos> {
    return request(`/boards/${slug}/kudos`, {
      method: 'POST',
      body: JSON.stringify({ senderId, receiverId, category, message }),
    });
  },

  deleteKudos(slug: string, kudosId: string, participantId: string): Promise<void> {
    const params = new URLSearchParams({ participantId });
    return request(`/boards/${slug}/kudos/${kudosId}?${params}`, {
      method: 'DELETE',
    });
  },
```

インポートに `Kudos` を追加。

**Step 3: TypeScriptビルド確認**

Run: `cd frontend && npx tsc --noEmit`
Expected: エラーなし

**Step 4: コミット**

```bash
git add frontend/src/types/index.ts frontend/src/api/client.ts
git commit -m "feat: Kudos型定義とAPIクライアントメソッドを追加"
```

---

## Task 8: フロントエンド ストア・WebSocket

**Files:**
- Modify: `frontend/src/store/boardStore.ts`
- Modify: `frontend/src/websocket/useWebSocket.ts`
- Modify: `frontend/src/test/fixtures.ts`

**Step 1: boardStore.tsにKudos状態とハンドラを追加**

BoardState interfaceに追加:
```typescript
kudos: Kudos[];
setKudos: (kudos: Kudos[]) => void;
handleKudosSent: (kudos: Kudos) => void;
handleKudosDeleted: (payload: KudosDeletedPayload) => void;
```

初期状態に追加:
```typescript
kudos: [],
```

アクションを追加:
```typescript
setKudos: (kudos) => set({ kudos }),

handleKudosSent: (kudos) =>
  set((state) => ({ kudos: [kudos, ...state.kudos] })),

handleKudosDeleted: (payload) =>
  set((state) => ({
    kudos: state.kudos.filter((k) => k.id !== payload.id),
  })),
```

**Step 2: useWebSocket.tsにKudosサブスクリプションを追加**

useBoardStoreのデストラクチャリングに `handleKudosSent, handleKudosDeleted` を追加。

onConnectのサブスクリプション群に以下を追加:

```typescript
client.subscribe(`/topic/board/${slug}/kudos`, (message) => {
  const data: WebSocketMessage = JSON.parse(message.body);
  switch (data.type) {
    case 'KUDOS_SENT':
      handleKudosSent(data.payload as Kudos);
      break;
    case 'KUDOS_DELETED':
      handleKudosDeleted(data.payload as KudosDeletedPayload);
      break;
  }
});
```

useCallbackの依存配列に `handleKudosSent, handleKudosDeleted` を追加。

**Step 3: fixtures.tsにcreateKudosファクトリを追加**

```typescript
export function createKudos(overrides: Partial<Kudos> = {}): Kudos {
  return {
    id: 'kudos-1',
    boardId: 'board-1',
    senderId: 'p-1',
    senderNickname: 'TestUser',
    receiverId: 'p-2',
    receiverNickname: 'OtherUser',
    category: 'GREAT_JOB',
    message: null,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}
```

**Step 4: TypeScriptビルド確認**

Run: `cd frontend && npx tsc --noEmit`
Expected: エラーなし

**Step 5: コミット**

```bash
git add frontend/src/store/boardStore.ts frontend/src/websocket/useWebSocket.ts frontend/src/test/fixtures.ts
git commit -m "feat: Kudosストア状態・WebSocketサブスクリプションを追加"
```

---

## Task 9: フロントエンド KudosSendFormコンポーネント

**Files:**
- Create: `frontend/src/components/KudosSendForm.tsx`
- Test: `frontend/src/components/KudosSendForm.test.tsx`

**Step 1: テストを先に作成**

```tsx
// frontend/src/components/KudosSendForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { KudosSendForm } from './KudosSendForm';
import { createParticipant } from '../test/fixtures';

describe('KudosSendForm', () => {
  const participants = [
    createParticipant({ id: 'p-1', nickname: 'Alice' }),
    createParticipant({ id: 'p-2', nickname: 'Bob', isFacilitator: false }),
    createParticipant({ id: 'p-3', nickname: 'Charlie', isFacilitator: false }),
  ];
  const currentParticipantId = 'p-1';
  const onSend = vi.fn();
  const onCancel = vi.fn();

  it('受信者セレクト・カテゴリボタン・送信ボタンが表示される', () => {
    render(
      <KudosSendForm
        participants={participants}
        currentParticipantId={currentParticipantId}
        onSend={onSend}
        onCancel={onCancel}
      />
    );

    expect(screen.getByLabelText('送信先')).toBeInTheDocument();
    expect(screen.getByText('🌟')).toBeInTheDocument();
    expect(screen.getByText('🙏')).toBeInTheDocument();
    expect(screen.getByText('💡')).toBeInTheDocument();
    expect(screen.getByText('🤝')).toBeInTheDocument();
    expect(screen.getByText('🎨')).toBeInTheDocument();
    expect(screen.getByText('💪')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '送信' })).toBeInTheDocument();
  });

  it('自分自身はドロップダウンに表示されない', () => {
    render(
      <KudosSendForm
        participants={participants}
        currentParticipantId={currentParticipantId}
        onSend={onSend}
        onCancel={onCancel}
      />
    );

    const select = screen.getByLabelText('送信先');
    expect(select).not.toHaveTextContent('Alice');
  });

  it('受信者とカテゴリを選んで送信できる', async () => {
    const user = userEvent.setup();
    render(
      <KudosSendForm
        participants={participants}
        currentParticipantId={currentParticipantId}
        onSend={onSend}
        onCancel={onCancel}
      />
    );

    await user.selectOptions(screen.getByLabelText('送信先'), 'p-2');
    await user.click(screen.getByText('🙏'));
    await user.click(screen.getByRole('button', { name: '送信' }));

    expect(onSend).toHaveBeenCalledWith('p-2', 'THANK_YOU', undefined);
  });

  it('メッセージ付きで送信できる', async () => {
    const user = userEvent.setup();
    render(
      <KudosSendForm
        participants={participants}
        currentParticipantId={currentParticipantId}
        onSend={onSend}
        onCancel={onCancel}
      />
    );

    await user.selectOptions(screen.getByLabelText('送信先'), 'p-3');
    await user.click(screen.getByText('💡'));
    await user.type(screen.getByPlaceholderText('メッセージ（任意）'), 'ありがとう！');
    await user.click(screen.getByRole('button', { name: '送信' }));

    expect(onSend).toHaveBeenCalledWith('p-3', 'INSPIRING', 'ありがとう！');
  });

  it('受信者未選択の場合は送信ボタンが無効', () => {
    render(
      <KudosSendForm
        participants={participants}
        currentParticipantId={currentParticipantId}
        onSend={onSend}
        onCancel={onCancel}
      />
    );

    expect(screen.getByRole('button', { name: '送信' })).toBeDisabled();
  });

  it('キャンセルボタンでonCancelが呼ばれる', async () => {
    const user = userEvent.setup();
    render(
      <KudosSendForm
        participants={participants}
        currentParticipantId={currentParticipantId}
        onSend={onSend}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
```

**Step 2: テスト実行（RED）**

Run: `cd frontend && npx vitest run src/components/KudosSendForm.test.tsx`
Expected: FAIL

**Step 3: KudosSendFormを実装**

```tsx
// frontend/src/components/KudosSendForm.tsx
import { useState } from 'react';
import type { Participant, KudosCategory } from '../types';

const KUDOS_CATEGORIES: { value: KudosCategory; icon: string; label: string }[] = [
  { value: 'GREAT_JOB', icon: '🌟', label: 'Great Job!' },
  { value: 'THANK_YOU', icon: '🙏', label: 'Thank You' },
  { value: 'INSPIRING', icon: '💡', label: 'Inspiring' },
  { value: 'HELPFUL', icon: '🤝', label: 'Helpful' },
  { value: 'CREATIVE', icon: '🎨', label: 'Creative' },
  { value: 'TEAM_PLAYER', icon: '💪', label: 'Team Player' },
];

interface Props {
  participants: Participant[];
  currentParticipantId: string;
  onSend: (receiverId: string, category: KudosCategory, message?: string) => void;
  onCancel: () => void;
}

export function KudosSendForm({ participants, currentParticipantId, onSend, onCancel }: Props) {
  const [receiverId, setReceiverId] = useState('');
  const [category, setCategory] = useState<KudosCategory>('GREAT_JOB');
  const [message, setMessage] = useState('');

  const otherParticipants = participants.filter((p) => p.id !== currentParticipantId);

  const handleSubmit = () => {
    if (!receiverId) return;
    onSend(receiverId, category, message.trim() || undefined);
  };

  return (
    <div className="space-y-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
      <div>
        <label htmlFor="kudos-receiver" className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
          送信先
        </label>
        <select
          id="kudos-receiver"
          aria-label="送信先"
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
        >
          <option value="">選択してください</option>
          {otherParticipants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nickname}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">カテゴリ</label>
        <div className="grid grid-cols-3 gap-1.5">
          {KUDOS_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border text-xs transition-colors ${
                category === cat.value
                  ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <textarea
          placeholder="メッセージ（任意）"
          maxLength={140}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 resize-none"
          rows={2}
        />
        {message.length > 0 && (
          <p className="text-right text-xs text-gray-400 dark:text-slate-500">{message.length}/140</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!receiverId}
          className="flex-1 px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          送信
        </button>
      </div>
    </div>
  );
}
```

**Step 4: テスト実行（GREEN）**

Run: `cd frontend && npx vitest run src/components/KudosSendForm.test.tsx`
Expected: 全テストPASS

**Step 5: コミット**

```bash
git add frontend/src/components/KudosSendForm.tsx frontend/src/components/KudosSendForm.test.tsx
git commit -m "feat: KudosSendFormコンポーネントをTDDで実装"
```

---

## Task 10: フロントエンド KudosCard・KudosPanelコンポーネント

**Files:**
- Create: `frontend/src/components/KudosCard.tsx`
- Create: `frontend/src/components/KudosCard.test.tsx`
- Create: `frontend/src/components/KudosPanel.tsx`
- Create: `frontend/src/components/KudosPanel.test.tsx`

**Step 1: KudosCardテストを作成**

```tsx
// frontend/src/components/KudosCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { KudosCard } from './KudosCard';
import { createKudos } from '../test/fixtures';

describe('KudosCard', () => {
  it('Kudosの情報が表示される', () => {
    const kudos = createKudos({
      senderNickname: 'Alice',
      receiverNickname: 'Bob',
      category: 'GREAT_JOB',
      message: '素晴らしい仕事！',
    });

    render(<KudosCard kudos={kudos} currentParticipantId="other" isAnonymous={false} onDelete={vi.fn()} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('🌟')).toBeInTheDocument();
    expect(screen.getByText('素晴らしい仕事！')).toBeInTheDocument();
  });

  it('自分が送ったKudosには削除ボタンが表示される', () => {
    const kudos = createKudos({ senderId: 'p-1' });

    render(<KudosCard kudos={kudos} currentParticipantId="p-1" isAnonymous={false} onDelete={vi.fn()} />);

    expect(screen.getByLabelText('Kudosを削除')).toBeInTheDocument();
  });

  it('他人のKudosには削除ボタンが表示されない', () => {
    const kudos = createKudos({ senderId: 'p-1' });

    render(<KudosCard kudos={kudos} currentParticipantId="p-2" isAnonymous={false} onDelete={vi.fn()} />);

    expect(screen.queryByLabelText('Kudosを削除')).not.toBeInTheDocument();
  });

  it('削除ボタンクリックでonDeleteが呼ばれる', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const kudos = createKudos({ id: 'k-1', senderId: 'p-1' });

    render(<KudosCard kudos={kudos} currentParticipantId="p-1" isAnonymous={false} onDelete={onDelete} />);

    await user.click(screen.getByLabelText('Kudosを削除'));
    expect(onDelete).toHaveBeenCalledWith('k-1');
  });

  it('匿名ボードでは送信者が「誰かさん」と表示される', () => {
    const kudos = createKudos({
      senderId: 'other',
      senderNickname: 'Alice',
      receiverNickname: 'Bob',
    });

    render(<KudosCard kudos={kudos} currentParticipantId="p-1" isAnonymous={true} onDelete={vi.fn()} />);

    expect(screen.getByText('誰かさん')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('匿名ボードでも自分が送ったKudosは名前が表示される', () => {
    const kudos = createKudos({
      senderId: 'p-1',
      senderNickname: 'Alice',
    });

    render(<KudosCard kudos={kudos} currentParticipantId="p-1" isAnonymous={true} onDelete={vi.fn()} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
```

**Step 2: KudosCardを実装**

```tsx
// frontend/src/components/KudosCard.tsx
import { X } from 'lucide-react';
import type { Kudos, KudosCategory } from '../types';

const CATEGORY_INFO: Record<KudosCategory, { icon: string; label: string }> = {
  GREAT_JOB: { icon: '🌟', label: 'Great Job!' },
  THANK_YOU: { icon: '🙏', label: 'Thank You' },
  INSPIRING: { icon: '💡', label: 'Inspiring' },
  HELPFUL: { icon: '🤝', label: 'Helpful' },
  CREATIVE: { icon: '🎨', label: 'Creative' },
  TEAM_PLAYER: { icon: '💪', label: 'Team Player' },
};

interface Props {
  kudos: Kudos;
  currentParticipantId: string;
  isAnonymous: boolean;
  onDelete: (kudosId: string) => void;
}

export function KudosCard({ kudos, currentParticipantId, isAnonymous, onDelete }: Props) {
  const isMine = kudos.senderId === currentParticipantId;
  const senderName = isAnonymous && !isMine ? '誰かさん' : kudos.senderNickname;
  const info = CATEGORY_INFO[kudos.category];

  return (
    <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl flex-shrink-0">{info.icon}</span>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              <span className="font-medium text-gray-700 dark:text-slate-200">{senderName}</span>
              {' → '}
              <span className="font-medium text-gray-700 dark:text-slate-200">{kudos.receiverNickname}</span>
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{info.label}</p>
          </div>
        </div>
        {isMine && (
          <button
            type="button"
            aria-label="Kudosを削除"
            onClick={() => onDelete(kudos.id)}
            className="p-0.5 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {kudos.message && (
        <p className="mt-1.5 text-sm text-gray-600 dark:text-slate-300">{kudos.message}</p>
      )}
    </div>
  );
}
```

**Step 3: テスト実行**

Run: `cd frontend && npx vitest run src/components/KudosCard.test.tsx`
Expected: 全テストPASS

**Step 4: KudosPanelテストを作成**

```tsx
// frontend/src/components/KudosPanel.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { KudosPanel } from './KudosPanel';
import { createKudos, createParticipant } from '../test/fixtures';

describe('KudosPanel', () => {
  const defaultProps = {
    kudos: [createKudos({ id: 'k-1', senderNickname: 'Alice', receiverNickname: 'Bob' })],
    participants: [
      createParticipant({ id: 'p-1', nickname: 'Alice' }),
      createParticipant({ id: 'p-2', nickname: 'Bob', isFacilitator: false }),
    ],
    currentParticipantId: 'p-1',
    isAnonymous: false,
    onSend: vi.fn(),
    onDelete: vi.fn(),
    onClose: vi.fn(),
  };

  it('タイトルとKudos一覧が表示される', () => {
    render(<KudosPanel {...defaultProps} />);

    expect(screen.getByText('Kudos')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('Kudosを送るボタンでフォームが表示される', async () => {
    const user = userEvent.setup();
    render(<KudosPanel {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Kudosを送る' }));
    expect(screen.getByLabelText('送信先')).toBeInTheDocument();
  });

  it('閉じるボタンでonCloseが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<KudosPanel {...defaultProps} />);

    await user.click(screen.getByLabelText('パネルを閉じる'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('Kudosが0件の場合は空メッセージが表示される', () => {
    render(<KudosPanel {...defaultProps} kudos={[]} />);

    expect(screen.getByText('まだKudosがありません')).toBeInTheDocument();
  });
});
```

**Step 5: KudosPanelを実装**

```tsx
// frontend/src/components/KudosPanel.tsx
import { useState } from 'react';
import { X, Heart } from 'lucide-react';
import type { Kudos, KudosCategory, Participant } from '../types';
import { KudosCard } from './KudosCard';
import { KudosSendForm } from './KudosSendForm';

interface Props {
  kudos: Kudos[];
  participants: Participant[];
  currentParticipantId: string;
  isAnonymous: boolean;
  onSend: (receiverId: string, category: KudosCategory, message?: string) => void;
  onDelete: (kudosId: string) => void;
  onClose: () => void;
}

export function KudosPanel({ kudos, participants, currentParticipantId, isAnonymous, onSend, onDelete, onClose }: Props) {
  const [showForm, setShowForm] = useState(false);

  const handleSend = (receiverId: string, category: KudosCategory, message?: string) => {
    onSend(receiverId, category, message);
    setShowForm(false);
  };

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-l border-gray-200 dark:border-slate-700 shadow-xl z-40 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-amber-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Kudos</h2>
          {kudos.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
              {kudos.length}
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label="パネルを閉じる"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-4 py-3">
        {showForm ? (
          <KudosSendForm
            participants={participants}
            currentParticipantId={currentParticipantId}
            onSend={handleSend}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full px-3 py-2 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Kudosを送る
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {kudos.length === 0 ? (
          <p className="text-center text-xs text-gray-400 dark:text-slate-500 py-8">
            まだKudosがありません
          </p>
        ) : (
          kudos.map((k) => (
            <KudosCard
              key={k.id}
              kudos={k}
              currentParticipantId={currentParticipantId}
              isAnonymous={isAnonymous}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 6: テスト実行**

Run: `cd frontend && npx vitest run src/components/KudosCard.test.tsx src/components/KudosPanel.test.tsx`
Expected: 全テストPASS

**Step 7: コミット**

```bash
git add frontend/src/components/KudosCard.tsx frontend/src/components/KudosCard.test.tsx frontend/src/components/KudosPanel.tsx frontend/src/components/KudosPanel.test.tsx
git commit -m "feat: KudosCard・KudosPanelコンポーネントをTDDで実装"
```

---

## Task 11: フロントエンド BoardHeaderへのKudosボタン統合

**Files:**
- Modify: `frontend/src/components/BoardHeader.tsx`
- Modify: `frontend/src/components/BoardHeader.test.tsx`
- Modify: `frontend/src/pages/BoardPage.tsx`

**Step 1: BoardHeaderにKudosボタンを追加**

BoardHeaderのボタン群（ThemeToggleとコピーリンクボタンの間あたり）に以下を追加:

```tsx
<button
  type="button"
  onClick={onKudosToggle}
  aria-label="Kudos"
  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
    isKudosOpen
      ? 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
      : 'border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:border-slate-500'
  }`}
>
  <Heart size={14} />
  Kudos
  {kudosCount > 0 && (
    <span className="px-1 py-0.5 text-[10px] bg-amber-500 text-white rounded-full min-w-[18px] text-center">
      {kudosCount}
    </span>
  )}
</button>
```

Props追加:
```typescript
interface BoardHeaderProps {
  // ... existing props
  isKudosOpen: boolean;
  kudosCount: number;
  onKudosToggle: () => void;
}
```

**Step 2: BoardPageにKudosパネルのステート管理を追加**

BoardPageに以下を追加:
- `isKudosOpen` state
- ボード読み込み時に `api.getKudos(slug)` を呼び出し `store.setKudos()` で初期化
- KudosPanelコンポーネントの配置
- `sendKudos` / `deleteKudos` ハンドラ

**Step 3: BoardHeaderテストを更新**

既存のBoardHeaderテストにKudosボタンのテストを追加:

```tsx
it('Kudosボタンが表示される', () => {
  render(<BoardHeader isKudosOpen={false} kudosCount={0} onKudosToggle={vi.fn()} />);
  expect(screen.getByLabelText('Kudos')).toBeInTheDocument();
});

it('Kudosカウントが表示される', () => {
  render(<BoardHeader isKudosOpen={false} kudosCount={3} onKudosToggle={vi.fn()} />);
  expect(screen.getByText('3')).toBeInTheDocument();
});
```

**Step 4: テスト実行**

Run: `cd frontend && npx vitest run src/components/BoardHeader.test.tsx`
Expected: 全テストPASS

**Step 5: TypeScriptビルド・lint確認**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: エラーなし

**Step 6: コミット**

```bash
git add frontend/src/components/BoardHeader.tsx frontend/src/components/BoardHeader.test.tsx frontend/src/pages/BoardPage.tsx
git commit -m "feat: BoardHeaderにKudosボタンを統合、BoardPageにパネル管理を追加"
```

---

## Task 12: 全テスト実行・カバレッジ確認

**Files:** なし（テスト実行のみ）

**Step 1: バックエンド全テスト**

Run: `cd backend && ./gradlew test`
Expected: 全テストPASS、カバレッジ80%以上

**Step 2: フロントエンド全テスト**

Run: `cd frontend && npm run test`
Expected: 全テストPASS

**Step 3: フロントエンドカバレッジ**

Run: `cd frontend && npm run test:coverage`
Expected: カバレッジ80%以上

**Step 4: TypeScript・lint確認**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: エラーなし

---

## Task 13: E2Eテスト

**Files:**
- Create: `frontend/e2e/kudos-operations.spec.ts`

**Step 1: E2Eテストを作成**

```typescript
// frontend/e2e/kudos-operations.spec.ts
import { test, expect } from '@playwright/test';

// ヘルパー: ボード作成＆参加
async function createBoardAndJoin(page, nickname = 'Alice') {
  await page.goto('/');
  await page.getByRole('button', { name: 'ボードを作成' }).click();
  await page.getByLabel('タイトル').fill('Kudos Test Retro');
  await page.getByRole('button', { name: '作成' }).click();
  await page.getByLabel('ニックネーム').fill(nickname);
  await page.getByRole('button', { name: '参加' }).click();
  await expect(page.getByText('Kudos Test Retro')).toBeVisible({ timeout: 10000 });
}

test.describe('Kudos操作', () => {
  test('Kudosパネルを開閉できる', async ({ page }) => {
    await createBoardAndJoin(page);

    await page.getByLabel('Kudos').click();
    await expect(page.getByText('まだKudosがありません')).toBeVisible();

    await page.getByLabel('パネルを閉じる').click();
    await expect(page.getByText('まだKudosがありません')).not.toBeVisible();
  });

  test('Kudosを送信できる', async ({ browser }) => {
    // 2人の参加者が必要
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // ファシリテーターがボード作成
    await createBoardAndJoin(page1, 'Alice');
    const url = page1.url();

    // メンバーが参加
    await page2.goto(url);
    await page2.getByLabel('ニックネーム').fill('Bob');
    await page2.getByRole('button', { name: '参加' }).click();
    await expect(page2.getByText('Kudos Test Retro')).toBeVisible({ timeout: 10000 });

    // AliceからBobにKudos送信
    await page1.getByLabel('Kudos').click();
    await page1.getByRole('button', { name: 'Kudosを送る' }).click();
    await page1.getByLabel('送信先').selectOption({ label: 'Bob' });
    await page1.getByText('🙏').click();
    await page1.getByPlaceholder('メッセージ（任意）').fill('いつもありがとう！');
    await page1.getByRole('button', { name: '送信' }).click();

    // Alice側で表示確認
    await expect(page1.getByText('いつもありがとう！')).toBeVisible({ timeout: 5000 });

    // Bob側でもリアルタイム表示確認
    await page2.getByLabel('Kudos').click();
    await expect(page2.getByText('いつもありがとう！')).toBeVisible({ timeout: 10000 });

    await context1.close();
    await context2.close();
  });

  test('自分が送ったKudosを削除できる', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await createBoardAndJoin(page1, 'Alice');
    const url = page1.url();

    await page2.goto(url);
    await page2.getByLabel('ニックネーム').fill('Bob');
    await page2.getByRole('button', { name: '参加' }).click();
    await expect(page2.getByText('Kudos Test Retro')).toBeVisible({ timeout: 10000 });

    // AliceがKudos送信
    await page1.getByLabel('Kudos').click();
    await page1.getByRole('button', { name: 'Kudosを送る' }).click();
    await page1.getByLabel('送信先').selectOption({ label: 'Bob' });
    await page1.getByRole('button', { name: '送信' }).click();
    await expect(page1.getByLabel('Kudosを削除')).toBeVisible({ timeout: 5000 });

    // Alice側で削除
    await page1.getByLabel('Kudosを削除').click();
    await expect(page1.getByText('まだKudosがありません')).toBeVisible({ timeout: 5000 });

    await context1.close();
    await context2.close();
  });
});
```

**Step 2: E2Eテスト実行**

Run: `cd frontend && npm run test:e2e -- --workers=1 e2e/kudos-operations.spec.ts`
Expected: 全テストPASS

**Step 3: コミット**

```bash
git add frontend/e2e/kudos-operations.spec.ts
git commit -m "test(e2e): Kudos操作のE2Eテストを追加"
```

---

## Task 14: CLAUDE.md・型定義ドキュメント更新

**Files:**
- Modify: `CLAUDE.md` (APIルート、WebSocketイベント、コンポーネント一覧にKudos追加)

**Step 1: CLAUDE.mdを更新**

以下のセクションにKudos関連の情報を追加:
- **Backend Structure**: `kudos/` モジュールの説明
- **Frontend Structure**: KudosButton, KudosPanel, KudosCard, KudosSendForm
- **API Routes**: 3つのKudosエンドポイント
- **WebSocket Events**: `/topic/board/{slug}/kudos` トピック
- **Database Migration**: V13の説明
- **E2E Tests**: kudos-operations

**Step 2: コミット**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.mdにKudos機能のドキュメントを追加"
```

---

## 実行順序の依存関係

```
Task 1 (DB Migration)
  ↓
Task 2 (Domain)
  ↓
Task 3 (DTOs)
  ↓
Task 4 (Use Cases) ← TestFixtures更新含む
  ↓
Task 5 (Gateway: DB + Controller)
  ↓
Task 6 (Event Broadcaster)
  ↓
Task 7 (Frontend Types + API) ← バックエンド完成後
  ↓
Task 8 (Store + WebSocket)
  ↓
Task 9 (KudosSendForm)
  ↓
Task 10 (KudosCard + KudosPanel)
  ↓
Task 11 (BoardHeader + BoardPage統合)
  ↓
Task 12 (全テスト確認)
  ↓
Task 13 (E2E)
  ↓
Task 14 (ドキュメント更新)
```
