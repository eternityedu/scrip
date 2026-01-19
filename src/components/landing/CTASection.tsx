import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-primary p-6 sm:p-8 md:p-12 lg:p-16">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 sm:w-60 h-40 sm:h-60 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 sm:w-80 h-60 sm:h-80 bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white mb-4 sm:mb-6">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Start Creating Today</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Ready to Transform Your Content Creation?
            </h2>

            <p className="text-base sm:text-lg text-white/80 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              Join thousands of creators who trust Scriptora AI to produce high-quality content that engages and converts.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button asChild size="lg" variant="secondary" className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold bg-white text-primary hover:bg-white/90 w-full sm:w-auto">
                <Link to="/auth?mode=signup">
                  <span className="flex items-center justify-center gap-2">
                    Get Started Free
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
