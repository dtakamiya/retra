# アクションアイテム追跡 & レトロ履歴ダッシュボード 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Retraにアクションアイテム管理機能とレトロ履歴ダッシュボードを追加し、レトロスペクティブの継続的改善サイクルを支援する。

**Architecture:** 既存のモジュラーモノリス + クリーンアーキテクチャに合わせ、`actionitem/` と `history/` モジュールを段階的に追加。各モジュールは domain/usecase/gateway の3層構造。フロントエンドは既存パターン（Zustand + STOMP + React Testing Library）に準拠。

**Tech Stack:** Spring Boot 3.4.1 + Kotlin, React 19.2 + TypeScript 5.9, SQLite + Flyway, WebSocket (STOMP), Recharts (新規)

**Design Doc:** `docs/plans/2026-02-13-action-items-and-dashboard-design.md`

---

## フェーズ1: アクションアイテムモジュール

### Task 1: Flyway マイグレーション V9

**Files:**
- Create: `backend/src/main/resources/db/migration/V9__create_action_items.sql`

**Step 1: マイグレーションSQL作成**

```sql
CREATE TABLE action_items (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    card_id TEXT,
    content TEXT NOT NULL,
    assignee_id TEXT,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL,
    FOREIGN KEY (assignee_id) REFERENCES participants(id) ON DELETE SET NULL
);

CREATE INDEX idx_action_items_board_id ON action_items(board_id);
CREATE INDEX idx_action_items_card_id ON action_items(card_id);
CREATE INDEX idx_action_items_assignee_id ON action_items(assignee_id);
```

**Step 2: バックエンドビルドで確認**

Run: `cd backend && ./gradlew test --tests '*' -x jacocoTestCoverageVerification 2>&1 | tail -5`
Expected: BUILD SUCCESSFUL（マイグレーション適用確認）

**Step 3: コミット**

```bash
git add backend/src/main/resources/db/migration/V9__create_action_items.sql
git commit -m "feat: アクションアイテムテーブルのマイグレーション追加 (V9)"
```

---

### Task 2: ActionItem ドメイン層

**Files:**
- Create: `backend/src/main/kotlin/com/retra/actionitem/domain/ActionItemStatus.kt`
- Create: `backend/src/main/kotlin/com/retra/actionitem/domain/ActionItemEvent.kt`
- Create: `backend/src/main/kotlin/com/retra/actionitem/domain/ActionItem.kt`
- Create: `backend/src/main/kotlin/com/retra/actionitem/domain/ActionItemRepository.kt`
- Test: `backend/src/test/kotlin/com/retra/actionitem/domain/ActionItemTest.kt`

**Step 1: ActionItemStatus enum 作成**

```kotlin
// ActionItemStatus.kt
package com.retra.actionitem.domain

enum class ActionItemStatus {
    OPEN,
    IN_PROGRESS,
    DONE
}
```

**Step 2: ActionItemEvent sealed class 作成**

```kotlin
// ActionItemEvent.kt
package com.retra.actionitem.domain

import com.retra.shared.domain.DomainEvent

sealed class ActionItemEvent : DomainEvent {
    data class ActionItemCreated(
        val actionItemId: String,
        val boardSlug: String,
        val boardId: String
    ) : ActionItemEvent()

    data class ActionItemUpdated(
        val actionItemId: String,
        val boardSlug: String
    ) : ActionItemEvent()

    data class ActionItemStatusChanged(
        val actionItemId: String,
        val boardSlug: String,
        val newStatus: ActionItemStatus
    ) : ActionItemEvent()

    data class ActionItemDeleted(
        val actionItemId: String,
        val boardSlug: String
    ) : ActionItemEvent()
}
```

**Step 3: ActionItem エンティティ作成**

既存の Memo.kt パターンに準拠:
- `open class` + `@Entity` + `@Table`
- `@Transient _domainEvents` リスト
- ファクトリメソッド `companion object { fun create(...) }`
- ビジネスロジック: `update()`, `changeStatus()`, `canBeModifiedBy()`

