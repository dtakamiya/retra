import { describe, it, expect, beforeEach } from 'vitest';
import { useBoardStore } from '../store/boardStore';
import {
  createBoard,
  createCard,
  createColumn,
  createMemo,
  createParticipant,
  createReaction,
  createVote,
  createRemainingVotes,
} from '../test/fixtures';

/**
 * ユーザー受入テスト（UAT）: Zustand Store
 *
 * 実際のレトロスペクティブセッションで発生する
 * 一連の状態遷移をシミュレートしてテストします。
 */

describe('UAT: 完全なレトロスペクティブセッションの状態遷移', () => {
  beforeEach(() => {
    useBoardStore.setState({
      board: null,
      participant: null,
      remainingVotes: null,
      timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0 },
      isConnected: false,
    });
  });

  it('ファシリテーターが全フェーズを通してレトロを完了できる', () => {
    const store = useBoardStore.getState;

    // 1. ボードをセットアップ
    const facilitator = createParticipant({ id: 'facilitator-1', nickname: 'ファシリテーター', isFacilitator: true });
    const board = createBoard({
      title: 'スプリント42 ふりかえり',
      phase: 'WRITING',
      participants: [facilitator],
    });
    store().setBoard(board);
    store().setParticipant(facilitator);
    store().setConnected(true);

    expect(store().board!.phase).toBe('WRITING');
    expect(store().board!.participants).toHaveLength(1);
    expect(store().isConnected).toBe(true);

    // 2. 記入フェーズ: カードを追加
    const card1 = createCard({ id: 'card-1', columnId: 'col-1', content: 'チーム連携が良かった', participantId: 'facilitator-1', authorNickname: 'ファシリテーター' });
    const card2 = createCard({ id: 'card-2', columnId: 'col-2', content: 'デプロイ遅延', participantId: 'facilitator-1', authorNickname: 'ファシリテーター' });
    const card3 = createCard({ id: 'card-3', columnId: 'col-3', content: 'テスト自動化', participantId: 'facilitator-1', authorNickname: 'ファシリテーター' });

    store().handleCardCreated(card1);
    store().handleCardCreated(card2);
    store().handleCardCreated(card3);

    // カードが正しいカラムに追加されたことを確認
    const columns = store().board!.columns;
    expect(columns[0].cards).toHaveLength(1);
    expect(columns[0].cards[0].content).toBe('チーム連携が良かった');
    expect(columns[1].cards).toHaveLength(1);
    expect(columns[1].cards[0].content).toBe('デプロイ遅延');
    expect(columns[2].cards).toHaveLength(1);
    expect(columns[2].cards[0].content).toBe('テスト自動化');

    // 3. 投票フェーズへ遷移
    store().handlePhaseChanged('VOTING');
    expect(store().board!.phase).toBe('VOTING');

    // 残り投票数をセット
    const remainingVotes = createRemainingVotes({ participantId: 'facilitator-1', remaining: 5, used: 0 });
    store().setRemainingVotes(remainingVotes);

    // 投票する
    const vote1 = createVote({ id: 'vote-1', cardId: 'card-1', participantId: 'facilitator-1' });
    store().handleVoteAdded(vote1);

    expect(store().board!.columns[0].cards[0].voteCount).toBe(1);
    expect(store().remainingVotes!.remaining).toBe(4);
    expect(store().remainingVotes!.used).toBe(1);

    // 4. 議論フェーズへ遷移
    store().handlePhaseChanged('DISCUSSION');
    expect(store().board!.phase).toBe('DISCUSSION');

    // メモを追加
    const memo1 = createMemo({ id: 'memo-1', cardId: 'card-2', content: 'CI/CDパイプライン改善が必要', participantId: 'facilitator-1', authorNickname: 'ファシリテーター' });
    store().handleMemoCreated(memo1);

    const problemCard = store().board!.columns[1].cards[0];
    expect(problemCard.memos).toHaveLength(1);
    expect(problemCard.memos[0].content).toBe('CI/CDパイプライン改善が必要');

    // リアクションを追加
    const reaction1 = createReaction({ id: 'r-1', cardId: 'card-1', emoji: '👍', participantId: 'facilitator-1' });
    store().handleReactionAdded(reaction1);

    expect(store().board!.columns[0].cards[0].reactions).toHaveLength(1);

    // 5. アクションフェーズへ遷移
    store().handlePhaseChanged('ACTION_ITEMS');
    expect(store().board!.phase).toBe('ACTION_ITEMS');

    // アクションメモを追加
    const memo2 = createMemo({ id: 'memo-2', cardId: 'card-3', content: '担当: 田中、期限: 次スプリント', participantId: 'facilitator-1', authorNickname: 'ファシリテーター' });
    store().handleMemoCreated(memo2);

    expect(store().board!.columns[2].cards[0].memos).toHaveLength(1);

    // 6. 完了フェーズへ遷移
    store().handlePhaseChanged('CLOSED');
    expect(store().board!.phase).toBe('CLOSED');

    // 全データが保持されていることを確認
    const finalBoard = store().board!;
    expect(finalBoard.columns[0].cards[0].content).toBe('チーム連携が良かった');
    expect(finalBoard.columns[0].cards[0].voteCount).toBe(1);
    expect(finalBoard.columns[0].cards[0].reactions).toHaveLength(1);
    expect(finalBoard.columns[1].cards[0].memos).toHaveLength(1);
    expect(finalBoard.columns[2].cards[0].memos).toHaveLength(1);
  });
});

