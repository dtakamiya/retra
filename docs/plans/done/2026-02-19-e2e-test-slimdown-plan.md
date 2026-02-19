# E2Eテスト スリム化 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** E2Eテスト151件→25件に削減し、CI実行時間を25分+→10分以下に短縮する

**Architecture:** 共通ヘルパーを `e2e/helpers.ts` に抽出し、個別機能テスト14ファイルを削除。残り9ファイルをハッピーパスのみに絞り、UATを3シナリオに再構成。

**Tech Stack:** Playwright, TypeScript

---

### Task 1: 共通ヘルパーファイルの作成

**Files:**
- Create: `frontend/e2e/helpers.ts`

**Step 1: ヘルパーファイルを作成**

以下の内容で `frontend/e2e/helpers.ts` を作成する。18ファイルに重複していたヘルパー関数を統合・汎用化したもの。

```typescript
import { expect, Page, Browser } from '@playwright/test';

/** ボードを作成してニックネームで参加する */
export async function createBoardAndJoin(
    page: Page,
    nickname: string,
    boardTitle: string = 'テストボード',
    framework: string = 'KPT'
) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill(boardTitle);
    if (framework !== 'KPT') {
        await page.locator('button', { hasText: framework }).click();
    }
    await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

    await page.getByPlaceholder('ニックネームを入力').fill(nickname);
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });
}

/** 別ブラウザコンテキストでボードに参加する */
export async function joinBoardAsMember(browser: Browser, boardUrl: string, nickname: string) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(boardUrl);

    await page.getByPlaceholder('ニックネームを入力').fill(nickname);
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });

    return { page, context };
}

/** カードを追加する */
export async function addCard(page: Page, content: string, columnIndex: number = 0) {
    await page.getByRole('button', { name: 'カードを追加' }).nth(columnIndex).click();
    await page.getByPlaceholder('意見を入力').fill(content);
    await page.getByRole('button', { name: '追加', exact: true }).click();
    await expect(page.locator('p', { hasText: content })).toBeVisible();
}

/** 指定フェーズまで段階的に遷移する */
export async function advanceToPhase(page: Page, targetPhase: string) {
    const steps = [
        { key: 'VOTING', button: '次へ: 投票', label: '投票' },
        { key: 'DISCUSSION', button: '次へ: 議論', label: '議論' },
        { key: 'ACTION_ITEMS', button: '次へ: アクション', label: 'アクション' },
        { key: 'CLOSED', button: '次へ: 完了', label: '完了' },
    ];

    for (const step of steps) {
        const button = page.locator('button', { hasText: step.button });
        if (await button.count() === 0) {
            if (step.key === targetPhase) break;
            continue;
        }
        await button.click();
        await page.locator('button', { hasText: `${step.label}へ進む` }).click();
        await expect(
            page.locator('.bg-indigo-600.text-white', { hasText: step.label }).first()
        ).toBeVisible({ timeout: 10000 });
        if (step.key === targetPhase) break;
    }
}

/** メモトグルを開く */
export async function openMemos(page: Page, cardContent: string) {
    const card = page.locator('.group', { hasText: cardContent }).first();
    await card.getByRole('button', { name: 'メモを表示' }).click();
}

/** メモを追加する */
export async function addMemo(page: Page, cardContent: string, memoContent: string) {
    const card = page.locator('.group', { hasText: cardContent }).first();
    await card.getByPlaceholder('メモを追加...').fill(memoContent);
    await card.getByRole('button', { name: 'メモを送信' }).click();
    await expect(page.getByText(memoContent)).toBeVisible();
}

/** リアクションを追加する */
export async function addReaction(page: Page, cardContent: string, emoji: string) {
    const card = page.locator('.group', { hasText: cardContent }).first();
    await card.getByLabel('リアクションを追加').click();
    await page.getByLabel(`リアクション ${emoji}`).click();
}

/** アクションアイテムを追加する */
export async function addActionItem(page: Page, content: string) {
    await page.getByPlaceholder('アクションアイテムを追加...').fill(content);
    await page.getByRole('button', { name: 'アクションアイテムを追加' }).click();
    await expect(page.locator('p', { hasText: content })).toBeVisible({ timeout: 10000 });
}
```