```kotlin
// ActionItem.kt
package com.retra.actionitem.domain

import com.retra.board.domain.Board
import com.retra.board.domain.Participant
import com.retra.card.domain.Card
import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "action_items")
open class ActionItem(
    @Id
    open var id: String = UUID.randomUUID().toString(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    open var board: Board? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id")
    open var card: Card? = null,

    @Column(nullable = false)
    open var content: String = "",

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    open var assignee: Participant? = null,

    @Column(name = "due_date")
    open var dueDate: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    open var status: ActionItemStatus = ActionItemStatus.OPEN,

    @Column(name = "sort_order", nullable = false)
    open var sortOrder: Int = 0,

    @Column(name = "created_at", nullable = false)
    open var createdAt: String = Instant.now().toString(),

    @Column(name = "updated_at", nullable = false)
    open var updatedAt: String = Instant.now().toString()
) {
    @Transient
    private val _domainEvents: MutableList<ActionItemEvent> = mutableListOf()

    fun getDomainEvents(): List<ActionItemEvent> = _domainEvents.toList()
    fun clearDomainEvents() = _domainEvents.clear()

    fun update(content: String, assigneeId: String?, dueDate: String?, participantId: String) {
        if (!canBeModifiedBy(participantId)) {
            throw com.retra.shared.domain.ForbiddenException("権限がありません")
        }
        this.content = content
        this.dueDate = dueDate
        this.updatedAt = Instant.now().toString()
        _domainEvents.add(
            ActionItemEvent.ActionItemUpdated(
                actionItemId = id,
                boardSlug = board?.slug?.value ?: ""
            )
        )
    }

    fun changeStatus(newStatus: ActionItemStatus, participantId: String) {
        if (!canBeModifiedBy(participantId)) {
            throw com.retra.shared.domain.ForbiddenException("権限がありません")
        }
        this.status = newStatus
        this.updatedAt = Instant.now().toString()
        _domainEvents.add(
            ActionItemEvent.ActionItemStatusChanged(
                actionItemId = id,
                boardSlug = board?.slug?.value ?: "",
                newStatus = newStatus
            )
        )
    }

    fun canBeModifiedBy(participantId: String): Boolean {
        val boardParticipants = board?.participants ?: return false
        val participant = boardParticipants.find { it.id == participantId } ?: return false
        return participant.isFacilitator || assignee?.id == participantId
    }

    fun canBeDeletedBy(participantId: String): Boolean = canBeModifiedBy(participantId)

    companion object {
        fun create(
            board: Board,
            card: Card?,
            content: String,
            assignee: Participant?,
            dueDate: String?,
            sortOrder: Int
        ): ActionItem {
            val actionItem = ActionItem(
                board = board,
                card = card,
                content = content,
                assignee = assignee,
                dueDate = dueDate,
                sortOrder = sortOrder
            )
            actionItem._domainEvents.add(
                ActionItemEvent.ActionItemCreated(
                    actionItemId = actionItem.id,
                    boardSlug = board.slug.value,
                    boardId = board.id
                )
            )
            return actionItem
        }
    }
}
```

**Step 4: ActionItemRepository 作成**

```kotlin
// ActionItemRepository.kt
package com.retra.actionitem.domain

interface ActionItemRepository {
    fun save(actionItem: ActionItem): ActionItem
    fun findById(id: String): ActionItem?
    fun findByBoardId(boardId: String): List<ActionItem>
    fun delete(actionItem: ActionItem)
    fun countByBoardId(boardId: String): Int
}
```

**Step 5: ドメインテスト作成・実行**

```kotlin
// ActionItemTest.kt - ActionItemエンティティの単体テスト
// テスト内容:
// - create(): イベント発行確認
// - update(): コンテンツ更新 + イベント
// - changeStatus(): ステータス遷移 + イベント
// - canBeModifiedBy(): ファシリテーター/担当者の権限チェック
// - canBeDeletedBy(): 削除権限チェック
```

Run: `cd backend && ./gradlew test --tests 'com.retra.actionitem.domain.*' -x jacocoTestCoverageVerification`
Expected: PASS

**Step 6: コミット**

```bash
git add backend/src/main/kotlin/com/retra/actionitem/domain/
git add backend/src/test/kotlin/com/retra/actionitem/domain/
git commit -m "feat: アクションアイテム ドメイン層を追加"
```

---

### Task 3: ActionItem ユースケース層

**Files:**
- Create: `backend/src/main/kotlin/com/retra/actionitem/usecase/ActionItemDtos.kt`
- Create: `backend/src/main/kotlin/com/retra/actionitem/usecase/ActionItemMapper.kt`
- Create: `backend/src/main/kotlin/com/retra/actionitem/usecase/CreateActionItemUseCase.kt`
- Create: `backend/src/main/kotlin/com/retra/actionitem/usecase/UpdateActionItemUseCase.kt`
- Create: `backend/src/main/kotlin/com/retra/actionitem/usecase/UpdateActionItemStatusUseCase.kt`
- Create: `backend/src/main/kotlin/com/retra/actionitem/usecase/DeleteActionItemUseCase.kt`
- Create: `backend/src/main/kotlin/com/retra/actionitem/usecase/GetActionItemsUseCase.kt`
- Test: `backend/src/test/kotlin/com/retra/actionitem/usecase/CreateActionItemUseCaseTest.kt`
- Test: `backend/src/test/kotlin/com/retra/actionitem/usecase/UpdateActionItemUseCaseTest.kt`
- Test: `backend/src/test/kotlin/com/retra/actionitem/usecase/UpdateActionItemStatusUseCaseTest.kt`
- Test: `backend/src/test/kotlin/com/retra/actionitem/usecase/DeleteActionItemUseCaseTest.kt`
- Modify: `backend/src/test/kotlin/com/retra/TestFixtures.kt` - `actionItem()` ビルダー追加

**Step 1: DTOs 作成**

