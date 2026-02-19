# チームダッシュボード画面 追加改善計画

前提: ページング・削除機能の改善は `2026-02-19-team-dashboard-improvements-design.md` で別途計画済み。
本文書では、コード分析に基づくそれ以外の改善点をまとめる。

---

## 1. TrendChart のダークモード未対応

### 現状の問題
- `TrendChart.tsx` のツールチップ（`CustomTooltip`）がライトモード固定のスタイル
  - `bg-white/95`, `border-gray-200`, `text-gray-700`, `text-gray-500`, `text-gray-800` がハードコード
- サマリーカードも `bg-gray-50`, `border-gray-100`, `text-gray-500`, `text-gray-900` 等ライトモード固定
- `CartesianGrid` の `stroke="#f1f5f9"` がライトモード色固定
- タブナビゲーション `bg-gray-100` もライトモード固定

### 改善案
- ツールチップ・サマリーカード・タブナビゲーションに `dark:` プレフィックスを追加
- Chart のグリッド線色をCSS変数化するか、ダークモード検出して動的に色を変更

### 影響ファイル
- `frontend/src/components/TrendChart.tsx`

---

## 2. SnapshotDetailPage のエラーハンドリング不備

### 現状の問題
```typescript
// SnapshotDetailPage.tsx L17
.catch(() => {})
```
- API エラー時に何もしない（ユーザーに何も通知されない）
- スナップショットが `null` のまま「スナップショットが見つかりません」と表示されるが、ネットワークエラーとデータ不在の区別がつかない

### 改善案
- エラー時にトースト通知を表示（他のページと同様に `useToastStore` を使用）
- 404（データなし）と500（サーバーエラー）を区別して適切なメッセージを表示
- リトライボタンの追加

### 影響ファイル
- `frontend/src/pages/SnapshotDetailPage.tsx`

---

## 3. URL 状態管理の欠如（検索条件がURLに反映されない）

### 現状の問題
- チーム名検索が `useState` 内部状態のみで管理されている
- ページをリロードすると検索条件が消失する
- URLをチームメンバーに共有できない（例: `/dashboard?team=Alpha`）
- ブラウザの「戻る」ボタンで検索履歴を辿れない

### 改善案
- `useSearchParams`（React Router）を使用して検索条件をURLクエリパラメータに同期
- `/dashboard?teamName=Alpha&page=1` のような形式

### 影響ファイル
- `frontend/src/pages/TeamDashboardPage.tsx`

---

## 4. RetroSummaryCard にボードタイトルが未表示

### 現状の問題
- 表示されるのはチーム名・フレームワーク・日付・統計情報のみ
- ボードのタイトル（例: 「スプリント42 ふりかえり」）が表示されない
- 同じチームの複数レトロが並ぶと区別がつきにくい

### 改善案
- バックエンドの `BoardSnapshot` にボードタイトルを保存する（スナップショット作成時に取得）
- または `snapshotData` JSON内からタイトルを取得
- `SnapshotSummaryResponse` にタイトルフィールドを追加
- `RetroSummaryCard` にタイトルを表示

### 影響ファイル
- バックエンド: `BoardSnapshot.kt`, `SnapshotDtos.kt`, `SnapshotMapper.kt`, `CreateSnapshotUseCase.kt` + DBマイグレーション
- フロントエンド: `types/index.ts`, `RetroSummaryCard.tsx`

---

## 5. SnapshotDetailView でアクションアイテムの詳細が非表示

### 現状の問題
- `snapshotData` JSON のカラム・カード情報は表示されている
- しかしアクションアイテムの実際の内容（テキスト、担当者、ステータス）は表示されない
- 完了率だけが数値で表示される

### 改善案
- `snapshotData` にアクションアイテムの詳細を含めるか、別途取得
- アクションアイテム一覧をカード形式で表示（ステータス、担当者、優先度付き）

