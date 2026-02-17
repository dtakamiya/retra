import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してニックネームで参加
async function createBoardAndJoin(page: import('@playwright/test').Page, nickname: string) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('リアクション操作テスト');
    await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

    await page.getByPlaceholder('ニックネームを入力').fill(nickname);
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();

    await expect(page.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });
}

// ヘルパー関数: カードを追加
async function addCard(page: import('@playwright/test').Page, content: string) {
    await page.getByRole('button', { name: 'カードを追加' }).first().click();
    await page.getByPlaceholder('意見を入力').fill(content);
    await page.getByRole('button', { name: '追加', exact: true }).click();
    await expect(page.locator('p', { hasText: content })).toBeVisible();
}

// ヘルパー関数: カードにリアクションを追加
async function addReaction(page: import('@playwright/test').Page, cardContent: string, emoji: string) {
    const card = page.locator('.group', { hasText: cardContent }).first();
    await card.getByLabel('リアクションを追加').click();
    await page.getByLabel(`リアクション ${emoji}`).click();
}

test.describe('リアクション追加・削除', () => {
    test('カードにリアクションを追加できる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, 'リアクションテストカード');

        // リアクションピッカーを開いて👍を追加
        await addReaction(page, 'リアクションテストカード', '👍');

        // リアクションが表示される（カウント1）
        const card = page.locator('.group', { hasText: 'リアクションテストカード' }).first();
        await expect(card.getByLabel(/👍 1件/)).toBeVisible();
    });

    test('リアクションをクリックして取り消せる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, '取り消しテストカード');

        // リアクション追加
        await addReaction(page, '取り消しテストカード', '❤️');

        const card = page.locator('.group', { hasText: '取り消しテストカード' }).first();
        await expect(card.getByLabel(/❤️ 1件/)).toBeVisible();

        // 同じリアクションをクリックして取り消し
        await card.getByLabel(/❤️ 1件/).click();

        // リアクションが消える
        await expect(card.getByLabel(/❤️/)).not.toBeVisible();
    });

    test('複数の異なる絵文字でリアクションできる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, '複数リアクションカード');

        // 👍を追加
        await addReaction(page, '複数リアクションカード', '👍');
        const card = page.locator('.group', { hasText: '複数リアクションカード' }).first();
        await expect(card.getByLabel(/👍 1件/)).toBeVisible();

        // 🎉を追加
        await addReaction(page, '複数リアクションカード', '🎉');
        await expect(card.getByLabel(/🎉 1件/)).toBeVisible();

        // 両方表示されている
        await expect(card.getByLabel(/👍 1件/)).toBeVisible();
        await expect(card.getByLabel(/🎉 1件/)).toBeVisible();
    });

    test('リアクションピッカーをEscapeで閉じられる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, 'Escテストカード');

        const card = page.locator('.group', { hasText: 'Escテストカード' }).first();
        await card.getByLabel('リアクションを追加').click();

        // ピッカーが表示される
        await expect(page.getByLabel('リアクション 👍')).toBeVisible();

        // Escapeで閉じる
        await page.keyboard.press('Escape');
        await expect(page.getByLabel('リアクション 👍')).not.toBeVisible();
    });

    test('リアクション済みの絵文字は強調表示される', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, '強調テストカード');

        await addReaction(page, '強調テストカード', '👍');

        const card = page.locator('.group', { hasText: '強調テストカード' }).first();
        const reactionButton = card.getByLabel(/👍 1件.*リアクション済み/);
        await expect(reactionButton).toBeVisible();

        // 強調スタイル（bg-indigo-50）が適用されている
        await expect(reactionButton).toHaveClass(/bg-indigo-50/);
    });
});

