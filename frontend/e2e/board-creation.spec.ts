import { test, expect } from '@playwright/test';

test.describe('ボード作成フロー', () => {
    test('ボードを作成してボードページに遷移する', async ({ page }) => {
        await page.goto('/');

        // タイトルを入力（placeholderで特定）
        await page.getByPlaceholder('スプリント42 ふりかえり').fill('テストスプリント ふりかえり');

        // KPTフレームワークを選択（デフォルトで選択済み）
        await page.locator('button', { hasText: 'KPT' }).click();

        // ボードを作成（送信ボタン）
        await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();

        // ボードページに遷移することを確認
        await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

        // ニックネーム入力欄が表示される
        await expect(page.getByPlaceholder('ニックネームを入力')).toBeVisible({ timeout: 10000 });
    });

    test('各フレームワークでボードを作成できる', async ({ page }) => {
        const frameworks = ['Fun Done Learn', '4Ls', 'Start Stop Continue'];

        for (const framework of frameworks) {
            await page.goto('/');
            await page.getByPlaceholder('スプリント42 ふりかえり').fill(`${framework} テスト`);
            await page.locator('button', { hasText: framework }).click();
            await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();

            await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);
        }
    });

    test('タイトルが空の場合は作成ボタンが無効', async ({ page }) => {
        await page.goto('/');

        // タイトルが空の状態で送信ボタンが無効
        const createButton = page.locator('button[type="submit"]', { hasText: 'ボードを作成' });
        await expect(createButton).toBeDisabled();
    });
});
