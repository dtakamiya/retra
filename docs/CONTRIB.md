# Contributing Guide

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Java | 21 (Corretto) | `backend/gradle.properties` で `org.gradle.java.home` を設定可能 |
| Node.js | 20+ | フロントエンド開発に必要 |
| npm | 10+ | Node.js に同梱 |

## Environment Setup

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd retra
```

### 2. バックエンドのセットアップ

```bash
cd backend
./gradlew build
```

> Java 21 (Corretto) が必要です。システムのデフォルト Java が 21 でない場合は、`backend/gradle.properties` に `org.gradle.java.home` を設定してください。

### 3. フロントエンドのセットアップ

```bash
cd frontend
npm install
```

## Environment Variables

このプロジェクトでは `.env` ファイルは使用していません。設定は以下のファイルで管理されています:

| File | Purpose |
|------|---------|
| `backend/src/main/resources/application.yml` | Spring Boot 設定 (DB, サーバーポート等) |
| `backend/gradle.properties` | Gradle / Java 設定 (JAVA_HOME) |
| `frontend/vite.config.ts` | Vite 開発サーバー設定 (プロキシ等) |

### Backend Configuration (`application.yml`)

| Setting | Value | Description |
|---------|-------|-------------|
| `spring.datasource.url` | `jdbc:sqlite:retra.db` | SQLite データベースファイルパス |
| `spring.datasource.hikari.maximum-pool-size` | `1` | SQLite は単一書き込みのため |
| `spring.jpa.hibernate.ddl-auto` | `none` | Flyway でスキーマ管理 (Hibernate の DDL 自動生成は無効) |
| `server.port` | `8080` | バックエンドのポート |

## Development Workflow

### 開発サーバーの起動

バックエンドとフロントエンドを**同時に**起動してください:

```bash
# Terminal 1: Backend (port 8080)
cd backend && ./gradlew bootRun

# Terminal 2: Frontend (port 5173, /api と /ws をバックエンドにプロキシ)
cd frontend && npm run dev
```

ブラウザで http://localhost:5173 を開いてください。

### Available Scripts

#### Frontend (`frontend/package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | 開発サーバー起動 (HMR, port 5173) |
| `build` | `tsc -b && vite build` | TypeScript チェック + プロダクションビルド |
| `lint` | `eslint .` | ESLint によるコード検査 |
| `preview` | `vite preview` | ビルド後のプレビューサーバー |
| `test` | `vitest run` | ユニットテスト実行 |
| `test:watch` | `vitest` | テスト監視モード |
| `test:coverage` | `vitest run --coverage` | テスト + カバレッジレポート (V8) |
| `test:e2e` | `playwright test` | E2E テスト実行 |
| `test:e2e:ui` | `playwright test --ui` | E2E テスト (UI モード) |

#### Backend (Gradle Tasks)

| Task | Description |
|------|-------------|
| `./gradlew bootRun` | 開発サーバー起動 |
| `./gradlew build` | アプリケーションビルド (JAR 生成) |
| `./gradlew test` | テスト実行 (JaCoCo レポート自動生成) |
| `./gradlew copyFrontend` | フロントエンドビルド成果物を `resources/static` にコピー |
| `./gradlew jacocoTestReport` | コードカバレッジレポート生成 (HTML + XML) |
| `./gradlew jacocoTestCoverageVerification` | カバレッジ検証 (80% 閾値) |

## Testing

### バックエンドテスト

```bash
cd backend && ./gradlew test
```

- JUnit 5 + MockK + Mockito-Kotlin
- テストは `backend/src/test/` 配下
- JaCoCo カバレッジ 80% 閾値
- テスト用 DB: インメモリ SQLite (`jdbc:sqlite::memory:`)

### フロントエンドテスト

```bash
# ユニットテスト
cd frontend && npm run test

# テスト (監視モード)
cd frontend && npm run test:watch

# カバレッジレポート
cd frontend && npm run test:coverage

# E2E テスト
cd frontend && npm run test:e2e
```

- Vitest + React Testing Library + jsdom
- V8 カバレッジ 80% 閾値
- 全コンポーネントにコロケーションテストファイル (`.test.ts(x)`)

