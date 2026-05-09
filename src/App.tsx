import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom"; // Cambiado de BrowserRouter a HashRouter
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { SITE_METADATA, DEFAULT_COLLECTION_ID } from "@/config";

import Home from "./pages/Home";
import Index from "./pages/Index";
import ItemDetail from "./pages/ItemDetail";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Helmet>
            <title>{SITE_METADATA.title}</title>
            <meta name="description" content={SITE_METADATA.description} />
            <meta property="og:title" content={SITE_METADATA.title} />
            <meta property="og:description" content={SITE_METADATA.description} />
            <meta property="og:type" content="website" />
            <meta name="twitter:title" content={SITE_METADATA.title} />
            <meta name="twitter:description" content={SITE_METADATA.description} />
            {/* Opcional: Puedes añadir aquí también el favicon global si quieres centralizarlo */}
            <link rel="icon" type="image/png" href={SITE_METADATA.favIcon} />
          </Helmet>

          <Toaster />
          <Sonner />

          {/* Usamos HashRouter para evitar errores 404 al refrescar en GitHub Pages */}
          <HashRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/view/:collectionId" element={<Index />} />
              <Route path="/view/:collectionId/item/:id" element={<ItemDetail />} />
              
              {/* Backwards-compat: /item/:id → default collection */}
              <Route 
                path="/item/:id" 
                element={<Navigate to={`/view/${DEFAULT_COLLECTION_ID}`} replace />} 
              />
              
              {/* Ruta para capturar errores 404 dentro de la app */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </TooltipProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;