import { test, expect } from '@playwright/test';
import { createBoardAndJoin } from './helpers';

test.describe('カード操作', () => {
    test('カードを追加できる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー', 'カード操作テスト');

        await page.getByRole('button', { name: 'カードを追加' }).first().click();
        await expect(page.getByPlaceholder('意見を入力')).toBeVisible();

        await page.getByPlaceholder('意見を入力').fill('テストカード内容');
        await page.getByRole('button', { name: '追加', exact: true }).click();

        await expect(page.getByText('テストカード内容')).toBeVisible();
    });

    test('Enterキーでカードを追加できる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー', 'カード操作テスト');

        await page.getByRole('button', { name: 'カードを追加' }).first().click();
        await page.getByPlaceholder('意見を入力').fill('Enterで追加');
        await page.getByPlaceholder('意見を入力').press('Enter');

        await expect(page.getByText('Enterで追加')).toBeVisible();
    });

    test('複数のカラムにカードを追加できる', async ({ page }) => {
        await createBoardAndJoin(page, 'テストユーザー', 'カード操作テスト');

        await page.getByRole('button', { name: 'カードを追加' }).first().click();
        await page.getByPlaceholder('意見を入力').fill('Keep内容');
        await page.getByRole('button', { name: '追加', exact: true }).click();
        await expect(page.getByText('Keep内容')).toBeVisible();

        await page.getByRole('button', { name: 'カードを追加' }).nth(1).click();
        await page.getByPlaceholder('意見を入力').fill('Problem内容');
        await page.getByRole('button', { name: '追加', exact: true }).click();
        await expect(page.getByText('Problem内容')).toBeVisible();

        await page.getByRole('button', { name: 'カードを追加' }).nth(2).click();
        await page.getByPlaceholder('意見を入力').fill('Try内容');
        await page.getByRole('button', { name: '追加', exact: true }).click();
        await expect(page.getByText('Try内容')).toBeVisible();
    });
});
