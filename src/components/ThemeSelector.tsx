import { Sun, Moon } from 'lucide-react';
import { useThemeContext } from './ThemeProvider';
import { cn } from '@/lib/utils';

export function ThemeSelector() {
  // Extraemos resolvedTheme, que siempre es 'light' o 'dark' reales
  const { setTheme, resolvedTheme } = useThemeContext();

  // Alternamos basados en el tema real que se está mostrando en la pantalla
  const toggleTheme = () => {
    const nextTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return (
    <div className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "p-2 rounded-md transition-all duration-300 flex items-center justify-center outline-none", 
          "text-foreground active:scale-90",
          "[@media(hover:hover)]:hover:bg-accent active:bg-accent/50"
        )}
        aria-label="Toggle theme"
      >
        <div className="relative w-5 h-5">
          {/* Usamos resolvedTheme para garantizar que solo uno sea visible a la vez */}
          <Sun className={cn(
            "w-5 h-5 absolute inset-0 transition-all duration-500 transform",
            resolvedTheme === 'dark' ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )} />
          <Moon className={cn(
            "w-5 h-5 absolute inset-0 transition-all duration-500 transform",
            resolvedTheme === 'light' ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )} />
        </div>
      </button>
    </div>
  );
}