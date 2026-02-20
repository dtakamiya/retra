import { test, expect } from '@playwright/test';
import {
    createBoardAndJoin,
    joinBoardAsMember,
    addCard,
    advanceToPhase,
    openMemos,
    addMemo,
    addReaction,
    addActionItem,
} from './helpers';

test.describe('UAT: 単独ファシリテーターKPT完走', () => {
    test('ファシリテーターが全フェーズを通してレトロを完了できる', async ({ page }) => {
        // === フェーズ1: ボード作成と記入 ===
        await createBoardAndJoin(page, 'ファシリテーター', 'スプリント42 ふりかえり');

        await expect(page.locator('h1', { hasText: 'スプリント42 ふりかえり' })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Keep' })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Problem' })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Try' })).toBeVisible();

        await addCard(page, 'チームの連携が良かった', 0);
        await addCard(page, 'デプロイに時間がかかった', 1);
        await addCard(page, 'テスト自動化を進めたい', 2);

        // リアクション
        await addReaction(page, 'チームの連携が良かった', '👍');

        // === フェーズ2: 投票 ===
        await advanceToPhase(page, 'VOTING');

        const voteButtons = page.locator('[data-testid="vote-button"]');
        await voteButtons.first().click();
        await expect(voteButtons.first()).toContainText('1');

        // === フェーズ3: 議論 ===
        await advanceToPhase(page, 'DISCUSSION');

        await openMemos(page, 'デプロイに時間がかかった');
        await addMemo(page, 'デプロイに時間がかかった', 'CI/CDパイプラインの改善が必要');

        // === フェーズ4: アクションアイテム ===
        await advanceToPhase(page, 'ACTION_ITEMS');

        await addActionItem(page, 'CI/CDパイプラインを改善する');

        // === フェーズ5: 完了 ===
        await advanceToPhase(page, 'CLOSED');

        await expect(page.getByRole('button', { name: /次へ/ })).not.toBeVisible();
        await expect(page.getByText('チームの連携が良かった')).toBeVisible();
        await expect(page.getByText('デプロイに時間がかかった')).toBeVisible();

        // === エクスポート ===
        const downloadPromise = page.waitForEvent('download');
        await page.getByLabel('エクスポート').click();
        await page.getByText('Markdown形式でダウンロード').click();
        const download = await downloadPromise;

        const readable = await download.createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of readable) {
            chunks.push(chunk as Buffer);
        }
        const mdContent = Buffer.concat(chunks).toString('utf-8');
        expect(mdContent).toContain('スプリント42 ふりかえり');
        expect(mdContent).toContain('チームの連携が良かった');
    });
});

test.describe('UAT: チームでのレトロスペクティブ（複数参加者）', () => {
    test('ファシリテーターとメンバー2人で完全なレトロを実施できる', async ({ browser }) => {
        const facilitatorContext = await browser.newContext();
        const facilitatorPage = await facilitatorContext.newPage();
        await createBoardAndJoin(facilitatorPage, 'ファシリテーター', 'チームレトロ');

        const boardUrl = facilitatorPage.url();

        const member1 = await joinBoardAsMember(browser, boardUrl, '田中');
        const member2 = await joinBoardAsMember(browser, boardUrl, '佐藤');

        // サイドパネルを開いて参加者同期を確認
        await facilitatorPage.getByRole('button', { name: 'サイドパネルを開く' }).click();
        await expect(facilitatorPage.getByText('田中')).toBeVisible({ timeout: 10000 });
        await expect(facilitatorPage.getByText('佐藤')).toBeVisible({ timeout: 10000 });
        // サイドパネルを閉じる（サイドパネルがz-40でトグルボタンを遮るためforce使用）
        await facilitatorPage.getByRole('button', { name: 'サイドパネルを閉じる' }).click({ force: true });

        // === 記入フェーズ ===
        await addCard(member1.page, '朝会が有意義だった', 0);
        await addCard(member2.page, 'ドキュメントが不足', 1);
        await addCard(facilitatorPage, 'ドキュメント改善タスクを追加', 2);

        // カード同期
        await expect(facilitatorPage.getByText('朝会が有意義だった')).toBeVisible({ timeout: 10000 });
        await expect(member1.page.getByText('ドキュメントが不足')).toBeVisible({ timeout: 10000 });

        // === 投票フェーズ ===
        await advanceToPhase(facilitatorPage, 'VOTING');
        await expect(
            member1.page.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()
        ).toBeVisible({ timeout: 10000 });

        // メンバーにはフェーズ制御ボタンが非表示
        await expect(member1.page.getByRole('button', { name: /次へ/ })).not.toBeVisible();

        // 投票同期
        const member1VoteButtons = member1.page.locator('[data-testid="vote-button"]');
        await member1VoteButtons.first().click();
        const member2VoteButtons = member2.page.locator('[data-testid="vote-button"]');
        await member2VoteButtons.first().click();

        const facilVoteButtons = facilitatorPage.locator('[data-testid="vote-button"]');
        await expect(facilVoteButtons.first()).toContainText('2', { timeout: 10000 });

        // === 議論〜完了 ===
        await advanceToPhase(facilitatorPage, 'DISCUSSION');
        await expect(
            member1.page.locator('.bg-indigo-600.text-white', { hasText: '議論' }).first()
        ).toBeVisible({ timeout: 10000 });

        await advanceToPhase(facilitatorPage, 'ACTION_ITEMS');
        await advanceToPhase(facilitatorPage, 'CLOSED');

        await expect(
            member1.page.locator('.bg-indigo-600.text-white', { hasText: '完了' }).first()
        ).toBeVisible({ timeout: 10000 });

        // 完了後データ保持
        await expect(member1.page.getByText('朝会が有意義だった')).toBeVisible();
        await expect(member2.page.getByText('ドキュメントが不足')).toBeVisible();

        await facilitatorContext.close();
        await member1.context.close();
        await member2.context.close();
    });
});

test.describe('UAT: Fun Done Learnフレームワーク', () => {
    test('Fun Done Learnフレームワークで基本フローを完走できる', async ({ page }) => {
        await createBoardAndJoin(page, 'ファシリテーター', 'FDLレトロ', 'Fun Done Learn');

        await expect(page.locator('h2', { hasText: 'Fun' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('h2', { hasText: 'Done' })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Learn' })).toBeVisible();

        await addCard(page, 'ハッカソンが楽しかった', 0);
        await addCard(page, 'リリースを完了できた', 1);
        await addCard(page, '新しいフレームワークを学べた', 2);

        await advanceToPhase(page, 'CLOSED');

        await expect(page.getByText('ハッカソンが楽しかった')).toBeVisible();
        await expect(page.getByText('リリースを完了できた')).toBeVisible();
        await expect(page.getByText('新しいフレームワークを学べた')).toBeVisible();
    });
});
