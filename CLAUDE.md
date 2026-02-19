# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 必須ルール
- **全ての回答は日本語で行うこと**
- **何か修正を行う時には、以下のフローで修正を行うこと**
  1. **git worktreeで隔離ブランチを作成**
     ```bash
     git worktree add ../retra-<branch-name> -b <branch-name>
     cd ../retra-<branch-name>
     ```
     - ブランチ名は `feat/○○` `fix/○○` `refactor/○○` 等、Conventional Commits に準拠
  2. **TDDで修正を行う**
     - まずテストを書く（Red）→ 実装する（Green）→ リファクタリング（Refactor）
     - バックエンド: `backend/src/test/` にテスト追加
     - フロントエンド: 対象ファイルと同階層に `.test.ts(x)` を追加
  3. **テストを行う**
     ```bash
     # バックエンドテスト
     cd backend && ./gradlew test
     # フロントエンドテスト
     cd frontend && npm run test
     # フロントエンドLint + 型チェック
     cd frontend && npm run lint && npx tsc --noEmit
     # E2Eテスト（必要に応じて）
     cd frontend && npm run test:e2e
     ```
     - カバレッジ80%閾値を維持すること
  4. **コミット、プッシュ、PRを作成する**
     ```bash
     git add .
     git commit -m "<type>: <description>"
     git push -u origin <branch-name>
     ```
     - コミットメッセージは Conventional Commits 形式（`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`）
     - `gh pr create --title "<type>: <description>" --body "<PR説明>"` または GitHub Web UI で PR 作成
  5. **worktreeクリーンアップ**
     ```bash
     cd ../retra   # メインのワークツリーに戻る
     git worktree remove ../retra-<branch-name>
     ```

## Project Overview

Retra is a real-time retrospective board for Scrum teams. It supports multiple frameworks (KPT, Fun Done Learn, 4Ls, Start Stop Continue) with phase-based workflows (Writing -> Voting -> Discussion -> Action Items -> Closed).

- **Backend:** Spring Boot 3.5.10 + Kotlin 2.3.10 (`backend/`)
- **Frontend:** React 19.2 + TypeScript 5.9 + Vite 7 + Zustand 5 + TailwindCSS v4 (`frontend/`)
- **Database:** SQLite with Flyway migrations (V1-V15)
- **CI/CD:** GitHub Actions（CI: テスト・Lint・ビルド、Dependabot: 依存関係自動更新、Auto-Merge）
- **Realtime:** WebSocket via STOMP protocol (`@stomp/stompjs`)
- **Drag & Drop:** @dnd-kit (core, sortable, utilities)
- **Icons:** Lucide React
- **Routing:** React Router v7

## Build & Run Commands

### Development (run both simultaneously)

```bash
# Backend (port 8080)
cd backend && ./gradlew bootRun

# Frontend (port 5173, proxies /api and /ws to backend)
cd frontend && npm run dev
```

### Production Build

```bash
cd frontend && npm run build
cd ../backend && ./gradlew copyFrontend && ./gradlew build
java -jar backend/build/libs/retra-0.0.1-SNAPSHOT.jar
```

### Testing & Linting

```bash
# Backend tests (JUnit 5 + MockK/Mockito)
cd backend && ./gradlew test

# Frontend tests (Vitest + Testing Library)
cd frontend && npm run test

# Frontend tests in watch mode
cd frontend && npm run test:watch

# Frontend test coverage report
cd frontend && npm run test:coverage

# E2E tests (Playwright)
cd frontend && npm run test:e2e

# E2E tests with UI mode
cd frontend && npm run test:e2e:ui

# Frontend lint (ESLint flat config)
cd frontend && npm run lint

# TypeScript type check
cd frontend && npx tsc --noEmit
```

Both backend (JaCoCo) and frontend (V8) enforce **80% code coverage thresholds**.

## Architecture

### Modular Monolith (Backend)

The backend follows a **modular monolith** architecture with clean architecture principles. Each module has `domain/`, `usecase/`, and `gateway/` layers.

### Event-Driven Real-Time Updates

