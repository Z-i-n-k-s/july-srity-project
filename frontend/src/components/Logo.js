import { Link } from "react-router-dom";

const Logo = ({ w, h, compact = false, className = "" }) => (
  <Link to="/home" className={`focus-ring inline-flex items-center gap-3 rounded-lg ${className}`} aria-label="July Smriti Archive home" style={{ width: w, minHeight: h }}>
    <svg className="h-10 w-10 shrink-0" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#11141D" />
      <path d="M19 13h23a5 5 0 0 1 5 5v28a5 5 0 0 1-5 5H19a5 5 0 0 1-5-5V18a5 5 0 0 1 5-5Z" fill="none" stroke="#D79A54" strokeWidth="3" />
      <path d="M25 21v22m0 0c8-2 13-8 14-17 4 9 1 17-8 22" fill="none" stroke="#F4F1EA" strokeWidth="3" strokeLinecap="round" />
      <path d="M38 15c3 5 2 9-2 13" fill="none" stroke="#B96776" strokeWidth="3" strokeLinecap="round" />
    </svg>
    <span className="min-w-0">
      <span className="block truncate font-display text-xl font-semibold leading-none text-archive-paper">{compact ? "July Smriti" : "July Smriti Archive"}</span>
      {!compact && <span className="mt-1 hidden text-[10px] uppercase tracking-[.19em] text-archive-muted xl:block">Memory • Truth • Support</span>}
    </span>
  </Link>
);

export default Logo;
