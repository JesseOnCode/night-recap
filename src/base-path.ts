export const basePath = "/projektit/night-recap";

export function apiPath(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${suffix}`;
}
