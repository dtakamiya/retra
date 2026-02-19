# Retra

スクラムチームのためのリアルタイム・レトロスペクティブボード

![Retra ホームページ](docs/images/home/screenshot-01-home-create-board.png)

## 主要機能

- **4種類のフレームワーク** - KPT / Fun Done Learn / 4Ls / Start Stop Continue
- **5段階のフェーズワークフロー** - 記入 → 投票 → 議論 → アクション → 完了
- **フェーズ遷移確認ダイアログ** - フェーズ移行時の確認ダイアログで誤操作を防止
- **リアクション機能** - カードへの絵文字リアクション（👍❤️😂🎉🤔👀）
- **メモ機能** - 議論・アクションフェーズでカードにメモを追加
- **アクションアイテム追跡** - アクションフェーズでアクションアイテムを作成・管理（担当者・期限・優先度・ステータス）
- **レトロ履歴ダッシュボード** - 過去のレトロスペクティブの履歴閲覧・エンゲージメント指標のトレンド分析
- **ドラッグ&ドロップ** - カードの並べ替え・カラム間移動
- **リアルタイム同期** - WebSocket（STOMP）による即時反映
- **タイマー機能** - フェーズごとの時間管理（開始・一時停止・リセット）
- **投票機能** - 1人あたりの最大投票数を設定可能、投票進捗バーで残り投票数を可視化
- **議論済みマーク** - ファシリテーターがカードに議論済みマークを付けてグレーアウト・ソート
- **フェーズベースのアクセス制御** - 記入フェーズでのみカード作成、投票フェーズでのみ投票など
- **匿名モード** - ボード作成時に設定可能、カードの投稿者名を他の参加者から非表示
- **プライベート記入モード** - 記入フェーズ中は他の参加者のカードを非表示、フェーズ遷移後に全カードを公開
- **ダークモード** - ライト/ダークテーマの切り替え
- **エクスポート機能** - ボード内容をCSVまたはMarkdown形式でダウンロード
- **アクションアイテム引き継ぎ** - 同一チームの前回レトロから未完了アクションアイテムを引き継ぎ
- **Kudos（称賛）機能** - チームメンバーへの称賛メッセージを送信（GREAT_JOB, THANK_YOU, INSPIRING, HELPFUL, CREATIVE, TEAM_PLAYER）
- **自動スナップショット** - ボード完了時に自動でスナップショットを保存
- **複数人参加** - URLを共有するだけでボードに参加可能

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| バックエンド | Spring Boot 3.5 + Kotlin 2.3 |
| フロントエンド | React 19 + TypeScript + Vite 7 + Zustand + TailwindCSS v4 |
| データベース | SQLite（Flyway マイグレーション） |
| リアルタイム通信 | WebSocket（STOMP プロトコル） |
| グラフ描画 | Recharts |

## セットアップ・実行方法

### 前提条件

- Java 21（Amazon Corretto 推奨）
- Node.js 20+

### 開発環境

バックエンドとフロントエンドを同時に起動します。

```bash
# バックエンド（ポート 8080）
cd backend && ./gradlew bootRun

# フロントエンド（ポート 5173、/api と /ws をバックエンドにプロキシ）
cd frontend && npm run dev
```

### 本番ビルド

```bash
cd frontend && npm run build
cd ../backend && ./gradlew copyFrontend && ./gradlew build
java -jar backend/build/libs/retra-0.0.1-SNAPSHOT.jar
```

### テスト・リント

```bash
# バックエンドテスト（JUnit 5 + MockK/Mockito）
cd backend && ./gradlew test

# フロントエンドテスト（Vitest + Testing Library）
cd frontend && npm run test

# フロントエンドテスト（カバレッジレポート）
cd frontend && npm run test:coverage

# E2E テスト（Playwright）
cd frontend && npm run test:e2e

# フロントエンドリント
cd frontend && npm run lint

# TypeScript 型チェック
cd frontend && npx tsc --noEmit
```

## スクリーンショット

<details>
<summary>全スクリーンショットを表示</summary>

### ホームページ - ボード作成
フレームワーク（KPT / Fun Done Learn / 4Ls / Start Stop Continue）の選択、チーム名、最大投票数、匿名モードを設定してボードを作成。

![ホームページ - ボード作成](docs/images/home/screenshot-01-home-create-board.png)

