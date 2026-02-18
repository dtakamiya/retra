import { expect, Page, Browser } from '@playwright/test';

const FIRST_COLUMN_MAP: Record<string, string> = {
    'KPT': 'Keep',
    'Fun Done Learn': 'Fun',
    '4Ls': 'Liked',
    'Start Stop Continue': 'Start',
};

/** ボードを作成してニックネームで参加する */
export async function createBoardAndJoin(
    page: Page,
    nickname: string,
    boardTitle: string = 'テストボード',
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
    const firstColumn = FIRST_COLUMN_MAP[framework] || 'Keep';
    await expect(page.locator('h2', { hasText: firstColumn })).toBeVisible({ timeout: 10000 });
}

/** 別ブラウザコンテキストでボードに参加する */
export async function joinBoardAsMember(browser: Browser, boardUrl: string, nickname: string) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(boardUrl);

    await page.getByPlaceholder('ニックネームを入力').fill(nickname);
    await page.locator('button[type="submit"]', { hasText: '参加' }).click();
    // カラムヘッダーが表示されるまで待機（ボードが完全にロードされたことを確認）
    await expect(page.locator('h2').first()).toBeVisible({ timeout: 10000 });

    return { page, context };
}

/** カードを追加する */
export async function addCard(page: Page, content: string, columnIndex: number = 0) {
    await page.getByRole('button', { name: 'カードを追加' }).nth(columnIndex).click();
    await page.getByPlaceholder('意見を入力').fill(content);
    await page.getByRole('button', { name: '追加', exact: true }).click();
    await expect(page.locator('p', { hasText: content })).toBeVisible();
}

/** 指定フェーズまで段階的に遷移する */
export async function advanceToPhase(page: Page, targetPhase: string) {
    const steps = [
        { key: 'VOTING', name: '次へ: 投票', label: '投票' },
        { key: 'DISCUSSION', name: '次へ: 議論', label: '議論' },
        { key: 'ACTION_ITEMS', name: '次へ: アクション', label: 'アクション' },
        { key: 'CLOSED', name: '次へ: 完了', label: '完了' },
    ];

    for (const step of steps) {
        // aria-labelで設定されたボタンはgetByRoleで取得
        const button = page.getByRole('button', { name: step.name });
        // 既に通過済みフェーズのボタンは存在しない → スキップ
        if (await button.count() === 0) {
            if (step.key === targetPhase) break;
            continue;
        }
        await button.click();
        // 確認ダイアログの実テキストボタンをクリック
        await page.locator('button', { hasText: `${step.label}へ進む` }).click();
        await expect(
            page.locator('.bg-indigo-600.text-white', { hasText: step.label }).first()
        ).toBeVisible({ timeout: 10000 });
        if (step.key === targetPhase) break;
    }
}

/** メモトグルを開く */
export async function openMemos(page: Page, cardContent: string) {
    const card = page.locator('.group', { hasText: cardContent }).first();
    await card.getByRole('button', { name: 'メモを表示' }).click();
}

/** メモを追加する */
export async function addMemo(page: Page, cardContent: string, memoContent: string) {
    const card = page.locator('.group', { hasText: cardContent }).first();
    await card.getByPlaceholder('メモを追加...').fill(memoContent);
    await card.getByRole('button', { name: 'メモを送信' }).click();
    await expect(page.getByText(memoContent)).toBeVisible();
}

/** リアクションを追加する */
export async function addReaction(page: Page, cardContent: string, emoji: string) {
    const card = page.locator('.group', { hasText: cardContent }).first();
    await card.getByLabel('リアクションを追加').click();
    await page.getByLabel(`リアクション ${emoji}`).click();
}

/** アクションアイテムを追加する */
export async function addActionItem(page: Page, content: string) {
    await page.getByPlaceholder('アクションアイテムを追加...').fill(content);
    await page.getByRole('button', { name: 'アクションアイテムを追加' }).click();
    await expect(page.locator('p', { hasText: content })).toBeVisible({ timeout: 10000 });
}
