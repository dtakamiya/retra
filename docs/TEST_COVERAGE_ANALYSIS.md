# テストカバレッジ分析レポート

## 概要

本レポートは Retra プロジェクトのテストカバレッジを静的に分析し、改善すべき領域を特定したものです。

---

## 1. 現状サマリー

| 項目 | バックエンド | フロントエンド |
|------|------------|--------------|
| ソースファイル数 | 86 | 29 |
| テストファイル数 | 43 | 27 |
| ファイル単位カバレッジ | ~50% | ~93% |
| テスト不要ファイル | ~35 (DTO, Event, Interface, Config等) | 2 (main.tsx, types/) |
| **実質カバレッジ** | **~84%** | **~100%** |

---

## 2. バックエンド分析

### 2.1 十分にテストされている領域

- **全 UseCase クラス (13/13)**: ビジネスロジック層は 100% カバー
- **全 Controller クラス (5/5)**: `@WebMvcTest` でテスト済み
- **主要 Domain クラス (6/8)**: `Board`, `BoardSlug`, `BoardColumn`, `Card`, `Memo`, `Phase` 等
- **Domain サービス (1/1)**: `BoardAuthorizationService`
- **Export サービス (2/2)**: `CsvExportService`, `MarkdownExportService`
- **Shared インフラ (3/3)**: `GlobalExceptionHandler`, `SpringDomainEventPublisher`, `DomainEventBroadcaster`

### 2.2 テストが不足している領域

#### P1: 高優先度

##### (a) `CreateBoardUseCase` — テストケース不足 (現在2件のみ)

**ファイル:** `backend/src/test/kotlin/com/retra/board/usecase/CreateBoardUseCaseTest.kt`

**現状:** KPT フレームワークのみテスト。以下が不足:

- [ ] `FUN_DONE_LEARN` フレームワークでカラムが正しく生成されること
- [ ] `FOUR_LS` フレームワークでカラムが正しく生成されること
- [ ] `START_STOP_CONTINUE` フレームワークでカラムが正しく生成されること
- [ ] `maxVotesPerPerson` のデフォルト値テスト
- [ ] カラムの `color` と `sortOrder` の検証

##### (b) `AddVoteUseCase` — 存在しないリソース系テスト不足 (現在4件)

**ファイル:** `backend/src/test/kotlin/com/retra/card/usecase/AddVoteUseCaseTest.kt`

**現状:** 正常系と基本的な異常系はカバー。以下が不足:

- [ ] 存在しないボード (`slug` 不一致) で `NotFoundException`
- [ ] 存在しないカードで `NotFoundException`
- [ ] カードが別のボードに属する場合に `BadRequestException`
- [ ] 存在しない参加者 ID でのエラー

##### (c) `CsvExportService` — 複雑なシナリオのテスト不足 (現在3件)

**ファイル:** `backend/src/test/kotlin/com/retra/board/usecase/export/CsvExportServiceTest.kt`

- [ ] 複数カラム・複数カードのボードでの出力検証
- [ ] 複数種類のリアクションが存在する場合の集計
- [ ] ダブルクォートを含むテキストの RFC4180 準拠エスケープ
- [ ] 日本語テキストの UTF-8 BOM 付きエンコーディング確認

##### (d) Mapper クラス — テストが全くない (0/4)

**対象ファイル:**
- `backend/src/main/kotlin/com/retra/board/usecase/BoardMapper.kt`
- `backend/src/main/kotlin/com/retra/card/usecase/CardMapper.kt`
- `backend/src/main/kotlin/com/retra/card/usecase/MemoMapper.kt`
- `backend/src/main/kotlin/com/retra/card/usecase/ReactionMapper.kt`

**推奨テストケース:**

