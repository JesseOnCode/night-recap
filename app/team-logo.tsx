"use client";

import { useEffect, useState } from "react";

const logos = new Map<string, Promise<string>>();

function loadLogo(team: string, variant: "dark" | "light"): Promise<string> {
  const key = `${team}-${variant}-4-${Math.max(3, Math.ceil(window.devicePixelRatio * 2))}`;
  const cached = logos.get(key);

  if (cached) {
    return cached;
  }

  const pending = fetch(`api/logo?team=${team}&variant=${variant}&v=4`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(key);
      }

      return rasterize(await response.text());
    })
    .catch((error: unknown) => {
      logos.delete(key);
      throw error;
    });

  logos.set(key, pending);
  return pending;
}

function rasterize(markup: string): Promise<string> {
  const viewBox = markup.match(/viewBox="([\d.\s-]+)"/);
  const parts = viewBox?.[1].trim().split(/\s+/).map(Number) ?? [0, 0, 3, 2];
  const aspect = parts[2] / parts[3] || 1.5;
  const scale = Math.max(3, Math.ceil(window.devicePixelRatio * 2));
  const height = Math.round(40 * scale);
  const width = Math.round(height * aspect);
  const sized = markup.replace(
    "<svg ",
    `<svg width="${width}" height="${height}" `,
  );
  const url = URL.createObjectURL(
    new Blob([sized], { type: "image/svg+xml" }),
  );

  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("svg"));
    };

    image.src = url;
  });
}

function LogoMark({
  team,
  variant,
  className,
  label,
}: {
  team: string;
  variant: "dark" | "light";
  className: string;
  label: boolean;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadLogo(team, variant)
      .then((png) => {
        if (!cancelled) {
          setSrc(png);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [team, variant]);

  if (!src) {
    return <span className={`${className} logo-space`} />;
  }

  return <img className={className} src={src} alt={label ? team : ""} />;
}

export function TeamLogo({
  team,
  label = false,
}: {
  team: string;
  label?: boolean;
}) {
  if (!team) {
    return null;
  }

  return (
    <>
      <LogoMark team={team} variant="light" className="logo-on-light" label={label} />
      <LogoMark team={team} variant="dark" className="logo-on-dark" label={label} />
    </>
  );
}
