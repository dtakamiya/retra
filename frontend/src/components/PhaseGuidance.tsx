import { useEffect, useState } from 'react';
import { X, PenLine, Vote, MessageCircle, ListChecks, Lock } from 'lucide-react';
import type { Phase } from '../types';

const AUTO_DISMISS_MS = 8000;

const PHASE_GUIDANCE: Record<Phase, { icon: React.ReactNode; message: string }> = {
  WRITING: {
    icon: <PenLine size={14} />,
    message: 'カードを追加して意見を書きましょう。Shift+Enterで改行できます。',
  },
  VOTING: {
    icon: <Vote size={14} />,
    message: 'カードに投票しましょう。気になるカードをクリックして投票できます。',
  },
  DISCUSSION: {
    icon: <MessageCircle size={14} />,
    message: '投票の多いカードから議論しましょう。メモを追加して議論内容を記録できます。',
  },
  ACTION_ITEMS: {
    icon: <ListChecks size={14} />,
    message: '議論をもとにアクションアイテムを作成しましょう。担当者と期限を設定できます。',
  },
  CLOSED: {
    icon: <Lock size={14} />,
    message: 'レトロスペクティブが完了しました。結果はスナップショットとして保存されています。',
  },
};

interface Props {
  phase: Phase;
}

function PhaseGuidanceInner({ phase }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  const guidance = PHASE_GUIDANCE[phase];

  return (
    <div
      className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-lg text-sm text-indigo-700 dark:text-indigo-300 animate-[scaleFadeIn_0.2s_ease-out]"
      role="status"
      aria-label="フェーズガイダンス"
    >
      <span className="flex-shrink-0">{guidance.icon}</span>
      <span className="flex-1">{guidance.message}</span>
      <button
        onClick={() => setVisible(false)}
        className="flex-shrink-0 p-0.5 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 rounded transition-colors"
        aria-label="ガイダンスを閉じる"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function PhaseGuidance({ phase }: Props) {
  // key=phaseでフェーズ変更時にリマウント → 自動的にvisible=trueにリセット
  return <PhaseGuidanceInner key={phase} phase={phase} />;
}