```kotlin
// ActionItemDtos.kt
package com.retra.actionitem.usecase

data class CreateActionItemRequest(
    val content: String,
    val participantId: String,
    val cardId: String? = null,
    val assigneeId: String? = null,
    val dueDate: String? = null
)

data class UpdateActionItemRequest(
    val content: String,
    val participantId: String,
    val assigneeId: String? = null,
    val dueDate: String? = null
)

data class UpdateActionItemStatusRequest(
    val status: String,
    val participantId: String
)

data class DeleteActionItemRequest(
    val participantId: String
)

data class ActionItemResponse(
    val id: String,
    val boardId: String,
    val cardId: String?,
    val content: String,
    val assigneeId: String?,
    val assigneeNickname: String?,
    val dueDate: String?,
    val status: String,
    val sortOrder: Int,
    val createdAt: String,
    val updatedAt: String
)
```

**Step 2: Mapper 作成**

```kotlin
// ActionItemMapper.kt
package com.retra.actionitem.usecase

import com.retra.actionitem.domain.ActionItem

object ActionItemMapper {
    fun toResponse(actionItem: ActionItem): ActionItemResponse {
        return ActionItemResponse(
            id = actionItem.id,
            boardId = actionItem.board?.id ?: "",
            cardId = actionItem.card?.id,
            content = actionItem.content,
            assigneeId = actionItem.assignee?.id,
            assigneeNickname = actionItem.assignee?.nickname,
            dueDate = actionItem.dueDate,
            status = actionItem.status.name,
            sortOrder = actionItem.sortOrder,
            createdAt = actionItem.createdAt,
            updatedAt = actionItem.updatedAt
        )
    }
}
```

**Step 3: UseCases 作成 (各 @Service, @Transactional)**

CreateMemoUseCase パターンに準拠:
- バリデーション: フェーズチェック（ACTION_ITEMS / CLOSEDは作成不可）、空チェック、長さチェック
- 処理フロー: ボード取得 → 検証 → create → save → eventPublish → clearEvents → return DTO

**Step 4: TestFixtures に actionItem() 追加**

```kotlin
fun actionItem(
    board: Board = board(),
    card: Card? = null,
    content: String = "サンプルアクションアイテム",
    assignee: Participant? = null,
    dueDate: String? = null,
    status: ActionItemStatus = ActionItemStatus.OPEN,
    sortOrder: Int = 0
): ActionItem { ... }
```

**Step 5: ユースケーステスト作成・実行**

各UseCaseについて正常系・異常系テスト（MockK使用）:
- CreateActionItemUseCase: 正常作成、不正フェーズ、空コンテンツ
- UpdateActionItemUseCase: 正常更新、権限エラー
- UpdateActionItemStatusUseCase: OPEN→IN_PROGRESS→DONE
- DeleteActionItemUseCase: 正常削除、権限エラー

Run: `cd backend && ./gradlew test --tests 'com.retra.actionitem.usecase.*' -x jacocoTestCoverageVerification`
Expected: PASS

**Step 6: コミット**

```bash
git add backend/src/main/kotlin/com/retra/actionitem/usecase/
git add backend/src/test/kotlin/com/retra/actionitem/usecase/
git add backend/src/test/kotlin/com/retra/TestFixtures.kt
git commit -m "feat: アクションアイテム ユースケース層を追加"
```

---

### Task 4: ActionItem ゲートウェイ層（Controller + JPA）

**Files:**
- Create: `backend/src/main/kotlin/com/retra/actionitem/gateway/controller/ActionItemController.kt`
- Create: `backend/src/main/kotlin/com/retra/actionitem/gateway/db/SpringDataActionItemRepository.kt`
- Create: `backend/src/main/kotlin/com/retra/actionitem/gateway/db/JpaActionItemRepository.kt`
- Modify: `backend/src/main/kotlin/com/retra/shared/gateway/websocket/DomainEventBroadcaster.kt` - ActionItemEvent ハンドラー追加
- Modify: `backend/src/main/kotlin/com/retra/board/domain/Phase.kt` - `canCreateActionItem()` メソッド追加
- Test: `backend/src/test/kotlin/com/retra/actionitem/gateway/controller/ActionItemControllerTest.kt`
- Modify: `backend/build.gradle.kts` - JaCoCo除外に `actionitem/gateway/db/**` 追加

**Step 1: Phase.kt にアクションアイテム権限メソッド追加**

```kotlin
fun canCreateActionItem(): Boolean = this == ACTION_ITEMS
fun canModifyActionItem(): Boolean = this == ACTION_ITEMS
```

**Step 2: Spring Data インターフェース作成**

```kotlin
// SpringDataActionItemRepository.kt
interface SpringDataActionItemRepository : JpaRepository<ActionItem, String> {
    fun findByBoardIdOrderBySortOrder(boardId: String): List<ActionItem>
    fun countByBoardId(boardId: String): Int
}
```

**Step 3: JPA アダプター作成**

```kotlin
// JpaActionItemRepository.kt
@Repository
class JpaActionItemRepository(
    private val springDataRepo: SpringDataActionItemRepository
) : ActionItemRepository { ... }
```

**Step 4: REST コントローラー作成**

