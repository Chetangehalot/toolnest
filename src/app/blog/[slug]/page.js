'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  EyeIcon,
  HeartIcon,
  ClockIcon,
  PencilIcon,
  ShareIcon,
  ChatBubbleLeftIcon,
  BookmarkIcon,
  ArrowUpIcon,
  LinkIcon,
  PrinterIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon
} from '@heroicons/react/24/solid';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';

export default function BlogPostPage() {
  const { slug } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likeData, setLikeData] = useState({ liked: false, likes: 0 });
  const [liking, setLiking] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [tableOfContents, setTableOfContents] = useState([]);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  
  const contentRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: contentRef,
    offset: ["start end", "end start"]
  });

  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug, session]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      
      // Reading progress
      const progress = (scrolled / (docHeight - windowHeight)) * 100;
      setReadingProgress(Math.min(progress, 100));
      
      // Show scroll to top
      setShowScrollTop(scrolled > 500);
      
      // Active section tracking
      if (contentRef.current) {
        const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let current = '';
        
        headings.forEach((heading) => {
          const rect = heading.getBoundingClientRect();
          if (rect.top <= 100) {
            current = heading.id;
          }
        });
        
        setActiveSection(current);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (post && contentRef.current) {
      generateTableOfContents();
    }
  }, [post]);

  const generateTableOfContents = () => {
    if (!contentRef.current) return;
    
    const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const toc = Array.from(headings).map((heading, index) => {
      const id = `heading-${index}`;
      heading.id = id;
      return {
        id,
        text: heading.textContent,
        level: parseInt(heading.tagName.charAt(1))
      };
    });
    
    setTableOfContents(toc);
  };

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/posts/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Post not found');
        } else if (response.status === 403) {
          setError('Access denied');
        } else {
          setError('Failed to load post');
        }
        return;
      }

      const data = await response.json();
      setPost(data.post);
      
      // Fetch like status if user is logged in
      if (session && data.post) {
        await fetchLikeStatus(data.post._id);
        await fetchBookmarkStatus(data.post._id);
      } else if (data.post) {
        setLikeData({ liked: false, likes: data.post.likes || 0 });
      }
    } catch (error) {
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const fetchLikeStatus = async (postId) => {
    try {
      const response = await fetch(`/api/blog/posts/${postId}/like`);
      if (response.ok) {
        const data = await response.json();
        setLikeData(data);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const fetchBookmarkStatus = async (postId) => {
    try {
      const response = await fetch(`/api/bookmarks`);
      if (response.ok) {
        const data = await response.json();
        const isBookmarked = data.bookmarks.some(bookmark => 
          bookmark.itemId === postId && bookmark.itemType === 'blog'
        );
        setBookmarked(isBookmarked);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleLike = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (liking) return;

    try {
      setLiking(true);
      const response = await fetch(`/api/blog/posts/${post._id}/like`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setLikeData({
          liked: data.liked,
          likes: data.likes
        });
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (bookmarking) return;

    try {
      setBookmarking(true);
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemType: 'blog',
          itemId: post._id
        })
      });

      if (response.ok) {
        setBookmarked(!bookmarked);
      }
    } catch (error) {
      // Silent fail
    } finally {
      setBookmarking(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sharePost = async (platform) => {
    const url = window.location.href;
    const title = post.title;
    const text = post.excerpt || `Check out this article: ${title}`;

    switch (platform) {
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          // You could add a toast notification here
        } catch (error) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = url;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'print':
        window.print();
        break;
    }
    setShareMenuOpen(false);
  };

  const canEdit = session && (
    session.user.id === post?.authorId?._id ||
    ['manager', 'admin'].includes(session.user.role)
  );

  const getEditUrl = () => {
    if (['manager', 'admin'].includes(session?.user?.role)) {
      return `/admin/blogs/edit/${post._id}`;
    } else {
      return `/writer/posts/edit/${post._id}`;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-[#0A0F24] via-[#0F1629] to-[#1A1F3A]">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse">
                {/* Header Skeleton */}
                <div className="mb-8">
                  <div className="h-6 bg-[#00FFE0]/20 rounded mb-4 w-24"></div>
                  <div className="h-12 bg-[#00FFE0]/20 rounded mb-4"></div>
                  <div className="flex gap-4 mb-6">
                    <div className="h-4 bg-[#00FFE0]/10 rounded w-32"></div>
                    <div className="h-4 bg-[#00FFE0]/10 rounded w-24"></div>
                    <div className="h-4 bg-[#00FFE0]/10 rounded w-20"></div>
                  </div>
                </div>
                
                {/* Image Skeleton */}
                <div className="h-96 bg-[#00FFE0]/10 rounded-2xl mb-8"></div>
                
                {/* Content Skeleton */}
                <div className="space-y-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-4 bg-[#00FFE0]/10 rounded w-full"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-[#0A0F24] via-[#0F1629] to-[#1A1F3A] flex items-center justify-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0A0F24]/80 backdrop-blur-xl border border-red-500/20 rounded-3xl p-12"
              >
                <div className="text-6xl mb-6">😔</div>
                <h1 className="text-3xl font-bold text-red-400 mb-4">{error}</h1>
                <p className="text-[#CFCFCF] mb-8 text-lg">
                  {error === 'Post not found' 
                    ? 'The blog post you\'re looking for doesn\'t exist or has been removed.'
                    : error === 'Access denied'
                    ? 'You don\'t have permission to view this post.'
                    : 'Something went wrong while loading the post.'
                  }
                </p>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#00FFE0] to-[#00D4AA] text-[#0A0F24] rounded-2xl hover:shadow-lg hover:shadow-[#00FFE0]/25 transition-all duration-300 font-semibold text-lg"
                >
                  <ArrowLeftIcon className="w-6 h-6" />
                  Back to Blog
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F24] via-[#0F1629] to-[#1A1F3A]">
        {/* Reading Progress Bar */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00FFE0] to-[#B936F4] z-50 origin-left"
          style={{ scaleX: readingProgress / 100 }}
        />

        {/* Floating Action Buttons */}
        <div className="fixed right-6 bottom-6 z-40 flex flex-col gap-3">
          {/* Table of Contents Toggle */}
          {tableOfContents.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-12 h-12 bg-[#0A0F24]/90 backdrop-blur-lg border border-[#00FFE0]/30 rounded-full flex items-center justify-center text-[#00FFE0] hover:bg-[#00FFE0]/10 transition-all duration-300 hover:scale-110"
              onClick={() => setShareMenuOpen(!shareMenuOpen)}
            >
              <ShareIcon className="w-5 h-5" />
            </motion.button>
          )}
          
          {/* Scroll to Top */}
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              onClick={scrollToTop}
              className="w-12 h-12 bg-[#0A0F24]/90 backdrop-blur-lg border border-[#00FFE0]/30 rounded-full flex items-center justify-center text-[#00FFE0] hover:bg-[#00FFE0]/10 transition-all duration-300 hover:scale-110"
            >
              <ArrowUpIcon className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Share Menu */}
        {shareMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed right-6 bottom-32 z-50 bg-[#0A0F24]/95 backdrop-blur-xl border border-[#00FFE0]/20 rounded-2xl p-4 min-w-[200px]"
          >
            <div className="space-y-2">
              <button
                onClick={() => sharePost('copy')}
                className="w-full flex items-center gap-3 px-4 py-3 text-[#F5F5F5] hover:bg-[#00FFE0]/10 rounded-xl transition-colors"
              >
                <DocumentDuplicateIcon className="w-5 h-5" />
                Copy Link
              </button>
              <button
                onClick={() => sharePost('twitter')}
                className="w-full flex items-center gap-3 px-4 py-3 text-[#F5F5F5] hover:bg-[#00FFE0]/10 rounded-xl transition-colors"
              >
                <LinkIcon className="w-5 h-5" />
                Twitter
              </button>
              <button
                onClick={() => sharePost('facebook')}
                className="w-full flex items-center gap-3 px-4 py-3 text-[#F5F5F5] hover:bg-[#00FFE0]/10 rounded-xl transition-colors"
              >
                <LinkIcon className="w-5 h-5" />
                Facebook
              </button>
              <button
                onClick={() => sharePost('linkedin')}
                className="w-full flex items-center gap-3 px-4 py-3 text-[#F5F5F5] hover:bg-[#00FFE0]/10 rounded-xl transition-colors"
              >
                <LinkIcon className="w-5 h-5" />
                LinkedIn
              </button>
              <button
                onClick={() => sharePost('print')}
                className="w-full flex items-center gap-3 px-4 py-3 text-[#F5F5F5] hover:bg-[#00FFE0]/10 rounded-xl transition-colors"
              >
                <PrinterIcon className="w-5 h-5" />
                Print
              </button>
            </div>
          </motion.div>
        )}

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Table of Contents - Desktop */}
              {tableOfContents.length > 0 && (
                <div className="hidden lg:block lg:col-span-1">
                  <div className="sticky top-8">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6"
                    >
                      <h3 className="text-[#F5F5F5] font-semibold mb-4 flex items-center gap-2">
                        <TagIcon className="w-5 h-5" />
                        Table of Contents
                      </h3>
                      <nav className="space-y-2">
                        {tableOfContents.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => scrollToSection(item.id)}
                            className={`block text-left w-full px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                              activeSection === item.id
                                ? 'bg-[#00FFE0]/20 text-[#00FFE0] border-l-2 border-[#00FFE0]'
                                : 'text-[#CFCFCF] hover:bg-[#00FFE0]/10 hover:text-[#00FFE0]'
                            }`}
                            style={{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }}
                          >
                            {item.text}
                          </button>
                        ))}
                      </nav>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Main Content */}
              <div className={`${tableOfContents.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
                {/* Back Button & Status */}
                <div className="mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center mb-6"
                  >
                    <button
                      onClick={() => router.back()}
                      className="inline-flex items-center gap-3 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-all duration-300 hover:scale-105"
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                      Back to Blog
                    </button>
                  </motion.div>

                  {/* Status Notice */}
                  {post.status !== 'published' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl mb-6"
                    >
                      <div className="flex items-center gap-3 text-yellow-400">
                        <TagIcon className="w-6 h-6" />
                        <span className="font-semibold text-lg">
                          {post.status === 'draft' ? 'Draft Preview' : 
                           post.status === 'pending_approval' ? 'Pending Approval' :
                           post.status === 'rejected' ? 'Rejected Post' : 'Unpublished'}
                        </span>
                      </div>
                      <p className="text-yellow-300/80 mt-2">
                        This post is not publicly visible yet.
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Article Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ opacity: headerOpacity }}
                  className="mb-8"
                >
                  {/* Categories */}
                  {post.categories && post.categories.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-6">
                      {post.categories.map((category) => (
                        <span
                          key={category._id}
                          className="px-4 py-2 bg-gradient-to-r from-[#00FFE0]/20 to-[#00D4AA]/20 text-[#00FFE0] rounded-full text-sm font-medium border border-[#00FFE0]/30 backdrop-blur-sm"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F5F5F5] to-[#CFCFCF] mb-6 leading-tight">
                    {post.title}
                  </h1>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-xl text-[#CFCFCF] leading-relaxed mb-8 font-light">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-6 mb-8">
                    <div className="flex items-center gap-3">
                      {post.authorId?.image && (
                        <img
                          src={post.authorId.image}
                          alt={post.authorId.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-[#00FFE0]/30"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2 text-[#F5F5F5] font-semibold">
                          <UserIcon className="w-5 h-5" />
                          {post.authorId?.name || 'Anonymous'}
                        </div>
                        <div className="text-[#CFCFCF] text-sm">
                          {post.authorId?.role && (
                            <span className="capitalize">{post.authorId.role}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[#CFCFCF]">
                      <CalendarIcon className="w-5 h-5" />
                      <span>
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#CFCFCF]">
                      <ClockIcon className="w-5 h-5" />
                      <span>{post.readTime || 1} min read</span>
                    </div>
                  </div>

                  {/* Engagement Bar */}
                  <div className="flex items-center justify-between bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6 mb-8">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-[#CFCFCF]">
                        <EyeIcon className="w-5 h-5" />
                        <span className="font-medium">{post.views || 0}</span>
                        <span className="text-sm">views</span>
                      </div>
                      
                      <button
                        onClick={handleLike}
                        disabled={liking}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                          likeData.liked
                            ? 'text-red-400 bg-red-400/10 border border-red-400/30'
                            : 'text-[#CFCFCF] bg-[#0A0F24]/30 border border-[#00FFE0]/20 hover:border-[#00FFE0]/40 hover:text-[#00FFE0]'
                        } ${liking ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                      >
                        {likeData.liked ? (
                          <HeartSolidIcon className="w-5 h-5" />
                        ) : (
                          <HeartIcon className="w-5 h-5" />
                        )}
                        <span className="font-medium">{likeData.likes}</span>
                      </button>

                      <button
                        onClick={handleBookmark}
                        disabled={bookmarking}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                          bookmarked
                            ? 'text-[#B936F4] bg-[#B936F4]/10 border border-[#B936F4]/30'
                            : 'text-[#CFCFCF] bg-[#0A0F24]/30 border border-[#00FFE0]/20 hover:border-[#00FFE0]/40 hover:text-[#00FFE0]'
                        } ${bookmarking ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                      >
                        {bookmarked ? (
                          <BookmarkSolidIcon className="w-5 h-5" />
                        ) : (
                          <BookmarkIcon className="w-5 h-5" />
                        )}
                        <span className="font-medium">Save</span>
                      </button>

                      {post.comments > 0 && (
                        <div className="flex items-center gap-2 text-[#CFCFCF]">
                          <ChatBubbleLeftIcon className="w-5 h-5" />
                          <span className="font-medium">{post.comments}</span>
                          <span className="text-sm">comments</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {canEdit && (
                        <Link
                          href={getEditUrl()}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#B936F4]/20 text-[#B936F4] border border-[#B936F4]/30 rounded-xl hover:bg-[#B936F4]/30 transition-all duration-300 hover:scale-105"
                        >
                          <PencilIcon className="w-5 h-5" />
                          Edit
                        </Link>
                      )}
                      <button
                        onClick={() => setShareMenuOpen(!shareMenuOpen)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#00FFE0]/20 text-[#00FFE0] border border-[#00FFE0]/30 rounded-xl hover:bg-[#00FFE0]/30 transition-all duration-300 hover:scale-105"
                      >
                        <ShareIcon className="w-5 h-5" />
                        Share
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Featured Image */}
                {post.featuredImage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-12 overflow-hidden rounded-3xl"
                    style={{ scale: imageScale }}
                  >
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-[400px] md:h-[500px] object-cover"
                    />
                  </motion.div>
                )}

                {/* Article Content */}
                <motion.article
                  ref={contentRef}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-3xl p-8 md:p-12 mb-12"
                >
                  <div 
                    className="prose prose-invert prose-xl max-w-none
                      prose-headings:text-[#F5F5F5] prose-headings:font-bold prose-headings:tracking-tight
                      prose-h1:text-4xl prose-h1:mb-8 prose-h1:mt-12 prose-h1:first:mt-0
                      prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-10 prose-h2:border-b prose-h2:border-[#00FFE0]/20 prose-h2:pb-3
                      prose-h3:text-2xl prose-h3:mb-4 prose-h3:mt-8 prose-h3:text-[#00FFE0]
                      prose-h4:text-xl prose-h4:mb-3 prose-h4:mt-6
                      prose-p:text-[#CFCFCF] prose-p:leading-relaxed prose-p:mb-6 prose-p:text-lg
                      prose-a:text-[#00FFE0] prose-a:no-underline prose-a:font-medium hover:prose-a:underline prose-a:transition-all
                      prose-strong:text-[#F5F5F5] prose-strong:font-semibold
                      prose-em:text-[#CFCFCF] prose-em:italic
                      prose-blockquote:border-l-4 prose-blockquote:border-[#00FFE0] prose-blockquote:bg-[#0A0F24]/40 prose-blockquote:p-6 prose-blockquote:rounded-r-2xl prose-blockquote:my-8
                      prose-blockquote:text-[#F5F5F5] prose-blockquote:italic prose-blockquote:text-xl
                      prose-code:text-[#00FFE0] prose-code:bg-[#0A0F24]/60 prose-code:px-3 prose-code:py-1 prose-code:rounded-lg prose-code:font-mono prose-code:text-sm
                      prose-pre:bg-[#0A0F24]/80 prose-pre:border prose-pre:border-[#00FFE0]/20 prose-pre:rounded-2xl prose-pre:p-6 prose-pre:overflow-x-auto
                      prose-ul:text-[#CFCFCF] prose-ul:my-6 prose-ol:text-[#CFCFCF] prose-ol:my-6
                      prose-li:text-[#CFCFCF] prose-li:my-2 prose-li:leading-relaxed
                      prose-img:rounded-2xl prose-img:shadow-2xl prose-img:my-8
                      prose-hr:border-[#00FFE0]/20 prose-hr:my-12
                      prose-table:border-collapse prose-table:my-8
                      prose-th:bg-[#0A0F24]/60 prose-th:text-[#F5F5F5] prose-th:font-semibold prose-th:p-4 prose-th:border prose-th:border-[#00FFE0]/20
                      prose-td:text-[#CFCFCF] prose-td:p-4 prose-td:border prose-td:border-[#00FFE0]/10"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </motion.article>

                {/* Tags Section */}
                {post.tags && post.tags.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-3xl p-8 mb-12"
                  >
                    <h3 className="text-[#F5F5F5] font-bold text-2xl mb-6 flex items-center gap-3">
                      <TagIcon className="w-6 h-6 text-[#00FFE0]" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-4 py-2 bg-gradient-to-r from-[#B936F4]/20 to-[#8B5CF6]/20 text-[#B936F4] rounded-full text-sm font-medium border border-[#B936F4]/30 backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Author Bio */}
                {post.authorId?.bio && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-[#0A0F24]/50 to-[#1A1F3A]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-3xl p-8"
                  >
                    <div className="flex items-start gap-6">
                      {post.authorId.image && (
                        <img
                          src={post.authorId.image}
                          alt={post.authorId.name}
                          className="w-20 h-20 rounded-full object-cover ring-4 ring-[#00FFE0]/30 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-[#F5F5F5] font-bold text-2xl mb-3">
                          About {post.authorId.name}
                        </h3>
                        {post.authorId.role && (
                          <div className="mb-3">
                            <span className="px-3 py-1 bg-[#00FFE0]/20 text-[#00FFE0] rounded-full text-sm font-medium capitalize">
                              {post.authorId.role}
                            </span>
                          </div>
                        )}
                        <p className="text-[#CFCFCF] leading-relaxed text-lg">
                          {post.authorId.bio}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 