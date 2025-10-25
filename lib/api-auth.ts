import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify Bearer token for public API
 */
export function verifyApiToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  const validToken = process.env.API_BEARER_TOKEN;

  if (!validToken) {
    console.warn('API_BEARER_TOKEN not configured');
    return false;
  }

  return token === validToken;
}

/**
 * Create unauthorized response
 */
export function unauthorizedApiResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}
