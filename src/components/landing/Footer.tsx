import Link from 'next/link'
import { Twitter, MessageCircle, Github } from 'lucide-react'

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/footer-bg.png)' }}
      />
      {/* Dark Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/85 to-black/70" />
      
      {/* Content */}
      <div className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="DegenArena" className="w-10 h-10 rounded-lg" />
              <span className="text-lg font-bold text-white">DegenArena</span>
            </div>
            
            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-gray-300">
              <Link href="#features" className="hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
            
            {/* Social links */}
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com/Degen_Arena_"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20 transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20 transition-all"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20 transition-all"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-10 pt-8 border-t border-white/10 text-center space-y-2">
            <p className="text-sm text-gray-300">
              Built with ❤️ by crypto fanatics.
            </p>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} DegenArena. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
