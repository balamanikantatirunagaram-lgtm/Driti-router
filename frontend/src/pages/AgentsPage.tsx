import { useState, useEffect } from 'react';
import { Bot, Plus, Settings2, ShieldCheck, TerminalSquare, FolderGit2, Globe, MemoryStick, Search, Puzzle, Workflow, Zap, Brain, Edit2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import api from '../lib/api';
import { useToast } from '../hooks/use-toast';
import { AgentProfile } from '../types';

export const AgentsPage = () => {
  const [profiles, setProfiles] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/agents/profiles');
      setProfiles(Array.isArray(data) && data.length ? data : [
        { id: 1, name: 'claude-code', display_name: 'Claude Code', capabilities: '["filesystem","terminal","git","search","mcp"]', is_enabled: true, config: null },
        { id: 2, name: 'agy-default', display_name: 'Antigravity (AGY)', capabilities: '["filesystem","terminal","browser","memory","mcp","tool_calling","reasoning"]', is_enabled: true, config: null },
        { id: 3, name: 'generic-assistant', display_name: 'Generic Assistant', capabilities: '["search","streaming"]', is_enabled: true, config: null }
      ]);
    } catch (error) {
      toast({
        title: 'Error fetching agent profiles',
        description: 'Could not load profiles.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const capabilityIcons: Record<string, { icon: any, color: string }> = {
    filesystem: { icon: FolderGit2, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    terminal: { icon: TerminalSquare, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
    git: { icon: FolderGit2, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    browser: { icon: Globe, color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' },
    memory: { icon: MemoryStick, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
    search: { icon: Search, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
    mcp: { icon: Puzzle, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
    tool_calling: { icon: Workflow, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
    streaming: { icon: Zap, color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' },
    reasoning: { icon: Brain, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agent Profiles</h2>
          <p className="text-muted-foreground mt-1">Configure capabilities and permissions for autonomous agents.</p>
        </div>
        
        <Button><Plus className="mr-2 h-4 w-4" /> Add Profile</Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted/20" />
              <CardContent className="h-32 bg-muted/10" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map(profile => {
            const caps = profile.capabilities ? JSON.parse(profile.capabilities) : [];
            
            return (
              <Card key={profile.id} className="flex flex-col border-border/60 hover:border-border transition-colors">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Bot className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{profile.display_name}</CardTitle>
                      <CardDescription className="text-xs font-mono mt-0.5">{profile.name}</CardDescription>
                    </div>
                  </div>
                  <Switch checked={profile.is_enabled} />
                </CardHeader>
                
                <CardContent className="flex-1 pt-4">
                  <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Capabilities</div>
                  <div className="flex flex-wrap gap-2">
                    {caps.map((cap: string) => {
                      const meta = capabilityIcons[cap] || { icon: Settings2, color: 'text-gray-500 bg-gray-500/10 border-gray-500/20' };
                      const Icon = meta.icon;
                      
                      return (
                        <Badge key={cap} variant="outline" className={`flex items-center gap-1.5 px-2 py-1 ${meta.color}`}>
                          <Icon className="h-3 w-3" />
                          <span>{cap.replace('_', ' ')}</span>
                        </Badge>
                      );
                    })}
                    {caps.length === 0 && <span className="text-sm text-muted-foreground">No capabilities assigned</span>}
                  </div>
                </CardContent>
                
                <CardFooter className="pt-4 border-t border-border/50 bg-muted/10 flex justify-between">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                    Verified Profile
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