```kotlin
// ActionItemController.kt
@RestController
@RequestMapping("/api/v1/boards/{slug}/action-items")
class ActionItemController(
    private val createUseCase: CreateActionItemUseCase,
    private val updateUseCase: UpdateActionItemUseCase,
    private val updateStatusUseCase: UpdateActionItemStatusUseCase,
    private val deleteUseCase: DeleteActionItemUseCase,
    private val getUseCase: GetActionItemsUseCase
) {
    @GetMapping
    fun getActionItems(@PathVariable slug: String): List<ActionItemResponse>

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createActionItem(@PathVariable slug: String, @RequestBody request: CreateActionItemRequest): ActionItemResponse

    @PutMapping("/{id}")
    fun updateActionItem(@PathVariable slug: String, @PathVariable id: String, @RequestBody request: UpdateActionItemRequest): ActionItemResponse

    @PatchMapping("/{id}/status")
    fun updateStatus(@PathVariable slug: String, @PathVariable id: String, @RequestBody request: UpdateActionItemStatusRequest): ActionItemResponse

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteActionItem(@PathVariable slug: String, @PathVariable id: String, @RequestBody request: DeleteActionItemRequest)
}
```

**Step 5: DomainEventBroadcaster に ActionItemEvent ハンドラー追加**

```kotlin
@EventListener
fun handleActionItemEvent(event: ActionItemEvent) {
    when (event) {
        is ActionItemEvent.ActionItemCreated -> send("/topic/board/${event.boardSlug}/action-items", "ACTION_ITEM_CREATED", event)
        is ActionItemEvent.ActionItemUpdated -> send("/topic/board/${event.boardSlug}/action-items", "ACTION_ITEM_UPDATED", event)
        is ActionItemEvent.ActionItemStatusChanged -> send("/topic/board/${event.boardSlug}/action-items", "ACTION_ITEM_STATUS_CHANGED", event)
        is ActionItemEvent.ActionItemDeleted -> send("/topic/board/${event.boardSlug}/action-items", "ACTION_ITEM_DELETED", event)
    }
}
```

**Step 6: JaCoCo 除外設定更新**

`build.gradle.kts` の JaCoCo classDirectories excludes に `"com/retra/actionitem/gateway/db/**"` 追加

**Step 7: コントローラーテスト作成・実行**

```kotlin
// @WebMvcTest(ActionItemController::class)
// @MockBean で各UseCaseをモック
// GET → 200, POST → 201, PUT → 200, PATCH → 200, DELETE → 204
```

Run: `cd backend && ./gradlew test --tests 'com.retra.actionitem.*' -x jacocoTestCoverageVerification`
Expected: PASS

**Step 8: バックエンド全テスト実行**

Run: `cd backend && ./gradlew test`
Expected: BUILD SUCCESSFUL

**Step 9: コミット**

```bash
git add backend/src/main/kotlin/com/retra/actionitem/gateway/
git add backend/src/main/kotlin/com/retra/shared/gateway/websocket/DomainEventBroadcaster.kt
git add backend/src/main/kotlin/com/retra/board/domain/Phase.kt
git add backend/src/test/kotlin/com/retra/actionitem/gateway/
git add backend/build.gradle.kts
git commit -m "feat: アクションアイテム ゲートウェイ層（REST API + JPA + WebSocket）を追加"
```

---

### Task 5: フロントエンド型定義 + APIクライアント

**Files:**
- Modify: `frontend/src/types/index.ts` - ActionItem型、イベントペイロード型追加
- Modify: `frontend/src/api/client.ts` - ActionItem API メソッド追加
- Test: `frontend/src/api/client.test.ts` に追加テスト

**Step 1: types/index.ts に型追加**

```typescript
export type ActionItemStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE';

export interface ActionItem {
  id: string;
  boardId: string;
  cardId: string | null;
  content: string;
  assigneeId: string | null;
  assigneeNickname: string | null;
  dueDate: string | null;
  status: ActionItemStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActionItemDeletedPayload {
  actionItemId: string;
}

export interface ActionItemStatusChangedPayload {
  actionItemId: string;
  boardSlug: string;
  newStatus: ActionItemStatus;
}
```

**Step 2: api/client.ts に API メソッド追加**

```typescript
getActionItems(slug: string): Promise<ActionItem[]>,
createActionItem(slug: string, content: string, participantId: string, cardId?: string, assigneeId?: string, dueDate?: string): Promise<ActionItem>,
updateActionItem(slug: string, id: string, content: string, participantId: string, assigneeId?: string, dueDate?: string): Promise<ActionItem>,
updateActionItemStatus(slug: string, id: string, status: ActionItemStatus, participantId: string): Promise<ActionItem>,
deleteActionItem(slug: string, id: string, participantId: string): Promise<void>,
```

**Step 3: テスト実行**

Run: `cd frontend && npm run test -- --run src/api/client.test.ts`
Expected: PASS

**Step 4: コミット**

```bash
git add frontend/src/types/index.ts frontend/src/api/client.ts frontend/src/api/client.test.ts
git commit -m "feat: アクションアイテム フロントエンド型定義とAPIクライアントを追加"
```

---

### Task 6: Zustand ストア + WebSocket 更新

**Files:**
- Modify: `frontend/src/store/boardStore.ts` - ActionItem ステート + ハンドラー追加
- Modify: `frontend/src/websocket/useWebSocket.ts` - action-items トピック subscribe 追加
- Test: `frontend/src/store/boardStore.test.ts` に追加テスト

