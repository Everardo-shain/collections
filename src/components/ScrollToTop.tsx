import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Forzamos el scroll al inicio cada vez que cambie la ruta
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}