**Step 2: コミット**

```bash
git add frontend/e2e/helpers.ts
git commit -m "refactor(e2e): 共通ヘルパー関数を helpers.ts に抽出"
```

---

### Task 2: board-join.spec.ts をスリム化（5→3テスト）

**Files:**
- Modify: `frontend/e2e/board-join.spec.ts`

**Step 1: board-join.spec.ts を書き換え**

削除するテスト:
- `コードが空の場合は参加ボタンが無効` → フォームバリデーションは単体テスト
- `ホームに戻るボタンで戻れる` → 存在しないボードのエラー表示テストに統合

残すテスト（3件）:
- `参加タブでボードコードを入力して参加できる`
- `フルURLを入力しても参加できる`
- `存在しないボードにアクセスするとエラーが表示される`（ホームに戻れるアサーションも含む）

```typescript
import { test, expect } from '@playwright/test';

test.describe('ボード参加フロー', () => {
    test('参加タブでボードコードを入力して参加できる', async ({ page }) => {
        await page.goto('/');
        await page.getByPlaceholder('スプリント42 ふりかえり').fill('参加テスト用ボード');
        await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();

        await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);
        const url = page.url();
        const slug = url.split('/board/')[1];

        await page.goto('/');
        await page.locator('button', { hasText: 'ボードに参加' }).first().click();
        await page.getByPlaceholder('ボードコードを入力またはURLを貼り付け').fill(slug);
        await page.locator('button[type="submit"]', { hasText: 'ボードに参加' }).click();

        await expect(page).toHaveURL(`/board/${slug}`);
    });

    test('フルURLを入力しても参加できる', async ({ page }) => {
        await page.goto('/');
        await page.getByPlaceholder('スプリント42 ふりかえり').fill('URL参加テスト用ボード');
        await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();

        await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);
        const fullUrl = page.url();

        await page.goto('/');
        await page.locator('button', { hasText: 'ボードに参加' }).first().click();
        await page.getByPlaceholder('ボードコードを入力またはURLを貼り付け').fill(fullUrl);
        await page.locator('button[type="submit"]', { hasText: 'ボードに参加' }).click();

        await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);
    });

    test('存在しないボードにアクセスするとエラーが表示されホームに戻れる', async ({ page }) => {
        await page.goto('/board/non-existent-board-slug-12345');

        await expect(page.getByText('ボードが見つかりません')).toBeVisible({ timeout: 10000 });
        await page.locator('button', { hasText: 'ホームに戻る' }).click();
        await expect(page).toHaveURL('/');
    });
});
```

**Step 2: テスト実行で確認**

```bash
cd frontend && npx playwright test board-join.spec.ts --reporter=list
```

Expected: 3 tests passed

**Step 3: コミット**

```bash
git add frontend/e2e/board-join.spec.ts
git commit -m "refactor(e2e): board-join テストを3件に絞り込み"
```

---

### Task 3: card-operations.spec.ts をスリム化（6→3テスト）

**Files:**
- Modify: `frontend/e2e/card-operations.spec.ts`

**Step 1: card-operations.spec.ts を書き換え**

削除するテスト:
- `ESCキーでカードフォームをキャンセルできる` → キーボード操作は単体テスト
- `キャンセルボタンでカードフォームを閉じれる` → 同上
- `空の内容ではカードを追加できない` → フォームバリデーションは単体テスト

残すテスト（3件）:
- `カードを追加できる`
- `Enterキーでカードを追加できる`
- `複数のカラムにカードを追加できる`

