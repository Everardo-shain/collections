import { Link, useSearchParams } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { categories, products } from '@/data/mockData';
import { useState } from 'react';

export function CollectionNavbar() {
  const [searchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeCategory = searchParams.get('category');

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="font-heading text-xl font-bold tracking-tight text-foreground">
            COLLECTION
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-foreground ${
                !activeCategory ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              All
            </Link>
            {categories.map(cat => (
              <Link
                key={cat}
                to={`/?category=${encodeURIComponent(cat)}`}
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  activeCategory === cat ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            {products.map(p => (
              <Link
                key={p}
                to={`/?product=${encodeURIComponent(p)}`}
                className="hover:text-foreground transition-colors"
              >
                {p}
              </Link>
            ))}
          </div>

          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-border pt-3 space-y-2">
            <Link to="/" className="block py-1.5 text-sm font-medium" onClick={() => setMobileOpen(false)}>All</Link>
            {categories.map(cat => (
              <Link
                key={cat}
                to={`/?category=${encodeURIComponent(cat)}`}
                className="block py-1.5 text-sm text-muted-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {cat}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
