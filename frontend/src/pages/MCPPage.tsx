import { useState, useEffect } from 'react';
import { Puzzle, Plus, Play, RefreshCw, Terminal, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import api from '../lib/api';
import { useToast } from '../hooks/use-toast';
import { MCPServer } from '../types';
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';

export const MCPPage = () => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchServers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/mcp');
      setServers(Array.isArray(data) && data.length ? data : [
        { id: 1, name: 'local-fs', transport: 'stdio', command: 'npx', args: '-y @modelcontextprotocol/server-filesystem /Users', url: null, env_vars: null, is_enabled: true, is_connected: true, capabilities: '["resources","tools"]', version: '0.1.0', last_seen_at: new Date().toISOString(), last_error: null, created_at: new Date().toISOString() },
        { id: 2, name: 'postgres-db', transport: 'stdio', command: 'npx', args: '-y @modelcontextprotocol/server-postgres postgresql://localhost/mydb', url: null, env_vars: null, is_enabled: true, is_connected: false, capabilities: null, version: null, last_seen_at: null, last_error: 'Connection refused', created_at: new Date().toISOString() }
      ]);
    } catch (error) {
      toast({
        title: 'Error fetching MCP servers',
        description: 'Could not load MCP data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const getTransportColor = (transport: string) => {
    switch(transport) {
      case 'stdio': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'http': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'sse': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">MCP Servers</h2>
            <Badge variant="secondary" className="rounded-full">{servers.length}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">Manage Model Context Protocol servers for tool execution.</p>
        </div>
        
        <DialogRoot>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Server</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add MCP Server</DialogTitle>
              <DialogDescription>Configure a new Model Context Protocol connection.</DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="transport">Transport</TabsTrigger>
                <TabsTrigger value="env">Environment</TabsTrigger>
              </TabsList>
              
              <div className="py-4">
                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Server Name</Label>
                    <Input placeholder="e.g. github-tools" />
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <Label>Enable on creation</Label>
                    <Switch defaultChecked />
                  </div>
                </TabsContent>
                
                <TabsContent value="transport" className="space-y-4">
                  <div className="space-y-2 mb-4">
                    <Label>Transport Type</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="stdio">stdio (Local Command)</option>
                      <option value="sse">SSE (Server-Sent Events)</option>
                      <option value="http">HTTP (REST/RPC)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
                    <div className="space-y-2">
                      <Label>Command</Label>
                      <Input placeholder="npx" />
                    </div>
                    <div className="space-y-2">
                      <Label>Arguments (one per line)</Label>
                      <Textarea placeholder="-y&#10;@modelcontextprotocol/server-github" rows={3} />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="env" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Environment Variables</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Key (e.g. GITHUB_TOKEN)" className="flex-1" />
                      <Input placeholder="Value" type="password" className="flex-1" />
                      <Button variant="secondary">Add</Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                    No environment variables defined.
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Save Server</Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1,2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted/20" />
              <CardContent className="h-24 bg-muted/10" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {servers.map(server => (
            <Card key={server.id} className="flex flex-col border-border/60 hover:border-border transition-colors">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-muted">
                    <Puzzle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {server.name}
                      <div className={`h-2 w-2 rounded-full ${server.is_connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    </CardTitle>
                    <div className="mt-1">
                      <Badge variant="outline" className={getTransportColor(server.transport)}>
                        {server.transport}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Switch checked={server.is_enabled} />
              </CardHeader>
              
              <CardContent className="flex-1 text-sm space-y-3 pt-2">
                {server.transport === 'stdio' ? (
                  <div className="bg-muted p-2 rounded text-xs font-mono text-muted-foreground break-all">
                    $ {server.command} {server.args}
                  </div>
                ) : (
                  <div className="bg-muted p-2 rounded text-xs font-mono text-muted-foreground truncate">
                    {server.url}
                  </div>
                )}
                
                {server.last_error && (
                  <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded mt-2 border border-red-500/20">
                    {server.last_error}
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap mt-3">
                  {server.capabilities ? (
                    JSON.parse(server.capabilities).map((cap: string) => (
                      <Badge key={cap} variant="secondary" className="text-[10px] uppercase">
                        {cap}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No capabilities detected</span>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-3 border-t border-border/50 bg-muted/5 flex justify-between gap-2">
                <div className="text-xs text-muted-foreground flex items-center">
                  {server.version && <span className="mr-3">v{server.version}</span>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" title="Test Connection">
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" title="Restart">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" title="View Logs">
                    <Terminal className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
