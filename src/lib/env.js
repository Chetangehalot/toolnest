/**
 * Ensures production env vars are set correctly on Vercel.
 * Import early from auth and database modules.
 */
export function ensureProductionEnv() {
  if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  }

  if (!process.env.NEXTAUTH_URL && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
}

export function getPublicAppUrl() {
  ensureProductionEnv();
  return (
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}

export function isProductionDeployment() {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
}

export function getEnvHealth() {
  ensureProductionEnv();
  return {
    nodeEnv: process.env.NODE_ENV || 'unknown',
    vercel: Boolean(process.env.VERCEL),
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
    hasNextAuthUrl: Boolean(process.env.NEXTAUTH_URL),
    nextAuthUrlHost: process.env.NEXTAUTH_URL
      ? (() => {
          try {
            return new URL(process.env.NEXTAUTH_URL).host;
          } catch {
            return 'invalid';
          }
        })()
      : null,
    mongoUsesSrv: process.env.MONGODB_URI?.startsWith('mongodb+srv://') ?? false,
    mongoUsesDirect: process.env.MONGODB_URI?.includes('directConnection=true') ?? false,
  };
}
