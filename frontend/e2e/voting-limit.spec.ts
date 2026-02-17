import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してニックネームで参加、複数カードを追加して投票フェーズに進める
async function setupVotingWithMultipleCards(page: import('@playwright/test').Page, cardCount: number = 3) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('投票制限テスト');
    await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

    await page.getByPlaceholder('ニックネームを入力').fill('投票者');
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();

    await expect(page.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

    // 複数のカードを追加
    for (let i = 1; i <= cardCount; i++) {
        await page.getByRole('button', { name: 'カードを追加' }).first().click();
        await page.getByPlaceholder('意見を入力').fill(`投票カード${i}`);
        await page.getByRole('button', { name: '追加', exact: true }).click();
        // フォームが閉じるのを待ってから、p要素内のカードテキストを確認
        await expect(page.getByPlaceholder('意見を入力')).not.toBeVisible();
        await expect(page.locator('p', { hasText: `投票カード${i}` })).toBeVisible();
    }

    // 投票フェーズに進める
    await page.locator('button', { hasText: '次へ: 投票' }).click();
    await page.locator('button', { hasText: '投票へ進む' }).click();
    await expect(page.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()).toBeVisible();
}

// ヘルパー関数: 特定カードの投票ボタンをクリックし、投票数が更新されるのを待つ
async function voteOnCard(page: import('@playwright/test').Page, cardText: string) {
    const card = page.locator('.group', { hasText: cardText }).first();
    const voteButton = card.locator('[data-testid="vote-button"]');
    const currentCount = await voteButton.locator('span').textContent();
    const expectedCount = String(Number(currentCount) + 1);
    await voteButton.click({ force: true });
    // 投票数が更新されるのを待つ
    await expect(voteButton.locator('span')).toHaveText(expectedCount, { timeout: 5000 });
}

// ヘルパー関数: 特定カードの投票を取り消し、投票数が減少するのを待つ
async function unvoteOnCard(page: import('@playwright/test').Page, cardText: string) {
    const card = page.locator('.group', { hasText: cardText }).first();
    const voteButton = card.locator('[data-testid="vote-button"]');
    const currentCount = await voteButton.locator('span').textContent();
    const expectedCount = String(Number(currentCount) - 1);
    await voteButton.click({ force: true });
    // 投票数が更新されるのを待つ
    await expect(voteButton.locator('span')).toHaveText(expectedCount, { timeout: 5000 });
}

test.describe('残り投票数表示', () => {
    test('投票フェーズに入ると残り投票数が表示される', async ({ page }) => {
        await setupVotingWithMultipleCards(page);

        // 残り投票数の表示を確認（サイドパネル）
        await expect(page.getByText('残り 5票')).toBeVisible();
    });

    test('投票すると残り投票数が減少する', async ({ page }) => {
        await setupVotingWithMultipleCards(page);

        // 初期状態の確認（サイドパネル）
        await expect(page.getByText('残り 5票')).toBeVisible();

        // 投票
        await voteOnCard(page, '投票カード1');

        // 残り投票数が減少していることを確認
        await expect(page.getByText('残り 4票')).toBeVisible({ timeout: 5000 });
    });
});

test.describe('投票上限制限', () => {
    test('投票上限に達すると追加投票できない', async ({ page }) => {
        // 十分なカードを用意
        await setupVotingWithMultipleCards(page, 7);

        // 投票数上限（デフォルト5票）まで1枚ずつ別のカードに投票
        for (let i = 1; i <= 5; i++) {
            await voteOnCard(page, `投票カード${i}`);
            // 残り票数の更新を待つ
            await expect(page.getByText(`残り ${5 - i}票`)).toBeVisible({ timeout: 5000 });
        }

        // 残り0票であることを確認
        await expect(page.getByText('残り 0票')).toBeVisible();

        // 未投票のカードの投票ボタンが無効であることを確認
        const card6 = page.locator('.group', { hasText: '投票カード6' }).first();
        const disabledButton = card6.locator('[data-testid="vote-button"]');
        await expect(disabledButton).toBeDisabled();
    });

    test('投票を取り消すと残り投票数が回復する', async ({ page }) => {
        await setupVotingWithMultipleCards(page);

        // 初期状態の確認
        await expect(page.getByText('残り 5票')).toBeVisible();

        // 投票
        await voteOnCard(page, '投票カード1');
        await expect(page.getByText('残り 4票')).toBeVisible({ timeout: 5000 });

        // 投票を取り消し
        await unvoteOnCard(page, '投票カード1');

        // 残り投票数が回復
        await expect(page.getByText('残り 5票')).toBeVisible({ timeout: 5000 });
    });

    test('複数回投票と取り消しで正しく票数が管理される', async ({ page }) => {
        await setupVotingWithMultipleCards(page, 5);

        // 3枚のカードに投票
        for (let i = 1; i <= 3; i++) {
            await voteOnCard(page, `投票カード${i}`);
            await expect(page.getByText(`残り ${5 - i}票`)).toBeVisible({ timeout: 5000 });
        }

        // 残り2票であることを確認
        await expect(page.getByText('残り 2票')).toBeVisible();

        // 1つ取り消し
        await unvoteOnCard(page, '投票カード1');

        // 残り3票に回復
        await expect(page.getByText('残り 3票')).toBeVisible({ timeout: 5000 });
    });
});

test.describe('投票情報のパネル表示', () => {
    test('サイドパネルに投票状況が表示される', async ({ page }) => {
        await setupVotingWithMultipleCards(page);

        // デスクトップ表示でサイドパネルの投票情報を確認
        await expect(page.getByText(/投票:.*\/.*5/)).toBeVisible();
        await expect(page.getByText(/残り .+票/)).toBeVisible();
    });
});
