export const RECOVERY_ORIGIN = 'https://imal-appointments.lovable.app';
export const RECOVERY_URL = `${RECOVERY_ORIGIN}/reset-password`;

export function parseRecoveryLink(value: string) {
  try {
    const url = new URL(value);
    if (url.origin !== RECOVERY_ORIGIN || url.pathname !== '/reset-password') return null;
    const hash = new URLSearchParams(url.hash.slice(1));
    return {
      accessToken: hash.get('access_token'),
      refreshToken: hash.get('refresh_token'),
      type: hash.get('type') || url.searchParams.get('type'),
      tokenHash: url.searchParams.get('token_hash'),
      code: url.searchParams.get('code'),
    };
  } catch { return null; }
}