import { test, expect } from '@playwright/test';

test.describe('リアルタイム同期', () => {
    test('2つのブラウザでカードが同期される', async ({ browser }) => {
        // 1つ目のブラウザでボードを作成
        const context1 = await browser.newContext();
        const page1 = await context1.newPage();

        await page1.goto('/');
        await page1.getByPlaceholder('スプリント42 ふりかえり').fill('リアルタイム同期テスト');
        await page1.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
        await expect(page1).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

        const boardUrl = page1.url();

        // 1つ目のユーザーが参加
        await page1.getByPlaceholder('ニックネームを入力').fill('ユーザー1');
        await page1.locator('button[type="submit"]', { hasText: '参加' }).click();
        await expect(page1.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

        // 2つ目のブラウザで同じボードに参加
        const context2 = await browser.newContext();
        const page2 = await context2.newPage();
        await page2.goto(boardUrl);

        await page2.getByPlaceholder('ニックネームを入力').fill('ユーザー2');
        await page2.locator('button[type="submit"]', { hasText: '参加' }).click();
        await expect(page2.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

        // ユーザー1がカードを追加
        await page1.getByRole('button', { name: 'カードを追加' }).first().click();
        await page1.getByPlaceholder('意見を入力').fill('リアルタイム同期テスト内容');
        await page1.locator('button', { hasText: '追加' }).click();

        // ユーザー1でカードが表示される
        await expect(page1.getByText('リアルタイム同期テスト内容')).toBeVisible();

        // ユーザー2でもカードが表示される（WebSocket同期）
        await expect(page2.getByText('リアルタイム同期テスト内容')).toBeVisible({ timeout: 10000 });

        await context1.close();
        await context2.close();
    });

    test('参加者が追加されるとリストが更新される', async ({ browser }) => {
        // 1つ目のブラウザでボードを作成
        const context1 = await browser.newContext();
        const page1 = await context1.newPage();

        await page1.goto('/');
        await page1.getByPlaceholder('スプリント42 ふりかえり').fill('参加者同期テスト');
        await page1.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
        await expect(page1).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

        const boardUrl = page1.url();

        await page1.getByPlaceholder('ニックネームを入力').fill('最初のユーザー');
        await page1.locator('button[type="submit"]', { hasText: '参加' }).click();
        await expect(page1.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

        // 最初のユーザーが参加者リストに表示される
        await expect(page1.getByText('最初のユーザー')).toBeVisible();

        // 2つ目のブラウザで参加
        const context2 = await browser.newContext();
        const page2 = await context2.newPage();
        await page2.goto(boardUrl);

        await page2.getByPlaceholder('ニックネームを入力').fill('新しいユーザー');
        await page2.locator('button[type="submit"]', { hasText: '参加' }).click();
        await expect(page2.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

        // 最初のユーザーのページでも新しいユーザーが表示される
        await expect(page1.getByText('新しいユーザー')).toBeVisible({ timeout: 10000 });

        await context1.close();
        await context2.close();
    });

});

