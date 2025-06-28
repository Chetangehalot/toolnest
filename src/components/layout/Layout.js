"use client";

import React from "react";
import { motion } from "framer-motion";
import NeuralNetwork from "../NeuralNetwork";

export default function Layout({ children, showNeuralNetwork = true }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F24] via-[#1A1F34] to-[#0A0F24] relative overflow-hidden">
      {showNeuralNetwork && <NeuralNetwork />}
      
      {/* Main content with proper spacing from navbar */}
      <main className="relative z-10 pt-20 min-h-screen">
        {children}
      </main>
    </div>
  );
} 
