import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してファシリテーターとして参加
async function createBoardAndJoinAsFacilitator(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('タイマーテスト');
    await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

    await page.getByPlaceholder('ニックネームを入力').fill('ファシリテーター');
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();

    await expect(page.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });
}

test.describe('タイマー機能', () => {
    test('タイマーが初期状態で--:--と表示される', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // デスクトップ表示でタイマーを確認
        await expect(page.getByText('--:--').first()).toBeVisible();
    });

    test('ファシリテーターはタイマーを開始できる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // 開始ボタンをクリック
        await page.locator('button', { hasText: '開始' }).first().click();

        // 時間入力と開始UIが表示される
        await expect(page.locator('input[type="number"]')).toBeVisible();

        // 開始を確定
        await page.locator('button', { hasText: '開始' }).last().click();

        // タイマーに時間が表示される（05:00など）
        await expect(page.getByText(/\d{2}:\d{2}/).first()).toBeVisible();
    });

    test('タイマーを一時停止・再開できる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // タイマー開始
        await page.locator('button', { hasText: '開始' }).first().click();
        await page.locator('input[type="number"]').fill('1'); // 1分に設定
        await page.locator('button', { hasText: '開始' }).last().click();

        // 一時停止
        await page.locator('button', { hasText: '一時停止' }).click();

        // 再開ボタンが表示される
        await expect(page.locator('button', { hasText: '再開' })).toBeVisible();

        // 再開
        await page.locator('button', { hasText: '再開' }).click();

        // 一時停止ボタンが表示される
        await expect(page.locator('button', { hasText: '一時停止' })).toBeVisible();
    });

    test('タイマーをリセットできる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // タイマー開始
        await page.locator('button', { hasText: '開始' }).first().click();
        await page.locator('input[type="number"]').fill('1');
        await page.locator('button', { hasText: '開始' }).last().click();

        // リセットボタンをクリック（アイコンボタン）
        await page.locator('button').filter({ has: page.locator('svg') }).last().click();

        // タイマーが--:--に戻る
        await expect(page.getByText('--:--').first()).toBeVisible();
    });



    test('タイマー設定をキャンセルできる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // 開始ボタンをクリック
        await page.locator('button', { hasText: '開始' }).first().click();

        // キャンセル
        await page.locator('button', { hasText: 'キャンセル' }).click();

        // 時間入力が非表示
        await expect(page.locator('input[type="number"]')).not.toBeVisible();
    });
});
