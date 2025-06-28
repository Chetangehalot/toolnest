"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Color variants for category backgrounds
  const colorVariants = {
    indigo: "bg-indigo-100 text-indigo-600",
    purple: "bg-purple-100 text-purple-600",
    pink: "bg-pink-100 text-pink-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <p className="mt-2 text-gray-600">
          Browse AI tools by category to find the perfect solution for your needs
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4" />
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))
        ) : error ? (
          <div className="col-span-full text-center text-red-600">
            {error}
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full text-center text-gray-600">
            No categories found
          </div>
        ) : (
          categories.map((category, index) => (
            <motion.div
              key={category._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                href={`/categories/${category.slug}`}
                className="block h-full"
              >
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 h-full">
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 ${colorVariants[category.color || 'indigo']} rounded-lg flex items-center justify-center`}>
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <span className="text-sm text-gray-500">{category.count || 0} tools</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-gray-600">{category.description}</p>
                  <div className="mt-4 flex items-center text-indigo-600 font-medium">
                    Browse Tools
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>

      {/* Featured Category */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-8 text-white">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold">Looking for something specific?</h2>
            <p className="mt-2 text-indigo-100">
              Can&apos;t find what you&apos;re looking for? Let us know and we&apos;ll help you find the perfect AI tool for your needs.
            </p>
            <button className="mt-4 px-6 py-3 bg-white text-indigo-600 rounded-full font-medium hover:bg-indigo-50 transition-colors">
              Request a Tool
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
