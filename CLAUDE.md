# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 必須ルール
- **全ての回答は日本語で行うこと**

## Project Overview

Retra is a real-time retrospective board for Scrum teams. It supports multiple frameworks (KPT, Fun Done Learn, 4Ls, Start Stop Continue) with phase-based workflows (Writing -> Voting -> Discussion -> Action Items -> Closed).

- **Backend:** Spring Boot 3.4.1 + Kotlin 2.0.21 (`backend/`)
- **Frontend:** React 19.2 + TypeScript 5.9 + Vite 7 + Zustand 5 + TailwindCSS v4 (`frontend/`)
- **Database:** SQLite with Flyway migrations (V1-V8)
- **CI/CD:** なし（GitHub Actions、Docker等の設定は未導入）
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
| `shared/domain/` | `DomainException` (base + `NotFoundException`, `BadRequestException`, `ForbiddenException`, `ConflictException`, `InvalidPhaseTransitionException`), `DomainEvent` (base class for all domain events) |
| `shared/gateway/event/` | `SpringDomainEventPublisher` (Spring ApplicationEvent bridge) |
| `shared/gateway/exception/` | `GlobalExceptionHandler` (`@RestControllerAdvice`) |
| `shared/gateway/websocket/` | `DomainEventBroadcaster` (STOMP broadcast for all domain events) |

#### `board/` - Board Module
| Package | Purpose |
|---------|---------|
| `board/domain/` | `Board`, `BoardColumn`, `Participant`, `BoardSlug`, `VoteLimit`, `Framework`, `Phase`, `BoardAuthorizationService`, `BoardEvent`, repositories |
| `board/usecase/` | `CreateBoardUseCase`, `GetBoardUseCase`, `TransitionPhaseUseCase`, `JoinBoardUseCase`, `UpdateOnlineStatusUseCase`, `ExportBoardUseCase`, `BoardDtos`, `ExportDtos`, `BoardMapper` |
| `board/usecase/export/` | `CsvExportService`, `MarkdownExportService` (CSV/Markdownエクスポート) |
| `board/gateway/controller/` | `BoardController` (REST) |
| `board/gateway/db/` | JPA repository implementations (`JpaBoardRepository`, `JpaParticipantRepository`) + Spring Data interfaces (`SpringDataBoardRepository`, `SpringDataParticipantRepository`) |
| `board/gateway/websocket/` | `WebSocketController`, `WebSocketEventListener` |

#### `card/` - Card Module (Cards, Votes, Memos, Reactions)
| Package | Purpose |
|---------|---------|
| `card/domain/` | `Card`, `Vote`, `Memo`, `Reaction`, `CardEvent`, `VoteEvent`, `MemoEvent`, `ReactionEvent`, repositories |
| `card/usecase/` | `CreateCardUseCase`, `UpdateCardUseCase`, `DeleteCardUseCase`, `MoveCardUseCase`, `AddVoteUseCase`, `RemoveVoteUseCase`, `GetRemainingVotesUseCase`, `CreateMemoUseCase`, `UpdateMemoUseCase`, `DeleteMemoUseCase`, `AddReactionUseCase`, `RemoveReactionUseCase`, DTOs (`CardDtos`, `MemoDtos`, `ReactionDtos`), Mappers (`CardMapper`, `MemoMapper`, `ReactionMapper`) |
| `card/gateway/controller/` | `CardController`, `VoteController`, `MemoController`, `ReactionController` (REST) |
| `card/gateway/db/` | JPA repository implementations (`JpaCardRepository`, `JpaVoteRepository`, `JpaMemoRepository`, `JpaReactionRepository`) + Spring Data interfaces (`SpringDataCardRepository`, `SpringDataVoteRepository`, `SpringDataMemoRepository`, `SpringDataReactionRepository`) |

#### `timer/` - Timer Module
| Package | Purpose |
|---------|---------|
| `timer/usecase/` | `TimerService`, `TimerDtos` |
| `timer/gateway/controller/` | `TimerController` (REST) |

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
| `pages/` | `HomePage` (create/join), `BoardPage` (main board), `NotFoundPage` |
| `components/` | `BoardHeader`, `BoardView`, `ColumnView`, `CardItem`, `CardForm`, `MemoList`, `MemoItem`, `MemoForm`, `ReactionList`, `ReactionPicker`, `ParticipantList`, `PhaseControl`, `TimerDisplay`, `ConnectionBanner`, `NicknameModal`, `ExportMenu`, `ToastContainer` |
| `store/boardStore.ts` | Zustand store with WebSocket event handlers |
| `store/toastStore.ts` | Toast notification store (success/error/info, 4秒自動削除) |
| `websocket/useWebSocket.ts` | STOMP client hook with auto-reconnect |
| `hooks/useTimerAlert.ts` | Timer alert sound hook |
| `types/index.ts` | Shared TypeScript type definitions (`Board`, `Card`, `Memo`, `Reaction`, `ExportFormat`, `CardMovedPayload`, `ReactionRemovedPayload`, etc.) |
| `utils/` | Utility functions (`exportMarkdown.ts` - Markdown export conversion) |
| `test/` | Test utilities: `setup.ts`, `fixtures.ts`, `test-utils.tsx`, `dnd-mocks.ts` |