**Step 1: boardStore.ts に ActionItem 管理追加**

```typescript
// State に追加
actionItems: ActionItem[];

// Setters に追加
setActionItems: (items: ActionItem[]) => void;

// Handlers に追加
handleActionItemCreated: (item: ActionItem) => void;
handleActionItemUpdated: (item: ActionItem) => void;
handleActionItemStatusChanged: (payload: ActionItemStatusChangedPayload) => void;
handleActionItemDeleted: (payload: ActionItemDeletedPayload) => void;
```

**Step 2: useWebSocket.ts に action-items トピック追加**

```typescript
client.subscribe(`/topic/board/${slug}/action-items`, (message) => {
  const data: WebSocketMessage = JSON.parse(message.body);
  switch (data.type) {
    case 'ACTION_ITEM_CREATED': handleActionItemCreated(data.payload as ActionItem); break;
    case 'ACTION_ITEM_UPDATED': handleActionItemUpdated(data.payload as ActionItem); break;
    case 'ACTION_ITEM_STATUS_CHANGED': handleActionItemStatusChanged(data.payload as ActionItemStatusChangedPayload); break;
    case 'ACTION_ITEM_DELETED': handleActionItemDeleted(data.payload as ActionItemDeletedPayload); break;
  }
});
```

**Step 3: テスト実行**

Run: `cd frontend && npm run test -- --run src/store/boardStore.test.ts`
Expected: PASS

**Step 4: コミット**

```bash
git add frontend/src/store/boardStore.ts frontend/src/websocket/useWebSocket.ts
git add frontend/src/store/boardStore.test.ts
git commit -m "feat: アクションアイテム Zustandストアとwebsocketハンドラーを追加"
```

---

### Task 7: フロントエンド コンポーネント

**Files:**
- Create: `frontend/src/components/ActionItemStatusBadge.tsx`
- Create: `frontend/src/components/ActionItemCard.tsx`
- Create: `frontend/src/components/ActionItemForm.tsx`
- Create: `frontend/src/components/ActionItemList.tsx`
- Modify: `frontend/src/components/BoardView.tsx` - ActionItemList セクション追加
- Modify: `frontend/src/components/CardItem.tsx` - 「アクションアイテムに変換」ボタン追加
- Test: `frontend/src/components/ActionItemStatusBadge.test.tsx`
- Test: `frontend/src/components/ActionItemCard.test.tsx`
- Test: `frontend/src/components/ActionItemForm.test.tsx`
- Test: `frontend/src/components/ActionItemList.test.tsx`
- Modify: `frontend/src/test/fixtures.ts` - `createActionItem()` ファクトリ追加

**Step 1: テストフィクスチャ更新**

```typescript
export function createActionItem(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id: 'action-item-1',
    boardId: 'board-1',
    cardId: null,
    content: 'サンプルアクションアイテム',
    assigneeId: null,
    assigneeNickname: null,
    dueDate: null,
    status: 'OPEN',
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
```

**Step 2: ActionItemStatusBadge コンポーネント**

ステータスに応じた色付きバッジ:
- OPEN: 青 (`bg-blue-100 text-blue-800`)
- IN_PROGRESS: 黄 (`bg-yellow-100 text-yellow-800`)
- DONE: 緑 (`bg-green-100 text-green-800`)

**Step 3: ActionItemCard コンポーネント**

MemoItem パターンに準拠:
- 表示: コンテンツ、ステータスバッジ、担当者名、期限
- 編集モード切り替え（`editing` state）
- ステータス変更ドロップダウン
- 権限ベースの操作ボタン（`group-hover:opacity-100`）

**Step 4: ActionItemForm コンポーネント**

MemoForm パターンに準拠:
- テキスト入力 + 担当者選択（participants ドロップダウン）+ 期限入力
- Enter送信、Shift+Enter改行
- Toast通知エラーハンドリング

**Step 5: ActionItemList コンポーネント**

MemoList パターンに準拠:
- フェーズベースの表示制御（ACTION_ITEMS / CLOSED）
- ActionItemCard + ActionItemForm 組み合わせ
- ステータス別の3セクション表示（Open / In Progress / Done）

**Step 6: BoardView.tsx に ActionItemList 追加**

カラム表示の下にアクションアイテムセクションを追加（ACTION_ITEMS / CLOSEDフェーズ時）

**Step 7: CardItem.tsx に「アクションアイテムに変換」ボタン追加**

DISCUSSIONフェーズ以降で `ListTodo` アイコンボタンを追加

**Step 8: 各コンポーネントテスト作成・実行**

Run: `cd frontend && npm run test -- --run`
Expected: PASS

**Step 9: コミット**

```bash
git add frontend/src/components/ActionItem*.tsx
git add frontend/src/components/ActionItem*.test.tsx
git add frontend/src/components/BoardView.tsx
git add frontend/src/components/CardItem.tsx
git add frontend/src/test/fixtures.ts
git commit -m "feat: アクションアイテム フロントエンドコンポーネントを追加"
```

---

### Task 8: フェーズ1 統合テスト + E2E

**Files:**
- Create: `frontend/e2e/action-item-operations.spec.ts`

