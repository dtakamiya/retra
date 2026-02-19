# Kudosウォール設計書

## 概要

スクラムチームの振り返りを楽しく継続するために、チームメンバーへの感謝・称賛を送る「Kudosウォール」機能を追加する。

### 背景・リサーチ結果

- ピア認知（peer recognition）はパフォーマンスを最大14%向上させる研究結果がある
- TeamRetro、Parabol、EasyRetro等の主要レトロツールがKudos機能を標準搭載
- レトロ開始時に感謝から始めることで心理的安全性が高まり、建設的な議論を促進する

## ユーザー体験

### 送信フロー

1. ボードヘッダーの「🌟 Kudos」ボタンをクリック
2. 右側からスライドインパネルが表示
3. パネル上部の「Kudosを送る」ボタンをクリック
4. 受信者（チームメンバー）をドロップダウンで選択
5. カテゴリをカードUIで選択（6種類）
6. 任意でメッセージ（140字以内）を追加
7. 「送信」で全員にリアルタイム通知

### Kudosカテゴリ

| カテゴリ | アイコン | 意味 |
|----------|---------|------|
| GREAT_JOB | 🌟 | 素晴らしい仕事 |
| THANK_YOU | 🙏 | 感謝 |
| INSPIRING | 💡 | インスピレーション |
| HELPFUL | 🤝 | 助けてくれた |
| CREATIVE | 🎨 | 創造的 |
| TEAM_PLAYER | 💪 | チームプレイヤー |

### 表示ルール

- 全フェーズで閲覧・送信可能
- パネル内にKudosカードがタイムライン形式で並ぶ
- 各カードにカテゴリアイコン、送信者→受信者、メッセージを表示
- 匿名ボードでは送信者名を「誰かさんから」と表示
- 自分が送ったKudosのみ削除可能

## バックエンド設計

### 新モジュール: `kudos/`

```
kudos/
├── domain/
│   ├── Kudos.kt           # エンティティ
│   ├── KudosCategory.kt   # enum
│   ├── KudosEvent.kt      # ドメインイベント
│   └── KudosRepository.kt # リポジトリインターフェース
├── usecase/
│   ├── SendKudosUseCase.kt
│   ├── GetKudosUseCase.kt
│   ├── DeleteKudosUseCase.kt
│   ├── KudosDtos.kt
│   └── KudosMapper.kt
└── gateway/
    ├── controller/KudosController.kt
    └── db/
        ├── JpaKudosRepository.kt
        └── SpringDataKudosRepository.kt
```

### データベース: V13__create_kudos.sql

```sql
CREATE TABLE kudos (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES boards(id),
    sender_id TEXT NOT NULL REFERENCES participants(id),
    receiver_id TEXT NOT NULL REFERENCES participants(id),
    category TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kudos_board_id ON kudos(board_id);
```

### REST API

| Method | Endpoint | 説明 |
|--------|----------|------|
| POST | `/api/v1/boards/{slug}/kudos` | Kudos送信 |
| GET | `/api/v1/boards/{slug}/kudos` | ボードのKudos一覧取得 |
| DELETE | `/api/v1/boards/{slug}/kudos/{id}` | 自分のKudos削除 |

### WebSocket

- トピック: `/topic/board/{slug}/kudos`
- イベント: `KUDOS_SENT`, `KUDOS_DELETED`

## フロントエンド設計

### 新規コンポーネント

| コンポーネント | 説明 |
|---------------|------|
| `KudosButton` | ヘッダー内のトグルボタン（未読バッジ付き） |
| `KudosPanel` | 右側スライドインパネル（w-80、オーバーレイ） |
| `KudosCard` | 個々のKudos表示カード |
| `KudosSendForm` | 受信者選択 + カテゴリ選択 + メッセージ入力 |

### ストア更新

`boardStore.ts` に以下を追加:
- `kudos: Kudos[]` 状態
- `sendKudos()`, `deleteKudos()`, `setKudos()` アクション

### 型定義追加 (`types/index.ts`)

```typescript
type KudosCategory = 'GREAT_JOB' | 'THANK_YOU' | 'INSPIRING' | 'HELPFUL' | 'CREATIVE' | 'TEAM_PLAYER'

interface Kudos {
  id: string
  boardId: string
  senderId: string
  senderNickname: string
  receiverId: string
  receiverNickname: string
  category: KudosCategory
  message?: string
  createdAt: string
}
```

## スコープ

### 含む

- Kudos送信・表示・削除
- リアルタイムWebSocket更新
- 匿名ボード対応
- 全コンポーネントのユニットテスト
- E2Eテスト

### 含めない（将来検討）

- ダッシュボードへのKudos統計表示
- スナップショットへのKudos保存
- Kudosへのリアクション機能
