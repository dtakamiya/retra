import { describe, it, expect, vi } from 'vitest';
import { generateMarkdown, downloadMarkdown, copyMarkdownToClipboard } from './exportMarkdown';
import { createBoard, createCard, createColumn, createMemo, createReaction, createParticipant } from '../test/fixtures';

describe('generateMarkdown', () => {
  it('空のボードでMarkdownを生成する', () => {
    const board = createBoard({ title: 'テストレトロ' });
    const md = generateMarkdown(board);

    expect(md).toContain('# テストレトロ');
    expect(md).toContain('**フレームワーク:** KPT');
    expect(md).toContain('**フェーズ:** 記入');
    expect(md).toContain('TestUser（ファシリテーター）');
    expect(md).toContain('**参加者（1名）:**');
  });

  it('フレームワーク名が正しく表示される', () => {
    const board = createBoard({ framework: 'FUN_DONE_LEARN' });
    const md = generateMarkdown(board);
    expect(md).toContain('**フレームワーク:** Fun Done Learn');
  });

  it('各フェーズが正しく日本語表示される', () => {
    expect(generateMarkdown(createBoard({ phase: 'WRITING' }))).toContain('**フェーズ:** 記入');
    expect(generateMarkdown(createBoard({ phase: 'VOTING' }))).toContain('**フェーズ:** 投票');
    expect(generateMarkdown(createBoard({ phase: 'DISCUSSION' }))).toContain('**フェーズ:** 議論');
    expect(generateMarkdown(createBoard({ phase: 'ACTION_ITEMS' }))).toContain('**フェーズ:** アクションアイテム');
    expect(generateMarkdown(createBoard({ phase: 'CLOSED' }))).toContain('**フェーズ:** 完了');
  });

  it('カードの内容が正しく出力される', () => {
    const card = createCard({ content: 'ペアプロが効果的だった', voteCount: 3, authorNickname: 'Alice' });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', name: 'Keep', cards: [card] }),
        createColumn({ id: 'col-2', name: 'Problem', sortOrder: 1 }),
        createColumn({ id: 'col-3', name: 'Try', sortOrder: 2 }),
      ],
    });
    const md = generateMarkdown(board);

    expect(md).toContain('## Keep（1枚）');
    expect(md).toContain('### ペアプロが効果的だった');
    expect(md).toContain('**投稿者:** Alice | **投票:** 3票');
  });

  it('カードがないカラムには「カードなし」と表示される', () => {
    const board = createBoard();
    const md = generateMarkdown(board);
    expect(md).toContain('_カードなし_');
  });

  it('メモが正しく出力される', () => {
    const memo1 = createMemo({ id: 'memo-1', content: '次のスプリントでも継続', authorNickname: 'Bob' });
    const memo2 = createMemo({ id: 'memo-2', content: '頻度を増やしたい', authorNickname: 'Carol' });
    const card = createCard({ content: 'テストカード', memos: [memo1, memo2] });
    const board = createBoard({
      columns: [
        createColumn({ cards: [card] }),
        createColumn({ id: 'col-2', name: 'Problem', sortOrder: 1 }),
        createColumn({ id: 'col-3', name: 'Try', sortOrder: 2 }),
      ],
    });
    const md = generateMarkdown(board);

    expect(md).toContain('- **メモ:**');
    expect(md).toContain('  - 次のスプリントでも継続 _(Bob)_');
    expect(md).toContain('  - 頻度を増やしたい _(Carol)_');
  });

  it('リアクションが正しく集計される', () => {
    const reactions = [
      createReaction({ id: 'r-1', emoji: '👍', participantId: 'p-1' }),
      createReaction({ id: 'r-2', emoji: '👍', participantId: 'p-2' }),
      createReaction({ id: 'r-3', emoji: '❤️', participantId: 'p-1' }),
    ];
    const card = createCard({ content: 'テスト', reactions });
    const board = createBoard({
      columns: [
        createColumn({ cards: [card] }),
        createColumn({ id: 'col-2', name: 'Problem', sortOrder: 1 }),
        createColumn({ id: 'col-3', name: 'Try', sortOrder: 2 }),
      ],
    });
    const md = generateMarkdown(board);

    expect(md).toContain('- **リアクション:** 👍 2 ❤️ 1');
  });

  it('カードが投票数順にソートされる', () => {
    const card1 = createCard({ id: 'c-1', content: '低投票', voteCount: 1, sortOrder: 0 });
    const card2 = createCard({ id: 'c-2', content: '高投票', voteCount: 5, sortOrder: 1 });
    const card3 = createCard({ id: 'c-3', content: '中投票', voteCount: 3, sortOrder: 2 });
    const board = createBoard({
      columns: [
        createColumn({ cards: [card1, card2, card3] }),
        createColumn({ id: 'col-2', name: 'Problem', sortOrder: 1 }),
        createColumn({ id: 'col-3', name: 'Try', sortOrder: 2 }),
      ],
    });
    const md = generateMarkdown(board);

    const highPos = md.indexOf('### 高投票');
    const midPos = md.indexOf('### 中投票');
    const lowPos = md.indexOf('### 低投票');
    expect(highPos).toBeLessThan(midPos);
    expect(midPos).toBeLessThan(lowPos);
  });

  it('複数行カードの内容が正しく出力される', () => {
    const card = createCard({ content: '1行目\n2行目\n3行目' });
    const board = createBoard({
      columns: [
        createColumn({ cards: [card] }),
        createColumn({ id: 'col-2', name: 'Problem', sortOrder: 1 }),
        createColumn({ id: 'col-3', name: 'Try', sortOrder: 2 }),
      ],
    });
    const md = generateMarkdown(board);

    expect(md).toContain('### 1行目');
    expect(md).toContain('2行目\n3行目');
  });

  it('複数参加者が正しく一覧表示される', () => {
    const board = createBoard({
      participants: [
        createParticipant({ id: 'p-1', nickname: 'Alice', isFacilitator: true }),
        createParticipant({ id: 'p-2', nickname: 'Bob', isFacilitator: false }),
        createParticipant({ id: 'p-3', nickname: 'Carol', isFacilitator: false }),
      ],
    });
    const md = generateMarkdown(board);

    expect(md).toContain('**参加者（3名）:**');
    expect(md).toContain('Alice（ファシリテーター）, Bob, Carol');
  });

  it('authorNicknameがnullの場合は「匿名」と表示される', () => {
    const card = createCard({ content: 'テスト', authorNickname: null });
    const board = createBoard({
      columns: [
        createColumn({ cards: [card] }),
        createColumn({ id: 'col-2', name: 'Problem', sortOrder: 1 }),
        createColumn({ id: 'col-3', name: 'Try', sortOrder: 2 }),
      ],
    });
    const md = generateMarkdown(board);
    expect(md).toContain('**投稿者:** 匿名');
  });

  it('フッターにRetraの記載がある', () => {
    const board = createBoard();
    const md = generateMarkdown(board);
    expect(md).toContain('_Retra で');
    expect(md).toContain('に作成_');
  });
});

describe('downloadMarkdown', () => {
  it('Blob URLを作成してダウンロードリンクをクリックする', () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:test');
    const revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    const clickMock = vi.fn();
    const appendChildMock = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const removeChildMock = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickMock,
    } as unknown as HTMLAnchorElement);

    const board = createBoard({ title: 'テストボード' });
    downloadMarkdown(board);

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:test');
    expect(appendChildMock).toHaveBeenCalled();
    expect(removeChildMock).toHaveBeenCalled();

    appendChildMock.mockRestore();
    removeChildMock.mockRestore();
  });
});

describe('copyMarkdownToClipboard', () => {
  it('クリップボードにMarkdownをコピーする', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    const board = createBoard({ title: 'コピーテスト' });
    await copyMarkdownToClipboard(board);

    expect(writeTextMock).toHaveBeenCalled();
    const calledWith = writeTextMock.mock.calls[0][0] as string;
    expect(calledWith).toContain('# コピーテスト');
  });
});
