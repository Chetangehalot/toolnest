/**
 * Seeds demo data for the full Platform Analytics Dashboard:
 * - Tools Analysis (reviews, views)
 * - Blog Analysis (posts, engagement, categories)
 * - Staff Analysis (moderation, leaderboard, logins)
 * - User action logs (centralized AuditLog + activity-logs API)
 *
 * Run: npm run seed:demo
 */
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DEMO_EMAIL_DOMAIN = '@demo.io';
const DEMO_REVIEWER_COUNT = 12;
const DEMO_SEED_TAG = 'demo-analytics-seed';
const BLOG_SLUG_PREFIX = 'demo-analytics-';

const REVIEW_TEMPLATES = [
  {
    rating: 5,
    comment:
      'Outstanding tool — saved our team hours every week. The UI is polished and onboarding took minutes.',
    pros: ['Fast setup', 'Reliable output', 'Great support'],
    cons: ['Premium tier is pricey'],
  },
  {
    rating: 5,
    comment:
      'Exactly what we needed for production workflows. Integrations work flawlessly with our stack.',
    pros: ['Solid integrations', 'Consistent quality', 'Active updates'],
    cons: [],
  },
  {
    rating: 4,
    comment:
      'Very capable overall. A few advanced features have a learning curve, but daily use is smooth.',
    pros: ['Feature-rich', 'Good documentation', 'Stable performance'],
    cons: ['Steep learning curve for power features'],
  },
  {
    rating: 5,
    comment:
      'Best-in-class for this category. We switched from a competitor and have not looked back.',
    pros: ['Top-tier results', 'Collaboration features', 'Fair pricing'],
    cons: ['Mobile app could be better'],
  },
  {
    rating: 4,
    comment:
      'Strong value for the price. Delivers consistently good results for creative and business tasks.',
    pros: ['Great value', 'Quick exports', 'Helpful templates'],
    cons: ['Occasional queue at peak hours'],
  },
  {
    rating: 5,
    comment:
      'Impressed by accuracy and speed. Our whole department adopted it within the first month.',
    pros: ['High accuracy', 'Team-friendly', 'Regular improvements'],
    cons: [],
  },
];

const BLOG_POSTS = [
  {
    title: 'How AI Writing Tools Are Transforming Content Teams in 2026',
    tags: ['ai', 'content', 'productivity'],
    status: 'published',
  },
  {
    title: 'The Ultimate Guide to Choosing an Image Generation Stack',
    tags: ['image-gen', 'design', 'tools'],
    status: 'published',
  },
  {
    title: '10 Workflow Automations Every Startup Should Enable',
    tags: ['automation', 'startup', 'saas'],
    status: 'published',
  },
  {
    title: 'Comparing Top Code Assistants for Full-Stack Developers',
    tags: ['coding', 'developer', 'comparison'],
    status: 'published',
  },
  {
    title: 'Why Human Review Still Matters for AI-Generated Marketing Copy',
    tags: ['marketing', 'ai', 'quality'],
    status: 'published',
  },
  {
    title: 'Building a Private RAG Pipeline with Off-the-Shelf Tools',
    tags: ['rag', 'enterprise', 'security'],
    status: 'published',
  },
  {
    title: 'From Draft to Publish: A Writer’s Analytics Playbook',
    tags: ['analytics', 'writers', 'growth'],
    status: 'published',
  },
  {
    title: 'Multimodal AI in Customer Support: Lessons from 90 Days Live',
    tags: ['support', 'multimodal', 'ops'],
    status: 'published',
  },
  {
    title: 'Design Systems + AI: Faster Handoff Without Losing Brand Voice',
    tags: ['design', 'brand', 'ui'],
    status: 'published',
  },
  {
    title: 'Measuring ROI on AI Tool Subscriptions',
    tags: ['roi', 'finance', 'tools'],
    status: 'published',
  },
  {
    title: 'ToolNest Picks: Best Free Tiers for Solo Creators',
    tags: ['roundup', 'free', 'creators'],
    status: 'published',
  },
  {
    title: 'Security Checklist Before Connecting Third-Party AI APIs',
    tags: ['security', 'api', 'compliance'],
    status: 'published',
  },
  {
    title: 'Draft: Upcoming Trends in Agentic Toolchains',
    tags: ['agents', 'future'],
    status: 'draft',
    stale: true,
  },
  {
    title: 'Draft: Notes on Video Generation Benchmarks',
    tags: ['video', 'benchmark'],
    status: 'draft',
  },
  {
    title: 'Pending: Case Study — 3x Faster Research Reviews',
    tags: ['case-study', 'research'],
    status: 'pending_approval',
  },
  {
    title: 'Pending: Editorial Calendar Template for AI Blogs',
    tags: ['editorial', 'template'],
    status: 'pending_approval',
  },
  {
    title: 'Rejected: Speculative Post on Unverified Model Claims',
    tags: ['policy'],
    status: 'rejected',
  },
];

