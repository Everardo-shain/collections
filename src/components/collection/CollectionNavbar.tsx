import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, Search } from 'lucide-react';
import { navGroups } from '@/data/mockData';
import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

function DropdownMenu({
  group,
  activeCategory,
  activeProduct,
}: {
  group: (typeof navGroups)[0];
  activeCategory: string | null;
  activeProduct: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const isActive = group.children.some(
    c => c.category === activeCategory && (!activeProduct || c.product === activeProduct)
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
        className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-foreground ${
          isActive ? 'text-foreground' : 'text-muted-foreground'
        }`}
        onClick={() => setOpen(!open)}
      >
        {group.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-[160px] bg-card border border-border rounded-lg shadow-lg py-1.5 z-50">
          <Link
            to={`/?category=${encodeURIComponent(group.label)}`}
            className="block px-4 py-2 text-sm text-foreground font-medium hover:bg-accent/50 transition-colors"
            onClick={() => setOpen(false)}
          >
            All {group.label}
          </Link>
          <div className="h-px bg-border mx-2 my-1" />
          {group.children.map(child => (
            <Link
              key={child.label}
              to={`/?category=${encodeURIComponent(group.label)}&product=${encodeURIComponent(child.label)}`}
              className={`block px-4 py-2 text-sm transition-colors hover:bg-accent/50 ${
                activeCategory === group.label && activeProduct === child.label
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              }`}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const activeCategory = searchParams.get('category');
  const activeProduct = searchParams.get('product');
  const searchQuery = searchParams.get('q') || '';

  const handleSearch = (value: string) => {
    // Navigate to index with search param
    const params = new URLSearchParams(searchParams);
    if (value) params.set('q', value);
    else params.delete('q');
    navigate(`/?${params.toString()}`);
  };

  return (
    <>
      {/* Thin top bar with Other Collections */}
      <div className="bg-secondary/50 border-b border-border">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-end h-8">
          <Link
            to="/other-collections"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Other Collections
          </Link>
        </div>
      </div>

      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="font-heading text-xl font-bold tracking-tight text-foreground">
              COLLECTION
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  !activeCategory ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                All
              </Link>
              {navGroups.map(group => (
                <DropdownMenu
                  key={group.label}
                  group={group}
                  activeCategory={activeCategory}
                  activeProduct={activeProduct}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Desktop search */}
              <div className="hidden md:flex items-center">
                {searchOpen ? (
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-8 pr-8 h-8 w-48 text-sm bg-background"
                      autoFocus
                    />
                    <button
                      onClick={() => { handleSearch(''); setSearchOpen(false); }}
                      className="absolute right-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2 text-foreground"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div className="md:hidden pb-4 border-t border-border pt-3 space-y-1">
              {/* Mobile search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              <Link to="/" className="block py-1.5 text-sm font-medium text-foreground" onClick={() => setMobileOpen(false)}>
                All
              </Link>
              {navGroups.map(group => (
                <MobileNavGroup
                  key={group.label}
                  group={group}
                  onClose={() => setMobileOpen(false)}
                />
              ))}
              <Link
                to="/other-collections"
                className="block py-1.5 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                Other Collections
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

function MobileNavGroup({
  group,
  onClose,
}: {
  group: (typeof navGroups)[0];
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        className="w-full flex items-center justify-between py-1.5 text-sm font-medium text-muted-foreground"
        onClick={() => setExpanded(!expanded)}
      >
        {group.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="pl-4 space-y-1">
          <Link
            to={`/?category=${encodeURIComponent(group.label)}`}
            className="block py-1 text-sm text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            All {group.label}
          </Link>
          {group.children.map(child => (
            <Link
              key={child.label}
              to={`/?category=${encodeURIComponent(group.label)}&product=${encodeURIComponent(child.label)}`}
              className="block py-1 text-sm text-muted-foreground hover:text-foreground"
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