**Step 1: E2Eテスト作成**

memo-operations.spec.ts パターンに準拠:
- ヘルパー関数: `createBoardAndJoin()`, `advanceToPhase('ACTION_ITEMS')`, `addActionItem()`
- テストスイート:
  1. CRUD操作（作成、編集、ステータス変更、削除）
  2. フェーズアクセス制御（ACTION_ITEMSフェーズでのみ作成可能）
  3. カードからの変換
  4. 担当者・期限の設定

**Step 2: E2Eテスト実行**

Run: `cd frontend && npx playwright test e2e/action-item-operations.spec.ts --workers=1`
Expected: PASS

**Step 3: フロントエンド全テスト実行**

Run: `cd frontend && npm run test -- --run`
Expected: PASS

**Step 4: TypeScript型チェック**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors

**Step 5: コミット**

```bash
git add frontend/e2e/action-item-operations.spec.ts
git commit -m "test(e2e): アクションアイテム操作のE2Eテストを追加"
```

---

## フェーズ2: レトロ履歴・ダッシュボード

### Task 9: Flyway マイグレーション V10

**Files:**
- Create: `backend/src/main/resources/db/migration/V10__create_board_snapshots.sql`

**Step 1: マイグレーションSQL作成**

```sql
CREATE TABLE board_snapshots (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    team_name TEXT NOT NULL,
    framework TEXT NOT NULL,
    closed_at TEXT NOT NULL,
    total_cards INTEGER NOT NULL DEFAULT 0,
    total_votes INTEGER NOT NULL DEFAULT 0,
    total_participants INTEGER NOT NULL DEFAULT 0,
    action_items_total INTEGER NOT NULL DEFAULT 0,
    action_items_done INTEGER NOT NULL DEFAULT 0,
    snapshot_data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE INDEX idx_board_snapshots_board_id ON board_snapshots(board_id);
CREATE INDEX idx_board_snapshots_team_name ON board_snapshots(team_name);
```

**Step 2: コミット**

```bash
git add backend/src/main/resources/db/migration/V10__create_board_snapshots.sql
git commit -m "feat: ボードスナップショットテーブルのマイグレーション追加 (V10)"
```

---

### Task 10: History ドメイン層

**Files:**
- Create: `backend/src/main/kotlin/com/retra/history/domain/BoardSnapshot.kt`
- Create: `backend/src/main/kotlin/com/retra/history/domain/BoardSnapshotRepository.kt`
- Create: `backend/src/main/kotlin/com/retra/history/domain/HistoryEvent.kt`
- Test: `backend/src/test/kotlin/com/retra/history/domain/BoardSnapshotTest.kt`

**Step 1: BoardSnapshot エンティティ**

```kotlin
@Entity
@Table(name = "board_snapshots")
open class BoardSnapshot(
    @Id open var id: String = UUID.randomUUID().toString(),
    @Column(name = "board_id", nullable = false) open var boardId: String = "",
    @Column(name = "team_name", nullable = false) open var teamName: String = "",
    @Column(nullable = false) open var framework: String = "",
    @Column(name = "closed_at", nullable = false) open var closedAt: String = "",
    @Column(name = "total_cards", nullable = false) open var totalCards: Int = 0,
    @Column(name = "total_votes", nullable = false) open var totalVotes: Int = 0,
    @Column(name = "total_participants", nullable = false) open var totalParticipants: Int = 0,
    @Column(name = "action_items_total", nullable = false) open var actionItemsTotal: Int = 0,
    @Column(name = "action_items_done", nullable = false) open var actionItemsDone: Int = 0,
    @Column(name = "snapshot_data", nullable = false) open var snapshotData: String = "{}",
    @Column(name = "created_at", nullable = false) open var createdAt: String = Instant.now().toString()
)
```

**Step 2: BoardSnapshotRepository インターフェース**

```kotlin
interface BoardSnapshotRepository {
    fun save(snapshot: BoardSnapshot): BoardSnapshot
    fun findById(id: String): BoardSnapshot?
    fun findByTeamNameOrderByClosedAtDesc(teamName: String): List<BoardSnapshot>
    fun findAll(): List<BoardSnapshot>
}
```

**Step 3: テスト作成・実行・コミット**

Run: `cd backend && ./gradlew test --tests 'com.retra.history.domain.*' -x jacocoTestCoverageVerification`

```bash
git add backend/src/main/kotlin/com/retra/history/
git add backend/src/test/kotlin/com/retra/history/
git commit -m "feat: ボードスナップショット ドメイン層を追加"
```

---

### Task 11: History ユースケース層

**Files:**
- Create: `backend/src/main/kotlin/com/retra/history/usecase/SnapshotDtos.kt`
- Create: `backend/src/main/kotlin/com/retra/history/usecase/SnapshotMapper.kt`
- Create: `backend/src/main/kotlin/com/retra/history/usecase/CreateSnapshotUseCase.kt`
- Create: `backend/src/main/kotlin/com/retra/history/usecase/GetSnapshotUseCase.kt`
- Create: `backend/src/main/kotlin/com/retra/history/usecase/GetTeamHistoryUseCase.kt`
- Modify: `backend/src/main/kotlin/com/retra/board/usecase/TransitionPhaseUseCase.kt` - CLOSED遷移時にスナップショット自動作成
- Test: `backend/src/test/kotlin/com/retra/history/usecase/CreateSnapshotUseCaseTest.kt`
- Test: `backend/src/test/kotlin/com/retra/history/usecase/GetTeamHistoryUseCaseTest.kt`

