# アクションアイテム引き継ぎパネル 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 前回レトロの未完了アクションアイテムをボード内サイドバーに常時表示し、ステータス更新もできるようにする

**Architecture:** Boardエンティティに`teamName`フィールドを追加し、同じチーム名のCLOSEDボードから未完了アクションアイテムを取得する新規APIを追加。フロントエンドでは右サイドバーに折りたたみ可能なCarryOverPanelを配置。

**Tech Stack:** Spring Boot + Kotlin（バックエンド）、React + TypeScript + Zustand + TailwindCSS（フロントエンド）、SQLite + Flyway（DB）

---

## Task 1: DBマイグレーション — boardsテーブルにteam_nameカラム追加

**Files:**
- Create: `backend/src/main/resources/db/migration/V12__add_team_name_to_boards.sql`

**Step 1: マイグレーションファイル作成**

```sql
ALTER TABLE boards ADD COLUMN team_name TEXT;
```

**Step 2: バックエンドのビルド確認**

Run: `cd backend && ./gradlew build -x test`
Expected: BUILD SUCCESSFUL

**Step 3: コミット**

```bash
git add backend/src/main/resources/db/migration/V12__add_team_name_to_boards.sql
git commit -m "feat: V12 boardsテーブルにteam_nameカラムを追加"
```

---

## Task 2: Boardエンティティ・DTO・Mapper にteamName追加

**Files:**
- Modify: `backend/src/main/kotlin/com/retra/board/domain/Board.kt:35` — `teamName`プロパティ追加
- Modify: `backend/src/main/kotlin/com/retra/board/domain/Board.kt:107-141` — `Board.create()`に`teamName`パラメータ追加
- Modify: `backend/src/main/kotlin/com/retra/board/usecase/BoardDtos.kt:7-12` — `CreateBoardRequest`に`teamName`追加
- Modify: `backend/src/main/kotlin/com/retra/board/usecase/BoardDtos.kt:23-35` — `BoardResponse`に`teamName`追加
- Modify: `backend/src/main/kotlin/com/retra/board/usecase/BoardMapper.kt:9-31` — `toBoardResponse`に`teamName`追加
- Modify: `backend/src/main/kotlin/com/retra/board/usecase/CreateBoardUseCase.kt:17-20` — `teamName`渡し
- Test: `backend/src/test/kotlin/com/retra/TestFixtures.kt` — `board()`に`teamName`追加

**Step 1: テスト修正 — TestFixturesにteamName追加**

`backend/src/test/kotlin/com/retra/TestFixtures.kt` の `board()` メソッドにパラメータ追加:

```kotlin
fun board(
    id: String = UUID.randomUUID().toString(),
    slug: String = "test1234",
    title: String = "Test Retro",
    framework: Framework = Framework.KPT,
    phase: Phase = Phase.WRITING,
    maxVotesPerPerson: Int = 5,
    isAnonymous: Boolean = false,
    teamName: String? = null,  // 追加
    createdAt: String = Instant.now().toString(),
    updatedAt: String = Instant.now().toString()
): Board = Board(
    id = id,
    slug = slug,
    title = title,
    framework = framework,
    phase = phase,
    maxVotesPerPerson = maxVotesPerPerson,
    isAnonymous = isAnonymous,
    teamName = teamName,  // 追加
    createdAt = createdAt,
    updatedAt = updatedAt
)
```

**Step 2: Board.kt — teamNameプロパティ追加**

`isAnonymous`の後に追加:

```kotlin
@Column(name = "team_name")
open var teamName: String? = null,
```

**Step 3: Board.create() — teamNameパラメータ追加**

```kotlin
companion object {
    fun create(
        title: String,
        framework: Framework,
        maxVotesPerPerson: Int = 5,
        isAnonymous: Boolean = false,
        teamName: String? = null  // 追加
    ): Board {
        val slug = BoardSlug.generate()
        val now = Instant.now().toString()
        val board = Board(
            id = UUID.randomUUID().toString(),
            slug = slug.value,
            title = title,
            framework = framework,
            maxVotesPerPerson = maxVotesPerPerson,
            isAnonymous = isAnonymous,
            teamName = teamName,  // 追加
            createdAt = now,
            updatedAt = now
        )
        // ... 既存のカラム作成ロジックはそのまま
    }
}
```

**Step 4: BoardDtos.kt — CreateBoardRequest, BoardResponse 修正**

```kotlin
data class CreateBoardRequest(
    val title: String,
    val framework: Framework = Framework.KPT,
    val maxVotesPerPerson: Int = 5,
    val isAnonymous: Boolean = false,
    val teamName: String? = null  // 追加
)

data class BoardResponse(
    val id: String,
    val slug: String,
    val title: String,
    val teamName: String?,  // 追加
    val framework: Framework,
    val phase: Phase,
    val maxVotesPerPerson: Int,
    val isAnonymous: Boolean,
    val columns: List<ColumnResponse>,
    val participants: List<ParticipantResponse>,
    val createdAt: String,
    val updatedAt: String
)
```

**Step 5: BoardMapper.kt — teamNameを含める**

`toBoardResponse`に追加:

```kotlin
fun toBoardResponse(board: Board, requesterId: String? = null): BoardResponse {
    return BoardResponse(
        id = board.id,
        slug = board.slug,
        title = board.title,
        teamName = board.teamName,  // 追加
        framework = board.framework,
        // ... 以下は既存のまま
    )
}
```

**Step 6: CreateBoardUseCase.kt — teamName渡し**

```kotlin
val board = Board.create(
    title = request.title,
    framework = request.framework,
    maxVotesPerPerson = request.maxVotesPerPerson,
    isAnonymous = request.isAnonymous,
    teamName = request.teamName  // 追加
)
```

**Step 7: テスト実行**

Run: `cd backend && ./gradlew test`
Expected: 全テストPASS（既存テストはteamName=nullでデフォルト動作）

**Step 8: コミット**

```bash
git add backend/src/main/kotlin/com/retra/board/ backend/src/test/kotlin/com/retra/TestFixtures.kt
git commit -m "feat: BoardエンティティにteamNameフィールドを追加"
```

---

## Task 3: CreateSnapshotUseCase修正 — teamName取得元の変更

**Files:**
- Modify: `backend/src/main/kotlin/com/retra/history/usecase/CreateSnapshotUseCase.kt:32-34`
- Test: `backend/src/test/kotlin/com/retra/history/usecase/CreateSnapshotUseCaseTest.kt`