The core pattern: REST API call -> UseCase persists to DB -> UseCase publishes `DomainEvent` -> `DomainEventBroadcaster` (@EventListener) -> STOMP broadcast to `/topic/board/{slug}/{category}` -> Frontend Zustand store updates.

Key files: `shared/gateway/websocket/DomainEventBroadcaster.kt`, `websocket/useWebSocket.ts`, `store/boardStore.ts`

### Backend Structure (`backend/src/main/kotlin/com/retra/`)

#### `shared/` - Shared Infrastructure
| Package | Purpose |
|---------|---------|
| `shared/domain/` | `DomainException` (base + `NotFoundException`, `BadRequestException`, `ForbiddenException`, `ConflictException`, `InvalidPhaseTransitionException`), `DomainEvent` (base class for all domain events), `AggregateRoot`, `EnumParser` |
| `shared/gateway/event/` | `SpringDomainEventPublisher` (Spring ApplicationEvent bridge) |
| `shared/gateway/exception/` | `GlobalExceptionHandler` (`@RestControllerAdvice`) |
| `shared/gateway/websocket/` | `DomainEventBroadcaster` (STOMP broadcast for all domain events) |

#### `board/` - Board Module
| Package | Purpose |
|---------|---------|
| `board/domain/` | `Board` (includes `teamName`, `privateWriting`), `BoardColumn`, `Participant`, `BoardSlug`, `VoteLimit`, `Framework`, `Phase`, `BoardAuthorizationService`, `BoardEvent`, repositories |
| `board/usecase/` | `CreateBoardUseCase` (`CreateBoardRequest` includes `teamName`, `privateWriting`), `GetBoardUseCase`, `TransitionPhaseUseCase`, `JoinBoardUseCase`, `UpdateOnlineStatusUseCase`, `ExportBoardUseCase`, `BoardDtos`, `ExportDtos`, `BoardMapper` |
| `board/usecase/export/` | `CsvExportService`, `MarkdownExportService` (CSV/Markdownエクスポート) |
| `board/gateway/controller/` | `BoardController` (REST) |
| `board/gateway/db/` | JPA repository implementations (`JpaBoardRepository`, `JpaParticipantRepository`) + Spring Data interfaces (`SpringDataBoardRepository`, `SpringDataParticipantRepository`) |
| `board/gateway/websocket/` | `WebSocketController`, `WebSocketEventListener` |

#### `card/` - Card Module (Cards, Votes, Memos, Reactions)
| Package | Purpose |
|---------|---------|
| `card/domain/` | `Card`, `Vote`, `Memo`, `Reaction`, `CardEvent`, `VoteEvent`, `MemoEvent`, `ReactionEvent`, repositories |
| `card/usecase/` | `CreateCardUseCase`, `UpdateCardUseCase`, `DeleteCardUseCase`, `MoveCardUseCase`, `MarkCardDiscussedUseCase`, `AddVoteUseCase`, `RemoveVoteUseCase`, `GetRemainingVotesUseCase`, `CreateMemoUseCase`, `UpdateMemoUseCase`, `DeleteMemoUseCase`, `AddReactionUseCase`, `RemoveReactionUseCase`, DTOs (`CardDtos`, `MemoDtos`, `ReactionDtos`), Mappers (`CardMapper`, `MemoMapper`, `ReactionMapper`) |
| `card/gateway/controller/` | `CardController`, `VoteController`, `MemoController`, `ReactionController` (REST) |
| `card/gateway/db/` | JPA repository implementations (`JpaCardRepository`, `JpaVoteRepository`, `JpaMemoRepository`, `JpaReactionRepository`) + Spring Data interfaces (`SpringDataCardRepository`, `SpringDataVoteRepository`, `SpringDataMemoRepository`, `SpringDataReactionRepository`) |

#### `timer/` - Timer Module
| Package | Purpose |
|---------|---------|
| `timer/usecase/` | `TimerService`, `TimerDtos` |
| `timer/gateway/controller/` | `TimerController` (REST) |

