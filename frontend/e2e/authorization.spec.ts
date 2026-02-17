import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してファシリテーターとメンバーの2ブラウザをセットアップ
async function setupTwoUsers(browser: import('@playwright/test').Browser) {
    // ファシリテーターがボードを作成
    const context1 = await browser.newContext();
    const facilitatorPage = await context1.newPage();

    await facilitatorPage.goto('/');
    await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('権限テスト');
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

    return { facilitatorPage, memberPage, context1, context2 };
}

// ヘルパー関数: 指定フェーズまで段階的に遷移
async function advanceToPhase(page: import('@playwright/test').Page, targetPhase: string) {
    const steps = [
        { key: 'VOTING', button: '次へ: 投票', label: '投票' },
        { key: 'DISCUSSION', button: '次へ: 議論', label: '議論' },
        { key: 'ACTION_ITEMS', button: '次へ: アクション', label: 'アクション' },
        { key: 'CLOSED', button: '次へ: 完了', label: '完了' },
    ];

    for (const step of steps) {
        await page.locator('button', { hasText: step.button }).click();
        await page.locator('button', { hasText: `${step.label}へ進む` }).click();
        await expect(
            page.locator('.bg-indigo-600.text-white', { hasText: step.label }).first()
        ).toBeVisible({ timeout: 10000 });
        if (step.key === targetPhase) break;
    }
}

test.describe('フェーズ遷移の権限制限', () => {
    test('非ファシリテーターには「次へ」ボタンが表示されない', async ({ browser }) => {
        const { facilitatorPage, memberPage, context1, context2 } = await setupTwoUsers(browser);

        // ファシリテーター側: 「次へ」ボタンが表示される
        await expect(facilitatorPage.locator('button', { hasText: '次へ: 投票' })).toBeVisible();

        // メンバー側: 「次へ」ボタンが表示されない
        await expect(memberPage.locator('button', { hasText: '次へ' })).not.toBeVisible();

        await context1.close();
        await context2.close();
    });

    test('フェーズ遷移後も非ファシリテーターには「次へ」ボタンが表示されない', async ({ browser }) => {
        const { facilitatorPage, memberPage, context1, context2 } = await setupTwoUsers(browser);

        // ファシリテーターがVOTINGフェーズに遷移
        await facilitatorPage.locator('button', { hasText: '次へ: 投票' }).click();
        await facilitatorPage.locator('button', { hasText: '投票へ進む' }).click();
        await expect(
            facilitatorPage.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()
        ).toBeVisible({ timeout: 10000 });

        // メンバー側でフェーズ変更を待つ（WebSocket同期に余裕をもたせる）
        await expect(
            memberPage.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()
        ).toBeVisible({ timeout: 15000 });

        // メンバー側: フェーズは更新されているが「次へ」ボタンは非表示
        await expect(memberPage.locator('button', { hasText: '次へ' })).not.toBeVisible();

        // ファシリテーター側: 次のフェーズボタンが表示される
        await expect(facilitatorPage.locator('button', { hasText: '次へ: 議論' })).toBeVisible();

        await context1.close();
        await context2.close();
    });
});

test.describe('タイマーの権限制限', () => {
    test('非ファシリテーターにはタイマー操作ボタンが表示されない', async ({ browser }) => {
        const { facilitatorPage, memberPage, context1, context2 } = await setupTwoUsers(browser);

        // ファシリテーター側: タイマーの「開始」ボタンが表示される
        await expect(facilitatorPage.locator('button', { hasText: '開始' })).toBeVisible();

        // メンバー側: タイマーの「開始」ボタンが表示されない
        await expect(memberPage.locator('button', { hasText: '開始' })).not.toBeVisible();

        // メンバー側: タイマー表示（--:--）は見える（サイドバーとヘッダーの2箇所に表示される）
        await expect(memberPage.getByText('--:--').first()).toBeVisible();

        await context1.close();
        await context2.close();
    });

    test('タイマー実行中でも非ファシリテーターには操作ボタンが表示されない', async ({ browser }) => {
        const { facilitatorPage, memberPage, context1, context2 } = await setupTwoUsers(browser);

        // ファシリテーターがタイマーを開始
        await facilitatorPage.locator('button', { hasText: '開始' }).click();
        await facilitatorPage.locator('input[type="number"]').fill('1');
        await facilitatorPage.locator('button', { hasText: '開始' }).last().click();

        // タイマーが動作中であることを確認（00:XXの形式。サイドバーとヘッダーの2箇所に表示される）
        await expect(facilitatorPage.getByText(/\d{2}:\d{2}/).first()).toBeVisible({ timeout: 5000 });

        // メンバー側: タイマー時間は同期されて表示されるが、操作ボタンは非表示
        await expect(memberPage.getByText(/\d{2}:\d{2}/).first()).toBeVisible({ timeout: 10000 });
        await expect(memberPage.locator('button', { hasText: '一時停止' })).not.toBeVisible();
        await expect(memberPage.locator('button', { hasText: '開始' })).not.toBeVisible();

        await context1.close();
        await context2.close();
    });
});

