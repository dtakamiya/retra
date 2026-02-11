import { test, expect, Page, Browser } from '@playwright/test';

/**
 * ユーザー受入テスト（UAT）
 *
 * 実際のスクラムチームがRetraを使ってふりかえりを行うシナリオを
 * エンドツーエンドでテストします。既存のE2Eテストが個別機能の検証に
 * 集中しているのに対し、UATでは一連の業務フローを通してテストします。
 */

// ==================== ヘルパー関数 ====================

/** ボードを作成してファシリテーターとして参加 */
async function createBoardAndJoinAsFacilitator(
    page: Page,
    boardTitle: string,
    nickname: string = 'ファシリテーター',
    framework: string = 'KPT'
) {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill(boardTitle);
    if (framework !== 'KPT') {
        await page.locator('button', { hasText: framework }).click();
    }
    await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

    await page.getByPlaceholder('ニックネームを入力').fill(nickname);
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();

    // ボードが表示されるまで待機
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });
}

/** メンバーとしてボードに参加 */
async function joinBoardAsMember(browser: Browser, boardUrl: string, nickname: string) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(boardUrl);

    await page.getByPlaceholder('ニックネームを入力').fill(nickname);
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });

    return { page, context };
}

/** カードを追加 */
async function addCard(page: Page, content: string, columnIndex: number = 0) {
    await page.getByRole('button', { name: 'カードを追加' }).nth(columnIndex).click();
    await page.getByPlaceholder('意見を入力').fill(content);
    await page.locator('button', { hasText: '追加' }).click();
    await expect(page.locator('p', { hasText: content })).toBeVisible();
}

