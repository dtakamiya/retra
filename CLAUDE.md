# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 必須ルール
- **全ての回答は日本語で行うこと**

## Project Overview

Retra is a real-time retrospective board for Scrum teams. It supports multiple frameworks (KPT, Fun Done Learn, 4Ls, Start Stop Continue) with phase-based workflows (Writing -> Voting -> Discussion -> Action Items -> Closed).

- **Backend:** Spring Boot 3.4.1 + Kotlin 2.0.21 (`backend/`)
- **Frontend:** React 19 + TypeScript + Vite 7 + Zustand + TailwindCSS v4 (`frontend/`)
- **Database:** SQLite with Flyway migrations
- **Realtime:** WebSocket via STOMP protocol

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
# Backend tests
cd backend && ./gradlew test

# Frontend lint
cd frontend && npm run lint

# TypeScript check
cd frontend && npx tsc --noEmit
```

## Architecture

### Event-Driven Real-Time Updates

The core pattern: REST API call -> Service persists to DB -> Service publishes Spring `ApplicationEvent` -> `BoardEventBroadcaster` (@EventListener) -> STOMP broadcast to `/topic/board/{slug}/{category}` -> Frontend Zustand store updates.

Key files: `websocket/BoardEventBroadcaster.kt`, `websocket/useWebSocket.ts`, `store/boardStore.ts`

### Backend Structure (`backend/src/main/kotlin/com/retra/`)

| Package | Purpose |
|---------|---------|
| `config/` | SPA fallback, CORS, WebSocket STOMP setup |
| `controller/` | REST endpoints for Board, Card, Vote, Timer |
| `domain/model/` | JPA entities (Board, BoardColumn, Card, Participant, Vote) |
| `domain/repository/` | Spring Data JPA repositories |
| `dto/` | Request/Response DTOs (all in `BoardDtos.kt`) |
| `service/` | Business logic with phase-based access control |
| `websocket/` | STOMP broadcasting and session management |
| `exception/` | Custom exceptions + `@RestControllerAdvice` handler |

### Frontend Structure (`frontend/src/`)

| Directory | Purpose |
|-----------|---------|
| `api/client.ts` | REST API wrapper (`/api/v1` base) |
| `pages/` | HomePage (create/join), BoardPage, NotFoundPage |
| `components/` | Board UI components |
| `store/boardStore.ts` | Zustand store with WebSocket event handlers |
| `websocket/useWebSocket.ts` | STOMP client hook with auto-reconnect |
| `types/index.ts` | Shared TypeScript types |

### API Routes

All REST endpoints are under `/api/v1`:
- `/boards` - CRUD, `PATCH /{slug}/phase` for phase transitions
- `/boards/{slug}/cards` - Card CRUD (restricted to WRITING phase)
- `/boards/{slug}/votes` - Add/remove votes (restricted to VOTING phase)
- `/boards/{slug}/timer` - Timer control (facilitator only)
- `/boards/{slug}/participants` - Join board

### Phase-Based Access Control

Business rules are enforced in the service layer:
- Cards: create only in WRITING phase; edit by author only; delete by author or facilitator
- Votes: add/remove only in VOTING phase; max votes per person enforced
- Phase transitions: facilitator only, must follow sequential order
- Timer: facilitator only

## Technical Constraints

- **Java 21 required.** Configured in `backend/gradle.properties` pointing to Corretto 21. System may have a different JDK.
- **SQLite single-writer:** HikariCP pool-size=1, WAL mode, busy_timeout=5000ms, foreign_keys=ON
- **Kotlin JPA entities** use `open class` (not data class) due to `kotlin-jpa` plugin / allOpen
- **TailwindCSS v4:** Uses `@tailwindcss/vite` plugin with `@import "tailwindcss"` syntax. No `tailwind.config.js`.
- **Flyway migrations** in `backend/src/main/resources/db/migration/` (V1-V5)
- **SPA fallback:** `SpaConfig.kt` serves `index.html` for non-API, non-static routes in production
- **Vite proxy:** Dev server proxies `/api` and `/ws` to `localhost:8080`

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
