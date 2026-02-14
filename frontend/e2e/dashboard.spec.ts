import { test, expect } from '@playwright/test';

// ヘルパー関数: ボードを作成してニックネームで参加
async function createBoardAndJoin(page: import('@playwright/test').Page, title: string = 'E2Eテストボード') {
    await page.goto('/');
    await page.getByPlaceholder('スプリント42 ふりかえり').fill(title);
    await page.locator('button[type="submit"]', { hasText: 'ボードを作成' }).click();
    await expect(page).toHaveURL(/\/board\/[a-zA-Z0-9-]+/);

    await page.getByPlaceholder('ニックネームを入力').fill('テストユーザー');
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

// ヘルパー関数: ボード作成→カード追加→全フェーズ遷移→CLOSEDまで完了
// CLOSEDに遷移すると自動的にスナップショットが作成される
async function completeFullRetro(page: import('@playwright/test').Page, title: string = 'E2Eテストボード') {
    await createBoardAndJoin(page, title);
    await addCard(page, 'テストカード1');
    await addCard(page, 'テストカード2');
    await advanceToPhase(page, 'CLOSED');
    // CLOSEDフェーズに到達するとスナップショットが自動作成される
}

test.describe('ダッシュボードページの基本表示', () => {
    test('ダッシュボードページが表示される', async ({ page }) => {
        await page.goto('/dashboard');

        // 「チームダッシュボード」見出しが表示される
        await expect(page.locator('h1', { hasText: 'チームダッシュボード' })).toBeVisible();

        // 検索フォームが表示される
        await expect(page.getByPlaceholder('チーム名で検索...')).toBeVisible();
        await expect(page.locator('button', { hasText: '検索' })).toBeVisible();

        // 「ホームに戻る」リンクが表示される
        await expect(page.locator('a', { hasText: 'ホームに戻る' })).toBeVisible();

        // 履歴が空の場合のメッセージが表示される
        await expect(page.getByText('まだレトロスペクティブの履歴がありません')).toBeVisible();
    });
});

test.describe('ホームからのナビゲーション', () => {
    test('ホームページからダッシュボードに遷移できる', async ({ page }) => {
        await page.goto('/');

        // 「チームダッシュボード」リンクをクリック
        await page.locator('a', { hasText: 'チームダッシュボード' }).click();

        // /dashboardに遷移していることを確認
        await expect(page).toHaveURL(/\/dashboard$/);

        // ダッシュボードページの見出しが表示される
        await expect(page.locator('h1', { hasText: 'チームダッシュボード' })).toBeVisible();
    });

    test('ダッシュボードからホームに戻れる', async ({ page }) => {
        await page.goto('/dashboard');

        // 「ホームに戻る」リンクをクリック
        await page.locator('a', { hasText: 'ホームに戻る' }).click();

        // ホームページに遷移していることを確認
        await expect(page).toHaveURL(/\/$/);
        await expect(page.locator('h1', { hasText: 'Retra' })).toBeVisible();
    });
});

test.describe('履歴の表示', () => {
    test('完了したレトロが履歴に表示される', async ({ page }) => {
        // レトロスペクティブを完了させてスナップショットを作成
        await completeFullRetro(page, 'ダッシュボード表示テスト');

        // ダッシュボードに遷移
        await page.goto('/dashboard');

        // 読み込み完了を待つ
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // レトロスペクティブ履歴セクションが表示される
        await expect(page.getByText('レトロスペクティブ履歴')).toBeVisible();

        // チーム名（ボードタイトル）が表示される
        await expect(page.getByText('ダッシュボード表示テスト')).toBeVisible();

        // 統計情報が表示される（カード数、参加者数など）
        await expect(page.getByText('2 カード')).toBeVisible();
        await expect(page.getByText('1 参加者')).toBeVisible();

        // フレームワーク名が表示される
        await expect(page.getByText('KPT')).toBeVisible();

        // 空のメッセージが表示されないことを確認
        await expect(page.getByText('まだレトロスペクティブの履歴がありません')).not.toBeVisible();
    });
});

test.describe('スナップショット詳細', () => {
    test('履歴からスナップショット詳細に遷移できる', async ({ page }) => {
        // レトロスペクティブを完了させてスナップショットを作成
        await completeFullRetro(page, 'スナップショット詳細テスト');

        // ダッシュボードに遷移
        await page.goto('/dashboard');

        // 読み込み完了を待つ
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // レトロのエントリをクリック
        await page.locator('a', { hasText: 'スナップショット詳細テスト' }).click();

        // スナップショット詳細ページに遷移
        await expect(page).toHaveURL(/\/dashboard\/[a-zA-Z0-9-]+/);

        // 読み込み完了を待つ
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // チーム名が見出しとして表示される
        await expect(page.locator('h1', { hasText: 'スナップショット詳細テスト' })).toBeVisible();

        // 統計カードが表示される
        await expect(page.getByText('カード数')).toBeVisible();
        await expect(page.getByText('参加者')).toBeVisible();

        // 「ダッシュボードに戻る」リンクが表示される
        await expect(page.locator('a', { hasText: 'ダッシュボードに戻る' })).toBeVisible();
    });

    test('スナップショット詳細からダッシュボードに戻れる', async ({ page }) => {
        // レトロスペクティブを完了させてスナップショットを作成
        await completeFullRetro(page, '戻るナビテスト');

        // ダッシュボードに遷移
        await page.goto('/dashboard');
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // レトロのエントリをクリック
        await page.locator('a', { hasText: '戻るナビテスト' }).click();
        await expect(page).toHaveURL(/\/dashboard\/[a-zA-Z0-9-]+/);
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // 「ダッシュボードに戻る」リンクをクリック
        await page.locator('a', { hasText: 'ダッシュボードに戻る' }).click();

        // ダッシュボードに戻ることを確認
        await expect(page).toHaveURL(/\/dashboard$/);
        await expect(page.locator('h1', { hasText: 'チームダッシュボード' })).toBeVisible();
    });

    test('スナップショット詳細にカラム詳細が表示される', async ({ page }) => {
        // レトロスペクティブを完了させてスナップショットを作成
        await completeFullRetro(page, 'カラム詳細テスト');

        // ダッシュボードに遷移
        await page.goto('/dashboard');
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // レトロのエントリをクリック
        await page.locator('a', { hasText: 'カラム詳細テスト' }).click();
        await expect(page).toHaveURL(/\/dashboard\/[a-zA-Z0-9-]+/);
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // カラム詳細セクションが表示される
        await expect(page.getByText('カラム詳細')).toBeVisible();

        // KPTフレームワークのカラム名が表示される（Keepカラムにカードを追加したため）
        await expect(page.getByText(/Keep/)).toBeVisible();

        // カードの内容が表示される
        await expect(page.getByText('テストカード1')).toBeVisible();
        await expect(page.getByText('テストカード2')).toBeVisible();
    });
});

test.describe('トレンドチャートの表示', () => {
    test('複数のレトロが完了するとトレンドチャートが表示される', async ({ page }) => {
        // 2つのレトロスペクティブを完了させてスナップショットを2件作成
        await completeFullRetro(page, 'トレンドテスト1回目');
        await completeFullRetro(page, 'トレンドテスト2回目');

        // ダッシュボードに遷移
        await page.goto('/dashboard');
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // トレンド & エンゲージメントセクションが表示される
        await expect(page.getByRole('heading', { name: 'トレンド & エンゲージメント' })).toBeVisible();

        // エンゲージメントセクションのラベルが表示される
        await expect(page.getByRole('heading', { name: 'エンゲージメント', exact: true })).toBeVisible();
    });
});

test.describe('検索機能', () => {
    test('チーム名で履歴を検索できる', async ({ page }) => {
        // レトロスペクティブを完了させてスナップショットを作成
        await completeFullRetro(page, '検索対象チーム');

        // ダッシュボードに遷移
        await page.goto('/dashboard');
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // レトロが表示されていることを確認
        await expect(page.getByText('検索対象チーム')).toBeVisible();

        // チーム名で検索
        await page.getByPlaceholder('チーム名で検索...').fill('検索対象チーム');
        await page.locator('button', { hasText: '検索' }).click();

        // 読み込み完了を待つ
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // 検索結果が表示される
        await expect(page.getByText('検索対象チーム')).toBeVisible();
    });

    test('存在しないチーム名で検索すると空の結果が表示される', async ({ page }) => {
        // レトロスペクティブを完了させてスナップショットを作成
        await completeFullRetro(page, '空検索テスト');

        // ダッシュボードに遷移
        await page.goto('/dashboard');
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // 存在しないチーム名で検索
        await page.getByPlaceholder('チーム名で検索...').fill('存在しないチーム名ABC');
        await page.locator('button', { hasText: '検索' }).click();

        // 読み込み完了を待つ
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // 空のメッセージが表示される
        await expect(page.getByText('まだレトロスペクティブの履歴がありません')).toBeVisible();
    });

    test('検索をクリアすると全履歴が表示される', async ({ page }) => {
        // レトロスペクティブを完了させてスナップショットを作成
        await completeFullRetro(page, 'クリアテストチーム');

        // ダッシュボードに遷移
        await page.goto('/dashboard');
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // 存在しないチーム名で検索して結果を空にする
        await page.getByPlaceholder('チーム名で検索...').fill('存在しないチーム');
        await page.locator('button', { hasText: '検索' }).click();
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });
        await expect(page.getByText('まだレトロスペクティブの履歴がありません')).toBeVisible();

        // 検索をクリアして再検索
        await page.getByPlaceholder('チーム名で検索...').fill('');
        await page.locator('button', { hasText: '検索' }).click();
        await expect(page.getByText('読み込み中...')).not.toBeVisible({ timeout: 10000 });

        // 全履歴が表示される
        await expect(page.getByText('クリアテストチーム')).toBeVisible();
    });
});
