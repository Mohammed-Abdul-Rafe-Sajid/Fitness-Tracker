import { cookies } from 'next/headers';
import { verifyToken } from './auth';

/**
 * Retrieves the current authenticated user's session from the HTTP-only cookies.
 * Returns null if the session is invalid or missing.
 */
export function getSessionUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return verifyToken(token);
}
