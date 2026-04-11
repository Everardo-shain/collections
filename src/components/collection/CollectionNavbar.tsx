import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import { NAVIGATION_CONFIG, SITE_METADATA } from '@/config/footballConfig';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';

// Importamos el tipo para mayor seguridad
import type { NavGroup } from '@/config/footballConfig';

const [PARENT_KEY, CHILD_KEY] = NAVIGATION_CONFIG.hierarchy.map(k => k.toLowerCase());

// --- DROPDOWN DESKTOP ---
function DropdownMenu({ group, activeParent, activeChild }: { group: NavGroup; activeParent: string | null; activeChild: string | null }) {
  const [open, setOpen] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const isParentSelected = activeParent === group.label;

  return (
    <div 
      className="relative" 
      onMouseEnter={() => { clearTimeout(timeout.current); setOpen(true); }} 
      onMouseLeave={() => { timeout.current = setTimeout(() => setOpen(false), 150); }}
    >
      <button className={cn(
        "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
        isParentSelected ? 'text-primary' : 'text-foreground'
      )}>
        {group.label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-[160px] bg-card border border-border rounded-lg shadow-lg py-1.5 z-50">
          <Link 
            to={`/?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}`} 
            className={cn(
              "block px-4 py-2 text-sm hover:bg-accent/50",
              isParentSelected && !activeChild ? "text-primary font-bold" : "text-foreground font-medium"
            )}
            onClick={() => setOpen(false)}
          >
            {group.label}
          </Link>
          <div className="h-px bg-border mx-2 my-1" />
          {group.children.map((child) => {
            const isChildActive = activeParent === group.label && activeChild === child.label;
            return (
              <Link 
                key={child.label} 
                to={`/?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}&nav_${CHILD_KEY}=${encodeURIComponent(child.label)}`} 
                className={cn(
                  "block px-4 py-2 text-sm transition-colors hover:bg-accent/50",
                  isChildActive ? 'text-primary font-medium' : 'text-muted-foreground'
                )} 
                onClick={() => setOpen(false)}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Recibimos navGroups como prop desde Index.tsx
export function CollectionNavbar({ navGroups = [] }: { navGroups: NavGroup[] }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [tempSearch, setTempSearch] = useState(searchParams.get('q') || '');
  const [scrollY, setScrollY] = useState(0);
  const scrollDir = useScrollDirection();

  // Sincronizar tempSearch cuando cambia la URL (ej: al borrar filtros)
  useEffect(() => {
    setTempSearch(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else {
      document.body.style.overflow = 'unset';
      setActiveSubMenu(null);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileOpen]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHidden = scrollDir === "down" && scrollY > 100 && !mobileOpen;

  const triggerSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value.trim()) params.set('q', value.trim());
    else params.delete('q');
    
    // Al buscar, solemos querer resetear los filtros de navegación para ver todos los resultados
    navigate(`/?${params.toString()}`);
    setMobileOpen(false);
  };

  const activeParent = searchParams.get(`nav_${PARENT_KEY}`);
  const activeChild = searchParams.get(`nav_${CHILD_KEY}`);

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* TOPBAR */}
      <div className={cn("bg-secondary/50 border-b border-border transition-transform duration-300 z-50 relative", isHidden ? "-translate-y-full" : "translate-y-0")}>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-8 flex items-center justify-end">
          <Link to="/other-collections" className="text-xs text-muted-foreground hover:text-foreground">Other Collections</Link>
        </div>
      </div>

      <nav className={cn("sticky top-0 z-50 bg-card border-b border-border transition-transform duration-300", isHidden ? "-translate-y-full" : "translate-y-0")}>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            
            {/* LOGO */}
            <Link to="/" className="font-heading text-xl font-bold tracking-tight flex-shrink-0" onClick={() => setMobileOpen(false)}>
              {SITE_METADATA.title}
            </Link>

            {/* DESKTOP NAV */}
            <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
              <Link to="/" className={cn("text-sm font-medium hover:text-primary transition-colors", !activeParent && !searchParams.get('q') ? 'text-primary' : 'text-foreground')}>All</Link>
              {navGroups.map(group => (
                <DropdownMenu key={group.label} group={group} activeParent={activeParent} activeChild={activeChild} />
              ))}
            </div>

            {/* DESKTOP SEARCH + THEME */}
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center relative">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input 
                  type="text" 
                  placeholder="Search" 
                  value={tempSearch} 
                  onChange={(e) => setTempSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && triggerSearch(tempSearch)}
                  className="pl-8 pr-8 h-8 w-48 text-sm bg-background border-border focus-visible:ring-primary"
                />
                {tempSearch && (
                  <button 
                    onClick={() => { setTempSearch(''); triggerSearch(''); }} 
                    className="absolute right-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <ThemeSelector />
              
              {/* Botón Móvil */}
              <button className="md:hidden p-2 hover:bg-accent rounded-md" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* --- MENÚ MÓVIL DRILL-DOWN --- */}
          {mobileOpen && (
            <div className="md:hidden pb-6 border-t border-border pt-3 bg-card min-h-[300px] overflow-hidden relative">
              {/* SEARCH MÓVIL */}
              <div className={cn(
                "transition-all duration-300 ease-in-out px-4",
                activeSubMenu ? "-translate-x-full opacity-0 pointer-events-none absolute" : "translate-x-0 opacity-100"
              )}>
               <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="text" 
                    placeholder="Search" 
                    value={tempSearch} 
                    onChange={(e) => setTempSearch(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && triggerSearch(tempSearch)} 
                    className="pl-9 pr-9 h-9 text-sm" 
                  />
                  {tempSearch && (
                    <button onClick={() => { setTempSearch(''); triggerSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* LISTA MÓVIL PRINCIPAL */}
                <Link to="/" className={cn("block py-4 text-base font-bold border-b border-border/40", !activeParent ? "text-primary" : "text-foreground")} onClick={() => setMobileOpen(false)}>All Jerseys</Link>
                
                {navGroups.map(group => (
                  <button 
                    key={group.label}
                    onClick={() => setActiveSubMenu(group.label)}
                    className={cn(
                      "w-full flex items-center justify-between py-4 text-base font-bold border-b border-border/40",
                      activeParent === group.label ? "text-primary" : "text-foreground"
                    )}
                  >
                    {group.label}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </div>

              {/* SUBMENÚS MÓVIL (Nivel 2) */}
              {navGroups.map(group => (
                <div 
                  key={`sub-${group.label}`}
                  className={cn(
                    "transition-all duration-300 ease-in-out px-4 inset-x-0",
                    activeSubMenu === group.label ? "translate-x-0 opacity-100 relative" : "translate-x-full opacity-0 absolute pointer-events-none"
                  )}
                >
                  <button onClick={() => setActiveSubMenu(null)} className="flex items-center gap-2 py-2 text-primary font-medium mb-2 -ml-1">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <Link 
                    to={`/?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}`}
                    className={cn("block py-4 text-xl font-bold border-b border-border/40", activeParent === group.label && !activeChild ? "text-primary" : "text-foreground")}
                    onClick={() => setMobileOpen(false)}
                  >
                    {group.label}
                  </Link>
                  <div className="mt-1">
                    {group.children.map(child => (
                      <Link
                        key={child.label}
                        to={`/?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}&nav_${CHILD_KEY}=${encodeURIComponent(child.label)}`}
                        className={cn(
                          "block py-3 text-base border-b border-border/40",
                          activeParent === group.label && activeChild === child.label ? "text-primary font-bold" : "text-muted-foreground"
                        )}
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}