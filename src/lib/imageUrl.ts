const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function resolveImageUrl(url: string): string {
  if (!url || url.startsWith('http')) return url;
  return base + url;
}
