import { useAuth } from '@/lib/auth-context';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, PenTool, FileText, BarChart3, History, LogOut, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, isLoading, isAdmin, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-pulse flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-lg font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const tools = [
    { icon: PenTool, title: 'Create Content', description: 'Write blogs, articles, and more', href: '/create/content', color: 'bg-violet-500' },
    { icon: FileText, title: 'Create Script', description: 'YouTube, podcast, and video scripts', href: '/create/script', color: 'bg-indigo-500' },
    { icon: BarChart3, title: 'Analyze Content', description: 'Get quality scores and feedback', href: '/analyze', color: 'bg-emerald-500' },
    { icon: History, title: 'History', description: 'View your past creations', href: '/history', color: 'bg-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Scriptora<span className="gradient-text">AI</span></span>
          </Link>
          
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button variant="outline" asChild>
                <Link to="/admin"><Settings className="h-4 w-4 mr-2" />Admin</Link>
              </Button>
            )}
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground mb-8">What would you like to create today?</p>

          <div className="grid sm:grid-cols-2 gap-6">
            {tools.map((tool) => (
              <Link key={tool.title} to={tool.href} className="card-hover group rounded-2xl border border-border bg-card p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${tool.color} text-white mb-4`}>
                  <tool.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-1">{tool.title}</h3>
                <p className="text-muted-foreground">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
