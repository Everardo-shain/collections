import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Search } from 'lucide-react';
import { NAV_GROUPS, NAVIGATION_CONFIG } from '@/config/footballConfig';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';

// --- HELPERS PARA DINAMISMO ---
const [PARENT_KEY, CHILD_KEY] = NAVIGATION_CONFIG.hierarchy.map(k => k.toLowerCase());

function DropdownMenu({
  group,
  activeParent,
  activeChild,
}: {
  group: (typeof NAV_GROUPS)[0];
  activeParent: string | null;
  activeChild: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  // Lógica de "isActive" dinámica basada en las keys de la jerarquía
  const isActive = group.children.some(
    c => c[PARENT_KEY] === activeParent && (!activeChild || c[CHILD_KEY] === activeChild)
  );

  const handleEnter = () => {
    clearTimeout(timeout.current);
    setOpen(true);
  };
  const handleLeave = () => {
    timeout.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => () => clearTimeout(timeout.current), []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
          isActive ? 'text-primary' : 'text-muted-foreground'
        )}
        onClick={() => setOpen(!open)}
      >
        {group.label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-[160px] bg-card border border-border rounded-lg shadow-lg py-1.5 z-50">
          {/* Link para "All" de la categoría padre */}
          <Link
            to={`/?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}`}
            className="block px-4 py-2 text-sm text-foreground font-medium hover:bg-accent/50 transition-colors"
            onClick={() => setOpen(false)}
          >
            All {group.label}
          </Link>
          <div className="h-px bg-border mx-2 my-1" />
          {group.children.map(child => (
            <Link
              key={child.label}
              to={`/?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}&nav_${CHILD_KEY}=${encodeURIComponent(child.label)}`}
              className={cn(
                "block px-4 py-2 text-sm transition-colors hover:bg-accent/50",
                activeParent === group.label && activeChild === child.label
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              )}
              onClick={() => setOpen(false)}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function CollectionNavbar() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 1. Estado local compartido para ambos inputs
  const [tempSearch, setTempSearch] = useState(searchParams.get('q') || '');
  const [scrollY, setScrollY] = useState(0);
  const scrollDir = useScrollDirection();

  // Sincronizar el input si los params cambian externamente
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Función única para ejecutar la búsqueda
  const triggerSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value.trim()) params.set('q', value.trim());
    else params.delete('q');
    navigate(`/?${params.toString()}`);
    setMobileOpen(false); // Cerramos el menú móvil si estaba abierto
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      triggerSearch(tempSearch);
    }
  };

  const activeParent = searchParams.get(`nav_${PARENT_KEY}`);
  const activeChild = searchParams.get(`nav_${CHILD_KEY}`);

  const isHidden = scrollDir === "down" && scrollY > 100;
  return (
    <>
      {/* Banner superior (Other Collections) */}
      <div className={cn(
        "bg-secondary/50 border-b border-border transition-transform duration-300 ease-in-out",
        isHidden ? "-translate-y-full" : "translate-y-0"
      )}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-end h-8">
          <Link to="/other-collections" className="text-xs text-muted-foreground hover:text-foreground">
            Other Collections
          </Link>
        </div>
      </div>

      <nav className={cn(
        "sticky top-0 z-50 bg-card border-b border-border transition-transform duration-300 ease-in-out",
        // Aquí aplicamos la nueva lógica
        isHidden ? "-translate-y-full" : "translate-y-0"
      )}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="font-heading text-xl font-bold tracking-tight text-foreground">
              Everardo´s Football Collection
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className={cn("text-sm font-medium transition-colors hover:text-primary", !activeParent ? 'text-primary' : 'text-muted-foreground')}>
                All
              </Link>
              {NAV_GROUPS.map(group => (
                <DropdownMenu key={group.label} group={group} activeParent={activeParent} activeChild={activeChild} />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* --- DESKTOP SEARCH --- */}
              <div className="hidden md:flex items-center relative">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search"
                  value={tempSearch}
                  onChange={(e) => setTempSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-8 pr-8 h-8 w-48 text-sm bg-background focus-visible:ring-primary"
                />
                {tempSearch && (
                  <button onClick={() => { setTempSearch(''); triggerSearch(''); }} className="absolute right-2 text-muted-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <ThemeSelector />
              <button className="md:hidden p-2 text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* --- MOBILE MENU --- */}
          {mobileOpen && (
            <div className="md:hidden pb-4 border-t border-border pt-3 space-y-1">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search"
                  value={tempSearch} // 🔥 Ahora usa tempSearch
                  onChange={(e) => setTempSearch(e.target.value)} // 🔥 Solo actualiza estado
                  onKeyDown={handleKeyDown} // 🔥 Solo busca al dar Enter
                  className="pl-9 pr-9 h-9 text-sm"
                />
                {tempSearch && (
                  <button 
                    onClick={() => { setTempSearch(''); triggerSearch(''); }} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Link to="/" className="block py-1.5 text-sm font-medium text-foreground" onClick={() => setMobileOpen(false)}>
                All
              </Link>
              {NAV_GROUPS.map(group => (
                <MobileNavGroup
                  key={group.label}
                  group={group}
                  activeParent={activeParent}
                  activeChild={activeChild}
                  onClose={() => setMobileOpen(false)}
                />
              ))}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

function MobileNavGroup({
  group,
  activeParent,
  activeChild,
  onClose,
}: {
  group: (typeof NAV_GROUPS)[0];
  activeParent: string | null;
  activeChild: string | null;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        className={cn(
          "w-full flex items-center justify-between py-1.5 text-sm font-medium",
          activeParent === group.label ? "text-primary" : "text-muted-foreground"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {group.label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="pl-4 space-y-1">
          <Link
            to={`/?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}`}
            className="block py-1 text-sm text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            All {group.label}
          </Link>
          {group.children.map(child => (
            <Link
              key={child.label}
              to={`/?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}&nav_${CHILD_KEY}=${encodeURIComponent(child.label)}`}
              className={cn(
                "block py-1 text-sm transition-colors",
                activeParent === group.label && activeChild === child.label 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground"
              )}
              onClick={onClose}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}