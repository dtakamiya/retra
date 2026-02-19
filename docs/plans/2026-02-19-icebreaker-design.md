# アイスブレイカー機能 デザインドキュメント

**日付:** 2026-02-19
**ステータス:** 承認済み

## 概要

レトロスペクティブの開始前にアイスブレイクを行うための新機能。新しい「ICEBREAK」フェーズをWRITINGフェーズの前に追加し、ランダムな質問に参加者全員が回答を共有するインタラクティブな形式で実施する。

## 要件

- **タイミング:** WRITINGフェーズの前に新しいICEBREAKフェーズを追加
- **形式:** 質問表示 + 回答共有（リアルタイム）
- **質問ソース:** 組み込みプリセット質問（ランダム選択） + ファシリテーターによるカスタム質問
- **匿名性:** 常に名前表示（アイスブレイクなのでオープンが自然）
- **スキップ:** ファシリテーターがICEBREAK → WRITINGへ遷移することでスキップ可能

## アプローチ

**選択:** アプローチA — Phase enumに`ICEBREAK`を追加

既存のフェーズ管理の仕組み（PhaseControl、PhaseTransitionDialog、WebSocket broadcastなど）にそのまま乗せる。ボード作成時に`enableIcebreaker`フラグで有効/無効を制御し、有効時はICEBREAKフェーズから開始する。

## フェーズ遷移

```
ICEBREAK → WRITING → VOTING → DISCUSSION → ACTION_ITEMS → CLOSED
```

- `enableIcebreaker: true` → 初期フェーズ: ICEBREAK
- `enableIcebreaker: false` → 初期フェーズ: WRITING（従来通り）

## データモデル

### boardsテーブルへの追加カラム

| カラム | 型 | 説明 |
|--------|------|------|
| enable_icebreaker | INTEGER (BOOLEAN) | アイスブレイカー有効フラグ（デフォルト: false） |
| icebreaker_question | TEXT NULLABLE | 現在表示中のアイスブレイカー質問 |

### 新規テーブル: icebreaker_answers

| カラム | 型 | 説明 |
|--------|------|------|
| id | TEXT PK | UUID |
| board_id | TEXT FK → boards(id) | ボードID |
| participant_id | TEXT FK → participants(id) | 参加者ID |
| answer_text | TEXT NOT NULL | 回答テキスト（140文字制限） |
| created_at | TEXT NOT NULL | 作成日時 |

## REST API

エンドポイントプレフィックス: `/api/v1/boards/{slug}/icebreaker`

| Method | Path | 説明 | 権限 |
|--------|------|------|------|
| GET | `/icebreaker` | 現在の質問と全回答を取得 | 参加者全員 |
| POST | `/icebreaker/question` | 質問を設定/変更 | ファシリテーターのみ、ICEBREAKフェーズ |
| POST | `/icebreaker/answers` | 回答を投稿 | 参加者全員、ICEBREAKフェーズ |
| PUT | `/icebreaker/answers/{id}` | 回答を編集 | 本人のみ |
| DELETE | `/icebreaker/answers/{id}` | 回答を削除 | 本人のみ |

### 質問設定リクエスト

```json
// シャッフル（組み込みからランダム選択）
{ "participantId": "xxx", "type": "RANDOM" }

// カスタム質問
{ "participantId": "xxx", "type": "CUSTOM", "questionText": "最近嬉しかったことは？" }
```

## WebSocketイベント

トピック: `/topic/board/{slug}/icebreaker`

| イベント | ペイロード | 説明 |
|----------|-----------|------|
| ICEBREAKER_QUESTION_SET | `{ question }` | 質問が設定/変更された |
| ICEBREAKER_ANSWER_SUBMITTED | `{ answer }` | 新しい回答が投稿された |
| ICEBREAKER_ANSWER_UPDATED | `{ answer }` | 回答が編集された |
| ICEBREAKER_ANSWER_DELETED | `{ answerId }` | 回答が削除された |

