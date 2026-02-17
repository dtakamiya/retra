import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してファシリテーターとして参加
async function createBoardAndJoinAsFacilitator(page: import('@playwright/test').Page) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill('エクスポートテスト');
    await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

    await page.getByPlaceholder('ニックネームを入力').fill('ファシリテーター');
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();

    await expect(page.locator('h2', { hasText: 'Keep' })).toBeVisible({ timeout: 10000 });
}

// ヘルパー関数: カードを追加
async function addCard(page: import('@playwright/test').Page, content: string, columnIndex: number = 0) {
    await page.getByRole('button', { name: 'カードを追加' }).nth(columnIndex).click();
    await page.getByPlaceholder('意見を入力').fill(content);
    await page.getByRole('button', { name: '追加', exact: true }).click();
    await expect(page.getByText(content)).toBeVisible();
}

// ヘルパー関数: DISCUSSIONフェーズまで進める
async function advanceToDicussion(page: import('@playwright/test').Page) {
    await page.locator('button', { hasText: '次へ: 投票' }).click();
    await page.locator('button', { hasText: '投票へ進む' }).click();
    await expect(page.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()).toBeVisible();

    await page.locator('button', { hasText: '次へ: 議論' }).click();
    await page.locator('button', { hasText: '議論へ進む' }).click();
    await expect(page.locator('.bg-indigo-600.text-white', { hasText: '議論' }).first()).toBeVisible();
}

test.describe('エクスポート機能', () => {
    test('ファシリテーターにエクスポートボタンが表示される', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        await expect(page.getByLabel('エクスポート')).toBeVisible();
    });

    test('エクスポートメニューが開閉できる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // メニューを開く
        await page.getByLabel('エクスポート').click();

        // ドロップダウン項目が表示される
        await expect(page.getByText('CSV形式でダウンロード')).toBeVisible();
        await expect(page.getByText('Markdown形式でダウンロード')).toBeVisible();

        // 外側をクリックしてメニューを閉じる
        await page.locator('header').click({ position: { x: 10, y: 10 } });
        await expect(page.getByText('CSV形式でダウンロード')).not.toBeVisible();
    });

    test('Escapeキーでメニューを閉じられる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        await page.getByLabel('エクスポート').click();
        await expect(page.getByText('CSV形式でダウンロード')).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(page.getByText('CSV形式でダウンロード')).not.toBeVisible();
    });

    test('CSVエクスポートでファイルがダウンロードされる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // カードを追加
        await addCard(page, 'エクスポート用カード');

        // DISCUSSIONフェーズに進める
        await advanceToDicussion(page);

        // ダウンロードイベントを待機
        const downloadPromise = page.waitForEvent('download');

        // CSVエクスポート実行
        await page.getByLabel('エクスポート').click();
        await page.getByText('CSV形式でダウンロード').click();

        const download = await downloadPromise;

        // ファイル名を確認
        expect(download.suggestedFilename()).toMatch(/.*_export\.csv$/);
    });

    test('Markdownエクスポートでファイルがダウンロードされる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // カードを追加
        await addCard(page, 'Markdown用カード');

        // DISCUSSIONフェーズに進める
        await advanceToDicussion(page);

        // ダウンロードイベントを待機
        const downloadPromise = page.waitForEvent('download');

        // Markdownエクスポート実行
        await page.getByLabel('エクスポート').click();
        await page.getByText('Markdown形式でダウンロード').click();

        const download = await downloadPromise;

        // ファイル名を確認
        expect(download.suggestedFilename()).toMatch(/.*_export\.md$/);
    });

    test('CSVエクスポートの内容にカード情報が含まれる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // カードを追加
        await addCard(page, 'Keep内容テスト', 0);
        await addCard(page, 'Problem内容テスト', 1);

        // DISCUSSIONフェーズに進める
        await advanceToDicussion(page);

        // ダウンロードイベントを待機
        const downloadPromise = page.waitForEvent('download');

        await page.getByLabel('エクスポート').click();
        await page.getByText('CSV形式でダウンロード').click();

        const download = await downloadPromise;

        // ダウンロードされたファイルの内容を読む
        const readable = await download.createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of readable) {
            chunks.push(chunk as Buffer);
        }
        const csvContent = Buffer.concat(chunks).toString('utf-8');

        // CSVにカード内容が含まれる
        expect(csvContent).toContain('Column,Content,Author,Votes,Memos,Reactions');
        expect(csvContent).toContain('Keep内容テスト');
        expect(csvContent).toContain('Problem内容テスト');
        expect(csvContent).toContain('ファシリテーター');
    });

    test('Markdownエクスポートの内容にカード情報が含まれる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // カードを追加
        await addCard(page, 'MDテスト内容', 0);

        // DISCUSSIONフェーズに進める
        await advanceToDicussion(page);

        // ダウンロードイベントを待機
        const downloadPromise = page.waitForEvent('download');

        await page.getByLabel('エクスポート').click();
        await page.getByText('Markdown形式でダウンロード').click();

        const download = await downloadPromise;

        // ダウンロードされたファイルの内容を読む
        const readable = await download.createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of readable) {
            chunks.push(chunk as Buffer);
        }
        const mdContent = Buffer.concat(chunks).toString('utf-8');

        // Markdownにボード情報が含まれる
        expect(mdContent).toContain('# エクスポートテスト');
        expect(mdContent).toContain('## Keep');
        expect(mdContent).toContain('MDテスト内容');
        expect(mdContent).toContain('## 参加者');
        expect(mdContent).toContain('ファシリテーター');
    });

    test('WRITINGフェーズでもエクスポートできる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page);

        // カードを追加（WRITINGフェーズ）
        await addCard(page, 'WRITING中のカード');

        // ダウンロードイベントを待機
        const downloadPromise = page.waitForEvent('download');

        await page.getByLabel('エクスポート').click();
        await page.getByText('CSV形式でダウンロード').click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/.*_export\.csv$/);
    });
});
