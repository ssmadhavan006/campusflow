interface GoogleTokenInfo {
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  aud?: string;
}

export async function verifyGoogleIdToken(token: string): Promise<{ email: string; name: string }> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
    );

    if (!response.ok) {
      const errPayload = await response.json().catch(() => ({}));
      throw new Error((errPayload as any).error_description || 'Failed to verify Google token.');
    }

    const payload = await response.json() as GoogleTokenInfo;

    if (!payload.email) {
      throw new Error('Google token does not contain email.');
    }

    const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
    if (!emailVerified) {
      throw new Error('Google email is not verified.');
    }

    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (!expectedClientId || payload.aud !== expectedClientId) {
      throw new Error('Google token audience mismatch.');
    }

    return {
      email: payload.email,
      name: payload.name || 'SRM Student',
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to verify Google token.');
  }
}
