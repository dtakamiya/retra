import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してニックネームで参加
async function createBoardAndJoin(page: import('@playwright/test').Page, nickname: string) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('アクションアイテムテスト');
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
    // カード本文(p要素)が表示されることを確認
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
        await page.locator('button', { hasText: `${step.label}へ進む` }).click();
        await expect(
            page.locator('.bg-indigo-600.text-white', { hasText: step.label }).first()
        ).toBeVisible({ timeout: 10000 });
        if (step.key === targetPhase) break;
    }
}

// ヘルパー関数: アクションアイテムを追加
async function addActionItem(page: import('@playwright/test').Page, content: string) {
    await page.getByPlaceholder('アクションアイテムを追加...').fill(content);
    await page.getByRole('button', { name: 'アクションアイテムを追加' }).click();
    await expect(page.locator('p', { hasText: content })).toBeVisible({ timeout: 10000 });
}

// ヘルパー関数: ボード作成→カード追加→ACTION_ITEMSフェーズ遷移まで一括
async function setupActionItemsPhaseWithCard(page: import('@playwright/test').Page, nickname: string) {
    await createBoardAndJoin(page, nickname);
    await addCard(page, 'アクションテスト用カード');
    await advanceToPhase(page, 'ACTION_ITEMS');
}

test.describe('アクションアイテムの基本CRUD操作', () => {
    test('ACTION_ITEMSフェーズでアクションアイテムを作成できる', async ({ page }) => {
        await setupActionItemsPhaseWithCard(page, 'テストユーザー');

        // アクションアイテムセクションが表示される
        await expect(page.locator('h3', { hasText: 'アクションアイテム' })).toBeVisible();

        // 空のメッセージが表示される
        await expect(page.getByText('アクションアイテムはまだありません')).toBeVisible();

        // アクションアイテムを追加
        await addActionItem(page, 'テストアクションアイテム');

        // 内容が表示される
        await expect(page.locator('p', { hasText: 'テストアクションアイテム' })).toBeVisible();

        // ステータスバッジ「未着手」が表示される
        await expect(page.getByText('未着手')).toBeVisible();

        // 空のメッセージが消える
        await expect(page.getByText('アクションアイテムはまだありません')).not.toBeVisible();

        // フォームがリセットされる
        await expect(page.getByPlaceholder('アクションアイテムを追加...')).toHaveValue('');
    });

    test('アクションアイテムを編集できる', async ({ page }) => {
        await setupActionItemsPhaseWithCard(page, 'テストユーザー');
        await addActionItem(page, '編集前アクション');

        // アクションアイテムにホバーして編集ボタンをクリック
        const actionItemCard = page.locator('.group', { hasText: '編集前アクション' }).first();
        await actionItemCard.hover();
        await actionItemCard.locator('button[aria-label="アクションアイテムを編集"]').click();

        // 編集用textareaが表示される（autoFocus付き）
        const editTextarea = page.locator('textarea[autofocus]');
        await expect(editTextarea).toBeVisible();
        await editTextarea.fill('編集後アクション');
        await page.locator('button[aria-label="保存"]').click();

        // 更新された内容が表示される
        await expect(page.locator('p', { hasText: '編集後アクション' })).toBeVisible();
        await expect(page.locator('p', { hasText: '編集前アクション' })).not.toBeVisible();
    });

    test('アクションアイテムを削除できる', async ({ page }) => {
        await setupActionItemsPhaseWithCard(page, 'テストユーザー');
        await addActionItem(page, '削除対象アクション');

        // アクションアイテムにホバーして削除ボタンをクリック
        const actionItemCard = page.locator('.group', { hasText: '削除対象アクション' }).first();
        await actionItemCard.hover();
        await actionItemCard.locator('button[aria-label="アクションアイテムを削除"]').click();

        // アクションアイテムが削除される
        await expect(page.locator('p', { hasText: '削除対象アクション' })).not.toBeVisible();
    });

    test('Enterキーでアクションアイテムを送信できる', async ({ page }) => {
        await setupActionItemsPhaseWithCard(page, 'テストユーザー');

        // テキストを入力してEnterキーで送信
        await page.getByPlaceholder('アクションアイテムを追加...').fill('Enter送信テスト');
        await page.getByPlaceholder('アクションアイテムを追加...').press('Enter');

        // アクションアイテムが表示される
        await expect(page.locator('p', { hasText: 'Enter送信テスト' })).toBeVisible();
    });

    test('空のアクションアイテムは送信できない', async ({ page }) => {
        await setupActionItemsPhaseWithCard(page, 'テストユーザー');

        // 初期状態で送信ボタンがdisabled
        await expect(page.getByRole('button', { name: 'アクションアイテムを追加' })).toBeDisabled();

        // 空白のみ入力でもdisabled
        await page.getByPlaceholder('アクションアイテムを追加...').fill('   ');
        await expect(page.getByRole('button', { name: 'アクションアイテムを追加' })).toBeDisabled();
    });
});