```typescript
import { test, expect } from '@playwright/test';
import { createBoardAndJoin } from './helpers';

test.describe('カード操作', () => {
    test('カードを追加できる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー', 'カード操作テスト');

        await page.getByRole('button', { name: 'カードを追加' }).first().click();
        await expect(page.getByPlaceholder('意見を入力')).toBeVisible();

        await page.getByPlaceholder('意見を入力').fill('テストカード内容');
        await page.getByRole('button', { name: '追加', exact: true }).click();

        await expect(page.getByText('テストカード内容')).toBeVisible();
    });

    test('Enterキーでカードを追加できる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー', 'カード操作テスト');

        await page.getByRole('button', { name: 'カードを追加' }).first().click();
        await page.getByPlaceholder('意見を入力').fill('Enterで追加');
        await page.getByPlaceholder('意見を入力').press('Enter');

        await expect(page.getByText('Enterで追加')).toBeVisible();
    });

    test('複数のカラムにカードを追加できる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー', 'カード操作テスト');

        await page.getByRole('button', { name: 'カードを追加' }).first().click();
        await page.getByPlaceholder('意見を入力').fill('Keep内容');
        await page.getByRole('button', { name: '追加', exact: true }).click();
        await expect(page.getByText('Keep内容')).toBeVisible();

        await page.getByRole('button', { name: 'カードを追加' }).nth(1).click();
        await page.getByPlaceholder('意見を入力').fill('Problem内容');
        await page.getByRole('button', { name: '追加', exact: true }).click();
        await expect(page.getByText('Problem内容')).toBeVisible();

        await page.getByRole('button', { name: 'カードを追加' }).nth(2).click();
        await page.getByPlaceholder('意見を入力').fill('Try内容');
        await page.getByRole('button', { name: '追加', exact: true }).click();
        await expect(page.getByText('Try内容')).toBeVisible();
    });
});
```

**Step 2: テスト実行で確認**

```bash
cd frontend && npx playwright test card-operations.spec.ts --reporter=list
```

Expected: 3 tests passed

**Step 3: コミット**

```bash
git add frontend/e2e/card-operations.spec.ts
git commit -m "refactor(e2e): card-operations テストを3件に絞り込み"
```

---

### Task 4: phase-control.spec.ts をスリム化（6→2テスト）

**Files:**
- Modify: `frontend/e2e/phase-control.spec.ts`

**Step 1: phase-control.spec.ts を書き換え**

削除するテスト:
- `初期フェーズはWRITING（記入）` → UATで暗黙カバー
- `ファシリテーターはフェーズを進めることができる` → 全フェーズテストに含まれる
- `WRITINGフェーズではカード追加ボタンが表示される` → コンポーネントテスト
- `VOTINGフェーズではカード追加ボタンが非表示` → コンポーネントテスト

残すテスト（2件）:
- `WRITING→VOTING→DISCUSSION→ACTION_ITEMS→CLOSEDとフェーズを進められる`
- `完了したフェーズは異なるスタイルで表示される`

```typescript
import { test, expect } from '@playwright/test';
import { createBoardAndJoin } from './helpers';

test.describe('フェーズ制御', () => {
    test('WRITING→VOTING→DISCUSSION→ACTION_ITEMS→CLOSEDとフェーズを進められる', async ({ page }) => {
        await createBoardAndJoin(page, 'ファシリテーター', 'フェーズ制御テスト');

        await page.locator('button', { hasText: '次へ: 投票' }).click();
        await page.locator('button', { hasText: '投票へ進む' }).click();
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()).toBeVisible();

        await page.locator('button', { hasText: '次へ: 議論' }).click();
        await page.locator('button', { hasText: '議論へ進む' }).click();
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: '議論' }).first()).toBeVisible();

        await page.locator('button', { hasText: '次へ: アクション' }).click();
        await page.locator('button', { hasText: 'アクションへ進む' }).click();
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: 'アクション' }).first()).toBeVisible();

        await page.locator('button', { hasText: '次へ: 完了' }).click();
        await page.locator('button', { hasText: '完了へ進む' }).click();
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: '完了' }).first()).toBeVisible();

        await expect(page.locator('button', { hasText: '次へ' })).not.toBeVisible();
    });

    test('完了したフェーズは異なるスタイルで表示される', async ({ page }) => {
        await createBoardAndJoin(page, 'ファシリテーター', 'フェーズ制御テスト');

        await page.locator('button', { hasText: '次へ: 投票' }).click();
        await page.locator('button', { hasText: '投票へ進む' }).click();

        await expect(page.locator('.bg-emerald-50.text-emerald-600', { hasText: '記入' })).toBeVisible();
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()).toBeVisible();
        await expect(page.locator('.text-gray-400', { hasText: '議論' })).toBeVisible();
    });
});
```

