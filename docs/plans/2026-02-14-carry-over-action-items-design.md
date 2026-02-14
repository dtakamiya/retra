# アクションアイテム引き継ぎパネル - 設計書

**日付:** 2026-02-14
**ステータス:** 承認済み

## 概要

新しいレトロ開始時に、前回のレトロの未完了アクションアイテムをボード内サイドバーに常時表示する機能。チーム名でボードを紐付け、レトロの継続性を向上させる。

## 背景・課題

- 現在のRetraでは各レトロが独立しており、前回のアクションアイテムの進捗確認が困難
- レトロ履歴ダッシュボードはあるが、ボード内から直接参照する手段がない
- ファシリテーターが毎回手動で前回の結果を確認する必要がある

## アプローチ

**サイドバーパネル方式**を採用。

- データ重複なし（元のアクションアイテムを直接参照・更新）
- 画面レイアウトへの影響最小限（右サイドバーに折りたたみパネル追加）
- 常時アクセス可能

## データモデルの変更

### V12マイグレーション

`boards`テーブルに`team_name`カラムを追加（NULLable）。

```sql
ALTER TABLE boards ADD COLUMN team_name TEXT;
```

### Boardエンティティ

```kotlin
@Column(name = "team_name")
open var teamName: String? = null
```

### スナップショット作成時

`CreateSnapshotUseCase`を修正: `teamName = board.teamName ?: board.title`

## API設計

### 引き継ぎアイテム取得

```
GET /api/v1/boards/{slug}/carry-over-items
```

レスポンス:
```json
{
  "items": [
    {
      "id": "uuid",
      "content": "テスト自動化の導入を検討",
      "assigneeNickname": "田中",
      "dueDate": "2026-02-20",
      "status": "OPEN",
      "priority": "HIGH",
      "sourceBoardTitle": "Sprint 42 ふりかえり",
      "sourceBoardClosedAt": "2026-02-07T10:00:00Z",
      "sourceBoardSlug": "abc123"
    }
  ],
  "teamName": "チーム Alpha"
}
```

条件:
- 同じ`teamName`を持つ過去のCLOSEDボードから取得
- ステータスがOPENまたはIN_PROGRESSのもののみ
- 直近1つのCLOSEDボードのみ対象

### 引き継ぎアイテムステータス更新

```
PATCH /api/v1/boards/{slug}/carry-over-items/{actionItemId}/status
Body: { "status": "DONE", "participantId": "xxx" }
```

- 元のボードのアクションアイテムを直接更新
- 権限: 現在のボードのファシリテーター

## フロントエンドUI設計

### ボード作成フォーム

`HomePage.tsx`に「チーム名」入力欄を追加:
- オプション項目
- 過去のスナップショットからチーム名をサジェスト

### CarryOverPanelコンポーネント

右サイドバーの参加者一覧の下に配置:
- 折りたたみ可能（デフォルト展開）
- `teamName`未設定の場合は非表示
- 0件の場合は「未完了のアクションアイテムはありません」表示

UI要素:
- ヘッダー: 「前回のアクションアイテム」+ 件数バッジ + 折りたたみトグル
- 各アイテム: 内容、担当者、優先度バッジ、ステータスチップ（クリックで変更可能）
- 元のボード情報: タイトル + 日付
- モバイル: ボトムバーにアイコンボタン（モーダル形式）

## テスト戦略

### バックエンド
- `GetCarryOverItemsUseCaseTest`
- `UpdateCarryOverItemStatusUseCaseTest`
- `ActionItemControllerTest`（エンドポイント追加分）

### フロントエンド
- `CarryOverPanel.test.tsx`
- `HomePage.test.tsx`（チーム名入力追加分）
- `api/client.test.ts`（新規API関数）

### E2E
- `carry-over.spec.ts`

## スコープ外

- WebSocket連携（リアルタイム更新不要、リロードで最新化）
- 複数の過去ボードからの集約（直近1つのみ）
- アクションアイテムのドラッグ移動