App entry: `main.tsx` -> `App.tsx` (React Router with 3 routes)

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
- `POST /boards/{slug}/votes` - Add vote (VOTING phase only)
- `DELETE /boards/{slug}/votes` - Remove vote (VOTING phase only)
- `GET /boards/{slug}/votes/remaining?participantId=` - Get remaining votes
- `POST /boards/{slug}/cards/{cardId}/memos` - Create memo
- `PUT /boards/{slug}/cards/{cardId}/memos/{memoId}` - Update memo
- `DELETE /boards/{slug}/cards/{cardId}/memos/{memoId}` - Delete memo
- `POST /boards/{slug}/reactions` - Add reaction (emoji: 👍❤️😂🎉🤔👀)
- `DELETE /boards/{slug}/reactions` - Remove reaction
- `POST /boards/{slug}/timer` - Timer control (facilitator only)
- `GET /boards/{slug}/timer` - Get timer state
- `GET /boards/{slug}/export` - Export board (CSV/Markdown, query params: `participantId`, `format`)

### WebSocket Events

STOMP topics under `/topic/board/{slug}/`:
- `cards` - `CARD_CREATED`, `CARD_UPDATED`, `CARD_MOVED`, `CARD_DELETED`
- `votes` - `VOTE_ADDED`, `VOTE_REMOVED`
- `reactions` - `REACTION_ADDED`, `REACTION_REMOVED`
- `memos` - `MEMO_CREATED`, `MEMO_UPDATED`, `MEMO_DELETED`
- `phase` - `PHASE_CHANGED`
- `participants` - `PARTICIPANT_JOINED`, `PARTICIPANT_ONLINE_CHANGED`

### Phase-Based Access Control

Business rules are enforced in the usecase layer:
- Cards: create only in WRITING phase; edit by author only; delete by author or facilitator
- Card move: drag & drop between columns with sort order
- Votes: add/remove only in VOTING phase; max votes per person enforced
- Memos: create/edit/delete in DISCUSSION and ACTION_ITEMS phases
- Phase transitions: facilitator only, must follow sequential order
- Timer: facilitator only

## Testing

### Backend Tests (`backend/src/test/`)
- **Framework:** JUnit 5 + MockK + Mockito-Kotlin
- **Config:** `application-test.yml` uses in-memory SQLite (`jdbc:sqlite::memory:`)
- **Test fixtures:** `TestFixtures.kt` provides shared test data builders
- **Structure:** Tests mirror the modular monolith structure:
  - `board/domain/` - Board, BoardSlug, BoardColumn, BoardAuthorizationService, Framework, Phase, VoteLimit tests
  - `board/usecase/` - CreateBoard, GetBoard, TransitionPhase, JoinBoard, UpdateOnlineStatus, ExportBoard usecase tests
  - `board/usecase/export/` - CsvExportService, MarkdownExportService tests
  - `board/gateway/controller/` - BoardController test
  - `board/gateway/websocket/` - WebSocketEventListener test
  - `card/domain/` - Card, Memo, Reaction tests
  - `card/usecase/` - CreateCard, UpdateCard, DeleteCard, MoveCard, AddVote, RemoveVote, GetRemainingVotes, CreateMemo, UpdateMemo, DeleteMemo, AddReaction, RemoveReaction usecase tests
  - `card/gateway/controller/` - CardController, VoteController, MemoController, ReactionController tests
  - `timer/` - TimerController, TimerService tests
  - `shared/gateway/` - GlobalExceptionHandler, DomainEventBroadcaster, SpringDomainEventPublisher tests

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
- **Test suites:** `home`, `board-creation`, `board-join`, `card-operations`, `card-edit-delete`, `card-drag-drop`, `voting`, `voting-limit`, `phase-control`, `timer`, `realtime-sync`, `authorization`, `memo-operations`, `reaction-operations`, `export`

## Technical Constraints

- **Java 21 required.** `build.gradle.kts` sets `sourceCompatibility = JavaVersion.VERSION_21`. `gradle.properties` is empty by default; set `org.gradle.java.home` if the system default is not Java 21.
- **SQLite single-writer:** HikariCP `maximum-pool-size=1`, WAL mode, `busy_timeout=5000ms`, `foreign_keys=ON`
- **Kotlin JPA entities** use `open class` (not data class) due to `allOpen` plugin with `@Entity`, `@MappedSuperclass`, `@Embeddable` annotations
- **TailwindCSS v4:** Uses `@tailwindcss/vite` plugin with `@import "tailwindcss"` syntax. No `tailwind.config.js`.
- **Flyway migrations** in `backend/src/main/resources/db/migration/` (V1-V8, do not modify existing migrations)
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
| Spring Boot | 3.4.1 | Web framework |
| Kotlin | 2.0.21 | Language |
| sqlite-jdbc | 3.45.1.0 | SQLite driver |
| hibernate-community-dialects | 6.4.2.Final | SQLite dialect for Hibernate |
| commons-csv | 1.12.0 | CSV export |
| flyway-core | (managed) | DB migration |
| mockk | 1.13.10 | Kotlin mocking |
| mockito-kotlin | 5.2.1 | Mockito for Kotlin |
| JaCoCo | 0.8.11 | Code coverage (excludes: `RetraApplicationKt*`, `config/**`, `**/gateway/db/**`) |

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
| lucide-react | ^0.563.0 | Icons |
| react-router-dom | ^7.13.0 | Routing |
| tailwindcss | ^4.1.18 | CSS framework |
| vitest | ^3.2.4 | Unit testing |
| @playwright/test | ^1.58.2 | E2E testing |