import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してニックネームで参加
async function createBoardAndJoin(page: import('@playwright/test').Page, nickname: string) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('メモ操作テスト');
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
    // カード本文(p要素)が表示されることを確認（textareaにもテキストが残る場合があるため）
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

// ヘルパー関数: カードのメモトグルをクリックしてメモ一覧を展開
async function openMemos(page: import('@playwright/test').Page, cardContent: string) {
    const card = page.locator('.group', { hasText: cardContent }).first();
    await card.getByRole('button', { name: 'メモを表示' }).click();
}

// ヘルパー関数: メモを追加
async function addMemo(page: import('@playwright/test').Page, cardContent: string, memoContent: string) {
    const card = page.locator('.group', { hasText: cardContent }).first();
    await card.getByPlaceholder('メモを追加...').fill(memoContent);
    await card.getByRole('button', { name: 'メモを送信' }).click();
    await expect(page.getByText(memoContent)).toBeVisible();
}

// ヘルパー関数: カード内のメモアイテムを取得（.bg-gray-50がページルートにもマッチするため、カードスコープ内で検索）
function getMemoItem(cardLocator: import('@playwright/test').Locator, memoContent: string) {
    return cardLocator.locator('.rounded.p-2', { hasText: memoContent });
}

// ヘルパー関数: ボード作成→カード追加→DISCUSSIONフェーズ遷移→メモ展開まで一括
async function setupDiscussionPhaseWithCard(page: import('@playwright/test').Page, nickname: string) {
    await createBoardAndJoin(page, nickname);
    await addCard(page, 'メモテスト用カード');
    await advanceToPhase(page, 'DISCUSSION');
    await openMemos(page, 'メモテスト用カード');
}

test.describe('メモCRUD操作', () => {
    test('DISCUSSIONフェーズでメモを作成できる', async ({ page }) => {
        await setupDiscussionPhaseWithCard(page, 'テストユーザー');

        // メモを追加
        await addMemo(page, 'メモテスト用カード', 'テストメモの内容');

        // 内容が表示される
        await expect(page.getByText('テストメモの内容')).toBeVisible();

        // 著者名がメモ内に表示される
        const card = page.locator('.group', { hasText: 'メモテスト用カード' }).first();
        const memoItem = getMemoItem(card, 'テストメモの内容');
        await expect(memoItem.getByText('テストユーザー')).toBeVisible();

        // フォームがリセットされる
        await expect(card.getByPlaceholder('メモを追加...')).toHaveValue('');
    });

    test('自分のメモを編集できる', async ({ page }) => {
        await setupDiscussionPhaseWithCard(page, 'テストユーザー');
        await addMemo(page, 'メモテスト用カード', '編集前メモ');

        const card = page.locator('.group', { hasText: 'メモテスト用カード' }).first();
        const memoItem = getMemoItem(card, '編集前メモ');

        // メモにホバーして編集ボタンをクリック
        await memoItem.hover();
        await memoItem.locator('button[aria-label="メモを編集"]').click();

        // 編集用textareaが表示される（autoFocus付き）
        // 編集後はhasTextフィルタがマッチしなくなるため、カードスコープで操作する
        const editTextarea = card.locator('textarea:not([placeholder])');
        await expect(editTextarea).toBeVisible();
        await editTextarea.fill('編集後メモ');
        await card.locator('button[aria-label="保存"]').click();

        // 更新された内容が表示される
        await expect(page.getByText('編集後メモ')).toBeVisible();
        await expect(page.getByText('編集前メモ')).not.toBeVisible();
    });

    test('自分のメモを削除できる', async ({ page }) => {
        await setupDiscussionPhaseWithCard(page, 'テストユーザー');
        await addMemo(page, 'メモテスト用カード', '削除対象メモ');

        const card = page.locator('.group', { hasText: 'メモテスト用カード' }).first();
        const memoItem = getMemoItem(card, '削除対象メモ');

        // メモにホバーして削除ボタンをクリック
        await memoItem.hover();
        await memoItem.locator('button[aria-label="メモを削除"]').click();

        // メモが削除される
        await expect(page.getByText('削除対象メモ')).not.toBeVisible();
    });
});