```
BoardMapperTest:
  - toBoardResponse() でカラムが sortOrder 順にマッピングされること
  - カード内の votes/memos/reactions が正しくマッピングされること
  - toParticipantResponse() でフィールドが正確にマッピングされること

CardMapperTest:
  - toCardResponse() で column が null の場合、columnId が空文字列
  - toCardResponse() で participant が null の場合、participantId が null
  - toVoteResponse() で card/participant が null の場合、空文字列にフォールバック
  - votedParticipantIds の集計が正しいこと

MemoMapperTest:
  - toMemoResponse() で card が null の場合の cardId フォールバック

ReactionMapperTest:
  - toReactionResponse() で card/participant が null の場合のフォールバック
```

#### P2: 中優先度

##### (e) Domain モデル — Vote.kt, Reaction.kt, Participant.kt

**`Vote.kt` / `Reaction.kt`:**
現状ではビジネスロジックは持たない純粋なエンティティだが、JPA の `@UniqueConstraint` が正しく動作するかは統合テストで確認すべき。

**`Participant.kt`:**
`updateOnlineStatus()` メソッドにロジックがある:

- [ ] `online = true` でオンライン状態に変更
- [ ] `online = false` でオフライン状態に変更
- [ ] `newSessionId` 指定時に sessionId が更新される
- [ ] `newSessionId = null` の場合は sessionId が変わらない
- [ ] `board` が null の場合にドメインイベントが発行されない
- [ ] 正常時に `ParticipantOnlineChanged` イベントが発行される

##### (f) `WebSocketController` — テストなし

**ファイル:** `backend/src/main/kotlin/com/retra/board/gateway/websocket/WebSocketController.kt`

- [ ] `registerSession()` が正しく `setSessionId()` を呼ぶこと
- [ ] `headerAccessor.sessionId` が null の場合に何もしないこと (early return)

##### (g) 統合テスト — 存在しない (@DataJpaTest / @SpringBootTest)

以下のリポジトリについて `@DataJpaTest` による統合テストを推奨:

| リポジトリ | テスト対象 |
|-----------|----------|
| `JpaVoteRepository` | `countByParticipantIdAndCardBoardId()` のクロステーブルクエリ正確性 |
| `JpaCardRepository` | `findByColumnIdOrderBySortOrderAsc()` のソート順保証 |
| `JpaReactionRepository` | `findByCardIdAndParticipantIdAndEmoji()` 複合キー検索 |
| `JpaParticipantRepository` | `findBySessionId()` のユニーク性 |
| `JpaBoardRepository` | `findBySlug()` のユニーク性 |

これらはすべてカスタムクエリメソッドを持ち、DB レベルでの動作検証が有益。

#### P3: 低優先度

##### (h) Configuration クラス

`SpaConfig`, `WebConfig`, `WebSocketConfig` は `@SpringBootTest` で起動テストを行うことで
Bean 定義エラーやプロパティバインディングエラーを検知できる。

---

## 3. フロントエンド分析

### 3.1 十分にテストされている領域

- **Zustand ストア**: `boardStore.test.ts` (511行) — 全アクション・全ハンドラーをテスト
- **API クライアント**: `client.test.ts` (364行) — 全エンドポイント + エラーハンドリング
- **WebSocket フック**: `useWebSocket.test.ts` (263行) — 7トピック購読 + 15メッセージタイプ
- **CardItem**: (504行) — 最も複雑なコンポーネントを網羅的にテスト
- **BoardView**: (348行) — フェーズ別表示、DnD 対応
- **E2E テスト**: Playwright 15スイート (2,316行) — 主要ユーザーフロー網羅

### 3.2 テストが不足している領域

#### P1: 高優先度

##### (a) コンポーネント間のエラーハンドリングフロー

API エラー発生時の UI フィードバック（トースト通知）の統合フローがテストされていない。

- [ ] API 呼び出し失敗 → エラーメッセージのトースト表示
- [ ] ネットワークエラー → 再接続バナー表示
- [ ] 認証エラー → 適切なフィードバック

##### (b) `ConnectionBanner` — 最小テスト (11行)

**ファイル:** `frontend/src/components/ConnectionBanner.test.tsx`

現状テキスト存在確認のみ。以下を追加推奨:

