interface Props {
  current: number;
  max: number;
}

export function CharacterCounter({ current, max }: Props) {
  const remaining = max - current;
  const isWarning = remaining <= 200 && remaining > 0;
  const isOver = remaining <= 0;

  return (
    <span
      className={`text-[11px] tabular-nums ${
        isOver
          ? 'text-red-500 font-medium'
          : isWarning
            ? 'text-amber-500'
            : 'text-gray-400 dark:text-slate-500'
      }`}
      aria-label={`残り${remaining}文字`}
    >
      {current}/{max}
    </span>
  );
}