test.describe('メモフォームの動作', () => {
    test('空のメモは送信できない', async ({ page }) => {
        await setupDiscussionPhaseWithCard(page, 'テストユーザー');

        const card = page.locator('.group', { hasText: 'メモテスト用カード' }).first();

        // 初期状態で送信ボタンがdisabled
        await expect(card.getByRole('button', { name: 'メモを送信' })).toBeDisabled();

        // 空白のみ入力でもdisabled
        await card.getByPlaceholder('メモを追加...').fill('   ');
        await expect(card.getByRole('button', { name: 'メモを送信' })).toBeDisabled();
    });

    test('Enterキーでメモを送信できる', async ({ page }) => {
        await setupDiscussionPhaseWithCard(page, 'テストユーザー');

        const card = page.locator('.group', { hasText: 'メモテスト用カード' }).first();
        await card.getByPlaceholder('メモを追加...').fill('Enterで送信メモ');
        await card.getByPlaceholder('メモを追加...').press('Enter');

        // メモが表示される
        await expect(page.getByText('Enterで送信メモ')).toBeVisible();
    });

    test('編集モードでEscapeキーでキャンセルできる', async ({ page }) => {
        await setupDiscussionPhaseWithCard(page, 'テストユーザー');
        await addMemo(page, 'メモテスト用カード', 'Escキャンセルテスト');

        const card = page.locator('.group', { hasText: 'メモテスト用カード' }).first();
        const memoItem = getMemoItem(card, 'Escキャンセルテスト');

        // 編集モードに入る
        await memoItem.hover();
        await memoItem.locator('button[aria-label="メモを編集"]').click();

        // 内容を変更してEscapeでキャンセル
        const editTextarea = card.locator('textarea:not([placeholder])');
        await editTextarea.fill('変更された内容');
        await editTextarea.press('Escape');

        // 元の内容が保持される
        await expect(page.getByText('Escキャンセルテスト')).toBeVisible();
        await expect(page.getByText('変更された内容')).not.toBeVisible();
    });

    test('編集モードでキャンセルボタンでキャンセルできる', async ({ page }) => {
        await setupDiscussionPhaseWithCard(page, 'テストユーザー');
        await addMemo(page, 'メモテスト用カード', 'ボタンキャンセルテスト');

        const card = page.locator('.group', { hasText: 'メモテスト用カード' }).first();
        const memoItem = getMemoItem(card, 'ボタンキャンセルテスト');

        // 編集モードに入る
        await memoItem.hover();
        await memoItem.locator('button[aria-label="メモを編集"]').click();

        // 内容を変更してキャンセルボタンをクリック
        const editTextarea = card.locator('textarea:not([placeholder])');
        await editTextarea.fill('変更された内容');
        await card.locator('button[aria-label="キャンセル"]').click();

        // 元の内容が保持される
        await expect(page.getByText('ボタンキャンセルテスト')).toBeVisible();
        await expect(page.getByText('変更された内容')).not.toBeVisible();
    });

    test('編集モードでEnterキーで保存できる', async ({ page }) => {
        await setupDiscussionPhaseWithCard(page, 'テストユーザー');
        await addMemo(page, 'メモテスト用カード', 'Enter保存テスト');

        const card = page.locator('.group', { hasText: 'メモテスト用カード' }).first();
        const memoItem = getMemoItem(card, 'Enter保存テスト');

        // 編集モードに入る
        await memoItem.hover();
        await memoItem.locator('button[aria-label="メモを編集"]').click();

        // 内容を変更してEnterで保存
        const editTextarea = card.locator('textarea:not([placeholder])');
        await editTextarea.fill('Enter保存後の内容');
        await editTextarea.press('Enter');

        // 更新された内容が表示される
        await expect(page.getByText('Enter保存後の内容')).toBeVisible();
        await expect(page.getByText('Enter保存テスト')).not.toBeVisible();
    });
});

