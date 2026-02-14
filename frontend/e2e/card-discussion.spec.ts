import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してニックネームで参加
async function createBoardAndJoin(
    page: import('@playwright/test').Page,
    nickname: string = 'ファシリテーター'
) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('議論マークテスト');
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
    await page.locator('button', { hasText: '追加' }).click();
    await expect(page.locator('p', { hasText: content })).toBeVisible();
}

// ヘルパー関数: 指定フェーズまで段階的に遷移（WRITINGから開始前提）
async function advanceToPhase(page: import('@playwright/test').Page, targetPhase: string) {
    const steps = [
        { key: 'VOTING', button: '次へ: 投票', label: '投票' },
        { key: 'DISCUSSION', button: '次へ: 議論', label: '議論' },
        { key: 'ACTION_ITEMS', button: '次へ: アクション', label: 'アクション' },
        { key: 'CLOSED', button: '次へ: 完了', label: '完了' },
    ];

    for (const step of steps) {
        await page.locator('button', { hasText: step.button }).click();
        await expect(
            page.locator('.bg-indigo-600.text-white', { hasText: step.label }).first()
        ).toBeVisible({ timeout: 10000 });
        if (step.key === targetPhase) break;
    }
}

// ヘルパー関数: ファシリテーターとメンバーの2ブラウザをセットアップ
async function setupTwoUsers(browser: import('@playwright/test').Browser) {
    const context1 = await browser.newContext();
    const facilitatorPage = await context1.newPage();

    await facilitatorPage.goto('/');
    await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('議論マーク権限テスト');
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

    return { facilitatorPage, memberPage, context1, context2 };
}

