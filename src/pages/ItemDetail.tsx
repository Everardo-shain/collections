import { useState, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ChevronLeft } from 'lucide-react';
import { ImageLightbox } from '@/components/collection/ImageLightbox';
import { CollectionNavbar } from '@/components/collection/CollectionNavbar';
import { CollectionBreadcrumb } from '@/components/collection/CollectionBreadcrumb';
import { Helmet } from "react-helmet-async";

import { CollectionItem, SITE_METADATA, valid, CombinationResult } from '@/config';
import { useCollection } from '@/hooks/useCollection';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation(); // Hook para leer el estado enviado
  const { collectionId, config } = useCollection();
  const {
    rawData,
    mapItem,
    FIELD_MAP,
    VISIBLE_FIELDS,
    SPECIAL_FIELDS,
    LINK_FIELDS,
    FIELD_COMBINATIONS,
    FIELD_VISIBILITY_RULES,
    generateNavGroups,
    metadata,
  } = config;

  // LÓGICA DE RETORNO INTELIGENTE
  const returnPath = useMemo(() => {
    const base = `/view/${collectionId}`;
    // Si venimos de una búsqueda filtrada, el state tendrá 'returnSearch' (?nav_team=...)
    const search = location.state?.returnSearch || "";
    return `${base}${search}`;
  }, [collectionId, location.state]);

  const collectionItems: CollectionItem[] = useMemo(
    () => (rawData as Record<string, string>[]).map(mapItem),
    [rawData, mapItem]
  );

  const item = collectionItems.find(i => i.id === id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const navGroups = useMemo(() => generateNavGroups(collectionItems), [generateNavGroups, collectionItems]);

  if (!item) return null;

  const images = item.images?.length ? item.images : [item.image];
  const hasMultiple = images.length > 1;
  const baseHref = `/view/${collectionId}`;

  const renderValueParts = (camelKey: string, rawValue: string, combination: CombinationResult) => {
    const { parts, fullLink } = combination;
    const fullDisplayText = parts.map(p => p.text).join('');

    if (fullLink) {
      return (
        <Link
          to={`${baseHref}?nav_${camelKey.toLowerCase()}=${encodeURIComponent(rawValue)}`}
          state={{ customLabel: fullDisplayText, filterKey: camelKey.toLowerCase() }}
          className="underline underline-offset-4 decoration-primary decoration-1 hover:text-primary transition-colors"
        >
          {fullDisplayText}
        </Link>
      );
    }

    return (
      <span className="flex flex-wrap justify-end">
        {parts.map((part, idx) => {
          const isLinkable = part.fieldKey && (LINK_FIELDS as readonly string[]).includes(part.fieldKey);

          if (isLinkable && part.fieldKey) {
            const navValue = item[part.fieldKey as keyof CollectionItem] as string;
            return (
              <Link
                key={idx}
                to={`${baseHref}?nav_${part.fieldKey.toLowerCase()}=${encodeURIComponent(navValue)}`}
                state={{ customLabel: part.text, filterKey: part.fieldKey.toLowerCase() }}
                className="underline underline-offset-4 decoration-primary decoration-1 hover:text-primary transition-colors"
              >
                {part.text}
              </Link>
            );
          }
          return (
            <span key={idx} className="whitespace-pre text-foreground">
              {part.text}
            </span>
          );
        })}
      </span>
    );
  };

  const collectionTitle = metadata?.title || SITE_METADATA.title;

  return (
    <>
      <Helmet>
        <title>{`${item.displayName} | ${collectionTitle}`}</title>
        <meta name="description" content={`${item.displayName} — ${metadata?.description || SITE_METADATA.description}`} />
        <meta property="og:title" content={`${item.displayName} | ${collectionTitle}`} />
        <meta property="og:image" content={item.image} />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Pasamos los navGroups. El Navbar se mantendrá coherente */}
        <CollectionNavbar navGroups={navGroups} />
        <CollectionBreadcrumb item={item} />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* BOTÓN BACK ACTUALIZADO */}
          <Link
            to={returnPath}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {location.state?.returnSearch ? "Back to filtered results" : "Back to collection"}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            <div className="space-y-3">
              <div
                className="relative aspect-square overflow-hidden rounded-xl bg-secondary cursor-pointer border border-border"
                onClick={() => setLightboxOpen(true)}
              >
                <img src={images[activeImageIndex]} alt={item.displayName} className="w-full h-full object-cover" />
                {hasMultiple && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i => (i - 1 + images.length) % images.length); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 border border-border flex items-center justify-center hover:bg-card transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i => (i + 1) % images.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 border border-border flex items-center justify-center hover:bg-card transition-colors"><ChevronRight className="w-4 h-4" /></button>
                  </>
                )}
              </div>
              {hasMultiple && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${idx === activeImageIndex ? 'border-primary' : 'border-border opacity-60'}`}>
                      <img src={img} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-6">
                <h1 className="font-heading text-2xl md:text-3xl font-bold">{item.displayName}</h1>
              </div>

              <div className="border-t border-border divide-y divide-border">
                {Object.entries(FIELD_MAP).map(([camelKey, label]) => {
                  const rawValue = item[camelKey as keyof CollectionItem];

                  if (!(VISIBLE_FIELDS as readonly string[]).includes(camelKey)) return null;
                  if (typeof rawValue !== "string" || !valid(rawValue)) return null;

                  const combinationFn = FIELD_COMBINATIONS[camelKey];
                  const combination: CombinationResult = combinationFn
                    ? combinationFn(item, rawValue)
                    : { parts: [{ text: rawValue, fieldKey: camelKey }], fullLink: false };

                  const displayString = combination.parts.map(p => p.text).join('');
                  const visibilityFn = FIELD_VISIBILITY_RULES[camelKey];
                  if (visibilityFn && !visibilityFn(item, displayString)) return null;

                  return (
                    <div key={camelKey} className="flex justify-between py-3">
                      <span className="text-sm font-bold text-foreground">{label as string}</span>
                      <span className="text-sm font-normal text-right ml-4">
                        {renderValueParts(camelKey, rawValue, combination)}
                      </span>
                    </div>
                  );
                })}
                <div className="border-b border-border w-full"></div>
              </div>

              {SPECIAL_FIELDS.map((fieldKey) => {
                const content = item[fieldKey as keyof typeof item];
                const safeContent = Array.isArray(content) ? content.join(", ") : (content as string);

                return valid(safeContent) && (
                  <div key={fieldKey} className="mt-5">
                    <p className="text-sm font-normal leading-relaxed text-foreground whitespace-pre-line">
                      {safeContent}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <ImageLightbox
          images={images}
          activeIndex={activeImageIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          onIndexChange={setActiveImageIndex}
          alt={item.displayName}
        />
      </div>
    </>
  );
}