#### `actionitem/` - Action Item Module
| Package | Purpose |
|---------|---------|
| `actionitem/domain/` | `ActionItem`, `ActionItemStatus`, `ActionItemPriority`, `ActionItemEvent`, `ActionItemRepository` |
| `actionitem/usecase/` | `CreateActionItemUseCase`, `UpdateActionItemUseCase`, `UpdateActionItemStatusUseCase`, `DeleteActionItemUseCase`, `GetActionItemsUseCase`, `GetCarryOverItemsUseCase`, `UpdateCarryOverItemStatusUseCase`, DTOs (`ActionItemDtos`, `CarryOverDtos`), Mapper (`ActionItemMapper`) |
| `actionitem/gateway/controller/` | `ActionItemController`, `CarryOverController` (REST) |
| `actionitem/gateway/db/` | JPA repository implementations (`JpaActionItemRepository`) + Spring Data interfaces (`SpringDataActionItemRepository`) |

#### `kudos/` - Kudos Module
| Package | Purpose |
|---------|---------|
| `kudos/domain/` | `Kudos`, `KudosCategory`, `KudosEvent`, `KudosRepository` |
| `kudos/usecase/` | `SendKudosUseCase`, `GetKudosUseCase`, `DeleteKudosUseCase`, DTOs (`KudosDtos`), Mapper (`KudosMapper`) |
| `kudos/gateway/controller/` | `KudosController` (REST) |
| `kudos/gateway/db/` | JPA repository implementations (`JpaKudosRepository`) + Spring Data interfaces (`SpringDataKudosRepository`) |

#### `history/` - History Module
| Package | Purpose |
|---------|---------|
| `history/domain/` | `BoardSnapshot`, `BoardSnapshotRepository` |
| `history/usecase/` | `CreateSnapshotUseCase`, `GetSnapshotUseCase`, `GetTeamHistoryUseCase`, DTOs (`SnapshotDtos` incl. `TrendPoint` with engagement metrics: `cardsPerParticipant`, `votesPerParticipant`, `votesPerCard`, `actionItemRate`, `actionItemCompletionRate`), Mapper (`SnapshotMapper` with `safeDiv` helper) |
| `history/gateway/controller/` | `HistoryController` (REST) |
| `history/gateway/db/` | JPA repository implementations (`JpaBoardSnapshotRepository`) + Spring Data interfaces (`SpringDataBoardSnapshotRepository`) |

#### `config/` - Application Configuration
| File | Purpose |
|------|---------|
| `SpaConfig.kt` | SPA fallback for production |
| `WebConfig.kt` | CORS configuration |
| `WebSocketConfig.kt` | WebSocket STOMP setup |

Entry point: `RetraApplication.kt`

### Frontend Structure (`frontend/src/`)

| Directory | Purpose |
|-----------|---------|
| `api/client.ts` | REST API wrapper (`/api/v1` base) |
| `pages/` | `HomePage` (create/join), `BoardPage` (main board), `TeamDashboardPage` (history + trends), `SnapshotDetailPage` (snapshot detail), `NotFoundPage` |
| `components/` | `ActionItemCard`, `ActionItemForm`, `ActionItemList`, `ActionItemPriorityBadge`, `ActionItemStatusBadge`, `BoardFilterBar`, `BoardHeader`, `BoardSkeleton`, `BoardView`, `CardDetailModal`, `CardForm`, `CardItem`, `CarryOverPanel`, `CharacterCounter`, `ColumnView`, `ConnectionBanner`, `DiscussionProgress`, `ExportMenu`, `KudosCard`, `KudosPanel`, `KudosSendForm`, `MemoForm`, `MemoItem`, `MemoList`, `NicknameModal`, `OverallDiscussionProgress`, `ParticipantList`, `PhaseControl`, `PhaseGuidance`, `PhaseTransitionDialog`, `ReactionList`, `ReactionPicker`, `RetroHistoryList`, `RetroSummaryCard`, `SnapshotDetailView`, `ThemeToggle`, `TimerDisplay`, `ToastContainer`, `TrendChart`, `VoteProgressBar` |
| `store/boardStore.ts` | Zustand store with WebSocket event handlers |
| `store/toastStore.ts` | Toast notification store (success/error/info, 4秒自動削除) |
| `store/themeStore.ts` | Theme state management (light/dark mode) |
| `websocket/useWebSocket.ts` | STOMP client hook with auto-reconnect |
| `hooks/useTimerAlert.ts` | Timer alert sound hook |
| `types/index.ts` | Shared TypeScript type definitions (`Board`, `Card`, `Memo`, `Reaction`, `Kudos`, `ExportFormat`, `CardMovedPayload`, `ReactionRemovedPayload`, `KudosDeletedPayload`, `PrivateCardCreatedPayload`, `PrivateCardDeletedPayload`, etc.) |
| `types/filter.ts` | Filter state types (`FilterState`, `DEFAULT_FILTER_STATE`) |
| `utils/` | Utility functions (`exportMarkdown.ts` - Markdown export conversion) |
| `test/` | Test utilities: `setup.ts`, `fixtures.ts`, `test-utils.tsx`, `dnd-mocks.ts` |

