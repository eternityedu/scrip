import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, ArrowLeft, BarChart3, Loader2, CheckCircle, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

interface AnalysisResult {
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
  explanation: string;
}

const scoreLabels = [
  { key: 'clarity_score', label: 'Clarity', color: '#8b5cf6' },
  { key: 'structure_score', label: 'Structure', color: '#6366f1' },
  { key: 'engagement_score', label: 'Engagement', color: '#a855f7' },
  { key: 'grammar_score', label: 'Grammar', color: '#7c3aed' },
  { key: 'originality_score', label: 'Originality', color: '#9333ea' },
  { key: 'flow_score', label: 'Flow', color: '#8b5cf6' },
  { key: 'audience_relevance_score', label: 'Audience Fit', color: '#a78bfa' },
];

function RadarChart({ data }: { data: AnalysisResult }) {
  const size = 240;
  const center = size / 2;
  const radius = 80;
  const levels = 5;
  
  const scores = scoreLabels.map(s => data[s.key as keyof AnalysisResult] as number);
  const angleStep = (2 * Math.PI) / scores.length;
  
  // Generate points for each score
  const points = scores.map((score, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (score / 10) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  });
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  
  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid circles */}
      {Array.from({ length: levels }).map((_, i) => (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={(radius / levels) * (i + 1)}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          opacity={0.5}
        />
      ))}
      
      {/* Grid lines */}
      {scores.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(angle)}
            y2={center + radius * Math.sin(angle)}
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity={0.5}
          />
        );
      })}
      
      {/* Data polygon */}
      <path
        d={pathD}
        fill="hsl(260 60% 55% / 0.2)"
        stroke="hsl(260 60% 55%)"
        strokeWidth="2"
      />
      
      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="hsl(260 60% 55%)"
        />
      ))}
      
      {/* Labels */}
      {scoreLabels.map((s, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = radius + 25;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] sm:text-xs fill-muted-foreground"
          >
            {s.label}
          </text>
        );
      })}
    </svg>
  );
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  const getScoreClass = (s: number) => {
    if (s >= 8) return 'score-excellent';
    if (s >= 6) return 'score-good';
    if (s >= 4) return 'score-average';
    return 'score-poor';
  };
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs sm:text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium px-2 py-0.5 rounded-full text-xs border ${getScoreClass(score)}`}>
          {score.toFixed(1)}
        </span>
      </div>
      <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score * 10}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
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

  const handleAnalyze = async () => {
    if (content.trim().length < 50) {
      toast.error('Please enter at least 50 characters to analyze');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-content', {
        body: { content: content.trim() },
      });

      if (error) {
        console.error('Analysis error:', error);
        toast.error(error.message || 'Failed to analyze content');
        return;
      }

      setResult(data);

      // Save to database
      await supabase.from('analysis_reports').insert({
        user_id: user.id,
        content_analyzed: content.trim(),
        overall_score: data.overall_score,
        clarity_score: data.clarity_score,
        structure_score: data.structure_score,
        engagement_score: data.engagement_score,
        grammar_score: data.grammar_score,
        originality_score: data.originality_score,
        flow_score: data.flow_score,
        audience_relevance_score: data.audience_relevance_score,
        strengths: data.strengths,
        improvements: data.improvements,
        explanation: data.explanation,
      });

      toast.success('Analysis complete!');
    } catch (err) {
      console.error('Analyze error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getOverallScoreClass = (score: number) => {
    if (score >= 8) return 'text-emerald-600 bg-emerald-100';
    if (score >= 6) return 'text-violet-600 bg-violet-100';
    if (score >= 4) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-emerald-500 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold">Content Analyzer</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Get quality scores & feedback</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Input Section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Paste Your Content</h2>
              <Textarea
                placeholder="Paste your content here to analyze its quality... (minimum 50 characters)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[250px] sm:min-h-[400px] resize-none text-sm sm:text-base"
              />
              <div className="flex items-center justify-between mt-3 sm:mt-4">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {content.length} characters
                </span>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || content.trim().length < 50}
                  className="bg-gradient-primary hover:opacity-90 h-9 sm:h-10 text-sm sm:text-base"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                      Analyze Content
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4 sm:space-y-6">
            {result ? (
              <>
                {/* Overall Score */}
                <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
                  <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Overall Quality Score</h2>
                  <div className={`inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full text-3xl sm:text-4xl font-bold ${getOverallScoreClass(result.overall_score)}`}>
                    {result.overall_score.toFixed(1)}
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground mt-3 sm:mt-4">{result.explanation}</p>
                </div>

                {/* Radar Chart */}
                <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-center">Quality Breakdown</h2>
                  <RadarChart data={result} />
                </div>

                {/* Score Bars */}
                <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Detailed Scores</h2>
                  {scoreLabels.map((s) => (
                    <ScoreBar
                      key={s.key}
                      label={s.label}
                      score={result[s.key as keyof AnalysisResult] as number}
                      color={s.color}
                    />
                  ))}
                </div>

                {/* Strengths & Improvements */}
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
                    <h3 className="font-semibold flex items-center gap-2 mb-2 sm:mb-3 text-sm sm:text-base">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                      Strengths
                    </h3>
                    <ul className="space-y-1.5 sm:space-y-2">
                      {result.strengths.map((s, i) => (
                        <li key={i} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
                    <h3 className="font-semibold flex items-center gap-2 mb-2 sm:mb-3 text-sm sm:text-base">
                      <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                      Improvements
                    </h3>
                    <ul className="space-y-1.5 sm:space-y-2">
                      {result.improvements.map((s, i) => (
                        <li key={i} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
                <BarChart3 className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">No Analysis Yet</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Paste your content and click "Analyze Content" to get quality scores and improvement suggestions.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
