# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 必須ルール
- **全ての回答は日本語で行うこと**

## Project Overview

Retra is a real-time retrospective board for Scrum teams. It supports multiple frameworks (KPT, Fun Done Learn, 4Ls, Start Stop Continue) with phase-based workflows (Writing -> Voting -> Discussion -> Action Items -> Closed).

- **Backend:** Spring Boot 3.4.1 + Kotlin 2.0.21 (`backend/`)
- **Frontend:** React 19 + TypeScript 5.9 + Vite 7 + Zustand 5 + TailwindCSS v4 (`frontend/`)
- **Database:** SQLite with Flyway migrations (V1-V5)
- **Realtime:** WebSocket via STOMP protocol (`@stomp/stompjs`)
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

# Frontend lint (ESLint flat config)
cd frontend && npm run lint

# TypeScript type check
cd frontend && npx tsc --noEmit
```

Both backend (JaCoCo) and frontend (V8) enforce **80% code coverage thresholds**.

## Architecture

### Event-Driven Real-Time Updates

The core pattern: REST API call -> Service persists to DB -> Service publishes Spring `ApplicationEvent` -> `BoardEventBroadcaster` (@EventListener) -> STOMP broadcast to `/topic/board/{slug}/{category}` -> Frontend Zustand store updates.

Key files: `websocket/BoardEventBroadcaster.kt`, `websocket/useWebSocket.ts`, `store/boardStore.ts`

### Backend Structure (`backend/src/main/kotlin/com/retra/`)

| Package | Purpose |
|---------|---------|
| `config/` | SPA fallback (`SpaConfig.kt`), CORS (`WebConfig.kt`), WebSocket STOMP setup (`WebSocketConfig.kt`) |
| `controller/` | REST endpoints: `BoardController`, `CardController`, `VoteController`, `TimerController` |
| `domain/model/` | JPA entities: `Board`, `BoardColumn`, `Card`, `Participant`, `Vote` |
| `domain/repository/` | Spring Data JPA repositories for each entity |
| `dto/` | All request/response DTOs consolidated in `BoardDtos.kt` |
| `service/` | Business logic: `BoardService`, `CardService`, `VoteService`, `TimerService`, `ParticipantService` |
| `websocket/` | `BoardEventBroadcaster` (STOMP broadcast), `WebSocketController`, `WebSocketEventListener` |
| `exception/` | Custom exceptions + `@RestControllerAdvice` global handler |

Entry point: `RetraApplication.kt`

### Frontend Structure (`frontend/src/`)

| Directory | Purpose |
|-----------|---------|
| `api/client.ts` | REST API wrapper (`/api/v1` base) |
| `pages/` | `HomePage` (create/join), `BoardPage` (main board), `NotFoundPage` |
| `components/` | `BoardHeader`, `BoardView`, `ColumnView`, `CardItem`, `CardForm`, `ParticipantList`, `PhaseControl`, `TimerDisplay`, `ConnectionBanner`, `NicknameModal` |
| `store/boardStore.ts` | Zustand store with WebSocket event handlers |
| `websocket/useWebSocket.ts` | STOMP client hook with auto-reconnect |
| `hooks/useTimerAlert.ts` | Timer alert sound hook |
| `types/index.ts` | Shared TypeScript type definitions |
| `test/` | Test utilities: `setup.ts`, `fixtures.ts`, `test-utils.tsx` |

App entry: `main.tsx` -> `App.tsx` (React Router with 3 routes)

### API Routes

All REST endpoints are under `/api/v1`:
- `POST /boards` - Create board
- `GET /boards/{slug}` - Get board details
- `PATCH /boards/{slug}/phase` - Phase transition (facilitator only)
- `POST /boards/{slug}/cards` - Create card (WRITING phase only)
- `PUT /boards/{slug}/cards/{id}` - Update card (author only)
- `DELETE /boards/{slug}/cards/{id}` - Delete card (author or facilitator)
- `POST /boards/{slug}/votes` - Add vote (VOTING phase only)
- `DELETE /boards/{slug}/votes/{id}` - Remove vote (VOTING phase only)
- `POST /boards/{slug}/timer` - Timer control (facilitator only)
- `POST /boards/{slug}/participants` - Join board

### Phase-Based Access Control

Business rules are enforced in the service layer:
- Cards: create only in WRITING phase; edit by author only; delete by author or facilitator
- Votes: add/remove only in VOTING phase; max votes per person enforced
- Phase transitions: facilitator only, must follow sequential order
- Timer: facilitator only

## Testing

### Backend Tests (`backend/src/test/`)
- **Framework:** JUnit 5 + MockK + Mockito-Kotlin
- **Config:** `application-test.yml` uses in-memory SQLite (`jdbc:sqlite::memory:`)
- **Test fixtures:** `TestFixtures.kt` provides shared test data builders
- **Coverage:** Controller tests (4), Service tests (5), WebSocket tests (2), Exception handler test (1)

### Frontend Tests (`frontend/src/`)
- **Framework:** Vitest + React Testing Library + jsdom
- **Config:** `vitest.config.ts` with jsdom environment
- **Setup:** `src/test/setup.ts` for global test configuration
- **Fixtures:** `src/test/fixtures.ts` for mock data
- **Utilities:** `src/test/test-utils.tsx` for custom render helpers
- **Coverage:** Every component, page, hook, store, and API client has a co-located `.test.ts(x)` file

## Technical Constraints

- **Java 21 required.** `backend/gradle.properties` contains a local Java home path that may need adjustment for your system. `build.gradle.kts` sets `sourceCompatibility = JavaVersion.VERSION_21`.
- **SQLite single-writer:** HikariCP `maximum-pool-size=1`, WAL mode, `busy_timeout=5000ms`, `foreign_keys=ON`
- **Kotlin JPA entities** use `open class` (not data class) due to `allOpen` plugin with `@Entity`, `@MappedSuperclass`, `@Embeddable` annotations
- **TailwindCSS v4:** Uses `@tailwindcss/vite` plugin with `@import "tailwindcss"` syntax. No `tailwind.config.js`.
- **Flyway migrations** in `backend/src/main/resources/db/migration/` (V1-V5, do not modify existing migrations)
- **SPA fallback:** `SpaConfig.kt` serves `index.html` for non-API, non-static routes in production
- **Vite proxy:** Dev server proxies `/api` to `http://localhost:8080` and `/ws` to `ws://localhost:8080`
- **TypeScript strict mode:** `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch` all enabled
- **ESLint flat config:** Uses `eslint.config.js` (not `.eslintrc`), with TypeScript + React Hooks + React Refresh plugins
- **Hibernate:** Uses `hibernate-community-dialects` for SQLite support, `ddl-auto=none` (schema managed by Flyway)

## Documentation

- `README.md` - Project overview, features, setup instructions (日本語)
- `docs/CONTRIB.md` - Contributor guide with development workflow (日本語)
- `docs/RUNBOOK.md` - Production deployment and operations runbook (日本語)

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
