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
