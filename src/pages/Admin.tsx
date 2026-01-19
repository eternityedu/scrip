import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, ArrowLeft, Users, Settings, BarChart3, FileText, 
  Shield, Ban, CheckCircle, Search, Loader2, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  is_blocked: boolean;
  created_at: string;
  role?: string;
  content_count?: number;
}

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  details: Record<string, any> | null;
  created_at: string;
}

interface AnalyticsData {
  totalUsers: number;
  totalContent: number;
  totalAnalysis: number;
  avgQualityScore: number;
}

export default function AdminPage() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch users with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .maybeSingle();

          const { count: contentCount } = await supabase
            .from('content_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id);

          return {
            ...profile,
            role: roleData?.role || 'user',
            content_count: contentCount || 0,
          };
        })
      );

      setUsers(usersWithRoles);

      // Fetch activity logs
      const { data: logsData, error: logsError } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;
      setLogs((logsData || []) as ActivityLog[]);

      // Calculate analytics
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: totalContent } = await supabase
        .from('content_history')
        .select('*', { count: 'exact', head: true });

      const { count: totalAnalysis } = await supabase
        .from('analysis_reports')
        .select('*', { count: 'exact', head: true });

      const { data: avgScore } = await supabase
        .from('analysis_reports')
        .select('overall_score');

      const avg = avgScore?.length 
        ? avgScore.reduce((sum, r) => sum + Number(r.overall_score), 0) / avgScore.length 
        : 0;

      setAnalytics({
        totalUsers: totalUsers || 0,
        totalContent: totalContent || 0,
        totalAnalysis: totalAnalysis || 0,
        avgQualityScore: avg,
      });
    } catch (err) {
      console.error('Error fetching admin data:', err);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !currentlyBlocked })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.user_id === userId ? { ...u, is_blocked: !currentlyBlocked } : u
      ));

      toast.success(currentlyBlocked ? 'User unblocked' : 'User blocked');
    } catch (err) {
      console.error('Error toggling block:', err);
      toast.error('Failed to update user status');
    }
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

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold">Admin Panel</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Manage users & settings</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        <Tabs defaultValue="analytics" className="space-y-4 sm:space-y-6">
          <TabsList className="w-full overflow-x-auto flex sm:grid sm:w-full sm:max-w-lg sm:grid-cols-4 gap-1">
            <TabsTrigger value="analytics" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">AI</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Logs</span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : analytics && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-violet-100 flex items-center justify-center">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600" />
                    </div>
                    <span className="text-[10px] sm:text-sm text-muted-foreground">Total Users</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold">{analytics.totalUsers}</p>
                </div>

                <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-indigo-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                    </div>
                    <span className="text-[10px] sm:text-sm text-muted-foreground">Content</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold">{analytics.totalContent}</p>
                </div>

                <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-emerald-100 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    </div>
                    <span className="text-[10px] sm:text-sm text-muted-foreground">Analyses</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold">{analytics.totalAnalysis}</p>
                </div>

                <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-amber-100 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                    </div>
                    <span className="text-[10px] sm:text-sm text-muted-foreground">Avg Score</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold">{analytics.avgQualityScore.toFixed(1)}/10</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 sm:space-y-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            <div className="bg-card border border-border rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">User</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Role</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Content</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Status</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/30">
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div>
                            <p className="font-medium text-xs sm:text-sm">{u.full_name || 'No name'}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                            u.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-muted text-muted-foreground'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">{u.content_count}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          {u.is_blocked ? (
                            <span className="flex items-center gap-1 text-red-600 text-[10px] sm:text-sm">
                              <Ban className="h-3 w-3 sm:h-4 sm:w-4" /> Blocked
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-600 text-[10px] sm:text-sm">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" /> Active
                            </span>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          {u.role !== 'admin' && (
                            <Button
                              variant={u.is_blocked ? 'outline' : 'destructive'}
                              size="sm"
                              onClick={() => toggleBlockUser(u.user_id, u.is_blocked)}
                              className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                            >
                              {u.is_blocked ? 'Unblock' : 'Block'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* AI Settings Tab */}
          <TabsContent value="ai" className="space-y-4 sm:space-y-6">
            <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">AI Control Center</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                Configure AI generation settings and quality thresholds.
              </p>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg sm:rounded-xl gap-2 sm:gap-0">
                  <div>
                    <p className="font-medium text-sm sm:text-base">Content Writer</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Generate blogs, articles, and more</p>
                  </div>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs sm:text-sm font-medium self-start sm:self-auto">Enabled</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg sm:rounded-xl gap-2 sm:gap-0">
                  <div>
                    <p className="font-medium text-sm sm:text-base">Script Generator</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">YouTube, podcast, and video scripts</p>
                  </div>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs sm:text-sm font-medium self-start sm:self-auto">Enabled</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg sm:rounded-xl gap-2 sm:gap-0">
                  <div>
                    <p className="font-medium text-sm sm:text-base">Content Analyzer</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Quality scoring and feedback</p>
                  </div>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs sm:text-sm font-medium self-start sm:self-auto">Enabled</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4 sm:space-y-6">
            <div className="bg-card border border-border rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-border">
                <h3 className="font-semibold text-sm sm:text-base">Activity Logs</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Recent system activity</p>
              </div>
              <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center text-muted-foreground text-sm">
                    No activity logs yet
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {logs.map((log) => (
                      <div key={log.id} className="px-3 sm:px-6 py-3 sm:py-4 hover:bg-muted/30">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs sm:text-sm">{log.action.replace(/_/g, ' ')}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                              {log.details?.email || log.user_id || 'System'}
                            </p>
                          </div>
                          <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