**Step 1: 既存テストの確認・修正**

`CreateSnapshotUseCaseTest`でteamName付きのBoardを使うテストケースを追加:

```kotlin
@Test
fun `teamNameが設定されている場合はteamNameを使用する`() {
    val board = TestFixtures.board(teamName = "チーム Alpha")
    // ... 既存のセットアップ
    // every { snapshotRepository.save(any()) } answers { firstArg() }
    useCase.execute(board)
    verify { snapshotRepository.save(match { it.teamName == "チーム Alpha" }) }
}

@Test
fun `teamNameが未設定の場合はtitleを使用する`() {
    val board = TestFixtures.board(title = "Sprint 42 Retro", teamName = null)
    // ... 既存のセットアップ
    useCase.execute(board)
    verify { snapshotRepository.save(match { it.teamName == "Sprint 42 Retro" }) }
}
```

**Step 2: テスト実行して失敗確認**

Run: `cd backend && ./gradlew test --tests '*CreateSnapshotUseCaseTest*'`
Expected: 新規テストがFAIL（teamName付きBoardでもtitleが使われるため）

**Step 3: CreateSnapshotUseCase修正**

```kotlin
val snapshot = BoardSnapshot.create(
    boardId = board.id,
    teamName = board.teamName ?: board.title,  // 変更
    framework = board.framework.name,
    // ... 以下は既存のまま
)
```

**Step 4: テスト実行**

Run: `cd backend && ./gradlew test --tests '*CreateSnapshotUseCaseTest*'`
Expected: 全テストPASS

**Step 5: コミット**

```bash
git add backend/src/main/kotlin/com/retra/history/usecase/CreateSnapshotUseCase.kt backend/src/test/kotlin/com/retra/history/usecase/CreateSnapshotUseCaseTest.kt
git commit -m "fix: スナップショット作成時にboard.teamNameを優先使用"
```

---

## Task 4: BoardRepositoryにCLOSEDボード検索メソッド追加

**Files:**
- Modify: `backend/src/main/kotlin/com/retra/board/domain/BoardRepository.kt`
- Modify: `backend/src/main/kotlin/com/retra/board/gateway/db/SpringDataBoardRepository.kt`
- Modify: `backend/src/main/kotlin/com/retra/board/gateway/db/JpaBoardRepository.kt`

**Step 1: BoardRepository にメソッド追加**

```kotlin
interface BoardRepository {
    fun save(board: Board): Board
    fun findBySlug(slug: String): Board?
    fun findByTeamNameAndPhaseOrderByUpdatedAtDesc(teamName: String, phase: Phase): List<Board>
}
```

**Step 2: SpringDataBoardRepository にメソッド追加**

```kotlin
interface SpringDataBoardRepository : JpaRepository<Board, String> {
    fun findBySlug(slug: String): Optional<Board>
    fun findByTeamNameAndPhaseOrderByUpdatedAtDesc(teamName: String, phase: Phase): List<Board>
}
```

**Step 3: JpaBoardRepository にメソッド追加**

```kotlin
override fun findByTeamNameAndPhaseOrderByUpdatedAtDesc(teamName: String, phase: Phase): List<Board> =
    springDataRepo.findByTeamNameAndPhaseOrderByUpdatedAtDesc(teamName, phase)
```

**Step 4: ビルド確認**

Run: `cd backend && ./gradlew build -x test`
Expected: BUILD SUCCESSFUL

**Step 5: コミット**

```bash
git add backend/src/main/kotlin/com/retra/board/domain/BoardRepository.kt backend/src/main/kotlin/com/retra/board/gateway/db/
git commit -m "feat: BoardRepositoryにチーム名+フェーズ検索メソッドを追加"
```

---

## Task 5: GetCarryOverItemsUseCase — 引き継ぎアイテム取得ユースケース

**Files:**
- Create: `backend/src/main/kotlin/com/retra/actionitem/usecase/CarryOverDtos.kt`
- Create: `backend/src/main/kotlin/com/retra/actionitem/usecase/GetCarryOverItemsUseCase.kt`
- Create: `backend/src/test/kotlin/com/retra/actionitem/usecase/GetCarryOverItemsUseCaseTest.kt`

**Step 1: CarryOverDtos.kt 作成**

```kotlin
package com.retra.actionitem.usecase

data class CarryOverItemResponse(
    val id: String,
    val content: String,
    val assigneeNickname: String?,
    val dueDate: String?,
    val status: String,
    val priority: String,
    val sourceBoardTitle: String,
    val sourceBoardClosedAt: String,
    val sourceBoardSlug: String
)

data class CarryOverItemsResponse(
    val items: List<CarryOverItemResponse>,
    val teamName: String
)
```

**Step 2: テスト作成（RED）**

`backend/src/test/kotlin/com/retra/actionitem/usecase/GetCarryOverItemsUseCaseTest.kt`:

```kotlin
package com.retra.actionitem.usecase

import com.retra.TestFixtures
import com.retra.actionitem.domain.ActionItemRepository
import com.retra.actionitem.domain.ActionItemStatus
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Phase
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class GetCarryOverItemsUseCaseTest {

    private val boardRepository = mockk<BoardRepository>()
    private val actionItemRepository = mockk<ActionItemRepository>()
    private val useCase = GetCarryOverItemsUseCase(boardRepository, actionItemRepository)

    @BeforeEach
    fun setUp() {
        clearAllMocks()
    }

    @Test
    fun `teamNameが未設定のボードは空リストを返す`() {
        val board = TestFixtures.board(teamName = null)
        every { boardRepository.findBySlug("test1234") } returns board

        val result = useCase.execute("test1234")

        assertTrue(result.items.isEmpty())
        assertEquals("", result.teamName)
    }

    @Test
    fun `同じteamNameのCLOSEDボードがない場合は空リストを返す`() {
        val board = TestFixtures.board(teamName = "チーム Alpha")
        every { boardRepository.findBySlug("test1234") } returns board
        every { boardRepository.findByTeamNameAndPhaseOrderByUpdatedAtDesc("チーム Alpha", Phase.CLOSED) } returns emptyList()

        val result = useCase.execute("test1234")

        assertTrue(result.items.isEmpty())
        assertEquals("チーム Alpha", result.teamName)
    }

    @Test
    fun `直近のCLOSEDボードから未完了アクションアイテムを取得する`() {
        val currentBoard = TestFixtures.board(id = "current", slug = "current-slug", teamName = "チーム Alpha")
        val prevBoard = TestFixtures.board(
            id = "prev", slug = "prev-slug", title = "Sprint 42 Retro",
            teamName = "チーム Alpha", phase = Phase.CLOSED,
            updatedAt = "2026-02-07T10:00:00Z"
        )
        val openItem = TestFixtures.actionItem(
            id = "ai-1", board = prevBoard, content = "テスト自動化",
            status = ActionItemStatus.OPEN
        )
        val inProgressItem = TestFixtures.actionItem(
            id = "ai-2", board = prevBoard, content = "リファクタリング",
            status = ActionItemStatus.IN_PROGRESS
        )
        val doneItem = TestFixtures.actionItem(
            id = "ai-3", board = prevBoard, content = "完了済み",
            status = ActionItemStatus.DONE
        )

        every { boardRepository.findBySlug("current-slug") } returns currentBoard
        every { boardRepository.findByTeamNameAndPhaseOrderByUpdatedAtDesc("チーム Alpha", Phase.CLOSED) } returns listOf(prevBoard)
        every { actionItemRepository.findByBoardId("prev") } returns listOf(openItem, inProgressItem, doneItem)

        val result = useCase.execute("current-slug")

        assertEquals(2, result.items.size)
        assertEquals("テスト自動化", result.items[0].content)
        assertEquals("リファクタリング", result.items[1].content)
        assertEquals("Sprint 42 Retro", result.items[0].sourceBoardTitle)
        assertEquals("prev-slug", result.items[0].sourceBoardSlug)
        assertEquals("チーム Alpha", result.teamName)
    }

    @Test
    fun `自分自身のボードは対象外`() {
        val board = TestFixtures.board(id = "same-id", slug = "test1234", teamName = "チーム Alpha", phase = Phase.CLOSED)
        every { boardRepository.findBySlug("test1234") } returns board
        every { boardRepository.findByTeamNameAndPhaseOrderByUpdatedAtDesc("チーム Alpha", Phase.CLOSED) } returns listOf(board)

        val result = useCase.execute("test1234")

        assertTrue(result.items.isEmpty())
    }
}
```

**Step 3: テスト実行して失敗確認**

Run: `cd backend && ./gradlew test --tests '*GetCarryOverItemsUseCaseTest*'`
Expected: FAIL（クラスが存在しない）

**Step 4: GetCarryOverItemsUseCase.kt 実装**

```kotlin
package com.retra.actionitem.usecase

import com.retra.actionitem.domain.ActionItemRepository
import com.retra.actionitem.domain.ActionItemStatus
import com.retra.board.domain.BoardRepository
import com.retra.board.domain.Phase
import com.retra.shared.domain.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class GetCarryOverItemsUseCase(
    private val boardRepository: BoardRepository,
    private val actionItemRepository: ActionItemRepository
) {

    @Transactional(readOnly = true)
    fun execute(slug: String): CarryOverItemsResponse {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")

        val teamName = board.teamName ?: return CarryOverItemsResponse(items = emptyList(), teamName = "")

        val closedBoards = boardRepository.findByTeamNameAndPhaseOrderByUpdatedAtDesc(teamName, Phase.CLOSED)
            .filter { it.id != board.id }

        if (closedBoards.isEmpty()) {
            return CarryOverItemsResponse(items = emptyList(), teamName = teamName)
        }

        val prevBoard = closedBoards.first()
        val actionItems = actionItemRepository.findByBoardId(prevBoard.id)
            .filter { it.status != ActionItemStatus.DONE }

        val items = actionItems.map { ai ->
            CarryOverItemResponse(
                id = ai.id,
                content = ai.content,
                assigneeNickname = ai.assignee?.nickname,
                dueDate = ai.dueDate,
                status = ai.status.name,
                priority = ai.priority.name,
                sourceBoardTitle = prevBoard.title,
                sourceBoardClosedAt = prevBoard.updatedAt,
                sourceBoardSlug = prevBoard.slug
            )
        }

        return CarryOverItemsResponse(items = items, teamName = teamName)
    }
}
```

**Step 5: テスト実行**

Run: `cd backend && ./gradlew test --tests '*GetCarryOverItemsUseCaseTest*'`
Expected: 全テストPASS

**Step 6: コミット**

```bash
git add backend/src/main/kotlin/com/retra/actionitem/usecase/CarryOverDtos.kt backend/src/main/kotlin/com/retra/actionitem/usecase/GetCarryOverItemsUseCase.kt backend/src/test/kotlin/com/retra/actionitem/usecase/GetCarryOverItemsUseCaseTest.kt
git commit -m "feat: 引き継ぎアイテム取得ユースケースを追加"
```

---

## Task 6: UpdateCarryOverItemStatusUseCase — 引き継ぎアイテムステータス更新

**Files:**
- Create: `backend/src/main/kotlin/com/retra/actionitem/usecase/UpdateCarryOverItemStatusUseCase.kt`
- Create: `backend/src/test/kotlin/com/retra/actionitem/usecase/UpdateCarryOverItemStatusUseCaseTest.kt`

**Step 1: テスト作成（RED）**

`backend/src/test/kotlin/com/retra/actionitem/usecase/UpdateCarryOverItemStatusUseCaseTest.kt`:

```kotlin
package com.retra.actionitem.usecase

import com.retra.TestFixtures
import com.retra.actionitem.domain.ActionItem
import com.retra.actionitem.domain.ActionItemRepository
import com.retra.actionitem.domain.ActionItemStatus
import com.retra.board.domain.BoardRepository
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import io.mockk.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals

class UpdateCarryOverItemStatusUseCaseTest {

    private val boardRepository = mockk<BoardRepository>()
    private val actionItemRepository = mockk<ActionItemRepository>()
    private val eventPublisher = mockk<SpringDomainEventPublisher>(relaxed = true)
    private val useCase = UpdateCarryOverItemStatusUseCase(boardRepository, actionItemRepository, eventPublisher)

    @BeforeEach
    fun setUp() {
        clearAllMocks()
    }

    @Test
    fun `ファシリテーターが引き継ぎアイテムのステータスを更新できる`() {
        val currentBoard = TestFixtures.board(slug = "current-slug")
        val facilitator = TestFixtures.participant(id = "p-1", board = currentBoard, isFacilitator = true)
        currentBoard.participants.add(facilitator)
        val actionItem = TestFixtures.actionItem(id = "ai-1", status = ActionItemStatus.OPEN)

        every { boardRepository.findBySlug("current-slug") } returns currentBoard
        every { actionItemRepository.findById("ai-1") } returns actionItem
        every { actionItemRepository.save(any()) } answers { firstArg() }

        useCase.execute("current-slug", "ai-1", UpdateActionItemStatusRequest(status = "DONE", participantId = "p-1"))

        assertEquals(ActionItemStatus.DONE, actionItem.status)
        verify { actionItemRepository.save(actionItem) }
    }

    @Test
    fun `ファシリテーター以外はステータスを更新できない`() {
        val currentBoard = TestFixtures.board(slug = "current-slug")
        val member = TestFixtures.participant(id = "p-2", board = currentBoard, isFacilitator = false)
        currentBoard.participants.add(member)

        every { boardRepository.findBySlug("current-slug") } returns currentBoard

        assertThrows<ForbiddenException> {
            useCase.execute("current-slug", "ai-1", UpdateActionItemStatusRequest(status = "DONE", participantId = "p-2"))
        }
    }

    @Test
    fun `存在しないアクションアイテムはNotFoundExceptionをスロー`() {
        val currentBoard = TestFixtures.board(slug = "current-slug")
        val facilitator = TestFixtures.participant(id = "p-1", board = currentBoard, isFacilitator = true)
        currentBoard.participants.add(facilitator)

        every { boardRepository.findBySlug("current-slug") } returns currentBoard
        every { actionItemRepository.findById("ai-999") } returns null

        assertThrows<NotFoundException> {
            useCase.execute("current-slug", "ai-999", UpdateActionItemStatusRequest(status = "DONE", participantId = "p-1"))
        }
    }
}
```

**Step 2: テスト実行して失敗確認**

Run: `cd backend && ./gradlew test --tests '*UpdateCarryOverItemStatusUseCaseTest*'`
Expected: FAIL

**Step 3: UpdateCarryOverItemStatusUseCase.kt 実装**

```kotlin
package com.retra.actionitem.usecase

import com.retra.actionitem.domain.ActionItemRepository
import com.retra.actionitem.domain.ActionItemStatus
import com.retra.board.domain.BoardRepository
import com.retra.shared.domain.BadRequestException
import com.retra.shared.domain.ForbiddenException
import com.retra.shared.domain.NotFoundException
import com.retra.shared.gateway.event.SpringDomainEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UpdateCarryOverItemStatusUseCase(
    private val boardRepository: BoardRepository,
    private val actionItemRepository: ActionItemRepository,
    private val eventPublisher: SpringDomainEventPublisher
) {

    @Transactional
    fun execute(slug: String, actionItemId: String, request: UpdateActionItemStatusRequest) {
        val board = boardRepository.findBySlug(slug)
            ?: throw NotFoundException("Board not found")

        val participant = board.findParticipantById(request.participantId)
        if (!participant.isFacilitator) {
            throw ForbiddenException("Only facilitator can update carry-over item status")
        }

        val actionItem = actionItemRepository.findById(actionItemId)
            ?: throw NotFoundException("Action item not found")

        val newStatus = try {
            ActionItemStatus.valueOf(request.status)
        } catch (e: IllegalArgumentException) {
            throw BadRequestException("Invalid status: ${request.status}")
        }

        actionItem.status = newStatus
        actionItem.updatedAt = java.time.Instant.now().toString()
        actionItemRepository.save(actionItem)
    }
}
```

**Step 4: テスト実行**

Run: `cd backend && ./gradlew test --tests '*UpdateCarryOverItemStatusUseCaseTest*'`
Expected: 全テストPASS

**Step 5: コミット**

```bash
git add backend/src/main/kotlin/com/retra/actionitem/usecase/UpdateCarryOverItemStatusUseCase.kt backend/src/test/kotlin/com/retra/actionitem/usecase/UpdateCarryOverItemStatusUseCaseTest.kt
git commit -m "feat: 引き継ぎアイテムステータス更新ユースケースを追加"
```

---

## Task 7: ActionItemControllerに引き継ぎエンドポイント追加

**Files:**
- Modify: `backend/src/main/kotlin/com/retra/actionitem/gateway/controller/ActionItemController.kt`
- Modify: `backend/src/test/kotlin/com/retra/actionitem/gateway/controller/ActionItemControllerTest.kt`

**Step 1: コントローラテスト追加（RED）**

`ActionItemControllerTest.kt`に追加:

```kotlin
@Test
fun `GET carry-over-items returns 200`() {
    val response = CarryOverItemsResponse(
        items = listOf(
            CarryOverItemResponse(
                id = "ai-1", content = "テスト自動化",
                assigneeNickname = "田中", dueDate = "2026-02-20",
                status = "OPEN", priority = "HIGH",
                sourceBoardTitle = "Sprint 42", sourceBoardClosedAt = "2026-02-07T10:00:00Z",
                sourceBoardSlug = "abc123"
            )
        ),
        teamName = "チーム Alpha"
    )
    whenever(getCarryOverItemsUseCase.execute("test-slug")).thenReturn(response)

    mockMvc.perform(get("/api/v1/boards/test-slug/carry-over-items"))
        .andExpect(status().isOk)
        .andExpect(jsonPath("$.teamName").value("チーム Alpha"))
        .andExpect(jsonPath("$.items[0].content").value("テスト自動化"))
        .andExpect(jsonPath("$.items[0].sourceBoardSlug").value("abc123"))
}

@Test
fun `PATCH carry-over-items status returns 200`() {
    mockMvc.perform(
        patch("/api/v1/boards/test-slug/carry-over-items/ai-1/status")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(mapOf("status" to "DONE", "participantId" to "p-1")))
    )
        .andExpect(status().isOk)

    verify(updateCarryOverItemStatusUseCase).execute(eq("test-slug"), eq("ai-1"), any())
}
```

注: テストクラスの `@MockBean` に `GetCarryOverItemsUseCase` と `UpdateCarryOverItemStatusUseCase` を追加する必要がある。

**Step 2: テスト実行して失敗確認**

Run: `cd backend && ./gradlew test --tests '*ActionItemControllerTest*'`
Expected: FAIL