/** フェーズを遷移 */
async function advanceToPhase(page: Page, targetPhase: string) {
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

/** メモトグルを開く */
async function openMemos(page: Page, cardContent: string) {
    const card = page.locator('.group', { hasText: cardContent }).first();
    await card.getByRole('button', { name: 'メモを表示' }).click();
}

/** メモを追加 */
async function addMemo(page: Page, cardContent: string, memoContent: string) {
    const card = page.locator('.group', { hasText: cardContent }).first();
    await card.getByPlaceholder('メモを追加...').fill(memoContent);
    await card.getByRole('button', { name: 'メモを送信' }).click();
    await expect(page.getByText(memoContent)).toBeVisible();
}

/** リアクションを追加 */
async function addReaction(page: Page, cardContent: string, emoji: string) {
    const card = page.locator('.group', { hasText: cardContent }).first();
    await card.getByLabel('リアクションを追加').click();
    await page.getByLabel(`リアクション ${emoji}`).click();
}

// ==================== UAT テストケース ====================

test.describe('UAT: 完全なレトロスペクティブセッション（単独ファシリテーター）', () => {
    test('ファシリテーターが全フェーズを通してレトロを完了できる', async ({ page }) => {
        // === フェーズ1: ボード作成と記入 ===
        await createBoardAndJoinAsFacilitator(page, 'スプリント42 ふりかえり');

        // ボードタイトルが表示される
        await expect(page.getByText('スプリント42 ふりかえり')).toBeVisible();

        // 参加者リストにファシリテーターが表示される
        await expect(page.getByText('ファシリテーター')).toBeVisible();

        // 3つのカラム（Keep, Problem, Try）が表示される
        await expect(page.locator('h2', { hasText: 'Keep' })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Problem' })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Try' })).toBeVisible();

        // 各カラムにカードを追加
        await addCard(page, 'チームの連携が良かった', 0);
        await addCard(page, 'コードレビューが迅速だった', 0);
        await addCard(page, 'デプロイに時間がかかった', 1);
        await addCard(page, 'テスト自動化を進めたい', 2);
        await addCard(page, 'ペアプロを増やしたい', 2);

        // カードが正しく表示されていることを確認
        await expect(page.getByText('チームの連携が良かった')).toBeVisible();
        await expect(page.getByText('デプロイに時間がかかった')).toBeVisible();
        await expect(page.getByText('ペアプロを増やしたい')).toBeVisible();

        // リアクションを追加（WRITINGフェーズでも可能）
        await addReaction(page, 'チームの連携が良かった', '👍');
        const keepCard = page.locator('.group', { hasText: 'チームの連携が良かった' }).first();
        await expect(keepCard.getByLabel(/👍 1件/)).toBeVisible();

        // === フェーズ2: 投票 ===
        await advanceToPhase(page, 'VOTING');

        // カード追加ボタンが非表示になる
        await expect(page.locator('button[title="カードを追加"]')).not.toBeVisible();

        // カードに投票する
        const cards = page.locator('[data-testid="vote-button"]');
        // 最初のカードに投票
        await cards.first().click();
        await expect(cards.first()).toContainText('1');

        // 残り投票数が減ることを確認
        await expect(page.getByText(/残り\s*4\s*票/)).toBeVisible();

        // === フェーズ3: 議論 ===
        await advanceToPhase(page, 'DISCUSSION');

        // メモを追加する
        await openMemos(page, 'デプロイに時間がかかった');
        await addMemo(page, 'デプロイに時間がかかった', 'CI/CDパイプラインの改善が必要');

        // === フェーズ4: アクションアイテム ===
        await advanceToPhase(page, 'ACTION_ITEMS');

        // アクションフェーズでもメモ追加可能
        await openMemos(page, 'テスト自動化を進めたい');
        await addMemo(page, 'テスト自動化を進めたい', '担当: 田中、期限: 次スプリント');

        // === フェーズ5: 完了 ===
        await advanceToPhase(page, 'CLOSED');

        // 完了後は「次へ」ボタンが表示されない
        await expect(page.locator('button', { hasText: '次へ' })).not.toBeVisible();

        // データはすべて保持されている
        await expect(page.getByText('チームの連携が良かった')).toBeVisible();
        await expect(page.getByText('デプロイに時間がかかった')).toBeVisible();
        await expect(page.getByText('テスト自動化を進めたい')).toBeVisible();

        // === エクスポート ===
        const downloadPromise = page.waitForEvent('download');
        await page.getByLabel('エクスポート').click();
        await page.getByText('Markdown形式でダウンロード').click();
        const download = await downloadPromise;

        // エクスポートファイルの内容確認
        const readable = await download.createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of readable) {
            chunks.push(chunk as Buffer);
        }
        const mdContent = Buffer.concat(chunks).toString('utf-8');

        // エクスポートに全データが含まれる
        expect(mdContent).toContain('スプリント42 ふりかえり');
        expect(mdContent).toContain('チームの連携が良かった');
        expect(mdContent).toContain('デプロイに時間がかかった');
        expect(mdContent).toContain('テスト自動化を進めたい');
        expect(mdContent).toContain('ファシリテーター');
    });
});

