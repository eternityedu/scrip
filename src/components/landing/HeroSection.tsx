import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero pt-20 sm:pt-16">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center stagger-children">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-primary mb-6 sm:mb-8">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>AI-Powered Writing Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-foreground leading-[1.15] sm:leading-[1.1] mb-4 sm:mb-6">
            Write Powerful Content.{' '}
            <span className="gradient-text">Measure Its Quality.</span>{' '}
            Instantly.
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
            Scriptora AI helps creators, writers, and marketers generate high-quality content and scripts — and analyze them with real scoring.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <Button asChild size="lg" className="btn-hero text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 w-full sm:w-auto">
              <Link to="/auth?mode=signup">
                <span className="flex items-center justify-center gap-2">
                  Start Writing Free
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="btn-secondary text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 w-full sm:w-auto">
              <Link to="/auth?mode=signup">
                <span className="flex items-center justify-center gap-2">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Analyze Your Content
                </span>
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 sm:mt-16 flex flex-col items-center gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Trusted by content creators worldwide</p>
            <div className="flex items-center gap-4 sm:gap-8 opacity-60">
              <div className="flex items-center gap-0.5 sm:gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground">4.9/5 rating</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
