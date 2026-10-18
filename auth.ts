// auth.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import { UserModel } from '@/lib/userModel';
import { normUsername } from '@/lib/username';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      async authorize(creds) {
        const username = String(creds?.username ?? '').trim();
        const password = String(creds?.password ?? '');
        if (!username || !password) return null;

        await dbConnect();
        const key = normUsername(username);
        let u: any = await UserModel.findOne({ username_key: key, aktif: true }).lean();
        if (!u) u = await UserModel.findOne({ username, aktif: true }).lean();
        if (!u) return null;
        if (!(await bcrypt.compare(password, u.password_hash))) return null;

        return {
          id: String(u._id),
          name: u.nama,
          username: u.username ?? username,
          role: u.role,
          rw: u.rw ?? '',
          rt: u.rt ?? '',
          warga_id: u.warga_id ?? '',
          wajib_ganti_password: !!u.wajib_ganti_password,
        } as any;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const x = user as any;
        token.username = x.username;
        token.role = x.role;
        token.rw = x.rw;
        token.rt = x.rt;
        token.warga_id = x.warga_id;
        token.wajib_ganti_password = x.wajib_ganti_password;
      }
      return token;
    },
    session({ session, token }) {
      const s = session.user as any;
      s.id = token.sub;
      s.username = token.username;
      s.role = token.role;
      s.rw = token.rw;
      s.rt = token.rt;
      s.warga_id = token.warga_id;
      s.wajib_ganti_password = token.wajib_ganti_password;
      return session;
    },
  },
});