- [ ] `WifiOff` アイコンが表示されること
- [ ] スタイリング（背景色、テキスト色）の検証
- [ ] アクセシビリティ属性の確認 (role="alert" 等)

#### P2: 中優先度

##### (c) ローディング状態のテスト

一部コンポーネントで API 呼び出し中のローディング状態のテストが不十分:

- [ ] `BoardPage` のデータ読み込み中のスケルトン/スピナー表示
- [ ] `ExportMenu` のエクスポート処理中の無効化状態 (テスト済みだが確認)
- [ ] `PhaseControl` のフェーズ遷移処理中の状態

##### (d) アクセシビリティテスト

ARIA ラベル、キーボードナビゲーション、スクリーンリーダー対応のテストが体系的に行われていない:

- [ ] フォームコンポーネントの `aria-label`, `aria-describedby`
- [ ] モーダル (`NicknameModal`) のフォーカストラップ
- [ ] キーボードのみでの全操作可能性

##### (e) E2E テストの拡充

現在のE2Eで網羅されていないシナリオ:

- [ ] 複数ブラウザ同時操作での WebSocket リアルタイム同期の堅牢性
- [ ] オフライン→オンライン復帰時のデータ整合性
- [ ] エクスポート機能のファイルダウンロード検証

---

## 4. 優先度別アクションリスト

### 即座に対応 (P1)

| # | 対象 | 種類 | 推定テスト数 |
|---|------|------|------------|
| 1 | `CreateBoardUseCaseTest` の全フレームワーク対応 | バックエンド | +4件 |
| 2 | `AddVoteUseCaseTest` の異常系拡充 | バックエンド | +4件 |
| 3 | `BoardMapperTest` 新規作成 | バックエンド | +3件 |
| 4 | `CardMapperTest` 新規作成 | バックエンド | +4件 |
| 5 | `MemoMapperTest` 新規作成 | バックエンド | +1件 |
| 6 | `ReactionMapperTest` 新規作成 | バックエンド | +1件 |
| 7 | `CsvExportServiceTest` のシナリオ拡充 | バックエンド | +3件 |
| 8 | エラーハンドリング統合フローテスト | フロントエンド | +3件 |

### 次のスプリント (P2)

| # | 対象 | 種類 | 推定テスト数 |
|---|------|------|------------|
| 9 | `ParticipantTest` 新規作成 | バックエンド | +6件 |
| 10 | `WebSocketControllerTest` 新規作成 | バックエンド | +2件 |
| 11 | `@DataJpaTest` 統合テスト (5リポジトリ) | バックエンド | +10件 |
| 12 | フロントエンド アクセシビリティテスト | フロントエンド | +5件 |
| 13 | ローディング状態テスト拡充 | フロントエンド | +3件 |

### 将来の改善 (P3)

| # | 対象 | 種類 |
|---|------|------|
| 14 | `@SpringBootTest` アプリケーション起動テスト | バックエンド |
| 15 | マルチブラウザ E2E テスト | フロントエンド |
| 16 | パフォーマンステスト (大規模ボード) | 両方 |

---

## 5. 具体的なテストコード例

### 例1: CreateBoardUseCaseTest の拡充

```kotlin
@Test
fun `FUN_DONE_LEARNフレームワークでボード作成`() {
    every { boardRepository.save(any()) } answers { firstArg() }

    val response = useCase.execute(CreateBoardRequest("Retro", Framework.FUN_DONE_LEARN, 5))

    assertEquals(3, response.columns.size)
    assertEquals("Fun", response.columns[0].name)
    assertEquals("Done", response.columns[1].name)
    assertEquals("Learn", response.columns[2].name)
}

@Test
fun `FOUR_LSフレームワークでボード作成`() {
    every { boardRepository.save(any()) } answers { firstArg() }

    val response = useCase.execute(CreateBoardRequest("Retro", Framework.FOUR_LS, 5))

    assertEquals(4, response.columns.size)
    assertEquals("Liked", response.columns[0].name)
    assertEquals("Learned", response.columns[1].name)
    assertEquals("Lacked", response.columns[2].name)
    assertEquals("Longed For", response.columns[3].name)
}

@Test
fun `START_STOP_CONTINUEフレームワークでボード作成`() {
    every { boardRepository.save(any()) } answers { firstArg() }

    val response = useCase.execute(CreateBoardRequest("Retro", Framework.START_STOP_CONTINUE, 5))

    assertEquals(3, response.columns.size)
    assertEquals("Start", response.columns[0].name)
    assertEquals("Stop", response.columns[1].name)
    assertEquals("Continue", response.columns[2].name)
}
```

