"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { StarIcon } from "@heroicons/react/24/solid";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import BookmarkButton from "./BookmarkButton";

export default function ToolCard({
  name = "",
  description = "",
  category = "",
  rating = 0,
  trending = false,
  image = "/images/placeholder-image.jpeg",
  logo = "/images/placeholder-logo.jpeg",
  website = "#",
  tags = [],
  price = "Free",
  specifications = {},
  viewMode = "grid",
  _id,
  slug,
}) {
  // Format image URL for Next.js Image component
  const formatImagePath = (path) => {
    if (!path) return "/images/placeholder-image.jpeg";
    
    try {
      // If it's a URL, return as is
      if (path.startsWith('http')) {
        return path;
      }
      
      // If it's a Windows path, convert to URL format
      if (path.includes('\\')) {
        // Remove the drive letter and convert backslashes to forward slashes
        const cleanPath = path.split('\\').slice(1).join('/');
        return `/${cleanPath}`;
      }
      
      // If it's a local path, ensure it starts with /
      if (!path.startsWith('/')) {
        return `/${path}`;
      }
      
      return path;
    } catch (error) {
      return "/images/placeholder-image.jpeg";
    }
  };

  const imageUrl = formatImagePath(image);
  const logoUrl = formatImagePath(logo);
  const toolSlug = slug || specifications?.slug || name.toLowerCase().replace(/\s+/g, '-');

  const handleWebsiteClick = (e) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && website && website !== '#') {
      window.open(website, '_blank', 'noopener,noreferrer');
    }
  };

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
  };

  return (
    <Link href={`/tools/${toolSlug}`} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ 
          y: -8,
          scale: 1.02,
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        whileTap={{ scale: 0.98 }}
        className={`relative group cursor-pointer h-full ${
          viewMode === "list" ? "flex items-center gap-6 p-6" : "flex flex-col"
        } card card-hover bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#00FFE0]/40 hover:shadow-xl hover:shadow-[#00FFE0]/10`}
      >
        {viewMode === "list" ? (
          // List View Layout
          <>
            {/* Tool Image and Logo */}
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#0A0F24] border border-[#00FFE0]/20 flex-shrink-0">
              <Image
                src={imageUrl}
                alt={name}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized={imageUrl.startsWith('http')}
                onError={(e) => {
                  e.target.src = "/images/placeholder-image.jpeg";
                }}
              />
              <div className="absolute bottom-1 right-1 w-6 h-6 rounded overflow-hidden bg-[#0A0F24] border border-[#00FFE0]/20">
                <Image
                  src={logoUrl}
                  alt={`${name} logo`}
                  fill
                  sizes="24px"
                  className="object-contain p-0.5"
                  unoptimized={logoUrl.startsWith('http')}
                  onError={(e) => {
                    e.target.src = "/images/placeholder-logo.jpeg";
                  }}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Title and Rating */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#F5F5F5] group-hover:text-[#00FFE0] transition-colors truncate pr-2">{name}</h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <StarIcon className="w-4 h-4 text-yellow-400" />
                  <span className="text-[#CFCFCF] font-medium text-sm">{rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[#CFCFCF] text-sm line-clamp-2">{description}</p>

              {/* Tags and Meta Info */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  {category && (
                    <span className="px-2 py-1 text-xs rounded-full bg-[#00FFE0]/20 text-[#00FFE0] border border-[#00FFE0]/30">
                      {category}
                    </span>
                  )}
                  <span className="px-2 py-1 text-xs rounded-full bg-[#B936F4]/20 text-[#B936F4] border border-[#B936F4]/30">
                    {price}
                  </span>
                  {rating >= 4.5 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      Top Rated
                    </span>
                  )}
                  {trending && (
                    <span className="px-2 py-1 text-xs rounded-full bg-[#B936F4]/20 text-[#B936F4] border border-[#B936F4]/30">
                      Trending
                    </span>
                  )}
                </div>
                
                {tags && tags.length > 0 && (
                  <div className="flex gap-1">
                    {tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs rounded-full bg-[#CFCFCF]/10 text-[#CFCFCF] border border-[#CFCFCF]/20"
                      >
                        {tag}
                      </span>
                    ))}
                    {tags.length > 2 && (
                      <span className="px-2 py-1 text-xs rounded-full bg-[#CFCFCF]/10 text-[#CFCFCF] border border-[#CFCFCF]/20">
                        +{tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {_id && (
                <div onClick={handleBookmarkClick}>
                  <BookmarkButton toolId={_id} />
                </div>
              )}
              {website && website !== '#' && (
                <button
                  onClick={handleWebsiteClick}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#B936F4]/20 text-[#B936F4] hover:bg-[#B936F4]/30 transition-all duration-200 text-sm border border-[#B936F4]/30 cursor-pointer hover:scale-105"
                  title="Visit website"
                >
                  <span>Visit</span>
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </button>
              )}
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#00FFE0]/20 text-[#00FFE0] group-hover:bg-[#00FFE0]/10 transition-colors text-sm cursor-pointer">
                <span>Details</span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </span>
            </div>
          </>
        ) : (
          // Grid View Layout (Original)
          <div className="relative overflow-hidden">
            {/* Header Image */}
            <div className="relative aspect-video">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F24] to-transparent z-10" />
              <div className="relative w-full h-full">
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  unoptimized={imageUrl.startsWith('http')}
                  priority
                  onError={(e) => {
                    e.target.src = "/images/placeholder-image.jpeg";
                  }}
                />
              </div>
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2 z-20">
                {rating >= 4.5 && (
                  <span className="px-2 py-1 text-sm rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    Top Rated
                  </span>
                )}
                {trending && (
                  <span className="px-2 py-1 text-sm rounded-full bg-[#B936F4]/20 text-[#B936F4] border border-[#B936F4]/30">
                    Trending
                  </span>
                )}
                {category && (
                  <span className="px-2 py-1 text-sm rounded-full bg-[#00FFE0]/20 text-[#00FFE0] border border-[#00FFE0]/30">
                    {category}
                  </span>
                )}
              </div>

              {/* Bookmark Button */}
              {_id && (
                <div className="absolute top-3 right-3 z-20" onClick={handleBookmarkClick}>
                  <BookmarkButton toolId={_id} />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 relative z-20 flex-1 flex flex-col">
              {/* Title, Logo and Rating */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#0A0F24] border border-[#00FFE0]/20">
                    <div className="relative w-full h-full">
                      <Image
                        src={logoUrl}
                        alt={`${name} logo`}
                        fill
                        sizes="40px"
                        className="object-contain p-1"
                        unoptimized={logoUrl.startsWith('http')}
                        onError={(e) => {
                          e.target.src = "/images/placeholder-logo.jpeg";
                        }}
                      />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#F5F5F5] group-hover:text-[#00FFE0] transition-colors cursor-pointer">{name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <StarIcon className="w-4 h-4 text-yellow-400" />
                  <span className="text-[#CFCFCF] font-semibold">{rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[#CFCFCF] mb-4 line-clamp-2 cursor-text select-text">{description}</p>

              {/* Tags */}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-sm rounded-full bg-[#00FFE0]/10 text-[#00FFE0] border border-[#00FFE0]/20 cursor-help"
                      title={`Filter by ${tag}`}
                    >
                      {tag}
                    </span>
                  ))}
                  {tags.length > 3 && (
                    <span className="px-2 py-1 text-sm rounded-full bg-[#CFCFCF]/10 text-[#CFCFCF] border border-[#CFCFCF]/20 cursor-help" title={`${tags.length - 3} more tags`}>
                      +{tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-sm text-[#CFCFCF] mb-4">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Price:</span>
                  <span className="text-[#00FFE0]">{price}</span>
                </div>
                {specifications.difficulty && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Difficulty:</span>
                    <span>{specifications.difficulty}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-auto pt-2">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#00FFE0]/20 text-[#00FFE0] group-hover:bg-[#00FFE0]/10 transition-colors font-semibold cursor-pointer">
                  <span>View Details</span>
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </span>
                
                {website && website !== '#' && (
                  <button
                    onClick={handleWebsiteClick}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B936F4]/20 text-[#B936F4] hover:bg-[#B936F4]/30 transition-all duration-200 font-semibold border border-[#B936F4]/30 cursor-pointer hover:scale-105"
                    title="Visit website"
                  >
                    <span>Visit Website</span>
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00FFE0]/5 to-[#B936F4]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        )}
      </motion.div>
    </Link>
  );
} 