### 影響ファイル
- `frontend/src/components/SnapshotDetailView.tsx`
- 場合によっては: `backend/src/main/kotlin/com/retra/history/usecase/CreateSnapshotUseCase.kt`

---

## 6. SnapshotDetailView のエクスポート機能の欠如

### 現状の問題
- スナップショット詳細ページにデータエクスポート機能がない
- ボード画面には CSV/Markdown エクスポート機能が存在するが、完了後のスナップショットからはエクスポートできない

### 改善案
- `snapshotData` を元にした CSV/Markdown エクスポートボタンを追加
- PDF出力も検討

### 影響ファイル
- `frontend/src/components/SnapshotDetailView.tsx`（新規ボタン追加）

---

## 7. TrendChart の期間フィルタリング機能の欠如

### 現状の問題
- トレンドチャートが全期間のデータを必ず表示する
- データが膨大になると見づらくなる
- 特定期間の傾向を分析しづらい

### 改善案
- 「直近5回」「直近10回」「全期間」などの期間フィルタを追加
- カスタム日付範囲の選択

### 影響ファイル
- `frontend/src/components/TrendChart.tsx`
- `frontend/src/pages/TeamDashboardPage.tsx`

---

## 8. ダッシュボードの空状態のデザイン改善

### 現状の問題
- 履歴が空の場合、小さなアイコンとテキスト「まだレトロスペクティブの履歴がありません」のみ
- ユーザーに次のアクション（ボード作成）を促す導線がない

### 改善案
- 空状態のイラストやより目立つデザイン
- 「最初のレトロスペクティブを始める」ボタンを配置
- ホームページへの導線を強化

### 影響ファイル
- `frontend/src/components/RetroHistoryList.tsx`

---

## 9. レスポンシブ対応の改善

### 現状の問題
- `RetroSummaryCard` のStats行（カード数・投票数・参加者数）がモバイルでは横幅不足で見切れる可能性
- KPIカードの `grid-cols-2 md:grid-cols-4` は対応済みだが、数値が大きくなるとはみ出す可能性

### 改善案
- Stats行のモバイル表示を折り返し可能なグリッドに変更
- KPIカード内のテキストサイズをレスポンシブに調整

### 影響ファイル
- `frontend/src/components/RetroSummaryCard.tsx`
- `frontend/src/pages/TeamDashboardPage.tsx`（KpiCard）

---

## 10. アクセシビリティの改善

### 現状の問題
- `RetroSummaryCard` 全体が `<Link>` だが、`aria-label` がない（チーム名だけでは文脈不足）
- トレンドチャートのタブに `role="tablist"` / `role="tab"` / `aria-selected` がない
- KPIカードに適切なセマンティクスがない

### 改善案
- `RetroSummaryCard` に `aria-label="Team Alpha - 2024/03/01 のレトロスペクティブ"` 等を追加
- タブにARIAロールを付与
- KPIを `<dl>` (定義リスト) としてマークアップ

### 影響ファイル
- `frontend/src/components/RetroSummaryCard.tsx`
- `frontend/src/components/TrendChart.tsx`
- `frontend/src/pages/TeamDashboardPage.tsx`

---

## 優先度一覧

| 優先度 | # | 改善項目 | 工数目安 |
|:---:|:---:|---|:---:|
| **高** | 1 | TrendChart ダークモード対応 | 小 |
| **高** | 2 | SnapshotDetailPage エラーハンドリング | 小 |
| **高** | 3 | URL 状態管理 | 中 |
| **中** | 4 | ボードタイトル表示 | 中 |
| **中** | 5 | アクションアイテム詳細表示 | 中 |
| **中** | 8 | 空状態デザイン改善 | 小 |
| **中** | 10 | アクセシビリティ改善 | 小 |
| **低** | 6 | エクスポート機能 | 中 |
| **低** | 7 | トレンド期間フィルタ | 中 |
| **低** | 9 | レスポンシブ対応強化 | 小 |
