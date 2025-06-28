import React from "react";
import { motion } from "framer-motion";
import ToolCard from "./ToolCard";

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export default function ToolGrid({ tools }) {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
    >
      {tools.map((tool, index) => (
        <motion.div
          key={tool._id || tool.name}
          variants={itemVariants}
          className="h-full"
        >
          <ToolCard 
            {...tool}
          />
        </motion.div>
      ))}
    </motion.div>
  );
} 
