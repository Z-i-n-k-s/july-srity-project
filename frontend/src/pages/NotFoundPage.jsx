import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return <div className="page-shell grid min-h-screen place-items-center pt-24 text-center"><div><p className="eyebrow">404</p><h1 className="mt-4 font-display text-6xl font-semibold">Page not found</h1><p className="mt-4 text-archive-muted">The page may have moved or the address may be incorrect.</p><Link to="/home" className="focus-ring mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-archive-amber to-archive-copper px-5 py-3 font-semibold text-ink-950"><ArrowLeft className="h-4 w-4" />Return home</Link></div></div>;
}
