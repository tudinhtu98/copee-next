import { signOut } from 'next-auth/react';

/**
 * Helper function to handle 401 and auto logout
 */
async function handleUnauthorized(res: Response) {
  if (res.status === 401 && typeof window !== 'undefined') {
    await signOut({ callbackUrl: '/login' });
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }
}

/**
 * Shared fetcher function with automatic logout on 401
 * Use this for all API calls to /api/proxy
 */
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch('/api/proxy' + url, { cache: 'no-store' });
  
  // Auto logout on 401 (unauthorized)
  await handleUnauthorized(res);
  
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      throw new Error(parsed.message || 'Không thể tải dữ liệu');
    } catch {
      throw new Error('Không thể tải dữ liệu');
    }
  }
  
  return (await res.json()) as T;
}

/**
 * Wrapper for fetch calls to /api/proxy with automatic logout on 401
 * Use this for direct fetch calls (POST, PUT, DELETE, etc.)
 */
export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const res = await fetch('/api/proxy' + url, {
    ...options,
    cache: 'no-store',
  });
  
  // Auto logout on 401 (unauthorized)
  await handleUnauthorized(res);
  
  return res;
}

