import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してニックネームで参加（ファシリテーター）
async function createBoardAndJoinAsFacilitator(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('フェーズ制御テスト');
    await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

    await page.getByPlaceholder('ニックネームを入力').fill('ファシリテーター');
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();

    await expect(page.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });
}

test.describe('フェーズ制御', () => {
    test('初期フェーズはWRITING（記入）', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // 現在のフェーズが「記入」であることを確認
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: '記入' }).first()).toBeVisible();
    });

    test('ファシリテーターはフェーズを進めることができる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // 「次へ: 投票」ボタンをクリック
        await page.locator('button', { hasText: '次へ: 投票' }).click();

        // フェーズが投票に変わる
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()).toBeVisible();
    });

    test('WRITING→VOTING→DISCUSSION→ACTION_ITEMS→CLOSEDとフェーズを進められる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // WRITING → VOTING
        await page.locator('button', { hasText: '次へ: 投票' }).click();
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()).toBeVisible();

        // VOTING → DISCUSSION
        await page.locator('button', { hasText: '次へ: 議論' }).click();
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: '議論' }).first()).toBeVisible();

        // DISCUSSION → ACTION_ITEMS
        await page.locator('button', { hasText: '次へ: アクション' }).click();
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: 'アクション' }).first()).toBeVisible();

        // ACTION_ITEMS → CLOSED
        await page.locator('button', { hasText: '次へ: 完了' }).click();
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: '完了' }).first()).toBeVisible();

        // 完了後は「次へ」ボタンがない
        await expect(page.locator('button', { hasText: '次へ' })).not.toBeVisible();
    });

    test('WRITINGフェーズではカード追加ボタンが表示される', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // カード追加ボタンが表示される
        await expect(page.locator('button[title="カードを追加"]').first()).toBeVisible();
    });

    test('VOTINGフェーズではカード追加ボタンが非表示', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // 投票フェーズに進める
        await page.locator('button', { hasText: '次へ: 投票' }).click();
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()).toBeVisible();

        // カード追加ボタンが非表示
        await expect(page.locator('button[title="カードを追加"]')).not.toBeVisible();
    });
});

test.describe('フェーズステッパー表示', () => {
    test('完了したフェーズは異なるスタイルで表示される', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // 投票フェーズに進める
        await page.locator('button', { hasText: '次へ: 投票' }).click();

        // 記入フェーズが完了スタイルになっている
        await expect(page.locator('.bg-indigo-100.text-indigo-700', { hasText: '記入' })).toBeVisible();

        // 投票が現在のフェーズ
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()).toBeVisible();

        // 議論以降は未完了スタイル
        await expect(page.locator('.bg-gray-100.text-gray-400', { hasText: '議論' })).toBeVisible();
    });
});
