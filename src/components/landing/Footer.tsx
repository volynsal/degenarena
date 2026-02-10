import Link from 'next/link'

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Background Image — right-aligned on mobile to show "ARENA", centered on desktop */}
      <div 
        className="absolute inset-0 bg-cover bg-no-repeat [background-position:73%_center] sm:bg-center"
        style={{ backgroundImage: 'url(/footer-bg.png)' }}
      />
      {/* Dark Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/40" />
      
      {/* Content */}
      <div className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="DegenArena HQ" className="w-10 h-10 rounded-lg" />
              <span className="text-lg font-bold text-white font-brand">DegenArena HQ</span>
            </div>
            
            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-gray-300">
              <Link href="#features" className="hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
            
            {/* Social links */}
            <div className="flex items-center gap-4">
              <a
                href="https://x.com/degenarenahq"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-10 pt-8 border-t border-white/10 text-center space-y-2">
            <p className="text-sm text-gray-300">
              Built with ❤️ by crypto fanatics.
            </p>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} DegenArena HQ. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
