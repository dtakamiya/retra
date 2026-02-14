# エンゲージメント指標 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 既存のTeamDashboardPageにエンゲージメント指標チャートを追加し、レトロの参加度を定量的に評価できるようにする。

**Architecture:** 既存の`TrendPoint`DTOに4つの派生指標フィールド（`cardsPerParticipant`, `votesPerParticipant`, `votesPerCard`, `actionItemRate`）を追加。`SnapshotMapper`でサーバー側計算し、フロントエンドは新しいフィールドを使ってエンゲージメント専用チャートを描画する。

**Tech Stack:** Spring Boot (Kotlin), React (TypeScript), Recharts, Vitest, JUnit 5 + MockK, Playwright

---

## Task 1: バックエンド - SnapshotMapperのテストを追加

**Files:**
- Create: `backend/src/test/kotlin/com/retra/history/usecase/SnapshotMapperTest.kt`

**Step 1: 失敗するテストを書く**

```kotlin
package com.retra.history.usecase

import com.retra.TestFixtures
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class SnapshotMapperTest {

    @Test
    fun `toTrendPointでエンゲージメント指標が正しく計算される`() {
        val snapshot = TestFixtures.boardSnapshot(
            totalCards = 12,
            totalVotes = 30,
            totalParticipants = 5,
            actionItemsTotal = 4,
            actionItemsDone = 2
        )

        val result = SnapshotMapper.toTrendPoint(snapshot)

        assertEquals(2.4, result.cardsPerParticipant)
        assertEquals(6.0, result.votesPerParticipant)
        assertEquals(2.5, result.votesPerCard)
        assertEquals(100.0 * 4 / 12, result.actionItemRate, 0.01)
    }

    @Test
    fun `参加者がゼロの場合のエンゲージメント指標は0`() {
        val snapshot = TestFixtures.boardSnapshot(
            totalCards = 5,
            totalVotes = 10,
            totalParticipants = 0,
            actionItemsTotal = 2,
            actionItemsDone = 1
        )

        val result = SnapshotMapper.toTrendPoint(snapshot)

        assertEquals(0.0, result.cardsPerParticipant)
        assertEquals(0.0, result.votesPerParticipant)
    }

    @Test
    fun `カードがゼロの場合のエンゲージメント指標は0`() {
        val snapshot = TestFixtures.boardSnapshot(
            totalCards = 0,
            totalVotes = 0,
            totalParticipants = 3,
            actionItemsTotal = 0,
            actionItemsDone = 0
        )

        val result = SnapshotMapper.toTrendPoint(snapshot)

        assertEquals(0.0, result.cardsPerParticipant)
        assertEquals(0.0, result.votesPerCard)
        assertEquals(0.0, result.actionItemRate)
    }
}
```

**Step 2: テストが失敗することを確認**

Run: `cd backend && ./gradlew test --tests "com.retra.history.usecase.SnapshotMapperTest"`
Expected: FAIL - `cardsPerParticipant`プロパティが`TrendPoint`に存在しない

**Step 3: コミット（RED）**

```bash
git add backend/src/test/kotlin/com/retra/history/usecase/SnapshotMapperTest.kt
git commit -m "test: SnapshotMapperのエンゲージメント指標テストを追加 (RED)"
```

---

## Task 2: バックエンド - TrendPointとSnapshotMapperを実装

**Files:**
- Modify: `backend/src/main/kotlin/com/retra/history/usecase/SnapshotDtos.kt:32-40` (`TrendPoint`)
- Modify: `backend/src/main/kotlin/com/retra/history/usecase/SnapshotMapper.kt:36-51` (`toTrendPoint`)

**Step 1: `SnapshotDtos.kt`の`TrendPoint`に4フィールドを追加**

`TrendPoint`を以下に変更:

```kotlin
data class TrendPoint(
    val closedAt: String,
    val totalCards: Int,
    val totalVotes: Int,
    val totalParticipants: Int,
    val actionItemsTotal: Int,
    val actionItemsDone: Int,
    val actionItemCompletionRate: Double,
    val cardsPerParticipant: Double,
    val votesPerParticipant: Double,
    val votesPerCard: Double,
    val actionItemRate: Double
)
```