describe('UAT: 複数参加者のリアルタイム協調', () => {
  beforeEach(() => {
    useBoardStore.setState({
      board: null,
      participant: null,
      remainingVotes: null,
      timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0 },
      isConnected: false,
    });
  });

  it('3人のチームメンバーによる同時操作が正しく反映される', () => {
    const store = useBoardStore.getState;

    // ファシリテーターがボードを作成
    const facilitator = createParticipant({ id: 'p-facilitator', nickname: 'ファシリテーター', isFacilitator: true });
    const board = createBoard({
      participants: [facilitator],
      phase: 'WRITING',
    });
    store().setBoard(board);
    store().setParticipant(facilitator);

    // メンバー2人が参加
    const member1 = createParticipant({ id: 'p-member1', nickname: '田中', isFacilitator: false });
    const member2 = createParticipant({ id: 'p-member2', nickname: '佐藤', isFacilitator: false });

    store().handleParticipantJoined(member1);
    store().handleParticipantJoined(member2);

    expect(store().board!.participants).toHaveLength(3);

    // 各メンバーがカードを追加
    store().handleCardCreated(createCard({ id: 'card-f1', columnId: 'col-1', content: 'ファシリテーターのKeep', participantId: 'p-facilitator' }));
    store().handleCardCreated(createCard({ id: 'card-m1', columnId: 'col-1', content: '田中のKeep', participantId: 'p-member1' }));
    store().handleCardCreated(createCard({ id: 'card-m2', columnId: 'col-2', content: '佐藤のProblem', participantId: 'p-member2' }));

    expect(store().board!.columns[0].cards).toHaveLength(2);
    expect(store().board!.columns[1].cards).toHaveLength(1);

    // 投票フェーズ
    store().handlePhaseChanged('VOTING');
    store().setRemainingVotes(createRemainingVotes({ participantId: 'p-facilitator', remaining: 5, used: 0 }));

    // 3人が同じカードに投票
    store().handleVoteAdded(createVote({ id: 'v1', cardId: 'card-f1', participantId: 'p-facilitator' }));
    store().handleVoteAdded(createVote({ id: 'v2', cardId: 'card-f1', participantId: 'p-member1' }));
    store().handleVoteAdded(createVote({ id: 'v3', cardId: 'card-f1', participantId: 'p-member2' }));

    // ファシリテーターの投票のみ残り投票数に影響
    expect(store().remainingVotes!.remaining).toBe(4);
    // カードの合計投票数は3
    expect(store().board!.columns[0].cards[0].voteCount).toBe(3);
    // 全参加者のIDが記録される
    expect(store().board!.columns[0].cards[0].votedParticipantIds).toContain('p-facilitator');
    expect(store().board!.columns[0].cards[0].votedParticipantIds).toContain('p-member1');
    expect(store().board!.columns[0].cards[0].votedParticipantIds).toContain('p-member2');
  });

  it('参加者の重複参加が防止される', () => {
    const store = useBoardStore.getState;

    const facilitator = createParticipant({ id: 'p-1', nickname: 'ファシリテーター' });
    const board = createBoard({ participants: [facilitator] });
    store().setBoard(board);

    // 同じ参加者が再度参加イベントを発行
    store().handleParticipantJoined(facilitator);

    expect(store().board!.participants).toHaveLength(1);
  });

  it('参加者のオンライン状態変更が正しく反映される', () => {
    const store = useBoardStore.getState;

    const p1 = createParticipant({ id: 'p-1', nickname: 'ユーザー1', isOnline: true });
    const p2 = createParticipant({ id: 'p-2', nickname: 'ユーザー2', isOnline: true });
    const board = createBoard({ participants: [p1, p2] });
    store().setBoard(board);

    // ユーザー2がオフラインに
    store().handleParticipantOffline({ participantId: 'p-2' });
    expect(store().board!.participants[1].isOnline).toBe(false);

    // ユーザー2がオンラインに復帰
    store().handleParticipantOnline({ participantId: 'p-2' });
    expect(store().board!.participants[1].isOnline).toBe(true);
  });
});

