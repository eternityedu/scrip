import { useAuth } from '@/lib/auth-context';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, PenTool, FileText, BarChart3, History, LogOut, Settings, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Dashboard() {
  const { user, isLoading, isAdmin, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold">Scriptora<span className="gradient-text">AI</span></span>
          </Link>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {isAdmin && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin"><Settings className="h-4 w-4 mr-2" />Admin</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />Sign Out
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="sm:hidden p-2 -mr-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="sm:hidden border-t border-border bg-card px-4 py-3">
            <div className="flex flex-col gap-2">
              {isAdmin && (
                <Button variant="outline" asChild className="w-full justify-start" onClick={() => setIsMenuOpen(false)}>
                  <Link to="/admin"><Settings className="h-4 w-4 mr-2" />Admin Panel</Link>
                </Button>
              )}
              <Button variant="ghost" className="w-full justify-start" onClick={() => { signOut(); setIsMenuOpen(false); }}>
                <LogOut className="h-4 w-4 mr-2" />Sign Out
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Welcome back!</h1>
          <p className="text-muted-foreground mb-6 sm:mb-8">What would you like to create today?</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {tools.map((tool) => (
              <Link key={tool.title} to={tool.href} className="card-hover group rounded-xl sm:rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className={`inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl ${tool.color} text-white mb-3 sm:mb-4`}>
                  <tool.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-1">{tool.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