const AUDIT_ACTIONS = [
  { type: 'blog_moderation', action: 'approved', targetType: 'Blog' },
  { type: 'blog_moderation', action: 'rejected', targetType: 'Blog' },
  { type: 'blog_moderation', action: 'reposted', targetType: 'Blog' },
  { type: 'blog_creation', action: 'created', targetType: 'Blog' },
  { type: 'tool_management', action: 'created', targetType: 'Tool' },
  { type: 'tool_management', action: 'updated', targetType: 'Tool' },
  { type: 'user_management', action: 'role_changed', targetType: 'User' },
  { type: 'user_management', action: 'blocked', targetType: 'User' },
  { type: 'user_management', action: 'unblocked', targetType: 'User' },
  { type: 'user_management', action: 'profile_updated', targetType: 'User' },
  { type: 'review_management', action: 'replied', targetType: 'Review' },
  { type: 'review_management', action: 'hidden', targetType: 'Review' },
  { type: 'review_management', action: 'restored', targetType: 'Review' },
];

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function dateStr(d) {
  return d.toISOString().split('T')[0];
}

function pick(arr, index) {
  return arr[index % arr.length];
}

function buildDailyEngagement(totalViews, totalLikes, totalComments, days = 30) {
  const engagement = [];
  let remainingViews = totalViews;
  let remainingLikes = totalLikes;
  let remainingComments = totalComments;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const weight = 0.5 + Math.random();
    const views =
      i === 0
        ? remainingViews
        : Math.min(remainingViews, Math.floor((totalViews / days) * weight));
    const likes =
      i === 0 ? remainingLikes : Math.min(remainingLikes, Math.floor(views * 0.08));
    const comments =
      i === 0
        ? remainingComments
        : Math.min(remainingComments, Math.floor(views * 0.03));

    remainingViews -= views;
    remainingLikes -= likes;
    remainingComments -= comments;

    engagement.push({
      date: dateStr(d),
      views: Math.max(views, 0),
      likes: Math.max(likes, 0),
      comments: Math.max(comments, 0),
    });
  }

  return engagement;
}

async function recalculateToolRating(Tool, Review, toolId) {
  const allReviews = await Review.find({ toolId, status: 'visible' });
  const activeRatings = allReviews.filter((r) => r.isRatingActive && r.rating);
  const avgRating =
    activeRatings.length > 0
      ? activeRatings.reduce((sum, r) => sum + r.rating, 0) / activeRatings.length
      : 0;

  await Tool.findByIdAndUpdate(toolId, {
    rating: Math.round(avgRating * 10) / 10,
    reviewCount: allReviews.length,
  });
}

async function cleanupDemoData(User, Blog, BlogCategory, AuditLog, Review, RecentView) {
  const demoUsers = await User.find({
    email: { $regex: DEMO_EMAIL_DOMAIN.replace('.', '\\.') + '$' },
  });
  const demoUserIds = demoUsers.map((u) => u._id);

  if (demoUserIds.length) {
    await Review.deleteMany({ userId: { $in: demoUserIds } });
    await RecentView.deleteMany({ userId: { $in: demoUserIds } });
  }

  const blogResult = await Blog.deleteMany({ slug: { $regex: `^${BLOG_SLUG_PREFIX}` } });
  const auditResult = await AuditLog.deleteMany({ 'metadata.demoSeed': DEMO_SEED_TAG });
  const catResult = await BlogCategory.deleteMany({ slug: { $regex: `^${BLOG_SLUG_PREFIX}` } });

  console.log(
    `Cleaned: ${blogResult.deletedCount} blogs, ${auditResult.deletedCount} audit logs, ${catResult.deletedCount} categories`
  );
}