describe('UAT: カード操作のエッジケース', () => {
  beforeEach(() => {
    useBoardStore.setState({
      board: null,
      participant: null,
      remainingVotes: null,
      timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0 },
      isConnected: false,
    });
  });

  it('カード編集後に元のカードデータが保持される', () => {
    const store = useBoardStore.getState;

    const card = createCard({
      id: 'card-1',
      columnId: 'col-1',
      content: '元の内容',
      voteCount: 3,
      votedParticipantIds: ['p-1', 'p-2', 'p-3'],
      memos: [createMemo({ id: 'memo-1', cardId: 'card-1' })],
      reactions: [createReaction({ id: 'r-1', cardId: 'card-1' })],
    });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    store().setBoard(board);

    // カード更新（内容のみ変更、他のフィールドは保持）
    const updatedCard = createCard({
      id: 'card-1',
      columnId: 'col-1',
      content: '編集後の内容',
      voteCount: 3,
      votedParticipantIds: ['p-1', 'p-2', 'p-3'],
      memos: [createMemo({ id: 'memo-1', cardId: 'card-1' })],
      reactions: [createReaction({ id: 'r-1', cardId: 'card-1' })],
    });
    store().handleCardUpdated(updatedCard);

    const resultCard = store().board!.columns[0].cards[0];
    expect(resultCard.content).toBe('編集後の内容');
    expect(resultCard.voteCount).toBe(3);
    expect(resultCard.memos).toHaveLength(1);
    expect(resultCard.reactions).toHaveLength(1);
  });

  it('カード移動後にデータが一貫性を保つ', () => {
    const store = useBoardStore.getState;

    const card = createCard({
      id: 'card-1',
      columnId: 'col-1',
      content: '移動対象カード',
      voteCount: 2,
      memos: [createMemo({ id: 'memo-1', cardId: 'card-1' })],
    });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    store().setBoard(board);

    // カードを別カラムに移動
    store().handleCardMoved({
      cardId: 'card-1',
      sourceColumnId: 'col-1',
      targetColumnId: 'col-2',
      sortOrder: 0,
    });

    // 移動先でデータが保持されていることを確認
    const movedCard = store().board!.columns[1].cards[0];
    expect(movedCard.content).toBe('移動対象カード');
    expect(movedCard.voteCount).toBe(2);
    expect(movedCard.memos).toHaveLength(1);
    expect(movedCard.columnId).toBe('col-2');

    // 移動元が空になっている
    expect(store().board!.columns[0].cards).toHaveLength(0);
  });

  it('複数カードのソート順が正しく維持される', () => {
    const store = useBoardStore.getState;

    const card1 = createCard({ id: 'card-1', columnId: 'col-1', sortOrder: 0, content: '1番目' });
    const card2 = createCard({ id: 'card-2', columnId: 'col-1', sortOrder: 1, content: '2番目' });
    const card3 = createCard({ id: 'card-3', columnId: 'col-1', sortOrder: 2, content: '3番目' });

    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card1, card2, card3] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    store().setBoard(board);

    // 3番目のカードを1番目に移動
    store().handleCardMoved({
      cardId: 'card-3',
      sourceColumnId: 'col-1',
      targetColumnId: 'col-1',
      sortOrder: -1,
    });

    const cards = store().board!.columns[0].cards;
    expect(cards).toHaveLength(3);
    expect(cards[0].id).toBe('card-3');
    expect(cards[0].sortOrder).toBe(-1);
  });
});

