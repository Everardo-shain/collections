import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { COLLECTIONS_MAP, SITE_METADATA, CollectionId } from "@/config";
import { CollectionNavbar } from "@/components/collection/CollectionNavbar";

const COLLECTION_DESCRIPTIONS: Record<CollectionId, string> = {
  football: "Jerseys, kits and football memorabilia.",
  // music: "Records, CDs and music collectibles.",
};

export default function Home() {
  const ids = Object.keys(COLLECTIONS_MAP) as CollectionId[];
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const updateHomeAccent = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
      document.documentElement.style.setProperty(
        '--accent-color', 
        isDark ? SITE_METADATA.darkAccentColor : SITE_METADATA.lightAccentColor
      );
    };

    updateHomeAccent();
    const observer = new MutationObserver(updateHomeAccent);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Helmet>
        <title>{SITE_METADATA.title}</title>
        <meta name="description" content={SITE_METADATA.description} />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        {/* REEMPLAZAMOS EL HEADER VIEJO POR EL COMPONENTE COMPARTIDO */}
        <CollectionNavbar isHome={true} />

        <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-12 md:mb-16">
            <div className="flex flex-col items-center gap-4 mb-4">
              {/* LOGO DEL MAIN GRANDE AL LADO DEL TÍTULO PRINCIPAL */}
              <div className="flex items-center justify-center gap-4">
                <div 
                  className="h-10 w-10 md:h-12 md:w-12 bg-primary transition-colors duration-300"
                  style={{
                    maskImage: `url(${SITE_METADATA.logo})`,
                    WebkitMaskImage: `url(${SITE_METADATA.logo})`,
                    maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center', WebkitMaskPosition: 'center',
                    maskSize: 'contain', WebkitMaskSize: 'contain',
                  }}
                />
                <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight">
                  {SITE_METADATA.title}
                </h1>
              </div>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
                {SITE_METADATA.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ids.map(id => {
              const config = COLLECTIONS_MAP[id];
              const meta = (config as any).metadata;
              
              const collectionAccent = isDarkMode 
                ? (meta?.darkAccentColor || meta?.lightAccentColor) 
                : meta?.lightAccentColor;
              
              return (
                  <Link
                    key={id}
                    to={`/view/${id}`}
                    className="group relative rounded-2xl border border-border bg-card p-8 md:p-10 transition-all hover:shadow-lg overflow-hidden hover:border-[var(--card-accent)]"
                    style={{
                      borderTop: collectionAccent ? `4px solid hsl(${collectionAccent})` : undefined,
                      "--card-accent": collectionAccent ? `hsl(${collectionAccent})` : "var(--primary)"
                    } as React.CSSProperties}
                  >
                  <div className="flex items-center gap-3 mb-3">
                    {/* LOGO DE LA COLECCIÓN REACTIVO A SU ACCENT */}
                    {meta?.logo && (
                      <div 
                        className="h-8 w-8 transition-colors duration-300"
                        style={{
                          backgroundColor: collectionAccent ? `hsl(${collectionAccent})` : 'var(--primary)',
                          maskImage: `url(${meta.logo})`,
                          WebkitMaskImage: `url(${meta.logo})`,
                          maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                          maskPosition: 'center', WebkitMaskPosition: 'center',
                          maskSize: 'contain', WebkitMaskSize: 'contain',
                        }}
                      />
                    )}
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      Collection
                    </div>
                  </div>
                  <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
                    <span className="group-hover:opacity-80 transition-opacity">{meta?.title || id}</span>
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {COLLECTION_DESCRIPTIONS[id] || meta?.description}
                  </p>
                  <span
                    className="inline-flex items-center gap-1 text-sm font-medium"
                    style={collectionAccent ? { color: `hsl(${collectionAccent})` } : undefined}
                  >
                    Browse →
                  </span>
                </Link>
              );
            })}
          </div>
        </main>

        <footer className="border-t border-border py-6">
          <div className="max-w-[1440px] mx-auto px-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {SITE_METADATA.author}
          </div>
        </footer>
      </div>
    </>
  );
}