**Step 3: ActionItemController.kt にエンドポイント追加**

コントローラのコンストラクタに追加:
```kotlin
private val getCarryOverItemsUseCase: GetCarryOverItemsUseCase,
private val updateCarryOverItemStatusUseCase: UpdateCarryOverItemStatusUseCase,
```

エンドポイント追加:
```kotlin
@GetMapping("/../carry-over-items")
@RequestMapping  // 注: 実際のパスは /api/v1/boards/{slug}/carry-over-items
```

実際には、ActionItemControllerの`@RequestMapping`は`/api/v1/boards/{slug}/action-items`なので、carry-over-itemsは別のパスになる。ActionItemControllerにメソッドを追加するか、別のコントローラを作成する。

**最もシンプルな方法:** ActionItemControllerのRequestMappingを利用せず、メソッドレベルで直接パスを指定:

```kotlin
@GetMapping("/api/v1/boards/{slug}/carry-over-items")
fun getCarryOverItems(@PathVariable slug: String): CarryOverItemsResponse {
    return getCarryOverItemsUseCase.execute(slug)
}

@PatchMapping("/api/v1/boards/{slug}/carry-over-items/{actionItemId}/status")
fun updateCarryOverItemStatus(
    @PathVariable slug: String,
    @PathVariable actionItemId: String,
    @RequestBody request: UpdateActionItemStatusRequest
) {
    updateCarryOverItemStatusUseCase.execute(slug, actionItemId, request)
}
```

注: クラスレベルの`@RequestMapping`との競合を避けるため、別コントローラ `CarryOverController.kt` を作成するほうがクリーンかもしれない。判断は実装者に任せるが、ActionItemControllerに追加する場合はメソッドレベルで完全パスを指定する。

**Step 4: テスト実行**

Run: `cd backend && ./gradlew test --tests '*ActionItemControllerTest*'`
Expected: 全テストPASS

**Step 5: コミット**

```bash
git add backend/src/main/kotlin/com/retra/actionitem/gateway/controller/ backend/src/test/kotlin/com/retra/actionitem/gateway/controller/
git commit -m "feat: 引き継ぎアイテムのREST APIエンドポイントを追加"
```

---

## Task 8: バックエンド全テスト実行

**Step 1: 全テスト実行**

Run: `cd backend && ./gradlew test`
Expected: 全テストPASS、カバレッジ80%以上

**Step 2: コミット（必要な修正があれば）**

---

## Task 9: フロントエンド型定義・APIクライアント追加

**Files:**
- Modify: `frontend/src/types/index.ts` — `Board`型に`teamName`追加、`CarryOverItem`型追加
- Modify: `frontend/src/api/client.ts` — `createBoard`に`teamName`追加、carry-over API追加
- Modify: `frontend/src/api/client.test.ts` — 新規APIのテスト追加
- Modify: `frontend/src/test/fixtures.ts` — `createBoard`に`teamName`追加、`createCarryOverItem`追加

**Step 1: types/index.ts に型追加**

`Board`インターフェースに追加:
```typescript
export interface Board {
  id: string;
  slug: string;
  title: string;
  teamName: string | null;  // 追加
  framework: Framework;
  // ... 既存のまま
}
```

新規型追加:
```typescript
export interface CarryOverItem {
  id: string;
  content: string;
  assigneeNickname: string | null;
  dueDate: string | null;
  status: ActionItemStatus;
  priority: ActionItemPriority;
  sourceBoardTitle: string;
  sourceBoardClosedAt: string;
  sourceBoardSlug: string;
}

export interface CarryOverItemsResponse {
  items: CarryOverItem[];
  teamName: string;
}
```

**Step 2: test/fixtures.ts 修正**

`createBoard`に`teamName`追加:
```typescript
export function createBoard(overrides: Partial<Board> = {}): Board {
  return {
    // ... 既存フィールド
    teamName: null,  // 追加（isAnonymousの後に）
    // ...
    ...overrides,
  }
}
```

`createCarryOverItem`追加:
```typescript
export function createCarryOverItem(overrides: Partial<CarryOverItem> = {}): CarryOverItem {
  return {
    id: 'co-1',
    content: 'Test carry-over item',
    assigneeNickname: null,
    dueDate: null,
    status: 'OPEN',
    priority: 'MEDIUM',
    sourceBoardTitle: 'Sprint 42 Retro',
    sourceBoardClosedAt: '2024-01-01T00:00:00Z',
    sourceBoardSlug: 'prev-slug',
    ...overrides,
  }
}
```

**Step 3: api/client.ts 修正**

`createBoard`に`teamName`パラメータ追加:
```typescript
createBoard(title: string, framework: Framework, maxVotesPerPerson: number = 5, isAnonymous: boolean = false, teamName?: string): Promise<Board> {
  return request('/boards', {
    method: 'POST',
    body: JSON.stringify({ title, framework, maxVotesPerPerson, isAnonymous, teamName }),
  });
},
```

carry-over API追加:
```typescript
// Carry-over Items
getCarryOverItems(slug: string): Promise<CarryOverItemsResponse> {
  return request<CarryOverItemsResponse>(`/boards/${slug}/carry-over-items`);
},

updateCarryOverItemStatus(slug: string, actionItemId: string, status: string, participantId: string): Promise<void> {
  return request<void>(`/boards/${slug}/carry-over-items/${actionItemId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, participantId }),
  });
},
```

importに`CarryOverItemsResponse`を追加。

**Step 4: api/client.test.ts にテスト追加**

```typescript
describe('getCarryOverItems', () => {
  it('should GET /boards/{slug}/carry-over-items', async () => {
    const response = { items: [], teamName: 'Team Alpha' };
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(response) });

    const result = await api.getCarryOverItems('test-slug');

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/boards/test-slug/carry-over-items', expect.objectContaining({ method: undefined }));
    expect(result).toEqual(response);
  });
});

