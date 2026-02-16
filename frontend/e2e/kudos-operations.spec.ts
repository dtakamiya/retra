import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してニックネームで参加
async function createBoardAndJoin(page: import('@playwright/test').Page, nickname: string) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('Kudos操作テスト');
    await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

    await page.getByPlaceholder('ニックネームを入力').fill(nickname);
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();

    await expect(page.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });
}

test.describe.serial('Kudos操作', () => {
    test('Kudosパネルを開閉できる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');

        // Kudosボタンをクリックしてパネルを開く
        await page.getByRole('button', { name: /Kudos/ }).click();

        // Kudosパネルが表示される（「まだKudosがありません」が表示される）
        await expect(page.getByText('まだKudosがありません')).toBeVisible();

        // 閉じるボタンをクリック
        await page.getByLabel('パネルを閉じる').click();

        // パネルが閉じる
        await expect(page.getByText('まだKudosがありません')).not.toBeVisible();
    });
});

test.describe.serial('Kudos送信・削除のリアルタイム同期', () => {
    test('Kudosを送信してリアルタイムに同期される', async ({ browser }) => {
        // ファシリテーターがボードを作成
        const context1 = await browser.newContext();
        const facilitatorPage = await context1.newPage();

        await facilitatorPage.goto('/');
        await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('Kudos同期テスト');
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

        // 参加者リストの同期を待つ
        await expect(facilitatorPage.getByText('メンバー')).toBeVisible({ timeout: 10000 });

        // ファシリテーターがKudosパネルを開く
        await facilitatorPage.getByRole('button', { name: /Kudos/ }).click();
        await expect(facilitatorPage.getByText('まだKudosがありません')).toBeVisible();

        // Kudosを送るボタンをクリック
        await facilitatorPage.getByRole('button', { name: 'Kudosを送る' }).click();

        // フォームが表示されるのを待つ
        await expect(facilitatorPage.getByLabel('送信先')).toBeVisible();

        // メンバーを選択
        await facilitatorPage.getByLabel('送信先').selectOption('メンバー');

        // メッセージを入力
        await facilitatorPage.getByPlaceholder('メッセージ(任意)').fill('素晴らしいサポートをありがとう！');

        // 送信
        await facilitatorPage.getByRole('button', { name: '送信' }).click();

        // 送信後、パネルが閉じるので再度開く
        await expect(facilitatorPage.getByText('素晴らしいサポートをありがとう！')).toBeVisible();

        // ファシリテーター側で送信したKudosが表示される（送信者 → 受信者の形式）
        await expect(facilitatorPage.getByText('ファシリテーター → メンバー', { exact: false })).toBeVisible();

        // メンバー側でKudosパネルを開く
        await memberPage.getByRole('button', { name: /Kudos/ }).click();

        // メンバー側でもKudosが同期される
        await expect(memberPage.getByText('素晴らしいサポートをありがとう！')).toBeVisible({ timeout: 10000 });
        await expect(memberPage.getByText('ファシリテーター → メンバー', { exact: false })).toBeVisible();

        await context1.close();
        await context2.close();
    });

    test('自分が送ったKudosを削除できる', async ({ browser }) => {
        // ファシリテーターがボードを作成
        const context1 = await browser.newContext();
        const facilitatorPage = await context1.newPage();

        await facilitatorPage.goto('/');
        await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('Kudos削除テスト');
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

        // 参加者リストの同期を待つ
        await expect(facilitatorPage.getByText('メンバー')).toBeVisible({ timeout: 10000 });

        // ファシリテーターがKudosを送信
        await facilitatorPage.getByRole('button', { name: /Kudos/ }).click();
        await facilitatorPage.getByRole('button', { name: 'Kudosを送る' }).click();
        await expect(facilitatorPage.getByLabel('送信先')).toBeVisible();
        await facilitatorPage.getByLabel('送信先').selectOption('メンバー');
        await facilitatorPage.getByPlaceholder('メッセージ(任意)').fill('削除テストKudos');
        await facilitatorPage.getByRole('button', { name: '送信' }).click();

        // 送信後パネルが閉じるので、Kudosが表示されることを確認
        await expect(facilitatorPage.getByText('削除テストKudos')).toBeVisible();

        // メンバー側でもKudosパネルを開いて確認
        await memberPage.getByRole('button', { name: /Kudos/ }).click();
        await expect(memberPage.getByText('削除テストKudos')).toBeVisible({ timeout: 10000 });

        // ファシリテーターがKudosを削除（削除ボタンは自分のKudosにのみ表示される）
        const kudosCard = facilitatorPage.locator('.bg-white.dark\\:bg-slate-800.rounded-lg', { hasText: '削除テストKudos' });
        await kudosCard.getByLabel('Kudosを削除').click();

        // ファシリテーター側でKudosが消える
        await expect(facilitatorPage.getByText('削除テストKudos')).not.toBeVisible();

        // メンバー側でもKudosが消える（リアルタイム同期）
        await expect(memberPage.getByText('削除テストKudos')).not.toBeVisible({ timeout: 10000 });

        await context1.close();
        await context2.close();
    });
});
