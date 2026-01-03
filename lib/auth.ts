import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { AuthOptions } from "next-auth";

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

export const authOptions: AuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
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
          email: payload?.email ?? credentials?.email,
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
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Luôn sử dụng relative URL hoặc URL thuộc domain hiện tại
      // Ngăn chặn redirect về localhost
      if (url.startsWith("/")) return url;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user, account, trigger, session }: any) {
      // Handle manual session update (from update() call)
      if (trigger === "update" && session) {
        if (session.accessToken) {
          token.accessToken = session.accessToken;
        }
        if (session.refreshToken) {
          token.refreshToken = session.refreshToken;
        }
        // Decode new token to get updated hasPassword
        if (session.accessToken) {
          const payload = decodeJwtPayload(session.accessToken);
          if (payload) {
            token.hasPassword = payload.hasPassword;
            token.email = payload.email;
            token.role = payload.role;
            token.username = payload.username;
          }
        }
        return token;
      }

      // Khi đăng nhập lần đầu
      if (user) {
        // Nếu đăng nhập bằng Google OAuth
        if (account?.provider === "google") {
          try {
            const baseUrl =
              process.env.API_BASE_URL?.replace(/\/$/, "") ||
              process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

            if (!baseUrl) {
              throw new Error("API base URL is not configured");
            }

            // Gọi backend API để tạo/lấy token từ Google account
            const response = await fetch(baseUrl + "/auth/google-oauth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                image: user.image,
                googleId: account.providerAccountId,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Backend authentication failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            if (!data?.access_token || !data?.refresh_token) {
              throw new Error("Backend không trả về token hợp lệ");
            }

            token.accessToken = data.access_token;
            token.refreshToken = data.refresh_token;

            const payload = decodeJwtPayload(data.access_token);

            if (payload) {
              token.email = payload.email;
              token.role = payload.role || 'USER';
              token.username = payload.username;
              token.hasPassword = payload.hasPassword ?? false;
            } else {
              // Nếu không decode được, dùng thông tin từ Google
              token.email = user.email;
              token.role = 'USER';
              token.username = user.email?.split('@')[0];
              token.hasPassword = false;
            }
          } catch (error) {
            // Backend lỗi → không cho phép login
            throw new Error("Không thể kết nối đến hệ thống. Vui lòng thử lại sau.");
          }
        } else {
          // Đăng nhập bằng credentials (existing logic)
          token.accessToken = (user as any).token;
          token.refreshToken = (user as any).refreshToken;
          if ((user as any).email) token.email = (user as any).email;
          if ((user as any).role) token.role = (user as any).role;
          if ((user as any).username) token.username = (user as any).username;
          if (!(token as any).role || !(token as any).username || !(token as any).email || (token as any).hasPassword === undefined) {
            const payload = decodeJwtPayload((user as any).token);
            if (payload) {
              token.email = payload.email;
              token.role = payload.role;
              token.username = payload.username;
              token.hasPassword = payload.hasPassword ?? true;
            }
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

                  // Update hasPassword from refreshed token
                  const refreshedPayload = decodeJwtPayload(data.access_token);
                  if (refreshedPayload && refreshedPayload.hasPassword !== undefined) {
                    token.hasPassword = refreshedPayload.hasPassword;
                  }
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

      // ensure role, username, email, hasPassword if accessToken already exists
      if ((token as any).accessToken && (!(token as any).role || !(token as any).email || (token as any).hasPassword === undefined)) {
        const payload = decodeJwtPayload((token as any).accessToken);
        if (payload) {
          token.email = payload.email;
          token.role = payload.role;
          token.username = payload.username;
          if (payload.hasPassword !== undefined) {
            token.hasPassword = payload.hasPassword;
          }
        }
      }

      return token;
    },
    async session({ session, token }: any) {
      (session as any).accessToken = (token as any).accessToken;
      (session as any).refreshToken = (token as any).refreshToken;

      // Decode access token để lấy email từ JWT payload
      const payload = decodeJwtPayload((token as any).accessToken);

      (session as any).user = {
        ...(session as any).user,
        email: session?.user?.email || payload?.email || token?.email,
        role: (token as any).role,
        username: (token as any).username,
        hasPassword: (token as any).hasPassword !== undefined ? (token as any).hasPassword : (payload?.hasPassword ?? true),
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
  },
};
