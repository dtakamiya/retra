import { test, expect } from '@playwright/test';

test.describe('ボード参加フロー', () => {
    test('参加タブでボードコードを入力して参加できる', async ({ page }) => {
        // まずボードを作成
        await page.goto('/');
        await page.getByPlaceholder('スプリント42 ふりかえり').fill('参加テスト用ボード');
        await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();

        // URLからslugを取得
        await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);
        const url = page.url();
        const slug = url.split('/board/')[1];

        // 新しいページでホームに戻り、参加フローを実行
        await page.goto('/');
        await page.locator('button', { hasText: 'ボードに参加' }).first().click();
        await page.getByPlaceholder('ボードコードを入力またはURLを貼り付け').fill(slug);
        await page.locator('button[type="submit"]', { hasText: 'ボードに参加' }).click();

        // ボードページに遷移
        await expect(page).toHaveURL(`/board/${slug}`);
    });

    test('フルURLを入力しても参加できる', async ({ page }) => {
        // まずボードを作成
        await page.goto('/');
        await page.getByPlaceholder('スプリント42 ふりかえり').fill('URL参加テスト用ボード');
        await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();

        await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);
        const fullUrl = page.url();

        // 新しいページでホームに戻り、URLで参加
        await page.goto('/');
        await page.locator('button', { hasText: 'ボードに参加' }).first().click();
        await page.getByPlaceholder('ボードコードを入力またはURLを貼り付け').fill(fullUrl);
        await page.locator('button[type="submit"]', { hasText: 'ボードに参加' }).click();

        // ボードページに遷移
        await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);
    });

    test('コードが空の場合は参加ボタンが無効', async ({ page }) => {
        await page.goto('/');
        await page.locator('button', { hasText: 'ボードに参加' }).first().click();

        const joinButton = page.locator('button[type="submit"]', { hasText: 'ボードに参加' });
        await expect(joinButton).toBeDisabled();
    });
});

test.describe('存在しないボード', () => {
    test('存在しないボードにアクセスするとエラーが表示される', async ({ page }) => {
        await page.goto('/board/non-existent-board-slug-12345');

        // エラーメッセージが表示される
        await expect(page.getByText('ボードが見つかりません')).toBeVisible({ timeout: 10000 });

        // ホームに戻るボタンがある
        await expect(page.locator('button', { hasText: 'ホームに戻る' })).toBeVisible();
    });

    test('ホームに戻るボタンで戻れる', async ({ page }) => {
        await page.goto('/board/non-existent-board-slug-12345');

        await page.locator('button', { hasText: 'ホームに戻る' }).click();

        await expect(page).toHaveURL('/');
    });
});
