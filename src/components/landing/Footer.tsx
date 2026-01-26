import Link from 'next/link'
import { Twitter, MessageCircle, Github } from 'lucide-react'

export function Footer() {
  return (
    <footer className="py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="DegenArena" className="w-10 h-10 rounded-lg" />
            <span className="text-lg font-bold text-white">DegenArena</span>
          </div>
          
          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-gray-400">
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
              className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-white/5 text-center space-y-2">
          <p className="text-sm text-gray-400">
            Built with ❤️ by crypto fanatics.
          </p>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} DegenArena. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
