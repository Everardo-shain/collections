import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeContext } from './ThemeProvider';
import { useState, useRef, useEffect } from 'react';

const options = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'System', icon: Monitor },
];

export function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useThemeContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label="Toggle theme"
      >
        <CurrentIcon className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-[140px] bg-card border border-border rounded-lg shadow-lg py-1.5 z-50">
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => { setTheme(value); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-accent/50 ${
                theme === value ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
