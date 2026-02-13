# アクションアイテム追跡 & レトロ履歴ダッシュボード 設計書

日付: 2026-02-13
アプローチ: A（段階的モジュール追加）

## 概要

Retraにアクションアイテム管理機能とレトロ履歴ダッシュボードを追加し、レトロスペクティブの継続的改善サイクルを支援する。

## フェーズ1: アクションアイテムモジュール

### データモデル

```sql
CREATE TABLE action_items (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES boards(id),
    card_id TEXT REFERENCES cards(id),
    content TEXT NOT NULL,
    assignee_id TEXT REFERENCES participants(id),
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

- `card_id`: カードから生成した場合に紐付け（nullable）
- `assignee_id`: 担当者（nullable）
- `status`: OPEN / IN_PROGRESS / DONE

### バックエンド構造

```
actionitem/
├── domain/
│   ├── ActionItem.kt
│   ├── ActionItemEvent.kt (CREATED, UPDATED, STATUS_CHANGED, DELETED)
│   ├── ActionItemRepository.kt
│   └── ActionItemStatus.kt
├── usecase/
│   ├── ActionItemDtos.kt
│   ├── ActionItemMapper.kt
│   ├── CreateActionItemUseCase.kt
│   ├── UpdateActionItemUseCase.kt
│   ├── DeleteActionItemUseCase.kt
│   └── UpdateActionItemStatusUseCase.kt
└── gateway/
    ├── controller/ActionItemController.kt
    └── db/
        ├── JpaActionItemRepository.kt
        └── SpringDataActionItemRepository.kt
```

### REST API

| Method | Path | 説明 |
|--------|------|------|
| GET | /api/v1/boards/{slug}/action-items | 一覧取得 |
| POST | /api/v1/boards/{slug}/action-items | 作成 |
| PUT | /api/v1/boards/{slug}/action-items/{id} | 更新 |
| PATCH | /api/v1/boards/{slug}/action-items/{id}/status | ステータス変更 |
| DELETE | /api/v1/boards/{slug}/action-items/{id} | 削除 |

### WebSocket

Topic: `/topic/board/{slug}/action-items`
Events: ACTION_ITEM_CREATED, ACTION_ITEM_UPDATED, ACTION_ITEM_STATUS_CHANGED, ACTION_ITEM_DELETED

### フロントエンド

新規コンポーネント:
- `ActionItemList.tsx` - アクションアイテム一覧
- `ActionItemForm.tsx` - 作成・編集フォーム
- `ActionItemCard.tsx` - 個別アイテム表示
- `ActionItemStatusBadge.tsx` - ステータスバッジ

### フェーズベースアクセス制御

- ACTION_ITEMS / CLOSEDフェーズでアクションアイテムセクションを表示
- ACTION_ITEMSフェーズで作成・編集・削除が可能
- CLOSEDフェーズでは閲覧のみ
- カードからの変換ボタンはDISCUSSION以降で表示

---

## フェーズ2: レトロ履歴・ダッシュボード

### データモデル

```sql
CREATE TABLE board_snapshots (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES boards(id),
    team_name TEXT NOT NULL,
    framework TEXT NOT NULL,
    closed_at TEXT NOT NULL,
    total_cards INTEGER NOT NULL DEFAULT 0,
    total_votes INTEGER NOT NULL DEFAULT 0,
    total_participants INTEGER NOT NULL DEFAULT 0,
    action_items_total INTEGER NOT NULL DEFAULT 0,
    action_items_done INTEGER NOT NULL DEFAULT 0,
    snapshot_data TEXT NOT NULL,
    created_at TEXT NOT NULL
);
```

- `team_name`: ボード名から取得。チーム識別に利用
- `snapshot_data`: JSON形式でカラム別カード・投票等の詳細を保存

### バックエンド構造

```
history/
├── domain/
│   ├── BoardSnapshot.kt
│   ├── BoardSnapshotRepository.kt
│   └── HistoryEvent.kt
├── usecase/
│   ├── SnapshotDtos.kt
│   ├── SnapshotMapper.kt
│   ├── CreateSnapshotUseCase.kt
│   ├── GetSnapshotUseCase.kt
│   └── GetTeamHistoryUseCase.kt
└── gateway/
    ├── controller/HistoryController.kt
    └── db/
        ├── JpaBoardSnapshotRepository.kt
        └── SpringDataBoardSnapshotRepository.kt
```

### 自動スナップショット

`TransitionPhaseUseCase` でフェーズがCLOSEDに遷移した際、`CreateSnapshotUseCase` を自動実行。

### REST API

| Method | Path | 説明 |
|--------|------|------|
| GET | /api/v1/history?teamName= | チーム別レトロ履歴一覧 |
| GET | /api/v1/history/{snapshotId} | スナップショット詳細 |
| GET | /api/v1/history/trends?teamName= | トレンドデータ |

### フロントエンド

新規ページ:
- `TeamDashboardPage.tsx` (ルート: /dashboard)
- `SnapshotDetailPage.tsx` (ルート: /dashboard/:snapshotId)

新規コンポーネント:
- `RetroHistoryList.tsx` - 過去レトロ一覧
- `RetroSummaryCard.tsx` - レトロサマリー
- `TrendChart.tsx` - トレンドチャート (Recharts)
- `SnapshotDetailView.tsx` - スナップショット詳細

### ルーティング更新

```
/ → HomePage (+ ダッシュボードリンク追加)
/board/:slug → BoardPage
/dashboard → TeamDashboardPage (新規)
/dashboard/:snapshotId → SnapshotDetailPage (新規)
```

### ダッシュボード指標

- レトロ実施回数の推移
- カラム別カード数の推移
- 投票数の推移
- アクションアイテム完了率の推移
- 参加者数の推移

### 追加ライブラリ

- `recharts` - チャート表示

---

## AIエージェントチーム構成

並列実行可能なタスクはサブエージェントで同時実行:

| エージェント | 役割 |
|------------|------|
| planner | 実装計画の策定 |
| architect | アーキテクチャレビュー |
| tdd-guide | テスト駆動開発ガイド |
| code-reviewer | コードレビュー |
| build-error-resolver | ビルドエラー修正 |
| e2e-runner | E2Eテスト実行 |

## Flywayマイグレーション

- V9: action_items テーブル
- V10: board_snapshots テーブル
