import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb-adapter';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

// Utility function to clean up user data and reduce payload size
async function cleanupUserData(userId) {
  try {
    await connectToDatabase();
    
    // Get user with all data to check for large arrays
    const user = await User.findById(userId).lean();
    
    if (!user) return false;
    
    let needsUpdate = false;
    const updateData = {};
    
    // Check if bookmarks array is too large (more than 1000 items)
    if (user.bookmarks && user.bookmarks.length > 1000) {
      updateData.bookmarks = user.bookmarks.slice(-1000); // Keep only last 1000
      needsUpdate = true;
    }
    
    // Update user if needed
    if (needsUpdate) {
      await User.findByIdAndUpdate(userId, updateData);
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

export async function getSession() {
  return await getServerSession();
}

export async function requireAuth() {
  const session = await getSession();
  
  if (!session) {
    return { error: 'Unauthorized', status: 401 };
  }
  
  return { session };
}

export async function requireAdmin() {
  const session = await getSession();
  
  if (!session) {
    return { error: 'Unauthorized', status: 401 };
  }
  
  if (session.user.role !== 'admin') {
    return { error: 'Forbidden - Admin access required', status: 403 };
  }
  
  return { session };
}

export async function requireAdminOrManager() {
  const session = await getSession();
  
  if (!session) {
    return { error: 'Unauthorized', status: 401 };
  }
  
  if (session.user.role !== 'admin' && session.user.role !== 'manager') {
    return { error: 'Forbidden - Admin or Manager access required', status: 403 };
  }
  
  return { session };
}

export function createErrorResponse(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
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
          
          // Only select essential fields to reduce payload size - EXCLUDE bookmarks completely
          const user = await User.findOne(
            { email: credentials.email },
            'email password name role image profession isBlocked'
          ).lean();
          
          if (!user || !user?.password) {
            throw new Error('Invalid credentials');
          }

          // Check if user is blocked
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

          // Return minimal user data - NO bookmarks included
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
        // Store minimal user data in token - NO bookmarks
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.image = user.image;
        token.profession = user.profession;
      }
      
      // Handle session updates (when update() is called)
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
        // Use minimal token data for session - NO bookmarks
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
