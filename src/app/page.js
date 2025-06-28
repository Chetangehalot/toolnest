"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Search,
  Sparkles,
  Code,
  Image,
  MessageSquare,
  Music,
  Video,
  Zap,
} from "lucide-react";
import ToolCard from '@/components/ToolCard';
import NeuralNetwork from "@/components/NeuralNetwork";

export default function Home() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    { name: "All", icon: Sparkles },
    { name: "Text", icon: MessageSquare },
    { name: "Image", icon: Image },
    { name: "Code", icon: Code },
    { name: "Audio", icon: Music },
    { name: "Video", icon: Video },
    { name: "Other", icon: Zap },
  ];

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const queryParams = new URLSearchParams({
          sort: 'trending',
          limit: 15,
          category: selectedCategory !== "All" ? selectedCategory : ""
        });

        const response = await fetch(`/api/tools?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch tools');
        const data = await response.json();
        setTools(data.tools);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, [selectedCategory]);

  return (
    <div className="min-h-screen relative">
      {/* Neural Network Background */}
      <div className="fixed inset-0 z-0">
        <NeuralNetwork />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-32 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-bold mb-6"
            >
              <span className="text-[#F5F5F5]">Discover the Best</span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00FFE0]/80 to-[#B936F4]/80">
                AI Tools for Your Needs
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[#CFCFCF] text-lg md:text-xl mb-12 max-w-2xl mx-auto"
            >
              Explore our curated collection of cutting-edge AI tools. Find the perfect solution to enhance your productivity and creativity.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative max-w-2xl mx-auto mb-8"
            >
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const searchQuery = formData.get('search')?.trim();
                if (searchQuery) {
                  window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
                } else {
                  // Focus the input and show placeholder message
                  const input = e.target.querySelector('input[name="search"]');
                  input.focus();
                  input.placeholder = "Please enter a search term";
                  setTimeout(() => {
                    input.placeholder = "Search for AI tools, articles, and more...";
                  }, 2000);
                }
              }}>
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    placeholder="Search for AI tools, articles, and more..."
                    className="w-full px-6 py-4 pl-12 rounded-2xl bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/10 text-[#F5F5F5] placeholder-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#00FFE0]/20 focus:border-transparent cursor-text"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#00FFE0]/60" />
                  <button 
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-xl bg-[#00FFE0]/10 text-[#00FFE0] hover:bg-[#00FFE0]/20 transition-colors cursor-pointer hover:scale-105 duration-200"
                  >
                    Search
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Category Filter Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 mb-12 overflow-x-auto py-4 px-2 justify-center scrollbar-hide relative z-20"
            >
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <motion.button
                    key={category.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-[#00FFE0]/50 focus:ring-offset-2 focus:ring-offset-[#0A0F24]
                      ${selectedCategory === category.name
                        ? "bg-[#00FFE0]/20 text-[#00FFE0] ring-1 ring-[#00FFE0]/30"
                        : "bg-white/5 text-[#CFCFCF] hover:text-[#00FFE0] hover:bg-white/10"}
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Latest Tools Section */}
        <section className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#F5F5F5] sm:text-4xl">
                Trending AI Tools
              </h2>
              <p className="mt-4 text-lg text-[#CFCFCF]">
                Discover the most popular AI tools right now
              </p>
            </div>

            {/* Tools Grid */}
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
                  <ToolCard key={tool._id} {...tool} index={index} />
                ))
              )}
            </div>

            {/* View All Button */}
            <div className="mt-12 text-center">
              <Link
                href="/tools"
                className="inline-flex items-center px-6 py-3 rounded-full bg-[#00FFE0]/10 text-[#00FFE0] hover:bg-[#00FFE0]/20 transition-all duration-300 cursor-pointer hover:scale-105"
              >
                View All Tools
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