test.describe('ステータス変更', () => {
    test('ステータスをOPENからIN_PROGRESSに変更できる', async ({ page }) => {
        await setupActionItemsPhaseWithCard(page, 'テストユーザー');
        await addActionItem(page, 'ステータス変更テスト');

        // 初期状態は「未着手」
        await expect(page.getByText('未着手')).toBeVisible();

        // ステータスセレクトを操作
        const actionItemCard = page.locator('.group', { hasText: 'ステータス変更テスト' }).first();
        await actionItemCard.locator('select[aria-label="ステータスを変更"]').selectOption('IN_PROGRESS');

        // バッジが「進行中」に変わる
        await expect(page.getByText('進行中')).toBeVisible({ timeout: 5000 });
    });

    test('ステータスをDONEに変更できる', async ({ page }) => {
        await setupActionItemsPhaseWithCard(page, 'テストユーザー');
        await addActionItem(page, '完了テスト');

        // ステータスセレクトを操作
        const actionItemCard = page.locator('.group', { hasText: '完了テスト' }).first();
        await actionItemCard.locator('select[aria-label="ステータスを変更"]').selectOption('DONE');

        // バッジが「完了」に変わる
        await expect(page.getByText('完了').first()).toBeVisible({ timeout: 5000 });
    });

    test('ステータスをIN_PROGRESSからOPENに戻せる', async ({ page }) => {
        await setupActionItemsPhaseWithCard(page, 'テストユーザー');
        await addActionItem(page, '戻しテスト');

        // IN_PROGRESSに変更
        const actionItemCard = page.locator('.group', { hasText: '戻しテスト' }).first();
        await actionItemCard.locator('select[aria-label="ステータスを変更"]').selectOption('IN_PROGRESS');
        await expect(page.getByText('進行中')).toBeVisible({ timeout: 5000 });

        // OPENに戻す
        await actionItemCard.locator('select[aria-label="ステータスを変更"]').selectOption('OPEN');
        await expect(page.getByText('未着手')).toBeVisible({ timeout: 5000 });
    });
});

test.describe('編集モードのキーボード操作', () => {
    test('編集モードでEscapeキーでキャンセルできる', async ({ page }) => {
        await setupActionItemsPhaseWithCard(page, 'テストユーザー');
        await addActionItem(page, 'Escキャンセルテスト');

        // 編集モードに入る
        const actionItemCard = page.locator('.group', { hasText: 'Escキャンセルテスト' }).first();
        await actionItemCard.hover();
        await actionItemCard.locator('button[aria-label="アクションアイテムを編集"]').click();

        // 内容を変更してEscapeでキャンセル
        const editTextarea = page.locator('textarea[autofocus]');
        await editTextarea.fill('変更された内容');
        await editTextarea.press('Escape');

        // 元の内容が保持される
        await expect(page.locator('p', { hasText: 'Escキャンセルテスト' })).toBeVisible();
        await expect(page.locator('p', { hasText: '変更された内容' })).not.toBeVisible();
    });

    test('編集モードでキャンセルボタンでキャンセルできる', async ({ page }) => {
        await setupActionItemsPhaseWithCard(page, 'テストユーザー');
        await addActionItem(page, 'ボタンキャンセルテスト');

        // 編集モードに入る
        const actionItemCard = page.locator('.group', { hasText: 'ボタンキャンセルテスト' }).first();
        await actionItemCard.hover();
        await actionItemCard.locator('button[aria-label="アクションアイテムを編集"]').click();

        // 内容を変更してキャンセルボタンをクリック
        const editTextarea = page.locator('textarea[autofocus]');
        await editTextarea.fill('変更された内容');
        await page.locator('button[aria-label="キャンセル"]').click();

        // 元の内容が保持される
        await expect(page.locator('p', { hasText: 'ボタンキャンセルテスト' })).toBeVisible();
        await expect(page.locator('p', { hasText: '変更された内容' })).not.toBeVisible();
    });

    test('編集モードでEnterキーで保存できる', async ({ page }) => {
        await setupActionItemsPhaseWithCard(page, 'テストユーザー');
        await addActionItem(page, 'Enter保存テスト');

        // 編集モードに入る
        const actionItemCard = page.locator('.group', { hasText: 'Enter保存テスト' }).first();
        await actionItemCard.hover();
        await actionItemCard.locator('button[aria-label="アクションアイテムを編集"]').click();

        // 内容を変更してEnterで保存
        const editTextarea = page.locator('textarea[autofocus]');
        await editTextarea.fill('Enter保存後の内容');
        await editTextarea.press('Enter');

        // 更新された内容が表示される
        await expect(page.locator('p', { hasText: 'Enter保存後の内容' })).toBeVisible();
        await expect(page.locator('p', { hasText: 'Enter保存テスト' })).not.toBeVisible();
    });
});