describe('updateCarryOverItemStatus', () => {
  it('should PATCH /boards/{slug}/carry-over-items/{id}/status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: () => Promise.resolve(null) });

    await api.updateCarryOverItemStatus('test-slug', 'ai-1', 'DONE', 'p-1');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/boards/test-slug/carry-over-items/ai-1/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'DONE', participantId: 'p-1' }),
      })
    );
  });
});
```

`createBoard`テストも`teamName`パラメータ対応に修正:
```typescript
it('should include teamName in createBoard request', async () => {
  mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) });

  await api.createBoard('Test', 'KPT', 5, false, 'Team Alpha');

  expect(mockFetch).toHaveBeenCalledWith(
    '/api/v1/boards',
    expect.objectContaining({
      body: JSON.stringify({ title: 'Test', framework: 'KPT', maxVotesPerPerson: 5, isAnonymous: false, teamName: 'Team Alpha' }),
    })
  );
});
```

**Step 5: テスト実行**

Run: `cd frontend && npm run test -- --run src/api/client.test.ts`
Expected: 全テストPASS

**Step 6: TypeScript型チェック**

Run: `cd frontend && npx tsc --noEmit`
Expected: エラーなし（Board型にteamNameを追加したので、既存テストでcreateBoard()の戻り値にteamNameが含まれる必要あり。fixtures.tsで対応済み）

**Step 7: コミット**

```bash
git add frontend/src/types/index.ts frontend/src/api/client.ts frontend/src/api/client.test.ts frontend/src/test/fixtures.ts
git commit -m "feat: フロントエンドにcarry-over型定義とAPIクライアントを追加"
```

---

## Task 10: Zustandストアにcarry-overステート追加

**Files:**
- Modify: `frontend/src/store/boardStore.ts`
- Modify: `frontend/src/store/boardStore.test.ts`（存在する場合）

**Step 1: boardStore.ts に追加**

型に追加:
```typescript
carryOverItems: CarryOverItem[];
carryOverTeamName: string;
setCarryOverItems: (response: CarryOverItemsResponse) => void;
updateCarryOverItemStatus: (actionItemId: string, newStatus: ActionItemStatus) => void;
```

実装:
```typescript
carryOverItems: [],
carryOverTeamName: '',
setCarryOverItems: (response) => set({ carryOverItems: response.items, carryOverTeamName: response.teamName }),
updateCarryOverItemStatus: (actionItemId, newStatus) => set((state) => ({
  carryOverItems: state.carryOverItems.map((item) =>
    item.id === actionItemId ? { ...item, status: newStatus } : item
  ),
})),
```

importに`CarryOverItem`, `CarryOverItemsResponse`を追加。

**Step 2: テスト実行**

Run: `cd frontend && npm run test -- --run`
Expected: 全テストPASS

**Step 3: コミット**

```bash
git add frontend/src/store/boardStore.ts
git commit -m "feat: Zustandストアにcarry-overステートを追加"
```

---

## Task 11: CarryOverPanelコンポーネント作成

**Files:**
- Create: `frontend/src/components/CarryOverPanel.tsx`
- Create: `frontend/src/components/CarryOverPanel.test.tsx`

**Step 1: テスト作成（RED）**

`frontend/src/components/CarryOverPanel.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CarryOverPanel } from './CarryOverPanel';
import { useBoardStore } from '../store/boardStore';
import { createCarryOverItem } from '../test/fixtures';
import { api } from '../api/client';

vi.mock('../store/boardStore');
vi.mock('../api/client');

describe('CarryOverPanel', () => {
  const mockStore = {
    board: { slug: 'test-slug', teamName: 'Team Alpha' },
    participant: { id: 'p-1', isFacilitator: true },
    carryOverItems: [],
    carryOverTeamName: '',
    setCarryOverItems: vi.fn(),
    updateCarryOverItemStatus: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useBoardStore).mockReturnValue(mockStore as ReturnType<typeof useBoardStore>);
  });

  it('teamNameが未設定の場合は何も表示しない', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      ...mockStore,
      board: { ...mockStore.board, teamName: null },
    } as ReturnType<typeof useBoardStore>);

    const { container } = render(<CarryOverPanel />);
    expect(container.innerHTML).toBe('');
  });

  it('ヘッダーに件数バッジを表示する', () => {
    const items = [
      createCarryOverItem({ id: 'co-1', content: 'アイテム1' }),
      createCarryOverItem({ id: 'co-2', content: 'アイテム2' }),
    ];
    vi.mocked(useBoardStore).mockReturnValue({
      ...mockStore,
      carryOverItems: items,
      carryOverTeamName: 'Team Alpha',
    } as ReturnType<typeof useBoardStore>);

    render(<CarryOverPanel />);

    expect(screen.getByText('前回のアクションアイテム')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('アイテムの内容・優先度・ステータスを表示する', () => {
    const items = [
      createCarryOverItem({ id: 'co-1', content: 'テスト自動化', priority: 'HIGH', status: 'OPEN' }),
    ];
    vi.mocked(useBoardStore).mockReturnValue({
      ...mockStore,
      carryOverItems: items,
      carryOverTeamName: 'Team Alpha',
    } as ReturnType<typeof useBoardStore>);

    render(<CarryOverPanel />);

    expect(screen.getByText('テスト自動化')).toBeInTheDocument();
  });

  it('折りたたみトグルで表示/非表示を切り替える', () => {
    const items = [createCarryOverItem({ id: 'co-1', content: 'テスト' })];
    vi.mocked(useBoardStore).mockReturnValue({
      ...mockStore,
      carryOverItems: items,
      carryOverTeamName: 'Team Alpha',
    } as ReturnType<typeof useBoardStore>);

    render(<CarryOverPanel />);

    expect(screen.getByText('テスト')).toBeInTheDocument();

    // 折りたたみ
    fireEvent.click(screen.getByRole('button', { name: /折りたたみ/i }));
    expect(screen.queryByText('テスト')).not.toBeInTheDocument();
  });

  it('0件の場合はメッセージを表示する', () => {
    vi.mocked(useBoardStore).mockReturnValue({
      ...mockStore,
      carryOverItems: [],
      carryOverTeamName: 'Team Alpha',
    } as ReturnType<typeof useBoardStore>);

    render(<CarryOverPanel />);

    expect(screen.getByText('未完了のアクションアイテムはありません')).toBeInTheDocument();
  });

  it('ファシリテーターはステータスを変更できる', async () => {
    const items = [createCarryOverItem({ id: 'co-1', content: 'テスト', status: 'OPEN' })];
    vi.mocked(useBoardStore).mockReturnValue({
      ...mockStore,
      carryOverItems: items,
      carryOverTeamName: 'Team Alpha',
    } as ReturnType<typeof useBoardStore>);
    vi.mocked(api.updateCarryOverItemStatus).mockResolvedValue(undefined);

    render(<CarryOverPanel />);

    const statusSelect = screen.getByDisplayValue('未着手');
    fireEvent.change(statusSelect, { target: { value: 'DONE' } });

    await waitFor(() => {
      expect(api.updateCarryOverItemStatus).toHaveBeenCalledWith('test-slug', 'co-1', 'DONE', 'p-1');
    });
  });
});
```

**Step 2: テスト実行して失敗確認**

Run: `cd frontend && npm run test -- --run src/components/CarryOverPanel.test.tsx`
Expected: FAIL（コンポーネントが存在しない）

**Step 3: CarryOverPanel.tsx 実装**

```tsx
import { useState } from 'react';
import { ChevronDown, ChevronRight, History } from 'lucide-react';
import { useBoardStore } from '../store/boardStore';
import { api } from '../api/client';
import { ActionItemStatusBadge } from './ActionItemStatusBadge';
import type { ActionItemStatus, CarryOverItem } from '../types';

const STATUS_OPTIONS: { value: ActionItemStatus; label: string }[] = [
  { value: 'OPEN', label: '未着手' },
  { value: 'IN_PROGRESS', label: '進行中' },
  { value: 'DONE', label: '完了' },
];

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'text-red-600',
  MEDIUM: 'text-yellow-600',
  LOW: 'text-gray-500',
};

