import { NextResponse } from 'next/server';
import { requireAdminOrManager } from '@/lib/auth-simple';
import connectDB from '@/lib/db';
import User from '@/models/User';

// Force this route to be dynamic to prevent it from running during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const authResult = await requireAdminOrManager();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();

    const allUsers = await User.find({
      bookmarks: { $exists: true, $ne: [] }
    }).select('_id email name bookmarks').lean();

    const cleanupResults = [];
    let totalBookmarksRemoved = 0;

    for (const user of allUsers) {
      try {
        const originalCount = user.bookmarks ? user.bookmarks.length : 0;
        
        let newBookmarks = user.bookmarks || [];
        if (originalCount > 100) {
          newBookmarks = user.bookmarks.slice(-100);
        }
        
        await User.findByIdAndUpdate(user._id, {
          bookmarks: newBookmarks
        });

        const removedCount = originalCount - newBookmarks.length;
        totalBookmarksRemoved += removedCount;

        cleanupResults.push({
          userId: user._id.toString(),
          email: user.email,
          name: user.name,
          originalBookmarksCount: originalCount,
          newBookmarksCount: newBookmarks.length,
          removedCount,
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

    const extremeUsers = await User.find({
      $expr: { $gt: [{ $size: "$bookmarks" }, 1000] }
    }).select('_id email name bookmarks').lean();

    for (const user of extremeUsers) {
      try {
        const cleanedBookmarks = user.bookmarks.slice(-50);
        
        await User.findByIdAndUpdate(user._id, {
          bookmarks: cleanedBookmarks
        });

        cleanupResults.push({
          userId: user._id.toString(),
          email: user.email,
          name: user.name,
          originalBookmarksCount: user.bookmarks.length,
          newBookmarksCount: cleanedBookmarks.length,
          removedCount: user.bookmarks.length - cleanedBookmarks.length,
          status: 'extreme_cleanup'
        });
      } catch (error) {
        console.error(`Error cleaning extreme user ${user.email}:`, error);
      }
    }

    return NextResponse.json({
      message: 'Emergency cleanup completed',
      results: cleanupResults,
      totalProcessed: allUsers.length,
      totalBookmarksRemoved,
      extremeUsersProcessed: extremeUsers.length
    });

  } catch (error) {
    console.error('Error in emergency cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to perform emergency cleanup' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const authResult = await requireAdminOrManager();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();

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
          usersWithBookmarks: {
            $sum: { $cond: [{ $gt: ["$bookmarksCount", 0] }, 1, 0] }
          },
          usersWithLargeBookmarks: {
            $sum: { $cond: [{ $gt: ["$bookmarksCount", 100] }, 1, 0] }
          },
          usersWithExtremeBookmarks: {
            $sum: { $cond: [{ $gt: ["$bookmarksCount", 1000] }, 1, 0] }
          },
          maxBookmarks: { $max: "$bookmarksCount" },
          avgBookmarks: { $avg: "$bookmarksCount" },
          totalBookmarks: { $sum: "$bookmarksCount" }
        }
      }
    ]);

    const topUsers = await User.aggregate([
      {
        $project: {
          email: 1,
          name: 1,
          bookmarksCount: { $size: { $ifNull: ["$bookmarks", []] } }
        }
      },
      {
        $match: {
          bookmarksCount: { $gt: 100 }
        }
      },
      {
        $sort: { bookmarksCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return NextResponse.json({
      stats: stats[0] || {
        totalUsers: 0,
        usersWithBookmarks: 0,
        usersWithLargeBookmarks: 0,
        usersWithExtremeBookmarks: 0,
        maxBookmarks: 0,
        avgBookmarks: 0,
        totalBookmarks: 0
      },
      topUsersWithLargeBookmarks: topUsers
    });

  } catch (error) {
    console.error('Error getting emergency cleanup stats:', error);
    return NextResponse.json(
      { error: 'Failed to get emergency cleanup statistics' },
      { status: 500 }
    );
  }
} 
