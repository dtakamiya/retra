import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してニックネームで参加
async function createBoardAndJoin(page: import('@playwright/test').Page, nickname: string) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('カード操作テスト');
    await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

    // ニックネームを入力してボードに参加
    await page.getByPlaceholder('ニックネームを入力').fill(nickname);
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();

    // ボードビューが表示されるまで待機
    await expect(page.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });
}

test.describe('カード操作', () => {
    test('カードを追加できる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');

        // Keepカラムの＋ボタンをクリック（h2のKeepの近くにある追加ボタン）
        await page.getByRole('button', { name: 'カードを追加' }).first().click();

        // カードフォームが表示される
        await expect(page.getByPlaceholder('意見を入力')).toBeVisible();

        // カードの内容を入力
        await page.getByPlaceholder('意見を入力').fill('テストカード内容');
        await page.getByRole('button', { name: '追加', exact: true }).click();

        // カードが表示される
        await expect(page.getByText('テストカード内容')).toBeVisible();
    });

    test('Enterキーでカードを追加できる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');

        await page.getByRole('button', { name: 'カードを追加' }).first().click();

        await page.getByPlaceholder('意見を入力').fill('Enterで追加');
        await page.getByPlaceholder('意見を入力').press('Enter');

        await expect(page.getByText('Enterで追加')).toBeVisible();
    });

    test('ESCキーでカードフォームをキャンセルできる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');

        await page.getByRole('button', { name: 'カードを追加' }).first().click();

        await page.getByPlaceholder('意見を入力').fill('キャンセルされる内容');
        await page.getByPlaceholder('意見を入力').press('Escape');

        // カードフォームが閉じる
        await expect(page.getByPlaceholder('意見を入力')).not.toBeVisible();
        // カードは追加されていない
        await expect(page.getByText('キャンセルされる内容')).not.toBeVisible();
    });

    test('キャンセルボタンでカードフォームを閉じれる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');

        await page.getByRole('button', { name: 'カードを追加' }).first().click();

        await page.locator('button', { hasText: 'キャンセル' }).click();

        await expect(page.getByPlaceholder('意見を入力')).not.toBeVisible();
    });

    test('空の内容ではカードを追加できない', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');

        await page.getByRole('button', { name: 'カードを追加' }).first().click();

        // 追加ボタンが無効
        await expect(page.getByRole('button', { name: '追加', exact: true })).toBeDisabled();
    });

    test('複数のカラムにカードを追加できる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');

        // Keepカラムにカード追加
        await page.getByRole('button', { name: 'カードを追加' }).first().click();
        await page.getByPlaceholder('意見を入力').fill('Keep内容');
        await page.getByRole('button', { name: '追加', exact: true }).click();
        await expect(page.getByText('Keep内容')).toBeVisible();

        // Problemカラムにカード追加
        await page.getByRole('button', { name: 'カードを追加' }).nth(1).click();
        await page.getByPlaceholder('意見を入力').fill('Problem内容');
        await page.getByRole('button', { name: '追加', exact: true }).click();
        await expect(page.getByText('Problem内容')).toBeVisible();

        // Tryカラムにカード追加
        await page.getByRole('button', { name: 'カードを追加' }).nth(2).click();
        await page.getByPlaceholder('意見を入力').fill('Try内容');
        await page.getByRole('button', { name: '追加', exact: true }).click();
        await expect(page.getByText('Try内容')).toBeVisible();
    });
});