### ホームページ - ボード参加
ボードコードまたはURLを入力して既存ボードに参加。

![ホームページ - ボード参加](docs/images/home/screenshot-02-home-join-board.png)

### ニックネーム入力モーダル
ボード作成・参加時にニックネームを設定するモーダル。

![ニックネーム入力](docs/images/home/screenshot-03-nickname-modal.png)

### 記入フェーズ
各カラムにカードを追加。カードにはドラッグ&ドロップ、編集、削除、リアクション機能がある。

![記入フェーズ](docs/images/phases/screenshot-04-writing-phase.png)

### 投票フェーズ
カードに投票を行うフェーズ。投票数と投票進捗バーが表示され、1人あたりの最大投票数を管理。

![投票フェーズ](docs/images/phases/screenshot-05-voting-phase.png)

### 議論フェーズ
投票結果を参考に議論を進めるフェーズ。リアクション、メモ、議論済みマーク機能を利用可能。

![議論フェーズ](docs/images/phases/screenshot-06-discussion-phase.png)

### メモ機能
カードに議論メモを追加・表示。チームの議論内容を記録できる。

![メモ機能](docs/images/phases/screenshot-07-memo-expanded.png)

### アクションアイテムフェーズ
議論を踏まえてアクションアイテムを作成・管理。期限・優先度（高/中/低）・ステータス管理に対応。

![アクションアイテムフェーズ](docs/images/phases/screenshot-08-action-items-phase.png)

### 完了フェーズ
レトロスペクティブが完了した状態。ボードのスナップショットが自動保存され、アクションアイテムの一覧を確認可能。

![完了フェーズ](docs/images/phases/screenshot-09-closed-phase.png)

### タイマー機能
フェーズごとの時間管理。開始・一時停止・リセット操作が可能。

![タイマー機能](docs/images/features/screenshot-10-timer-running.png)

### チームダッシュボード
過去のレトロスペクティブの統計情報とトレンドグラフ。カード数・投票数・参加者数・AI完了率を可視化。

![チームダッシュボード](docs/images/dashboard/screenshot-11-dashboard.png)

### レトロスペクティブ履歴
チームごとのレトロスペクティブ履歴一覧。各レトロの詳細にアクセス可能。

![レトロ履歴](docs/images/dashboard/screenshot-12-dashboard-history.png)

### 404 ページ
存在しないボードにアクセスした場合のエラーページ。

![404ページ](docs/images/error/screenshot-13-not-found.png)

</details>

## アーキテクチャ

### イベント駆動リアルタイム更新

```
REST API → UseCase（DB永続化）→ Spring ApplicationEvent
  → DomainEventBroadcaster（@EventListener）→ STOMP broadcast
    → /topic/board/{slug}/{category}
      → フロントエンド Zustand Store 更新
```

### ディレクトリ構成

```
backend/src/main/kotlin/com/retra/
├── config/              # SPA fallback, CORS, WebSocket設定
├── shared/
│   ├── domain/          # DomainException, DomainEvent
│   └── gateway/         # イベント発行, 例外ハンドラ, STOMP ブロードキャスト
├── board/
│   ├── domain/          # Board, Participant, Framework, Phase
│   ├── usecase/         # ボード作成・取得・フェーズ遷移・参加・エクスポート
│   └── gateway/         # REST コントローラ, JPA リポジトリ, WebSocket
├── card/
│   ├── domain/          # Card, Vote, Memo, Reaction
│   ├── usecase/         # カード・投票・メモ・リアクション操作
│   └── gateway/         # REST コントローラ, JPA リポジトリ
├── timer/
│   ├── usecase/         # タイマーサービス
│   └── gateway/         # REST コントローラ
├── actionitem/
│   ├── domain/          # ActionItem, ActionItemStatus
│   ├── usecase/         # アクションアイテムCRUD・ステータス変更
│   └── gateway/         # REST コントローラ, JPA リポジトリ
├── kudos/
│   ├── domain/          # Kudos, KudosCategory
│   ├── usecase/         # Kudos送信・取得・削除
│   └── gateway/         # REST コントローラ, JPA リポジトリ
└── history/
    ├── domain/          # BoardSnapshot
    ├── usecase/         # スナップショット作成・取得・トレンド分析
    └── gateway/         # REST コントローラ, JPA リポジトリ

frontend/src/
├── api/                 # REST API クライアント
├── pages/               # ページコンポーネント（5ページ）
├── components/          # UI コンポーネント（40）
├── store/               # Zustand ストア
├── websocket/           # STOMP クライアント
├── hooks/               # カスタムフック
├── test/                # テストユーティリティ・フィクスチャ
├── types/               # TypeScript 型定義
└── utils/               # ユーティリティ (エクスポート変換等)
```

