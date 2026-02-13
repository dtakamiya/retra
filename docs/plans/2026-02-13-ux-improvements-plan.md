# UX改善バンドル 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 議論済みマーク、投票ビジュアル化、匿名投稿、AI優先度の4つのUX改善を実装する

**Architecture:** 4機能は互いに独立。V11マイグレーションで全DBスキーマ変更を一括適用。各機能はバックエンド→フロントエンドの順に実装。既存のモジュラーモノリス＋クリーンアーキテクチャパターンに従う。

**Tech Stack:** Spring Boot 3.4 + Kotlin, React 19 + TypeScript + Zustand, SQLite + Flyway, WebSocket (STOMP), TailwindCSS v4, Lucide React

---

### Task 1: V11マイグレーション（全DBスキーマ変更）

**Files:**
- Create: `backend/src/main/resources/db/migration/V11__add_ux_improvements.sql`

**Step 1: マイグレーションファイル作成**

```sql
-- 議論済みマーク + 議論順序
ALTER TABLE cards ADD COLUMN is_discussed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cards ADD COLUMN discussion_order INTEGER NOT NULL DEFAULT 0;

-- 匿名モード
ALTER TABLE boards ADD COLUMN is_anonymous INTEGER NOT NULL DEFAULT 0;

-- アクションアイテム優先度
ALTER TABLE action_items ADD COLUMN priority TEXT NOT NULL DEFAULT 'MEDIUM';
```

**Step 2: バックエンドテスト実行で確認**

Run: `cd backend && JAVA_HOME=/Users/takamiyadaisuke/Library/Java/JavaVirtualMachines/corretto-21.0.2/Contents/Home ./gradlew test --tests "*CreateBoardUseCaseTest*" -q`
Expected: PASS（既存テストが壊れていないことを確認）

**Step 3: コミット**

```bash
git add backend/src/main/resources/db/migration/V11__add_ux_improvements.sql
git commit -m "feat: UX改善のマイグレーション追加 (V11)"
```

---

### Task 2: 議論済みマーク - バックエンドドメイン層

**Files:**
- Modify: `backend/src/main/kotlin/com/retra/card/domain/Card.kt`
- Modify: `backend/src/main/kotlin/com/retra/card/domain/CardEvent.kt`
- Modify: `backend/src/main/kotlin/com/retra/board/domain/Phase.kt`
- Create: `backend/src/test/kotlin/com/retra/card/domain/CardDiscussionTest.kt`

**Step 1: Card エンティティにフィールド追加**

`Card.kt` の `updatedAt` フィールドの後（45行目付近）に追加:

```kotlin
@Column(name = "is_discussed", nullable = false)
open var isDiscussed: Boolean = false

@Column(name = "discussion_order", nullable = false)
open var discussionOrder: Int = 0
```

`markAsDiscussed()` / `unmarkAsDiscussed()` メソッドを追加:

```kotlin
fun markAsDiscussed(): CardEvent.CardDiscussionMarked {
    this.isDiscussed = true
    this.updatedAt = java.time.Instant.now().toString()
    return CardEvent.CardDiscussionMarked(
        boardSlug = board!!.slug,
        cardId = id,
        isDiscussed = true
    )
}

fun unmarkAsDiscussed(): CardEvent.CardDiscussionMarked {
    this.isDiscussed = false
    this.updatedAt = java.time.Instant.now().toString()
    return CardEvent.CardDiscussionMarked(
        boardSlug = board!!.slug,
        cardId = id,
        isDiscussed = false
    )
}
```

**Step 2: CardEvent にイベント追加**

`CardEvent.kt` に追加:

```kotlin
data class CardDiscussionMarked(
    override val boardSlug: String,
    val cardId: String,
    val isDiscussed: Boolean
) : CardEvent()
```

**Step 3: Phase に `canMarkDiscussed()` 追加**

`Phase.kt` に追加:

```kotlin
fun canMarkDiscussed(): Boolean = this == DISCUSSION || this == ACTION_ITEMS
```

**Step 4: テスト作成・実行**