**Step 2: テスト実行で確認**

```bash
cd frontend && npx playwright test phase-control.spec.ts --reporter=list
```

Expected: 2 tests passed

**Step 3: コミット**

```bash
git add frontend/e2e/phase-control.spec.ts
git commit -m "refactor(e2e): phase-control テストを2件に絞り込み"
```

---

### Task 5: voting.spec.ts をヘルパー利用に書き換え

**Files:**
- Modify: `frontend/e2e/voting.spec.ts`

**Step 1: voting.spec.ts を書き換え**

テスト数は3件のまま維持。ローカルヘルパーを共通ヘルパーに置き換える。

```typescript
import { test, expect } from '@playwright/test';
import { createBoardAndJoin, addCard, advanceToPhase } from './helpers';

async function setupVotingPhase(page: import('@playwright/test').Page) {
    await createBoardAndJoin(page, '投票者', '投票テスト');
    await addCard(page, '投票対象カード1');
    await advanceToPhase(page, 'VOTING');
}

test.describe('投票機能', () => {
    test('投票フェーズでカードに投票できる', async ({ page }) => {
        await setupVotingPhase(page);

        const voteButton = page.locator('[data-testid="vote-button"]').first();
        await voteButton.click();
        await expect(voteButton).toContainText('1');
    });

    test('投票を取り消せる', async ({ page }) => {
        await setupVotingPhase(page);

        const voteButton = page.locator('[data-testid="vote-button"]').first();
        await voteButton.click();
        await expect(voteButton).toContainText('1');

        await voteButton.click();
        await expect(voteButton).toContainText('0');
    });
});

test.describe('議論フェーズでの投票数表示', () => {
    test('議論フェーズに進められる', async ({ page }) => {
        await setupVotingPhase(page);

        await page.locator('button', { hasText: '次へ: 議論' }).click();
        await page.locator('button', { hasText: '議論へ進む' }).click();
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: '議論' }).first()).toBeVisible();
    });
});
```

**Step 2: テスト実行で確認**

```bash
cd frontend && npx playwright test voting.spec.ts --reporter=list
```

Expected: 3 tests passed

**Step 3: コミット**

```bash
git add frontend/e2e/voting.spec.ts
git commit -m "refactor(e2e): voting テストを共通ヘルパー利用に書き換え"
```

---

### Task 6: export.spec.ts をスリム化（8→2テスト）

**Files:**
- Modify: `frontend/e2e/export.spec.ts`

**Step 1: export.spec.ts を書き換え**

削除するテスト:
- `ファシリテーターにエクスポートボタンが表示される` → UIの存在確認は単体テスト
- `エクスポートメニューが開閉できる` → UIインタラクションは単体テスト
- `Escapeキーでメニューを閉じられる` → キーボード操作は単体テスト
- `CSVエクスポートの内容にカード情報が含まれる` → 1本に統合
- `Markdownエクスポートの内容にカード情報が含まれる` → 1本に統合
- `WRITINGフェーズでもエクスポートできる` → UATでカバー

残すテスト（2件）: CSVダウンロード+内容検証、Markdownダウンロード+内容検証

```typescript
import { test, expect } from '@playwright/test';
import { createBoardAndJoin, addCard, advanceToPhase } from './helpers';

test.describe('エクスポート機能', () => {
    test('CSVエクスポートでカード情報を含むファイルがダウンロードされる', async ({ page }) => {
        await createBoardAndJoin(page, 'ファシリテーター', 'エクスポートテスト');
        await addCard(page, 'Keep内容テスト', 0);
        await addCard(page, 'Problem内容テスト', 1);
        await advanceToPhase(page, 'DISCUSSION');

        const downloadPromise = page.waitForEvent('download');
        await page.getByLabel('エクスポート').click();
        await page.getByText('CSV形式でダウンロード').click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toMatch(/.*_export\.csv$/);

        const readable = await download.createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of readable) {
            chunks.push(chunk as Buffer);
        }
        const csvContent = Buffer.concat(chunks).toString('utf-8');

        expect(csvContent).toContain('Column,Content,Author,Votes,Memos,Reactions');
        expect(csvContent).toContain('Keep内容テスト');
        expect(csvContent).toContain('Problem内容テスト');
        expect(csvContent).toContain('ファシリテーター');
    });

    test('Markdownエクスポートでカード情報を含むファイルがダウンロードされる', async ({ page }) => {
        await createBoardAndJoin(page, 'ファシリテーター', 'エクスポートテスト');
        await addCard(page, 'MDテスト内容', 0);
        await advanceToPhase(page, 'DISCUSSION');

        const downloadPromise = page.waitForEvent('download');
        await page.getByLabel('エクスポート').click();
        await page.getByText('Markdown形式でダウンロード').click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toMatch(/.*_export\.md$/);

        const readable = await download.createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of readable) {
            chunks.push(chunk as Buffer);
        }
        const mdContent = Buffer.concat(chunks).toString('utf-8');

        expect(mdContent).toContain('# エクスポートテスト');
        expect(mdContent).toContain('## Keep');
        expect(mdContent).toContain('MDテスト内容');
    });
});
```

