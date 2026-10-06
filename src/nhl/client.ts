type CacheEntry = { at: number; value: unknown };

const memory = new Map<string, CacheEntry>();

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchNhl<T>(path: string): Promise<T> {
  let url = path.startsWith("http") ? path : `https://api-web.nhle.com${path}`;

  for (let attempt = 0; attempt < 4; attempt++) {
    let response = await fetch(url, {
      cache: "no-store",
      redirect: "manual",
    });

    for (
      let hop = 0;
      hop < 3 && response.status >= 300 && response.status < 400;
      hop++
    ) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error(path);
      }
      url = new URL(location, url).href;
      response = await fetch(url, {
        cache: "no-store",
        redirect: "manual",
      });
    }

    if (response.status === 429 || response.status >= 500) {
      await wait(700 * (attempt + 1));
      continue;
    }

    if (!response.ok) {
      throw new Error(`${path} ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  throw new Error(path);
}

export async function nhlJson<T>(path: string, ttlMs = 0): Promise<T> {
  if (ttlMs > 0) {
    const hit = memory.get(path);
    if (hit && Date.now() - hit.at < ttlMs) {
      return hit.value as T;
    }
  }

  const value = await fetchNhl<T>(path);
  if (ttlMs > 0) {
    memory.set(path, { at: Date.now(), value });
  }
  return value;
}

export async function mapPool<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R | null>,
): Promise<R[]> {
  const out: R[] = [];

  for (let index = 0; index < items.length; index += size) {
    const part = await Promise.all(
      items.slice(index, index + size).map(async (item) => {
        try {
          return await fn(item);
        } catch {
          return null;
        }
      }),
    );

    for (const row of part) {
      if (row) {
        out.push(row);
      }
    }
  }

  return out;
}
