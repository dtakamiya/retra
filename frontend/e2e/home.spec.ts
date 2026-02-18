import { test, expect } from '@playwright/test';

test.describe('ホームページ', () => {
    test('ページタイトルとヘッダーが表示される', async ({ page }) => {
        await page.goto('/');

        // ページタイトルの確認
        await expect(page).toHaveTitle(/Retra/);

        // メインヘッダーの確認
        await expect(page.getByRole('heading', { name: 'Retra' })).toBeVisible();
        await expect(page.getByText(/スクラムチームのためのリアルタイム/)).toBeVisible();
    });

    test('ボード作成タブがデフォルトで選択されている', async ({ page }) => {
        await page.goto('/');

        // タイトル入力欄が表示されている（placeholderで確認）
        await expect(page.getByPlaceholder('スプリント42 ふりかえり')).toBeVisible();

        // フレームワーク選択が表示されている
        await expect(page.getByText('フレームワーク')).toBeVisible();
    });

    test('参加タブに切り替えられる', async ({ page }) => {
        await page.goto('/');

        // 参加タブをクリック
        await page.locator('button', { hasText: 'ボードに参加' }).first().click();

        // URL/コード入力欄が表示される（placeholderで確認）
        await expect(page.getByPlaceholder('ボードコードを入力またはURLを貼り付け')).toBeVisible();
    });

    test('フレームワークを選択できる', async ({ page }) => {
        await page.goto('/');

        // 各フレームワークボタンをクリックして選択できる
        const funDoneLearn = page.locator('button', { hasText: 'Fun Done Learn' });
        await funDoneLearn.click();
        await expect(funDoneLearn).toHaveClass(/border-indigo-500/);

        const fourLs = page.locator('button', { hasText: '4Ls' });
        await fourLs.click();
        await expect(fourLs).toHaveClass(/border-indigo-500/);
    });
});
