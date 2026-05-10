import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  // Si estamos en producción (build), usamos la ruta del repo. 
  // En desarrollo (npm run dev), usamos la raíz "/"
  base: mode === 'production' ? '/collections/' : '/',
  
  // NOTA: Si tu URL de GitHub NO tiene dominio propio 
  // y es algo como: usuario.github.io/mi-coleccion/
  // ENTONCES en 'production' debes poner '/mi-coleccion/'
  
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));