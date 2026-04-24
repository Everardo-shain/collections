import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import { SITE_METADATA } from '@/config';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useCollection } from '@/hooks/useCollection';
import { cn } from '@/lib/utils';

import type { NavGroup } from '@/config';

// --- DROPDOWN DESKTOP ---
function DropdownMenu({
  group,
  activeParent,
  activeChild,
  parentKey,
  childKey,
  baseHref,
}: {
  group: NavGroup;
  activeParent: string | null;
  activeChild: string | null;
  parentKey: string;
  childKey: string;
  baseHref: string;
}) {
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
            to={`${baseHref}?nav_${parentKey}=${encodeURIComponent(group.label)}`}
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
                to={`${baseHref}?nav_${parentKey}=${encodeURIComponent(group.label)}&nav_${childKey}=${encodeURIComponent(child.label)}`}
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

export function CollectionNavbar({ navGroups = [] }: { navGroups: NavGroup[] }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [tempSearch, setTempSearch] = useState(searchParams.get('q') || '');
  const [scrollY, setScrollY] = useState(0);
  const scrollDir = useScrollDirection();

  const { collectionId, config } = useCollection();
  const [PARENT_KEY, CHILD_KEY] = config.NAVIGATION_CONFIG.hierarchy.map(k => k.toLowerCase());
  const baseHref = `/view/${collectionId}`;
  const collectionTitle = (config as any).metadata?.title || SITE_METADATA.title;

  useEffect(() => {
    setTempSearch(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
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

  const activeParent = searchParams.get(`nav_${PARENT_KEY}`);
  const activeChild = searchParams.get(`nav_${CHILD_KEY}`);

  return (
    <>
      {/* TOPBAR */}
      <div className={cn(
        "bg-secondary/50 transition-transform duration-300 z-[60] relative",
        isHidden ? "-translate-y-full" : "translate-y-0"
      )}>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-8 flex items-center justify-end">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            Other Collections
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <div
          className={cn(
            "fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 md:hidden animate-in fade-in duration-300",
            isHidden ? "top-0" : "top-8"
          )}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <nav className={cn(
        "sticky top-0 z-50 bg-card border-b border-border transition-transform duration-300",
        isHidden ? "-translate-y-full" : "translate-y-0"
      )}>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">

            <Link to={baseHref} className="font-heading text-xl font-bold tracking-tight flex-shrink-0" onClick={() => setMobileOpen(false)}>
              {collectionTitle}
            </Link>

            <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
              <Link
                to={baseHref}
                className={cn(
                  "text-sm font-medium hover:text-primary transition-colors",
                  !activeParent && !searchParams.get('q') ? 'text-primary' : 'text-foreground'
                )}
              >
                All
              </Link>
              {navGroups.map(group => (
                <DropdownMenu
                  key={group.label}
                  group={group}
                  activeParent={activeParent}
                  activeChild={activeChild}
                  parentKey={PARENT_KEY}
                  childKey={CHILD_KEY}
                  baseHref={baseHref}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 md:gap-2 relative z-[70]">
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
                  <button onClick={() => { setTempSearch(''); triggerSearch(''); }} className="absolute right-2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <ThemeSelector navbarHidden={isHidden} />

              <button
                className="md:hidden p-2 hover:bg-accent rounded-md relative z-[71]"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 w-full bg-card border-b border-border shadow-2xl z-50 overflow-hidden">
              <div className="max-h-[75vh] overflow-y-auto overflow-x-hidden pb-8 pt-3 relative scrollbar-hide">

                <div className={cn(
                  "transition-all duration-300 ease-in-out px-4 w-full",
                  activeSubMenu ? "-translate-x-full opacity-0 pointer-events-none absolute hidden" : "translate-x-0 opacity-100 relative"
                )}>
                  <div className="relative mb-4 flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Search"
                      value={tempSearch}
                      onChange={(e) => setTempSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && triggerSearch(tempSearch)}
                      className="pl-9 pr-9 h-10 w-full text-sm bg-background border-border focus-visible:ring-primary"
                    />
                    {tempSearch && (
                      <button onClick={() => { setTempSearch(''); triggerSearch(''); }} className="absolute right-3 text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <Link to={baseHref} className={cn("block py-4 text-base font-bold border-b border-border/40", !activeParent ? "text-primary" : "text-foreground")} onClick={() => setMobileOpen(false)}>All Items</Link>

                  {navGroups.map(group => (
                    <button
                      key={group.label}
                      onClick={() => setActiveSubMenu(group.label)}
                      className={cn(
                        "w-full flex items-center justify-between py-4 text-base font-bold border-b border-border/40 text-left",
                        activeParent === group.label ? "text-primary" : "text-foreground"
                      )}
                    >
                      {group.label}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ))}

                  <Link to="/" className="block py-4 text-sm text-muted-foreground border-t border-border/40 mt-2" onClick={() => setMobileOpen(false)}>
                    Other Collections
                  </Link>
                </div>

                {navGroups.map(group => (
                  <div
                    key={`sub-${group.label}`}
                    className={cn(
                      "transition-all duration-300 ease-in-out px-4 inset-x-0 w-full",
                      activeSubMenu === group.label ? "translate-x-0 opacity-100 relative" : "translate-x-full opacity-0 absolute pointer-events-none hidden"
                    )}
                  >
                    <button onClick={() => setActiveSubMenu(null)} className="flex items-center gap-2 py-2 text-primary font-medium mb-2 -ml-1">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <Link
                      to={`${baseHref}?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}`}
                      className={cn("block py-4 text-xl font-bold border-b border-border/40", activeParent === group.label && !activeChild ? "text-primary" : "text-foreground")}
                      onClick={() => setMobileOpen(false)}
                    >
                      {group.label}
                    </Link>
                    <div className="mt-1">
                      {group.children.map(child => (
                        <Link
                          key={child.label}
                          to={`${baseHref}?nav_${PARENT_KEY}=${encodeURIComponent(group.label)}&nav_${CHILD_KEY}=${encodeURIComponent(child.label)}`}
                          className={cn(
                            "block py-3.5 text-base border-b border-border/40 last:border-0",
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
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
