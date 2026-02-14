import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してニックネームで参加
async function createBoardAndJoin(
    page: import('@playwright/test').Page,
    teamName: string,
    title: string,
    nickname: string = 'ファシリテーター'
) {
    await page.goto('/');
    await page.getByPlaceholder('チーム名（任意）').fill(teamName);
    await page.getByPlaceholder('スプリント42 ふりかえり').fill(title);
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
    await expect(page.locator('p', { hasText: content })).toBeVisible();
}

test.describe('アクションアイテムの引き継ぎ', () => {
    test('前回のレトロスペクティブのアクションアイテムが次回のボードに引き継がれる', async ({ page }) => {
        const teamName = 'E2E Test Team';
        const firstRetroTitle = 'Sprint 42 Retro';
        const secondRetroTitle = 'Sprint 43 Retro';
        const actionItemContent = 'テスト自動化を導入する';

        // 1. 最初のレトロスペクティブを作成
        await createBoardAndJoin(page, teamName, firstRetroTitle);

        // 2. カードを追加してACTION_ITEMSフェーズまで進める
        await addCard(page, 'テストカード');
        await advanceToPhase(page, 'ACTION_ITEMS');

        // 3. アクションアイテムを作成
        await addActionItem(page, actionItemContent);

        // アクションアイテムが表示されることを確認
        await expect(page.locator('p', { hasText: actionItemContent })).toBeVisible();

        // 4. CLOSEDフェーズに進める（スナップショット自動作成）
        await advanceToPhase(page, 'CLOSED');

        // 5. ホームページに戻る
        await page.goto('/');
        await expect(page.locator('h1', { hasText: 'Retra' })).toBeVisible();

        // 6. 同じチーム名で新しいレトロスペクティブを作成
        await createBoardAndJoin(page, teamName, secondRetroTitle);

        // 7. 引き継ぎパネルが表示されることを確認
        await expect(page.locator('h3', { hasText: '前回のアクションアイテム' })).toBeVisible();

        // 8. 前回のアクションアイテムが引き継ぎパネルに表示されることを確認
        const carryOverPanel = page.locator('.border-t', { hasText: '前回のアクションアイテム' });
        await expect(carryOverPanel.locator('p', { hasText: actionItemContent })).toBeVisible();

        // 9. ステータスが表示されることを確認
        await expect(carryOverPanel.getByText('未着手')).toBeVisible();
    });

    test('異なるチーム名の場合は引き継ぎパネルが表示されない', async ({ page }) => {
        const firstTeamName = 'チームA';
        const secondTeamName = 'チームB';
        const actionItemContent = '引き継がれないアクション';

        // 1. チームAでレトロを完了
        await createBoardAndJoin(page, firstTeamName, 'チームA Sprint 1');
        await addCard(page, 'テストカード');
        await advanceToPhase(page, 'ACTION_ITEMS');
        await addActionItem(page, actionItemContent);
        await advanceToPhase(page, 'CLOSED');

        // 2. ホームに戻る
        await page.goto('/');

        // 3. チームBで新しいレトロを作成
        await createBoardAndJoin(page, secondTeamName, 'チームB Sprint 1');

        // 4. 引き継ぎパネルが表示されないことを確認
        await expect(page.locator('h3', { hasText: '前回のアクションアイテム' })).not.toBeVisible();

        // 5. チームAのアクションアイテムが表示されないことを確認
        await expect(page.locator('p', { hasText: actionItemContent })).not.toBeVisible();
    });

    test('チーム名が空の場合は引き継ぎパネルが表示されない', async ({ page }) => {
        const teamName = ''; // 空のチーム名
        const actionItemContent = '引き継がれないアクション2';

        // 1. チーム名なしでレトロを完了
        await createBoardAndJoin(page, teamName, '名前なしチーム Sprint 1');
        await addCard(page, 'テストカード');
        await advanceToPhase(page, 'ACTION_ITEMS');
        await addActionItem(page, actionItemContent);
        await advanceToPhase(page, 'CLOSED');

        // 2. ホームに戻る
        await page.goto('/');

        // 3. チーム名なしで新しいレトロを作成
        await createBoardAndJoin(page, teamName, '名前なしチーム Sprint 2');

        // 4. 引き継ぎパネルが表示されないことを確認
        await expect(page.locator('h3', { hasText: '前回のアクションアイテム' })).not.toBeVisible();
    });

    test('前回のレトロにアクションアイテムがない場合は引き継ぎパネルが表示されない', async ({ page }) => {
        const teamName = 'アクションなしチーム';

        // 1. アクションアイテムなしでレトロを完了
        await createBoardAndJoin(page, teamName, 'Sprint 1');
        await addCard(page, 'テストカード');
        await advanceToPhase(page, 'ACTION_ITEMS');
        // アクションアイテムを作成しない
        await advanceToPhase(page, 'CLOSED');

        // 2. ホームに戻る
        await page.goto('/');

        // 3. 同じチーム名で新しいレトロを作成
        await createBoardAndJoin(page, teamName, 'Sprint 2');

        // 4. 引き継ぎパネルが表示されないことを確認
        await expect(page.locator('h3', { hasText: '前回のアクションアイテム' })).not.toBeVisible();
    });

    test('複数のアクションアイテムがすべて引き継がれる', async ({ page }) => {
        const teamName = '複数アクションテスト';
        const actionItem1 = 'アクション1: コードレビュー改善';
        const actionItem2 = 'アクション2: ドキュメント更新';
        const actionItem3 = 'アクション3: テスト追加';

        // 1. レトロを作成して複数のアクションアイテムを追加
        await createBoardAndJoin(page, teamName, 'Sprint 10');
        await addCard(page, 'テストカード');
        await advanceToPhase(page, 'ACTION_ITEMS');
        await addActionItem(page, actionItem1);
        await addActionItem(page, actionItem2);
        await addActionItem(page, actionItem3);
        await advanceToPhase(page, 'CLOSED');

        // 2. ホームに戻る
        await page.goto('/');

        // 3. 新しいレトロを作成
        await createBoardAndJoin(page, teamName, 'Sprint 11');

        // 4. 引き継ぎパネルが表示される
        await expect(page.locator('h3', { hasText: '前回のアクションアイテム' })).toBeVisible();

        // 5. すべてのアクションアイテムが表示される
        const carryOverPanel = page.locator('.border-t', { hasText: '前回のアクションアイテム' });
        await expect(carryOverPanel.locator('p', { hasText: actionItem1 })).toBeVisible();
        await expect(carryOverPanel.locator('p', { hasText: actionItem2 })).toBeVisible();
        await expect(carryOverPanel.locator('p', { hasText: actionItem3 })).toBeVisible();
    });

    test('引き継がれたアクションアイテムのステータスが正しく表示される', async ({ page }) => {
        const teamName = 'ステータステスト';
        const actionItemOpen = 'ステータス: 未着手';
        const actionItemInProgress = 'ステータス: 進行中';
        const actionItemDone = 'ステータス: 完了';

        // 1. レトロを作成してアクションアイテムを追加
        await createBoardAndJoin(page, teamName, 'Sprint 20');
        await addCard(page, 'テストカード');
        await advanceToPhase(page, 'ACTION_ITEMS');

        // アクションアイテムを追加
        await addActionItem(page, actionItemOpen);
        await addActionItem(page, actionItemInProgress);
        await addActionItem(page, actionItemDone);

        // ステータスを変更
        const inProgressCard = page.locator('.group', { hasText: actionItemInProgress }).first();
        await inProgressCard.locator('select[aria-label="ステータスを変更"]').selectOption('IN_PROGRESS');
        await expect(page.getByText('進行中')).toBeVisible({ timeout: 5000 });

        const doneCard = page.locator('.group', { hasText: actionItemDone }).first();
        await doneCard.locator('select[aria-label="ステータスを変更"]').selectOption('DONE');
        await expect(page.getByText('完了').first()).toBeVisible({ timeout: 5000 });

        // CLOSEDフェーズに進める
        await advanceToPhase(page, 'CLOSED');

        // 2. ホームに戻る
        await page.goto('/');

        // 3. 新しいレトロを作成
        await createBoardAndJoin(page, teamName, 'Sprint 21');

        // 4. 引き継ぎパネルで各ステータスが正しく表示される
        const carryOverPanel = page.locator('.border-t', { hasText: '前回のアクションアイテム' });

        // 未着手のアクションアイテムとそのステータス
        await expect(carryOverPanel.locator('p', { hasText: actionItemOpen })).toBeVisible();
        const openCard = carryOverPanel.locator('.group', { hasText: actionItemOpen }).first();
        await expect(openCard.getByText('未着手')).toBeVisible();

        // 進行中のアクションアイテムとそのステータス
        await expect(carryOverPanel.locator('p', { hasText: actionItemInProgress })).toBeVisible();
        const inProgressPanelCard = carryOverPanel.locator('.group', { hasText: actionItemInProgress }).first();
        await expect(inProgressPanelCard.getByText('進行中')).toBeVisible();

        // 完了のアクションアイテムとそのステータス
        await expect(carryOverPanel.locator('p', { hasText: actionItemDone })).toBeVisible();
        const donePanelCard = carryOverPanel.locator('.group', { hasText: actionItemDone }).first();
        await expect(donePanelCard.getByText('完了')).toBeVisible();
    });
});
