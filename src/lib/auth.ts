import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isOnDashboard =
        nextUrl.pathname === '/dashboard' ||
        nextUrl.pathname.startsWith('/dashboard/') ||
        nextUrl.pathname.startsWith('/resumes') ||
        nextUrl.pathname.startsWith('/jobs') ||
        nextUrl.pathname.startsWith('/applications') ||
        nextUrl.pathname.startsWith('/interviews') ||
        nextUrl.pathname.startsWith('/mistakes') ||
        nextUrl.pathname.startsWith('/preferences') ||
        nextUrl.pathname.startsWith('/settings');
      const isOnAuth =
        nextUrl.pathname === '/login' || nextUrl.pathname === '/register';

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect to signIn page
      }

      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
