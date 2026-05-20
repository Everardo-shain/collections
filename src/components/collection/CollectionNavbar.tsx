import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Menu, X, ChevronRight, ChevronLeft, Search, ArrowRight } from 'lucide-react';
import { SITE_METADATA, type NavGroup, type CollectionId } from '@/config';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { SmartTitle } from '@/components/SmartTitle';
import { isMatch, cleanText, normalizeKey } from "@/utils/collectionUtils";
import { useCollection } from '@/hooks/useCollection';

export function CollectionNavbar({ navGroups = [], isHome = false }: { navGroups?: NavGroup[], isHome?: boolean }) {
  const { collectionId } = useParams<{ collectionId: CollectionId }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const navContainerRef = useRef<HTMLDivElement>(null);
  
  // Extraemos la configuración dinámica de la colección activa
  const { config } = useCollection();

  // Valores por defecto para evitar errores si config es undefined (ej. en Home)
  const {
    metadata = { title: SITE_METADATA.title, logo: SITE_METADATA.logo },
    rawData = [],
    mapItem = (i: any) => i,
    SEARCH_KEYS = [],
    SUGGESTIONS_KEYS = [],
    NAVIGATION_CONFIG = { hierarchy: ["parent", "child"] },
    VALUE_SEPARATOR = " | ",
    NO_SPLIT_FIELDS = [], // <-- 1. Extraemos NO_SPLIT_FIELDS
    valid = (v: any) => !!v && v !== "-"
  } = (config || {}) as any;

  // Estados de UI
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  
  // Estados de búsqueda
  const [tempSearch, setTempSearch] = useState(searchParams.get('q') || '');
  const [showPredictive, setShowPredictive] = useState(false);
  const debouncedSearch = useDebounce(tempSearch, 300);
  const [searchResults, setSearchResults] = useState<{ 
    suggestions: { field: string; value: string; rawKey: string }[]; 
    items: any[]; 
  } | null>(null);

  const [scrollY, setScrollY] = useState(0);
  const scrollDir = useScrollDirection();

  const baseHref = isHome ? "/" : `/view/${collectionId}`;
  const collectionTitle = isHome ? SITE_METADATA.title : metadata.title;
  const logoUrl = isHome ? SITE_METADATA.logo : metadata.logo;

  const allCollectionItems = useMemo(() => {
    if (isHome || !rawData.length) return [];
    return rawData.map(mapItem);
  }, [rawData, mapItem, isHome]);

  const PARENT_KEY = NAVIGATION_CONFIG.hierarchy[0].toLowerCase();
  const CHILD_KEY = NAVIGATION_CONFIG.hierarchy[1].toLowerCase();

  const activeParent = searchParams.get(`nav_${PARENT_KEY}`);
  const activeChild = searchParams.get(`nav_${CHILD_KEY}`);
  const isAllSelected = !activeParent && !searchParams.get('q');

  const handleCloseSearch = () => {
    setTempSearch('');
    setShowPredictive(false);
    setSearchOpen(false);
  };

  const handleSuggestionClick = (fieldKey: string, value: string) => {
    const params = new URLSearchParams();
    const normKey = normalizeKey(fieldKey);
    params.set(`attr_${normKey}`, value);
    handleCloseSearch();
    navigate(`/view/${collectionId}?${params.toString()}`);
  };

  const triggerSearch = (value: string) => {
    const params = new URLSearchParams(); 
    if (value.trim()) params.set('q', value.trim());
    handleCloseSearch();
    navigate(`/view/${collectionId}?${params.toString()}`);
  };

  // Click outside para cerrar menús
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

  // Bloquear scroll cuando hay menús abiertos
  useEffect(() => {
    if (mobileOpen || searchOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [mobileOpen, searchOpen]);

  // Listener de scroll
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- LÓGICA DE BÚSQUEDA PREDICTIVA ---
  useEffect(() => {
    const queryRaw = debouncedSearch.trim();
    if (queryRaw.length < 2 || isHome) {
      setSearchResults(null);
      return;
    }

    const queryClean = cleanText(queryRaw);
    const searchWords = queryClean.split(/\s+/).filter(Boolean);
    const exactMatches: any[] = [];
    const fuzzyMatches: any[] = [];
    const itemMatches: any[] = [];
    const seenSuggestions = new Set<string>();
    const seenItemIds = new Set();

    allCollectionItems.forEach((item: any) => {
      // 1. Procesar Sugerencias (Filtros por Atributos)
      SUGGESTIONS_KEYS.forEach((fieldKey: string) => {
        const rawValue = item[fieldKey];
        if (typeof rawValue === 'string' && valid(rawValue)) {
          // <-- 2. Verificamos si NO_SPLIT_FIELDS incluye el fieldKey actual
          const individualValues = NO_SPLIT_FIELDS.includes(fieldKey) 
            ? [rawValue.trim()].filter(Boolean)
            : rawValue.split(VALUE_SEPARATOR).map(v => v.trim()).filter(Boolean);
            
          individualValues.forEach((val: string) => {
            const valClean = cleanText(val);
            const dedupeKey = `${fieldKey}:${valClean}`;
            if (seenSuggestions.has(dedupeKey)) return;

            if (isMatch(val, searchWords)) {
              const displayField = fieldKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              const suggestionData = { field: displayField, value: val, rawKey: fieldKey };
              if (valClean === queryClean) exactMatches.push(suggestionData);
              else fuzzyMatches.push(suggestionData);
              seenSuggestions.add(dedupeKey);
            }
          });
        }
      });

      // 2. Procesar Items Directos
      let score = 0;
      SEARCH_KEYS.forEach((fieldKey: string) => {
        const rawValue = item[fieldKey];
        if (typeof rawValue === 'string' && valid(rawValue)) {
          // <-- 3. Aplicamos la misma lógica para evitar dividir strings de la búsqueda
          const vals = NO_SPLIT_FIELDS.includes(fieldKey)
            ? [cleanText(rawValue.trim())]
            : rawValue.split(VALUE_SEPARATOR).map(v => cleanText(v.trim()));

          if (vals.includes(queryClean)) score += 10;
          else if (isMatch(rawValue, searchWords)) score += 5;
        }
      });

      if (score > 0 && !seenItemIds.has(item.id)) {
        itemMatches.push({ ...item, _searchScore: score });
        seenItemIds.add(item.id);
      }
    });

    setSearchResults({ 
      suggestions: [...exactMatches, ...fuzzyMatches].slice(0, 5), 
      items: itemMatches.sort((a, b) => b._searchScore - a._searchScore).slice(0, 5) 
    });
  }, [debouncedSearch, allCollectionItems, SEARCH_KEYS, SUGGESTIONS_KEYS, VALUE_SEPARATOR, NO_SPLIT_FIELDS, valid, isHome]); // <-- 4. Añadimos NO_SPLIT_FIELDS a las dependencias

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

      {(mobileOpen || searchOpen || showPredictive) && (
        <div className={cn("fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 animate-in fade-in duration-300", isHidden || isHome ? "top-0" : "top-8")} 
             onClick={handleCloseSearch} />
      )}

      <nav className={cn("sticky top-0 z-[60] bg-card border-b border-border transition-transform duration-300", isHidden ? "-translate-y-full" : "translate-y-0")}>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 relative z-[61] h-14">
          <div className="flex items-center justify-between h-full gap-2">
            
            <div className="flex-1 flex items-center h-full"> 
              <Link to={baseHref} className="relative flex items-center h-full px-4 lg:px-8 -ml-4 lg:-ml-8 pr-12 md:pr-24 lg:pr-32 group shrink-0">
                <div className="absolute z-0 bg-primary" style={{ top: '0px', bottom: '0px', left: 0, right: 0, clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)' }} />
                <div className="relative z-10">
                  <SmartTitle 
                    title={collectionTitle}
                    logoUrl={logoUrl}
                    height="clamp(1.5rem, 5vw, 2rem)"
                    logoColor="hsl(var(--card))"
                    lineColor="hsl(var(--card))"
                    textColor="hsl(var(--card))"
                  />
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-1 md:gap-4 shrink-0 h-full">
              {!isHome && (
                <>
                  {/* DESKTOP SEARCH */}
                  <div className="hidden md:flex items-center gap-3 relative">
                    <div className="relative flex items-center">
                      <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      <Input 
                        type="text" placeholder="Search" value={tempSearch} 
                        onFocus={() => { setShowPredictive(true); setCategoriesOpen(false); }}
                        onChange={(e) => { setTempSearch(e.target.value); setShowPredictive(true); setCategoriesOpen(false); }} 
                        onKeyDown={(e) => e.key === 'Enter' && tempSearch.length >= 2 && triggerSearch(tempSearch)} 
                        className="pl-8 pr-8 h-9 w-48 lg:w-64 bg-secondary/20 border-border focus-visible:ring-primary" 
                      />
                      {tempSearch && (
                        <button onClick={() => setTempSearch('')} className="absolute right-2.5 p-1 hover:text-primary transition-colors">
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    {showPredictive && (
                      <button onClick={handleCloseSearch} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-tight">
                        Cancel
                      </button>
                    )}
                  </div>

                  {/* DESKTOP CATEGORIES BUTTON */}
                  <div className="hidden md:flex h-full items-center">
                    <button 
                      onClick={() => { setCategoriesOpen(!categoriesOpen); setShowPredictive(false); }} 
                      className={cn("flex items-center gap-2 px-3 py-2 rounded-md transition-all hover:bg-accent", categoriesOpen ? "bg-accent" : "bg-transparent")}
                    >
                      {categoriesOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                      <span className="text-sm font-medium">Categories</span>
                    </button>
                  </div>

                  {/* MOBILE BUTTONS */}
                  <div className="flex items-center gap-0.5 md:hidden">
                    <button className={cn("p-2 rounded-md transition-all", searchOpen ? "bg-accent" : "")} onClick={() => { setSearchOpen(!searchOpen); setMobileOpen(false); }}>
                      <Search className="w-5 h-5" />
                    </button>
                    <button className={cn("p-2 rounded-md transition-all", mobileOpen ? "bg-accent" : "")} onClick={() => { setMobileOpen(!mobileOpen); setSearchOpen(false); }}>
                      {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                  </div>
                </>
              )}
              <div className="flex items-center h-full"><ThemeSelector /></div>
            </div>
          </div>
        </div>

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

        {/* 2. PREDICTIVE SEARCH RESULTS (Escritorio) */}
        {!isHome && !mobileOpen && !searchOpen && showPredictive && (
          <div className="hidden md:block absolute top-full left-0 w-full bg-card border-b border-border shadow-xl z-50 animate-in fade-in slide-in-from-top-0 duration-200">
            {tempSearch.trim().length < 2 ? (
              <div className="w-full max-w-[1440px] mx-auto py-12 px-6 flex items-center justify-center text-muted-foreground text-sm">
                Type at least 2 characters to start searching...
              </div>
            ) : (
              <div className="flex flex-col md:flex-row w-full max-w-[1440px] mx-auto relative">
                <div className="w-full md:w-1/3 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Suggestions</p>
                    <button onClick={() => triggerSearch(tempSearch)} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                      See all <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {searchResults?.suggestions.length ? (
                      searchResults.suggestions.map((s, i) => (
                        <button key={i} className="block w-full text-sm hover:text-primary transition-colors text-left group/sug" onClick={() => handleSuggestionClick(s.rawKey, s.value)}>
                          <span className="text-muted-foreground font-normal group-hover/sug:text-primary/70">{s.field}:</span>{" "}
                          <span className="font-semibold">{s.value}</span>
                        </button>
                      ))
                    ) : <p className="text-sm text-muted-foreground">No matches found.</p>}
                  </div>
                </div>
                <div className="w-full md:w-2/3 p-6">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Top Results</p>
                  {searchResults?.items.length ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {searchResults.items.map((item) => (
                        <Link to={`${baseHref}/item/${item.id}`} key={item.id} className="group block" onClick={handleCloseSearch}>
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
            )}
          </div>
        )}

        {/* 3. MOBILE SEARCH PANEL */}
        {!isHome && searchOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 w-full bg-card border-b border-border shadow-xl z-50 animate-in slide-in-from-top-0 duration-200">
            <div className="p-4 bg-card">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input 
                    autoFocus placeholder="Search..." value={tempSearch} 
                    onChange={(e) => setTempSearch(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && tempSearch.length >= 2 && triggerSearch(tempSearch)} 
                    className="pl-9 pr-9 h-11 w-full bg-background border-primary/20 focus-visible:ring-primary" 
                  />
                  {tempSearch && (
                    <button onClick={() => setTempSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <button onClick={handleCloseSearch} className="text-sm font-bold text-primary px-1">Cancel</button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {tempSearch.trim().length < 2 ? (
                <div className="py-12 px-6 flex items-center justify-center text-muted-foreground text-sm text-center">
                  Type at least 2 characters to start searching...
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="p-4 border-b border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Suggestions</p>
                      <button onClick={() => triggerSearch(tempSearch)} className="text-[10px] font-bold text-primary uppercase flex items-center gap-1">
                        See all <ArrowRight className="w-3 h-3"/>
                      </button>
                    </div>
                    <div className="space-y-4">
                      {searchResults?.suggestions.map((s, i) => (
                        <button key={i} className="block w-full text-sm py-1 text-left" onClick={() => handleSuggestionClick(s.rawKey, s.value)}>
                          <span className="text-muted-foreground">{s.field}:</span> <span className="font-semibold">{s.value}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Top Results</p>
                    <div className="grid grid-cols-2 gap-4">
                      {searchResults?.items.map(item => (
                        <Link to={`${baseHref}/item/${item.id}`} key={item.id} onClick={handleCloseSearch} className="flex flex-col gap-2 group">
                          <div className="aspect-square bg-muted rounded overflow-hidden border border-border/50">
                            <img src={item.image || item.Image} alt={item.displayName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                          </div>
                          <p className="text-[11px] font-medium line-clamp-2 leading-tight group-hover:text-primary transition-colors">{item.displayName}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. MOBILE MENU PANEL (Categorías) */}
        {!isHome && mobileOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 w-full bg-card border-b border-border shadow-xl z-50 animate-in slide-in-from-top-0 duration-200">
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