```kotlin
// CardDiscussionTest.kt
class CardDiscussionTest {
    @Test
    fun `markAsDiscussed should set isDiscussed to true`() { ... }

    @Test
    fun `unmarkAsDiscussed should set isDiscussed to false`() { ... }
}
```

Run: `cd backend && ./gradlew test --tests "*CardDiscussionTest*" -q`
Expected: PASS

**Step 5: コミット**

```bash
git commit -m "feat: 議論済みマーク ドメイン層を追加"
```

---

### Task 3: 議論済みマーク - バックエンドユースケース+コントローラ層

**Files:**
- Create: `backend/src/main/kotlin/com/retra/card/usecase/MarkCardDiscussedUseCase.kt`
- Modify: `backend/src/main/kotlin/com/retra/card/usecase/CardDtos.kt`
- Modify: `backend/src/main/kotlin/com/retra/card/usecase/CardMapper.kt`
- Modify: `backend/src/main/kotlin/com/retra/card/gateway/controller/CardController.kt`
- Modify: `backend/src/main/kotlin/com/retra/shared/gateway/websocket/DomainEventBroadcaster.kt`
- Create: `backend/src/test/kotlin/com/retra/card/usecase/MarkCardDiscussedUseCaseTest.kt`

**Step 1: DTO更新**

`CardDtos.kt` の `CardResponse` に追加:
```kotlin
val isDiscussed: Boolean,
val discussionOrder: Int,
```

`MarkCardDiscussedRequest` 新規:
```kotlin
data class MarkCardDiscussedRequest(
    val participantId: String,
    val isDiscussed: Boolean
)
```

**Step 2: CardMapper 更新**

`CardMapper.kt` の `toCardResponse` に追加:
```kotlin
isDiscussed = card.isDiscussed,
discussionOrder = card.discussionOrder,
```

**Step 3: MarkCardDiscussedUseCase 作成**

```kotlin
@Service
class MarkCardDiscussedUseCase(
    private val boardRepository: BoardRepository,
    private val cardRepository: CardRepository,
    private val eventPublisher: DomainEventPublisher
) {
    @Transactional
    fun execute(slug: String, cardId: String, request: MarkCardDiscussedRequest): CardResponse {
        val board = boardRepository.findBySlug(slug) ?: throw NotFoundException("Board not found")
        if (!board.phase.canMarkDiscussed()) throw BadRequestException("Cannot mark discussed in ${board.phase}")
        val participant = board.participants.find { it.id == request.participantId }
            ?: throw NotFoundException("Participant not found")
        if (!participant.isFacilitator) throw ForbiddenException("Only facilitator can mark discussed")
        val card = cardRepository.findById(cardId) ?: throw NotFoundException("Card not found")

        val event = if (request.isDiscussed) card.markAsDiscussed() else card.unmarkAsDiscussed()
        cardRepository.save(card)
        eventPublisher.publish(event)
        return CardMapper.toCardResponse(card)
    }
}
```

**Step 4: CardController にエンドポイント追加**

```kotlin
@PatchMapping("/{cardId}/discussed")
fun markDiscussed(
    @PathVariable slug: String,
    @PathVariable cardId: String,
    @RequestBody request: MarkCardDiscussedRequest
): CardResponse {
    return markCardDiscussedUseCase.execute(slug, cardId, request)
}
```

**Step 5: DomainEventBroadcaster にハンドラ追加**

```kotlin
@EventListener
fun handleCardDiscussionMarked(event: CardEvent.CardDiscussionMarked) {
    messagingTemplate.convertAndSend(
        "/topic/board/${event.boardSlug}/cards",
        mapOf("type" to "CARD_DISCUSSION_MARKED", "cardId" to event.cardId, "isDiscussed" to event.isDiscussed)
    )
}
```

**Step 6: テスト作成・実行**

Run: `cd backend && ./gradlew test --tests "*MarkCardDiscussedUseCaseTest*" -q`
Expected: PASS

**Step 7: コミット**

```bash
git commit -m "feat: 議論済みマーク ユースケース+コントローラ層を追加"
```

---

