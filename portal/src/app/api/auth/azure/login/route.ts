import { publicUrl } from '@/lib/server/publicUrl';
import { NextResponse } from 'next/server';
import { authorizationUrl, createPkcePair, randomValue } from '@/lib/server/azureAd';

const OAUTH_COOKIE = 'azure_oauth';

export async function GET(request: Request) {
  try {
    const state = randomValue();
    const nonce = randomValue();
    const { verifier, challenge } = createPkcePair();
    const response = NextResponse.redirect(authorizationUrl(state, nonce, challenge));
    response.cookies.set(OAUTH_COOKIE, JSON.stringify({ state, nonce, verifier }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60,
    });
    return response;
  } catch (error: any) {
    console.error('Unable to start Azure sign-in:', error);
    const message = error?.message || 'Unable to start Azure sign-in.';
    return NextResponse.redirect(
      publicUrl(request, `/phdplacement/auth?error=${encodeURIComponent(message)}`)
    );
  }
}