**Step 2: `SnapshotMapper.kt`の`toTrendPoint`に計算ロジックを追加**

`SnapshotMapper`を以下に変更:

```kotlin
object SnapshotMapper {

    // ... toSummary, toDetail は変更なし

    fun toTrendPoint(snapshot: BoardSnapshot): TrendPoint {
        val completionRate = if (snapshot.actionItemsTotal > 0) {
            snapshot.actionItemsDone.toDouble() / snapshot.actionItemsTotal * 100
        } else {
            0.0
        }
        return TrendPoint(
            closedAt = snapshot.closedAt,
            totalCards = snapshot.totalCards,
            totalVotes = snapshot.totalVotes,
            totalParticipants = snapshot.totalParticipants,
            actionItemsTotal = snapshot.actionItemsTotal,
            actionItemsDone = snapshot.actionItemsDone,
            actionItemCompletionRate = completionRate,
            cardsPerParticipant = safeDiv(snapshot.totalCards, snapshot.totalParticipants),
            votesPerParticipant = safeDiv(snapshot.totalVotes, snapshot.totalParticipants),
            votesPerCard = safeDiv(snapshot.totalVotes, snapshot.totalCards),
            actionItemRate = safeDiv(snapshot.actionItemsTotal, snapshot.totalCards) * 100
        )
    }

    private fun safeDiv(numerator: Int, denominator: Int): Double =
        if (denominator > 0) numerator.toDouble() / denominator else 0.0
}
```

**Step 3: テストがパスすることを確認**

Run: `cd backend && ./gradlew test --tests "com.retra.history.usecase.SnapshotMapperTest"`
Expected: PASS (3 tests)

**Step 4: 既存テストもパスすることを確認**

Run: `cd backend && ./gradlew test`
Expected: ALL PASS

**Step 5: コミット（GREEN）**

```bash
git add backend/src/main/kotlin/com/retra/history/usecase/SnapshotDtos.kt backend/src/main/kotlin/com/retra/history/usecase/SnapshotMapper.kt
git commit -m "feat: TrendPointにエンゲージメント指標を追加"
```

---

## Task 3: フロントエンド - 型定義とフィクスチャを更新

**Files:**
- Modify: `frontend/src/types/index.ts:156-164` (`TrendPoint`)
- Modify: `frontend/src/test/fixtures.ts:149-169` (`createTrendPoint`, `createTrendData`)

**Step 1: `types/index.ts`の`TrendPoint`に4フィールドを追加**

`TrendPoint`インターフェースを以下に変更:

```typescript
export interface TrendPoint {
  closedAt: string;
  totalCards: number;
  totalVotes: number;
  totalParticipants: number;
  actionItemsTotal: number;
  actionItemsDone: number;
  actionItemCompletionRate: number;
  cardsPerParticipant: number;
  votesPerParticipant: number;
  votesPerCard: number;
  actionItemRate: number;
}
```

**Step 2: `fixtures.ts`の`createTrendPoint`と`createTrendData`を更新**

`createTrendPoint`を以下に変更:

```typescript
export function createTrendPoint(overrides: Partial<TrendPoint> = {}): TrendPoint {
  return {
    closedAt: '2024-03-15T10:00:00Z',
    totalCards: 12,
    totalVotes: 30,
    totalParticipants: 5,
    actionItemsTotal: 4,
    actionItemsDone: 2,
    actionItemCompletionRate: 50,
    cardsPerParticipant: 2.4,
    votesPerParticipant: 6.0,
    votesPerCard: 2.5,
    actionItemRate: 33.33,
    ...overrides,
  }
}
```

`createTrendData`を以下に変更:

```typescript
export function createTrendData(overrides: Partial<TrendData> = {}): TrendData {
  return {
    snapshots: [
      createTrendPoint({ closedAt: '2024-03-01T10:00:00Z', totalCards: 10, actionItemCompletionRate: 40, cardsPerParticipant: 2.0, votesPerParticipant: 6.0, votesPerCard: 3.0, actionItemRate: 40 }),
      createTrendPoint({ closedAt: '2024-03-15T10:00:00Z', totalCards: 12, actionItemCompletionRate: 50, cardsPerParticipant: 2.4, votesPerParticipant: 6.0, votesPerCard: 2.5, actionItemRate: 33.33 }),
    ],
    ...overrides,
  }
}
```

