import { Link, useSearchParams, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import { SITE_METADATA, COLLECTIONS_MAP, type NavGroup, type CollectionId } from '@/config';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';

function CategoriesMegaMenu({
  navGroups,
  activeParent,
  activeChild,
  parentKey,
  childKey,
  baseHref,
  isAllSelected,
}: {
  navGroups: NavGroup[];
  activeParent: string | null;
  activeChild: string | null;
  parentKey: string;
  childKey: string;
  baseHref: string;
  isAllSelected: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 1. BLOQUEO DE SCROLL DEL FONDO SIN MODIFICAR overflow DEL BODY (evita layout shift)
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const preventBackgroundScroll = (e: Event) => {
      const target = e.target as Node | null;
      if (menuRef.current && target && menuRef.current.contains(target)) {
        // Permitir scroll dentro del menú
        return;
      }
      e.preventDefault();
    };

    window.addEventListener('keydown', handleEsc);
    window.addEventListener('wheel', preventBackgroundScroll, { passive: false });
    window.addEventListener('touchmove', preventBackgroundScroll, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('wheel', preventBackgroundScroll);
      window.removeEventListener('touchmove', preventBackgroundScroll);
    };
  }, [isOpen]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="h-full flex items-center static" ref={menuRef}>
      {/* BOTÓN CATEGORÍAS */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200",
          "hover:bg-accent active:scale-95",
          isOpen && "bg-accent"
        )}
      >
        <div className="relative w-5 h-5 flex items-center justify-center">
          <Menu className={cn(
            "w-5 h-5 absolute transition-all duration-300",
            isOpen ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0"
          )} />
          <X className={cn(
            "w-5 h-5 absolute transition-all duration-300",
            isOpen ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"
          )} />
        </div>
        <span className="text-sm font-medium">Categories</span>
      </button>

    {isOpen && (
      <>
        {/* OVERLAY */}
        <div className="fixed inset-0 top-[calc(3.5rem+1px)] bg-background/80 backdrop-blur-sm z-40 animate-in fade-in duration-300 md:block hidden" />
        
        {/* MENÚ CONTENEDOR */}
        <div className={cn(
          "absolute top-[calc(100%+1px)] left-0 w-full bg-card border-b border-border shadow-2xl z-50",
          "animate-in fade-in slide-in-from-top-1 duration-200",
          "max-h-[calc(100vh-3.5rem-1px)] overflow-y-auto",
          "custom-scrollbar"
        )}>
          {/* 1. REDUCCIÓN DE ESPACIO: py-10 a pt-6 pb-10 */}
          <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-4 pb-10">
  
          {/* SECCIÓN ALL ITEMS: Sin líneas, solo tipografía limpia */}
            <div className="mb-8">
              <Link
                to={baseHref}
                className={cn(
                  "text-[11px] font-bold tracking-[0.15em] uppercase transition-all inline-block",
                  "no-underline hover:underline decoration-primary decoration-2 underline-offset-8",
                  isAllSelected ? "text-primary" : "text-foreground"
                )}
                onClick={() => setIsOpen(false)}
              >
                All Items
              </Link>
            </div>

            {/* GRID DE CATEGORÍAS */}
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-x-12 space-y-10">
              {navGroups.map((group) => (
                <div key={group.label} className="break-inside-avoid-column">
                  <Link
                    to={`${baseHref}?nav_${parentKey}=${encodeURIComponent(group.label)}`}
                    className={cn(
                      "text-base font-bold leading-tight block mb-3 transition-all",
                      "no-underline hover:underline decoration-primary decoration-2 underline-offset-4",
                      activeParent === group.label && !activeChild 
                        ? "text-primary" 
                        : "text-foreground"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {group.label}
                  </Link>
                  
                  {group.children.length > 0 && (
                    <ul className="flex flex-col space-y-2.5">
                      {group.children.map((child) => (
                        <li key={child.label}>
                          <Link
                            to={`${baseHref}?nav_${parentKey}=${encodeURIComponent(group.label)}&nav_${childKey}=${encodeURIComponent(child.label)}`}
                            className={cn(
                              "text-sm line-clamp-2 transition-all",
                              "no-underline hover:underline decoration-primary decoration-1 underline-offset-4",
                              activeParent === group.label && activeChild === child.label 
                                ? "text-primary font-semibold" 
                                : "text-muted-foreground"
                            )}
                            onClick={() => setIsOpen(false)}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    )}
    </div>
  );
}

export function CollectionNavbar({ navGroups = [], isHome = false }: { navGroups?: NavGroup[], isHome?: boolean }) {
  const { collectionId } = useParams<{ collectionId: CollectionId }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [tempSearch, setTempSearch] = useState(searchParams.get('q') || '');
  const [scrollY, setScrollY] = useState(0);
  const scrollDir = useScrollDirection();

  const config = collectionId ? COLLECTIONS_MAP[collectionId] : null;
  const baseHref = isHome ? "/" : `/view/${collectionId}`;
  const collectionTitle = isHome ? SITE_METADATA.title : (config as any)?.metadata?.title || SITE_METADATA.title;
  const logoUrl = isHome ? SITE_METADATA.logo : (config as any)?.metadata?.logo;

  const PARENT_KEY = config?.NAVIGATION_CONFIG.hierarchy[0]?.toLowerCase() || "parent";
  const CHILD_KEY = config?.NAVIGATION_CONFIG.hierarchy[1]?.toLowerCase() || "child";

  const getActiveFilter = (key: string) => {
    const urlParam = searchParams.get(key);
    if (urlParam) return urlParam;
    if (location.state?.returnSearch) {
      const stateParams = new URLSearchParams(location.state.returnSearch);
      return stateParams.get(key);
    }
    return null;
  };

  const activeParent = getActiveFilter(`nav_${PARENT_KEY}`);
  const activeChild = getActiveFilter(`nav_${CHILD_KEY}`);
  const activeQ = searchParams.get('q') || (location.state?.returnSearch ? new URLSearchParams(location.state.returnSearch).get('q') : null);
  const isAllSelected = !activeParent && !activeQ;

  useEffect(() => {
    setTempSearch(searchParams.get('q') || '');
  }, [searchParams]);

  // Manejo de scroll móvil
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else { document.body.style.overflow = 'unset'; setActiveSubMenu(null); }
  }, [mobileOpen]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHidden = scrollDir === "down" && scrollY > 100 && !mobileOpen && !isHome;

  const triggerSearch = (value: string) => {
    const params = new URLSearchParams();
    const cleanValue = value.trim();
    if (cleanValue) {
      params.set('q', cleanValue);
      navigate(`${baseHref}?${params.toString()}`);
    } else {
      navigate(baseHref);
    }
    setMobileOpen(false);
  };

  return (
    <>
      {!isHome && (
        <div className={cn(
          "bg-secondary/50 transition-transform duration-300 z-30 relative", 
          isHidden ? "-translate-y-full" : "translate-y-0"
        )}>
          <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-8 flex items-center justify-end">
            <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
              Other Collections
            </Link>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 md:hidden animate-in fade-in duration-300",
          isHidden || isHome ? "top-0" : "top-8"
        )} onClick={() => setMobileOpen(false)} />
      )}

      <nav className={cn(
        "sticky top-0 z-50 bg-card border-b border-border transition-transform duration-300",
        isHidden ? "-translate-y-full" : "translate-y-0"
      )}>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            
            {/* LOGO */}
            <div className="flex-1 flex items-center min-w-0"> 
              <Link to={baseHref} className="font-heading text-lg md:text-xl font-bold tracking-tight flex items-center gap-2 md:gap-3 group truncate" onClick={() => setMobileOpen(false)}>
                {logoUrl && (
                  <div className="h-7 w-7 md:h-9 md:w-9 bg-primary shrink-0"
                    style={{
                      maskImage: `url(${logoUrl})`, WebkitMaskImage: `url(${logoUrl})`,
                      maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                      maskPosition: 'center', WebkitMaskPosition: 'center',
                      maskSize: 'contain', WebkitMaskSize: 'contain',
                    }}
                  />
                )}
                <span className="leading-none text-primary truncate">{collectionTitle}</span>
              </Link>
            </div>

            {/* ACCIONES DESKTOP */}
            <div className="flex items-center gap-1 md:gap-4 shrink-0">
              {!isHome && (
                <>
                  {/* Buscador primero */}
                  <div className="hidden md:flex items-center relative">
                    <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Search"
                      value={tempSearch}
                      onChange={(e) => setTempSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && triggerSearch(tempSearch)}
                      className="pl-8 pr-8 h-9 w-48 lg:w-64 text-sm bg-secondary/20 border-border focus-visible:ring-primary"
                    />
                    {tempSearch && (
                      <button onClick={() => { setTempSearch(''); triggerSearch(''); }} className="absolute right-2 text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Mega Menú segundo (a la derecha del search) */}
                  <div className="hidden md:block">
                    <CategoriesMegaMenu 
                      navGroups={navGroups}
                      activeParent={activeParent}
                      activeChild={activeChild}
                      parentKey={PARENT_KEY}
                      childKey={CHILD_KEY}
                      baseHref={baseHref}
                      isAllSelected={isAllSelected}
                    />
                  </div>
                </>
              )}
              
              <ThemeSelector navbarHidden={isHidden} />
              
              {!isHome && (
                <button className="md:hidden p-2 hover:bg-accent rounded-md relative z-[71]" onClick={() => setMobileOpen(!mobileOpen)}>
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>

          {/* MENÚ MÓVIL (Sin cambios, ya manejaba su propio scroll) */}
          {!isHome && mobileOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 w-full bg-card border-b border-border shadow-2xl z-50 overflow-hidden">
              <div className="max-h-[75vh] overflow-y-auto pb-8 pt-3 relative">
                <div className={cn("transition-all duration-300 px-4", activeSubMenu ? "hidden" : "block")}>
                  <div className="relative mb-4 flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search" value={tempSearch} onChange={(e) => setTempSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && triggerSearch(tempSearch)} className="pl-9 h-10 w-full bg-background" />
                  </div>
                  <Link to={baseHref} className={cn("block py-4 text-base font-bold border-b border-border/40", isAllSelected && "text-primary")} onClick={() => setMobileOpen(false)}>All Items</Link>
                  {navGroups.map(group => (
                    <button key={group.label} onClick={() => setActiveSubMenu(group.label)} className={cn("w-full flex items-center justify-between py-4 text-base font-bold border-b border-border/40", activeParent === group.label && "text-primary")}>
                      {group.label} <ChevronRight className="w-4 h-4" />
                    </button>
                  ))}
                </div>
                {navGroups.map(group => (
                  <div key={`sub-${group.label}`} className={cn("px-4", activeSubMenu === group.label ? "block" : "hidden")}>
                    <button onClick={() => setActiveSubMenu(null)} className="flex items-center gap-2 py-2 text-primary font-medium mb-2"><ChevronLeft className="w-4 h-4" /> Back</button>
                    <Link to={`${baseHref}?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}`} className={cn("block py-4 text-xl font-bold border-b", activeParent === group.label && !activeChild && "text-primary")} onClick={() => setMobileOpen(false)}>{group.label}</Link>
                    {group.children.map(child => (
                      <Link key={child.label} to={`${baseHref}?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}&nav_${CHILD_KEY}=${encodeURIComponent(child.label)}`}
                        className={cn("block py-3.5 text-base border-b border-border/40 last:border-0", activeParent === group.label && activeChild === child.label && "text-primary font-bold")} onClick={() => setMobileOpen(false)}>{child.label}</Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}