async function ensureDemoStaff(User) {
  const passwordHash = await bcrypt.hash('DemoStaff123!', 10);
  const specs = [
    { key: 'writer', count: 3, role: 'writer' },
    { key: 'manager', count: 1, role: 'manager' },
    { key: 'admin', count: 1, role: 'admin' },
  ];

  const staff = { writers: [], managers: [], admins: [], all: [] };

  for (const spec of specs) {
    for (let i = 1; i <= spec.count; i++) {
      const email = `demo.${spec.key}.${i}${DEMO_EMAIL_DOMAIN}`;
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: `Demo ${spec.role.charAt(0).toUpperCase() + spec.role.slice(1)} ${i}`,
          email,
          password: passwordHash,
          role: spec.role,
          lastLogin: daysAgo(Math.floor(Math.random() * 5)),
        });
      } else {
        user.lastLogin = daysAgo(Math.floor(Math.random() * 5));
        await user.save();
      }

      staff.all.push(user);
      if (spec.role === 'writer') staff.writers.push(user);
      if (spec.role === 'manager') staff.managers.push(user);
      if (spec.role === 'admin') staff.admins.push(user);
    }
  }

  const existingStaff = await User.find({
    role: { $in: ['writer', 'manager', 'admin'] },
    email: { $not: { $regex: DEMO_EMAIL_DOMAIN.replace('.', '\\.') + '$' } },
  });

  for (const member of existingStaff) {
    if (!member.lastLogin || member.lastLogin < daysAgo(14)) {
      member.lastLogin = daysAgo(Math.floor(Math.random() * 7));
      await member.save();
    }
    staff.all.push(member);
    if (member.role === 'writer') staff.writers.push(member);
    if (member.role === 'manager') staff.managers.push(member);
    if (member.role === 'admin') staff.admins.push(member);
  }

  return staff;
}

async function ensureDemoReviewers(User) {
  const passwordHash = await bcrypt.hash('DemoReview123!', 10);
  const reviewerIds = [];

  for (let i = 1; i <= DEMO_REVIEWER_COUNT; i++) {
    const email = `toolnest.reviewer.${i}${DEMO_EMAIL_DOMAIN}`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: `Demo Reviewer ${i}`,
        email,
        password: passwordHash,
        role: 'user',
      });
    }
    reviewerIds.push(user._id);
  }

  return reviewerIds;
}

async function seedBlogCategories(BlogCategory) {
  const names = [
    { name: 'AI Tools', color: '#00FFE0' },
    { name: 'Productivity', color: '#B936F4' },
    { name: 'Developer', color: '#3B82F6' },
    { name: 'Marketing', color: '#F59E0B' },
  ];

  const categories = [];
  for (const item of names) {
    const slug = `${BLOG_SLUG_PREFIX}${item.name.toLowerCase().replace(/\s+/g, '-')}`;
    let cat = await BlogCategory.findOne({ $or: [{ slug }, { name: item.name }] });
    if (!cat) {
      cat = await BlogCategory.create({
        name: item.name,
        slug,
        description: `Demo category: ${item.name}`,
        color: item.color,
        isActive: true,
        sortOrder: categories.length,
      });
    }
    categories.push(cat);
  }
  return categories;
}

