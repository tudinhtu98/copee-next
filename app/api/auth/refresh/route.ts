import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    const refreshToken = session?.refreshToken;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token không tồn tại' },
        { status: 401 }
      );
    }

    const baseUrl =
      process.env.API_BASE_URL?.replace(/\/$/, '') ||
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

    if (!baseUrl) {
      return NextResponse.json(
        { message: 'API base URL is not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(baseUrl + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Refresh token không hợp lệ' },
        { status: 401 }
      );
    }

    const data = await response.json();

    // Trả về tokens mới, NextAuth sẽ tự động cập nhật trong jwt callback
    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
  } catch (error: any) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { message: error.message || 'Lỗi khi refresh token' },
      { status: 500 }
    );
  }
}