**Step 2: テスト実行で確認**

```bash
cd frontend && npx playwright test export.spec.ts --reporter=list
```

Expected: 2 tests passed

**Step 3: コミット**

```bash
git add frontend/e2e/export.spec.ts
git commit -m "refactor(e2e): export テストを2件に絞り込み"
```

---

### Task 7: uat-full-retro-session.spec.ts を3シナリオに再構成（13→3テスト）

**Files:**
- Modify: `frontend/e2e/uat-full-retro-session.spec.ts`

**Step 1: uat-full-retro-session.spec.ts を書き換え**

削除するテスト:
- `UAT: ページリロード後のデータ永続性` → 基本フローでカバー
- `UAT: 4Lsフレームワーク` → FDLテストで十分
- `UAT: Start Stop Continueフレームワーク` → FDLテストで十分
- `UAT: エラーケースとエッジケース` 4件 → board-joinのエラーテスト + 単体テスト
- `UAT: ボード共有と参加フロー` 2件 → board-joinテストと重複
- `UAT: CSVエクスポートの完全性` → exportテストと重複
- `UAT: タイマーを使ったタイムボックス運営` → 単体テストに委譲

残すテスト（3件）:

```typescript
import { test, expect } from '@playwright/test';
import {
    createBoardAndJoin,
    joinBoardAsMember,
    addCard,
    advanceToPhase,
    openMemos,
    addMemo,
    addReaction,
    addActionItem,
} from './helpers';

test.describe('UAT: 単独ファシリテーターKPT完走', () => {
    test('ファシリテーターが全フェーズを通してレトロを完了できる', async ({ page }) => {
        // === フェーズ1: ボード作成と記入 ===
        await createBoardAndJoin(page, 'ファシリテーター', 'スプリント42 ふりかえり');

        await expect(page.locator('h1', { hasText: 'スプリント42 ふりかえり' })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Keep' })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Problem' })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Try' })).toBeVisible();

        await addCard(page, 'チームの連携が良かった', 0);
        await addCard(page, 'デプロイに時間がかかった', 1);
        await addCard(page, 'テスト自動化を進めたい', 2);

        // リアクション
        await addReaction(page, 'チームの連携が良かった', '👍');

        // === フェーズ2: 投票 ===
        await advanceToPhase(page, 'VOTING');

        const voteButtons = page.locator('[data-testid="vote-button"]');
        await voteButtons.first().click();
        await expect(voteButtons.first()).toContainText('1');

        // === フェーズ3: 議論 ===
        await advanceToPhase(page, 'DISCUSSION');

        await openMemos(page, 'デプロイに時間がかかった');
        await addMemo(page, 'デプロイに時間がかかった', 'CI/CDパイプラインの改善が必要');

        // === フェーズ4: アクションアイテム ===
        await advanceToPhase(page, 'ACTION_ITEMS');

        await addActionItem(page, 'CI/CDパイプラインを改善する');

        // === フェーズ5: 完了 ===
        await advanceToPhase(page, 'CLOSED');

        await expect(page.locator('button', { hasText: '次へ' })).not.toBeVisible();
        await expect(page.getByText('チームの連携が良かった')).toBeVisible();
        await expect(page.getByText('デプロイに時間がかかった')).toBeVisible();

        // === エクスポート ===
        const downloadPromise = page.waitForEvent('download');
        await page.getByLabel('エクスポート').click();
        await page.getByText('Markdown形式でダウンロード').click();
        const download = await downloadPromise;

        const readable = await download.createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of readable) {
            chunks.push(chunk as Buffer);
        }
        const mdContent = Buffer.concat(chunks).toString('utf-8');
        expect(mdContent).toContain('スプリント42 ふりかえり');
        expect(mdContent).toContain('チームの連携が良かった');
    });
});

test.describe('UAT: チームでのレトロスペクティブ（複数参加者）', () => {
    test('ファシリテーターとメンバー2人で完全なレトロを実施できる', async ({ browser }) => {
        const facilitatorContext = await browser.newContext();
        const facilitatorPage = await facilitatorContext.newPage();
        await createBoardAndJoin(facilitatorPage, 'ファシリテーター', 'チームレトロ');

        const boardUrl = facilitatorPage.url();

        const member1 = await joinBoardAsMember(browser, boardUrl, '田中');
        const member2 = await joinBoardAsMember(browser, boardUrl, '佐藤');

        // 参加者同期
        await expect(facilitatorPage.getByText('田中')).toBeVisible({ timeout: 10000 });
        await expect(facilitatorPage.getByText('佐藤')).toBeVisible({ timeout: 10000 });

        // === 記入フェーズ ===
        await addCard(member1.page, '朝会が有意義だった', 0);
        await addCard(member2.page, 'ドキュメントが不足', 1);
        await addCard(facilitatorPage, 'ドキュメント改善タスクを追加', 2);

        // カード同期
        await expect(facilitatorPage.getByText('朝会が有意義だった')).toBeVisible({ timeout: 10000 });
        await expect(member1.page.getByText('ドキュメントが不足')).toBeVisible({ timeout: 10000 });

        // === 投票フェーズ ===
        await advanceToPhase(facilitatorPage, 'VOTING');
        await expect(
            member1.page.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()
        ).toBeVisible({ timeout: 10000 });

        // メンバーにはフェーズ制御ボタンが非表示
        await expect(member1.page.locator('button', { hasText: '次へ' })).not.toBeVisible();

        // 投票同期
        const member1VoteButtons = member1.page.locator('[data-testid="vote-button"]');
        await member1VoteButtons.first().click();
        const member2VoteButtons = member2.page.locator('[data-testid="vote-button"]');
        await member2VoteButtons.first().click();

        const facilVoteButtons = facilitatorPage.locator('[data-testid="vote-button"]');
        await expect(facilVoteButtons.first()).toContainText('2', { timeout: 10000 });

        // === 議論〜完了 ===
        await advanceToPhase(facilitatorPage, 'DISCUSSION');
        await expect(
            member1.page.locator('.bg-indigo-600.text-white', { hasText: '議論' }).first()
        ).toBeVisible({ timeout: 10000 });

        await advanceToPhase(facilitatorPage, 'ACTION_ITEMS');
        await advanceToPhase(facilitatorPage, 'CLOSED');

        await expect(
            member1.page.locator('.bg-indigo-600.text-white', { hasText: '完了' }).first()
        ).toBeVisible({ timeout: 10000 });

        // 完了後データ保持
        await expect(member1.page.getByText('朝会が有意義だった')).toBeVisible();
        await expect(member2.page.getByText('ドキュメントが不足')).toBeVisible();

        await facilitatorContext.close();
        await member1.context.close();
        await member2.context.close();
    });
});

test.describe('UAT: Fun Done Learnフレームワーク', () => {
    test('Fun Done Learnフレームワークで基本フローを完走できる', async ({ page }) => {
        await createBoardAndJoin(page, 'ファシリテーター', 'FDLレトロ', 'Fun Done Learn');

        await expect(page.locator('h2', { hasText: 'Fun' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('h2', { hasText: 'Done' })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Learn' })).toBeVisible();

        await addCard(page, 'ハッカソンが楽しかった', 0);
        await addCard(page, 'リリースを完了できた', 1);
        await addCard(page, '新しいフレームワークを学べた', 2);

        await advanceToPhase(page, 'CLOSED');

        await expect(page.getByText('ハッカソンが楽しかった')).toBeVisible();
        await expect(page.getByText('リリースを完了できた')).toBeVisible();
        await expect(page.getByText('新しいフレームワークを学べた')).toBeVisible();
    });
});
```

