# チームダッシュボード画面の改善計画

## 現状の課題

チームダッシュボード画面（`TeamDashboardPage`）の現在の実装を分析した結果、以下の課題を特定した。

### 1. ページング機能の欠如
- バックエンドの `GetTeamHistoryUseCase.getHistory()` は全件取得を行っている
- `BoardSnapshotRepository` にはページネーション対応のメソッドが存在しない
- フロントエンドの `RetroHistoryList` は全履歴をリスト表示している
- データが増加するとパフォーマンスが劣化し、UXが悪化する

### 2. 削除機能の欠如
- `HistoryController` にはDELETEエンドポイントが存在しない
- `BoardSnapshotRepository` には `deleteById` メソッドが定義されていない
- フロントエンドに削除UIが存在しない
- 不要なスナップショットを削除する手段がない

### 3. その他の改善余地
- ソート機能がない（日付順固定のみ）
- フィルタリング機能が検索のみで、フレームワーク種別でのフィルタがない
- 一括操作ができない

---

## 改善提案

### 提案 1: ページング機能の実装

#### バックエンド

##### `BoardSnapshotRepository` にページネーション対応メソッドを追加
```kotlin
// ドメインリポジトリ
fun findAllOrderByClosedAtDesc(page: Int, size: Int): Page<BoardSnapshot>
fun findByTeamNameOrderByClosedAtDesc(teamName: String, page: Int, size: Int): Page<BoardSnapshot>
fun countAll(): Long
fun countByTeamName(teamName: String): Long
```

##### `SpringDataBoardSnapshotRepository` にSpring Data Pageableサポートを追加
```kotlin
fun findAllByOrderByClosedAtDesc(pageable: Pageable): Page<BoardSnapshot>
fun findByTeamNameOrderByClosedAtDesc(teamName: String, pageable: Pageable): Page<BoardSnapshot>
```

##### `GetTeamHistoryUseCase` にページネーションパラメータを追加
```kotlin
fun getHistory(teamName: String?, page: Int = 0, size: Int = 10): PagedHistoryResponse
```

##### `HistoryController` にクエリパラメータを追加
```
GET /api/v1/history?teamName=xxx&page=0&size=10
```
レスポンス形式:
```json
{
  "content": [...],
  "totalElements": 50,
  "totalPages": 5,
  "currentPage": 0,
  "pageSize": 10
}
```

#### フロントエンド

##### API クライアントの更新
```typescript
getHistory(teamName?: string, page?: number, size?: number): Promise<PagedHistory>
```

##### 型定義の追加
```typescript
interface PagedHistory {
  content: SnapshotSummary[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
```

##### ページネーションUIコンポーネント
- 「前へ / 次へ」ボタン
- ページ番号表示（例: 1 / 5）
- ページサイズ選択（10 / 20 / 50）
- 合計件数の表示

---

### 提案 2: 削除機能の実装

#### バックエンド

##### `BoardSnapshotRepository` に削除メソッドを追加
```kotlin
fun deleteById(id: String)
fun deleteAllByIds(ids: List<String>)
```

##### 新規 `DeleteSnapshotUseCase` を作成
```kotlin
@Service
class DeleteSnapshotUseCase(
    private val snapshotRepository: BoardSnapshotRepository
) {
    @Transactional
    fun execute(id: String) { ... }

    @Transactional
    fun executeBulk(ids: List<String>) { ... }
}
```

##### `HistoryController` にDELETEエンドポイントを追加
```
DELETE /api/v1/history/{snapshotId}
DELETE /api/v1/history/bulk  (body: { ids: [...] })
```

#### フロントエンド

##### API クライアントに削除メソッドを追加
```typescript
deleteSnapshot(snapshotId: string): Promise<void>
deleteSnapshots(ids: string[]): Promise<void>
```

##### 削除UI
- 各 `RetroSummaryCard` に削除ボタン（ゴミ箱アイコン）を追加
- 確認ダイアログを表示してから削除実行
- 削除後にリストを自動リロード
- トースト通知で成功/失敗を表示

---

### 提案 3: フレームワーク種別フィルタ (追加改善)

#### フロントエンドのみの変更
- フレームワーク種別（KPT, FUN_DONE_LEARN, FOUR_LS, START_STOP_CONTINUE）でフィルタリング
- トグルボタン or ドロップダウンでの選択
- 検索と組み合わせ可能

---

### 提案 4: ソート機能 (追加改善)

#### フロントエンドのみの変更（データ量が少ない場合）
- 日付順（昇順/降順）
- カード数順
- 投票数順
- 参加者数順

---

### 提案 5: 一括選択・一括削除 (追加改善)

#### フロントエンドの変更
- チェックボックスによる複数選択
- 「選択した項目を削除」ボタン
- 全選択/全解除

---

## 優先度と推奨実装順序

| 優先度 | 提案 | 理由 |
|:---:|---|---|
| **高** | 1. ページング機能 | データ量増加に伴うパフォーマンス問題を解決 |
| **高** | 2. 削除機能（単体） | ユーザーが不要データを管理する基本機能 |
| **中** | 3. フレームワークフィルタ | データの探しやすさを改善 |
| **低** | 4. ソート機能 | 利便性向上だが必須ではない |
| **低** | 5. 一括削除 | 削除機能の拡張として後から実装可能 |

---

## 影響範囲

### バックエンド変更ファイル
| ファイル | 変更内容 |
|---|---|
| `BoardSnapshotRepository.kt` | ページネーション・削除メソッド追加 |
| `SpringDataBoardSnapshotRepository.kt` | Pageable対応メソッド追加 |
| `JpaBoardSnapshotRepository.kt` | 新メソッドの実装追加 |
| `GetTeamHistoryUseCase.kt` | ページネーション対応 |
| `SnapshotDtos.kt` | ページネーションレスポンスDTO追加 |
| `HistoryController.kt` | ページネーションパラメータ・DELETEエンドポイント追加 |
| **[NEW]** `DeleteSnapshotUseCase.kt` | 削除ロジック |

### フロントエンド変更ファイル
| ファイル | 変更内容 |
|---|---|
| `types/index.ts` | `PagedHistory` 型追加 |
| `api/client.ts` | ページネーション・削除API追加 |
| `TeamDashboardPage.tsx` | ページネーションUI・削除ハンドラ追加 |
| `RetroHistoryList.tsx` | ページネーション情報表示 |
| `RetroSummaryCard.tsx` | 削除ボタン追加 |
| **[NEW]** `Pagination.tsx` | ページネーションコンポーネント |
| **[NEW]** `ConfirmDialog.tsx` | 確認ダイアログコンポーネント |

### テスト
| ファイル | 変更内容 |
|---|---|
| `TeamDashboardPage.test.tsx` | ページネーション・削除のテスト追加 |
| `RetroHistoryList.test.tsx` | ページネーションUI テスト追加 |
| `RetroSummaryCard.test.tsx` | 削除ボタンのテスト追加 |
| `GetTeamHistoryUseCaseTest.kt` | ページネーションテスト追加 |
| **[NEW]** `DeleteSnapshotUseCaseTest.kt` | 削除ロジックのテスト |
