import { test, expect } from '@playwright/test';

// ヘルパー関数: プライベート記述モードでボードを作成してニックネームで参加
async function createPrivateBoardAndJoin(
    page: import('@playwright/test').Page,
    nickname: string = 'ファシリテーター'
) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('ブラインドモードE2Eテスト');

    // プライベート記述モードをON
    const privateSwitch = page.locator('div[role="switch"][aria-label="プライベート記述モード"]');
    await privateSwitch.click();
    await expect(privateSwitch).toHaveAttribute('aria-checked', 'true');

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

// ヘルパー関数: プライベートモードで2ユーザーセットアップ
async function setupTwoUsersPrivate(browser: import('@playwright/test').Browser) {
    const context1 = await browser.newContext();
    const facilitatorPage = await context1.newPage();

    await facilitatorPage.goto('/');
    await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('ブラインドマルチE2Eテスト');

    // プライベート記述モードをON
    const privateSwitch = facilitatorPage.locator('div[role="switch"][aria-label="プライベート記述モード"]');
    await privateSwitch.click();
    await expect(privateSwitch).toHaveAttribute('aria-checked', 'true');

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

test.describe('プライベート記述モード', () => {
    test('ホームページでプライベート記述モードトグルを操作できる', async ({ page }) => {
        await page.goto('/');

        const privateSwitch = page.locator('div[role="switch"][aria-label="プライベート記述モード"]');
        // 初期状態: OFF
        await expect(privateSwitch).toHaveAttribute('aria-checked', 'false');

        // クリックでON
        await privateSwitch.click();
        await expect(privateSwitch).toHaveAttribute('aria-checked', 'true');

        // 再クリックでOFF
        await privateSwitch.click();
        await expect(privateSwitch).toHaveAttribute('aria-checked', 'false');
    });

    test('プライベートモードインジケーターがボードヘッダーに表示される', async ({ page }) => {
        await createPrivateBoardAndJoin(page);

        // ヘッダーに「プライベート」バッジが表示される
        await expect(page.getByText('プライベート')).toBeVisible();
    });

    test('自分のカードは自分に表示される', async ({ page }) => {
        await createPrivateBoardAndJoin(page);
        await addCard(page, '自分のプライベートカード');

        // 自分のカードは表示されている
        await expect(page.locator('p', { hasText: '自分のプライベートカード' })).toBeVisible();
    });

    test('WRITINGフェーズ中は他のユーザーのカード内容が見えない', async ({ browser }) => {
        const { facilitatorPage, memberPage, context1, context2 } = await setupTwoUsersPrivate(browser);

        // ファシリテーターがカードを追加
        await addCard(facilitatorPage, '秘密のカード内容');

        // メンバー側にカード内容が表示されないことを確認（少し待ってから）
        await memberPage.waitForTimeout(2000);
        await expect(memberPage.locator('p', { hasText: '秘密のカード内容' })).not.toBeVisible();

        // メンバー側で「非表示」バッジが表示されることを確認
        await expect(memberPage.getByText(/\d+件非表示/)).toBeVisible({ timeout: 5000 });

        await context1.close();
        await context2.close();
    });

    test('投票フェーズに遷移するとカードが一斉公開される', async ({ browser }) => {
        const { facilitatorPage, memberPage, context1, context2 } = await setupTwoUsersPrivate(browser);

        // ファシリテーターがカードを追加
        await addCard(facilitatorPage, '公開されるカード');

        // メンバーもカードを追加
        await addCard(memberPage, 'メンバーのカード');

        // この時点ではお互いのカードが見えない
        await facilitatorPage.waitForTimeout(2000);
        await expect(memberPage.locator('p', { hasText: '公開されるカード' })).not.toBeVisible();
        await expect(facilitatorPage.locator('p', { hasText: 'メンバーのカード' })).not.toBeVisible();

        // ファシリテーターが投票フェーズに遷移（確認ダイアログを承認）
        await facilitatorPage.locator('button', { hasText: '次へ: 投票' }).click();
        await facilitatorPage.locator('button', { hasText: '投票へ進む' }).click();

        // メンバー側でフェーズ遷移を待つ（ガイダンスメッセージで確認）
        await expect(memberPage.getByText('カードに投票しましょう'))
            .toBeVisible({ timeout: 15000 });

        // メンバー側でファシリテーターのカードが見えるようになる
        await expect(memberPage.locator('p', { hasText: '公開されるカード' })).toBeVisible({ timeout: 10000 });

        // ファシリテーター側でもメンバーのカードが見えるようになる
        await expect(facilitatorPage.locator('p', { hasText: 'メンバーのカード' })).toBeVisible({ timeout: 10000 });

        // 非表示バッジが消えていることを確認
        await expect(memberPage.getByText(/\d+件非表示/)).not.toBeVisible();
        await expect(facilitatorPage.getByText(/\d+件非表示/)).not.toBeVisible();

        await context1.close();
        await context2.close();
    });

    test('プライベートモードがページリロード後も維持される', async ({ page }) => {
        await createPrivateBoardAndJoin(page);

        // プライベートバッジが表示されることを確認
        await expect(page.getByText('プライベート')).toBeVisible();

        // ページをリロード
        await page.reload();

        // セッションが保持されている場合はそのまま、されていない場合は再参加
        const nicknameInput = page.getByPlaceholder('ニックネームを入力');
        const isNicknameVisible = await nicknameInput.isVisible({ timeout: 3000 }).catch(() => false);
        if (isNicknameVisible) {
            await nicknameInput.fill('ファシリテーター');
            await page.locator('button[type="submit"]', { hasText: '参加' }).click();
        }
        await expect(page.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

        // リロード後もプライベートバッジが表示される
        await expect(page.getByText('プライベート')).toBeVisible();
    });

    test('WRITINGフェーズ中にカードを削除すると非表示カウントが減る', async ({ browser }) => {
        const { facilitatorPage, memberPage, context1, context2 } = await setupTwoUsersPrivate(browser);

        // ファシリテーターがカードを2枚追加
        await addCard(facilitatorPage, '削除対象カード');
        await addCard(facilitatorPage, '残るカード');

        // メンバー側で非表示バッジを確認
        await expect(memberPage.getByText('2件非表示')).toBeVisible({ timeout: 5000 });

        // ファシリテーターが1枚削除
        const card = facilitatorPage.locator('.group', { hasText: '削除対象カード' }).first();
        await card.hover();
        await card.getByLabel('カードを削除').click();

        // メンバー側で非表示カウントが1に減ることを確認
        await expect(memberPage.getByText('1件非表示')).toBeVisible({ timeout: 5000 });

        await context1.close();
        await context2.close();
    });
});
