import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps {
  to: string;
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  exactQuery?: boolean; // 🔥 nuevo
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, exactQuery, ...props }, ref) => {
    const location = useLocation();

    const isActiveQuery = exactQuery
      ? location.search === new URL(to, window.location.origin).search
      : false;

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(
            className,
            (isActive || isActiveQuery) && activeClassName,
            isPending && pendingClassName
          )
        }
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };
