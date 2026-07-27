import { useState, useEffect } from 'react';
import { Plus, Trash2, Activity, Server } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import api from '../lib/api';
import { useToast } from '../hooks/use-toast';
import { Provider } from '../types';
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

export const ProvidersPage = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/providers');
      // mock data if API fails or returns nothing
      setProviders(Array.isArray(data) && data.length ? data : ([
        { id: 1, name: 'openai', display_name: 'OpenAI', base_url: 'https://api.openai.com/v1', is_enabled: true, is_default: true, priority: 1, health_status: 'online', latency_ms: 45, total_requests: 1200, error_rate: 0.01, last_health_check: new Date().toISOString() },
        { id: 2, name: 'anthropic', display_name: 'Anthropic', base_url: 'https://api.anthropic.com/v1', is_enabled: true, is_default: false, priority: 2, health_status: 'online', latency_ms: 120, total_requests: 450, error_rate: 0.0, last_health_check: new Date().toISOString() },
        { id: 3, name: 'nvidia', display_name: 'NVIDIA NIM', base_url: 'http://localhost:8000/v1', is_enabled: false, is_default: false, priority: 3, health_status: 'offline', latency_ms: 0, total_requests: 0, error_rate: 0, last_health_check: null }
      ] as Provider[]));
    } catch (error) {
      toast({
        title: 'Error fetching providers',
        description: 'Could not load provider data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const getHealthColor = (status: string) => {
    switch(status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'degraded': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getLatencyColor = (ms: number) => {
    if (ms === 0) return 'bg-gray-500/10 text-gray-500';
    if (ms < 100) return 'bg-green-500/10 text-green-500';
    if (ms < 500) return 'bg-yellow-500/10 text-yellow-500';
    return 'bg-red-500/10 text-red-500';
  };

  const getProviderIconColor = (name: string) => {
    if (name.toLowerCase().includes('nvidia')) return 'text-green-500';
    if (name.toLowerCase().includes('openai')) return 'text-teal-500';
    if (name.toLowerCase().includes('anthropic')) return 'text-amber-500';
    return 'text-primary';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Providers</h2>
          <p className="text-muted-foreground mt-1">Manage AI model providers and endpoints.</p>
        </div>
        
        <DialogRoot>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Provider</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Provider</DialogTitle>
              <DialogDescription>Configure a new AI model provider endpoint.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input placeholder="e.g. OpenAI" />
              </div>
              <div className="space-y-2">
                <Label>Name (internal)</Label>
                <Input placeholder="e.g. openai" />
              </div>
              <div className="space-y-2">
                <Label>Base URL</Label>
                <Input placeholder="https://api.openai.com/v1" />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input type="password" placeholder="sk-..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Input type="number" defaultValue="1" />
                </div>
                <div className="flex items-center justify-between pt-8">
                  <Label>Enabled</Label>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Save Provider</Button>
            </DialogFooter>
          </DialogContent>
        </DialogRoot>
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
          {providers.map(provider => (
            <Card key={provider.id} className="flex flex-col relative overflow-hidden group">
              {provider.is_default && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                  Default
                </div>
              )}
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-md bg-muted/50 ${getProviderIconColor(provider.name)}`}>
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{provider.display_name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="relative flex h-2 w-2">
                        {provider.health_status === 'online' && (
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getHealthColor(provider.health_status)}`}></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${getHealthColor(provider.health_status)}`}></span>
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{provider.health_status}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono bg-muted/50">Pri: {provider.priority}</Badge>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate max-w-[200px]" title={provider.base_url}>
                    {provider.base_url.replace(/^https?:\/\//, '')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Latency</div>
                    <Badge variant="secondary" className={getLatencyColor(provider.latency_ms)}>
                      {provider.latency_ms > 0 ? `${provider.latency_ms}ms` : 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Requests</div>
                    <div className="font-medium">{provider.total_requests.toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-border/50 flex justify-between bg-muted/10">
                <div className="flex items-center gap-2">
                  <Switch checked={provider.is_enabled} />
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                    <Activity className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive">
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
