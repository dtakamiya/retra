# UX改善バンドル 設計書

日付: 2026-02-13
アプローチ: A（機能ごと独立実装）

## 概要

Retraの4つのUX改善を独立モジュールとして実装する。各機能は互いに依存しない。

## 機能1: 議論済みマーク + 投票数順ソート

### 目的
DISCUSSIONフェーズでカードに「議論済み」マークを付けられるようにし、ファシリテーターの進行を支援する。

### データモデル変更
`cards` テーブルに2カラム追加（V11マイグレーション）:
- `is_discussed BOOLEAN NOT NULL DEFAULT false`
- `discussion_order INTEGER NOT NULL DEFAULT 0`

### バックエンド
- `Card` ドメインに `isDiscussed`, `discussionOrder` フィールド追加
- `markAsDiscussed()` / `unmarkAsDiscussed()` メソッド追加
- `MarkCardDiscussedUseCase` 新規作成
- `PATCH /api/v1/boards/{slug}/cards/{id}/discussed` - 議論済みトグル（ファシリテーターのみ）
- `CardEvent.CARD_DISCUSSION_MARKED` 新規イベント
- DomainEventBroadcaster にイベントハンドラ追加

### フロントエンド
- `CardItem` に議論済みチェックアイコン追加（DISCUSSIONフェーズ以降表示）
- 議論済みカードはグレーアウト（opacity-50）+ チェックアイコン
- ファシリテーターのみチェックマークをクリック可能
- `ColumnView` で未議論カードを投票数の多い順にソート（DISCUSSION以降）
- Zustandストア + WebSocket にイベントハンドラ追加
- `types/index.ts` に `isDiscussed`, `discussionOrder` 追加

### アクセス制御
- 議論済みマーク操作: ファシリテーターのみ（DISCUSSION / ACTION_ITEMSフェーズ）
- ソート結果の表示: 全員

---

## 機能2: 投票結果ビジュアル化

### 目的
投票フェーズ以降で投票結果を視覚的にわかりやすくする。

### データモデル変更
なし（既存データで対応）

### バックエンド変更
なし

### フロントエンド
- **投票プログレスバー**: `CardItem` 下部に薄いバー（高さ4px）を表示
  - VOTING以降のフェーズで表示
  - 最大投票数（全カード中最大）に対する割合で幅を計算
  - 色: indigo-400 → indigo-600 のグラデーション（投票数に応じて濃くなる）
- **自分の投票ハイライト**: 自分が投票したカードに左ボーダー（3px, indigo-500）を表示
  - `boardStore` に `myVotedCardIds: Set<string>` 状態を追加
  - 投票/投票取消時にSet を更新
  - WebSocketイベントでも更新

### UX詳細
- プログレスバーはカード本文の下、著者名の上に配置
- ゼロ票のカードにはバーを表示しない
- 自分の投票ハイライトはVOTINGフェーズ以降で常時表示

---

## 機能3: 匿名投稿オプション

### 目的
ボード作成時に匿名モードを選択可能にし、心理的安全性を高める。

### データモデル変更
`boards` テーブルに1カラム追加（V11マイグレーション）:
- `is_anonymous BOOLEAN NOT NULL DEFAULT false`

### バックエンド
- `Board` ドメインに `isAnonymous` フィールド追加
- `CreateBoardUseCase` のリクエストに `isAnonymous` パラメータ追加
- `BoardDtos`, `BoardMapper` に反映
- `CardMapper.toResponse()` で `board.isAnonymous == true` かつ `requesterId != card.authorId` の場合、`authorNickname` を `null` に設定
  - 自分のカードは本人にだけ作者名が見える
  - ファシリテーターも他人のカード作者を見られない（完全匿名）
- `GetBoardUseCase` のレスポンスに `isAnonymous` を含める

### フロントエンド
- `HomePage` のボード作成フォームに「匿名モード」トグルスイッチ追加
- `BoardHeader` に匿名モードバッジ（EyeOff アイコン + 「匿名モード」）表示
- `CardItem` で `authorNickname` が `null` の場合「匿名」と表示（グレーイタリック）
- `types/index.ts` の `Board` に `isAnonymous` 追加

### アクセス制御
- 匿名モードはボード作成時にのみ設定可能（後から変更不可）
- カード編集/削除は内部的に `authorId` で認証（UIには表示しない）

---

## 機能4: アクションアイテム優先度

### 目的
アクションアイテムに優先度を追加し、重要度の高いタスクを明確にする。

### データモデル変更
`action_items` テーブルに1カラム追加（V11マイグレーション）:
- `priority TEXT NOT NULL DEFAULT 'MEDIUM'`

### バックエンド
- `ActionItemPriority` enum 新規作成（HIGH / MEDIUM / LOW）
- `ActionItem` ドメインに `priority` フィールド追加
- `ActionItemDtos` の全リクエスト/レスポンスに `priority` 追加
- `ActionItemMapper` に反映

### フロントエンド
- `ActionItemForm` に優先度セレクト追加（デフォルト: MEDIUM）
- `ActionItemCard` に優先度バッジ表示
  - HIGH: 赤 上向き矢印アイコン + 「高」
  - MEDIUM: 黄 横矢印アイコン + 「中」
  - LOW: 灰 下向き矢印アイコン + 「低」
- `ActionItemList` で同一ステータス内を優先度順にソート（HIGH → MEDIUM → LOW）
- `types/index.ts` に `ActionItemPriority` 追加
- `ActionItemCard` の編集時にも優先度変更可能

---

## Flywayマイグレーション

V11（単一マイグレーション）:
- `cards` テーブル: `is_discussed`, `discussion_order` 追加
- `boards` テーブル: `is_anonymous` 追加
- `action_items` テーブル: `priority` 追加

## テスト方針

各機能ごとに:
- バックエンド: ドメインテスト + ユースケーステスト + コントローラテスト
- フロントエンド: コンポーネントテスト + ストアテスト
- E2Eテスト: 各機能の主要フローをカバー