test.describe('リアクションのリアルタイム同期', () => {
    test('リアクションの追加がリアルタイムに同期される', async ({ browser }) => {
        // ファシリテーターがボードを作成
        const context1 = await browser.newContext();
        const facilitatorPage = await context1.newPage();

        await facilitatorPage.goto('/');
        await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('リアクション同期テスト');
        await facilitatorPage.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
        await expect(facilitatorPage).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

        const boardUrl = facilitatorPage.url();

        await facilitatorPage.getByPlaceholder('ニックネームを入力').fill('ファシリテーター');
        await facilitatorPage.locator('button[type="submit"]', { hasText: '参加' }).click();
        await expect(facilitatorPage.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

        // メンバーが参加
        const context2 = await browser.newContext();
        const memberPage = await context2.newPage();
        await memberPage.goto(boardUrl);

        await memberPage.getByPlaceholder('ニックネームを入力').fill('メンバー');
        await memberPage.locator('button[type="submit"]', { hasText: '参加' }).click();
        await expect(memberPage.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

        // ファシリテーターがカードを追加
        await facilitatorPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await facilitatorPage.getByPlaceholder('意見を入力').fill('同期テストカード');
        await facilitatorPage.getByRole('button', { name: '追加', exact: true }).click();
        await expect(facilitatorPage.locator('p', { hasText: '同期テストカード' })).toBeVisible();

        // メンバー側でカードの同期を待つ
        await expect(memberPage.getByText('同期テストカード')).toBeVisible({ timeout: 10000 });

        // メンバーがリアクションを追加
        const memberCard = memberPage.locator('.group', { hasText: '同期テストカード' }).first();
        await memberCard.getByLabel('リアクションを追加').click();
        await memberPage.getByLabel('リアクション 👍').click();

        // メンバー側で表示確認
        await expect(memberCard.getByLabel(/👍 1件/)).toBeVisible();

        // ファシリテーター側でもリアクションが同期される
        const facilCard = facilitatorPage.locator('.group', { hasText: '同期テストカード' }).first();
        await expect(facilCard.getByLabel(/👍 1件/)).toBeVisible({ timeout: 10000 });

        await context1.close();
        await context2.close();
    });

    test('リアクションの削除がリアルタイムに同期される', async ({ browser }) => {
        // ファシリテーターがボードを作成
        const context1 = await browser.newContext();
        const facilitatorPage = await context1.newPage();

        await facilitatorPage.goto('/');
        await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('リアクション削除同期テスト');
        await facilitatorPage.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
        await expect(facilitatorPage).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

        const boardUrl = facilitatorPage.url();

        await facilitatorPage.getByPlaceholder('ニックネームを入力').fill('ファシリテーター');
        await facilitatorPage.locator('button[type="submit"]', { hasText: '参加' }).click();
        await expect(facilitatorPage.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

        // メンバーが参加
        const context2 = await browser.newContext();
        const memberPage = await context2.newPage();
        await memberPage.goto(boardUrl);

        await memberPage.getByPlaceholder('ニックネームを入力').fill('メンバー');
        await memberPage.locator('button[type="submit"]', { hasText: '参加' }).click();
        await expect(memberPage.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

        // ファシリテーターがカード追加
        await facilitatorPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await facilitatorPage.getByPlaceholder('意見を入力').fill('削除同期テストカード');
        await facilitatorPage.getByRole('button', { name: '追加', exact: true }).click();
        await expect(facilitatorPage.locator('p', { hasText: '削除同期テストカード' })).toBeVisible();

        await expect(memberPage.getByText('削除同期テストカード')).toBeVisible({ timeout: 10000 });

        // ファシリテーターがリアクション追加
        const facilCard = facilitatorPage.locator('.group', { hasText: '削除同期テストカード' }).first();
        await facilCard.getByLabel('リアクションを追加').click();
        await facilitatorPage.getByLabel('リアクション ❤️').click();
        await expect(facilCard.getByLabel(/❤️ 1件/)).toBeVisible();

        // メンバー側で同期確認
        const memberCard = memberPage.locator('.group', { hasText: '削除同期テストカード' }).first();
        await expect(memberCard.getByLabel(/❤️ 1件/)).toBeVisible({ timeout: 10000 });

        // ファシリテーターがリアクション取り消し
        await facilCard.getByLabel(/❤️ 1件/).click();

        // 両方のページでリアクションが消失
        await expect(facilCard.getByLabel(/❤️/)).not.toBeVisible();
        await expect(memberCard.getByLabel(/❤️/)).not.toBeVisible({ timeout: 10000 });

        await context1.close();
        await context2.close();
    });
});