test.describe('フェーズによるアクセス制御', () => {
    test('WRITINGフェーズではアクションアイテムセクションが表示されない', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');

        // アクションアイテムセクションのヘッダーが表示されないことを確認
        await expect(page.locator('h3', { hasText: 'アクションアイテム' })).not.toBeVisible();
    });

    test('VOTINGフェーズではアクションアイテムセクションが表示されない', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, 'VOTINGテストカード');
        await advanceToPhase(page, 'VOTING');

        // アクションアイテムセクションのヘッダーが表示されないことを確認
        await expect(page.locator('h3', { hasText: 'アクションアイテム' })).not.toBeVisible();
    });

    test('DISCUSSIONフェーズではアクションアイテムセクションが表示されない', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, 'DISCUSSIONテストカード');
        await advanceToPhase(page, 'DISCUSSION');

        // アクションアイテムセクションのヘッダーが表示されないことを確認
        await expect(page.locator('h3', { hasText: 'アクションアイテム' })).not.toBeVisible();
    });

    test('ACTION_ITEMSフェーズでアクションアイテムセクションとフォームが表示される', async ({ page }) => {
        await setupActionItemsPhaseWithCard(page, 'テストユーザー');

        // アクションアイテムセクションのヘッダーが表示される
        await expect(page.locator('h3', { hasText: 'アクションアイテム' })).toBeVisible();

        // フォームが表示される
        await expect(page.getByPlaceholder('アクションアイテムを追加...')).toBeVisible();
    });

    test('CLOSEDフェーズではアクションアイテムが読み取り専用になる', async ({ page }) => {
        await setupActionItemsPhaseWithCard(page, 'テストユーザー');

        // ACTION_ITEMSフェーズでアクションアイテムを追加
        await addActionItem(page, '読み取り専用アクション');

        // CLOSEDフェーズに遷移
        await page.locator('button', { hasText: '次へ: 完了' }).click();
        await page.locator('button', { hasText: '完了へ進む' }).click();
        await expect(
            page.locator('.bg-indigo-600.text-white', { hasText: '完了' }).first()
        ).toBeVisible({ timeout: 10000 });

        // アクションアイテムセクションは表示される
        await expect(page.locator('h3', { hasText: 'アクションアイテム' })).toBeVisible();

        // アクションアイテムの内容が表示される
        await expect(page.locator('p', { hasText: '読み取り専用アクション' })).toBeVisible();

        // フォームが非表示であることを確認
        await expect(page.getByPlaceholder('アクションアイテムを追加...')).not.toBeVisible();

        // ステータス変更セレクトが表示されないことを確認
        const actionItemCard = page.locator('.group', { hasText: '読み取り専用アクション' }).first();
        await expect(actionItemCard.locator('select[aria-label="ステータスを変更"]')).not.toBeVisible();

        // 編集・削除ボタンが表示されないことを確認
        await actionItemCard.hover();
        await expect(actionItemCard.locator('button[aria-label="アクションアイテムを編集"]')).not.toBeVisible();
        await expect(actionItemCard.locator('button[aria-label="アクションアイテムを削除"]')).not.toBeVisible();
    });
});

