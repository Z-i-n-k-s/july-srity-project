import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { cn } from "../../lib/utils";

const variants = {
  primary: "border-transparent bg-gradient-to-br from-archive-amber to-archive-copper text-[#11131A] shadow-warm hover:-translate-y-0.5 hover:brightness-105",
  secondary: "border-white/10 bg-white/[0.035] text-archive-paper hover:-translate-y-0.5 hover:border-archive-amber/40 hover:bg-archive-amber/[0.07]",
  rose: "border-archive-rose/30 bg-archive-rose/15 text-[#F4DDE2] hover:-translate-y-0.5 hover:bg-archive-rose/20",
  teal: "border-archive-teal/30 bg-archive-teal/15 text-[#DDF4EF] hover:-translate-y-0.5 hover:bg-archive-teal/20",
  ghost: "border-transparent bg-transparent text-[#C6C2BC] hover:bg-white/5 hover:text-white",
};

const sizes = {
  sm: "min-h-10 px-4 py-2 text-sm",
  md: "min-h-11 px-5 py-2.5 text-sm",
  lg: "min-h-12 px-6 py-3 text-base",
};

const Button = forwardRef(function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  to,
  href,
  loading = false,
  showArrow = false,
  disabled,
  ...props
}, ref) {
  const classes = cn(
    "group inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition duration-250 focus-ring disabled:pointer-events-none disabled:opacity-55",
    variants[variant], sizes[size], className,
  );

  const content = (
    <>
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
      <span>{children}</span>
      {showArrow && !loading && <ArrowRight className="h-4 w-4 transition-transform duration-250 group-hover:translate-x-1" aria-hidden="true" />}
    </>
  );

  if (to) return <Link ref={ref} to={to} className={classes} {...props}>{content}</Link>;
  if (href) return <a ref={ref} href={href} className={classes} {...props}>{content}</a>;
  return <button ref={ref} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{content}</button>;
});

export default Button;
