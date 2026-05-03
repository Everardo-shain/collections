import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Menu, X, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import { SITE_METADATA, COLLECTIONS_MAP, type NavGroup, type CollectionId } from '@/config';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';

function SmartTitle({ title }: { title: string }) {
  const words = title.split(' ');
  if (words.length < 2) {
    return <span className="leading-none text-primary-foreground font-black uppercase italic text-xl">{title}</span>;
  }
  const firstWord = words[0];
  const restOfTitle = words.slice(1).join(' ');

  return (
    <div className="flex flex-col leading-[1] py-0.5 uppercase text-primary-foreground">
      <span className="text-[10px] md:text-[12px] font-medium tracking-[0.2em] opacity-80">{firstWord}</span>
      <span className="text-[16px] md:text-[22px] font-black tracking-tight">{restOfTitle}</span>
    </div>
  );
}

// ... CategoriesMegaMenu se mantiene igual (solo se usa en desktop) ...
function CategoriesMegaMenu({ navGroups, activeParent, activeChild, parentKey, childKey, baseHref, isAllSelected }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
      window.addEventListener('keydown', handleEsc);
      return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handleEsc); };
    }
  }, [isOpen]);

  return (
    <div className="h-full flex items-center static" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className={cn("flex items-center gap-2 px-3 py-2 rounded-md transition-all hover:bg-accent", isOpen ? "bg-accent" : "bg-transparent")}>
        <div className="relative w-5 h-5 flex items-center justify-center">
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </div>
        <span className="text-sm font-medium">Categories</span>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 top-[3.5rem] bg-black/20 backdrop-blur-sm z-40 hidden md:block" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 w-full bg-card border-b border-border z-50 animate-in fade-in slide-in-from-top-0 duration-200 shadow-xl overflow-y-auto max-h-[calc(100vh-3.5rem)]">
            <div className="max-w-[1440px] mx-auto px-8 pt-6 pb-10">
              <div className="mb-8">
                <Link to={baseHref} className={cn("text-[11px] font-bold tracking-widest uppercase hover:underline underline-offset-8", isAllSelected ? "text-primary" : "text-foreground")} onClick={() => setIsOpen(false)}>All Items</Link>
              </div>
              <div className="columns-5 gap-x-12 space-y-10">
                {navGroups.map((group: any) => (
                  <div key={group.label} className="break-inside-avoid">
                    <Link to={`${baseHref}?nav_${parentKey}=${encodeURIComponent(group.label)}`} className={cn("text-base font-bold block mb-3 hover:text-primary", activeParent === group.label && !activeChild ? "text-primary" : "text-foreground")} onClick={() => setIsOpen(false)}>{group.label}</Link>
                    <ul className="flex flex-col space-y-2">
                      {group.children.map((child: any) => (
                        <li key={child.label}>
                          <Link to={`${baseHref}?nav_${parentKey}=${encodeURIComponent(group.label)}&nav_${childKey}=${encodeURIComponent(child.label)}`} className={cn("text-sm hover:text-primary", activeParent === group.label && activeChild === child.label ? "text-primary font-semibold" : "text-muted-foreground")} onClick={() => setIsOpen(false)}>{child.label}</Link>
                        </li>
                      ))}
                    </ul>
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
  const navigate = useNavigate();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false); // Estado para la lupa
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

  const activeParent = searchParams.get(`nav_${PARENT_KEY}`);
  const activeChild = searchParams.get(`nav_${CHILD_KEY}`);
  const isAllSelected = !activeParent && !searchParams.get('q');

  useEffect(() => {
    if (mobileOpen || searchOpen) document.body.style.overflow = 'hidden';
    else { document.body.style.overflow = 'unset'; setActiveSubMenu(null); }
  }, [mobileOpen, searchOpen]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHidden = scrollDir === "down" && scrollY > 100 && !mobileOpen && !searchOpen && !isHome;

  const triggerSearch = (value: string) => {
    const params = new URLSearchParams();
    if (value.trim()) params.set('q', value.trim());
    navigate(`${baseHref}?${params.toString()}`);
    setSearchOpen(false);
  };

  return (
    <>
      {!isHome && (
        <div className={cn("bg-secondary/50 transition-transform duration-300 z-30 relative", isHidden ? "-translate-y-full" : "translate-y-0")}>
          <div className="max-w-[1440px] mx-auto px-4 h-8 flex items-center justify-end">
            <Link to="/" className="text-xs text-muted-foreground hover:text-primary font-medium">Other Collections</Link>
          </div>
        </div>
      )}

      {(mobileOpen || searchOpen) && (
        <div className={cn("fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 md:hidden animate-in fade-in duration-300", isHidden || isHome ? "top-0" : "top-8")} 
             onClick={() => { setMobileOpen(false); setSearchOpen(false); }} />
      )}

      <nav className={cn("sticky top-0 z-[60] bg-card border-b border-border transition-transform duration-300", isHidden ? "-translate-y-full" : "translate-y-0")}>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 relative z-[61] h-14">
          <div className="flex items-center justify-between h-full gap-2">
            
            {/* LOGO AREA */}
            <div className="flex-none md:flex-1 flex items-center min-w-0 h-full"> 
              <Link to={baseHref} className="relative flex items-center gap-2 md:gap-3 h-[calc(100%-1px)] px-4 lg:px-8 -ml-4 lg:-ml-8 pr-12 group" onClick={() => { setMobileOpen(false); setSearchOpen(false); }}>
                <div className="absolute inset-y-0 left-0 right-0 bg-primary z-0" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }} />
                {logoUrl && (
                  <div className="relative z-10 h-7 w-7 md:h-9 md:w-9 bg-primary-foreground shrink-0"
                    style={{ maskImage: `url(${logoUrl})`, WebkitMaskImage: `url(${logoUrl})`, maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center', maskSize: 'contain', WebkitMaskSize: 'contain' }}
                  />
                )}
                <div className="relative z-10 min-w-0"><SmartTitle title={collectionTitle} /></div>
              </Link>
            </div>

            {/* ACCIONES */}
            <div className="flex items-center gap-1 md:gap-4 shrink-0 h-full">
              {!isHome && (
                <>
                  {/* Desktop Search */}
                  <div className="hidden md:flex items-center relative">
                    <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input 
                      type="text" 
                      placeholder="Search" 
                      value={tempSearch} 
                      onChange={(e) => setTempSearch(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && triggerSearch(tempSearch)} 
                      className="pl-8 h-9 w-48 lg:w-64 bg-secondary/20 border-border focus-visible:ring-primary" 
                    />
                  </div>

                  {/* Desktop Mega Menu */}
                  <div className="hidden md:block h-full">
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

                  {/* MOBILE ICONS: Search -> Hamburguesa -> Theme */}
                  <div className="flex items-center gap-0.5 md:hidden">
                    {/* Botón Search */}
                    <button 
                      className={cn(
                        "p-2 rounded-md transition-all duration-200 outline-none",
                        searchOpen ? "bg-accent text-foreground" : "text-foreground active:bg-accent/50"
                      )} 
                      onClick={(e) => { 
                        setSearchOpen(!searchOpen); 
                        setMobileOpen(false);
                        (e.currentTarget as HTMLButtonElement).blur();
                      }}
                    >
                      <Search className="w-5 h-5" />
                    </button>

                    {/* Botón Categories (Hamburguesa) */}
                    <button 
                      className={cn(
                        "p-2 rounded-md transition-all duration-200 outline-none",
                        mobileOpen ? "bg-accent text-foreground" : "text-foreground active:bg-accent/50"
                      )} 
                      onClick={(e) => { 
                        setMobileOpen(!mobileOpen); 
                        setSearchOpen(false);
                        (e.currentTarget as HTMLButtonElement).blur();
                      }}
                    >
                      {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                  </div>
                </>
              )}
              
              {/* ThemeSelector (Ahora con icono de 20px y sin scale-95 para igualar) */}
              <div className="flex items-center h-full">
                <ThemeSelector navbarHidden={isHidden} />
              </div>
            </div>
          </div>

          {/* PANEL DE BÚSQUEDA MÓVIL (MODO LUPA) */}
          {!isHome && searchOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 w-full bg-card border-b border-border shadow-2xl z-50 animate-in slide-in-from-top-0 duration-200">
              <div className="p-4 bg-card">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    autoFocus
                    placeholder="Search in collection..." 
                    value={tempSearch} 
                    onChange={(e) => setTempSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && triggerSearch(tempSearch)} 
                    className="pl-9 h-11 w-full bg-background border-primary/20 focus-visible:ring-primary" 
                  />
                  {tempSearch && (
                    <button onClick={() => setTempSearch('')} className="absolute right-3 p-1">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MENÚ DE CATEGORÍAS MÓVIL (MODO HAMBURGUESA) */}
          {!isHome && mobileOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 w-full bg-card border-b border-border shadow-2xl z-50 animate-in slide-in-from-top-0 duration-200">
              <div className="max-h-[75vh] overflow-y-auto pb-8 pt-2 relative">
                {/* Vista Principal */}
                <div className={cn("px-4 transition-all", activeSubMenu ? "hidden" : "block")}>
                  <Link to={baseHref} className={cn("block py-4 text-base font-bold border-b border-border/40", isAllSelected && "text-primary")} onClick={() => setMobileOpen(false)}>All Items</Link>
                  {navGroups.map(group => (
                    <button key={group.label} onClick={() => setActiveSubMenu(group.label)} className={cn("w-full flex items-center justify-between py-4 text-base font-bold border-b border-border/40", activeParent === group.label && "text-primary")}>
                      {group.label} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
                {/* Vista Submenú */}
                {navGroups.map(group => (
                  <div key={`sub-${group.label}`} className={cn("px-4 animate-in slide-in-from-right-4 duration-200", activeSubMenu === group.label ? "block" : "hidden")}>
                    <button onClick={() => setActiveSubMenu(null)} className="flex items-center gap-2 py-3 text-primary font-medium mb-2"><ChevronLeft className="w-4 h-4" /> Back to Categories</button>
                    <Link to={`${baseHref}?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}`} className={cn("block py-4 text-xl font-black border-b border-border uppercase italic", activeParent === group.label && !activeChild && "text-primary")} onClick={() => setMobileOpen(false)}>{group.label}</Link>
                    {group.children.map(child => (
                      <Link key={child.label} to={`${baseHref}?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}&nav_${CHILD_KEY}=${encodeURIComponent(child.label)}`}
                        className={cn("block py-4 text-base border-b border-border/40 last:border-0", activeParent === group.label && activeChild === child.label && "text-primary font-bold")} onClick={() => setMobileOpen(false)}>{child.label}</Link>
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