import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してニックネームで参加、複数カードを追加して投票フェーズに進める
async function setupVotingWithMultipleCards(page: import('@playwright/test').Page, cardCount: number = 3) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('投票制限テスト');
    await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

    await page.getByPlaceholder('ニックネームを入力').fill('投票者');
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();

    await expect(page.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });

    // 複数のカードを追加
    for (let i = 1; i <= cardCount; i++) {
        await page.getByRole('button', { name: 'カードを追加' }).first().click();
        await page.getByPlaceholder('意見を入力').fill(`投票カード${i}`);
        await page.getByRole('button', { name: '追加', exact: true }).click();
        // フォームが閉じるのを待ってから、p要素内のカードテキストを確認
        await expect(page.getByPlaceholder('意見を入力')).not.toBeVisible();
        await expect(page.locator('p', { hasText: `投票カード${i}` })).toBeVisible();
    }

    // 投票フェーズに進める
    await page.locator('button', { hasText: '次へ: 投票' }).click();
    await expect(page.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()).toBeVisible();
}

test.describe('残り投票数表示', () => {
    test('投票フェーズに入ると残り投票数が表示される', async ({ page }) => {
        await setupVotingWithMultipleCards(page);

        // 残り投票数の表示を確認（サイドパネル）
        await expect(page.getByText('残り 5票')).toBeVisible();
    });

    test('投票すると残り投票数が減少する', async ({ page }) => {
        await setupVotingWithMultipleCards(page);

        // 初期状態の確認（サイドパネル）
        await expect(page.getByText('残り 5票')).toBeVisible();

        // 投票
        await page.getByRole('button', { name: '0' }).first().click();
        await expect(page.getByRole('button', { name: '1' }).first()).toBeVisible();

        // 残り投票数が減少していることを確認
        await expect(page.getByText('残り 4票')).toBeVisible();
    });
});

test.describe('投票上限制限', () => {
    test('投票上限に達すると追加投票できない', async ({ page }) => {
        // 十分なカードを用意
        await setupVotingWithMultipleCards(page, 7);

        // 投票数上限（デフォルト5票）まで投票
        const voteButtons = page.getByRole('button', { name: '0' });

        // 5回投票（上限）
        for (let i = 0; i < 5; i++) {
            await voteButtons.first().click();
            // 少し待機して確実に反映されるようにする
            await page.waitForTimeout(300);
        }

        // 残り0票であることを確認
        await expect(page.getByText('残り 0票')).toBeVisible();

        // 追加の投票ボタンが無効であることを確認
        const remainingZeroButton = voteButtons.first();
        if (await remainingZeroButton.count() > 0) {
            // disabledになっているか確認
            await expect(remainingZeroButton).toBeDisabled();
        }
    });

    test('投票を取り消すと残り投票数が回復する', async ({ page }) => {
        await setupVotingWithMultipleCards(page);

        // 初期状態の確認
        await expect(page.getByText('残り 5票')).toBeVisible();

        // 投票
        await page.getByRole('button', { name: '0' }).first().click();
        await expect(page.getByRole('button', { name: '1' }).first()).toBeVisible();
        await expect(page.getByText('残り 4票')).toBeVisible();

        // 投票を取り消し
        await page.getByRole('button', { name: '1' }).first().click();
        await expect(page.getByRole('button', { name: '0' }).first()).toBeVisible();

        // 残り投票数が回復
        await expect(page.getByText('残り 5票')).toBeVisible();
    });

    test('複数回投票と取り消しで正しく票数が管理される', async ({ page }) => {
        await setupVotingWithMultipleCards(page, 5);

        // 3回投票
        for (let i = 0; i < 3; i++) {
            await page.getByRole('button', { name: '0' }).first().click();
            await page.waitForTimeout(300);
        }

        // 投票数が表示されるカードの確認
        const voteCountButtons = page.getByRole('button', { name: '1' });
        await expect(voteCountButtons).toHaveCount(3, { timeout: 5000 });

        // 1つ取り消し
        await voteCountButtons.first().click();

        // 投票数1のカードが2つになる
        await expect(page.getByRole('button', { name: '1' })).toHaveCount(2, { timeout: 5000 });
    });
});

test.describe('投票情報のパネル表示', () => {
    test('サイドパネルに投票状況が表示される', async ({ page }) => {
        await setupVotingWithMultipleCards(page);

        // デスクトップ表示でサイドパネルの投票情報を確認
        await expect(page.getByText(/投票:.*\/.*5/)).toBeVisible();
        await expect(page.getByText(/残り .+票/)).toBeVisible();
    });
});
