# Runbook

## Deployment

### プロダクションビルドの手順

```bash
# 1. フロントエンドビルド
cd frontend && npm run build

# 2. ビルド成果物をバックエンドにコピー
cd ../backend && ./gradlew copyFrontend

# 3. JAR ビルド
./gradlew build

# 4. アプリケーション起動
java -jar build/libs/retra-0.0.1-SNAPSHOT.jar
```

### デプロイ確認チェックリスト

- [ ] `frontend/dist/` が正常に生成されている
- [ ] `backend/src/main/resources/static/` にフロントエンド成果物がコピーされている
- [ ] `backend/build/libs/retra-0.0.1-SNAPSHOT.jar` が生成されている
- [ ] アプリケーションが port 8080 で起動する
- [ ] ブラウザで `http://localhost:8080` にアクセスできる
- [ ] WebSocket 接続 (`/ws`) が正常に動作する

### サーバー設定

| Setting | Value | Description |
|---------|-------|-------------|
| Port | 8080 | `application.yml` の `server.port` |
| Database | `retra.db` (相対パス) | JAR 実行ディレクトリに作成される |
| JPA DDL | `none` | Flyway でスキーマ管理 (Hibernate DDL 自動生成無効) |

### 環境変数によるオーバーライド

Spring Boot の設定は環境変数でオーバーライド可能:

```bash
# ポート変更
SERVER_PORT=9090 java -jar retra-0.0.1-SNAPSHOT.jar

# データベースファイルパス変更
SPRING_DATASOURCE_URL=jdbc:sqlite:/var/data/retra.db java -jar retra-0.0.1-SNAPSHOT.jar
```

## Monitoring

### ヘルスチェック

現在、Spring Boot Actuator は未導入です。基本的な疎通確認:

```bash
# API エンドポイントの疎通確認
curl -s http://localhost:8080/api/v1/boards | head -c 200

# WebSocket エンドポイントの確認
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ws/info
```

### ログ確認

```bash
# フォアグラウンド起動時はコンソールに出力
java -jar retra-0.0.1-SNAPSHOT.jar

# バックグラウンド起動時
java -jar retra-0.0.1-SNAPSHOT.jar > retra.log 2>&1 &
tail -f retra.log
```

### データベース確認

```bash
# SQLite CLI でデータベース確認
sqlite3 retra.db

# テーブル一覧
.tables

# ボード一覧
SELECT id, slug, title, phase FROM boards;

# マイグレーション履歴
SELECT * FROM flyway_schema_history;
```

## Common Issues and Fixes

### 1. Java バージョンエラー

**症状:** `Unsupported class file major version` や `Could not determine java version`

**原因:** Java 21 以外の JDK を使用している

**解決方法:**
```bash
# backend/gradle.properties の JAVA_HOME パスを確認
cat backend/gradle.properties

# Corretto 21 がインストールされていることを確認
/path/to/corretto-21/bin/java -version
```

### 2. SQLite ロックエラー

**症状:** `SQLITE_BUSY` or `database is locked`

**原因:** 複数のプロセスが同時にデータベースに書き込んでいる

**解決方法:**
- HikariCP のプールサイズが 1 であることを確認
- 同一の `retra.db` を使用する他のプロセスがないか確認
- WAL モードが有効であることを確認

```bash
sqlite3 retra.db "PRAGMA journal_mode;"
# 出力: wal
```

### 3. フロントエンドのプロキシエラー

**症状:** 開発中に API リクエストが 502/504 エラーになる

**原因:** バックエンドが起動していない

**解決方法:**
- バックエンドが port 8080 で起動しているか確認
- `vite.config.ts` のプロキシ設定を確認

```bash
# バックエンドの起動確認
curl http://localhost:8080/api/v1/boards
```

### 4. Flyway マイグレーションエラー

**症状:** `FlywayValidateException` や `Migration checksum mismatch`

**原因:** 既存のマイグレーションファイルが変更された

**解決方法:**
- マイグレーションファイルは一度適用したら変更しない (V1〜V7)
- 開発中にスキーマを変更する場合は新しい `V{N}__description.sql` を追加 (次は V8)
- 開発環境でリセットする場合: `retra.db` を削除して再起動

**現在のマイグレーション一覧:**
| Version | Description |
|---------|-------------|
| V1-V5 | 基本テーブル (boards, columns, participants, cards, votes) |
| V6 | カードの並べ替え用 sort_order カラム追加 |
| V7 | メモテーブル (memos) 作成 |
| V8 | リアクションテーブル (reactions) 作成 |

```bash
# 開発環境のみ: DB リセット
rm retra.db
cd backend && ./gradlew bootRun
```

### 5. SPA ルーティングが動作しない (プロダクション)

**症状:** ブラウザで直接 URL にアクセスすると 404

**原因:** フロントエンドの成果物が `resources/static/` にコピーされていない

**解決方法:**
```bash
# フロントエンドビルド + コピーを再実行
cd frontend && npm run build
cd ../backend && ./gradlew copyFrontend && ./gradlew build
```

### 6. WebSocket 接続失敗

**症状:** リアルタイム更新が反映されない

**原因:** STOMP 接続が確立できていない

**解決方法:**
- ブラウザの DevTools > Network > WS タブで接続状態を確認
- CORS 設定を確認 (`WebSocketConfig.kt`)
- プロキシ/リバースプロキシの WebSocket 設定を確認

## Rollback Procedures

### アプリケーションのロールバック

```bash
# 1. 現在のプロセスを停止
kill $(pgrep -f retra-0.0.1-SNAPSHOT.jar)

# 2. 前のバージョンの JAR で起動
java -jar /path/to/previous/retra-0.0.1-SNAPSHOT.jar
```

### データベースのロールバック

> Flyway Community Edition はロールバックをサポートしていません。

**手動ロールバック手順:**

1. データベースのバックアップから復元:
```bash
# バックアップ作成 (デプロイ前に必ず実施)
cp retra.db retra.db.backup.$(date +%Y%m%d_%H%M%S)

# 復元
cp retra.db.backup.YYYYMMDD_HHMMSS retra.db
```

2. Git で前のバージョンに戻す:
```bash
git checkout <previous-tag>
cd frontend && npm run build
cd ../backend && ./gradlew copyFrontend && ./gradlew build
```

### バックアップ推奨

デプロイ前に必ずデータベースのバックアップを取得してください:

```bash
cp retra.db retra.db.backup.$(date +%Y%m%d_%H%M%S)
```
