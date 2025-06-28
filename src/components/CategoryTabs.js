import React from "react";

const categories = [
  { id: "all", label: "All", color: "bg-[#00FFE0]/20 text-[#00FFE0] border-[#00FFE0]/30" },
  { id: "text", label: "Text", color: "bg-[#B936F4]/20 text-[#B936F4] border-[#B936F4]/30" },
  { id: "image", label: "Image", color: "bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30" },
  { id: "audio", label: "Audio", color: "bg-[#4ECDC4]/20 text-[#4ECDC4] border-[#4ECDC4]/30" },
  { id: "video", label: "Video", color: "bg-[#FF4D4D]/20 text-[#FF4D4D] border-[#FF4D4D]/30" },
  { id: "code", label: "Code", color: "bg-[#9C27B0]/20 text-[#9C27B0] border-[#9C27B0]/30" },
  { id: "data", label: "Data", color: "bg-[#FF9800]/20 text-[#FF9800] border-[#FF9800]/30" }
];

export default function CategoryTabs({ category, setCategory }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-6 py-4 px-2 relative z-20" role="tablist" aria-label="Category Tabs">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setCategory(cat.id)}
          className={`px-4 py-2 rounded-full font-medium border transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#00FFE0]/50 focus:ring-offset-2 focus:ring-offset-[#0A0F24] ${
            category === cat.id
              ? `${cat.color} shadow-lg ring-1 ring-opacity-30`
              : "bg-[#0A0F24]/50 text-[#CFCFCF] border-[#00FFE0]/20 hover:border-[#00FFE0]/40 hover:bg-[#0A0F24]/70"
          }`}
          role="tab"
          aria-selected={category === cat.id}
          aria-pressed={category === cat.id}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
} 
