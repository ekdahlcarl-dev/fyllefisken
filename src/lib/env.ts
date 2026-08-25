const LOCAL_URL = "http://localhost:3000";

function normalizeUrl(value: string): string {
  const withProtocol =
    value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;

  return new URL(withProtocol).origin;
}

export function getAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredUrl) {
    return normalizeUrl(configuredUrl);
  }

  if (process.env.VERCEL_URL) {
    return normalizeUrl(process.env.VERCEL_URL);
  }

  return LOCAL_URL;
}

export function getRuntimeEnvironment(): "local" | "preview" | "production" {
  if (!process.env.VERCEL_ENV) return "local";
  if (process.env.VERCEL_ENV === "production") return "production";
  return "preview";
}
