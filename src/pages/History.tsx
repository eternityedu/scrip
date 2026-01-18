import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, History as HistoryIcon, FileText, BarChart3, 
  Search, Loader2, Calendar, Trash2, Eye, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  content_type: string;
  tone: string;
  topic: string;
  word_count: number | null;
  created_at: string;
}

interface AnalysisItem {
  id: string;
  content_analyzed: string;
  overall_score: number;
  clarity_score: number;
  structure_score: number;
  engagement_score: number;
  grammar_score: number;
  originality_score: number;
  flow_score: number;
  audience_relevance_score: number;
  strengths: string[];
  improvements: string[];
  explanation: string | null;
  created_at: string;
}

const contentTypeLabels: Record<string, string> = {
  blog_article: 'Blog Article',
  seo_article: 'SEO Article',
  website_content: 'Website Content',
  product_description: 'Product Description',
  social_media_post: 'Social Media Post',
  email_campaign: 'Email Campaign',
  ad_copy: 'Ad Copy',
  case_study: 'Case Study',
  story: 'Story',
  youtube_script: 'YouTube Script',
  shorts_script: 'Shorts Script',
  podcast_script: 'Podcast Script',
  documentary_script: 'Documentary Script',
  movie_scene_script: 'Movie Scene Script',
  commercial_script: 'Commercial Script',
  voiceover_narration: 'Voice-over',
};

export default function HistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [contentHistory, setContentHistory] = useState<ContentItem[]>([]);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisItem | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const { data: content, error: contentError } = await supabase
        .from('content_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (contentError) throw contentError;
      setContentHistory(content || []);

      const { data: analysis, error: analysisError } = await supabase
        .from('analysis_reports')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (analysisError) throw analysisError;
      setAnalysisHistory(analysis || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteContent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setContentHistory(contentHistory.filter(c => c.id !== id));
      toast.success('Content deleted');
    } catch (err) {
      console.error('Error deleting content:', err);
      toast.error('Failed to delete');
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      const { error } = await supabase
        .from('analysis_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAnalysisHistory(analysisHistory.filter(a => a.id !== id));
      toast.success('Report deleted');
    } catch (err) {
      console.error('Error deleting analysis:', err);
      toast.error('Failed to delete');
    }
  };

  const copyContent = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

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

  const filteredContent = contentHistory.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || c.content_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const filteredAnalysis = analysisHistory.filter(a =>
    a.content_analyzed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600 bg-emerald-100';
    if (score >= 6) return 'text-violet-600 bg-violet-100';
    if (score >= 4) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
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
              <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center">
                <HistoryIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">History</h1>
                <p className="text-xs text-muted-foreground">Your past creations</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="content" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="content">
                <FileText className="h-4 w-4 mr-2" />
                Content ({contentHistory.length})
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analysis ({analysisHistory.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Content History */}
          <TabsContent value="content" className="space-y-4">
            <div className="flex items-center gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(contentTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredContent.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Content Yet</h3>
                <p className="text-muted-foreground mb-4">Start creating content to see it here.</p>
                <Button asChild>
                  <Link to="/create/content">Create Content</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredContent.map((item) => (
                  <div key={item.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {contentTypeLabels[item.content_type] || item.content_type}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            {item.tone}
                          </span>
                        </div>
                        <h3 className="font-semibold truncate">{item.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">{item.topic}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.created_at)}
                          </span>
                          {item.word_count && (
                            <span>{item.word_count} words</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedContent(item)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => copyContent(item.content)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteContent(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analysis History */}
          <TabsContent value="analysis" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAnalysis.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Analysis Reports Yet</h3>
                <p className="text-muted-foreground mb-4">Analyze content to see reports here.</p>
                <Button asChild>
                  <Link to="/analyze">Analyze Content</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredAnalysis.map((item) => (
                  <div key={item.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-sm font-bold ${getScoreColor(item.overall_score)}`}>
                            {item.overall_score.toFixed(1)}/10
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.content_analyzed.slice(0, 150)}...
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedAnalysis(item)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteAnalysis(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Content View Dialog */}
      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedContent?.title}</DialogTitle>
          </DialogHeader>
          <div className="prose-scriptora whitespace-pre-wrap">
            {selectedContent?.content}
          </div>
        </DialogContent>
      </Dialog>

      {/* Analysis View Dialog */}
      <Dialog open={!!selectedAnalysis} onOpenChange={() => setSelectedAnalysis(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Analysis Report</DialogTitle>
          </DialogHeader>
          {selectedAnalysis && (
            <div className="space-y-4">
              <div className={`inline-flex px-3 py-1 rounded-full font-bold ${getScoreColor(selectedAnalysis.overall_score)}`}>
                Overall: {selectedAnalysis.overall_score.toFixed(1)}/10
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Clarity: {selectedAnalysis.clarity_score.toFixed(1)}</div>
                <div>Structure: {selectedAnalysis.structure_score.toFixed(1)}</div>
                <div>Engagement: {selectedAnalysis.engagement_score.toFixed(1)}</div>
                <div>Grammar: {selectedAnalysis.grammar_score.toFixed(1)}</div>
                <div>Originality: {selectedAnalysis.originality_score.toFixed(1)}</div>
                <div>Flow: {selectedAnalysis.flow_score.toFixed(1)}</div>
              </div>

              {selectedAnalysis.explanation && (
                <p className="text-muted-foreground">{selectedAnalysis.explanation}</p>
              )}

              <div>
                <h4 className="font-semibold mb-2">Strengths</h4>
                <ul className="list-disc pl-4 text-sm text-muted-foreground">
                  {selectedAnalysis.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Improvements</h4>
                <ul className="list-disc pl-4 text-sm text-muted-foreground">
                  {selectedAnalysis.improvements?.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
