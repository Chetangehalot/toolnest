"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Card({ title, description, icon, link, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`card card-gradient animated-border glow ${className}`}
    >
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-white font-semibold text-xl mb-2">{title}</h3>
        <p className="text-gray-400 mb-4">{description}</p>
        {link && (
          <Link
            href={link}
            className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors"
          >
            Learn more
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        )}
      </div>
    </motion.div>
  );
} 