### 例2: CardMapperTest 新規作成

```kotlin
class CardMapperTest {

    @Test
    fun `カードレスポンスに正しくマッピング`() {
        val card = TestFixtures.card(content = "テスト")
        val response = CardMapper.toCardResponse(card)

        assertEquals(card.id, response.id)
        assertEquals(card.content, response.content)
        assertEquals(card.authorNickname, response.authorNickname)
    }

    @Test
    fun `columnがnullの場合にcolumnIdは空文字列`() {
        val card = TestFixtures.card()
        card.column = null

        val response = CardMapper.toCardResponse(card)

        assertEquals("", response.columnId)
    }

    @Test
    fun `votedParticipantIdsが正しく集計される`() {
        val card = TestFixtures.card()
        val vote1 = TestFixtures.vote(card = card, participant = TestFixtures.participant(id = "p-1"))
        val vote2 = TestFixtures.vote(card = card, participant = TestFixtures.participant(id = "p-2"))
        card.votes.addAll(listOf(vote1, vote2))

        val response = CardMapper.toCardResponse(card)

        assertEquals(2, response.voteCount)
        assertEquals(listOf("p-1", "p-2"), response.votedParticipantIds)
    }
}
```

### 例3: ParticipantTest 新規作成

```kotlin
class ParticipantTest {

    @Test
    fun `updateOnlineStatusでオンライン状態に変更`() {
        val board = TestFixtures.board()
        val participant = TestFixtures.participant(board = board, isOnline = false)

        participant.updateOnlineStatus(true, "session-123")

        assertTrue(participant.isOnline)
        assertEquals("session-123", participant.sessionId)
    }

    @Test
    fun `updateOnlineStatusでnewSessionId省略時にsessionIdは変更されない`() {
        val board = TestFixtures.board()
        val participant = TestFixtures.participant(board = board, sessionId = "old-session")

        participant.updateOnlineStatus(false)

        assertFalse(participant.isOnline)
        assertEquals("old-session", participant.sessionId)
    }

    @Test
    fun `updateOnlineStatus時にドメインイベントが発行される`() {
        val board = TestFixtures.board()
        val participant = TestFixtures.participant(board = board)

        participant.updateOnlineStatus(true, "session-1")

        val events = participant.getDomainEvents()
        assertEquals(1, events.size)
        assertTrue(events[0] is BoardEvent.ParticipantOnlineChanged)
    }

    @Test
    fun `boardがnullの場合にドメインイベントは発行されない`() {
        val participant = Participant(nickname = "test")

        participant.updateOnlineStatus(true)

        assertEquals(0, participant.getDomainEvents().size)
    }
}
```

---

## 6. 総合評価

**バックエンド: B+ (良好)**
- UseCase / Controller 層のテストは優秀
- Mapper のテスト欠如と一部 UseCase のエッジケース不足が主な改善点
- 統合テスト (@DataJpaTest) の追加が必要

**フロントエンド: A (優秀)**
- ほぼ全ファイルにテストあり (93%)
- 複雑なコンポーネントは詳細にテスト済み
- E2E テストで主要フローを網羅
- エラーハンドリングフローとアクセシビリティテストの拡充が望ましい

**全体: A- (優良)**
- 80% カバレッジ閾値を満たす十分なテスト基盤
- P1 の改善を実施すれば更に堅牢なテストスイートになる
