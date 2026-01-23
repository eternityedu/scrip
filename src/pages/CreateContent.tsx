import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, ArrowLeft, PenTool, Loader2, Copy, Download, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

const contentTypes = [
  { value: 'blog_article', label: 'Blog Article' },
  { value: 'seo_article', label: 'SEO Article' },
  { value: 'website_content', label: 'Website Content' },
  { value: 'product_description', label: 'Product Description' },
  { value: 'social_media_post', label: 'Social Media Post' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'ad_copy', label: 'Ad Copy' },
  { value: 'case_study', label: 'Case Study' },
  { value: 'story', label: 'Story Writing' },
];

const tones = [
  { value: 'professional', label: 'Professional', description: 'Polished, credible, business-appropriate' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, conversational, approachable' },
  { value: 'emotional', label: 'Emotional', description: 'Heartfelt, moving, connects deeply' },
  { value: 'persuasive', label: 'Persuasive', description: 'Compelling, convincing, action-driving' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert, confident, trustworthy' },
  { value: 'friendly', label: 'Friendly', description: 'Warm, welcoming, personable' },
  { value: 'humorous', label: 'Humorous', description: 'Witty, entertaining, lighthearted' },
  { value: 'inspirational', label: 'Inspirational', description: 'Uplifting, motivating, empowering' },
  { value: 'cinematic', label: 'Cinematic', description: 'Dramatic, vivid, movie-like storytelling' },
  { value: 'bold', label: 'Bold', description: 'Confident, impactful, attention-grabbing' },
];

const lengths = [
  { value: 'short', label: 'Short (200-400 words)' },
  { value: 'medium', label: 'Medium (500-800 words)' },
  { value: 'long', label: 'Long (1000-1500 words)' },
  { value: 'extended', label: 'Extended (2000+ words)' },
];

const formatTypes = [
  { value: 'long_form', label: 'Long-form (structured article)' },
  { value: 'hook', label: 'Hooks (5-10 attention grabbers)' },
  { value: 'title', label: 'Titles (10-20 options)' },
  { value: 'copywriting', label: 'Copywriting (conversion-focused)' },
  { value: 'roleplay', label: 'Roleplay (persona-driven)' },
];

const goals = [
  { value: 'inform', label: 'Inform' },
  { value: 'educate', label: 'Educate' },
  { value: 'sell', label: 'Sell / Convert' },
  { value: 'entertain', label: 'Entertain' },
  { value: 'inspire', label: 'Inspire' },
  { value: 'engage', label: 'Engage' },
];

export default function CreateContentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('');
  const [tone, setTone] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [platform, setPlatform] = useState('');
  const [length, setLength] = useState('');
  const [formatType, setFormatType] = useState('');
  const [goal, setGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleGenerate = async () => {
    if (!topic.trim() || !contentType || !tone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          topic: topic.trim(),
          contentType,
          tone,
          targetAudience: targetAudience.trim(),
          platform: platform.trim(),
          length,
          formatType: formatType || undefined,
          goal: goal || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to generate content');
        setIsGenerating(false);
        return;
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setGeneratedContent(fullContent);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Save to database
      const wordCount = fullContent.split(/\s+/).filter(Boolean).length;
      const title = fullContent.split('\n')[0]?.replace(/^#+ /, '').trim() || topic;
      
      await supabase.from('content_history').insert({
        user_id: user.id,
        title: title.slice(0, 255),
        content: fullContent,
        content_type: contentType as any,
        tone: tone as any,
        topic: topic.trim(),
        target_audience: targetAudience.trim() || null,
        platform: platform.trim() || null,
        word_count: wordCount,
      });

      toast.success('Content generated successfully!');
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedContent);
    toast.success('Copied to clipboard!');
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.slice(0, 30).replace(/\s+/g, '-')}-content.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded!');
  };

  const handleReset = () => {
    setTopic('');
    setContentType('');
    setTone('');
    setTargetAudience('');
    setPlatform('');
    setLength('');
    setFormatType('');
    setGoal('');
    setGeneratedContent('');
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-8 w-8 sm:h-10 sm:w-10">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-violet-500 flex items-center justify-center">
                  <PenTool className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold">Content Writer</h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Blogs, articles, and more</p>
                </div>
              </div>
            </div>
            
            {generatedContent && (
              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 px-2 sm:px-3">
                  <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Copy</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 px-2 sm:px-3">
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 px-2 sm:px-3">
                  <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">New</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-4 sm:gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
              <h2 className="text-base sm:text-lg font-semibold">Content Details</h2>

              <div className="space-y-2">
                <Label htmlFor="topic" className="text-sm">Topic / Title *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., 10 Tips for Better Productivity"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="h-10 sm:h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Content Type *</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Tone *</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="py-2.5">
                        <div className="flex flex-col">
                          <span className="font-medium">{t.label}</span>
                          <span className="text-xs text-muted-foreground">{t.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Format Type</Label>
                <Select value={formatType} onValueChange={setFormatType}>
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue placeholder="Auto (based on content type)" />
                  </SelectTrigger>
                  <SelectContent>
                    {formatTypes.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Goal</Label>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue placeholder="What's the purpose?" />
                  </SelectTrigger>
                  <SelectContent>
                    {goals.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience" className="text-sm">Target Audience</Label>
                <Input
                  id="audience"
                  placeholder="e.g., Business professionals aged 25-45"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="h-10 sm:h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform" className="text-sm">Platform</Label>
                <Input
                  id="platform"
                  placeholder="e.g., LinkedIn, Medium, Company Blog"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="h-10 sm:h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Content Length</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger className="h-10 sm:h-11">
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent>
                    {lengths.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim() || !contentType || !tone}
                className="w-full h-11 sm:h-12 bg-gradient-primary hover:opacity-90"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-3">
            <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 min-h-[400px] sm:min-h-[600px]">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Generated Content</h2>
              
              {generatedContent ? (
                <div ref={contentRef} className="prose-scriptora whitespace-pre-wrap text-sm sm:text-base">
                  {generatedContent}
                </div>
              ) : isGenerating ? (
                <div className="flex flex-col items-center justify-center h-[300px] sm:h-[400px] text-center">
                  <div className="relative">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Sparkles className="h-4 w-4 sm:h-6 sm:w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-muted-foreground mt-4 text-sm sm:text-base">Crafting your content...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] sm:h-[400px] text-center px-4">
                  <PenTool className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Ready to Create</h3>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-sm">
                    Fill in the details and click "Generate Content" to create your professional content.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