**Step 3: TypeScriptの型チェックがパスすることを確認**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS (エラーなし)

**Step 4: 既存テストがパスすることを確認**

Run: `cd frontend && npm run test -- --run`
Expected: ALL PASS

**Step 5: コミット**

```bash
git add frontend/src/types/index.ts frontend/src/test/fixtures.ts
git commit -m "feat: フロントエンドのTrendPoint型にエンゲージメント指標を追加"
```

---

## Task 4: フロントエンド - TrendChartにエンゲージメントチャートのテストを追加

**Files:**
- Modify: `frontend/src/components/TrendChart.test.tsx`

**Step 1: エンゲージメントチャートのテストを追加**

既存のテストファイル末尾に以下のテストを追加:

```typescript
  it('renders engagement chart section', () => {
    const data = [createTrendPoint()]
    const { getAllByTestId } = render(<TrendChart data={data} />)

    // 2つのチャート（基本トレンド + エンゲージメント）
    const charts = getAllByTestId('line-chart')
    expect(charts).toHaveLength(2)
  })

  it('renders engagement metric line names', () => {
    const data = [createTrendPoint()]
    const { getByText } = render(<TrendChart data={data} />)

    expect(getByText('カード数/人')).toBeInTheDocument()
    expect(getByText('投票数/人')).toBeInTheDocument()
    expect(getByText('投票数/カード')).toBeInTheDocument()
    expect(getByText('アクション化率(%)')).toBeInTheDocument()
  })

  it('renders section headings', () => {
    const data = [createTrendPoint()]
    const { getByText } = render(<TrendChart data={data} />)

    expect(getByText('基本トレンド')).toBeInTheDocument()
    expect(getByText('エンゲージメント')).toBeInTheDocument()
  })
```

**Step 2: テストが失敗することを確認**

Run: `cd frontend && npm run test -- --run TrendChart`
Expected: FAIL - 2つ目のチャートが存在しない

**Step 3: コミット（RED）**

```bash
git add frontend/src/components/TrendChart.test.tsx
git commit -m "test: TrendChartのエンゲージメントチャートテストを追加 (RED)"
```

---

## Task 5: フロントエンド - TrendChartにエンゲージメントチャートを実装

**Files:**
- Modify: `frontend/src/components/TrendChart.tsx`

**Step 1: TrendChartにエンゲージメントチャートセクションを追加**

`TrendChart.tsx`を以下に変更:

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TrendPoint } from '../types';

interface Props {
  data: TrendPoint[];
}