**Step 1: SnapshotDtos**

```kotlin
data class SnapshotSummaryResponse(
    val id: String,
    val teamName: String,
    val framework: String,
    val closedAt: String,
    val totalCards: Int,
    val totalVotes: Int,
    val totalParticipants: Int,
    val actionItemsTotal: Int,
    val actionItemsDone: Int
)

data class SnapshotDetailResponse(
    val id: String,
    val teamName: String,
    val framework: String,
    val closedAt: String,
    val totalCards: Int,
    val totalVotes: Int,
    val totalParticipants: Int,
    val actionItemsTotal: Int,
    val actionItemsDone: Int,
    val snapshotData: String // JSON文字列
)

data class TrendDataResponse(
    val snapshots: List<TrendPoint>
)

data class TrendPoint(
    val closedAt: String,
    val totalCards: Int,
    val totalVotes: Int,
    val totalParticipants: Int,
    val actionItemsTotal: Int,
    val actionItemsDone: Int,
    val actionItemCompletionRate: Double
)
```

**Step 2: CreateSnapshotUseCase**

Board + Cards + Votes + ActionItems を集約し、JSON化してスナップショット保存

**Step 3: TransitionPhaseUseCase 修正**

```kotlin
// CLOSED遷移時にスナップショット自動作成
if (request.phase == "CLOSED") {
    createSnapshotUseCase.execute(board)
}
```

**Step 4: テスト実行・コミット**

Run: `cd backend && ./gradlew test --tests 'com.retra.history.*' -x jacocoTestCoverageVerification`

```bash
git add backend/src/main/kotlin/com/retra/history/usecase/
git add backend/src/main/kotlin/com/retra/board/usecase/TransitionPhaseUseCase.kt
git add backend/src/test/kotlin/com/retra/history/
git commit -m "feat: スナップショット ユースケース層を追加（CLOSED遷移時自動保存）"
```

---

### Task 12: History ゲートウェイ層

**Files:**
- Create: `backend/src/main/kotlin/com/retra/history/gateway/controller/HistoryController.kt`
- Create: `backend/src/main/kotlin/com/retra/history/gateway/db/SpringDataBoardSnapshotRepository.kt`
- Create: `backend/src/main/kotlin/com/retra/history/gateway/db/JpaBoardSnapshotRepository.kt`
- Modify: `backend/build.gradle.kts` - JaCoCo除外に `history/gateway/db/**` 追加
- Test: `backend/src/test/kotlin/com/retra/history/gateway/controller/HistoryControllerTest.kt`

**Step 1: History コントローラー**

```kotlin
@RestController
@RequestMapping("/api/v1/history")
class HistoryController(
    private val getSnapshotUseCase: GetSnapshotUseCase,
    private val getTeamHistoryUseCase: GetTeamHistoryUseCase
) {
    @GetMapping
    fun getHistory(@RequestParam teamName: String?): List<SnapshotSummaryResponse>

    @GetMapping("/{snapshotId}")
    fun getSnapshot(@PathVariable snapshotId: String): SnapshotDetailResponse

    @GetMapping("/trends")
    fun getTrends(@RequestParam teamName: String?): TrendDataResponse
}
```

**Step 2: JPA実装、テスト実行、全テスト確認**

Run: `cd backend && ./gradlew test`
Expected: BUILD SUCCESSFUL

**Step 3: コミット**

```bash
git add backend/src/main/kotlin/com/retra/history/gateway/
git add backend/src/test/kotlin/com/retra/history/gateway/
git add backend/build.gradle.kts
git commit -m "feat: スナップショット ゲートウェイ層（REST API + JPA）を追加"
```

---

### Task 13: フロントエンド ダッシュボード型定義 + API + Recharts導入

**Files:**
- Modify: `frontend/src/types/index.ts` - Snapshot型追加
- Modify: `frontend/src/api/client.ts` - History API メソッド追加
- Modify: `frontend/package.json` - recharts 追加

**Step 1: recharts インストール**

Run: `cd frontend && npm install recharts`

**Step 2: 型定義追加**

```typescript
export interface SnapshotSummary {
  id: string;
  teamName: string;
  framework: Framework;
  closedAt: string;
  totalCards: number;
  totalVotes: number;
  totalParticipants: number;
  actionItemsTotal: number;
  actionItemsDone: number;
}

export interface SnapshotDetail extends SnapshotSummary {
  snapshotData: string;
}

export interface TrendPoint {
  closedAt: string;
  totalCards: number;
  totalVotes: number;
  totalParticipants: number;
  actionItemsTotal: number;
  actionItemsDone: number;
  actionItemCompletionRate: number;
}

export interface TrendData {
  snapshots: TrendPoint[];
}
```

**Step 3: API メソッド追加**