test.describe('カード議論済みマーク', () => {
    test('ファシリテーターがDISCUSSIONフェーズでカードを議論済みにマークできる', async ({ page }) => {
        await createBoardAndJoin(page);
        await addCard(page, '議論マークテストカード');
        await advanceToPhase(page, 'DISCUSSION');

        // 議論マークボタンが表示される
        const card = page.locator('.group', { hasText: '議論マークテストカード' }).first();
        const markButton = card.locator('button[aria-label="議論済みにマーク"]');
        await expect(markButton).toBeVisible();

        // マークをクリック
        await markButton.click();

        // カードに opacity-50 が適用される
        await expect(card).toHaveClass(/opacity-50/, { timeout: 5000 });

        // ボタンラベルが「未議論に戻す」に変わる
        await expect(card.locator('button[aria-label="未議論に戻す"]')).toBeVisible();
    });

    test('議論済みカードが列の下部にソートされる', async ({ page }) => {
        await createBoardAndJoin(page);
        await addCard(page, 'カードA');
        await addCard(page, 'カードB');
        await advanceToPhase(page, 'DISCUSSION');

        // カードAを議論済みにマーク
        const cardA = page.locator('.group', { hasText: 'カードA' }).first();
        await cardA.locator('button[aria-label="議論済みにマーク"]').click();
        await expect(cardA).toHaveClass(/opacity-50/, { timeout: 5000 });

        // カードBが上（未議論）、カードAが下（議論済み）にソートされることを確認
        // カラムはh2 "Keep"を含む最初のflex-1コンテナ
        const column = page.locator('div.flex-1', { has: page.locator('h2', { hasText: 'Keep' }) }).first();
        const cards = column.locator('.group');
        await expect(cards.nth(0)).toContainText('カードB');
        await expect(cards.nth(1)).toContainText('カードA');
    });

    test('議論済みマークをトグルオフして元に戻せる', async ({ page }) => {
        await createBoardAndJoin(page);
        await addCard(page, 'トグルテストカード');
        await advanceToPhase(page, 'DISCUSSION');

        const card = page.locator('.group', { hasText: 'トグルテストカード' }).first();

        // マーク
        await card.locator('button[aria-label="議論済みにマーク"]').click();
        await expect(card).toHaveClass(/opacity-50/, { timeout: 5000 });

        // アンマーク
        await card.locator('button[aria-label="未議論に戻す"]').click();
        await expect(card).not.toHaveClass(/opacity-50/, { timeout: 5000 });

        // ボタンラベルが元に戻る
        await expect(card.locator('button[aria-label="議論済みにマーク"]')).toBeVisible();
    });

    test('非ファシリテーターには議論マークボタンがdisabled', async ({ browser }) => {
        const { facilitatorPage, memberPage, context1, context2 } = await setupTwoUsers(browser);

        // ファシリテーターがカードを追加
        await facilitatorPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await facilitatorPage.getByPlaceholder('意見を入力').fill('権限テストカード');
        await facilitatorPage.locator('button', { hasText: '追加' }).click();
        await expect(facilitatorPage.locator('p', { hasText: '権限テストカード' })).toBeVisible();

        // メンバー側で同期を待つ
        await expect(memberPage.getByText('権限テストカード')).toBeVisible({ timeout: 10000 });

        // DISCUSSIONフェーズに遷移
        await advanceToPhase(facilitatorPage, 'DISCUSSION');
        await expect(
            memberPage.locator('.bg-indigo-600.text-white', { hasText: '議論' }).first()
        ).toBeVisible({ timeout: 10000 });

        // メンバー側: 議論マークボタンがdisabled
        const memberCard = memberPage.locator('.group', { hasText: '権限テストカード' }).first();
        const markButton = memberCard.locator('button[aria-label="議論済みにマーク"]');
        await expect(markButton).toBeVisible();
        await expect(markButton).toBeDisabled();

        await context1.close();
        await context2.close();
    });

    test('WRITING/VOTINGフェーズではCheckCircleボタンが表示されない', async ({ page }) => {
        await createBoardAndJoin(page);
        await addCard(page, 'フェーズテストカード');

        // WRITINGフェーズ: 議論マークボタンが非表示
        const card = page.locator('.group', { hasText: 'フェーズテストカード' }).first();
        await expect(card.locator('button[aria-label="議論済みにマーク"]')).not.toBeVisible();

        // VOTINGフェーズに遷移
        await advanceToPhase(page, 'VOTING');

        // VOTINGフェーズ: 議論マークボタンが非表示
        await expect(card.locator('button[aria-label="議論済みにマーク"]')).not.toBeVisible();
    });

    test('ACTION_ITEMSフェーズでも議論マークが動作する', async ({ page }) => {
        await createBoardAndJoin(page);
        await addCard(page, 'アクションフェーズカード');
        await advanceToPhase(page, 'ACTION_ITEMS');

        // ACTION_ITEMSフェーズでもマークボタンが表示される
        const card = page.locator('.group', { hasText: 'アクションフェーズカード' }).first();
        const markButton = card.locator('button[aria-label="議論済みにマーク"]');
        await expect(markButton).toBeVisible();

        // マークをクリック
        await markButton.click();
        await expect(card).toHaveClass(/opacity-50/, { timeout: 5000 });
    });

    test('議論マークがリアルタイムに他の参加者に同期される', async ({ browser }) => {
        const { facilitatorPage, memberPage, context1, context2 } = await setupTwoUsers(browser);

        // ファシリテーターがカードを追加
        await facilitatorPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await facilitatorPage.getByPlaceholder('意見を入力').fill('同期テストカード');
        await facilitatorPage.locator('button', { hasText: '追加' }).click();
        await expect(facilitatorPage.locator('p', { hasText: '同期テストカード' })).toBeVisible();

        // メンバー側で同期を待つ
        await expect(memberPage.getByText('同期テストカード')).toBeVisible({ timeout: 10000 });

        // DISCUSSIONフェーズに遷移
        await advanceToPhase(facilitatorPage, 'DISCUSSION');
        await expect(
            memberPage.locator('.bg-indigo-600.text-white', { hasText: '議論' }).first()
        ).toBeVisible({ timeout: 10000 });

        // ファシリテーターが議論済みにマーク
        const facilCard = facilitatorPage.locator('.group', { hasText: '同期テストカード' }).first();
        await facilCard.locator('button[aria-label="議論済みにマーク"]').click();
        await expect(facilCard).toHaveClass(/opacity-50/, { timeout: 5000 });

        // メンバー側でもopacity-50が適用されることを確認
        const memberCard = memberPage.locator('.group', { hasText: '同期テストカード' }).first();
        await expect(memberCard).toHaveClass(/opacity-50/, { timeout: 10000 });

        await context1.close();
        await context2.close();
    });
});
