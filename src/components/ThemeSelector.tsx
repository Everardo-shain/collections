import { Sun, Moon } from 'lucide-react';
import { useThemeContext } from './ThemeProvider';
import { cn } from '@/lib/utils';

export function ThemeSelector() {
  const { theme, setTheme } = useThemeContext();

  // Función para alternar: si es light -> dark, si es dark o system -> light
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return (
    <div className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "p-2 rounded-md transition-all duration-300 flex items-center justify-center outline-none", 
          "text-foreground active:scale-90", // Efecto de pulsación pequeña al tocar
          "[@media(hover:hover)]:hover:bg-accent active:bg-accent/50"
        )}
        aria-label="Toggle theme"
      >
        {/* Usamos una transición sutil entre iconos */}
        <div className="relative w-5 h-5">
          <Sun className={cn(
            "w-5 h-5 absolute inset-0 transition-all duration-500 transform",
            theme === 'dark' ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )} />
          <Moon className={cn(
            "w-5 h-5 absolute inset-0 transition-all duration-500 transform",
            theme === 'light' ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )} />
        </div>
      </button>
    </div>
  );
}