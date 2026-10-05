import { createHash, createPublicKey, randomBytes, verify } from 'node:crypto';

const microsoftHost = 'https://login.microsoftonline.com';

export type AzureClaims = {
  name?: string;
  preferred_username?: string;
  email?: string;
  nonce?: string;
  aud?: string | string[];
  iss?: string;
  exp?: number;
};

export function azureConfig() {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  const redirectUri = process.env.AZURE_AD_REDIRECT_URI;
  if (!tenantId || !clientId || !clientSecret || !redirectUri) {
    throw new Error('Azure AD is not configured. Set AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, and AZURE_AD_REDIRECT_URI in your environment or .env.local.');
  }
  return { tenantId, clientId, clientSecret, redirectUri };
}

export function createPkcePair() {
  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function randomValue() {
  return randomBytes(32).toString('base64url');
}

export function authorizationUrl(state: string, nonce: string, challenge: string) {
  const { tenantId, clientId, redirectUri } = azureConfig();
  const url = new URL(`${microsoftHost}/${tenantId}/oauth2/v2.0/authorize`);
  url.search = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: 'openid profile email',
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString();
  return url;
}

export async function exchangeAuthorizationCode(code: string, verifier: string) {
  const { tenantId, clientId, clientSecret, redirectUri } = azureConfig();
  const response = await fetch(`${microsoftHost}/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
    cache: 'no-store',
  });
  const body = await response.json() as { id_token?: string; error_description?: string };
  if (!response.ok || !body.id_token) throw new Error(body.error_description || 'Azure AD did not return an ID token.');
  return body.id_token;
}

export async function validateIdToken(idToken: string, expectedNonce: string): Promise<AzureClaims> {
  const { tenantId, clientId } = azureConfig();
  const [headerValue, payloadValue, signatureValue] = idToken.split('.');
  if (!headerValue || !payloadValue || !signatureValue) throw new Error('Malformed Azure ID token.');
  const header = JSON.parse(Buffer.from(headerValue, 'base64url').toString('utf8')) as { alg?: string; kid?: string };
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported Azure ID token signature.');
  const keyResponse = await fetch(`${microsoftHost}/${tenantId}/discovery/v2.0/keys`, { cache: 'no-store' });
  const keys = await keyResponse.json() as { keys?: Array<Record<string, any>> };
  const jwk = keys.keys?.find((key) => key.kid === header.kid);
  if (!jwk) throw new Error('Azure signing key was not found.');
  const valid = verify('RSA-SHA256', Buffer.from(`${headerValue}.${payloadValue}`), createPublicKey({ key: jwk as any, format: 'jwk' }), Buffer.from(signatureValue, 'base64url'));
  if (!valid) throw new Error('Invalid Azure ID token signature.');
  const claims = JSON.parse(Buffer.from(payloadValue, 'base64url').toString('utf8')) as AzureClaims;
  const audienceMatches = Array.isArray(claims.aud) ? claims.aud.includes(clientId) : claims.aud === clientId;
  if (!audienceMatches || claims.nonce !== expectedNonce || !claims.exp || claims.exp * 1000 <= Date.now()) {
    throw new Error('Azure ID token claims are invalid.');
  }
  if (claims.iss !== `${microsoftHost}/${tenantId}/v2.0`) throw new Error('Azure ID token issuer is invalid.');
  return claims;
}
