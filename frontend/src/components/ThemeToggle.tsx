import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import type { Theme } from '../store/themeStore';

const THEMES: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'ライト' },
  { value: 'dark', icon: Moon, label: 'ダーク' },
  { value: 'system', icon: Monitor, label: 'システム' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 dark:bg-slate-800 rounded-lg">
      {THEMES.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`p-1.5 rounded-md transition-all ${
            theme === value
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
          }`}
          title={label}
          aria-label={`${label}モードに切り替え`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