test.describe('UAT: チームでのレトロスペクティブ（複数参加者）', () => {
    test('ファシリテーターとメンバー2人で完全なレトロを実施できる', async ({ browser }) => {
        // === ファシリテーターがボードを作成 ===
        const facilitatorContext = await browser.newContext();
        const facilitatorPage = await facilitatorContext.newPage();
        await createBoardAndJoinAsFacilitator(facilitatorPage, 'チームレトロ');

        const boardUrl = facilitatorPage.url();

        // === メンバー2人が参加 ===
        const member1 = await joinBoardAsMember(browser, boardUrl, '田中');
        const member2 = await joinBoardAsMember(browser, boardUrl, '佐藤');

        // 全員の参加者リストが同期される
        await expect(facilitatorPage.getByText('田中')).toBeVisible({ timeout: 10000 });
        await expect(facilitatorPage.getByText('佐藤')).toBeVisible({ timeout: 10000 });
        await expect(member1.page.getByText('ファシリテーター')).toBeVisible({ timeout: 10000 });
        await expect(member1.page.getByText('佐藤')).toBeVisible({ timeout: 10000 });

        // === 記入フェーズ: 各メンバーがカードを追加 ===
        // 田中がKeepカラムにカード追加
        await addCard(member1.page, '朝会が有意義だった', 0);

        // 佐藤がProblemカラムにカード追加
        await addCard(member2.page, 'ドキュメントが不足', 1);

        // ファシリテーターがTryカラムにカード追加
        await addCard(facilitatorPage, 'ドキュメント改善タスクを追加', 2);

        // 全カードが全ブラウザで同期される
        await expect(facilitatorPage.getByText('朝会が有意義だった')).toBeVisible({ timeout: 10000 });
        await expect(facilitatorPage.getByText('ドキュメントが不足')).toBeVisible({ timeout: 10000 });
        await expect(member1.page.getByText('ドキュメントが不足')).toBeVisible({ timeout: 10000 });
        await expect(member2.page.getByText('朝会が有意義だった')).toBeVisible({ timeout: 10000 });

        // === 投票フェーズ ===
        await advanceToPhase(facilitatorPage, 'VOTING');

        // メンバー側でフェーズ変更を待つ
        await expect(
            member1.page.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()
        ).toBeVisible({ timeout: 10000 });
        await expect(
            member2.page.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()
        ).toBeVisible({ timeout: 10000 });

        // メンバーには「次へ」ボタンが表示されない
        await expect(member1.page.locator('button', { hasText: '次へ' })).not.toBeVisible();
        await expect(member2.page.locator('button', { hasText: '次へ' })).not.toBeVisible();

        // 田中が投票
        const member1VoteButtons = member1.page.locator('[data-testid="vote-button"]');
        await member1VoteButtons.first().click();
        await expect(member1VoteButtons.first()).toContainText('1');

        // 佐藤も同じカードに投票
        const member2VoteButtons = member2.page.locator('[data-testid="vote-button"]');
        await member2VoteButtons.first().click();

        // ファシリテーター側で投票が同期される（2票）
        const facilVoteButtons = facilitatorPage.locator('[data-testid="vote-button"]');
        await expect(facilVoteButtons.first()).toContainText('2', { timeout: 10000 });

        // === 議論フェーズ ===
        await advanceToPhase(facilitatorPage, 'DISCUSSION');

        // メンバー側でフェーズ変更を待つ
        await expect(
            member1.page.locator('.bg-indigo-600.text-white', { hasText: '議論' }).first()
        ).toBeVisible({ timeout: 10000 });

        // メンバーがメモを追加
        await openMemos(member1.page, '朝会が有意義だった');
        await addMemo(member1.page, '朝会が有意義だった', '15分以内に収まるようになった');

        // ファシリテーター側でメモが同期される
        await openMemos(facilitatorPage, '朝会が有意義だった');
        await expect(facilitatorPage.getByText('15分以内に収まるようになった')).toBeVisible({ timeout: 10000 });

        // === 完了フェーズ ===
        await advanceToPhase(facilitatorPage, 'ACTION_ITEMS');
        await advanceToPhase(facilitatorPage, 'CLOSED');

        // メンバー側でも完了フェーズに同期される
        await expect(
            member1.page.locator('.bg-indigo-600.text-white', { hasText: '完了' }).first()
        ).toBeVisible({ timeout: 10000 });

        // 完了後もデータが保持されている
        await expect(member1.page.getByText('朝会が有意義だった')).toBeVisible();
        await expect(member2.page.getByText('ドキュメントが不足')).toBeVisible();

        await facilitatorContext.close();
        await member1.context.close();
        await member2.context.close();
    });
});

test.describe('UAT: ページリロード後のデータ永続性', () => {
    test('ブラウザリロード後もボードデータが保持される', async ({ page }) => {
        // ボードを作成してカードを追加
        await createBoardAndJoinAsFacilitator(page, 'リロードテスト');
        await addCard(page, 'リロード前に追加したカード', 0);
        await addCard(page, '2番目のカード', 1);

        // 投票フェーズに進めて投票
        await advanceToPhase(page, 'VOTING');

        // ページをリロード
        await page.reload();

        // ニックネーム再入力が必要（セッション管理の仕様確認）
        const nicknameInput = page.getByPlaceholder('ニックネームを入力');
        if (await nicknameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await nicknameInput.fill('ファシリテーター');
            await page.locator('button[type="submit"]', { hasText: '参加' }).click();
        }

        // ボードが再表示される
        await expect(page.locator('header')).toBeVisible({ timeout: 10000 });

        // カードが保持されている
        await expect(page.getByText('リロード前に追加したカード')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('2番目のカード')).toBeVisible({ timeout: 10000 });

        // フェーズが保持されている（投票フェーズ）
        await expect(
            page.locator('.bg-indigo-600.text-white', { hasText: '投票' }).first()
        ).toBeVisible();
    });
});

