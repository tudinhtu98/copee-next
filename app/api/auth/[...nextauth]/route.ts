import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

function decodeJwtPayload(token?: string) {
  if (!token) return null;
  const parts = String(token).split(".");
  if (parts.length < 2) return null;
  try {
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}
export const authOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const baseUrl =
          process.env.API_BASE_URL?.replace(/\/$/, "") ||
          process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

        if (!baseUrl) {
          throw new Error(
            "API base URL is not configured. Set API_BASE_URL or NEXT_PUBLIC_API_BASE_URL"
          );
        }

        const response = await fetch(baseUrl + "/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
        }).catch((error) => {
          throw new Error(`Không thể kết nối tới API: ${error.message}`);
        });

        if (!response.ok) {
          let message = "Đăng nhập thất bại";
          try {
            const data = await response.json();
            message = data?.message || message;
          } catch {}
          throw new Error(message);
        }

        const data = await response.json();
        if (!data?.access_token || !data?.refresh_token) {
          throw new Error("Phản hồi từ API không hợp lệ");
        }

        const payload = decodeJwtPayload(data.access_token);

        return {
          id: payload?.sub ?? "me",
          name: payload?.username ?? credentials?.email ?? "user",
          token: data.access_token,
          refreshToken: data.refresh_token,
          role: payload?.role,
          username: payload?.username,
        } as any;
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  callbacks: {
    async jwt({ token, user, trigger }: any) {
      // Khi đăng nhập lần đầu
      if (user) {
        token.accessToken = (user as any).token;
        token.refreshToken = (user as any).refreshToken;
        if ((user as any).role) token.role = (user as any).role;
        if ((user as any).username) token.username = (user as any).username;
        if (!(token as any).role || !(token as any).username) {
          const payload = decodeJwtPayload((user as any).token);
          if (payload) {
            token.role = payload.role;
            token.username = payload.username;
          }
        }
        return token;
      }

      // Kiểm tra token có sắp hết hạn không (trong vòng 5 phút)
      if ((token as any).accessToken) {
        const payload = decodeJwtPayload((token as any).accessToken);
        if (payload && payload.exp) {
          const expiresAt = payload.exp * 1000; // Convert to milliseconds
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;
          
          // Nếu token còn < 5 phút thì refresh
          if (timeUntilExpiry < 5 * 60 * 1000 && (token as any).refreshToken) {
            try {
              const baseUrl =
                process.env.API_BASE_URL?.replace(/\/$/, "") ||
                process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

              if (baseUrl) {
                const response = await fetch(baseUrl + "/auth/refresh", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    refresh_token: (token as any).refreshToken,
                  }),
                });

                if (response.ok) {
                  const data = await response.json();
                  token.accessToken = data.access_token;
                  token.refreshToken = data.refresh_token;
                } else {
                  // Refresh token không hợp lệ, xóa token
                  token.accessToken = null;
                  token.refreshToken = null;
                }
              }
            } catch (error) {
              token.accessToken = null;
              token.refreshToken = null;
            }
          }
        }
      }

      // ensure role if accessToken already exists
      if ((token as any).accessToken && !(token as any).role) {
        const payload = decodeJwtPayload((token as any).accessToken);
        if (payload) {
          token.role = payload.role;
          token.username = payload.username;
        }
      }
      
      return token;
    },
    async session({ session, token }: any) {
      (session as any).accessToken = (token as any).accessToken;
      (session as any).refreshToken = (token as any).refreshToken;
      (session as any).user = {
        ...(session as any).user,
        role: (token as any).role,
        username: (token as any).username,
      };
      return session;
    },
  },
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