async function seedBlogs(Blog, categories, staff) {
  const moderators = [...staff.managers, ...staff.admins];
  const writers =
    staff.writers.length > 0 ? staff.writers : staff.all.filter((u) => u.role === 'writer');
  const authorPool = writers.length ? writers : staff.all;

  const blogs = [];

  for (let i = 0; i < BLOG_POSTS.length; i++) {
    const spec = BLOG_POSTS[i];
    const slug = `${BLOG_SLUG_PREFIX}${spec.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60)}`;
    const author = pick(authorPool, i);
    const createdAt = spec.stale ? daysAgo(20) : daysAgo(Math.floor(Math.random() * 25) + 1);
    const views = spec.status === 'published' ? 800 + Math.floor(Math.random() * 4200) : 0;
    const likes =
      spec.status === 'published' ? Math.floor(views * (0.05 + Math.random() * 0.08)) : 0;
    const comments =
      spec.status === 'published' ? Math.floor(views * (0.01 + Math.random() * 0.04)) : 0;

    const doc = {
      title: spec.title,
      slug,
      content: `<p>${spec.title}</p><p>This demo article showcases blog analytics: views, likes, comments, and moderation workflows on ToolNest.</p>`,
      excerpt: spec.title.slice(0, 140),
      authorId: author._id,
      status: spec.status,
      categories: [pick(categories, i)._id, pick(categories, i + 1)._id],
      tags: spec.tags,
      views,
      likes,
      comments,
      dailyEngagement:
        spec.status === 'published' ? buildDailyEngagement(views, likes, comments) : [],
      readTime: 5 + (i % 6),
      allowComments: true,
      createdAt,
      updatedAt: createdAt,
    };

    if (spec.status === 'published') {
      const moderator = pick(moderators, i);
      doc.publishedAt = daysAgo(Math.max(1, Math.floor(Math.random() * 20)));
      doc.approvedBy = moderator._id;
      doc.approvedAt = doc.publishedAt;
    }

    if (spec.status === 'rejected') {
      const moderator = pick(moderators, i);
      doc.rejectedBy = moderator._id;
      doc.rejectedAt = daysAgo(Math.floor(Math.random() * 10) + 1);
      doc.rejectionReason = 'Needs stronger sourcing and clearer disclosures.';
    }

    if (spec.status === 'pending_approval') {
      doc.updatedAt = daysAgo(2);
    }

    const blog = await Blog.create(doc);
    blogs.push(blog);
  }

  return blogs;
}

async function seedAuditLogs(AuditLog, staff, blogs, tools, users) {
  const logs = [];
  const performers = staff.all.filter((s) =>
    ['writer', 'manager', 'admin'].includes(s.role)
  );
  const regularUsers = users.filter((u) => u.role === 'user').slice(0, 8);
  const reviews = await mongoose.model('Review').find({}).limit(20).lean();

  for (let i = 0; i < 90; i++) {
    const performer = pick(performers, i);
    const template = pick(AUDIT_ACTIONS, i);
    const timestamp = daysAgo(Math.floor(Math.random() * 28) + 1);

    let target;
    let targetName;
    let changes = [];
    let reason = 'Demo analytics seed action';

    if (template.targetType === 'Blog' && blogs.length) {
      target = pick(blogs, i);
      targetName = target.title;
    } else if (template.targetType === 'Tool' && tools.length) {
      target = pick(tools, i);
      targetName = target.name;
    } else if (template.targetType === 'User' && regularUsers.length) {
      target = pick(regularUsers, i);
      targetName = target.name;
    } else if (template.targetType === 'Review' && reviews.length) {
      target = reviews[i % reviews.length];
      targetName = `Review on tool`;
    } else {
      continue;
    }

    if (template.action === 'role_changed') {
      changes = [
        { field: 'role', oldValue: 'user', newValue: 'writer' },
      ];
      reason = 'Promoted after consistent blog contributions';
    } else if (template.action === 'profile_updated') {
      changes = [
        { field: 'profession', oldValue: '', newValue: 'Content Strategist' },
      ];
    } else if (template.action === 'updated') {
      changes = [{ field: 'description', oldValue: 'Old text', newValue: 'Updated text' }];
    } else if (template.action === 'approved') {
      changes = [
        { field: 'status', oldValue: 'pending_approval', newValue: 'published' },
      ];
    }

    logs.push({
      type: template.type,
      action: template.action,
      performedBy: {
        _id: performer._id,
        name: performer.name,
        role: performer.role,
      },
      targetId: target._id,
      targetType: template.targetType,
      targetName,
      changes,
      reason,
      metadata: {
        demoSeed: DEMO_SEED_TAG,
        ipAddress: `10.0.${(i % 200) + 1}.${(i % 250) + 1}`,
        userAgent: 'ToolNest-DemoSeed/1.0',
      },
      timestamp,
    });
  }

  await AuditLog.insertMany(logs);
  return logs.length;
}