App entry: `main.tsx` -> `App.tsx` (React Router with 5 routes)

### API Routes

All REST endpoints are under `/api/v1`:
- `POST /boards` - Create board
- `GET /boards/{slug}` - Get board details
- `PATCH /boards/{slug}/phase` - Phase transition (facilitator only)
- `POST /boards/{slug}/participants` - Join board
- `POST /boards/{slug}/cards` - Create card (WRITING phase only)
- `PUT /boards/{slug}/cards/{id}` - Update card (author only)
- `DELETE /boards/{slug}/cards/{id}` - Delete card (author or facilitator)
- `PATCH /boards/{slug}/cards/{id}/move` - Move card between columns (drag & drop)
- `PATCH /boards/{slug}/cards/{id}/discussed` - Toggle discussed mark (facilitator only, DISCUSSION/ACTION_ITEMS phase)
- `POST /boards/{slug}/votes` - Add vote (VOTING phase only)
- `DELETE /boards/{slug}/votes` - Remove vote (VOTING phase only)
- `GET /boards/{slug}/votes/remaining?participantId=` - Get remaining votes
- `POST /boards/{slug}/cards/{cardId}/memos` - Create memo
- `PUT /boards/{slug}/cards/{cardId}/memos/{memoId}` - Update memo
- `DELETE /boards/{slug}/cards/{cardId}/memos/{memoId}` - Delete memo
- `POST /boards/{slug}/reactions` - Add reaction (emoji: 👍❤️😂🎉🤔👀)
- `DELETE /boards/{slug}/reactions` - Remove reaction
- `POST /boards/{slug}/kudos` - Send kudos (all phases)
- `GET /boards/{slug}/kudos` - Get all kudos for board
- `DELETE /boards/{slug}/kudos/{id}` - Delete own kudos
- `POST /boards/{slug}/timer` - Timer control (facilitator only)
- `GET /boards/{slug}/timer` - Get timer state
- `GET /boards/{slug}/export` - Export board (CSV/Markdown, query params: `participantId`, `format`)
- `GET /boards/{slug}/action-items` - Get action items
- `POST /boards/{slug}/action-items` - Create action item (ACTION_ITEMS phase)
- `PUT /boards/{slug}/action-items/{id}` - Update action item
- `PATCH /boards/{slug}/action-items/{id}/status` - Change action item status
- `DELETE /boards/{slug}/action-items/{id}` - Delete action item
- `GET /boards/{slug}/carry-over-items` - Get carry-over action items from previous retro
- `PATCH /boards/{slug}/carry-over-items/{actionItemId}/status` - Update carry-over item status (facilitator only)
- `GET /history` - Get retro history (optional query param: `teamName`)
- `GET /history/{snapshotId}` - Get snapshot detail
- `GET /history/trends` - Get trend data (optional query param: `teamName`)

### WebSocket Events

STOMP topics under `/topic/board/{slug}/`:
- `cards` - `CARD_CREATED`, `CARD_UPDATED`, `CARD_MOVED`, `CARD_DELETED`, `CARD_DISCUSSION_MARKED`, `CARD_CREATED_PRIVATE`, `CARD_UPDATED_PRIVATE`, `CARD_DELETED_PRIVATE`
- `votes` - `VOTE_ADDED`, `VOTE_REMOVED`
- `reactions` - `REACTION_ADDED`, `REACTION_REMOVED`
- `memos` - `MEMO_CREATED`, `MEMO_UPDATED`, `MEMO_DELETED`
- `phase` - `PHASE_CHANGED`
- `timer` - `TIMER_UPDATE`
- `participants` - `PARTICIPANT_JOINED`, `PARTICIPANT_ONLINE_CHANGED`
- `action-items` - `ACTION_ITEM_CREATED`, `ACTION_ITEM_UPDATED`, `ACTION_ITEM_STATUS_CHANGED`, `ACTION_ITEM_DELETED`
- `kudos` - `KUDOS_SENT`, `KUDOS_DELETED`