describe('UAT: 投票の整合性', () => {
  beforeEach(() => {
    useBoardStore.setState({
      board: null,
      participant: null,
      remainingVotes: null,
      timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0 },
      isConnected: false,
    });
  });

  it('投票上限まで投票→取り消し→再投票のサイクルが正しく動作する', () => {
    const store = useBoardStore.getState;

    const card1 = createCard({ id: 'card-1', columnId: 'col-1', content: 'カード1' });
    const card2 = createCard({ id: 'card-2', columnId: 'col-1', content: 'カード2', sortOrder: 1 });
    const participant = createParticipant({ id: 'p-1' });
    const board = createBoard({
      phase: 'VOTING',
      columns: [
        createColumn({ id: 'col-1', cards: [card1, card2] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
      participants: [participant],
    });
    store().setBoard(board);
    store().setParticipant(participant);
    store().setRemainingVotes(createRemainingVotes({ participantId: 'p-1', remaining: 2, used: 0, max: 2 }));

    // 2票投票（上限到達）
    store().handleVoteAdded(createVote({ id: 'v1', cardId: 'card-1', participantId: 'p-1' }));
    store().handleVoteAdded(createVote({ id: 'v2', cardId: 'card-2', participantId: 'p-1' }));

    expect(store().remainingVotes!.remaining).toBe(0);
    expect(store().remainingVotes!.used).toBe(2);

    // 1票取り消し
    store().handleVoteRemoved({ cardId: 'card-1', participantId: 'p-1' });

    expect(store().remainingVotes!.remaining).toBe(1);
    expect(store().remainingVotes!.used).toBe(1);
    expect(store().board!.columns[0].cards[0].voteCount).toBe(0);

    // 別のカードに再投票
    store().handleVoteAdded(createVote({ id: 'v3', cardId: 'card-2', participantId: 'p-1' }));

    expect(store().remainingVotes!.remaining).toBe(0);
    expect(store().board!.columns[0].cards[1].voteCount).toBe(2);
  });

  it('投票数が0未満にならないことを確認', () => {
    const store = useBoardStore.getState;

    const card = createCard({ id: 'card-1', columnId: 'col-1', voteCount: 0 });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    store().setBoard(board);

    // 0票のカードから投票を削除しても0のまま
    store().handleVoteRemoved({ cardId: 'card-1', participantId: 'p-1' });

    expect(store().board!.columns[0].cards[0].voteCount).toBe(0);
  });
});

describe('UAT: メモ操作の完全性', () => {
  beforeEach(() => {
    useBoardStore.setState({
      board: null,
      participant: null,
      remainingVotes: null,
      timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0 },
      isConnected: false,
    });
  });

  it('メモのCRUD操作が全て正しく動作する', () => {
    const store = useBoardStore.getState;

    const card = createCard({ id: 'card-1', columnId: 'col-1', memos: [] });
    const board = createBoard({
      phase: 'DISCUSSION',
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    store().setBoard(board);

    // Create
    const memo1 = createMemo({ id: 'memo-1', cardId: 'card-1', content: '初期メモ' });
    store().handleMemoCreated(memo1);
    expect(store().board!.columns[0].cards[0].memos).toHaveLength(1);

    // Update
    const updatedMemo = createMemo({ id: 'memo-1', cardId: 'card-1', content: '編集済みメモ' });
    store().handleMemoUpdated(updatedMemo);
    expect(store().board!.columns[0].cards[0].memos[0].content).toBe('編集済みメモ');

    // Create another
    const memo2 = createMemo({ id: 'memo-2', cardId: 'card-1', content: '2番目のメモ' });
    store().handleMemoCreated(memo2);
    expect(store().board!.columns[0].cards[0].memos).toHaveLength(2);

    // Delete first memo
    store().handleMemoDeleted({ cardId: 'card-1', memoId: 'memo-1' });
    expect(store().board!.columns[0].cards[0].memos).toHaveLength(1);
    expect(store().board!.columns[0].cards[0].memos[0].id).toBe('memo-2');
  });
});

describe('UAT: リアクション操作', () => {
  beforeEach(() => {
    useBoardStore.setState({
      board: null,
      participant: null,
      remainingVotes: null,
      timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0 },
      isConnected: false,
    });
  });

  it('複数参加者が異なる絵文字でリアクションできる', () => {
    const store = useBoardStore.getState;

    const card = createCard({ id: 'card-1', columnId: 'col-1', reactions: [] });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    store().setBoard(board);

    // 3人が異なる絵文字でリアクション
    store().handleReactionAdded(createReaction({ id: 'r-1', cardId: 'card-1', emoji: '👍', participantId: 'p-1' }));
    store().handleReactionAdded(createReaction({ id: 'r-2', cardId: 'card-1', emoji: '❤️', participantId: 'p-2' }));
    store().handleReactionAdded(createReaction({ id: 'r-3', cardId: 'card-1', emoji: '👍', participantId: 'p-3' }));

    const reactions = store().board!.columns[0].cards[0].reactions;
    expect(reactions).toHaveLength(3);

    // 特定の参加者のリアクションのみ削除
    store().handleReactionRemoved({ cardId: 'card-1', participantId: 'p-1', emoji: '👍' });

    const remainingReactions = store().board!.columns[0].cards[0].reactions;
    expect(remainingReactions).toHaveLength(2);
    // p-3の👍は残っている
    expect(remainingReactions.find(r => r.participantId === 'p-3' && r.emoji === '👍')).toBeDefined();
    // p-2の❤️も残っている
    expect(remainingReactions.find(r => r.participantId === 'p-2' && r.emoji === '❤️')).toBeDefined();
  });
});

describe('UAT: タイマー状態管理', () => {
  beforeEach(() => {
    useBoardStore.setState({
      board: null,
      participant: null,
      remainingVotes: null,
      timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0 },
      isConnected: false,
    });
  });

  it('タイマーの開始・一時停止・リセットが正しく動作する', () => {
    const store = useBoardStore.getState;

    // 初期状態
    expect(store().timer.isRunning).toBe(false);

    // タイマー開始
    store().setTimer({ isRunning: true, remainingSeconds: 300, totalSeconds: 300 });
    expect(store().timer.isRunning).toBe(true);
    expect(store().timer.remainingSeconds).toBe(300);

    // タイマー更新（時間経過）
    store().setTimer({ isRunning: true, remainingSeconds: 250, totalSeconds: 300 });
    expect(store().timer.remainingSeconds).toBe(250);

    // 一時停止
    store().setTimer({ isRunning: false, remainingSeconds: 250, totalSeconds: 300 });
    expect(store().timer.isRunning).toBe(false);
    expect(store().timer.remainingSeconds).toBe(250);

    // リセット
    store().setTimer({ isRunning: false, remainingSeconds: 0, totalSeconds: 0 });
    expect(store().timer.remainingSeconds).toBe(0);
  });
});

describe('UAT: WebSocket接続状態の管理', () => {
  beforeEach(() => {
    useBoardStore.setState({
      board: null,
      participant: null,
      remainingVotes: null,
      timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0 },
      isConnected: false,
    });
  });

  it('接続状態の変化が正しく追跡される', () => {
    const store = useBoardStore.getState;

    // 初期状態: 未接続
    expect(store().isConnected).toBe(false);

    // 接続
    store().setConnected(true);
    expect(store().isConnected).toBe(true);

    // 切断
    store().setConnected(false);
    expect(store().isConnected).toBe(false);

    // 再接続
    store().setConnected(true);
    expect(store().isConnected).toBe(true);
  });

  it('接続喪失中にイベントが到着しても状態が崩れない', () => {
    const store = useBoardStore.getState;

    const card = createCard({ id: 'card-1', columnId: 'col-1' });
    const board = createBoard({
      columns: [
        createColumn({ id: 'col-1', cards: [card] }),
        createColumn({ id: 'col-2' }),
        createColumn({ id: 'col-3' }),
      ],
    });
    store().setBoard(board);
    store().setConnected(false);

    // 切断中でもイベントハンドラは動作する
    store().handleCardCreated(createCard({ id: 'card-2', columnId: 'col-2', content: '切断中のカード' }));

    expect(store().board!.columns[1].cards).toHaveLength(1);
    expect(store().board!.columns[1].cards[0].content).toBe('切断中のカード');
  });
});

