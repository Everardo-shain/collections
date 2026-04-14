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
        }}
        className={cn(
          "p-2 rounded-md transition-all duration-150 flex items-center justify-center outline-none bg-transparent", 
          
          // --- LÓGICA DEL BOTÓN PRINCIPAL ---
          // Solo cambia el FONDO (gris/accent). El icono NO cambia de color.
          open && !navbarHidden 
            ? "bg-accent scale-95" 
            : cn(
                "[@media(hover:hover)]:hover:bg-accent",
                "active:bg-accent active:scale-95"
              ),
          
          "focus:outline-none"
        )}
        aria-label="Toggle theme"
      >
        {/* El icono siempre mantiene el color de texto base (negro en light, blanco en dark) */}
        <CurrentIcon className="w-[18px] h-[18px] text-foreground" />
      </button>

      {open && !navbarHidden && (
        <div 
          className={cn(
            "absolute right-0 top-full mt-2 min-w-[140px] py-1 z-[80]",
            "bg-card border border-border rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100"
          )}
        >
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
                  // --- LÓGICA DEL MENÚ DESPLEGABLE ---
                  // Aquí sí usamos primary para la opción seleccionada
                  isActive 
                    ? "bg-accent/50 text-primary font-bold" 
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                {/* El icono del menú también se vuelve primary si está seleccionado */}
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