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

        await page.getByRole('button', { name: '次へ: 議論' }).click();
        await page.locator('button', { hasText: '議論へ進む' }).click();
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: '議論' }).first()).toBeVisible();
    });
});