describe('UAT: フレームワーク別のボード構成', () => {
  beforeEach(() => {
    useBoardStore.setState({
      board: null,
      participant: null,
      remainingVotes: null,
      timer: { isRunning: false, remainingSeconds: 0, totalSeconds: 0 },
      isConnected: false,
    });
  });

  it('4Lsフレームワークの4カラム構成が正しく処理される', () => {
    const store = useBoardStore.getState;

    const board = createBoard({
      framework: 'FOUR_LS',
      columns: [
        createColumn({ id: 'col-1', name: 'Liked', sortOrder: 0 }),
        createColumn({ id: 'col-2', name: 'Learned', sortOrder: 1 }),
        createColumn({ id: 'col-3', name: 'Lacked', sortOrder: 2 }),
        createColumn({ id: 'col-4', name: 'Longed For', sortOrder: 3 }),
      ],
    });
    store().setBoard(board);

    // 4つのカラム全てにカードを追加
    store().handleCardCreated(createCard({ id: 'card-1', columnId: 'col-1', content: 'Liked内容' }));
    store().handleCardCreated(createCard({ id: 'card-2', columnId: 'col-2', content: 'Learned内容' }));
    store().handleCardCreated(createCard({ id: 'card-3', columnId: 'col-3', content: 'Lacked内容' }));
    store().handleCardCreated(createCard({ id: 'card-4', columnId: 'col-4', content: 'Longed For内容' }));

    expect(store().board!.columns).toHaveLength(4);
    store().board!.columns.forEach(col => {
      expect(col.cards).toHaveLength(1);
    });
  });
});
