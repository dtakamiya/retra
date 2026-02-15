interface Props {
  voteCount: number;
  maxVoteCount: number;
}

export function VoteProgressBar({ voteCount, maxVoteCount }: Props) {
  if (voteCount === 0 || maxVoteCount === 0) return null;
  const percentage = Math.round((voteCount / maxVoteCount) * 100);
  return (
    <div className="w-full h-1 bg-gray-50 rounded-full mt-2" data-testid="vote-progress-bar">
      <div
        className="h-full rounded-full bg-indigo-400 transition-all"
        style={{ width: `${percentage}%`, opacity: 0.4 + (percentage / 100) * 0.6 }}
        data-testid="vote-progress-fill"
      />
    </div>
  );
}
