# E2Eテスト スリム化 設計書

## 目的

CI実行時間短縮（25分+ → 10分以下）のため、E2Eテストを「ハッピーパスの統合検証」に限定し、詳細なUI操作テストはVitest単体テストに委譲する。

## 現状分析

| 指標 | 現状 |
|------|------|
| ファイル数 | 23 |
| テストケース | 151 |
| コード行数 | 4,841 |
| CI実行時間 | 25分+（タイムアウト30分に接近） |

### 主な問題

1. **ヘルパー関数の大量重複**: `createBoardAndJoin`, `addCard`, `advanceToPhase` が18ファイルにコピペ
2. **E2E不要なテストが多い**: キーボード操作（Enter保存、Escキャンセル）、フォームバリデーション（空入力disabled）等はVitest + Testing Libraryで高速に検証可能
3. **UATと個別テストの重複**: 同じ機能フローが複数ファイルでテストされている

## 設計方針

**E2Eテストの役割を明確化**: 「ユーザーの主要フロー全体が動くこと」の確認に専念し、個別機能の詳細検証はVitest単体テストに委譲する。

## 目標

| 指標 | 現状 | 目標 |
|------|------|------|
| ファイル数 | 23 | 10 |
| テストケース | 151 | ~25 |
| コード行数 | 4,841 | ~1,200 |
| CI実行時間 | 25分+ | ~8-10分 |

## 詳細設計

### E2Eに残すファイル

| ファイル | 現テスト数 | 目標テスト数 | 残す理由 |
|---------|-----------|-------------|---------|
| `home.spec.ts` | 4 | 4 | コアエントリポイント（小さい） |
| `board-creation.spec.ts` | 3 | 3 | コアフロー（小さい） |
| `board-join.spec.ts` | 5 | 3 | コード参加、URL参加、エラーのみ |
| `card-operations.spec.ts` | 6 | 3 | 追加、Enter追加、複数カラム |
| `voting.spec.ts` | 3 | 3 | マルチユーザー投票同期あり |
| `phase-control.spec.ts` | 6 | 2 | 全フェーズ順次遷移 + メンバー制限 |
| `realtime-sync.spec.ts` | 2 | 2 | WebSocket同期はE2E固有 |
| `export.spec.ts` | 8 | 2 | CSV + Markdownダウンロード各1本 |
| `uat-full-retro-session.spec.ts` | 13 | 3 | 3シナリオに集約（後述） |

### 新規: `e2e/helpers.ts`

18ファイルに重複しているヘルパーを共通化:

```typescript
export async function createBoardAndJoin(page, nickname, boardTitle?, framework?)
export async function joinBoardAsMember(browser, boardUrl, nickname)
export async function addCard(page, content, columnIndex?)
export async function advanceToPhase(page, targetPhase)
export async function openMemos(page, cardContent)
export async function addMemo(page, cardContent, memoContent)
export async function addReaction(page, cardContent, emoji)
```

### E2Eから削除するファイル（14ファイル、126テスト）

| ファイル | テスト数 | 削除理由 |
|---------|---------|---------|
| `card-edit-delete.spec.ts` | 8 | CRUD詳細 → 単体テスト |
| `card-drag-drop.spec.ts` | 5 | DnDは既にdnd-mocksで単体テスト済 |
| `card-discussion.spec.ts` | 6 | 議論マーク切替 → 単体テスト |
| `voting-limit.spec.ts` | 4 | 投票上限はバックエンド+フロント単体で検証 |
| `memo-operations.spec.ts` | 20 | CRUD/キーボード/フェーズ制御すべて単体テスト可 |
| `reaction-operations.spec.ts` | 7 | リアクションCRUD → 単体テスト |
| `action-item-operations.spec.ts` | 21 | CRUD/キーボード/フェーズ制御すべて単体テスト可 |
| `authorization.spec.ts` | 6 | バックエンドが認可を強制。フロントはUI表示のみ |
| `anonymous-mode.spec.ts` | 5 | 匿名表示 → コンポーネントテスト |
| `private-writing.spec.ts` | 6 | プライベート表示 → コンポーネントテスト |
| `kudos-operations.spec.ts` | 3 | Kudos CRUD → 単体テスト |
| `carry-over.spec.ts` | 7 | キャリーオーバー → 単体テスト + APIテスト |
| `dashboard.spec.ts` | 10 | ダッシュボード表示 → コンポーネントテスト |
| `timer.spec.ts` | 5 | タイマー操作 → 単体テスト |

### UATシナリオ再構成（3本）

1. **単独ファシリテーターKPT完走**: ボード作成 → カード記入 → リアクション → 投票 → 議論（メモ追加） → アクションアイテム → 完了 → エクスポート
2. **チーム3人レトロ**: マルチユーザー参加 → カードリアルタイム同期 → 投票同期 → メモ同期 → 完了
3. **異なるフレームワーク**: Fun Done Learn で基本フロー確認（フレームワーク切替検証）

### 削除テストの単体テストカバレッジ

削除するE2Eテストのうち、既存の単体テスト（Vitest）でカバーされていない項目は、必要に応じて単体テスト側に追加する。ただし、既に以下が高カバレッジで単体テスト済み:

- コンポーネントの表示/非表示（フェーズによるアクセス制御）
- フォームバリデーション
- キーボード操作
- CRUD操作のUI更新

## リスクと対策

| リスク | 対策 |
|-------|------|
| 削除したE2Eで検出されていた回帰が漏れる | UATシナリオが主要フローを包括的にカバー |
| 単体テストのカバレッジ不足 | 削除前に既存単体テストを確認し、必要なら追加 |
| ヘルパー共通化でテストの独立性が低下 | ヘルパーはステートレスな関数のみ |