async function seedToolsData(Tool, Review, RecentView, reviewerIds, users) {
  const tools = await Tool.find({}).sort({ name: 1 }).lean();
  const allReviewerIds = [
    ...reviewerIds,
    ...users
      .filter((u) => !u.email?.includes(DEMO_EMAIL_DOMAIN))
      .slice(0, 5)
      .map((u) => u._id),
  ];

  let reviewCount = 0;
  let viewCount = 0;

  for (const tool of tools) {
    const reviewsPerTool = 4 + (tool.slug.length % 3);

    for (let r = 0; r < reviewsPerTool; r++) {
      const userId = pick(allReviewerIds, r + tool.slug.length);
      const template = pick(REVIEW_TEMPLATES, r + tool.name.length);
      const createdAt = daysAgo(Math.floor(Math.random() * 28) + 1);

      const existing = await Review.findOne({ userId, toolId: tool._id });
      if (existing) {
        await Review.findByIdAndUpdate(existing._id, {
          rating: template.rating,
          comment: template.comment,
          pros: template.pros,
          cons: template.cons,
          status: 'visible',
          verified: true,
          isRatingActive: true,
          createdAt,
          updatedAt: createdAt,
        });
      } else {
        await Review.create({
          userId,
          toolId: tool._id,
          rating: template.rating,
          comment: template.comment,
          pros: template.pros,
          cons: template.cons,
          status: 'visible',
          verified: true,
          isRatingActive: true,
          createdAt,
          updatedAt: createdAt,
        });
      }
      reviewCount++;
    }

    await recalculateToolRating(Tool, Review, tool._id);
  }

  for (const userId of reviewerIds) {
    const shuffled = [...tools].sort(() => Math.random() - 0.5);
    const toolsToView = shuffled.slice(0, 20 + Math.floor(Math.random() * 15));

    for (const tool of toolsToView) {
      await RecentView.findOneAndUpdate(
        { userId, toolId: tool._id },
        { viewedAt: daysAgo(Math.floor(Math.random() * 30)) },
        { upsert: true, new: true }
      );
      viewCount++;
    }
  }

  const topTools = await Tool.find({}).sort({ rating: -1, reviewCount: -1 }).limit(8);
  await Tool.updateMany(
    { _id: { $in: topTools.map((t) => t._id) } },
    { $set: { trending: true, featured: true } }
  );

  return { reviewCount, viewCount, toolCount: tools.length };
}

async function enrichStaffToolLinks(Tool, staff) {
  const tools = await Tool.find({}).limit(30);
  const editors = staff.all.filter((s) => ['admin', 'manager'].includes(s.role));

  for (let i = 0; i < tools.length; i++) {
    const editor = pick(editors, i);
    await Tool.findByIdAndUpdate(tools[i]._id, {
      createdBy: editor._id,
      updatedBy: editor._id,
      updatedAt: daysAgo(Math.floor(Math.random() * 20)),
    });
  }
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI missing in .env.local');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const User = require('../src/models/User').default;
  const Tool = require('../src/models/Tool').default;
  const Review = require('../src/models/Review').default;
  const RecentView = require('../src/models/RecentView').default;
  const Blog = require('../src/models/Blog').default;
  const BlogCategory = require('../src/models/BlogCategory').default;
  const AuditLog = require('../src/models/AuditLog').default;

  await cleanupDemoData(User, Blog, BlogCategory, AuditLog, Review, RecentView);

  console.log('--- Tools Analysis ---');
  const reviewerIds = await ensureDemoReviewers(User);
  const allUsers = await User.find({}).lean();
  const toolsStats = await seedToolsData(Tool, Review, RecentView, reviewerIds, allUsers);
  console.log(`  Reviews: ${toolsStats.reviewCount}, Views: ${toolsStats.viewCount}, Tools: ${toolsStats.toolCount}`);

  console.log('\n--- Blog Analysis ---');
  const staff = await ensureDemoStaff(User);
  const categories = await seedBlogCategories(BlogCategory);
  const blogs = await seedBlogs(Blog, categories, staff);
  console.log(`  Blog posts: ${blogs.length}, Categories: ${categories.length}`);

  console.log('\n--- Staff Analysis ---');
  await enrichStaffToolLinks(Tool, staff);
  console.log(`  Staff accounts: ${staff.all.length} (writers: ${staff.writers.length}, managers: ${staff.managers.length}, admins: ${staff.admins.length})`);

  console.log('\n--- User action logs ---');
  const tools = await Tool.find({}).lean();
  const auditCount = await seedAuditLogs(
    AuditLog,
    staff,
    blogs,
    tools,
    allUsers
  );
  console.log(`  Audit log entries: ${auditCount}`);

  console.log('\n✓ Full Platform Analytics demo seed complete.');
  console.log('  Open Admin → Platform Analytics Dashboard (30-day range).');
  console.log('  Tabs: Tools Analysis | Blog Analysis | Staff Analysis');
  console.log('  Staff tab → Activity logs (uses centralized audit trail).\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
