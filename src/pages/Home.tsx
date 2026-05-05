import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { COLLECTIONS_MAP, SITE_METADATA, CollectionId } from "@/config";
import { CollectionNavbar } from "@/components/collection/CollectionNavbar";
import { SmartTitle } from '@/components/SmartTitle';

export default function Home() {
  const ids = Object.keys(COLLECTIONS_MAP) as CollectionId[];
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const updateHomeAccent = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
      document.documentElement.style.setProperty(
        "--accent-color", 
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
        <CollectionNavbar isHome={true} />

        <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          
          {/* SECCIÓN HERO PRINCIPAL */}
          <div className="text-center mb-10 md:mb-13">
            <div className="flex flex-col items-center gap-2">
              {/* CORRECCIÓN: Añadido isDark={true} */}
              <SmartTitle 
                title={SITE_METADATA.title} 
                logoUrl={SITE_METADATA.logo} 
                height="clamp(3.5rem, 6vw, 8rem)"
                isDark={true} 
              />
              
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto whitespace-pre-line leading-relaxed">
                {SITE_METADATA.description}
              </p>
            </div>
          </div>

          {/* GRID DE COLECCIONES */}
          <div className="flex flex-wrap justify-center gap-6">
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
                  className="group relative w-full md:max-w-[calc(50%-12px)] rounded-2xl border border-border bg-card p-8 md:p-10 transition-all hover:shadow-lg overflow-hidden hover:border-[var(--card-accent)]"
                  style={{
                    borderTop: collectionAccent ? `4px solid hsl(${collectionAccent})` : undefined,
                    "--card-accent": collectionAccent ? `hsl(${collectionAccent})` : "var(--primary)"
                  } as React.CSSProperties}
                >
                  <div className="mb-6">
                    {/* CORRECCIÓN: Añadido isDark={true} */}
                    <SmartTitle 
                      title={meta?.title || id} 
                      logoUrl={meta?.logo} 
                      height="clamp(1.5rem, 5vw, 2rem)" 
                      isDark={true} 
                    />
                  </div>

                  <p className="text-sm text-muted-foreground mb-8 whitespace-pre-line leading-relaxed line-clamp-3">
                    {meta?.description}
                  </p>
                  
                  <div 
                    className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-transform group-hover:translate-x-1"
                    style={collectionAccent ? { color: `hsl(${collectionAccent})` } : undefined}
                  >
                    Explore <span className="text-lg">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </main>

        <footer className="border-t border-border py-8">
          <div className="max-w-[1440px] mx-auto px-4 text-center text-xs text-muted-foreground tracking-widest uppercase opacity-60">
            © {new Date().getFullYear()} {SITE_METADATA.author} • Personal Collections Archive
          </div>
        </footer>
      </div>
    </>
  );
}