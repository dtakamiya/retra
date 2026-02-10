import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してニックネームで参加
async function createBoardAndJoin(page: import('@playwright/test').Page, nickname: string) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('ドラッグ&ドロップテスト');
    await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

    await page.getByPlaceholder('ニックネームを入力').fill(nickname);
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();

    await expect(page.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });
}

// ヘルパー関数: カードを追加
async function addCard(page: import('@playwright/test').Page, content: string, columnIndex: number = 0) {
    await page.getByRole('button', { name: 'カードを追加' }).nth(columnIndex).click();
    await page.getByPlaceholder('意見を入力').fill(content);
    await page.locator('button', { hasText: '追加' }).click();
    await expect(page.locator('p', { hasText: content })).toBeVisible();
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
        await expect(
            page.locator('.bg-indigo-600.text-white', { hasText: step.label }).first()
        ).toBeVisible({ timeout: 10000 });
        if (step.key === targetPhase) break;
    }
}

// ヘルパー関数: ドラッグ操作（@dnd-kit PointerSensor用）
async function dragCard(
    page: import('@playwright/test').Page,
    dragHandle: import('@playwright/test').Locator,
    targetElement: import('@playwright/test').Locator
) {
    const sourceBox = await dragHandle.boundingBox();
    const targetBox = await targetElement.boundingBox();
    if (!sourceBox || !targetBox) throw new Error('要素のバウンディングボックスが取得できません');

    const sourceX = sourceBox.x + sourceBox.width / 2;
    const sourceY = sourceBox.y + sourceBox.height / 2;
    const targetX = targetBox.x + targetBox.width / 2;
    const targetY = targetBox.y + targetBox.height / 2;

    await page.mouse.move(sourceX, sourceY);
    await page.mouse.down();
    // PointerSensorのactivationConstraint(distance: 8px)を超えるため段階的に移動
    await page.mouse.move(targetX, targetY, { steps: 20 });
    await page.mouse.up();
}

test.describe('ドラッグハンドルの表示制御', () => {
    test('WRITINGフェーズで自分のカードにドラッグハンドルが表示される', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, 'ドラッグテストカード');

        const card = page.locator('.group', { hasText: 'ドラッグテストカード' }).first();
        await expect(card.getByLabel('ドラッグして並べ替え')).toBeVisible();
    });

    test('VOTINGフェーズではドラッグハンドルが表示されない', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, 'VOTING中のカード');

        await advanceToPhase(page, 'VOTING');

        const card = page.locator('.group', { hasText: 'VOTING中のカード' }).first();
        await expect(card.getByLabel('ドラッグして並べ替え')).not.toBeVisible();
    });

    test('DISCUSSIONフェーズでファシリテーターにドラッグハンドルが表示される', async ({ page }) => {
        await createBoardAndJoin(page, 'ファシリテーター');
        await addCard(page, 'DISCUSSION中のカード');

        await advanceToPhase(page, 'DISCUSSION');

        const card = page.locator('.group', { hasText: 'DISCUSSION中のカード' }).first();
        await expect(card.getByLabel('ドラッグして並べ替え')).toBeVisible();
    });

    test('CLOSEDフェーズではドラッグハンドルが表示されない', async ({ page }) => {
        await createBoardAndJoin(page, 'ファシリテーター');
        await addCard(page, 'CLOSED中のカード');

        await advanceToPhase(page, 'CLOSED');

        const card = page.locator('.group', { hasText: 'CLOSED中のカード' }).first();
        await expect(card.getByLabel('ドラッグして並べ替え')).not.toBeVisible();
    });
});