### フロントエンドの検査

```bash
# ESLint
cd frontend && npm run lint

# TypeScript 型チェック
cd frontend && npx tsc --noEmit
```

## Database

### マイグレーション

Flyway で管理。マイグレーションファイルは `backend/src/main/resources/db/migration/` に配置:

| Migration | Description |
|-----------|-------------|
| `V1__create_boards.sql` | ボードテーブル作成 |
| `V2__create_columns.sql` | カラムテーブル作成 |
| `V3__create_participants.sql` | 参加者テーブル作成 |
| `V4__create_cards.sql` | カードテーブル作成 |
| `V5__create_votes.sql` | 投票テーブル作成 |
| `V6__add_card_sort_order.sql` | カードの並べ替え用 sort_order カラム追加 |
| `V7__create_memos.sql` | メモテーブル作成 |
| `V8__create_reactions.sql` | リアクションテーブル作成 |
| `V9__create_action_items.sql` | アクションアイテムテーブル作成 |
| `V10__create_board_snapshots.sql` | ボードスナップショットテーブル作成 |
| `V11__add_ux_improvements.sql` | UX 改善（議論マーク等） |
| `V12__add_team_name_to_boards.sql` | ボードに team_name カラム追加 |
| `V13__create_kudos.sql` | Kudos（称賛）テーブル作成 |
| `V14__add_indexes.sql` | パフォーマンス向上のためのインデックス追加 |
| `V15__add_private_writing_to_boards.sql` | ボードにプライベート記入モードフラグ追加 |

新しいマイグレーションを追加する場合は `V16__description.sql` のように命名してください。

### SQLite の制約

- HikariCP プールサイズ = 1 (単一書き込み)
- WAL モード有効
- `busy_timeout=5000ms`
- `foreign_keys=ON`

## Production Build

```bash
# 1. フロントエンドビルド
cd frontend && npm run build

# 2. ビルド成果物をバックエンドにコピー
cd ../backend && ./gradlew copyFrontend

# 3. JAR ビルド
./gradlew build

# 4. 実行
java -jar build/libs/retra-0.0.1-SNAPSHOT.jar
```

## Git Workflow

### コミットメッセージ

Conventional Commits 形式を使用:

```
<type>: <description>
```

| Type | Usage |
|------|-------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `refactor` | リファクタリング |
| `docs` | ドキュメント更新 |
| `test` | テスト追加・修正 |
| `chore` | 雑務 (依存関係更新等) |
| `perf` | パフォーマンス改善 |
| `ci` | CI/CD 設定変更 |

## Tech Stack Reference

### Backend

| Library | Version | Purpose |
|---------|---------|---------|
| Spring Boot | 3.5.10 | Web フレームワーク |
| Kotlin | 2.3.10 | 言語 |
| Spring Data JPA | - | データアクセス |
| Spring WebSocket | - | STOMP リアルタイム通信 |
| Flyway | - | DB マイグレーション |
| SQLite JDBC | 3.51.2.0 | DB ドライバ |
| Hibernate SQLite Dialect | (managed) | JPA Dialect |
| Jackson Kotlin Module | - | JSON シリアライゼーション |
| Apache Commons CSV | 1.14.1 | CSV エクスポート |

### Frontend

| Library | Version | Purpose |
|---------|---------|---------|
| React | ^19.2.0 | UI ライブラリ |
| TypeScript | ~5.9.3 | 型安全 |
| Vite | ^7.2.4 | ビルドツール |
| Zustand | ^5.0.11 | 状態管理 |
| TailwindCSS | ^4.1.18 | CSS フレームワーク |
| @stomp/stompjs | ^7.3.0 | WebSocket (STOMP) クライアント |
| React Router | ^7.13.0 | ルーティング |
| Lucide React | ^0.574.0 | アイコン |
| @dnd-kit/core | ^6.3.1 | ドラッグ&ドロップ (コア) |
| @dnd-kit/sortable | ^10.0.0 | ドラッグ&ドロップ (ソート) |
| Recharts | ^3.7.0 | ダッシュボード用チャート |
