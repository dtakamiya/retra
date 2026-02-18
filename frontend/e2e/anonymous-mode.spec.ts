import { test, expect } from '@playwright/test';

// ヘルパー関数: 匿名モードでボードを作成してニックネームで参加
async function createAnonymousBoardAndJoin(
    page: import('@playwright/test').Page,
    nickname: string = 'ファシリテーター'
) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('匿名モードテスト');

    // 匿名モードをON
    await page.getByRole('switch', { name: '匿名モード' }).click();
    await expect(page.getByRole('switch', { name: '匿名モード' })).toHaveAttribute('aria-checked', 'true');

    await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

    await page.getByPlaceholder('ニックネームを入力').fill(nickname);
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();
    await expect(page.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });
}

// ヘルパー関数: 通常モード（非匿名）でボードを作成してニックネームで参加
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function createBoardAndJoin(
    page: import('@playwright/test').Page,
    nickname: string = 'ファシリテーター'
) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('通常モードテスト');
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

// ヘルパー関数: 匿名モードで2ユーザーセットアップ
async function setupTwoUsersAnonymous(browser: import('@playwright/test').Browser) {
    const context1 = await browser.newContext();
    const facilitatorPage = await context1.newPage();

    await facilitatorPage.goto('/');
    await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('匿名マルチユーザーテスト');

    // 匿名モードをON
    await facilitatorPage.getByRole('switch', { name: '匿名モード' }).click();
    await expect(facilitatorPage.getByRole('switch', { name: '匿名モード' })).toHaveAttribute('aria-checked', 'true');

    await facilitatorPage.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(facilitatorPage).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

    const boardUrl = facilitatorPage.url();

    await facilitatorPage.getByPlaceholder('ニックネームを入力').fill('ファシリテーター');
    await facilitatorPage.locator('button[type="submit"]', { hasText: '参加' }).click();
    await expect(facilitatorPage.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

    const context2 = await browser.newContext();
    const memberPage = await context2.newPage();
    await memberPage.goto(boardUrl);

    await memberPage.getByPlaceholder('ニックネームを入力').fill('メンバー');
    await memberPage.locator('button[type="submit"]', { hasText: '参加' }).click();
    await expect(memberPage.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

    return { facilitatorPage, memberPage, boardUrl, context1, context2 };
}

// ヘルパー関数: 非匿名モードで2ユーザーセットアップ
async function setupTwoUsersNormal(browser: import('@playwright/test').Browser) {
    const context1 = await browser.newContext();
    const facilitatorPage = await context1.newPage();

    await facilitatorPage.goto('/');
    await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('通常マルチユーザーテスト');
    await facilitatorPage.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(facilitatorPage).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

    const boardUrl = facilitatorPage.url();

    await facilitatorPage.getByPlaceholder('ニックネームを入力').fill('ファシリテーター');
    await facilitatorPage.locator('button[type="submit"]', { hasText: '参加' }).click();
    await expect(facilitatorPage.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

    const context2 = await browser.newContext();
    const memberPage = await context2.newPage();
    await memberPage.goto(boardUrl);

    await memberPage.getByPlaceholder('ニックネームを入力').fill('メンバー');
    await memberPage.locator('button[type="submit"]', { hasText: '参加' }).click();
    await expect(memberPage.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

    return { facilitatorPage, memberPage, boardUrl, context1, context2 };
}

test.describe('匿名モード', () => {
    test('ホームページで匿名モードトグルを操作できる', async ({ page }) => {
        await page.goto('/');

        // 初期状態: 匿名モードがOFF
        const toggle = page.getByRole('switch', { name: '匿名モード' });
        await expect(toggle).toHaveAttribute('aria-checked', 'false');

        // クリックでON
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-checked', 'true');

        // 再クリックでOFF
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    test('匿名ボードでカード作成者名が「匿名」と表示される', async ({ browser }) => {
        const { facilitatorPage, memberPage, context1, context2 } = await setupTwoUsersAnonymous(browser);

        // ファシリテーターがカードを追加
        await facilitatorPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await facilitatorPage.getByPlaceholder('意見を入力').fill('匿名テストカード');
        await facilitatorPage.getByRole('button', { name: '追加', exact: true }).click();
        await expect(facilitatorPage.locator('p', { hasText: '匿名テストカード' })).toBeVisible();

        // メンバー側で同期を待つ
        await expect(memberPage.getByText('匿名テストカード')).toBeVisible({ timeout: 10000 });

        // メンバー側: カード作成者名が「匿名」と表示される
        const memberCard = memberPage.locator('.group', { hasText: '匿名テストカード' }).first();
        await expect(memberCard.locator('span.italic', { hasText: '匿名' })).toBeVisible();

        await context1.close();
        await context2.close();
    });

    test('匿名モードでは自分のカードでも「匿名」と表示される', async ({ page }) => {
        await createAnonymousBoardAndJoin(page, 'テストユーザー');
        await addCard(page, '自分のカード');

        // 匿名モードではWebSocket経由で配信されるため、自分のカードでも「匿名」表示
        const card = page.locator('.group', { hasText: '自分のカード' }).first();
        await expect(card.locator('span.italic', { hasText: '匿名' })).toBeVisible();
    });

    test('匿名モードインジケーターがボードヘッダーに表示される', async ({ page }) => {
        await createAnonymousBoardAndJoin(page);

        // ヘッダーに「匿名」バッジが表示される
        await expect(page.locator('span', { hasText: '匿名' }).first()).toBeVisible();
    });

    test('匿名モードがページリロード後も維持される', async ({ page }) => {
        await createAnonymousBoardAndJoin(page);

        // 匿名モードバッジが表示されることを確認
        await expect(page.locator('span', { hasText: '匿名' }).first()).toBeVisible();

        // ページをリロード
        await page.reload();

        // ニックネームモーダルが再表示されるので再参加
        await page.getByPlaceholder('ニックネームを入力').fill('ファシリテーター');
        await page.locator('button[type="submit"]', { hasText: '参加' }).click();
        await expect(page.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

        // リロード後も匿名モードバッジが表示される
        await expect(page.locator('span', { hasText: '匿名' }).first()).toBeVisible();
    });

    test('非匿名ボードではカード作成者名が通常表示される', async ({ browser }) => {
        const { facilitatorPage, memberPage, context1, context2 } = await setupTwoUsersNormal(browser);

        // ファシリテーターがカードを追加
        await facilitatorPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await facilitatorPage.getByPlaceholder('意見を入力').fill('通常モードカード');
        await facilitatorPage.getByRole('button', { name: '追加', exact: true }).click();
        await expect(facilitatorPage.locator('p', { hasText: '通常モードカード' })).toBeVisible();

        // メンバー側で同期を待つ
        await expect(memberPage.getByText('通常モードカード')).toBeVisible({ timeout: 10000 });

        // メンバー側: カード作成者名が「ファシリテーター」と表示される
        const memberCard = memberPage.locator('.group', { hasText: '通常モードカード' }).first();
        await expect(memberCard.getByText('ファシリテーター')).toBeVisible();

        // 「匿名」表示ではないことを確認
        await expect(memberCard.locator('span.italic', { hasText: '匿名' })).not.toBeVisible();

        // ヘッダーに「匿名モード」バッジが表示されないことを確認
        await expect(memberPage.getByText('匿名モード')).not.toBeVisible();

        await context1.close();
        await context2.close();
    });
});