test.describe('フェーズによるアクセス制御', () => {
    test('WRITINGフェーズではメモトグルが表示されない', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, 'WRITINGフェーズカード');

        // メモトグルボタンが表示されないことを確認
        const card = page.locator('.group', { hasText: 'WRITINGフェーズカード' }).first();
        await expect(card.getByRole('button', { name: 'メモを表示' })).not.toBeVisible();
    });

    test('VOTINGフェーズではメモトグルが表示されない', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, 'VOTINGフェーズカード');

        // 投票フェーズに遷移
        await advanceToPhase(page, 'VOTING');

        // メモトグルボタンが表示されないことを確認
        const card = page.locator('.group', { hasText: 'VOTINGフェーズカード' }).first();
        await expect(card.getByRole('button', { name: 'メモを表示' })).not.toBeVisible();
    });

    test('DISCUSSIONフェーズではメモフォームが表示される', async ({ page }) => {
        await setupDiscussionPhaseWithCard(page, 'テストユーザー');

        // メモフォームが表示されることを確認
        const card = page.locator('.group', { hasText: 'メモテスト用カード' }).first();
        await expect(card.getByPlaceholder('メモを追加...')).toBeVisible();
    });

    test('ACTION_ITEMSフェーズではメモフォームが表示される', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, 'アクションフェーズカード');

        // ACTION_ITEMSフェーズに遷移
        await advanceToPhase(page, 'ACTION_ITEMS');
        await openMemos(page, 'アクションフェーズカード');

        // メモフォームが表示されることを確認
        const card = page.locator('.group', { hasText: 'アクションフェーズカード' }).first();
        await expect(card.getByPlaceholder('メモを追加...')).toBeVisible();
    });

    test('CLOSEDフェーズではメモが読み取り専用になる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, 'CLOSEDテストカード');

        // DISCUSSIONフェーズでメモを追加
        await advanceToPhase(page, 'DISCUSSION');
        await openMemos(page, 'CLOSEDテストカード');
        await addMemo(page, 'CLOSEDテストカード', '読み取り専用メモ');

        // ACTION_ITEMS -> CLOSEDまで遷移（DISCUSSIONからの続き）
        await page.locator('button', { hasText: '次へ: アクション' }).click();
        await expect(
            page.locator('.bg-indigo-600.text-white', { hasText: 'アクション' }).first()
        ).toBeVisible({ timeout: 10000 });
        await page.locator('button', { hasText: '次へ: 完了' }).click();
        await expect(
            page.locator('.bg-indigo-600.text-white', { hasText: '完了' }).first()
        ).toBeVisible({ timeout: 10000 });

        // CLOSEDフェーズでメモトグルを開き直す（フェーズ遷移後のUIを確認するため）
        const card = page.locator('.group', { hasText: 'CLOSEDテストカード' }).first();
        await card.locator('button[aria-label="メモを表示"]').click();

        // メモの内容が表示される
        await expect(card.getByText('読み取り専用メモ')).toBeVisible();

        // メモフォームが非表示であることを確認
        await expect(card.getByPlaceholder('メモを追加...')).not.toBeVisible();

        // 編集・削除ボタンが表示されないことを確認
        const memoItem = getMemoItem(card, '読み取り専用メモ');
        await memoItem.hover();
        await expect(memoItem.locator('button[aria-label="メモを編集"]')).not.toBeVisible();
        await expect(memoItem.locator('button[aria-label="メモを削除"]')).not.toBeVisible();
    });
});

