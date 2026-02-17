import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してニックネームで参加
async function createBoardAndJoin(page: import('@playwright/test').Page, nickname: string) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('カード編集削除テスト');
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

test.describe('カード編集機能', () => {
    test('自分のカードを編集できる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, '編集前の内容');

        // カードにホバーして編集ボタンをクリック
        const card = page.locator('.group', { hasText: '編集前の内容' });
        await card.hover();
        await card.locator('button[aria-label="カードを編集"]').click();

        // 編集フォームが表示される
        const textarea = page.locator('textarea');
        await expect(textarea).toBeVisible();

        // 内容を編集
        await textarea.fill('編集後の内容');
        await page.locator('button', { hasText: '保存' }).click();

        // 編集された内容が表示される
        await expect(page.getByText('編集後の内容')).toBeVisible();
        await expect(page.getByText('編集前の内容')).not.toBeVisible();
    });

    test('編集をESCキーでキャンセルできる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, 'キャンセルテスト');

        // 編集モードに入る
        const card = page.locator('.group', { hasText: 'キャンセルテスト' });
        await card.hover();
        await card.locator('button[aria-label="カードを編集"]').click();

        // 内容を変更してESCでキャンセル
        await page.locator('textarea').fill('変更された内容');
        await page.locator('textarea').press('Escape');

        // 元の内容が保持される
        await expect(page.getByText('キャンセルテスト')).toBeVisible();
        await expect(page.getByText('変更された内容')).not.toBeVisible();
    });

    test('編集をキャンセルボタンでキャンセルできる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, 'ボタンキャンセルテスト');

        // 編集モードに入る
        const card = page.locator('.group', { hasText: 'ボタンキャンセルテスト' });
        await card.hover();
        await card.locator('button[aria-label="カードを編集"]').click();

        // キャンセルボタンをクリック
        await page.locator('button', { hasText: 'キャンセル' }).click();

        // 元の内容が保持される
        await expect(page.getByText('ボタンキャンセルテスト')).toBeVisible();
    });

    test('Enterキーで編集を保存できる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, 'Enter保存テスト');

        // 編集モードに入る
        const card = page.locator('.group', { hasText: 'Enter保存テスト' });
        await card.hover();
        await card.locator('button[aria-label="カードを編集"]').click();

        // 内容を編集してEnterで保存
        await page.locator('textarea').fill('Enter保存後');
        await page.locator('textarea').press('Enter');

        // 編集された内容が表示される
        await expect(page.getByText('Enter保存後')).toBeVisible();
    });
});

test.describe('カード削除機能', () => {
    test('自分のカードを削除できる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, '削除対象カード');

        // カードにホバーして削除ボタンをクリック
        const card = page.locator('.group', { hasText: '削除対象カード' });
        await card.hover();
        await card.locator('button[aria-label="カードを削除"]').click();

        // カードが削除される
        await expect(page.getByText('削除対象カード')).not.toBeVisible();
    });

    test('ファシリテーターは他人のカードを削除できる', async ({ browser }) => {
        // ファシリテーターがボードを作成
        const context1 = await browser.newContext();
        const facilitatorPage = await context1.newPage();

        await facilitatorPage.goto('/');
        await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('ファシリテーター削除テスト');
        await facilitatorPage.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
        await expect(facilitatorPage).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

        const boardUrl = facilitatorPage.url();

        await facilitatorPage.getByPlaceholder('ニックネームを入力').fill('ファシリテーター');
        await facilitatorPage.locator('button[type="submit"]', { hasText: '参加' }).click();
        await expect(facilitatorPage.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

        // 別のユーザーが参加してカードを追加
        const context2 = await browser.newContext();
        const memberPage = await context2.newPage();
        await memberPage.goto(boardUrl);

        await memberPage.getByPlaceholder('ニックネームを入力').fill('メンバー');
        await memberPage.locator('button[type="submit"]', { hasText: '参加' }).click();
        await expect(memberPage.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

        // メンバーがカードを追加
        await memberPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await memberPage.getByPlaceholder('意見を入力').fill('メンバーのカード');
        await memberPage.getByRole('button', { name: '追加', exact: true }).click();
        await expect(memberPage.locator('p', { hasText: 'メンバーのカード' })).toBeVisible();

        // ファシリテーターのページでカードが表示されるのを待つ
        await expect(facilitatorPage.getByText('メンバーのカード')).toBeVisible({ timeout: 10000 });

        // ファシリテーターがメンバーのカードを削除
        const card = facilitatorPage.locator('.group', { hasText: 'メンバーのカード' });
        await card.hover();
        await card.locator('button[aria-label="カードを削除"]').click();

        // カードが削除される
        await expect(facilitatorPage.getByText('メンバーのカード')).not.toBeVisible();

        await context1.close();
        await context2.close();
    });
});

test.describe('投票フェーズでの編集・削除制限', () => {
    test('投票フェーズでは編集・削除ボタンが非表示', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, '投票フェーズテストカード');

        // WRITINGフェーズではボタンが表示される
        const card = page.locator('.group', { hasText: '投票フェーズテストカード' });
        await card.hover();
        await expect(card.locator('button[aria-label="カードを編集"]')).toBeVisible();

        // 投票フェーズに進める
        await page.locator('button', { hasText: '次へ: 投票' }).click();
        await page.locator('button', { hasText: '投票へ進む' }).click();
        await expect(page.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()).toBeVisible();

        // 投票フェーズでは編集・削除ボタンが非表示
        await card.hover();
        await expect(card.locator('button[aria-label="カードを編集"]')).not.toBeVisible();
        await expect(card.locator('button[aria-label="カードを削除"]')).not.toBeVisible();
    });
});