**Step 2: テスト実行で確認**

```bash
cd frontend && npx playwright test uat-full-retro-session.spec.ts --reporter=list
```

Expected: 3 tests passed

**Step 3: コミット**

```bash
git add frontend/e2e/uat-full-retro-session.spec.ts
git commit -m "refactor(e2e): UATテストを3シナリオに集約"
```

---

### Task 8: 不要なE2Eテストファイル14件を削除

**Files:**
- Delete: `frontend/e2e/card-edit-delete.spec.ts`
- Delete: `frontend/e2e/card-drag-drop.spec.ts`
- Delete: `frontend/e2e/card-discussion.spec.ts`
- Delete: `frontend/e2e/voting-limit.spec.ts`
- Delete: `frontend/e2e/memo-operations.spec.ts`
- Delete: `frontend/e2e/reaction-operations.spec.ts`
- Delete: `frontend/e2e/action-item-operations.spec.ts`
- Delete: `frontend/e2e/authorization.spec.ts`
- Delete: `frontend/e2e/anonymous-mode.spec.ts`
- Delete: `frontend/e2e/private-writing.spec.ts`
- Delete: `frontend/e2e/kudos-operations.spec.ts`
- Delete: `frontend/e2e/carry-over.spec.ts`
- Delete: `frontend/e2e/dashboard.spec.ts`
- Delete: `frontend/e2e/timer.spec.ts`