export function TrendChart({ data }: Props) {
  const chartData = data.map((point) => ({
    ...point,
    date: new Date(point.closedAt).toLocaleDateString('ja-JP'),
  }));

  return (
    <div className="space-y-8">
      {/* 基本トレンド */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">基本トレンド</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="totalCards" stroke="#8884d8" name="カード数" />
            <Line type="monotone" dataKey="totalVotes" stroke="#82ca9d" name="投票数" />
            <Line type="monotone" dataKey="actionItemCompletionRate" stroke="#ffc658" name="AI完了率(%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* エンゲージメント */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">エンゲージメント</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="cardsPerParticipant" stroke="#8884d8" name="カード数/人" />
            <Line type="monotone" dataKey="votesPerParticipant" stroke="#82ca9d" name="投票数/人" />
            <Line type="monotone" dataKey="votesPerCard" stroke="#ff7300" name="投票数/カード" />
            <Line type="monotone" dataKey="actionItemRate" stroke="#ffc658" name="アクション化率(%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

**Step 2: テストがパスすることを確認**

Run: `cd frontend && npm run test -- --run TrendChart`
Expected: PASS (8 tests)

**Step 3: 既存のline数テスト調整が必要か確認**

既存テスト `renders three lines for cards, votes, and completion rate` は `getAllByTestId('line')` で3本のLineを期待しているが、エンゲージメントチャートの4本が追加されて7本になるため更新が必要。

テストを修正:
```typescript
  it('renders seven lines for all metrics', () => {
    const data = [createTrendPoint()]
    const { getAllByTestId } = render(<TrendChart data={data} />)

    const lines = getAllByTestId('line')
    expect(lines).toHaveLength(7)
  })
```

**Step 4: 全テストがパスすることを確認**

Run: `cd frontend && npm run test -- --run TrendChart`
Expected: ALL PASS

**Step 5: コミット（GREEN）**

```bash
git add frontend/src/components/TrendChart.tsx frontend/src/components/TrendChart.test.tsx
git commit -m "feat: TrendChartにエンゲージメント指標チャートを追加"
```

---

## Task 6: フロントエンド - TeamDashboardPageのレイアウト更新

**Files:**
- Modify: `frontend/src/pages/TeamDashboardPage.tsx:77-83`

**Step 1: ダッシュボードのトレンドセクションの見出しを更新**

`TeamDashboardPage.tsx`のトレンドチャートのセクション見出しを変更:

変更前:
```tsx
<h2 className="text-lg font-semibold mb-4">トレンド</h2>
```

変更後:
```tsx
<h2 className="text-lg font-semibold mb-4">トレンド & エンゲージメント</h2>
```

**Step 2: TeamDashboardPageのテストを更新**

`TeamDashboardPage.test.tsx`のテスト`displays trend chart when more than 1 snapshot`を更新:

変更前:
```typescript
expect(screen.getByText('トレンド')).toBeInTheDocument()
```

変更後:
```typescript
expect(screen.getByText('トレンド & エンゲージメント')).toBeInTheDocument()
```

**Step 3: 全テストがパスすることを確認**

Run: `cd frontend && npm run test -- --run`
Expected: ALL PASS

**Step 4: TypeScriptチェック**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS

**Step 5: コミット**

```bash
git add frontend/src/pages/TeamDashboardPage.tsx frontend/src/pages/TeamDashboardPage.test.tsx
git commit -m "feat: ダッシュボードのトレンドセクション見出しを更新"
```

---

## Task 7: E2Eテスト - エンゲージメントチャート表示確認

**Files:**
- Modify: `frontend/e2e/dashboard.spec.ts`

**Step 1: エンゲージメントチャート表示のE2Eテストを追加**

`dashboard.spec.ts`の`履歴の表示`テストグループ内に以下のテストを追加:

```typescript
test.describe('トレンドチャートの表示', () => {
    test('複数のレトロが完了するとトレンドチャートが表示される', async ({ page }) => {
        // 2つのレトロスペクティブを完了させてスナップショットを2件作成
        await completeFullRetro(page, 'トレンドテスト1回目');
        await completeFullRetro(page, 'トレンドテスト2回目');

        // ダッシュボードに遷移
        await page.goto('/dashboard');
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // トレンド & エンゲージメントセクションが表示される
        await expect(page.getByText('トレンド & エンゲージメント')).toBeVisible();

        // エンゲージメントセクションのラベルが表示される
        await expect(page.getByText('エンゲージメント')).toBeVisible();
    });
});
```

**Step 2: E2Eテストがパスすることを確認**

Run: `cd frontend && npx playwright test e2e/dashboard.spec.ts --workers=1`
Expected: PASS

**Step 3: コミット**

```bash
git add frontend/e2e/dashboard.spec.ts
git commit -m "test: エンゲージメントチャート表示のE2Eテストを追加"
```

---

## Task 8: 全体検証とカバレッジ確認

**Step 1: バックエンド全テスト実行**

Run: `cd backend && ./gradlew test`
Expected: ALL PASS, カバレッジ80%以上

**Step 2: フロントエンド全テスト実行**

Run: `cd frontend && npm run test -- --run`
Expected: ALL PASS

**Step 3: フロントエンドカバレッジ確認**

Run: `cd frontend && npm run test:coverage`
Expected: カバレッジ80%以上

**Step 4: TypeScriptチェック**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS

**Step 5: Lint**

Run: `cd frontend && npm run lint`
Expected: PASS

**Step 6: E2E全テスト実行**

Run: `cd frontend && npx playwright test --workers=1`
Expected: ALL PASS

**Step 7: ドキュメント更新（CLAUDE.md）**

`CLAUDE.md`のTrendPointセクションにエンゲージメント指標フィールドの記述を追加。

**Step 8: 最終コミット**

```bash
git add -A
git commit -m "docs: エンゲージメント指標のドキュメントを更新"
```
