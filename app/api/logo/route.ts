import { croppedViewBox } from "@/src/nhl/logo-bounds";

function cropLogo(svg: string): string {
  const next = croppedViewBox(svg);
  const viewBox = svg.match(/viewBox="[^"]+"/);

  if (!next || !viewBox) {
    return svg;
  }

  return svg.replace(viewBox[0], `viewBox="${next}"`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get("team") ?? "";
  const variant = searchParams.get("variant") === "light" ? "light" : "dark";

  if (!/^[A-Z]{2,3}$/.test(team)) {
    return new Response(null, { status: 400 });
  }

  const response = await fetch(
    `https://assets.nhle.com/logos/nhl/svg/${team}_${variant}.svg`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    return new Response(null, { status: 502 });
  }

  const svg = cropLogo(await response.text());

  if (!svg.trimStart().startsWith("<svg") || /<script|foreignObject|javascript:|\son\w+\s*=/i.test(svg)) {
    return new Response(null, { status: 502 });
  }

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache",
    },
  });
}