### Phase-Based Access Control

Business rules are enforced in the usecase layer:
- Cards: create only in WRITING phase; edit by author only; delete by author or facilitator
- Card move: drag & drop between columns with sort order
- Votes: add/remove only in VOTING phase; max votes per person enforced
- Memos: create/edit/delete in DISCUSSION and ACTION_ITEMS phases
- Action Items: create/edit/delete only in ACTION_ITEMS phase; view in CLOSED phase; priority (HIGH/MEDIUM/LOW)
- Discussion mark: facilitator only, toggle in DISCUSSION/ACTION_ITEMS phases; discussed cards grayed out and sorted to bottom
- Anonymous mode: set at board creation, cannot be changed; hides author names from other participants (self visible)
- Private writing mode: set at board creation; hides cards from other participants during WRITING phase; cards become visible after phase transition
- Phase transitions: facilitator only, must follow sequential order
- Timer: facilitator only
- Kudos: send in all phases; delete by sender only; categories (GREAT_JOB, THANK_YOU, INSPIRING, HELPFUL, CREATIVE, TEAM_PLAYER); anonymous mode hides sender name; 140 char message limit
- Auto-snapshot: created automatically when board transitions to CLOSED phase

## Testing

### Backend Tests (`backend/src/test/`)
- **Framework:** JUnit 5 + MockK + Mockito-Kotlin
- **Config:** `application-test.yml` uses in-memory SQLite (`jdbc:sqlite::memory:`)
- **Test fixtures:** `TestFixtures.kt` provides shared test data builders
- **Structure:** Tests mirror the modular monolith structure:
  - `board/domain/` - Board, BoardSlug, BoardColumn, BoardAuthorizationService, Framework, Phase, VoteLimit tests
  - `board/usecase/` - CreateBoard, GetBoard, TransitionPhase, JoinBoard, UpdateOnlineStatus, ExportBoard usecase tests
  - `board/usecase/export/` - CsvExportService, MarkdownExportService tests
  - `board/gateway/controller/` - BoardController, WebSocketController tests
  - `board/gateway/websocket/` - WebSocketEventListener test
  - `card/domain/` - Card, CardDiscussion, Memo, Reaction, Vote tests
  - `card/usecase/` - CreateCard, UpdateCard, DeleteCard, MoveCard, MarkCardDiscussed, AddVote, RemoveVote, GetRemainingVotes, CreateMemo, UpdateMemo, DeleteMemo, AddReaction, RemoveReaction usecase tests, CardMapper, MemoMapper, ReactionMapper tests
  - `card/gateway/controller/` - CardController, VoteController, MemoController, ReactionController tests
  - `timer/` - TimerController, TimerService tests
  - `actionitem/domain/` - ActionItem tests
  - `actionitem/usecase/` - CreateActionItem, UpdateActionItem, UpdateActionItemStatus, DeleteActionItem, GetActionItems, GetCarryOverItems, UpdateCarryOverItemStatus usecase tests
  - `actionitem/gateway/controller/` - ActionItemController, CarryOverController tests
  - `history/domain/` - BoardSnapshot tests
  - `history/usecase/` - CreateSnapshot, GetSnapshot, GetTeamHistory usecase tests, SnapshotMapper test
  - `history/gateway/controller/` - HistoryController tests
  - `kudos/domain/` - Kudos, KudosCategory tests
  - `kudos/usecase/` - SendKudos, GetKudos, DeleteKudos usecase tests
  - `kudos/gateway/controller/` - KudosController tests
  - `shared/` - EnumParser, GlobalExceptionHandler, DomainEventBroadcaster, SpringDomainEventPublisher tests

