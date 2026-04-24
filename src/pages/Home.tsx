import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { COLLECTIONS_MAP, SITE_METADATA, CollectionId } from "@/config";
import { ThemeSelector } from "@/components/ThemeSelector";

const COLLECTION_DESCRIPTIONS: Record<CollectionId, string> = {
  football: "Jerseys, kits and football memorabilia.",
  music: "Records, CDs and music collectibles.",
};

export default function Home() {
  const ids = Object.keys(COLLECTIONS_MAP) as CollectionId[];

  return (
    <>
      <Helmet>
        <title>{SITE_METADATA.title}</title>
        <meta name="description" content={SITE_METADATA.description} />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <Link to="/" className="font-heading text-xl font-bold tracking-tight">
              {SITE_METADATA.title}
            </Link>
            <ThemeSelector />
          </div>
        </header>

        <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight mb-4">
              {SITE_METADATA.title}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
              {SITE_METADATA.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ids.map(id => {
              const config = COLLECTIONS_MAP[id];
              const meta = (config as any).metadata;
              return (
                <Link
                  key={id}
                  to={`/view/${id}`}
                  className="group relative rounded-2xl border border-border bg-card p-8 md:p-10 transition-all hover:border-primary hover:shadow-lg"
                >
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                    Collection
                  </div>
                  <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                    {meta?.title || id}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {COLLECTION_DESCRIPTIONS[id] || meta?.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
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
