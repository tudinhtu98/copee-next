import { signOut } from 'next-auth/react';

/**
 * Helper function to handle 401 and try to refresh token
 */
async function handleUnauthorized(res: Response, retryRequest?: () => Promise<Response>): Promise<Response | null> {
  if (res.status === 401 && typeof window !== 'undefined') {
    try {
      // Thử refresh token qua API route
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        cache: 'no-store',
      });

      if (refreshResponse.ok) {
        // Token đã được refresh, retry request gốc
        if (retryRequest) {
          return await retryRequest();
        }
        // Nếu không có retry function, reload page để lấy token mới
        window.location.reload();
        return null;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }

    // Nếu không thể refresh, logout
    await signOut({ callbackUrl: '/login' });
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }
  return null;
}

/**
 * Shared fetcher function with automatic token refresh on 401
 * Use this for all API calls to /api/proxy
 */
export async function fetcher<T>(url: string): Promise<T> {
  let res = await fetch('/api/proxy' + url, { cache: 'no-store' });
  
  // Nếu 401, thử refresh token và retry
  if (res.status === 401) {
    const retriedRes = await handleUnauthorized(res, async () => {
      return await fetch('/api/proxy' + url, { cache: 'no-store' });
    });
    if (retriedRes) {
      res = retriedRes;
    } else {
      // Đã reload page hoặc logout
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }
  
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
 * Wrapper for fetch calls to /api/proxy with automatic token refresh on 401
 * Use this for direct fetch calls (POST, PUT, DELETE, etc.)
 */
export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  let res = await fetch('/api/proxy' + url, {
    ...options,
    cache: 'no-store',
  });
  
  // Nếu 401, thử refresh token và retry
  if (res.status === 401) {
    const retriedRes = await handleUnauthorized(res, async () => {
      return await fetch('/api/proxy' + url, {
        ...options,
        cache: 'no-store',
      });
    });
    if (retriedRes) {
      res = retriedRes;
    } else {
      // Đã reload page hoặc logout
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
  }
  
  return res;
}