test.describe('UAT: Fun Done Learnフレームワーク', () => {
    test('Fun Done Learnフレームワークで完全なレトロを実施できる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page, 'FDLレトロ', 'ファシリテーター', 'Fun Done Learn');

        // Fun Done Learnのカラムが表示される
        await expect(page.locator('h2', { hasText: 'Fun' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('h2', { hasText: 'Done' })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Learn' })).toBeVisible();

        // 各カラムにカード追加
        await addCard(page, 'ハッカソンが楽しかった', 0);
        await addCard(page, 'リリースを完了できた', 1);
        await addCard(page, '新しいフレームワークを学べた', 2);

        // フェーズを投票→議論→完了まで進める
        await advanceToPhase(page, 'VOTING');

        // 投票
        const voteButtons = page.locator('[data-testid="vote-button"]');
        await voteButtons.first().click();
        await expect(voteButtons.first()).toContainText('1');

        await advanceToPhase(page, 'DISCUSSION');

        // メモ追加
        await openMemos(page, 'ハッカソンが楽しかった');
        await addMemo(page, 'ハッカソンが楽しかった', '次回も定期開催したい');

        await advanceToPhase(page, 'ACTION_ITEMS');
        await advanceToPhase(page, 'CLOSED');

        // 完了後にデータが保持されている
        await expect(page.getByText('ハッカソンが楽しかった')).toBeVisible();
        await expect(page.getByText('リリースを完了できた')).toBeVisible();
        await expect(page.getByText('新しいフレームワークを学べた')).toBeVisible();
    });
});

test.describe('UAT: 4Lsフレームワーク', () => {
    test('4Lsフレームワークで完全なレトロを実施できる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page, '4Lsレトロ', 'ファシリテーター', '4Ls');

        // 4Lsのカラムが表示される
        await expect(page.locator('h2', { hasText: 'Liked' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('h2', { hasText: 'Learned' })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Lacked' })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Longed For' })).toBeVisible();

        // 各カラムにカード追加（4カラム）
        await addCard(page, 'チームワークが向上した', 0);
        await addCard(page, 'GraphQLの使い方を学んだ', 1);
        await addCard(page, 'ドキュメントが足りなかった', 2);
        await addCard(page, 'もっとペアプロしたかった', 3);

        // 全フェーズを通す
        await advanceToPhase(page, 'VOTING');
        await advanceToPhase(page, 'DISCUSSION');
        await advanceToPhase(page, 'ACTION_ITEMS');
        await advanceToPhase(page, 'CLOSED');

        // 4カラム全てのカードが保持されている
        await expect(page.getByText('チームワークが向上した')).toBeVisible();
        await expect(page.getByText('GraphQLの使い方を学んだ')).toBeVisible();
        await expect(page.getByText('ドキュメントが足りなかった')).toBeVisible();
        await expect(page.getByText('もっとペアプロしたかった')).toBeVisible();
    });
});

test.describe('UAT: Start Stop Continueフレームワーク', () => {
    test('Start Stop Continueフレームワークでレトロを実施できる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page, 'SSCレトロ', 'ファシリテーター', 'Start Stop Continue');

        // Start Stop Continueのカラムが表示される
        await expect(page.locator('h2', { hasText: 'Start' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('h2', { hasText: 'Stop' })).toBeVisible();
        await expect(page.locator('h2', { hasText: 'Continue' })).toBeVisible();

        // 各カラムにカード追加
        await addCard(page, 'コードレビューのガイドライン作成', 0);
        await addCard(page, '深夜のデプロイをやめる', 1);
        await addCard(page, 'デイリースクラムを継続', 2);

        // 全フェーズを通す
        await advanceToPhase(page, 'CLOSED');

        // 全カードが保持されている
        await expect(page.getByText('コードレビューのガイドライン作成')).toBeVisible();
        await expect(page.getByText('深夜のデプロイをやめる')).toBeVisible();
        await expect(page.getByText('デイリースクラムを継続')).toBeVisible();
    });
});

test.describe('UAT: エラーケースとエッジケース', () => {
    test('存在しないボードURLにアクセスするとエラーが表示されホームに戻れる', async ({ page }) => {
        await page.goto('/board/invalid-slug-that-does-not-exist');

        // エラーメッセージが表示される
        await expect(page.getByText('ボードが見つかりません')).toBeVisible({ timeout: 10000 });

        // ホームに戻れる
        await page.locator('button', { hasText: 'ホームに戻る' }).click();
        await expect(page).toHaveURL('/');

        // ホームページが正常に表示される
        await expect(page.getByText('ボードを作成')).toBeVisible();
    });

    test('日本語の長いカード内容を正しく表示できる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page, '長文テスト');

        const longText = 'これは非常に長いカード内容です。スプリントレビューで発見された問題点について詳細に記述します。チーム全員が共有するべき重要な情報を含んでいます。';
        await addCard(page, longText, 0);

        // 長文が正しく表示される
        await expect(page.getByText(longText)).toBeVisible();
    });

    test('特殊文字を含むボード名とカード内容を処理できる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page, 'テスト & 振り返り <第1回>');

        // ボード名が正しく表示される
        await expect(page.getByText('テスト & 振り返り <第1回>')).toBeVisible();

        // 特殊文字を含むカード
        const specialContent = 'バグ修正: API返却値が"null"→空配列[]に変更';
        await addCard(page, specialContent, 0);
        await expect(page.getByText(specialContent)).toBeVisible();
    });

    test('空のニックネームではボードに参加できない', async ({ page }) => {
        await page.goto('/');
        await page.getByPlaceholder('スプリント42 ふりかえり').fill('ニックネームテスト');
        await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
        await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

        // ニックネーム入力が空の状態で参加ボタンが無効
        const joinButton = page.locator('button[type="submit"]', { hasText: '参加' });
        await expect(joinButton).toBeDisabled();
    });
});

