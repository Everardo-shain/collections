import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { collectionItems } from '@/data/mockData';
import { CollectionNavbar } from '@/components/collection/CollectionNavbar';
import { getTeamType } from '@/types/collection';

const DETAIL_FIELDS: { label: string; key: string }[] = [
  { label: 'Category', key: 'category' },
  { label: 'Product', key: 'product' },
  { label: 'Entity', key: 'entity' },
  { label: 'Team', key: 'team' },
  { label: 'Season', key: 'season' },
  { label: 'Competition', key: 'competition' },
  { label: 'Country', key: 'country' },
  { label: 'Confederation', key: 'confederation' },
  { label: 'Brand', key: 'brand' },
  { label: 'Style', key: 'style' },
  { label: 'Release', key: 'release' },
  { label: 'Technology', key: 'technology' },
  { label: 'Size', key: 'size' },
  { label: 'Sleeves', key: 'sleeves' },
  { label: 'Print', key: 'print' },
  { label: 'Nameset', key: 'nameset' },
  { label: 'Patch', key: 'patch' },
  { label: 'Packaging', key: 'packaging' },
  { label: 'Signature', key: 'signature' },
  { label: 'Collaboration', key: 'collaboration' },
];

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const item = collectionItems.find(i => i.id === id);

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <CollectionNavbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground mb-2">Item not found</p>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground underline">
              Back to collection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CollectionNavbar />

      {/* Breadcrumb */}
      <div className="bg-secondary/50 border-b border-border">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center gap-2 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <Link
            to={`/?category=${encodeURIComponent(item.category)}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {item.category}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-foreground font-medium truncate">{item.displayName}</span>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to collection
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image */}
          <div className="aspect-square overflow-hidden rounded-xl bg-secondary">
            <img
              src={item.image}
              alt={item.displayName}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-1">{item.brand} · {getTeamType(item.entity)}</p>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                {item.displayName}
              </h1>
            </div>

            <div className="divide-y divide-border">
              {DETAIL_FIELDS.map(field => {
                const value = (item as unknown as Record<string, string>)[field.key];
                if (!value || value === 'None') return null;
                return (
                  <div key={field.key} className="flex justify-between py-3">
                    <span className="text-sm text-muted-foreground">{field.label}</span>
                    <span className="text-sm font-medium text-foreground">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
