import { NextResponse } from 'next/server';
import { requireAdminOrManager } from '@/lib/auth-simple';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

// Force this route to be dynamic to prevent it from running during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    // Check admin/manager authorization
    const authResult = await requireAdminOrManager();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();

    // Find users with large bookmarks arrays
    const usersWithLargeData = await User.find({
      $expr: { $gt: [{ $size: "$bookmarks" }, 1000] }
    }).select('_id email name bookmarks').lean();

    const cleanupResults = [];

    for (const user of usersWithLargeData) {
      try {
        // Keep only the last 1000 bookmarks
        const cleanedBookmarks = user.bookmarks.slice(-1000);
        
        await User.findByIdAndUpdate(user._id, {
          bookmarks: cleanedBookmarks
        });

        cleanupResults.push({
          userId: user._id.toString(),
          email: user.email,
          name: user.name,
          originalBookmarksCount: user.bookmarks.length,
          newBookmarksCount: cleanedBookmarks.length,
          status: 'cleaned'
        });
      } catch (error) {
        cleanupResults.push({
          userId: user._id.toString(),
          email: user.email,
          name: user.name,
          status: 'error',
          error: error.message
        });
      }
    }

    return NextResponse.json({
      message: 'User data cleanup completed',
      results: cleanupResults,
      totalProcessed: usersWithLargeData.length
    });

  } catch (error) {
    console.error('Error cleaning up user data:', error);
    return NextResponse.json(
      { error: 'Failed to clean up user data' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Check admin/manager authorization
    const authResult = await requireAdminOrManager();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();

    // Get statistics about user data sizes
    const stats = await User.aggregate([
      {
        $project: {
          email: 1,
          name: 1,
          bookmarksCount: { $size: { $ifNull: ["$bookmarks", []] } }
        }
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          usersWithLargeBookmarks: {
            $sum: { $cond: [{ $gt: ["$bookmarksCount", 1000] }, 1, 0] }
          },
          maxBookmarks: { $max: "$bookmarksCount" },
          avgBookmarks: { $avg: "$bookmarksCount" }
        }
      }
    ]);

    return NextResponse.json({
      stats: stats[0] || {
        totalUsers: 0,
        usersWithLargeBookmarks: 0,
        maxBookmarks: 0,
        avgBookmarks: 0
      }
    });

  } catch (error) {
    console.error('Error getting user data stats:', error);
    return NextResponse.json(
      { error: 'Failed to get user data statistics' },
      { status: 500 }
    );
  }
} 