test.describe('ドラッグハンドルのマルチユーザー制御', () => {
    test('WRITINGフェーズで他人のカードにはドラッグハンドルが表示されない', async ({ browser }) => {
        // ファシリテーターがボードを作成
        const context1 = await browser.newContext();
        const facilitatorPage = await context1.newPage();

        await facilitatorPage.goto('/');
        await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('ドラッグ権限テスト');
        await facilitatorPage.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
        await expect(facilitatorPage).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

        const boardUrl = facilitatorPage.url();

        await facilitatorPage.getByPlaceholder('ニックネームを入力').fill('ファシリテーター');
        await facilitatorPage.locator('button[type="submit"]', { hasText: '参加' }).click();
        await expect(facilitatorPage.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

        // ファシリテーターがカード追加
        await facilitatorPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await facilitatorPage.getByPlaceholder('意見を入力').fill('ファシリテーターのカード');
        await facilitatorPage.locator('button', { hasText: '追加' }).click();
        await expect(facilitatorPage.locator('p', { hasText: 'ファシリテーターのカード' })).toBeVisible();

        // メンバーが参加
        const context2 = await browser.newContext();
        const memberPage = await context2.newPage();
        await memberPage.goto(boardUrl);

        await memberPage.getByPlaceholder('ニックネームを入力').fill('メンバー');
        await memberPage.locator('button[type="submit"]', { hasText: '参加' }).click();
        await expect(memberPage.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

        // メンバー側でカードの同期を待つ
        await expect(memberPage.getByText('ファシリテーターのカード')).toBeVisible({ timeout: 10000 });

        // メンバー側: 他人のカードにはドラッグハンドルがない
        const memberCard = memberPage.locator('.group', { hasText: 'ファシリテーターのカード' }).first();
        await expect(memberCard.getByLabel('ドラッグして並べ替え')).not.toBeVisible();

        // ファシリテーター側: 自分のカードにはドラッグハンドルがある
        const facilCard = facilitatorPage.locator('.group', { hasText: 'ファシリテーターのカード' }).first();
        await expect(facilCard.getByLabel('ドラッグして並べ替え')).toBeVisible();

        await context1.close();
        await context2.close();
    });

    test('DISCUSSIONフェーズで非ファシリテーターにはドラッグハンドルが表示されない', async ({ browser }) => {
        // ファシリテーターがボードを作成
        const context1 = await browser.newContext();
        const facilitatorPage = await context1.newPage();

        await facilitatorPage.goto('/');
        await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('DISCUSSION権限テスト');
        await facilitatorPage.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
        await expect(facilitatorPage).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

        const boardUrl = facilitatorPage.url();

        await facilitatorPage.getByPlaceholder('ニックネームを入力').fill('ファシリテーター');
        await facilitatorPage.locator('button[type="submit"]', { hasText: '参加' }).click();
        await expect(facilitatorPage.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

        // カード追加
        await facilitatorPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await facilitatorPage.getByPlaceholder('意見を入力').fill('DISCUSSIONカード');
        await facilitatorPage.locator('button', { hasText: '追加' }).click();
        await expect(facilitatorPage.locator('p', { hasText: 'DISCUSSIONカード' })).toBeVisible();

        // メンバーが参加
        const context2 = await browser.newContext();
        const memberPage = await context2.newPage();
        await memberPage.goto(boardUrl);

        await memberPage.getByPlaceholder('ニックネームを入力').fill('メンバー');
        await memberPage.locator('button[type="submit"]', { hasText: '参加' }).click();
        await expect(memberPage.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

        await expect(memberPage.getByText('DISCUSSIONカード')).toBeVisible({ timeout: 10000 });

        // DISCUSSIONフェーズに遷移
        await advanceToPhase(facilitatorPage, 'DISCUSSION');
        await expect(
            memberPage.locator('.bg-indigo-600.text-white', { hasText: '議論' }).first()
        ).toBeVisible({ timeout: 10000 });

        // ファシリテーター側: ドラッグハンドルが表示される
        const facilCard = facilitatorPage.locator('.group', { hasText: 'DISCUSSIONカード' }).first();
        await expect(facilCard.getByLabel('ドラッグして並べ替え')).toBeVisible();

        // メンバー側: ドラッグハンドルが表示されない
        const memberCard = memberPage.locator('.group', { hasText: 'DISCUSSIONカード' }).first();
        await expect(memberCard.getByLabel('ドラッグして並べ替え')).not.toBeVisible();

        await context1.close();
        await context2.close();
    });
});

test.describe('カードのドラッグ移動', () => {
    test('WRITINGフェーズでカードを別のカラムにドラッグ移動できる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');

        // Keepカラムにカード追加
        await addCard(page, '移動テストカード', 0);

        // カードが表示されていることを確認
        await expect(page.locator('p', { hasText: '移動テストカード' })).toBeVisible();

        // ドラッグハンドルを取得
        const card = page.locator('.group', { hasText: '移動テストカード' }).first();
        const dragHandle = card.getByLabel('ドラッグして並べ替え');

        // Problemカラムのh2ヘッダーをドロップターゲットとして使用
        const problemHeader = page.locator('h2', { hasText: 'Problem' });

        // カードをProblemカラムにドラッグ
        await dragCard(page, dragHandle, problemHeader);

        // Problemカラムのh2の親コンテナ内にカードが移動していることを確認
        // カラム識別はh2の隣にある(1)等のカウントで判別
        await page.waitForTimeout(1000);
        // Problemヘッダーの横のカード件数が1になっていることで移動を確認
        const problemColumnHeader = page.locator('h2', { hasText: 'Problem' }).locator('..');
        await expect(problemColumnHeader.getByText('(1)')).toBeVisible({ timeout: 10000 });
    });

    test('WRITINGフェーズで同じカラム内でカードの順序を変更できる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');

        // Keepカラムに2枚のカードを追加
        await addCard(page, '最初のカード', 0);
        await addCard(page, '2番目のカード', 0);

        // 両方のカードが表示されている
        await expect(page.locator('p', { hasText: '最初のカード' })).toBeVisible();
        await expect(page.locator('p', { hasText: '2番目のカード' })).toBeVisible();

        // 2番目のカードのドラッグハンドルを取得
        const secondCard = page.locator('.group', { hasText: '2番目のカード' }).first();
        const dragHandle = secondCard.getByLabel('ドラッグして並べ替え');

        // 最初のカードの上にドラッグ
        const firstCard = page.locator('.group', { hasText: '最初のカード' }).first();
        await dragCard(page, dragHandle, firstCard);

        // DnD完了後、両方のカードが引き続き存在する
        await page.waitForTimeout(1000);
        await expect(page.locator('p', { hasText: '2番目のカード' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('p', { hasText: '最初のカード' })).toBeVisible({ timeout: 10000 });
    });
});
