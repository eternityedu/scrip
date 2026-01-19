import { PenTool, FileText, BarChart3, Download, Palette, Shield } from 'lucide-react';

const features = [
  {
    icon: PenTool,
    title: 'AI Content Writer',
    description: 'Generate blog articles, SEO content, product descriptions, social media posts, and more with expert-level quality.',
  },
  {
    icon: FileText,
    title: 'Script Generator',
    description: 'Create YouTube scripts, podcast outlines, commercial scripts, and voiceover narrations tailored to your audience.',
  },
  {
    icon: BarChart3,
    title: 'Quality Scoring',
    description: 'Analyze any content with our AI scorer. Get detailed ratings for clarity, engagement, grammar, and originality.',
  },
  {
    icon: Download,
    title: 'Export as PDF',
    description: 'Download your polished content as beautifully formatted PDFs, ready to share or publish.',
  },
  {
    icon: Palette,
    title: 'Creator-Focused',
    description: 'Built specifically for content creators, marketers, and writers who demand professional results.',
  },
  {
    icon: Shield,
    title: 'Admin Controls',
    description: 'Full control over AI settings, quality thresholds, and user management for team administrators.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
            Everything You Need to{' '}
            <span className="gradient-text">Create & Analyze</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground px-2">
            Powerful AI tools designed specifically for content creation and quality analysis.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="card-hover group relative rounded-xl sm:rounded-2xl border border-border bg-card p-5 sm:p-6 lg:p-8"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-3 sm:mb-4 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-glow">
                <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2">{feature.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