```typescript
getHistory(teamName?: string): Promise<SnapshotSummary[]>,
getSnapshot(snapshotId: string): Promise<SnapshotDetail>,
getTrends(teamName?: string): Promise<TrendData>,
```

**Step 4: コミット**

```bash
git add frontend/src/types/index.ts frontend/src/api/client.ts frontend/package.json frontend/package-lock.json
git commit -m "feat: ダッシュボード型定義・APIクライアント・recharts導入"
```

---

### Task 14: ダッシュボード ページ + コンポーネント

**Files:**
- Create: `frontend/src/pages/TeamDashboardPage.tsx`
- Create: `frontend/src/pages/SnapshotDetailPage.tsx`
- Create: `frontend/src/components/RetroHistoryList.tsx`
- Create: `frontend/src/components/RetroSummaryCard.tsx`
- Create: `frontend/src/components/TrendChart.tsx`
- Create: `frontend/src/components/SnapshotDetailView.tsx`
- Modify: `frontend/src/App.tsx` - ダッシュボードルート追加
- Modify: `frontend/src/pages/HomePage.tsx` - ダッシュボードリンク追加
- Test: 各コンポーネントの .test.tsx
- Test: 各ページの .test.tsx

**Step 1: TeamDashboardPage**

- チーム名入力 or 一覧表示
- RetroHistoryList + TrendChart

**Step 2: TrendChart (Recharts)**

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="closedAt" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="totalCards" stroke="#8884d8" name="カード数" />
        <Line type="monotone" dataKey="actionItemCompletionRate" stroke="#82ca9d" name="AI完了率(%)" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Step 3: App.tsx ルーティング更新**

```tsx
<Route path="/dashboard" element={<TeamDashboardPage />} />
<Route path="/dashboard/:snapshotId" element={<SnapshotDetailPage />} />
```

**Step 4: HomePage にダッシュボードリンク追加**

```tsx
<Link to="/dashboard" className="...">
  <BarChart3 size={20} />
  チームダッシュボード
</Link>
```

**Step 5: 全テスト実行**

Run: `cd frontend && npm run test -- --run`
Expected: PASS

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors

**Step 6: コミット**

```bash
git add frontend/src/pages/TeamDashboardPage.tsx frontend/src/pages/SnapshotDetailPage.tsx
git add frontend/src/pages/*.test.tsx
git add frontend/src/components/RetroHistoryList.tsx frontend/src/components/RetroSummaryCard.tsx
git add frontend/src/components/TrendChart.tsx frontend/src/components/SnapshotDetailView.tsx
git add frontend/src/components/*.test.tsx
git add frontend/src/App.tsx frontend/src/pages/HomePage.tsx
git commit -m "feat: チームダッシュボードページ・コンポーネントを追加"
```

---

### Task 15: フェーズ2 E2Eテスト

**Files:**
- Create: `frontend/e2e/dashboard.spec.ts`

**Step 1: E2Eテスト作成**

テストスイート:
1. ダッシュボードページの表示
2. レトロ履歴の一覧表示（ボード作成→CLOSEDまで遷移→ダッシュボードで確認）
3. スナップショット詳細表示
4. トレンドチャート表示

**Step 2: E2Eテスト実行**

Run: `cd frontend && npx playwright test e2e/dashboard.spec.ts --workers=1`
Expected: PASS

**Step 3: コミット**

```bash
git add frontend/e2e/dashboard.spec.ts
git commit -m "test(e2e): ダッシュボードのE2Eテストを追加"
```

---

### Task 16: CLAUDE.md + ドキュメント更新

**Files:**
- Modify: `CLAUDE.md` - 新モジュール、API、WebSocketイベント、依存ライブラリの反映
- Modify: `docs/CONTRIB.md` - 開発ガイド更新
- Modify: `docs/RUNBOOK.md` - 運用ガイド更新

**Step 1: CLAUDE.md 更新内容**

- `actionitem/` モジュール構造を追記
- `history/` モジュール構造を追記
- REST API テーブルにアクションアイテム・履歴エンドポイント追加
- WebSocket Events にアクションアイテムイベント追加
- Key Dependencies に recharts 追加
- Flyway migrations に V9, V10 追記
- Frontend Structure に新ページ・コンポーネント追記

**Step 2: コミット**

```bash
git add CLAUDE.md docs/CONTRIB.md docs/RUNBOOK.md
git commit -m "docs: アクションアイテム・ダッシュボード機能のドキュメントを更新"
```

---

### Task 17: 最終統合テスト + カバレッジ確認

**Step 1: バックエンド全テスト + カバレッジ**

Run: `cd backend && ./gradlew test`
Expected: BUILD SUCCESSFUL（80%カバレッジ通過）

**Step 2: フロントエンド全テスト + カバレッジ**

Run: `cd frontend && npm run test:coverage`
Expected: 80%以上のカバレッジ

**Step 3: TypeScript型チェック**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors

**Step 4: ESLint**

Run: `cd frontend && npm run lint`
Expected: 0 errors

**Step 5: E2E全テスト**

Run: `cd frontend && npx playwright test --workers=1`
Expected: 全テストPASS
