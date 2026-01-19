const steps = [
  {
    number: '01',
    title: 'Choose Your Content Type',
    description: 'Select from blogs, scripts, social posts, and more. Pick your tone and target audience.',
  },
  {
    number: '02',
    title: 'AI Generates Your Content',
    description: 'Our advanced AI crafts professional, engaging content tailored to your specifications.',
  },
  {
    number: '03',
    title: 'Analyze & Refine',
    description: 'Use our quality analyzer to score your content and get actionable improvement suggestions.',
  },
  {
    number: '04',
    title: 'Export & Publish',
    description: 'Copy to clipboard or download as PDF. Your content is ready to go live.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 lg:py-32 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
            How <span className="gradient-text">Scriptora</span> Works
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground px-2">
            From idea to polished content in four simple steps.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connecting line - hidden on mobile */}
            <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary to-primary/50 hidden sm:block" />

            <div className="space-y-6 sm:space-y-8 lg:space-y-12">
              {steps.map((step, index) => (
                <div key={step.number} className="relative flex gap-4 sm:gap-6 lg:gap-8">
                  {/* Step number */}
                  <div className="relative z-10 flex-shrink-0 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-primary text-white font-bold text-sm sm:text-lg shadow-glow">
                    {step.number}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1 sm:pt-2">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-1 sm:mb-2">{step.title}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