test.describe('UAT: ボード共有と参加フロー', () => {
    test('ボードコードを使って別ユーザーが参加できる', async ({ browser }) => {
        // ファシリテーターがボードを作成
        const facilitatorContext = await browser.newContext();
        const facilitatorPage = await facilitatorContext.newPage();
        await createBoardAndJoinAsFacilitator(facilitatorPage, '共有テスト');

        const boardUrl = facilitatorPage.url();
        const slug = boardUrl.split('/board/')[1];

        // メンバーがホームからボードコードで参加
        const memberContext = await browser.newContext();
        const memberPage = await memberContext.newPage();
        await memberPage.goto('/');
        await memberPage.locator('button', { hasText: 'ボードに参加' }).first().click();
        await memberPage.getByPlaceholder('ボードコードを入力またはURLを貼り付け').fill(slug);
        await memberPage.locator('button[type="submit"]', { hasText: 'ボードに参加' }).click();

        // ボードページに遷移
        await expect(memberPage).toHaveURL(`/board/${slug}`);

        // ニックネームを入力して参加
        await memberPage.getByPlaceholder('ニックネームを入力').fill('新メンバー');
        await memberPage.locator('button[type="submit"]', { hasText: '参加' }).click();

        // ボードが表示される
        await expect(memberPage.locator('header')).toBeVisible({ timeout: 10000 });

        // ファシリテーター側で新メンバーの参加が同期される
        await expect(facilitatorPage.getByText('新メンバー')).toBeVisible({ timeout: 10000 });

        await facilitatorContext.close();
        await memberContext.close();
    });

    test('フルURLを使って別ユーザーが参加できる', async ({ browser }) => {
        // ファシリテーターがボードを作成
        const facilitatorContext = await browser.newContext();
        const facilitatorPage = await facilitatorContext.newPage();
        await createBoardAndJoinAsFacilitator(facilitatorPage, 'URL共有テスト');

        const boardUrl = facilitatorPage.url();

        // メンバーがホームからフルURLで参加
        const memberContext = await browser.newContext();
        const memberPage = await memberContext.newPage();
        await memberPage.goto('/');
        await memberPage.locator('button', { hasText: 'ボードに参加' }).first().click();
        await memberPage.getByPlaceholder('ボードコードを入力またはURLを貼り付け').fill(boardUrl);
        await memberPage.locator('button[type="submit"]', { hasText: 'ボードに参加' }).click();

        // ボードページに遷移
        await expect(memberPage).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

        // ニックネームを入力して参加
        await memberPage.getByPlaceholder('ニックネームを入力').fill('URLメンバー');
        await memberPage.locator('button[type="submit"]', { hasText: '参加' }).click();

        // ボードが表示される
        await expect(memberPage.locator('header')).toBeVisible({ timeout: 10000 });

        await facilitatorContext.close();
        await memberContext.close();
    });
});

