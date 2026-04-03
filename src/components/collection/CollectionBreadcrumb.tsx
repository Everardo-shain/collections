import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbProps {
  category: string | null;
  product: string | null;
}

export function CollectionBreadcrumb({ category, product }: BreadcrumbProps) {
  const crumbs: { label: string; to?: string }[] = [{ label: 'Home', to: '/' }];

  if (category) {
    crumbs.push({ label: category, to: `/?category=${encodeURIComponent(category)}` });
    if (product) {
      crumbs.push({ label: product });
    }
  } else if (product) {
    crumbs.push({ label: product });
  } else {
    crumbs.push({ label: 'All Items' });
  }

  return (
    <div className="bg-secondary/50 border-b border-border">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center gap-2 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            {crumb.to && i < crumbs.length - 1 ? (
              <Link to={crumb.to} className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                {i === 0 && <Home className="w-3.5 h-3.5" />}
                {crumb.label}
              </Link>
            ) : (
              <span className="text-primary font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
