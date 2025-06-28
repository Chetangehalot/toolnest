"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Grid,
  List,
  Sparkles,
  Star,
  TrendingUp,
  Code,
  Image,
  MessageSquare,
  Music,
  Video,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ToolCard from "@/components/ToolCard";
import NeuralNetwork from "@/components/NeuralNetwork";

const categories = [
  { name: "All", icon: Sparkles },
  { name: "Text", icon: MessageSquare },
  { name: "Image", icon: Image },
  { name: "Code", icon: Code },
  { name: "Audio", icon: Music },
  { name: "Video", icon: Video },
  { name: "Other", icon: Zap },
];

export default function ToolsPage() {
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchTools = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: 15,
          sort: sortBy,
          category: selectedCategory !== "All" ? selectedCategory : "",
          search: searchQuery,
        });

        const response = await fetch(`/api/tools?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch tools');
        const data = await response.json();
        setTools(data.tools);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchTools, 300);
    return () => clearTimeout(debounceTimer);
  }, [currentPage, sortBy, selectedCategory, searchQuery]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#0A0F24]">
      {/* Neural Network Background */}
      <div className="fixed inset-0 z-0">
        <NeuralNetwork />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="container mx-auto px-4 pt-32 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-[#F5F5F5] mb-4">
              AI Tools Directory
            </h1>
            <p className="text-[#CFCFCF] text-lg max-w-2xl mx-auto">
              Discover and compare the best AI tools for your needs
            </p>
          </motion.div>

          {/* Search and Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 mb-8"
          >
            {/* Search Bar and View Toggle */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#CFCFCF] w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search AI tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#0A0F24]/30 border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF]/50 focus:outline-none focus:ring-2 focus:ring-[#00FFE0]/50 focus:border-transparent transition-all duration-200 hover:border-[#00FFE0]/40 cursor-text"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-[#0A0F24]/30 border border-[#00FFE0]/20 rounded-xl p-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-[#00FFE0]/20 text-[#00FFE0] shadow-lg"
                      : "text-[#CFCFCF] hover:text-[#00FFE0] hover:bg-[#00FFE0]/10"
                  }`}
                  title="Grid view"
                >
                  <Grid className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-[#00FFE0]/20 text-[#00FFE0] shadow-lg"
                      : "text-[#CFCFCF] hover:text-[#00FFE0] hover:bg-[#00FFE0]/10"
                  }`}
                  title="List view"
                >
                  <List className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Sort Options */}
              <div className="flex items-center">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-3 rounded-xl bg-[#0A0F24]/30 border border-[#00FFE0]/20 text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#00FFE0]/50 focus:border-transparent cursor-pointer transition-all duration-200 hover:border-[#00FFE0]/40"
                >
                  <option value="newest">Newest First</option>
                  <option value="trending">Trending</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-3 overflow-x-auto py-4 px-2 scrollbar-hide relative z-20">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <motion.button
                    key={category.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedCategory(category.name);
                      setCurrentPage(1);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap cursor-pointer transition-all duration-200 min-w-fit focus:outline-none focus:ring-2 focus:ring-[#00FFE0]/50 focus:ring-offset-2 focus:ring-offset-[#0A0F24] ${
                      selectedCategory === category.name
                        ? "bg-[#00FFE0]/20 text-[#00FFE0] border border-[#00FFE0]/40 shadow-lg ring-1 ring-[#00FFE0]/30"
                        : "bg-[#0A0F24]/30 text-[#CFCFCF] hover:text-[#00FFE0] hover:bg-[#00FFE0]/10 hover:border-[#00FFE0]/20 border border-[#00FFE0]/10"
                    }`}
                    title={`Filter by ${category.name} tools`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{category.name}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Active Filters Display */}
            {(searchQuery || selectedCategory !== "All") && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#00FFE0]/10">
                <span className="text-[#CFCFCF] text-sm font-medium">Active filters:</span>
                {searchQuery && (
                  <span className="px-3 py-1 bg-[#B936F4]/20 text-[#B936F4] rounded-full text-sm border border-[#B936F4]/30">
                    Search: &quot;{searchQuery}&quot;
                  </span>
                )}
                {selectedCategory !== "All" && (
                  <span className="px-3 py-1 bg-[#00FFE0]/20 text-[#00FFE0] rounded-full text-sm border border-[#00FFE0]/30">
                    Category: {selectedCategory}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm border border-red-500/30 hover:bg-red-500/30 transition-all duration-200 cursor-pointer hover:scale-105"
                  title="Clear all filters"
                >
                  Clear All
                </button>
              </div>
            )}
          </motion.div>

          {/* Tools Grid */}
          <div className={`grid gap-8 mb-12 ${
            viewMode === "grid" 
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-1"
          }`}>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 15 }).map((_, index) => (
                <div key={index} className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 animate-pulse">
                  <div className="w-12 h-12 bg-[#00FFE0]/10 rounded-lg mb-4" />
                  <div className="h-6 bg-[#00FFE0]/10 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-[#00FFE0]/10 rounded w-full mb-4" />
                  <div className="h-4 bg-[#00FFE0]/10 rounded w-1/2" />
                </div>
              ))
            ) : error ? (
              <div className="col-span-full text-center text-red-600">
                {error}
              </div>
            ) : tools.length === 0 ? (
              <div className="col-span-full text-center text-[#CFCFCF]">
                No tools found
              </div>
            ) : (
              tools.map((tool, index) => (
                <motion.div
                  key={tool._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ToolCard 
                    _id={tool._id}
                    name={tool.name}
                    description={tool.description}
                    category={tool.category}
                    rating={tool.rating}
                    trending={tool.trending}
                    image={tool.image}
                    logo={tool.logo}
                    website={tool.website}
                    tags={tool.tags}
                    price={tool.price}
                    specifications={tool.specifications}
                    viewMode={viewMode}
                  />
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && tools.length > 0 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  currentPage === 1
                    ? "bg-white/5 text-[#CFCFCF]/50 cursor-not-allowed opacity-50"
                    : "bg-white/5 text-[#CFCFCF] hover:text-[#00FFE0] hover:bg-[#00FFE0]/10 cursor-pointer hover:scale-105"
                }`}
                title={currentPage === 1 ? "No previous page" : "Previous page"}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-[#CFCFCF] cursor-default select-none">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  currentPage === totalPages
                    ? "bg-white/5 text-[#CFCFCF]/50 cursor-not-allowed opacity-50"
                    : "bg-white/5 text-[#CFCFCF] hover:text-[#00FFE0] hover:bg-[#00FFE0]/10 cursor-pointer hover:scale-105"
                }`}
                title={currentPage === totalPages ? "No next page" : "Next page"}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
