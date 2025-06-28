'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  StarIcon,
  SparklesIcon,
  TrophyIcon,
  FireIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Layout from '@/components/layout/Layout';
import ToolGrid from '@/components/ToolGrid';

// Loading skeleton component
const SkeletonCard = ({ index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl overflow-hidden"
  >
    <div className="aspect-video bg-gradient-to-r from-[#00FFE0]/10 to-[#B936F4]/10 animate-pulse" />
    <div className="p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-[#00FFE0]/20 rounded-lg animate-pulse" />
        <div className="h-6 bg-[#00FFE0]/20 rounded-lg flex-1 animate-pulse" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-[#CFCFCF]/20 rounded animate-pulse" />
        <div className="h-4 bg-[#CFCFCF]/20 rounded w-3/4 animate-pulse" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-[#00FFE0]/20 rounded-full animate-pulse" />
        <div className="h-6 w-20 bg-[#00FFE0]/20 rounded-full animate-pulse" />
      </div>
    </div>
  </motion.div>
);

// Stats component
const StatsCard = ({ icon: Icon, label, value, color = "text-[#00FFE0]" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-xl p-4 text-center"
  >
    <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-r from-[#00FFE0]/20 to-[#B936F4]/20 flex items-center justify-center`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div className="text-2xl font-bold text-[#F5F5F5] mb-1">{value}</div>
    <div className="text-sm text-[#CFCFCF]">{label}</div>
  </motion.div>
);

export default function TopRatedPage() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTopRatedTools();
  }, []);

  const fetchTopRatedTools = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('/api/tools?minRating=4.5&sort=rating', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch top-rated tools: ${response.status}`);
      }

      const data = await response.json();
      setTools(data.tools || []);
    } catch (error) {
      console.error('Error fetching top-rated tools:', error);
      if (error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(`Failed to load top-rated tools: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    totalTools: tools.length,
    averageRating: tools.length > 0 ? (tools.reduce((sum, tool) => sum + tool.rating, 0) / tools.length).toFixed(1) : 0,
    trendingCount: tools.filter(tool => tool.trending).length,
    topRatedCount: tools.filter(tool => tool.rating >= 4.8).length
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Skeleton */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-32 h-10 bg-[#0A0F24]/50 rounded-xl animate-pulse" />
              </div>
              
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-full animate-pulse" />
                  <div className="h-10 w-64 bg-[#F5F5F5]/20 rounded-lg animate-pulse" />
                </div>
                <div className="h-6 w-96 bg-[#CFCFCF]/20 rounded-lg mx-auto mb-4 animate-pulse" />
                <div className="h-4 w-48 bg-[#CFCFCF]/20 rounded mx-auto animate-pulse" />
              </div>
            </div>

            {/* Loading Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <SkeletonCard key={index} index={index} />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 backdrop-blur-lg border border-red-500/20 rounded-2xl p-8"
            >
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] mb-4">Unable to Load Top-Rated Tools</h2>
              <p className="text-[#CFCFCF] mb-6">{error}</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={fetchTopRatedTools}
                  className="px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-all duration-300 font-semibold hover:scale-105"
                >
                  Try Again
                </button>
                <Link
                  href="/tools"
                  className="px-6 py-3 bg-[#0A0F24]/50 border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-all duration-300 font-semibold"
                >
                  Browse All Tools
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            
            <div className="text-center">
              {/* Hero Section */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
                      <TrophyIcon className="w-10 h-10 text-yellow-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <StarIconSolid className="w-3 h-3 text-[#0A0F24]" />
                    </div>
                  </div>
                  <div className="text-left">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#F5F5F5] mb-2">
                      Top Rated Tools
                    </h1>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-[#CFCFCF] font-medium">4.5+ Rating</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-[#CFCFCF] text-lg md:text-xl mb-6 max-w-2xl mx-auto">
                  Discover the highest-rated AI tools trusted by our community. 
                  Only the best make it here with 4.5+ star ratings.
                </p>
              </motion.div>

              {/* Stats Grid */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
              >
                <StatsCard 
                  icon={ChartBarIcon} 
                  label="Total Tools" 
                  value={stats.totalTools} 
                  color="text-[#00FFE0]"
                />
                <StatsCard 
                  icon={StarIconSolid} 
                  label="Avg Rating" 
                  value={`${stats.averageRating}★`} 
                  color="text-yellow-400"
                />
                <StatsCard 
                  icon={FireIcon} 
                  label="Trending" 
                  value={stats.trendingCount} 
                  color="text-[#B936F4]"
                />
                <StatsCard 
                  icon={TrophyIcon} 
                  label="Premium (4.8+)" 
                  value={stats.topRatedCount} 
                  color="text-orange-400"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Tools Grid */}
          <AnimatePresence>
            {tools.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <ToolGrid tools={tools} />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="max-w-md mx-auto">
                  <div className="w-32 h-32 bg-gradient-to-r from-[#00FFE0]/20 to-[#B936F4]/20 rounded-full flex items-center justify-center mx-auto mb-8">
                    <SparklesIcon className="w-16 h-16 text-[#00FFE0]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#F5F5F5] mb-4">No Top-Rated Tools Yet</h3>
                  <p className="text-[#CFCFCF] mb-8 leading-relaxed">
                    We're still collecting ratings from our community. 
                    Be the first to discover and rate amazing AI tools!
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Link
                      href="/tools"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-all duration-300 font-semibold hover:scale-105"
                    >
                      <SparklesIcon className="w-5 h-5" />
                      Explore All Tools
                    </Link>
                    <button
                      onClick={fetchTopRatedTools}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-all duration-300 font-semibold"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-r from-[#0A0F24]/50 to-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <TrophyIcon className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold text-[#F5F5F5]">Premium AI Tools Directory</h2>
              </div>
              <p className="text-[#CFCFCF] max-w-2xl mx-auto leading-relaxed">
                Our top-rated section features only the highest quality AI tools with 4.5+ star ratings 
                from verified users. Each tool has been tested and reviewed by our community to ensure 
                you get the best AI solutions for your needs.
              </p>
              <div className="flex items-center justify-center gap-6 mt-6 text-sm text-[#CFCFCF]">
                <div className="flex items-center gap-2">
                  <StarIconSolid className="w-4 h-4 text-yellow-400" />
                  <span>Community Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <FireIcon className="w-4 h-4 text-[#B936F4]" />
                  <span>Trending Updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrophyIcon className="w-4 h-4 text-orange-400" />
                  <span>Premium Quality</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 