## API エンドポイント

すべてのエンドポイントは `/api/v1` 配下です。

### ボード

| メソッド | パス | 説明 |
|---------|------|------|
| `POST` | `/boards` | ボード作成 |
| `GET` | `/boards/{slug}` | ボード取得 |
| `PATCH` | `/boards/{slug}/phase` | フェーズ遷移（ファシリテーターのみ） |
| `POST` | `/boards/{slug}/participants` | ボード参加 |

### カード

| メソッド | パス | 説明 |
|---------|------|------|
| `POST` | `/boards/{slug}/cards` | カード作成（記入フェーズのみ） |
| `PUT` | `/boards/{slug}/cards/{id}` | カード更新（投稿者のみ） |
| `DELETE` | `/boards/{slug}/cards/{id}` | カード削除（投稿者またはファシリテーター） |
| `PATCH` | `/boards/{slug}/cards/{id}/move` | カード移動（ドラッグ&ドロップ） |
| `PATCH` | `/boards/{slug}/cards/{id}/discussed` | 議論済みマーク切替（ファシリテーターのみ） |

### 投票

| メソッド | パス | 説明 |
|---------|------|------|
| `POST` | `/boards/{slug}/votes` | 投票（投票フェーズのみ） |
| `DELETE` | `/boards/{slug}/votes` | 投票取消（投票フェーズのみ） |
| `GET` | `/boards/{slug}/votes/remaining` | 残り投票数取得 |

### メモ

| メソッド | パス | 説明 |
|---------|------|------|
| `POST` | `/boards/{slug}/cards/{cardId}/memos` | メモ作成 |
| `PUT` | `/boards/{slug}/cards/{cardId}/memos/{memoId}` | メモ更新 |
| `DELETE` | `/boards/{slug}/cards/{cardId}/memos/{memoId}` | メモ削除 |

### リアクション

| メソッド | パス | 説明 |
|---------|------|------|
| `POST` | `/boards/{slug}/reactions` | リアクション追加 |
| `DELETE` | `/boards/{slug}/reactions` | リアクション削除 |

### タイマー

| メソッド | パス | 説明 |
|---------|------|------|
| `POST` | `/boards/{slug}/timer` | タイマー操作（ファシリテーターのみ） |
| `GET` | `/boards/{slug}/timer` | タイマー状態取得 |

### エクスポート

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/boards/{slug}/export` | ボードエクスポート（CSV/Markdown） |

### アクションアイテム

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/boards/{slug}/action-items` | アクションアイテム一覧取得 |
| `POST` | `/boards/{slug}/action-items` | アクションアイテム作成（アクションフェーズのみ） |
| `PUT` | `/boards/{slug}/action-items/{id}` | アクションアイテム更新 |
| `PATCH` | `/boards/{slug}/action-items/{id}/status` | アクションアイテムステータス変更 |
| `DELETE` | `/boards/{slug}/action-items/{id}` | アクションアイテム削除 |

### アクションアイテム引き継ぎ

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/boards/{slug}/carry-over-items` | 前回レトロの引き継ぎアクションアイテム取得 |
| `PATCH` | `/boards/{slug}/carry-over-items/{actionItemId}/status` | 引き継ぎアイテムステータス更新（ファシリテーターのみ） |

### Kudos（称賛）

| メソッド | パス | 説明 |
|---------|------|------|
| `POST` | `/boards/{slug}/kudos` | Kudos送信（全フェーズ） |
| `GET` | `/boards/{slug}/kudos` | Kudos一覧取得 |
| `DELETE` | `/boards/{slug}/kudos/{id}` | Kudos削除（送信者のみ） |

### 履歴・ダッシュボード

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/history` | レトロ履歴一覧（`teamName` でフィルタ可能） |
| `GET` | `/history/{snapshotId}` | スナップショット詳細取得 |
| `GET` | `/history/trends` | トレンドデータ取得（`teamName` でフィルタ可能） |