**Step 1: 14ファイルを削除**

```bash
cd frontend/e2e && rm \
  card-edit-delete.spec.ts \
  card-drag-drop.spec.ts \
  card-discussion.spec.ts \
  voting-limit.spec.ts \
  memo-operations.spec.ts \
  reaction-operations.spec.ts \
  action-item-operations.spec.ts \
  authorization.spec.ts \
  anonymous-mode.spec.ts \
  private-writing.spec.ts \
  kudos-operations.spec.ts \
  carry-over.spec.ts \
  dashboard.spec.ts \
  timer.spec.ts
```

**Step 2: 全E2Eテスト実行で確認**

```bash
cd frontend && npx playwright test --reporter=list
```

Expected: 25 tests passed（home:4 + board-creation:3 + board-join:3 + card-operations:3 + voting:3 + phase-control:2 + realtime-sync:2 + export:2 + uat:3）

**Step 3: コミット**

```bash
cd frontend && git add -A e2e/
git commit -m "refactor(e2e): 不要な個別機能テスト14ファイルを削除（151→25テスト）"
```

---

### Task 9: 全テスト通過を最終確認

**Files:**
- None (verification only)

**Step 1: E2Eテスト全件実行**

```bash
cd frontend && npx playwright test --reporter=list
```

Expected: 25 tests passed, 0 failed

**Step 2: フロントエンド単体テスト実行（既存カバレッジが維持されていることを確認）**

```bash
cd frontend && npm run test -- --run
```

Expected: 全テスト通過、カバレッジ80%以上維持

**Step 3: Lint + 型チェック**

```bash
cd frontend && npm run lint && npx tsc --noEmit
```

Expected: エラーなし

**Step 4: 最終コミット（必要な場合のみ）**

全ステップでエラーがなければ追加コミット不要。

---

## サマリー

| ステップ | 変更内容 | テスト数変化 |
|---------|---------|------------|
| Task 1 | helpers.ts 作成 | - |
| Task 2 | board-join スリム化 | 5→3 |
| Task 3 | card-operations スリム化 | 6→3 |
| Task 4 | phase-control スリム化 | 6→2 |
| Task 5 | voting ヘルパー利用 | 3→3 |
| Task 6 | export スリム化 | 8→2 |
| Task 7 | UAT 再構成 | 13→3 |
| Task 8 | 14ファイル削除 | -126 |
| Task 9 | 最終確認 | - |
| **合計** | **23→10ファイル** | **151→25テスト** |