### Frontend Tests (`frontend/src/`)
- **Framework:** Vitest + React Testing Library + jsdom
- **Config:** `vitest.config.ts` with jsdom environment
- **Setup:** `src/test/setup.ts` for global test configuration
- **Fixtures:** `src/test/fixtures.ts` for mock data
- **Utilities:** `src/test/test-utils.tsx` for custom render helpers
- **DnD Mocks:** `src/test/dnd-mocks.ts` for @dnd-kit library mocks
- **Coverage:** Every component, page, hook, store, and API client has a co-located `.test.ts(x)` file

### E2E Tests (`frontend/e2e/`)
- **Framework:** Playwright
- **Config:** `playwright.config.ts`
- **Test suites (10 files):** `home`, `board-creation`, `board-join`, `card-operations`, `voting`, `phase-control`, `realtime-sync`, `export`, `uat-full-retro-session` + `helpers.ts`

## Technical Constraints

- **Java 21 required.** `build.gradle.kts` sets `sourceCompatibility = JavaVersion.VERSION_21`. `gradle.properties` is empty by default; set `org.gradle.java.home` if the system default is not Java 21.
- **SQLite single-writer:** HikariCP `maximum-pool-size=1`, WAL mode, `busy_timeout=5000ms`, `foreign_keys=ON`
- **Kotlin JPA entities** use `open class` (not data class) due to `allOpen` plugin with `@Entity`, `@MappedSuperclass`, `@Embeddable` annotations
- **TailwindCSS v4:** Uses `@tailwindcss/vite` plugin with `@import "tailwindcss"` syntax. No `tailwind.config.js`.
- **Flyway migrations** in `backend/src/main/resources/db/migration/` (V1-V15, do not modify existing migrations)
- **SPA fallback:** `SpaConfig.kt` serves `index.html` for non-API, non-static routes in production
- **Vite proxy:** Dev server proxies `/api` to `http://localhost:8080` and `/ws` to `ws://localhost:8080`
- **TypeScript strict mode:** `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports` all enabled
- **ESLint flat config:** Uses `eslint.config.js` (not `.eslintrc`), with TypeScript + React Hooks + React Refresh plugins
- **Hibernate:** Uses `hibernate-community-dialects` for SQLite support, `ddl-auto=none` (schema managed by Flyway)

## Documentation

- `README.md` - Project overview, features, setup instructions (日本語)
- `docs/CONTRIB.md` - Contributor guide with development workflow (日本語)
- `docs/RUNBOOK.md` - Production deployment and operations runbook (日本語)
- `docs/images/` - 32枚のスクリーンショット（UIフロー全体をカバー）

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`

## Key Dependencies (Backend)

| Library | Version | Purpose |
|---------|---------|---------|
| Spring Boot | 3.5.10 | Web framework |
| Kotlin | 2.3.10 | Language |
| sqlite-jdbc | 3.51.2.0 | SQLite driver |
| hibernate-community-dialects | (managed) | SQLite dialect for Hibernate |
| commons-csv | 1.14.1 | CSV export |
| flyway-core | (managed) | DB migration |
| mockk | 1.14.9 | Kotlin mocking |
| mockito-kotlin | 6.2.3 | Mockito for Kotlin |
| JaCoCo | 0.8.14 | Code coverage (excludes: `RetraApplicationKt*`, `config/**`, `**/gateway/db/**`) |

## Key Dependencies (Frontend)

| Library | Version | Purpose |
|---------|---------|---------|
| react | ^19.2.0 | UI framework |
| typescript | ~5.9.3 | Type system |
| vite | ^7.2.4 | Build tool |
| zustand | ^5.0.11 | State management |
| @stomp/stompjs | ^7.3.0 | WebSocket STOMP client |
| @dnd-kit/core | ^6.3.1 | Drag & drop |
| @dnd-kit/sortable | ^10.0.0 | Sortable lists |
| lucide-react | ^0.574.0 | Icons |
| react-router-dom | ^7.13.0 | Routing |
| tailwindcss | ^4.1.18 | CSS framework |
| recharts | ^3.7.0 | Charts for dashboard |
| vitest | ^3.2.4 | Unit testing |
| @playwright/test | ^1.58.2 | E2E testing |