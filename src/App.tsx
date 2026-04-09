import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { SITE_METADATA } from "@/config/footballConfig";

// Componentes y Páginas
import Index from "./pages/Index.tsx";
import ItemDetail from "./pages/ItemDetail.tsx";
import NotFound from "./pages/NotFound.tsx";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* HelmetProvider debe envolver toda la aplicación para manejar los metadatos */}
    <HelmetProvider>
      <ThemeProvider>
        <TooltipProvider>
          {/* Configuración Global de Metadatos (SEO) */}
          <Helmet>
            <title>{SITE_METADATA.title}</title>
            <meta name="description" content={SITE_METADATA.description} />
            
            {/* Open Graph / Facebook */}
            <meta property="og:title" content={SITE_METADATA.title} />
            <meta property="og:description" content={SITE_METADATA.description} />
            <meta property="og:type" content="website" />
            
            {/* Twitter */}
            <meta name="twitter:title" content={SITE_METADATA.title} />
            <meta name="twitter:description" content={SITE_METADATA.description} />
          </Helmet>

          <Toaster />
          <Sonner />
          
          <BrowserRouter>
            {/* Resetea el scroll a la posición 0 en cada cambio de ruta */}
            <ScrollToTop />
            
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/item/:id" element={<ItemDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;