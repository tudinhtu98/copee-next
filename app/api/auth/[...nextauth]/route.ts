import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
export const authOptions = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: credentials?.email, password: credentials?.password }),
        })
        const data = await res.json()
        if (!res.ok) return null
        return { id: 'me', name: credentials?.email, token: data.access_token } as any
      }
    })
  ],
  session: { strategy: 'jwt' as const },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.accessToken = (user as any).token
        try {
          const payload = JSON.parse(Buffer.from(String((user as any).token).split('.')[1], 'base64').toString('utf8'))
          token.role = payload.role
          token.username = payload.username
        } catch {}
      }
      // ensure role if accessToken already exists
      if ((token as any).accessToken && !(token as any).role) {
        try {
          const payload = JSON.parse(Buffer.from(String((token as any).accessToken).split('.')[1], 'base64').toString('utf8'))
          token.role = payload.role
          token.username = payload.username
        } catch {}
      }
      return token
    },
    async session({ session, token }: any) {
      (session as any).accessToken = (token as any).accessToken
      ;(session as any).user = { ...(session as any).user, role: (token as any).role, username: (token as any).username }
      return session
    }
  }
}
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
