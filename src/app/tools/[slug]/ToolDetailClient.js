"use client";
import Link from 'next/link';
import Image from 'next/image';
import { StarIcon } from '@heroicons/react/20/solid';
import { 
  StarIcon as StarOutlineIcon, 
  FireIcon, 
  ArrowTopRightOnSquareIcon, 
  TagIcon, 
  ChevronRightIcon, 
  HomeIcon, 
  ShareIcon,
  CheckIcon,
  XMarkIcon,
  CpuChipIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  CodeBracketIcon,
  DevicePhoneMobileIcon,
  PuzzlePieceIcon,
  SparklesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import ReviewList from '@/components/ReviewList';
import BookmarkButton from '@/components/BookmarkButton';
import { motion } from 'framer-motion';

export default function ToolDetailClient({ tool, slug }) {
  // Early return if tool data is not available
  if (!tool) {
    return (
      <div className="min-h-screen bg-[#0A0F24] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00FFE0] mx-auto mb-4"></div>
          <p className="text-[#F5F5F5] text-lg">Loading tool details...</p>
        </div>
      </div>
    );
  }
  // Helper for animated stats
  function AnimatedNumber({ value }) {
    return <span>{value}</span>;
  }

  // Helper for sharing
  function ShareButtons() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    return (
      <div className="flex gap-2 mt-2">
        <button 
          title="Copy link" 
          className="p-2 rounded-lg bg-[#0A0F24]/60 hover:bg-[#00FFE0]/10 border border-[#00FFE0]/20 transition-colors" 
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(url).catch(err => console.error('Failed to copy:', err));
            }
          }}
        >
          <ShareIcon className="w-5 h-5 text-[#00FFE0]" />
        </button>
        <a 
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=Check out ${tool?.name || 'this tool'} on Toolnest!`} 
          target="_blank" 
          rel="noopener noreferrer" 
          title="Share on Twitter" 
          className="p-2 rounded-lg bg-[#0A0F24]/60 hover:bg-[#00FFE0]/10 border border-[#00FFE0]/20 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.46 6c-.77.35-1.6.58-2.47.69a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04A4.28 4.28 0 0 0 16.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.11.99C7.69 9.13 4.07 7.38 1.64 4.7c-.37.64-.58 1.38-.58 2.17 0 1.5.76 2.82 1.92 3.6-.7-.02-1.36-.21-1.94-.53v.05c0 2.1 1.5 3.85 3.5 4.25-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.7 2.1 2.94 3.95 2.97A8.6 8.6 0 0 1 2 19.54c-.29 0-.57-.02-.85-.05A12.13 12.13 0 0 0 8.29 21.5c7.55 0 11.68-6.26 11.68-11.68 0-.18 0-.36-.01-.54A8.18 8.18 0 0 0 22.46 6z" />
          </svg>
        </a>
        <a 
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          title="Share on LinkedIn" 
          className="p-2 rounded-lg bg-[#0A0F24]/60 hover:bg-[#00FFE0]/10 border border-[#00FFE0]/20 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 11.28h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-10h2.88v1.36h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v5.59z" />
          </svg>
        </a>
      </div>
    );
  }

  // Helper for clickable tags
  function TagPills() {
    if (!tool.tags || tool.tags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {tool.tags.map((tag) => (
          <Link key={tag} href={`/search-results?tag=${encodeURIComponent(tag)}`}>
            <motion.span 
              whileHover={{ scale: 1.08 }} 
              whileTap={{ scale: 0.95 }} 
              className="px-3 py-1 rounded-full bg-[#00FFE0]/10 text-[#00FFE0] border border-[#00FFE0]/20 cursor-pointer hover:bg-[#00FFE0]/20 transition-colors text-sm"
            >
              <TagIcon className="w-4 h-4 inline-block mr-1" />{tag}
            </motion.span>
          </Link>
        ))}
      </div>
    );
  }

  // Pros and Cons section
  function ProsAndCons() {
    if ((!tool.pros || tool.pros.length === 0) && (!tool.cons || tool.cons.length === 0)) {
      return null;
    }

    return (
      <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 hover:border-[#00FFE0]/40 transition-colors">
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FFD600]/20 rounded-lg flex items-center justify-center">
            <ChartBarIcon className="w-6 h-6 text-[#FFD600]" />
          </div>
          Pros & Cons
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pros */}
          {tool.pros && tool.pros.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                <CheckIcon className="w-5 h-5" />
                Pros
              </h3>
              <div className="space-y-3">
                {tool.pros.map((pro, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20"
                  >
                    <CheckIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-[#CFCFCF]">{pro}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* Cons */}
          {tool.cons && tool.cons.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                <XMarkIcon className="w-5 h-5" />
                Cons
              </h3>
              <div className="space-y-3">
                {tool.cons.map((con, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20"
                  >
                    <XMarkIcon className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-[#CFCFCF]">{con}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Platform Support section
  function PlatformSupport() {
    const platforms = tool.platform || tool.specifications?.platform || [];
    if (!platforms || platforms.length === 0) return null;

    return (
      <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 hover:border-[#00FFE0]/40 transition-colors">
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#B936F4]/20 rounded-lg flex items-center justify-center">
            <DevicePhoneMobileIcon className="w-6 h-6 text-[#B936F4]" />
          </div>
          Platform Support
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {platforms.map((platform, index) => (
            <motion.div 
              key={index}
              whileHover={{ scale: 1.05 }}
              className="p-4 bg-[#0A0F24] rounded-xl border border-[#B936F4]/20 hover:border-[#B936F4]/40 transition-colors text-center"
            >
              <span className="text-[#B936F4] font-medium">{platform}</span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Features section
  function Features() {
    const features = tool.specifications?.features || [];
    if (!features || features.length === 0) return null;

    return (
      <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 hover:border-[#00FFE0]/40 transition-colors">
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FF6B35]/20 rounded-lg flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-[#FF6B35]" />
          </div>
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              whileHover={{ scale: 1.03 }} 
              className="p-4 bg-[#0A0F24] rounded-xl border border-[#FF6B35]/20 hover:border-[#FF6B35]/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <SparklesIcon className="w-5 h-5 text-[#FF6B35] flex-shrink-0" />
                <span className="text-[#CFCFCF]">{feature}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Integrations section
  function Integrations() {
    const integrations = tool.specifications?.integrations || [];
    if (!integrations || integrations.length === 0) return null;

    return (
      <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 hover:border-[#00FFE0]/40 transition-colors">
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#00FFE0]/20 rounded-lg flex items-center justify-center">
            <PuzzlePieceIcon className="w-6 h-6 text-[#00FFE0]" />
          </div>
          Integrations
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {integrations.map((integration, index) => (
            <motion.div 
              key={index}
              whileHover={{ scale: 1.05 }}
              className="p-4 bg-[#0A0F24] rounded-xl border border-[#00FFE0]/20 hover:border-[#00FFE0]/40 transition-colors text-center"
            >
              <PuzzlePieceIcon className="w-6 h-6 text-[#00FFE0] mx-auto mb-2" />
              <span className="text-[#CFCFCF] text-sm">{integration}</span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Languages Supported section
  function LanguagesSupported() {
    const languages = tool.specifications?.languagesSupported || [];
    if (!languages || languages.length === 0) return null;

    return (
      <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 hover:border-[#00FFE0]/40 transition-colors">
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#B936F4]/20 rounded-lg flex items-center justify-center">
            <CodeBracketIcon className="w-6 h-6 text-[#B936F4]" />
          </div>
          Languages Supported
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {languages.map((language, index) => (
            <motion.div 
              key={index}
              whileHover={{ scale: 1.05 }}
              className="p-4 bg-[#0A0F24] rounded-xl border border-[#B936F4]/20 hover:border-[#B936F4]/40 transition-colors text-center"
            >
              <CodeBracketIcon className="w-6 h-6 text-[#B936F4] mx-auto mb-2" />
              <span className="text-[#CFCFCF] text-sm">{language}</span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Pricing Options section
  function PricingOptions() {
    const pricing = tool.specifications?.pricing;
    if (!pricing || (!pricing.free && !pricing.paid && !pricing.freemium)) return null;

    return (
      <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 hover:border-[#00FFE0]/40 transition-colors">
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FFD600]/20 rounded-lg flex items-center justify-center">
            <CurrencyDollarIcon className="w-6 h-6 text-[#FFD600]" />
          </div>
          Pricing Options
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pricing.free && (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-green-500/10 rounded-xl border border-green-500/20 text-center"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckIcon className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">Free</h3>
              <p className="text-[#CFCFCF] text-sm">Available at no cost</p>
            </motion.div>
          )}
          {pricing.freemium && (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <SparklesIcon className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Freemium</h3>
              <p className="text-[#CFCFCF] text-sm">Free with premium features</p>
            </motion.div>
          )}
          {pricing.paid && (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-[#FFD600]/10 rounded-xl border border-[#FFD600]/20 text-center"
            >
              <div className="w-12 h-12 bg-[#FFD600]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CurrencyDollarIcon className="w-6 h-6 text-[#FFD600]" />
              </div>
              <h3 className="text-lg font-semibold text-[#FFD600] mb-2">Paid</h3>
              <p className="text-[#CFCFCF] text-sm">Premium subscription required</p>
            </motion.div>
          )}
        </div>
        <div className="mt-6 p-4 bg-[#0A0F24] rounded-xl border border-[#00FFE0]/10">
          <div className="flex items-center justify-between">
            <span className="text-[#00FFE0] font-medium">Starting Price:</span>
            <span className="text-[#F5F5F5] font-bold text-lg">{tool.price || 'Free'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Technical Specifications section
  function TechnicalSpecs() {
    const specs = tool.specifications;
    if (!specs) return null;

    return (
      <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 hover:border-[#00FFE0]/40 transition-colors">
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#B936F4]/20 rounded-lg flex items-center justify-center">
            <CpuChipIcon className="w-6 h-6 text-[#B936F4]" />
          </div>
          Technical Specifications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {specs.difficulty && (
            <div className="p-4 bg-[#0A0F24] rounded-xl border border-[#00FFE0]/10">
              <div className="flex items-center justify-between">
                <span className="text-[#00FFE0] font-medium">Difficulty Level:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  specs.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                  specs.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {specs.difficulty}
                </span>
              </div>
            </div>
          )}
          {typeof specs.API === 'boolean' && (
            <div className="p-4 bg-[#0A0F24] rounded-xl border border-[#00FFE0]/10">
              <div className="flex items-center justify-between">
                <span className="text-[#00FFE0] font-medium">API Available:</span>
                <div className={`flex items-center gap-2 ${specs.API ? 'text-green-400' : 'text-red-400'}`}>
                  {specs.API ? <CheckIcon className="w-5 h-5" /> : <XMarkIcon className="w-5 h-5" />}
                  <span className="font-medium">{specs.API ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Sticky sidebar actions
  function StickySidebar() {
    return (
      <div className="lg:sticky lg:top-32 flex flex-col gap-4">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <BookmarkButton toolId={tool._id} />
        </motion.div>
        <motion.a
          href={tool.website || tool.url}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00FFE0] text-[#0A0F24] font-bold text-lg shadow-lg hover:bg-[#00FFE0]/90 transition-colors justify-center"
          title="Visit Website"
        >
          <ArrowTopRightOnSquareIcon className="w-5 h-5" /> Try Now
        </motion.a>
        <ShareButtons />
        
        {/* Quick Info Card */}
        <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-xl p-6 mt-4">
          <h3 className="text-lg font-bold text-[#F5F5F5] mb-4">Quick Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#CFCFCF] text-sm">Category:</span>
              <span className="text-[#00FFE0] text-sm font-medium">{tool.category}</span>
            </div>
            {tool.subcategory && (
              <div className="flex justify-between items-center">
                <span className="text-[#CFCFCF] text-sm">Subcategory:</span>
                <span className="text-[#B936F4] text-sm font-medium">{tool.subcategory}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[#CFCFCF] text-sm">Rating:</span>
              <div className="flex items-center gap-1">
                <StarIcon className="w-4 h-4 text-yellow-400" />
                <span className="text-[#F5F5F5] text-sm font-medium">{tool.rating?.toFixed(1) || 'N/A'}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#CFCFCF] text-sm">Reviews:</span>
              <span className="text-[#F5F5F5] text-sm font-medium">{tool.reviewCount || 0}</span>
            </div>
            {tool.featured && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-[#FFD600]/10 rounded-lg border border-[#FFD600]/20">
                <StarIcon className="w-4 h-4 text-[#FFD600]" />
                <span className="text-[#FFD600] text-sm font-medium">Featured Tool</span>
              </div>
            )}
            {tool.trending && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <FireIcon className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm font-medium">Trending Now</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Banner Section */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${tool.image || '/images/placeholder-image.jpeg'})`, 
            filter: 'brightness(0.3) blur(1px)' 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0F24]/50 to-[#0A0F24]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: `radial-gradient(circle at 25% 25%, #00FFE0 0%, transparent 50%), 
                              radial-gradient(circle at 75% 75%, #B936F4 0%, transparent 50%)` 
          }} />
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center space-x-2 text-sm text-[#CFCFCF]">
          <Link href="/" className="flex items-center hover:text-[#00FFE0] transition-colors">
            <HomeIcon className="w-4 h-4 mr-1" />Home
          </Link>
          <ChevronRightIcon className="w-4 h-4" />
          <Link href="/tools" className="hover:text-[#00FFE0] transition-colors">Tools</Link>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="text-[#F5F5F5]">{tool?.name || 'Tool'}</span>
        </nav>
      </div>

      {/* Tool Info Section */}
      <div className="relative -mt-32 container mx-auto px-4 pb-8">
        <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Tool Logo */}
            <div className="relative">
              <motion.div 
                initial={{ scale: 0.9 }} 
                animate={{ scale: 1 }} 
                whileHover={{ scale: 1.05 }} 
                className="w-40 h-40 rounded-2xl overflow-hidden border-2 border-[#00FFE0] bg-white p-3 shadow-lg"
              >
                <Image 
                  src={tool?.logo || '/images/placeholder-logo.jpeg'} 
                  alt={tool?.name || 'Tool logo'} 
                  width={160}
                  height={160}
                  className="w-full h-full object-contain"
                  onError={() => {
                    // Image component error handling is handled internally by Next.js
                  }}
                  priority={false}
                />
              </motion.div>
              {tool.trending && (
                <div className="absolute -top-2 -right-2">
                  <div className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm border border-red-500/30 backdrop-blur-sm animate-pulse">
                    <FireIcon className="h-4 w-4" /> Trending
                  </div>
                </div>
              )}
            </div>

            {/* Tool Info */}
            <div className="flex-1">
              <div className="mb-4">
                <h1 className="text-5xl font-bold text-[#F5F5F5] mb-3 flex items-center gap-3">
                  {tool?.name || 'Tool Name'}
                  <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="inline-block">
                    <BookmarkButton toolId={tool._id} />
                  </motion.span>
                </h1>
                <p className="text-[#CFCFCF] text-lg leading-relaxed max-w-2xl">
                  {tool?.description?.substring(0, 200) || 'Tool description'}...
                </p>
                <TagPills />
              </div>

              <div className="flex flex-wrap items-center gap-6 mt-4">
                {/* Animated Rating */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="flex items-center gap-2"
                >
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const rating = tool.rating || 0;
                      return (
                        <span key={star}>
                          {star <= rating ? (
                            <StarIcon className="h-7 w-7 text-yellow-400" />
                          ) : star - 0.5 <= rating ? (
                            <div className="relative inline-block">
                              <StarOutlineIcon className="h-7 w-7 text-gray-400 absolute" />
                              <StarIcon className="h-7 w-7 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                            </div>
                          ) : (
                            <StarOutlineIcon className="h-7 w-7 text-gray-400" />
                          )}
                        </span>
                      );
                    })}
                  </div>
                  <div className="ml-2">
                    <p className="text-[#F5F5F5] font-bold text-lg">
                      <AnimatedNumber value={(tool.rating || 0).toFixed(1)} />
                    </p>
                    <p className="text-[#CFCFCF] text-sm">
                      (<AnimatedNumber value={tool.reviewCount || 0} /> reviews)
                    </p>
                  </div>
                </motion.div>

                {/* Price */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.1 }} 
                  className="px-4 py-2 bg-[#00FFE0]/20 rounded-xl border border-[#00FFE0]/30"
                >
                  <span className="text-[#00FFE0] font-semibold text-lg">{tool?.price || 'Free'}</span>
                </motion.div>

                {/* Category */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.2 }} 
                  className="px-4 py-2 bg-[#B936F4]/20 rounded-xl border border-[#B936F4]/30"
                >
                  <span className="text-[#B936F4] font-semibold">{tool?.category || 'Category'}</span>
                </motion.div>
              </div>

              {/* CTA Button */}
              <motion.a
                href={tool.website || tool.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#00FFE0] to-[#B936F4] text-[#0A0F24] font-bold text-xl shadow-xl hover:from-[#00FFE0]/90 hover:to-[#B936F4]/90 transition-colors mt-8"
                title="Visit Website"
              >
                <ArrowTopRightOnSquareIcon className="w-6 h-6" /> Try {tool?.name || 'Tool'} Now
              </motion.a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left/Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Overview */}
          <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 hover:border-[#00FFE0]/40 transition-colors">
            <h2 className="text-2xl font-bold text-[#F5F5F5] mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00FFE0]/20 rounded-lg flex items-center justify-center">
                <span className="text-[#00FFE0] text-lg">📝</span>
              </div>
              Overview
            </h2>
            <p className="text-[#CFCFCF] leading-relaxed text-lg">{tool?.description || 'No description available.'}</p>
          </div>

          {/* Features */}
          <Features />

          {/* Pros and Cons */}
          <ProsAndCons />

          {/* Platform Support */}
          <PlatformSupport />

          {/* Integrations */}
          <Integrations />

          {/* Languages Supported */}
          <LanguagesSupported />

          {/* Pricing Options */}
          <PricingOptions />

          {/* Technical Specifications */}
          <TechnicalSpecs />

          {/* Reviews */}
          <div id="reviews" className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 hover:border-[#00FFE0]/40 transition-colors">
            <h2 className="text-2xl font-bold text-[#F5F5F5] mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FFD600]/20 rounded-lg flex items-center justify-center">
                <StarIcon className="w-6 h-6 text-yellow-400" />
              </div>
              User Reviews
            </h2>
            <ReviewList 
              toolId={tool._id}
            />
          </div>
        </div>

        {/* Sticky Sidebar */}
        <div className="lg:col-span-1">
          <StickySidebar />
        </div>
      </div>
    </>
  );
} 