### Task 4: 議論済みマーク - フロントエンド

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/api/client.ts`
- Modify: `frontend/src/store/boardStore.ts`
- Modify: `frontend/src/websocket/useWebSocket.ts`
- Modify: `frontend/src/components/CardItem.tsx`
- Modify: `frontend/src/components/ColumnView.tsx`
- テスト: 各ファイルの既存テストを更新

**Step 1: 型定義追加**

`types/index.ts` の `Card` 型に追加:
```typescript
isDiscussed: boolean;
discussionOrder: number;
```

**Step 2: APIクライアント追加**

`api/client.ts` に追加:
```typescript
markCardDiscussed(slug: string, cardId: string, participantId: string, isDiscussed: boolean): Promise<Card> {
    return request<Card>(`/boards/${slug}/cards/${cardId}/discussed`, {
        method: 'PATCH',
        body: JSON.stringify({ participantId, isDiscussed }),
    });
},
```

**Step 3: Zustandストア更新**

`boardStore.ts` に `handleCardDiscussionMarked` ハンドラ追加:
```typescript
handleCardDiscussionMarked: (data: { cardId: string; isDiscussed: boolean }) =>
    set((state) => ({
        board: state.board ? {
            ...state.board,
            columns: state.board.columns.map((col) => ({
                ...col,
                cards: col.cards.map((c) =>
                    c.id === data.cardId ? { ...c, isDiscussed: data.isDiscussed } : c
                ),
            })),
        } : null,
    })),
```

**Step 4: WebSocket購読追加**

`useWebSocket.ts` の `/topic/board/${slug}/cards` ハンドラに `CARD_DISCUSSION_MARKED` ケース追加。

**Step 5: CardItem に議論済みマークUI追加**

DISCUSSION / ACTION_ITEMSフェーズでファシリテーターに表示するチェックマークボタン。議論済みカードは `opacity-50` でグレーアウト + CheckCircle アイコン。

**Step 6: ColumnView でソート追加**

DISCUSSION以降のフェーズで:
1. 未議論カードを先に表示
2. 投票数の多い順にソート

```typescript
const sortedCards = useMemo(() => {
    if (board && ['DISCUSSION', 'ACTION_ITEMS', 'CLOSED'].includes(board.phase)) {
        return [...cards].sort((a, b) => {
            if (a.isDiscussed !== b.isDiscussed) return a.isDiscussed ? 1 : -1;
            return (b.voteCount ?? 0) - (a.voteCount ?? 0);
        });
    }
    return cards;
}, [cards, board]);
```

**Step 7: テスト実行**

Run: `cd frontend && npm run test -- --run`
Expected: PASS

**Step 8: コミット**

```bash
git commit -m "feat: 議論済みマーク フロントエンドを追加"
```

---

### Task 5: 投票結果ビジュアル化 - フロントエンド

**Files:**
- Modify: `frontend/src/store/boardStore.ts`
- Modify: `frontend/src/components/CardItem.tsx`
- Create: `frontend/src/components/VoteProgressBar.tsx`
- Create: `frontend/src/components/VoteProgressBar.test.tsx`
- テスト: CardItem テスト更新

**Step 1: VoteProgressBar コンポーネント作成**

```typescript
interface Props {
    voteCount: number;
    maxVoteCount: number;
}

