import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してカードを追加し、投票フェーズに進める
async function setupVotingPhase(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('投票テスト');
    await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

    await page.getByPlaceholder('ニックネームを入力').fill('投票者');
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();

    await expect(page.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

    // カードを追加
    await page.getByRole('button', { name: 'カードを追加' }).first().click();
    await page.getByPlaceholder('意見を入力').fill('投票対象カード1');
    await page.getByRole('button', { name: '追加', exact: true }).click();
    await expect(page.getByText('投票対象カード1')).toBeVisible();

    // 投票フェーズに進める
    await page.locator('button', { hasText: '次へ: 投票' }).click();
    await page.locator('button', { hasText: '投票へ進む' }).click();
    await expect(page.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()).toBeVisible();
}

test.describe('投票機能', () => {
    test('投票フェーズでカードに投票できる', async ({ page }) => {
        await setupVotingPhase(page);

        // 投票ボタン(0)をクリック - data-testidで確実に取得
        const voteButton = page.locator('[data-testid="vote-button"]').first();
        await voteButton.click();

        // 投票数が1になることを確認
        await expect(voteButton).toContainText('1');
    });

    test('投票を取り消せる', async ({ page }) => {
        await setupVotingPhase(page);

        // 投票
        const voteButton = page.locator('[data-testid="vote-button"]').first();
        await voteButton.click();
        await expect(voteButton).toContainText('1');

        // 投票を取り消し
        await voteButton.click();

        // 投票数が0に戻る
        await expect(voteButton).toContainText('0');
    });
});

test.describe('議論フェーズでの投票数表示', () => {
    test('議論フェーズに進められる', async ({ page }) => {
        await setupVotingPhase(page);

        // 議論フェーズに進める
        await page.locator('button', { hasText: '次へ: 議論' }).click();
        await page.locator('button', { hasText: '議論へ進む' }).click();
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: '議論' }).first()).toBeVisible();
    });
});

