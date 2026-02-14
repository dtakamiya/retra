# レトロ エンゲージメント指標の設計

## 概要

既存のTeamDashboardPageにエンゲージメント指標チャートを追加し、レトロの参加度を定量的に評価できるようにする。

## 目的

「チームメンバーがどれだけ積極的にレトロに参加しているか」を数値で把握し、スプリントごとの傾向を可視化する。

## アプローチ

**アプローチB: バックエンド計算**を採用。既存の`TrendPoint`DTOにエンゲージメント指標フィールドを追加し、`SnapshotMapper`でサーバー側計算する。既存の`actionItemCompletionRate`と同じパターン。

## エンゲージメント指標

| 指標名 | 計算式 | 意味 |
|--------|--------|------|
| `cardsPerParticipant` | `totalCards / totalParticipants` | 参加者あたりのカード投稿数 |
| `votesPerParticipant` | `totalVotes / totalParticipants` | 参加者あたりの投票数 |
| `votesPerCard` | `totalVotes / totalCards` | 1カードあたりの平均投票数 |
| `actionItemRate` | `actionItemsTotal / totalCards * 100` | カード→アクションアイテム変換率(%) |

ゼロ除算時は0.0を返す。

## 変更対象

### バックエンド（2ファイル）

1. **`SnapshotDtos.kt`**: `TrendPoint`に4フィールド追加
2. **`SnapshotMapper.kt`**: `toTrendPoint()`に計算ロジック追加、`safeDiv`ヘルパー追加

コントローラー・ユースケース・DB変更は不要。

### フロントエンド（3ファイル）

1. **`types/index.ts`**: `TrendPoint`に4フィールド追加
2. **`TrendChart.tsx`**: エンゲージメント指標専用の2つ目のチャートを追加
3. **`TeamDashboardPage.tsx`**: レイアウト変更（必要に応じて）

### UIレイアウト

```
┌─────────────────────────────────┐
│  チーム検索フォーム              │
├─────────────────────────────────┤
│  基本トレンドチャート（既存）     │
│  [カード数] [投票数] [AI完了率]   │
├─────────────────────────────────┤
│  エンゲージメントチャート（新規）  │
│  [カード/人] [投票/人]           │
│  [投票/カード] [アクション化率]   │
├─────────────────────────────────┤
│  レトロ履歴リスト               │
└─────────────────────────────────┘
```

### チャート配色

| データキー | 色 | ラベル |
|-----------|-----|--------|
| `cardsPerParticipant` | #8884d8（青） | カード数/人 |
| `votesPerParticipant` | #82ca9d（緑） | 投票数/人 |
| `votesPerCard` | #ff7300（橙） | 投票数/カード |
| `actionItemRate` | #ffc658（黄） | アクション化率(%) |

## テスト戦略

### バックエンド
- `SnapshotMapperTest`: 計算ロジックのテスト（正常値、ゼロ除算）

### フロントエンド
- `TrendChart.test.tsx`: エンゲージメントチャートの表示テスト
- `TeamDashboardPage.test.tsx`: fixture更新
- `fixtures.ts`: 新フィールド追加

### E2E
- `dashboard.spec.ts`: エンゲージメントチャート表示確認

## 非対象

- DBスキーマ変更（既存データで十分）
- スナップショット詳細ビューの変更
- メンバー別分析（将来の拡張候補）
