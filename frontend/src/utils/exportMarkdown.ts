import type { Board } from '../types';

const PHASE_LABELS: Record<string, string> = {
  WRITING: '記入',
  VOTING: '投票',
  DISCUSSION: '議論',
  ACTION_ITEMS: 'アクションアイテム',
  CLOSED: '完了',
};

const FRAMEWORK_LABELS: Record<string, string> = {
  KPT: 'KPT',
  FUN_DONE_LEARN: 'Fun Done Learn',
  FOUR_LS: '4Ls',
  START_STOP_CONTINUE: 'Start Stop Continue',
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function generateMarkdown(board: Board): string {
  const lines: string[] = [];

  lines.push(`# ${board.title}`);
  lines.push('');

  const framework = FRAMEWORK_LABELS[board.framework] ?? board.framework;
  const phase = PHASE_LABELS[board.phase] ?? board.phase;
  const date = formatDate(board.createdAt);
  lines.push(`**フレームワーク:** ${framework} | **フェーズ:** ${phase} | **作成日:** ${date}`);
  lines.push('');

  const participantNames = board.participants.map((p) =>
    p.isFacilitator ? `${p.nickname}（ファシリテーター）` : p.nickname
  );
  lines.push(`**参加者（${board.participants.length}名）:** ${participantNames.join(', ')}`);
  lines.push('');

  const sortedColumns = [...board.columns].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const column of sortedColumns) {
    lines.push('---');
    lines.push('');
    lines.push(`## ${column.name}（${column.cards.length}枚）`);
    lines.push('');

    const sortedCards = [...column.cards].sort((a, b) => {
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
      return a.sortOrder - b.sortOrder;
    });

    if (sortedCards.length === 0) {
      lines.push('_カードなし_');
      lines.push('');
      continue;
    }

    for (const card of sortedCards) {
      const contentFirstLine = card.content.split('\n')[0];
      lines.push(`### ${contentFirstLine}`);
      lines.push('');

      if (card.content.includes('\n')) {
        const rest = card.content.split('\n').slice(1).join('\n');
        lines.push(rest);
        lines.push('');
      }

      const author = card.authorNickname ?? '匿名';
      lines.push(`- **投稿者:** ${author} | **投票:** ${card.voteCount}票`);

      if (card.reactions.length > 0) {
        const emojiCounts = new Map<string, number>();
        for (const r of card.reactions) {
          emojiCounts.set(r.emoji, (emojiCounts.get(r.emoji) ?? 0) + 1);
        }
        const emojiSummary = Array.from(emojiCounts.entries())
          .map(([emoji, count]) => `${emoji} ${count}`)
          .join(' ');
        lines.push(`- **リアクション:** ${emojiSummary}`);
      }

      if (card.memos.length > 0) {
        lines.push('- **メモ:**');
        for (const memo of card.memos) {
          const memoAuthor = memo.authorNickname ?? '匿名';
          lines.push(`  - ${memo.content} _(${memoAuthor})_`);
        }
      }

      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');
  lines.push(`_Retra で ${date} に作成_`);
  lines.push('');

  return lines.join('\n');
}

export async function copyMarkdownToClipboard(board: Board): Promise<void> {
  const markdown = generateMarkdown(board);
  await navigator.clipboard.writeText(markdown);
}
