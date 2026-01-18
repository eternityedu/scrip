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
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'emotional', label: 'Emotional' },
  { value: 'persuasive', label: 'Persuasive' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'inspirational', label: 'Inspirational' },
];

const lengths = [
  { value: 'short', label: 'Short (200-400 words)' },
  { value: 'medium', label: 'Medium (500-800 words)' },
  { value: 'long', label: 'Long (1000-1500 words)' },
  { value: 'extended', label: 'Extended (2000+ words)' },
];

export default function CreateContentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState('');
  const [tone, setTone] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [platform, setPlatform] = useState('');
  const [length, setLength] = useState('');
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
    setGeneratedContent('');
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-violet-500 flex items-center justify-center">
                <PenTool className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Content Writer</h1>
                <p className="text-xs text-muted-foreground">Blogs, articles, and more</p>
              </div>
            </div>
          </div>
          
          {generatedContent && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                New
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold">Content Details</h2>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic / Title *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., 10 Tips for Better Productivity"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Content Type *</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
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
                <Label>Tone *</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Input
                  id="audience"
                  placeholder="e.g., Business professionals aged 25-45"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Input
                  id="platform"
                  placeholder="e.g., LinkedIn, Medium, Company Blog"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Content Length</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger>
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
                className="w-full h-12 bg-gradient-primary hover:opacity-90"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-3">
            <div className="bg-card border border-border rounded-2xl p-6 min-h-[600px]">
              <h2 className="text-lg font-semibold mb-4">Generated Content</h2>
              
              {generatedContent ? (
                <div ref={contentRef} className="prose-scriptora whitespace-pre-wrap">
                  {generatedContent}
                </div>
              ) : isGenerating ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-muted-foreground mt-4">Crafting your content...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <PenTool className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Create</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Fill in the details on the left and click "Generate Content" to create your professional content.
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
