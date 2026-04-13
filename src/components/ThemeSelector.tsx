import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeContext } from './ThemeProvider';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const options = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'System', icon: Monitor },
];

interface ThemeSelectorProps {
  navbarHidden?: boolean;
}

export function ThemeSelector({ navbarHidden }: ThemeSelectorProps) {
  const { theme, setTheme } = useThemeContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (navbarHidden) {
      setOpen(false);
      // "Blur" saca el foco del elemento. 
      // setTimeout asegura que ocurra después del ciclo de renderizado.
      setTimeout(() => {
        if (buttonRef.current) buttonRef.current.blur();
      }, 0);
    }
  }, [navbarHidden]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentOption = options.find(opt => opt.value === theme) || options[2];
  const CurrentIcon = currentOption.icon;

  return (
    <div ref={ref} className="relative z-[70]">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        // Eliminamos clases de hover/focus nativas que puedan dar problemas
        // y controlamos el estilo manualmente.
        className={cn(
          "p-2 rounded-md transition-all duration-200 flex items-center justify-center outline-none",
          "text-muted-foreground",
          // Solo mostramos el estado "activo" si está abierto Y el navbar no está oculto
          open && !navbarHidden 
            ? "bg-accent text-foreground shadow-sm" 
            : "hover:bg-accent/50 hover:text-foreground focus:bg-transparent"
        )}
        aria-label="Toggle theme"
      >
        <CurrentIcon className="w-[18px] h-[18px]" />
      </button>

      {open && !navbarHidden && (
        <div 
          className={cn(
            "absolute right-0 top-full mt-2 min-w-[130px] py-1 z-[80]",
            "bg-card border border-border rounded-lg shadow-xl",
            "animate-in fade-in zoom-in-95 duration-100"
          )}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider select-none">
            Appearance
          </div>

          {options.map(({ value, label, icon: Icon }) => {
            const isActive = theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                  buttonRef.current?.blur();
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-all",
                  isActive 
                    ? "bg-accent text-primary font-semibold" 
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "w-3.5 h-3.5", 
                  isActive ? "text-primary" : "opacity-70"
                )} />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}