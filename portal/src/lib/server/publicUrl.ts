// Behind Docker/nginx/a front proxy, request.url carries the container bind address (0.0.0.0:PORT).
// Build redirect targets from the public origin instead: PUBLIC_ORIGIN, else the origin of
// AZURE_AD_REDIRECT_URI, else the headers the client used.
function configuredOrigin() {
  for (const value of [process.env.PUBLIC_ORIGIN, process.env.AZURE_AD_REDIRECT_URI]) {
    if (!value) continue;
    try {
      return new URL(value).origin;
    } catch {
      // ignore malformed value and try the next one
    }
  }
  return null;
}

export function publicUrl(request: Request, path: string) {
  const origin = configuredOrigin();
  if (origin) return new URL(path, origin);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.replace(':', '');
  if (!host) return new URL(path, request.url);
  return new URL(path, `${proto}://${host}`);
}