test.describe('マルチユーザーシナリオ', () => {
    test('ファシリテーターは他のユーザーのメモを削除できる', async ({ browser }) => {
        // ファシリテーターがボードを作成
        const context1 = await browser.newContext();
        const facilitatorPage = await context1.newPage();

        await facilitatorPage.goto('/');
        await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('メモ権限テスト');
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

        // ファシリテーターがカードを追加してDISCUSSIONに遷移
        await facilitatorPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await facilitatorPage.getByPlaceholder('意見を入力').fill('権限テストカード');
        await facilitatorPage.locator('button', { hasText: '追加' }).click();
        await expect(facilitatorPage.locator('p', { hasText: '権限テストカード' })).toBeVisible();

        // メンバー側でカードが同期されるのを待つ
        await expect(memberPage.getByText('権限テストカード')).toBeVisible({ timeout: 10000 });

        // DISCUSSIONフェーズに遷移
        await advanceToPhase(facilitatorPage, 'DISCUSSION');

        // メンバー側でフェーズ変更を待つ
        await expect(
            memberPage.locator('.bg-indigo-600.text-white', { hasText: '議論' }).first()
        ).toBeVisible({ timeout: 10000 });

        // メンバーがメモを追加
        const memberCard = memberPage.locator('.group', { hasText: '権限テストカード' }).first();
        await memberCard.getByRole('button', { name: 'メモを表示' }).click();
        await memberCard.getByPlaceholder('メモを追加...').fill('メンバーのメモ');
        await memberCard.getByRole('button', { name: 'メモを送信' }).click();
        await expect(memberPage.getByText('メンバーのメモ')).toBeVisible();

        // ファシリテーター側でメモトグルを開いて同期を確認
        const facilCard = facilitatorPage.locator('.group', { hasText: '権限テストカード' }).first();
        await facilCard.getByRole('button', { name: 'メモを表示' }).click();
        await expect(facilitatorPage.getByText('メンバーのメモ')).toBeVisible({ timeout: 10000 });

        // ファシリテーターにメモ削除ボタンが表示される（編集ボタンは非表示）
        const memoItem = getMemoItem(facilCard, 'メンバーのメモ');
        await memoItem.hover();
        await expect(memoItem.locator('button[aria-label="メモを削除"]')).toBeVisible();
        await expect(memoItem.locator('button[aria-label="メモを編集"]')).not.toBeVisible();

        // ファシリテーターがメモを削除
        await memoItem.locator('button[aria-label="メモを削除"]').click();

        // 両方のページでメモが消失
        await expect(facilitatorPage.getByText('メンバーのメモ')).not.toBeVisible();
        await expect(memberPage.getByText('メンバーのメモ')).not.toBeVisible({ timeout: 10000 });

        await context1.close();
        await context2.close();
    });

    test('メモの作成がリアルタイムに同期される', async ({ browser }) => {
        // ファシリテーターがボードを作成
        const context1 = await browser.newContext();
        const facilitatorPage = await context1.newPage();

        await facilitatorPage.goto('/');
        await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('メモ同期テスト');
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

        // カード追加->DISCUSSIONに遷移
        await facilitatorPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await facilitatorPage.getByPlaceholder('意見を入力').fill('同期テストカード');
        await facilitatorPage.locator('button', { hasText: '追加' }).click();
        await expect(facilitatorPage.locator('p', { hasText: '同期テストカード' })).toBeVisible();

        await expect(memberPage.getByText('同期テストカード')).toBeVisible({ timeout: 10000 });

        await advanceToPhase(facilitatorPage, 'DISCUSSION');
        await expect(
            memberPage.locator('.bg-indigo-600.text-white', { hasText: '議論' }).first()
        ).toBeVisible({ timeout: 10000 });

        // ファシリテーターがメモ追加
        const facilCard = facilitatorPage.locator('.group', { hasText: '同期テストカード' }).first();
        await facilCard.getByRole('button', { name: 'メモを表示' }).click();
        await facilCard.getByPlaceholder('メモを追加...').fill('リアルタイム同期メモ');
        await facilCard.getByRole('button', { name: 'メモを送信' }).click();
        await expect(facilitatorPage.getByText('リアルタイム同期メモ')).toBeVisible();

        // メンバー側でメモトグルを開いて同期を確認
        const memberCard = memberPage.locator('.group', { hasText: '同期テストカード' }).first();
        await memberCard.getByRole('button', { name: 'メモを表示' }).click();
        await expect(memberPage.getByText('リアルタイム同期メモ')).toBeVisible({ timeout: 10000 });

        await context1.close();
        await context2.close();
    });

    test('メモの削除がリアルタイムに同期される', async ({ browser }) => {
        // ファシリテーターがボードを作成
        const context1 = await browser.newContext();
        const facilitatorPage = await context1.newPage();

        await facilitatorPage.goto('/');
        await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('メモ削除同期テスト');
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

        // カード追加->DISCUSSIONに遷移
        await facilitatorPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await facilitatorPage.getByPlaceholder('意見を入力').fill('削除同期テストカード');
        await facilitatorPage.locator('button', { hasText: '追加' }).click();
        await expect(facilitatorPage.locator('p', { hasText: '削除同期テストカード' })).toBeVisible();

        await expect(memberPage.getByText('削除同期テストカード')).toBeVisible({ timeout: 10000 });

        await advanceToPhase(facilitatorPage, 'DISCUSSION');
        await expect(
            memberPage.locator('.bg-indigo-600.text-white', { hasText: '議論' }).first()
        ).toBeVisible({ timeout: 10000 });

        // ファシリテーターがメモ追加
        const facilCard = facilitatorPage.locator('.group', { hasText: '削除同期テストカード' }).first();
        await facilCard.getByRole('button', { name: 'メモを表示' }).click();
        await facilCard.getByPlaceholder('メモを追加...').fill('削除予定メモ');
        await facilCard.getByRole('button', { name: 'メモを送信' }).click();
        await expect(facilitatorPage.getByText('削除予定メモ')).toBeVisible();

        // メンバー側でメモトグルを開いて同期を確認
        const memberCard = memberPage.locator('.group', { hasText: '削除同期テストカード' }).first();
        await memberCard.getByRole('button', { name: 'メモを表示' }).click();
        await expect(memberPage.getByText('削除予定メモ')).toBeVisible({ timeout: 10000 });

        // ファシリテーターがメモを削除
        const memoItem = getMemoItem(facilCard, '削除予定メモ');
        await memoItem.hover();
        await memoItem.locator('button[aria-label="メモを削除"]').click();

        // 両方のページでメモが消失
        await expect(facilitatorPage.getByText('削除予定メモ')).not.toBeVisible();
        await expect(memberPage.getByText('削除予定メモ')).not.toBeVisible({ timeout: 10000 });

        await context1.close();
        await context2.close();
    });
});

