import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col gap-6 sm:gap-0 sm:flex-row items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
            <span className="text-base sm:text-lg font-bold">
              Scriptora<span className="gradient-text">AI</span>
            </span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
            <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-right">
            © {new Date().getFullYear()} Scriptora AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
