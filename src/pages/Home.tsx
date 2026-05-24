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
        <link rel="icon" type="image/png" href={SITE_METADATA.favIcon} />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <CollectionNavbar isHome={true} />

        <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          
{/* SECCIÓN HERO PRINCIPAL */}
        <div className="text-center mb-10 md:mb-13">
          <div className="flex flex-col items-center gap-2">
            <SmartTitle 
              title={SITE_METADATA.title} 
              logoUrl={SITE_METADATA.logo} 
              height="clamp(3.5rem, 6vw, 8rem)"
              isDark={true} 
              logoColor="blue"
              lineColor="blue"
              textColor="blue"
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
            
            const itemCount = meta?.itemCount || (config as any).rawData?.length || 0;
            
            const collectionAccent = isDarkMode 
              ? (meta?.darkAccentColor || meta?.lightAccentColor) 
              : meta?.lightAccentColor;
            
            return (
              <Link
                key={id}
                to={`/view/${id}`}
                className="group relative w-full md:max-w-[calc(50%-12px)] rounded-2xl border border-border bg-card transition-all hover:shadow-lg overflow-hidden flex flex-col hover:border-[var(--card-accent)]"
                style={{
                  "--card-accent": collectionAccent ? `hsl(${collectionAccent})` : "var(--primary)"
                } as React.CSSProperties}
              >
                {/* CABECERA (BLOQUE SUPERIOR) */}
                <div 
                  className="px-6 py-4 md:px-10 md:py-6 flex items-center transition-colors"
                  style={{ 
                    backgroundColor: collectionAccent ? `hsl(${collectionAccent})` : "var(--primary)",
                    // Reducimos la altura mínima en mobile (60px) y la aumentamos en desktop (80px)
                    minHeight: "clamp(60px, 10vw, 80px)" 
                  }}
                >
                  <div className="min-w-0"> 
                    <SmartTitle 
                      title={meta?.title || id} 
                      logoUrl={meta?.logo} 
                      height="clamp(1.5rem, 4vw, 2rem)" 
                      isDark={true} 
                      logoColor="hsl(var(--card))"
                      lineColor="hsl(var(--card))"
                      textColor="hsl(var(--card))"    
                    />
                  </div>
                </div>

                {/* CUERPO (DESCRIPCIÓN) */}
                <div className="px-6 py-6 md:px-10 md:py-6 flex-1">
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed line-clamp-3">
                    {meta?.description}
                  </p>
                </div>

                {/* PIE (BLOQUE INFERIOR) */}
                <div 
                  className="px-6 py-4 md:px-10 md:py-6 flex items-center justify-between transition-colors"
                  style={{ 
                    minHeight: "clamp(60px, 10vw, 80px)" // Misma altura mínima que la cabecera
                  }} 
                >
                  <div 
                    className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-transform group-hover:translate-x-1"
                    style={collectionAccent ? { color: `hsl(${collectionAccent})` } : undefined}
                  >
                    Explore <span className="text-lg">→</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span 
                      className="text-base md:text-lg font-bold tabular-nums leading-none tracking-tight" // Bajamos de xL a lg y de black a bold
                      style={collectionAccent ? { color: `hsl(${collectionAccent})` } : undefined}
                    >
                      {itemCount}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.15em] font-medium text-muted-foreground leading-none">
                      Items
                    </span>
                  </div>
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