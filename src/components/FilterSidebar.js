"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronDown,
  ChevronUp,
  Check,
  DollarSign,
  Code,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  Puzzle,
} from "lucide-react";

export default function FilterSidebar({ isOpen, onClose }) {
  const [expandedSections, setExpandedSections] = useState({
    pricing: true,
    platform: true,
    model: true,
    difficulty: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const filterSections = [
    {
      id: "pricing",
      title: "Pricing Model",
      icon: DollarSign,
      options: [
        { id: "free", label: "Free" },
        { id: "freemium", label: "Freemium" },
        { id: "paid", label: "Paid" },
      ],
    },
    {
      id: "platform",
      title: "Platform",
      icon: Globe,
      options: [
        { id: "web", label: "Web", icon: Globe },
        { id: "mobile", label: "Mobile", icon: Smartphone },
        { id: "desktop", label: "Desktop", icon: Monitor },
        { id: "plugin", label: "Plugin", icon: Puzzle },
      ],
    },
    {
      id: "model",
      title: "AI Model",
      icon: Code,
      options: [
        { id: "gpt4", label: "GPT-4" },
        { id: "gpt35", label: "GPT-3.5" },
        { id: "claude", label: "Claude" },
        { id: "sdxl", label: "SDXL" },
        { id: "gemini", label: "Gemini" },
      ],
    },
    {
      id: "difficulty",
      title: "Difficulty Level",
      icon: Zap,
      options: [
        { id: "beginner", label: "Beginner" },
        { id: "intermediate", label: "Intermediate" },
        { id: "pro", label: "Professional" },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0A0F24] border-l border-[#00FFE0]/10 z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-[#F5F5F5]">Filters</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/5 text-[#CFCFCF] hover:text-[#00FFE0] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Sections */}
              <div className="space-y-6">
                {filterSections.map((section) => (
                  <div key={section.id} className="border-b border-[#00FFE0]/10 pb-6">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center justify-between w-full mb-4"
                    >
                      <div className="flex items-center gap-2">
                        <section.icon className="w-5 h-5 text-[#00FFE0]" />
                        <span className="text-[#F5F5F5] font-medium">
                          {section.title}
                        </span>
                      </div>
                      {expandedSections[section.id] ? (
                        <ChevronUp className="w-5 h-5 text-[#CFCFCF]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#CFCFCF]" />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedSections[section.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-2"
                        >
                          {section.options.map((option) => (
                            <label
                              key={option.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer group"
                            >
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  className="peer sr-only"
                                />
                                <div className="w-5 h-5 border-2 border-[#00FFE0]/20 rounded-md peer-checked:border-[#00FFE0] peer-checked:bg-[#00FFE0]/20 transition-colors group-hover:border-[#00FFE0]/40" />
                                <Check className="w-4 h-4 text-[#00FFE0] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity" />
                              </div>
                              <span className="text-[#CFCFCF] group-hover:text-[#F5F5F5] transition-colors">
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0A0F24] border-t border-[#00FFE0]/10">
                <div className="flex gap-4">
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-[#CFCFCF] hover:bg-white/10 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00FFE0] to-[#B936F4] text-[#0A0F24] font-medium hover:opacity-90 transition-opacity"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 
