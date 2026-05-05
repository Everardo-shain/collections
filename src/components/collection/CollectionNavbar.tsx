import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Menu, X, ChevronRight, ChevronLeft, Search, ArrowRight } from 'lucide-react';
import { SITE_METADATA, COLLECTIONS_MAP, type NavGroup, type CollectionId } from '@/config';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

// --- SUB-COMPONENTE: SMART TITLE ---
function SmartTitle({ title }: { title: string }) {
  const words = title.split(' ');
  if (words.length < 2) {
    return <span className="leading-none text-primary-foreground font-black uppercase text-xl">{title}</span>;
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

// --- COMPONENTE PRINCIPAL ---
export function CollectionNavbar({ navGroups = [], isHome = false }: { navGroups?: NavGroup[], isHome?: boolean }) {
  const { collectionId } = useParams<{ collectionId: CollectionId }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const navContainerRef = useRef<HTMLDivElement>(null);
  
  // Estados de UI
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  
  // Estados de búsqueda
  const [tempSearch, setTempSearch] = useState(searchParams.get('q') || '');
  const [showPredictive, setShowPredictive] = useState(false);
  const debouncedSearch = useDebounce(tempSearch, 300);
  const [searchResults, setSearchResults] = useState<{ suggestions: { field: string; value: string }[]; items: any[]; } | null>(null);

  const [scrollY, setScrollY] = useState(0);
  const scrollDir = useScrollDirection();

  const config = collectionId ? COLLECTIONS_MAP[collectionId] : null;
  const baseHref = isHome ? "/" : `/view/${collectionId}`;
  const collectionTitle = isHome ? SITE_METADATA.title : (config as any)?.metadata?.title || SITE_METADATA.title;
  const logoUrl = isHome ? SITE_METADATA.logo : (config as any)?.metadata?.logo;

  const searchKeys = (config as any)?.SEARCH_KEYS || [];
  const suggestionKeys = (config as any)?.SUGGESTIONS_KEYS || searchKeys;

  const allCollectionItems = useMemo(() => {
    if (!config || !(config as any).rawData || !(config as any).mapItem) return [];
    return (config as any).rawData.map((config as any).mapItem);
  }, [config]);

  const PARENT_KEY = (config as any)?.NAVIGATION_CONFIG?.hierarchy?.[0]?.toLowerCase() || "parent";
  const CHILD_KEY = (config as any)?.NAVIGATION_CONFIG?.hierarchy?.[1]?.toLowerCase() || "child";

  const activeParent = searchParams.get(`nav_${PARENT_KEY}`);
  const activeChild = searchParams.get(`nav_${CHILD_KEY}`);
  const isAllSelected = !activeParent && !searchParams.get('q');

  // UNIFICADO: Cerrar todo si se toca fuera del Navbar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(event.target as Node)) {
        setShowPredictive(false);
        setCategoriesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileOpen || searchOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [mobileOpen, searchOpen]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lógica de búsqueda (Desde 1 letra)
  useEffect(() => {
    if (debouncedSearch.trim().length < 1) {
      setSearchResults(null);
      return;
    }
    const query = debouncedSearch.toLowerCase().trim();
    const fieldMatches: { field: string; value: string }[] = [];
    const itemMatches: any[] = [];
    const seenValues = new Set();
    const seenItemIds = new Set();

    allCollectionItems.forEach((item: any) => {
      suggestionKeys.forEach((fieldKey: string) => {
        const value = item[fieldKey];
        if (value && typeof value === 'string' && value.toLowerCase().includes(query)) {
          if (!seenValues.has(value)) {
            const displayField = fieldKey.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            fieldMatches.push({ field: displayField, value });
            seenValues.add(value);
          }
        }
      });
      let isItemMatch = false;
      searchKeys.forEach((fieldKey: string) => {
        const value = item[fieldKey];
        if (value && typeof value === 'string' && value.toLowerCase().includes(query)) isItemMatch = true;
      });
      if (isItemMatch && !seenItemIds.has(item.id)) {
        itemMatches.push(item);
        seenItemIds.add(item.id);
      }
    });
    setSearchResults({ suggestions: fieldMatches.slice(0, 4), items: itemMatches.slice(0, 5) });
  }, [debouncedSearch, allCollectionItems, searchKeys, suggestionKeys]);

  const triggerSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value.trim()) params.set('q', value.trim());
    else params.delete('q');
    setTempSearch(''); // Vaciar input
    setShowPredictive(false);
    setSearchOpen(false);
    navigate(`${baseHref}?${params.toString()}`);
  };

  const isHidden = scrollDir === "down" && scrollY > 100 && !mobileOpen && !searchOpen && !isHome;

  return (
    <div ref={navContainerRef} className="contents">
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
            <div className="flex-1 flex items-center min-w-0 h-full"> 
              <Link to={baseHref} className="relative flex items-center gap-2 md:gap-3 h-full px-4 lg:px-8 -ml-4 lg:-ml-8 pr-12 md:pr-24 lg:pr-32 group shrink" onClick={() => { setMobileOpen(false); setSearchOpen(false); setCategoriesOpen(false); }}>
                <div className="absolute z-0 bg-primary" style={{ top: '-1px', bottom: '1px', left: 0, right: 0, clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }} />
                {logoUrl && <div className="relative z-10 h-7 w-7 md:h-9 md:w-9 bg-primary-foreground shrink-0" style={{ maskImage: `url(${logoUrl})`, WebkitMaskImage: `url(${logoUrl})`, maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center', maskSize: 'contain', WebkitMaskSize: 'contain' }} />}
                <div className="relative z-10 min-w-max"><SmartTitle title={collectionTitle} /></div>
              </Link>
            </div>

            {/* NAV ACTIONS */}
            <div className="flex items-center gap-1 md:gap-4 shrink-0 h-full">
              {!isHome && (
                <>
                  {/* DESKTOP SEARCH */}
                  <div className="hidden md:flex items-center relative">
                    <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input 
                      type="text" placeholder="Search" value={tempSearch} 
                      onFocus={() => { setShowPredictive(true); setCategoriesOpen(false); }}
                      onChange={(e) => { setTempSearch(e.target.value); setShowPredictive(true); setCategoriesOpen(false); }} 
                      onKeyDown={(e) => e.key === 'Enter' && triggerSearch(tempSearch)} 
                      className="pl-8 pr-8 h-9 w-48 lg:w-64 bg-secondary/20 border-border focus-visible:ring-primary" 
                    />
                    {tempSearch && (
                      <button onClick={() => setTempSearch('')} className="absolute right-2.5 p-1 hover:text-primary transition-colors">
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>

                  {/* DESKTOP CATEGORIES TRIGGER */}
                  <div className="hidden md:flex h-full items-center">
                    <button 
                      onClick={() => { setCategoriesOpen(!categoriesOpen); setShowPredictive(false); }} 
                      className={cn("flex items-center gap-2 px-3 py-2 rounded-md transition-all hover:bg-accent", categoriesOpen ? "bg-accent" : "bg-transparent")}
                    >
                      <div className="relative w-5 h-5 flex items-center justify-center">
                        {categoriesOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                      </div>
                      <span className="text-sm font-medium">Categories</span>
                    </button>
                  </div>

                  {/* MOBILE BUTTONS */}
                  <div className="flex items-center gap-0.5 md:hidden">
                    <button className={cn("p-2 rounded-md transition-all duration-200", searchOpen ? "bg-accent" : "")} onClick={() => { setSearchOpen(!searchOpen); setMobileOpen(false); }}>
                      <Search className="w-5 h-5" />
                    </button>
                    <button className={cn("p-2 rounded-md transition-all duration-200", mobileOpen ? "bg-accent" : "")} onClick={() => { setMobileOpen(!mobileOpen); setSearchOpen(false); }}>
                      {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                  </div>
                </>
              )}
              <div className="flex items-center h-full"><ThemeSelector /></div>
            </div>
          </div>
        </div>

        {/* --- MENÚS DESPLEGABLES (FULL WIDTH) --- */}

        {/* 1. MEGA MENU CATEGORÍAS (Escritorio) */}
        {!isHome && categoriesOpen && (
          <div className="hidden md:block absolute top-full left-0 w-full bg-card border-b border-border z-50 animate-in fade-in slide-in-from-top-0 duration-200 shadow-xl overflow-y-auto max-h-[calc(100vh-3.5rem)]">
            <div className="max-w-[1440px] mx-auto px-8 pt-6 pb-10">
              <div className="mb-8">
                <Link to={baseHref} className={cn("text-[11px] font-bold tracking-widest uppercase hover:underline underline-offset-8", isAllSelected ? "text-primary" : "text-foreground")} onClick={() => setCategoriesOpen(false)}>All Items</Link>
              </div>
              <div className="columns-5 gap-x-12 space-y-10">
                {navGroups.map((group: any) => (
                  <div key={group.label} className="break-inside-avoid">
                    <Link to={`${baseHref}?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}`} className={cn("text-base font-bold block mb-3 hover:text-primary", activeParent === group.label && !activeChild ? "text-primary" : "text-foreground")} onClick={() => setCategoriesOpen(false)}>{group.label}</Link>
                    <ul className="flex flex-col space-y-2">
                      {group.children.map((child: any) => (
                        <li key={child.label}>
                          <Link to={`${baseHref}?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}&nav_${CHILD_KEY}=${encodeURIComponent(child.label)}`} className={cn("text-sm hover:text-primary", activeParent === group.label && activeChild === child.label ? "text-primary font-semibold" : "text-muted-foreground")} onClick={() => setCategoriesOpen(false)}>{child.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. PREDICTIVE SEARCH (Escritorio) */}
        {!isHome && !mobileOpen && !searchOpen && showPredictive && tempSearch.length >= 1 && (
          <div className="hidden md:block absolute top-full left-0 w-full bg-card border-b border-border shadow-2xl z-50 animate-in fade-in slide-in-from-top-0 duration-200">
            <div className="flex flex-col md:flex-row w-full max-w-[1440px] mx-auto relative">
              <div className="w-full md:w-1/3 p-6 md:border-r border-b md:border-b-0 border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Suggestions</p>
                  <button onClick={() => triggerSearch(tempSearch)} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                    See all "{tempSearch}" <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {searchResults?.suggestions.length ? (
                    searchResults.suggestions.map((s, i) => (
                      <button key={i} className="block w-full text-sm hover:text-primary transition-colors text-left" onClick={() => triggerSearch(s.value)}>
                        <span className="text-muted-foreground font-normal">{s.field}:</span> <span className="font-semibold">{s.value}</span>
                      </button>
                    ))
                  ) : <p className="text-sm text-muted-foreground">No matches found.</p>}
                </div>
              </div>
              <div className="w-full md:w-2/3 p-6 bg-secondary/10">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Top Results</p>
                {searchResults?.items.length ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {searchResults.items.map((item) => (
                      <Link to={`${baseHref}/item/${item.id}`} key={item.id} className="group block" onClick={() => { setShowPredictive(false); setTempSearch(''); }}>
                        <div className="aspect-square bg-muted rounded-md mb-3 overflow-hidden border border-border/50">
                          <img src={item.image || item.Image || ''} alt={item.displayName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <p className="text-[11px] font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">{item.displayName}</p>
                      </Link>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No items match your search.</p>}
              </div>
            </div>
          </div>
        )}

        {/* 3. MOBILE SEARCH PANEL */}
        {!isHome && searchOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 w-full bg-card border-b border-border shadow-2xl z-50 animate-in slide-in-from-top-0 duration-200">
            <div className="p-4 bg-card">
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
                <Input autoFocus placeholder="Search..." value={tempSearch} onChange={(e) => setTempSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && triggerSearch(tempSearch)} className="pl-9 pr-9 h-11 w-full bg-background border-primary/20 focus-visible:ring-primary" />
                {tempSearch && <button onClick={() => setTempSearch('')} className="absolute right-3 p-1"><X className="w-4 h-4 text-muted-foreground" /></button>}
              </div>
            </div>
            {tempSearch.length >= 1 && (
              <div className="max-h-[60vh] overflow-y-auto border-t border-border/50">
                {/* Reuso de contenido predictivo para móvil */}
                <div className="p-4 bg-secondary/5 border-b border-border/50 flex justify-between items-center">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quick Results</p>
                   <button onClick={() => triggerSearch(tempSearch)} className="text-[10px] font-bold text-primary uppercase flex items-center gap-1">See all <ArrowRight className="w-3 h-3"/></button>
                </div>
                <div className="grid grid-cols-2 gap-4 p-4">
                  {searchResults?.items.map(item => (
                    <Link to={`${baseHref}/item/${item.id}`} key={item.id} onClick={() => {setSearchOpen(false); setTempSearch('');}} className="flex flex-col gap-2">
                       <div className="aspect-square bg-muted rounded overflow-hidden"><img src={item.image || item.Image} className="w-full h-full object-cover"/></div>
                       <p className="text-[10px] font-medium line-clamp-1">{item.displayName}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. MOBILE MENU PANEL */}
        {!isHome && mobileOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 w-full bg-card border-b border-border shadow-2xl z-50 animate-in slide-in-from-top-0 duration-200">
            <div className="max-h-[75vh] overflow-y-auto pb-8 pt-2 relative">
              <div className={cn("px-4 transition-all", activeSubMenu ? "hidden" : "block")}>
                <Link to={baseHref} className={cn("block py-4 text-base font-bold border-b border-border/40", isAllSelected && "text-primary")} onClick={() => setMobileOpen(false)}>All Items</Link>
                {navGroups.map(group => (
                  <button key={group.label} onClick={() => setActiveSubMenu(group.label)} className={cn("w-full flex items-center justify-between py-4 text-base font-bold border-b border-border/40", activeParent === group.label && "text-primary")}>
                    {group.label} <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
              {navGroups.map(group => (
                <div key={`sub-${group.label}`} className={cn("px-4 animate-in slide-in-from-right-4 duration-200", activeSubMenu === group.label ? "block" : "hidden")}>
                  <button onClick={() => setActiveSubMenu(null)} className="flex items-center gap-2 py-3 text-primary font-medium mb-2"><ChevronLeft className="w-4 h-4" /> Back to Categories</button>
                  <Link to={`${baseHref}?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}`} className={cn("block py-4 text-lg font-black border-b border-border uppercase", activeParent === group.label && !activeChild && "text-primary")} onClick={() => setMobileOpen(false)}>{group.label}</Link>
                  {group.children.map(child => (
                    <Link key={child.label} to={`${baseHref}?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}&nav_${CHILD_KEY}=${encodeURIComponent(child.label)}`} className={cn("block py-4 text-base border-b border-border/40 last:border-0", activeParent === group.label && activeChild === child.label && "text-primary font-bold")} onClick={() => setMobileOpen(false)}>{child.label}</Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}