test.describe('カードからの変換', () => {
    test('カードをアクションアイテムに変換できる', async ({ page }) => {
        await setupActionItemsPhaseWithCard(page, 'テストユーザー');

        // カードの「アクションアイテムに変換」ボタンをクリック
        const card = page.locator('.group', { hasText: 'アクションテスト用カード' }).first();
        await card.locator('button[aria-label="アクションアイテムに変換"]').click();

        // 成功トーストが表示される
        await expect(page.getByText('アクションアイテムに変換しました')).toBeVisible({ timeout: 5000 });

        // アクションアイテムリストにカードの内容が表示される
        const actionItemSection = page.locator('.border-t', { hasText: 'アクションアイテム' });
        await expect(actionItemSection.locator('p', { hasText: 'アクションテスト用カード' })).toBeVisible({ timeout: 5000 });

        // ステータスが「未着手」であること
        await expect(actionItemSection.getByText('未着手')).toBeVisible();
    });

    test('DISCUSSIONフェーズでもカードをアクションアイテムに変換ボタンが表示される', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, '変換ボタンテスト');
        await advanceToPhase(page, 'DISCUSSION');

        // カードに変換ボタンが表示される
        const card = page.locator('.group', { hasText: '変換ボタンテスト' }).first();
        await expect(card.locator('button[aria-label="アクションアイテムに変換"]')).toBeVisible();
    });

    test('WRITINGフェーズではカードに変換ボタンが表示されない', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー');
        await addCard(page, '変換不可テスト');

        // カードに変換ボタンが表示されない
        const card = page.locator('.group', { hasText: '変換不可テスト' }).first();
        await expect(card.locator('button[aria-label="アクションアイテムに変換"]')).not.toBeVisible();
    });
});

test.describe('担当者と期限', () => {
    test('担当者を設定してアクションアイテムを作成できる', async ({ page }) => {
        await setupActionItemsPhaseWithCard(page, 'テストユーザー');

        // テキストを入力
        await page.getByPlaceholder('アクションアイテムを追加...').fill('担当者付きアクション');

        // 担当者を選択
        await page.locator('select[aria-label="担当者を選択"]').selectOption({ label: 'テストユーザー' });

        // 送信
        await page.getByRole('button', { name: 'アクションアイテムを追加' }).click();

        // アクションアイテムが表示され、担当者名が表示される
        await expect(page.locator('p', { hasText: '担当者付きアクション' })).toBeVisible();
        const actionItemCard = page.locator('.group', { hasText: '担当者付きアクション' }).first();
        await expect(actionItemCard.getByText('テストユーザー')).toBeVisible();
    });
});

