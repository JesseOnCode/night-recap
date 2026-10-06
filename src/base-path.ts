export const basePath = "/projektit/suomalaiset-nhl";

export function apiPath(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${suffix}`;
}