const PRIORITY_LABELS: Record<string, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低',
};

export function CarryOverPanel() {
  const { board, participant, carryOverItems, carryOverTeamName, updateCarryOverItemStatus } = useBoardStore();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!board?.teamName) return null;

  const isFacilitator = participant?.isFacilitator ?? false;

  const handleStatusChange = async (item: CarryOverItem, newStatus: ActionItemStatus) => {
    if (!participant) return;
    try {
      await api.updateCarryOverItemStatus(board.slug, item.id, newStatus, participant.id);
      updateCarryOverItemStatus(item.id, newStatus);
    } catch {
      // エラーは無視（楽観的更新なし）
    }
  };

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
        aria-label={isExpanded ? '折りたたみ' : '展開'}
      >
        <div className="flex items-center gap-2">
          <History size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">前回のアクションアイテム</span>
          {carryOverItems.length > 0 && (
            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
              {carryOverItems.length}
            </span>
          )}
        </div>
        {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {carryOverItems.length === 0 ? (
            <p className="text-xs text-gray-400">未完了のアクションアイテムはありません</p>
          ) : (
            <>
              {carryOverTeamName && carryOverItems.length > 0 && (
                <p className="text-xs text-gray-400 mb-2">
                  {carryOverItems[0].sourceBoardTitle}（{new Date(carryOverItems[0].sourceBoardClosedAt).toLocaleDateString('ja-JP')}）
                </p>
              )}
              {carryOverItems.map((item) => (
                <div key={item.id} className="p-2 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 text-xs leading-relaxed">{item.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.assigneeNickname && (
                          <span className="text-xs text-gray-500">{item.assigneeNickname}</span>
                        )}
                        <span className={`text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}>
                          {PRIORITY_LABELS[item.priority]}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {isFacilitator ? (
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item, e.target.value as ActionItemStatus)}
                          className="text-xs border border-gray-200 rounded px-1 py-0.5"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <ActionItemStatusBadge status={item.status} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 4: テスト実行**

Run: `cd frontend && npm run test -- --run src/components/CarryOverPanel.test.tsx`
Expected: 全テストPASS

**Step 5: コミット**

```bash
git add frontend/src/components/CarryOverPanel.tsx frontend/src/components/CarryOverPanel.test.tsx
git commit -m "feat: CarryOverPanelコンポーネントを追加"
```

---

## Task 12: BoardPageにCarryOverPanel統合 + データ取得

**Files:**
- Modify: `frontend/src/pages/BoardPage.tsx:120-125` — サイドバーにCarryOverPanel追加
- Modify: `frontend/src/components/BoardView.tsx:66-72` — carry-overデータ取得追加

**Step 1: BoardView.tsx — carry-overデータ取得追加**

既存の`useEffect`（actionItems取得）の後に追加:

```typescript
const { setCarryOverItems } = useBoardStore();

// Load carry-over items when board loads
useEffect(() => {
  if (board?.slug && board?.teamName) {
    api.getCarryOverItems(board.slug).then(setCarryOverItems).catch(() => {
      // carry-over取得失敗は無視
    });
  }
}, [board?.slug, board?.teamName, setCarryOverItems]);
```

`useBoardStore()`のデストラクチャに`setCarryOverItems`を追加。

**Step 2: BoardPage.tsx — サイドバーにCarryOverPanel追加**

```tsx
import { CarryOverPanel } from '../components/CarryOverPanel';
```

サイドバー部分（`<div className="hidden lg:block w-64 ...">`内）に追加:

```tsx
<div className="hidden lg:block w-64 border-l border-gray-200 bg-white">
  <div className="p-4">
    <TimerDisplay />
    <ParticipantList />
    <CarryOverPanel />  {/* 追加 */}
  </div>
</div>
```

**Step 3: テスト実行**

Run: `cd frontend && npm run test -- --run`
Expected: 全テストPASS

**Step 4: TypeScript型チェック**

Run: `cd frontend && npx tsc --noEmit`
Expected: エラーなし

**Step 5: コミット**

```bash
git add frontend/src/pages/BoardPage.tsx frontend/src/components/BoardView.tsx
git commit -m "feat: BoardPageにCarryOverPanelを統合"
```

---

## Task 13: HomePageにチーム名入力欄追加

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`
- Modify: `frontend/src/pages/HomePage.test.tsx`

**Step 1: テスト追加（RED）**

`HomePage.test.tsx`に追加:

```tsx
it('チーム名入力欄を表示する', () => {
  render(<HomePage />);
  expect(screen.getByLabelText('チーム名（オプション）')).toBeInTheDocument();
});

it('チーム名付きでボードを作成する', async () => {
  vi.mocked(api.createBoard).mockResolvedValueOnce(createBoard({ slug: 'new-slug' }));

  render(<HomePage />);

  fireEvent.change(screen.getByLabelText('ボードタイトル'), { target: { value: 'Sprint 43' } });
  fireEvent.change(screen.getByLabelText('チーム名（オプション）'), { target: { value: 'Team Alpha' } });
  fireEvent.submit(screen.getByRole('button', { name: 'ボードを作成' }));

  await waitFor(() => {
    expect(api.createBoard).toHaveBeenCalledWith('Sprint 43', 'KPT', 5, false, 'Team Alpha');
  });
});
```

**Step 2: テスト実行して失敗確認**

Run: `cd frontend && npm run test -- --run src/pages/HomePage.test.tsx`
Expected: FAIL

**Step 3: HomePage.tsx 修正**

state追加:
```typescript
const [teamName, setTeamName] = useState('');
```

`handleCreate`修正:
```typescript
const board = await api.createBoard(title.trim(), framework, maxVotes, isAnonymous, teamName.trim() || undefined);
```

フォームに入力欄追加（匿名モードトグルの前に）:
```tsx
<div>
  <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
    チーム名（オプション）
  </label>
  <input
    id="teamName"
    type="text"
    value={teamName}
    onChange={(e) => setTeamName(e.target.value)}
    placeholder="チーム Alpha"
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
  />
  <p className="text-xs text-gray-500 mt-1">同じチーム名のレトロから前回のアクションアイテムを引き継ぎます</p>
</div>
```

**Step 4: テスト実行**

Run: `cd frontend && npm run test -- --run src/pages/HomePage.test.tsx`
Expected: 全テストPASS

**Step 5: コミット**

```bash
git add frontend/src/pages/HomePage.tsx frontend/src/pages/HomePage.test.tsx
git commit -m "feat: ボード作成フォームにチーム名入力欄を追加"
```

---

## Task 14: フロントエンド全テスト・Lint・型チェック

**Step 1: 全テスト実行**

Run: `cd frontend && npm run test -- --run`
Expected: 全テストPASS

**Step 2: Lint実行**

Run: `cd frontend && npm run lint`
Expected: エラーなし

**Step 3: 型チェック**

Run: `cd frontend && npx tsc --noEmit`
Expected: エラーなし

**Step 4: コミット（修正があれば）**

---

## Task 15: E2Eテスト作成

**Files:**
- Create: `frontend/e2e/carry-over.spec.ts`

**Step 1: E2Eテスト作成**

```typescript
import { test, expect } from '@playwright/test';

test.describe('アクションアイテム引き継ぎ', () => {
  test('前回のレトロの未完了アクションアイテムがサイドバーに表示される', async ({ page }) => {
    // 1. ボード1を作成（チーム名付き）
    await page.goto('/');
    await page.getByLabel('ボードタイトル').fill('Sprint 42 Retro');
    await page.getByLabel('チーム名（オプション）').fill('E2E Test Team');
    await page.getByRole('button', { name: 'ボードを作成' }).click();

    // 2. ニックネーム入力して参加
    await page.getByPlaceholder('ニックネーム').fill('ファシリテーター');
    await page.getByRole('button', { name: '参加する' }).click();

    // 3. フェーズをACTION_ITEMSまで進める
    const nextButton = page.getByRole('button', { name: '次のフェーズへ' });
    await nextButton.click(); // WRITING -> VOTING
    await nextButton.click(); // VOTING -> DISCUSSION
    await nextButton.click(); // DISCUSSION -> ACTION_ITEMS

    // 4. アクションアイテムを作成
    await page.getByPlaceholder('アクションアイテムを入力').fill('テスト自動化を導入する');
    await page.getByRole('button', { name: '追加' }).click();
    await expect(page.getByText('テスト自動化を導入する')).toBeVisible();

    // 5. CLOSEDフェーズに移行
    await nextButton.click(); // ACTION_ITEMS -> CLOSED

    // 6. ホームに戻り、同じチーム名で新しいボードを作成
    await page.goto('/');
    await page.getByLabel('ボードタイトル').fill('Sprint 43 Retro');
    await page.getByLabel('チーム名（オプション）').fill('E2E Test Team');
    await page.getByRole('button', { name: 'ボードを作成' }).click();

    await page.getByPlaceholder('ニックネーム').fill('ファシリテーター');
    await page.getByRole('button', { name: '参加する' }).click();

    // 7. サイドバーに前回のアクションアイテムが表示されることを確認
    await expect(page.getByText('前回のアクションアイテム')).toBeVisible();
    await expect(page.getByText('テスト自動化を導入する')).toBeVisible();
  });
});
```

**Step 2: E2Eテスト実行**

Run: `cd frontend && npm run test:e2e -- --workers=1 carry-over.spec.ts`

注: バックエンドが`http://localhost:8080`で起動している必要がある。

**Step 3: コミット**

```bash
git add frontend/e2e/carry-over.spec.ts
git commit -m "test: アクションアイテム引き継ぎのE2Eテストを追加"
```

---

## Task 16: ドキュメント更新

**Files:**
- Modify: `CLAUDE.md` — API Routes、WebSocket Events、フロントエンド構造の更新
- Modify: `docs/CONTRIB.md` — 機能説明の追加（該当する場合）

**Step 1: CLAUDE.md更新**

以下を更新:
- `CreateBoardRequest`に`teamName`追加
- API Routesに`GET /boards/{slug}/carry-over-items`と`PATCH /boards/{slug}/carry-over-items/{id}/status`追加
- フロントエンドcomponentsに`CarryOverPanel`追加
- DB migrationにV12追加

**Step 2: コミット**

```bash
git add CLAUDE.md
git commit -m "docs: アクションアイテム引き継ぎ機能のドキュメントを更新"
```

---

## 依存関係グラフ

```
Task 1 (DB Migration)
  └── Task 2 (Board Entity + DTO)
       ├── Task 3 (Snapshot修正)
       ├── Task 4 (Repository追加)
       │    └── Task 5 (GetCarryOverUseCase)
       │         └── Task 7 (Controller)
       │              └── Task 8 (Backend全テスト)
       ├── Task 6 (UpdateCarryOverUseCase)
       │    └── Task 7 (Controller)
       └── Task 9 (Frontend型+API)
            ├── Task 10 (Zustand Store)
            │    └── Task 11 (CarryOverPanel)
            │         └── Task 12 (BoardPage統合)
            └── Task 13 (HomePage修正)
                 └── Task 14 (Frontend全テスト)
                      └── Task 15 (E2E)
                           └── Task 16 (ドキュメント)
```

Tasks 3, 4, 6 は並列実行可能。Tasks 9-13 はTask 8完了後に並列実行可能。
