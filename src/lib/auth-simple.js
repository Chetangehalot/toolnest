import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        try {
          await connectToDatabase();
          
          const user = await User.findOne(
            { email: credentials.email },
            'email password name role image profession isBlocked'
          ).lean();
          
          if (!user || !user?.password) {
            throw new Error('Invalid credentials');
          }

          if (user.isBlocked) {
            throw new Error('Your account has been blocked by the administrator');
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isCorrectPassword) {
            throw new Error('Invalid credentials');
          }

          // Update lastLogin timestamp
          await User.findByIdAndUpdate(user._id, {
            lastLogin: new Date()
          });

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image || '',
            profession: user.profession || '',
          };
        } catch (error) {
          throw new Error(error.message || 'Authentication failed');
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.image = user.image;
        token.profession = user.profession;
      }
      
      if (trigger === 'update' && session) {
        token.name = session.user?.name || token.name;
        token.image = session.user?.image || token.image;
        token.profession = session.user?.profession || token.profession;
        token.role = session.user?.role || token.role;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name || '',
          role: token.role || 'user',
          image: token.image || '',
          profession: token.profession || '',
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
};

// Helper function to require admin or manager authentication
export async function requireAdminOrManager() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return { error: 'Authentication required', status: 401 };
  }
  
  if (!['admin', 'manager'].includes(session.user.role)) {
    return { error: 'Admin or Manager access required', status: 403 };
  }
  
  return { session };
}

// Helper function to require admin authentication
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return { error: 'Authentication required', status: 401 };
  }
  
  if (session.user.role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }
  
  return { session };
} 
