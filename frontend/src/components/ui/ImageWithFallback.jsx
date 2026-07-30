import { useEffect, useState } from "react";
import { Archive } from "lucide-react";
import { cn } from "../../lib/utils";

export default function ImageWithFallback({ src, alt, className, imageClassName, fallbackText = "Archive image unavailable", ...props }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-ink-800 to-[#21151F]", className)}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover", imageClassName)}
          {...props}
        />
      ) : (
        <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 p-6 text-center text-archive-muted" role="img" aria-label={alt}>
          <Archive className="h-9 w-9 text-archive-amber/70" aria-hidden="true" />
          <span className="text-sm">{fallbackText}</span>
        </div>
      )}
    </div>
  );
}
