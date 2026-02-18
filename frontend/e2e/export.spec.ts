import { test, expect } from '@playwright/test';
import { createBoardAndJoin, addCard, advanceToPhase } from './helpers';

test.describe('エクスポート機能', () => {
    test('CSVエクスポートでカード情報を含むファイルがダウンロードされる', async ({ page }) => {
        await createBoardAndJoin(page, 'ファシリテーター', 'エクスポートテスト');
        await addCard(page, 'Keep内容テスト', 0);
        await addCard(page, 'Problem内容テスト', 1);
        await advanceToPhase(page, 'DISCUSSION');

        const downloadPromise = page.waitForEvent('download');
        await page.getByLabel('エクスポート').click();
        await page.getByText('CSV形式でダウンロード').click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toMatch(/.*_export\.csv$/);

        const readable = await download.createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of readable) {
            chunks.push(chunk as Buffer);
        }
        const csvContent = Buffer.concat(chunks).toString('utf-8');

        expect(csvContent).toContain('Column,Content,Author,Votes,Memos,Reactions');
        expect(csvContent).toContain('Keep内容テスト');
        expect(csvContent).toContain('Problem内容テスト');
        expect(csvContent).toContain('ファシリテーター');
    });

    test('Markdownエクスポートでカード情報を含むファイルがダウンロードされる', async ({ page }) => {
        await createBoardAndJoin(page, 'ファシリテーター', 'エクスポートテスト');
        await addCard(page, 'MDテスト内容', 0);
        await advanceToPhase(page, 'DISCUSSION');

        const downloadPromise = page.waitForEvent('download');
        await page.getByLabel('エクスポート').click();
        await page.getByText('Markdown形式でダウンロード').click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toMatch(/.*_export\.md$/);

        const readable = await download.createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of readable) {
            chunks.push(chunk as Buffer);
        }
        const mdContent = Buffer.concat(chunks).toString('utf-8');

        expect(mdContent).toContain('# エクスポートテスト');
        expect(mdContent).toContain('## Keep');
        expect(mdContent).toContain('MDテスト内容');
    });
});
