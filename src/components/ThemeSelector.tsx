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
      if (buttonRef.current) buttonRef.current.blur();
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
          // Forzamos la pérdida de foco para limpiar cualquier estado
          (e.currentTarget as HTMLButtonElement).blur();
        }}
        className={cn(
          "p-2 rounded-md transition-all duration-200 flex items-center justify-center outline-none", 
          
          // --- LÓGICA ANTI-SOMBREADO PEGADO ---
          open && !navbarHidden 
            ? "bg-accent" // Estado Abierto: Fondo fijo
            : cn(
                "text-foreground",
                // Solo aplica hover si el dispositivo soporta hover real (Desktop)
                "[@media(hover:hover)]:hover:bg-accent",
                // Feedback visual rápido al tocar en mobile, que desaparece al soltar
                "active:bg-accent/50" 
              )
        )}
        aria-label="Toggle theme"
      >
        <CurrentIcon className="w-5 h-5" />
      </button>

      {open && !navbarHidden && (
        <div className={cn(
            "absolute right-0 top-full mt-2 min-w-[140px] py-1 z-[80]",
            "bg-card border border-border rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100"
          )}>
          <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider select-none border-b border-border/40 mb-1">
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
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-all text-left",
                  isActive 
                    ? "bg-accent/50 text-primary font-bold" 
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "text-foreground opacity-70")} />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}