test.describe('UAT: CSVエクスポートの完全性', () => {
    test('投票・メモ・リアクションを含む完全なCSVエクスポート', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page, 'CSVエクスポートテスト');

        // カードを追加
        await addCard(page, 'エクスポート対象カード1', 0);
        await addCard(page, 'エクスポート対象カード2', 1);

        // リアクションを追加
        await addReaction(page, 'エクスポート対象カード1', '👍');

        // 投票フェーズで投票
        await advanceToPhase(page, 'VOTING');
        const voteButtons = page.locator('[data-testid="vote-button"]');
        await voteButtons.first().click();

        // 議論フェーズでメモ追加
        await advanceToPhase(page, 'DISCUSSION');
        await openMemos(page, 'エクスポート対象カード1');
        await addMemo(page, 'エクスポート対象カード1', 'アクション: 次スプリントで改善');

        // CSVエクスポート
        const downloadPromise = page.waitForEvent('download');
        await page.getByLabel('エクスポート').click();
        await page.getByText('CSV形式でダウンロード').click();
        const download = await downloadPromise;

        // CSV内容の検証
        const readable = await download.createReadStream();
        const chunks: Buffer[] = [];
        for await (const chunk of readable) {
            chunks.push(chunk as Buffer);
        }
        const csvContent = Buffer.concat(chunks).toString('utf-8');

        // ヘッダーが正しい
        expect(csvContent).toContain('Column,Content,Author,Votes,Memos,Reactions');

        // カード内容が含まれる
        expect(csvContent).toContain('エクスポート対象カード1');
        expect(csvContent).toContain('エクスポート対象カード2');

        // 著者名が含まれる
        expect(csvContent).toContain('ファシリテーター');

        // ファイル名の確認
        expect(download.suggestedFilename()).toMatch(/.*_export\.csv$/);
    });
});

test.describe('UAT: タイマーを使ったタイムボックス運営', () => {
    test('ファシリテーターがタイマーで各フェーズの時間管理ができる', async ({ page }) => {
        await createBoardAndJoinAsFacilitator(page, 'タイマーテスト');

        // タイマーの初期状態を確認
        await expect(page.getByText('--:--').first()).toBeVisible();

        // タイマーを開始
        await page.locator('button', { hasText: '開始' }).click();
        await page.locator('input[type="number"]').fill('1');
        await page.locator('button', { hasText: '開始' }).last().click();

        // タイマーが動作中であることを確認
        await expect(page.getByText(/\d{2}:\d{2}/).first()).toBeVisible({ timeout: 5000 });

        // 一時停止
        await page.locator('button', { hasText: '一時停止' }).click();

        // リセット
        await page.locator('button', { hasText: 'リセット' }).click();
        await expect(page.getByText('--:--').first()).toBeVisible({ timeout: 5000 });
    });
});
