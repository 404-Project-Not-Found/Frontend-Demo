/**
 * File path: /auth/[...nextauth]/route.ts
 * Author: Denise Alexander
 * Date Created: 22/09/2025
 */

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  // Configures authentication providers
  providers: [
    CredentialsProvider({
      name: 'Credentials', // Display name for the provider
      credentials: {
        email: { label: 'Email', type: 'text' }, // Field for user's email
        password: { label: 'Password', type: 'password' }, // Field for user's password
      },
      // Verifies user's credentials when they attempt to sign in
      async authorize(
        credentials: { email?: string; password?: string } | undefined
      ) {
        // Ensures both email and password is provided
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();

        // Looks up user by email
        const user = await User.findOne({ email: credentials.email });
        if (!user) {
          throw new Error(
            'This user does not exist. Please enter a valid email address.'
          );
        }

        // Compares provided password with hashed password in DB
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) {
          throw new Error(
            'The password that you have entered is incorrect. Please try again.'
          );
        }
        // User credentials are valid, return user object
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.fullName,
          role: user.role,
          organisation: user.organisation?.toString(),
        };
      },
    }),
  ],
  // Use JWT for session
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    // Called whenever JWT is created or updated
    async jwt({ token, user }) {
      // Add user ID, role and organisation to token for role based access
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organisation = user.organisation?.toString();
      }
      return token;
    },
    async session({ session, token }) {
      // Include user ID, role and organisation in session
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organisation = token.organisation as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
