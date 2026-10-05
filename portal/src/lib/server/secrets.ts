// Signing secrets. In production a missing secret is a hard error: falling back to a value
// that is committed to the repository would let anyone forge a coordinator session.
const DEV_JWT_SECRET = 'dev-only-jwt-secret-do-not-use-in-production';
const DEV_SESSION_SECRET = 'dev-only-session-secret-do-not-use-in-production';

function read(name: string, devFallback: string) {
  const value = process.env[name];
  if (value && value.length >= 16) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} must be set (16+ characters) in production.`);
  }
  return devFallback;
}

export const jwtSecret = () => read('JWT_SECRET', DEV_JWT_SECRET);
export const sessionSecret = () => read('PORTAL_SESSION_SECRET', DEV_SESSION_SECRET);
