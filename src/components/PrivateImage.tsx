"use client";

// Private files need the technician's token, and <img src> cannot send headers, so the image is
// fetched with the token and shown from a blob URL. (The portal's cookie works with a plain <img>.)

import { useEffect, useState } from "react";

export default function PrivateImage({ url, load, alt }: { url: string; load: (url: string) => Promise<string>; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    load(url)
      .then((u) => setSrc((objectUrl = u)))
      .catch(() => setSrc(null));
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, load]);
  if (!src) return <div className="h-20 w-20 rounded bg-slate-100" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="h-20 w-20 rounded object-cover" />;
}
