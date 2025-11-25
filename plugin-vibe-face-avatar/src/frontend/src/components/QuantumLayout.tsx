import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { User, Camera, MessageCircle, Cpu, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const Particle = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute w-1 h-1 bg-quantum-yellow rounded-full opacity-20"
    initial={{ y: "100vh", x: Math.random() * 100 + "vw" }}
    animate={{ y: "-10vh" }}
    transition={{
      duration: Math.random() * 10 + 10,
      repeat: Infinity,
      delay: delay,
      ease: "linear",
    }}
  />
);

export const QuantumLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Digital Body', icon: User },
    { path: '/neurophoto', label: 'NeuroPhoto', icon: Camera },
    { path: '/chat', label: 'AI Chat', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-quantum-black text-white relative overflow-hidden font-sans">
      {/* Background Particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(20)].map((_, i) => (
          <Particle key={i} delay={i * 0.5} />
        ))}
      </div>

      {/* Navigation */}
      <nav className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-4rem)] md:w-[calc(100%-6rem)] max-w-7xl px-6 md:px-10 py-4 md:py-5 flex justify-between items-center bg-black/80 backdrop-blur-xl border border-quantum-yellow/20 rounded-2xl shadow-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 text-quantum-yellow neon-text z-50">
          <Cpu className="w-6 h-6" />
          <span className="font-bold text-xl tracking-wider text-quantum-yellow">VIBEE</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300",
                location.pathname === link.path 
                  ? "bg-quantum-yellow/10 text-quantum-yellow border border-quantum-yellow/30 neon-border" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <link.icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* System Status (Desktop) */}
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          SYSTEM ONLINE
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-gray-400 hover:text-white z-50 p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-x-0 top-full mt-2 p-4 bg-black/90 backdrop-blur-2xl border border-quantum-yellow/20 rounded-xl md:hidden flex flex-col gap-2 shadow-2xl"
            >
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                    location.pathname === link.path 
                      ? "bg-quantum-yellow/10 text-quantum-yellow border border-quantum-yellow/30" 
                      : "text-gray-300 hover:bg-white/5"
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
              
              <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-2 text-xs text-gray-500 justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                SYSTEM ONLINE
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-24 md:pt-28 px-4 max-w-7xl mx-auto pb-10">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};