test.describe('カード操作の権限制限', () => {
    test('WRITINGフェーズで他人のカードに編集・削除ボタンが表示されない', async ({ browser }) => {
        const { facilitatorPage, memberPage, context1, context2 } = await setupTwoUsers(browser);

        // メンバーがカードを追加
        await memberPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await memberPage.getByPlaceholder('意見を入力').fill('メンバーのカード');
        await memberPage.getByRole('button', { name: '追加', exact: true }).click();
        await expect(memberPage.locator('p', { hasText: 'メンバーのカード' })).toBeVisible();

        // ファシリテーター側でカードの同期を待つ
        await expect(facilitatorPage.getByText('メンバーのカード')).toBeVisible({ timeout: 10000 });

        // メンバー側: 自分のカードに編集・削除ボタンが表示される
        const memberCard = memberPage.locator('.group', { hasText: 'メンバーのカード' }).first();
        await memberCard.hover();
        await expect(memberCard.getByLabel('カードを編集')).toBeVisible();
        await expect(memberCard.getByLabel('カードを削除')).toBeVisible();

        // ファシリテーター側: 他人のカードには編集ボタンなし、削除ボタンはあり（ファシリテーター権限）
        const facilCard = facilitatorPage.locator('.group', { hasText: 'メンバーのカード' }).first();
        await facilCard.hover();
        await expect(facilCard.getByLabel('カードを編集')).not.toBeVisible();
        await expect(facilCard.getByLabel('カードを削除')).toBeVisible();

        await context1.close();
        await context2.close();
    });

    test('VOTINGフェーズではカード編集・削除ボタンが非表示になる', async ({ browser }) => {
        const { facilitatorPage, memberPage, context1, context2 } = await setupTwoUsers(browser);

        // ファシリテーターがカードを追加
        await facilitatorPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await facilitatorPage.getByPlaceholder('意見を入力').fill('投票フェーズカード');
        await facilitatorPage.getByRole('button', { name: '追加', exact: true }).click();
        await expect(facilitatorPage.locator('p', { hasText: '投票フェーズカード' })).toBeVisible();

        // VOTINGフェーズに遷移
        await advanceToPhase(facilitatorPage, 'VOTING');
        await expect(
            memberPage.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()
        ).toBeVisible({ timeout: 10000 });

        // ファシリテーター側: 自分のカードでも編集・削除ボタンが非表示
        const facilCard = facilitatorPage.locator('.group', { hasText: '投票フェーズカード' }).first();
        await facilCard.hover();
        await expect(facilCard.getByLabel('カードを編集')).not.toBeVisible();
        await expect(facilCard.getByLabel('カードを削除')).not.toBeVisible();

        await context1.close();
        await context2.close();
    });

    test('WRITINGフェーズで非ファシリテーターにはカード追加ボタンが表示される', async ({ browser }) => {
        const { memberPage, context1, context2 } = await setupTwoUsers(browser);

        // メンバー側: カード追加ボタンが表示される（WRITINGフェーズでは全員カード追加可能）
        await expect(memberPage.locator('button[title="カードを追加"]').first()).toBeVisible();

        await context1.close();
        await context2.close();
    });

    test('VOTINGフェーズで非ファシリテーターもカードに投票できる', async ({ browser }) => {
        const { facilitatorPage, memberPage, context1, context2 } = await setupTwoUsers(browser);

        // ファシリテーターがカードを追加
        await facilitatorPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await facilitatorPage.getByPlaceholder('意見を入力').fill('投票テストカード');
        await facilitatorPage.getByRole('button', { name: '追加', exact: true }).click();
        await expect(facilitatorPage.locator('p', { hasText: '投票テストカード' })).toBeVisible();

        // メンバー側で同期を待つ
        await expect(memberPage.getByText('投票テストカード')).toBeVisible({ timeout: 10000 });

        // VOTINGフェーズに遷移
        await advanceToPhase(facilitatorPage, 'VOTING');
        await expect(
            memberPage.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()
        ).toBeVisible({ timeout: 10000 });

        // メンバー側: 投票ボタンが表示されクリックできる
        const memberCard = memberPage.locator('.group', { hasText: '投票テストカード' }).first();
        const voteButton = memberCard.locator('[data-testid="vote-button"]');
        await expect(voteButton).toBeVisible();
        await voteButton.click();

        // 投票が反映される（カウントが1になる）
        await expect(voteButton).toContainText('1');

        await context1.close();
        await context2.close();
    });
});