## フロントエンドUI

### ICEBREAKフェーズの画面構成

```
┌─────────────────────────────────────────────────┐
│  [ヘッダー] Sprint 5 Retro  ●ICEBREAK  [→ Writing]│
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  アイスブレイク                            │    │
│  │                                         │    │
│  │  「最近ハマっていることは？」              │    │
│  │                                         │    │
│  │  [シャッフル] [カスタム質問]               │    │ ← ファシリテーターのみ
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────┐ ┌─────────────────┐       │
│  │ 田中              │ │ 佐藤              │       │
│  │ キャンプにハマって │ │ まだ入力中...      │       │
│  │ います！          │ │                   │       │
│  └─────────────────┘ └─────────────────┘       │
│  ┌─────────────────┐                            │
│  │ あなたの回答        │                            │
│  │ [_______________] │                            │
│  │         [送信]    │                            │
│  └─────────────────┘                            │
│                                                 │
├─────────────────────────────────────────────────┤
│  [参加者一覧]  [タイマー]                          │
└─────────────────────────────────────────────────┘
```

### 主要コンポーネント

- `IcebreakerPanel` — 質問表示、シャッフル/カスタムボタン（ファシリテーター用）
- `IcebreakerAnswerForm` — 自分の回答入力フォーム
- `IcebreakerAnswerList` — 全員の回答をグリッド表示（リアルタイム更新）

## バックエンドモジュール構成

```
icebreaker/
├── domain/
│   ├── IcebreakerAnswer.kt
│   ├── IcebreakerEvent.kt
│   ├── IcebreakerAnswerRepository.kt
│   └── IcebreakerQuestions.kt      # 組み込み質問セット（定数）
├── usecase/
│   ├── SetIcebreakerQuestionUseCase.kt
│   ├── SubmitIcebreakerAnswerUseCase.kt
│   ├── UpdateIcebreakerAnswerUseCase.kt
│   ├── DeleteIcebreakerAnswerUseCase.kt
│   ├── GetIcebreakerUseCase.kt
│   ├── IcebreakerDtos.kt
│   └── IcebreakerMapper.kt
└── gateway/
    ├── controller/
    │   └── IcebreakerController.kt
    └── db/
        ├── JpaIcebreakerAnswerRepository.kt
        └── SpringDataIcebreakerAnswerRepository.kt
```

## 組み込み質問セット（例）

1. 最近ハマっていることは？
2. 子どものころの夢は？
3. 無人島に1つだけ持っていくなら？
4. 今一番行きたい場所は？
5. 最近読んで良かった本/記事は？
6. 自分を動物に例えると？
7. スーパーパワーが1つ手に入るなら何がいい？
8. 最近の小さな幸せは？
9. 今年中に達成したいことは？
10. チームメンバーに聞いてみたいことは？

（フルリストは実装時に20〜30問用意）

## テスト戦略

- **バックエンド:** ドメインテスト、UseCase テスト、Controller テスト（既存パターン踏襲）
- **フロントエンド:** コンポーネントテスト、Store テスト
- **E2E:** 既存の `board-creation` にアイスブレイカー有効ケース追加
- **カバレッジ:** 80%閾値を維持

## 既存コードへの影響

- `Phase.kt` — ICEBREAK追加、validTransitions更新
- `Board.kt` — `enableIcebreaker`, `icebreakerQuestion`フィールド追加、初期フェーズ分岐
- `CreateBoardUseCase.kt` / `BoardDtos.kt` — リクエスト/レスポンスに追加
- `DomainEventBroadcaster.kt` — アイスブレイカーイベント処理追加
- Flyway: `V16__add_icebreaker.sql`
- フロントエンド: `types/index.ts`, `api/client.ts`, `boardStore.ts`, `useWebSocket.ts`, `PhaseControl.tsx`, `BoardPage.tsx` など