test.describe('マルチユーザーシナリオ', () => {
    test('アクションアイテムの作成がリアルタイムに同期される', async ({ browser }) => {
        // ファシリテーターがボードを作成
        const context1 = await browser.newContext();
        const facilitatorPage = await context1.newPage();

        await facilitatorPage.goto('/');
        await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('アクション同期テスト');
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

        // ファシリテーターがカードを追加してACTION_ITEMSに遷移
        await facilitatorPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await facilitatorPage.getByPlaceholder('意見を入力').fill('同期テストカード');
        await facilitatorPage.getByRole('button', { name: '追加', exact: true }).click();
        await expect(facilitatorPage.locator('p', { hasText: '同期テストカード' })).toBeVisible();

        // メンバー側でカードが同期されるのを待つ
        await expect(memberPage.getByText('同期テストカード')).toBeVisible({ timeout: 10000 });

        // ACTION_ITEMSフェーズに遷移
        await advanceToPhase(facilitatorPage, 'ACTION_ITEMS');

        // メンバー側でフェーズ変更を待つ
        await expect(
            memberPage.locator('.bg-indigo-600.text-white', { hasText: 'アクション' }).first()
        ).toBeVisible({ timeout: 10000 });

        // ファシリテーターがアクションアイテムを追加
        await facilitatorPage.getByPlaceholder('アクションアイテムを追加...').fill('リアルタイム同期アクション');
        await facilitatorPage.getByRole('button', { name: 'アクションアイテムを追加' }).click();
        await expect(facilitatorPage.locator('p', { hasText: 'リアルタイム同期アクション' })).toBeVisible();

        // メンバー側でアクションアイテムが同期される
        await expect(memberPage.locator('p', { hasText: 'リアルタイム同期アクション' })).toBeVisible({ timeout: 10000 });

        await context1.close();
        await context2.close();
    });

    test('アクションアイテムの削除がリアルタイムに同期される', async ({ browser }) => {
        // ファシリテーターがボードを作成
        const context1 = await browser.newContext();
        const facilitatorPage = await context1.newPage();

        await facilitatorPage.goto('/');
        await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('アクション削除同期テスト');
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

        // ファシリテーターがカードを追加してACTION_ITEMSに遷移
        await facilitatorPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await facilitatorPage.getByPlaceholder('意見を入力').fill('削除同期テストカード');
        await facilitatorPage.getByRole('button', { name: '追加', exact: true }).click();
        await expect(facilitatorPage.locator('p', { hasText: '削除同期テストカード' })).toBeVisible();

        await expect(memberPage.getByText('削除同期テストカード')).toBeVisible({ timeout: 10000 });

        await advanceToPhase(facilitatorPage, 'ACTION_ITEMS');
        await expect(
            memberPage.locator('.bg-indigo-600.text-white', { hasText: 'アクション' }).first()
        ).toBeVisible({ timeout: 10000 });

        // ファシリテーターがアクションアイテムを追加
        await facilitatorPage.getByPlaceholder('アクションアイテムを追加...').fill('削除予定アクション');
        await facilitatorPage.getByRole('button', { name: 'アクションアイテムを追加' }).click();
        await expect(facilitatorPage.locator('p', { hasText: '削除予定アクション' })).toBeVisible();

        // メンバー側で同期を確認
        await expect(memberPage.locator('p', { hasText: '削除予定アクション' })).toBeVisible({ timeout: 10000 });

        // ファシリテーターがアクションアイテムを削除
        const actionItemCard = facilitatorPage.locator('.group', { hasText: '削除予定アクション' }).first();
        await actionItemCard.hover();
        await actionItemCard.locator('button[aria-label="アクションアイテムを削除"]').click();

        // 両方のページでアクションアイテムが消失
        await expect(facilitatorPage.locator('p', { hasText: '削除予定アクション' })).not.toBeVisible();
        await expect(memberPage.locator('p', { hasText: '削除予定アクション' })).not.toBeVisible({ timeout: 10000 });

        await context1.close();
        await context2.close();
    });

    test('ステータス変更がリアルタイムに同期される', async ({ browser }) => {
        // ファシリテーターがボードを作成
        const context1 = await browser.newContext();
        const facilitatorPage = await context1.newPage();

        await facilitatorPage.goto('/');
        await facilitatorPage.getByPlaceholder('スプリント42 ふりかえり').fill('ステータス同期テスト');
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

        // ファシリテーターがカードを追加してACTION_ITEMSに遷移
        await facilitatorPage.getByRole('button', { name: 'カードを追加' }).first().click();
        await facilitatorPage.getByPlaceholder('意見を入力').fill('ステータス同期カード');
        await facilitatorPage.getByRole('button', { name: '追加', exact: true }).click();
        await expect(facilitatorPage.locator('p', { hasText: 'ステータス同期カード' })).toBeVisible();

        await expect(memberPage.getByText('ステータス同期カード')).toBeVisible({ timeout: 10000 });

        await advanceToPhase(facilitatorPage, 'ACTION_ITEMS');
        await expect(
            memberPage.locator('.bg-indigo-600.text-white', { hasText: 'アクション' }).first()
        ).toBeVisible({ timeout: 10000 });

        // ファシリテーターがアクションアイテムを追加
        await facilitatorPage.getByPlaceholder('アクションアイテムを追加...').fill('ステータス同期アクション');
        await facilitatorPage.getByRole('button', { name: 'アクションアイテムを追加' }).click();
        await expect(facilitatorPage.locator('p', { hasText: 'ステータス同期アクション' })).toBeVisible();

        // メンバー側で同期を確認
        await expect(memberPage.locator('p', { hasText: 'ステータス同期アクション' })).toBeVisible({ timeout: 10000 });

        // ファシリテーターがステータスを変更
        const facilActionItem = facilitatorPage.locator('.group', { hasText: 'ステータス同期アクション' }).first();
        await facilActionItem.locator('select[aria-label="ステータスを変更"]').selectOption('IN_PROGRESS');

        // メンバー側でステータスが「進行中」に変わる
        const memberActionItemSection = memberPage.locator('.border-t', { hasText: 'アクションアイテム' });
        await expect(memberActionItemSection.getByText('進行中')).toBeVisible({ timeout: 10000 });

        await context1.close();
        await context2.close();
    });
});
