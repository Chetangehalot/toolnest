"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  Star,
  Sparkles,
  Newspaper,
  Menu,
  X,
  Search,
  Brain,
  HelpCircle,
  User,
  LogOut,
  Shield,
  Edit,
} from "lucide-react";
import NotificationDropdown from "../NotificationDropdown";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Tools", href: "/tools", icon: Sparkles },
    { name: "Top Rated", href: "/top-rated", icon: Star },
    { name: "Blog", href: "/blog", icon: Newspaper },
    { name: "Quiz", href: "/quiz", icon: HelpCircle },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          const suggestions = [...data.tools.slice(0, 3), ...data.blogs.slice(0, 2)];
          setSearchSuggestions(suggestions);
          setShowSuggestions(suggestions.length > 0);
        }
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "backdrop-blur-lg bg-[#0A0F24]/80 border-b border-[#00FFE0]/10"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="h-12 w-auto"
              >
                <Image
                  src="/images/Logo.png"
                  alt="ToolNest Logo"
                  width={120}
                  height={48}
                  className="h-full w-auto object-contain"
                  priority
                />
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center space-x-2 text-[#CFCFCF] hover:text-[#00FFE0] transition-colors ${
                      pathname === item.href ? "text-[#00FFE0]" : ""
                    }`}
                  >
                    <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="relative">
                      {item.name}
                      {pathname === item.href && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00FFE0] to-[#B936F4]"
                        />
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg hover:bg-[#00FFE0]/10 text-[#CFCFCF] hover:text-[#00FFE0] transition-all duration-200 cursor-pointer"
                title="Search tools and content"
                data-search-trigger
                aria-label="Open search"
              >
                <Search className="w-5 h-5" />
              </motion.button>

              {/* Notification Dropdown */}
              {session && <NotificationDropdown />}

              {/* Auth Buttons */}
              {status === 'loading' ? (
                <div className="w-8 h-8 rounded-full bg-[#00FFE0]/20 animate-pulse cursor-wait" title="Loading user information..." />
              ) : session ? (
                <div className="flex items-center space-x-2">
                  {session.user.role === 'admin' || session.user.role === 'manager' ? (
                    <Link
                      href="/admin"
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#B936F4]/10 text-[#B936F4] hover:bg-[#B936F4]/20 transition-all duration-200 cursor-pointer hover:scale-105"
                      title={`Access ${session.user.role} panel`}
                    >
                      <Shield className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {session.user.role === 'admin' ? 'Admin Panel' : 'Manager Panel'}
                      </span>
                    </Link>
                  ) : session.user.role === 'writer' ? (
                    <Link
                      href="/writer/dashboard"
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all duration-200 cursor-pointer hover:scale-105"
                      title="Access writer panel"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Writer Panel</span>
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard"
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#00FFE0]/10 text-[#00FFE0] hover:bg-[#00FFE0]/20 transition-all duration-200 cursor-pointer hover:scale-105"
                      title="Access dashboard"
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">{session.user.name}</span>
                    </Link>
                  )}
                  
                  {/* Mobile Menu Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 text-[#CFCFCF] hover:text-[#00FFE0] transition-colors cursor-pointer"
                    title="Toggle mobile menu"
                  >
                    <Menu className="w-5 h-5" />
                  </motion.button>

                  {/* Sign Out Button - Icon Only */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSignOut()}
                    className="p-2 rounded-lg text-[#CFCFCF] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
                    title="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </motion.button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-[#CFCFCF] hover:text-[#00FFE0] transition-all duration-200 cursor-pointer hover:scale-105"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-[#00FFE0] text-[#0A0F24] px-4 py-2 rounded-lg hover:bg-[#00FFE0]/90 transition-all duration-200 cursor-pointer hover:scale-105"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-0 right-0 z-40 md:hidden backdrop-blur-lg bg-[#0A0F24]/95 border-b border-[#00FFE0]/10"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-[#CFCFCF] hover:text-[#00FFE0] hover:bg-white/5 transition-colors ${
                        pathname === item.href ? "text-[#00FFE0] bg-white/5" : ""
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                
                {/* Mobile Auth Links */}
                <div className="border-t border-[#00FFE0]/20 pt-4">
                  {session ? (
                    <>
                      {session.user.role === 'admin' || session.user.role === 'manager' ? (
                        <Link
                          href="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-[#B936F4] hover:bg-[#B936F4]/10 transition-colors"
                        >
                          <Shield className="w-5 h-5" />
                          <span>{session.user.role === 'admin' ? 'Admin Panel' : 'Manager Panel'}</span>
                        </Link>
                      ) : session.user.role === 'writer' ? (
                        <Link
                          href="/writer/dashboard"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-green-400 hover:bg-green-500/10 transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                          <span>Writer Panel</span>
                        </Link>
                      ) : (
                        <Link
                          href="/dashboard"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-[#00FFE0] hover:bg-white/5 transition-colors"
                        >
                          <User className="w-5 h-5" />
                          <span>Dashboard</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 rounded-xl text-[#CFCFCF] hover:text-[#00FFE0] hover:bg-white/5 transition-colors"
                      >
                        <span>Login</span>
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-[#00FFE0] text-[#0A0F24] hover:bg-[#00FFE0]/90 transition-colors font-medium"
                      >
                        <span>Sign Up</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 cursor-default"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0A0F24] border border-[#00FFE0]/20 rounded-2xl p-6 w-full max-w-2xl mx-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="search-modal-title"
            >
              <form onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                  setShowSuggestions(false);
                  window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                } else {
                  // Show tooltip for empty search
                  const input = e.target.querySelector('input[name="search"]');
                  input.focus();
                  input.placeholder = "Please enter a search term";
                  setTimeout(() => {
                    input.placeholder = "Search tools, blogs, or content...";
                  }, 2000);
                }
              }}>
                <div className="flex items-center space-x-4 mb-4">
                  <Search className="w-6 h-6 text-[#00FFE0]" />
                  <input
                    type="search"
                    name="search"
                    id="search-modal-title"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tools, blogs, or content..."
                    autoFocus
                    className="flex-1 bg-transparent text-[#F5F5F5] placeholder-[#CFCFCF] text-lg focus:outline-none cursor-text"
                    aria-label="Search input"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#00FFE0] text-[#0A0F24] rounded-lg hover:bg-[#00FFE0]/90 transition-colors font-semibold text-sm cursor-pointer hover:scale-105 duration-200"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                    className="text-[#CFCFCF] hover:text-[#F5F5F5] transition-colors cursor-pointer"
                    title="Close search"
                    data-modal-close
                    aria-label="Close search modal"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </form>
              
              {/* Search Suggestions */}
              {showSuggestions && (
                <div className="mb-4 border-t border-[#00FFE0]/20 pt-4">
                  <div className="text-sm text-[#CFCFCF] mb-3">Quick suggestions:</div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchLoading ? (
                      <div className="flex items-center gap-2 text-[#CFCFCF] text-sm">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00FFE0]"></div>
                        Searching...
                      </div>
                    ) : (
                      searchSuggestions.map((item) => (
                        <button
                          key={item._id}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery('');
                            setShowSuggestions(false);
                            if (item.type === 'tool') {
                              window.location.href = `/tools/${item.slug}`;
                            } else {
                              window.location.href = `/blog/${item.slug}`;
                            }
                          }}
                          className="w-full text-left p-3 rounded-lg hover:bg-[#00FFE0]/10 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            {item.type === 'tool' ? (
                              <div className="w-8 h-8 bg-[#00FFE0]/20 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-[#00FFE0]" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-[#B936F4]/20 rounded-lg flex items-center justify-center">
                                <Newspaper className="w-4 h-4 text-[#B936F4]" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[#F5F5F5] font-medium truncate group-hover:text-[#00FFE0] transition-colors">
                                {item.name || item.title}
                              </p>
                              <p className="text-[#CFCFCF] text-sm truncate">
                                {item.type === 'tool' ? item.category : 'Article'}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                    {searchQuery && !searchLoading && (
                      <button
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          setShowSuggestions(false);
                          window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
                        }}
                        className="w-full text-left p-3 rounded-lg border border-[#00FFE0]/20 hover:bg-[#00FFE0]/10 transition-colors text-[#00FFE0] font-medium"
                      >
                                                 Search all results for &quot;{searchQuery}&quot;
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="text-sm text-[#CFCFCF]">
                <p>Search across our entire platform - AI tools, blog posts, and more...</p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#00FFE0] rounded-full"></span>
                    Tools
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#B936F4] rounded-full"></span>
                    Articles
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#FF3366] rounded-full"></span>
                    Content
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 