test.describe('メモトグルとバッジ', () => {
    test('メモトグルでメモリストの表示/非表示を切り替えられる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, 'トグルテストカード');
        await advanceToPhase(page, 'DISCUSSION');

        const card = page.locator('.group', { hasText: 'トグルテストカード' }).first();

        // トグルクリック→メモリスト表示
        await card.getByRole('button', { name: 'メモを表示' }).click();
        await expect(card.getByPlaceholder('メモを追加...')).toBeVisible();

        // 再クリック→メモリスト非表示
        await card.getByRole('button', { name: 'メモを表示' }).click();
        await expect(card.getByPlaceholder('メモを追加...')).not.toBeVisible();

        // 再クリック→メモリスト表示
        await card.getByRole('button', { name: 'メモを表示' }).click();
        await expect(card.getByPlaceholder('メモを追加...')).toBeVisible();
    });

    test('メモ件数バッジが正しく表示される', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, 'バッジテストカード');
        await advanceToPhase(page, 'DISCUSSION');

        const card = page.locator('.group', { hasText: 'バッジテストカード' }).first();
        const toggleButton = card.getByRole('button', { name: 'メモを表示' });

        // 0件の時はバッジなし（ボタン内にspan要素がない）
        await expect(toggleButton.locator('span')).not.toBeVisible();

        // メモを1件追加
        await toggleButton.click();
        await addMemo(page, 'バッジテストカード', 'バッジメモ1');

        // バッジに「1」が表示される
        await expect(toggleButton.locator('span')).toHaveText('1');

        // メモを2件目追加
        await addMemo(page, 'バッジテストカード', 'バッジメモ2');

        // バッジに「2」が表示される
        await expect(toggleButton.locator('span')).toHaveText('2');
    });
});