export function VoteProgressBar({ voteCount, maxVoteCount }: Props) {
    if (voteCount === 0 || maxVoteCount === 0) return null;
    const percentage = Math.round((voteCount / maxVoteCount) * 100);
    return (
        <div className="w-full h-1 bg-gray-100 rounded-full mt-1.5">
            <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${percentage}%`, opacity: 0.4 + (percentage / 100) * 0.6 }}
            />
        </div>
    );
}
```

**Step 2: boardStore に `myVotedCardIds` 追加**

```typescript
myVotedCardIds: Set<string>;
```

投票/投票取消時にSetを更新。ボード読み込み時に `card.votedParticipantIds` から初期化。

**Step 3: CardItem に統合**

- VOTING以降のフェーズで `VoteProgressBar` を表示
- 自分が投票したカードに左ボーダー（`border-l-3 border-indigo-500`）を表示

**Step 4: テスト実行**

Run: `cd frontend && npm run test -- --run`
Expected: PASS

**Step 5: コミット**

```bash
git commit -m "feat: 投票結果ビジュアル化を追加"
```

---

### Task 6: 匿名投稿 - バックエンドドメイン+ユースケース層

**Files:**
- Modify: `backend/src/main/kotlin/com/retra/board/domain/Board.kt`
- Modify: `backend/src/main/kotlin/com/retra/board/usecase/BoardDtos.kt`
- Modify: `backend/src/main/kotlin/com/retra/board/usecase/BoardMapper.kt`
- Modify: `backend/src/main/kotlin/com/retra/board/usecase/CreateBoardUseCase.kt`
- Modify: `backend/src/main/kotlin/com/retra/card/usecase/CardMapper.kt`
- テスト: 各ユースケーステスト更新

**Step 1: Board エンティティに `isAnonymous` 追加**

`Board.kt` の `maxVotesPerPerson` の後に:
```kotlin
@Column(name = "is_anonymous", nullable = false)
open var isAnonymous: Boolean = false
```

`Board.create()` ファクトリメソッドに `isAnonymous` パラメータ追加。

**Step 2: BoardDtos 更新**

`CreateBoardRequest` に `val isAnonymous: Boolean = false` 追加。
`BoardResponse` に `val isAnonymous: Boolean` 追加。

**Step 3: BoardMapper, CreateBoardUseCase 更新**

マッパーとユースケースに `isAnonymous` を反映。

**Step 4: CardMapper で匿名処理**

`CardMapper.toCardResponse()` に `requesterId` パラメータを追加。匿名ボードで本人以外のカードは `authorNickname = null` に設定:

```kotlin
fun toCardResponse(card: Card, requesterId: String? = null): CardResponse {
    val board = card.board
    val authorNickname = if (board?.isAnonymous == true && card.participant?.id != requesterId) {
        null
    } else {
        card.authorNickname
    }
    // ... rest of mapping with authorNickname
}
```

**Step 5: テスト実行**

Run: `cd backend && ./gradlew test -q`
Expected: PASS

**Step 6: コミット**

```bash
git commit -m "feat: 匿名投稿 バックエンド層を追加"
```

---

### Task 7: 匿名投稿 - フロントエンド

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/api/client.ts`
- Modify: `frontend/src/pages/HomePage.tsx`
- Modify: `frontend/src/components/BoardHeader.tsx`
- Modify: `frontend/src/components/CardItem.tsx`
- テスト: 各コンポーネントテスト更新

**Step 1: 型定義・API更新**

`types/index.ts` の `Board` に `isAnonymous: boolean` 追加。
`api/client.ts` の `createBoard` に `isAnonymous` パラメータ追加。

**Step 2: HomePage にトグル追加**

匿名モードの useState を追加し、ボード作成フォームに `EyeOff` アイコン付きトグルスイッチを追加:

```typescript
const [isAnonymous, setIsAnonymous] = useState(false);
```

**Step 3: BoardHeader に匿名バッジ追加**

`board.isAnonymous` が true の場合、ヘッダーに「匿名モード」バッジ表示:
```tsx
{board.isAnonymous && (
    <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
        <EyeOff size={12} /> 匿名モード
    </span>
)}
```

**Step 4: CardItem で匿名表示**

`authorNickname` が `null` の場合「匿名」とグレーイタリックで表示。

**Step 5: テスト実行**

Run: `cd frontend && npm run test -- --run`
Expected: PASS

**Step 6: コミット**

```bash
git commit -m "feat: 匿名投稿 フロントエンドを追加"
```

---

### Task 8: アクションアイテム優先度 - バックエンド

**Files:**
- Create: `backend/src/main/kotlin/com/retra/actionitem/domain/ActionItemPriority.kt`
- Modify: `backend/src/main/kotlin/com/retra/actionitem/domain/ActionItem.kt`
- Modify: `backend/src/main/kotlin/com/retra/actionitem/usecase/ActionItemDtos.kt`
- Modify: `backend/src/main/kotlin/com/retra/actionitem/usecase/ActionItemMapper.kt`
- テスト: 既存テスト更新

**Step 1: ActionItemPriority enum 作成**

```kotlin
enum class ActionItemPriority {
    HIGH, MEDIUM, LOW
}
```

**Step 2: ActionItem エンティティに `priority` 追加**

```kotlin
@Column(name = "priority", nullable = false)
@Enumerated(EnumType.STRING)
open var priority: ActionItemPriority = ActionItemPriority.MEDIUM
```

`create()` ファクトリメソッドと `update()` メソッドに `priority` パラメータ追加。

**Step 3: DTO + Mapper 更新**

`CreateActionItemRequest`, `UpdateActionItemRequest`, `ActionItemResponse` に `priority` 追加。
`ActionItemMapper` に反映。

**Step 4: テスト実行**

Run: `cd backend && ./gradlew test -q`
Expected: PASS

**Step 5: コミット**

```bash
git commit -m "feat: アクションアイテム優先度 バックエンドを追加"
```

---

### Task 9: アクションアイテム優先度 - フロントエンド

**Files:**
- Modify: `frontend/src/types/index.ts`
- Create: `frontend/src/components/ActionItemPriorityBadge.tsx`
- Create: `frontend/src/components/ActionItemPriorityBadge.test.tsx`
- Modify: `frontend/src/components/ActionItemForm.tsx`
- Modify: `frontend/src/components/ActionItemCard.tsx`
- Modify: `frontend/src/components/ActionItemList.tsx`
- テスト: 既存テスト更新

**Step 1: 型定義追加**

`types/index.ts` に追加:
```typescript
export type ActionItemPriority = 'HIGH' | 'MEDIUM' | 'LOW';
```

`ActionItem` に `priority: ActionItemPriority` 追加。

**Step 2: ActionItemPriorityBadge コンポーネント作成**

HIGH=赤（ArrowUp）、MEDIUM=黄（ArrowRight）、LOW=灰（ArrowDown）のバッジ。

**Step 3: ActionItemForm に優先度セレクト追加**

デフォルト: MEDIUM。

**Step 4: ActionItemCard にバッジ表示**

ステータスバッジの隣に優先度バッジを表示。

**Step 5: ActionItemList で優先度順ソート**

同一ステータス内で HIGH → MEDIUM → LOW の順にソート。

**Step 6: テスト実行**

Run: `cd frontend && npm run test -- --run`
Expected: PASS

**Step 7: コミット**

```bash
git commit -m "feat: アクションアイテム優先度 フロントエンドを追加"
```

---

### Task 10: E2Eテスト

**Files:**
- Create: `frontend/e2e/discussion-mark.spec.ts`
- Create: `frontend/e2e/anonymous-mode.spec.ts`
- Modify: `frontend/e2e/action-item-operations.spec.ts`

**Step 1: 議論済みマーク E2Eテスト**

テストシナリオ:
- DISCUSSIONフェーズでファシリテーターが議論済みマークを付けられる
- 議論済みカードがグレーアウトする
- 非ファシリテーターは議論済みマークを操作できない

**Step 2: 匿名モード E2Eテスト**

テストシナリオ:
- 匿名モードでボード作成
- カードの作成者名が「匿名」と表示される
- 自分のカードは自分に見える
- ヘッダーに匿名モードバッジ表示

**Step 3: アクションアイテム優先度テスト**

既存の `action-item-operations.spec.ts` に追加:
- 優先度を指定してアクションアイテム作成
- 優先度バッジの表示確認

**Step 4: テスト実行**

Run: `cd frontend && npx playwright test --workers=1`
Expected: PASS

**Step 5: コミット**

```bash
git commit -m "test(e2e): UX改善のE2Eテストを追加"
```

---

### Task 11: ドキュメント更新 + 最終統合テスト

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/CONTRIB.md`

**Step 1: CLAUDE.md 更新**

- V11マイグレーション情報追加
- 匿名モード機能の説明追加
- 議論済みマーク機能の説明追加
- アクションアイテム優先度の説明追加

**Step 2: 全テスト実行**

Run: `cd backend && ./gradlew test -q && cd ../frontend && npm run test -- --run && npx tsc --noEmit`
Expected: ALL PASS

**Step 3: コミット**

```bash
git commit -m "docs: UX改善機能のドキュメントを更新"
```
