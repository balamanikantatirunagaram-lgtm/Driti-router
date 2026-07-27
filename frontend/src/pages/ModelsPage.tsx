import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Star, Cpu } from 'lucide-react';
import api from '../lib/api';
import { ModelConfig } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';

const PROVIDER_COLORS: Record<string, string> = {
  meta: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  mistralai: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  nvidia: 'bg-green-500/10 text-green-400 border-green-500/20',
  google: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  microsoft: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  qwen: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const getProvider = (modelId: string) => modelId.split('/')[0] || 'unknown';
const getProviderColor = (modelId: string) =>
  PROVIDER_COLORS[getProvider(modelId)] || 'bg-muted text-muted-foreground border-border';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export const ModelsPage = () => {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [routingMode, setRoutingMode] = useState<string>('auto');
  const { toast } = useToast();

  const fetchModels = async () => {
    try {
      const [modelsRes, routingRes] = await Promise.all([
        api.get('/api/models'),
        api.get('/routing/config').catch(() => ({ data: { mode: 'auto' } }))
      ]);
      setModels(modelsRes.data);
      if (routingRes.data?.mode) setRoutingMode(routingRes.data.mode);
    } catch {
      toast({ title: 'Error fetching models', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModels(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.post('/api/models/refresh');
      await fetchModels();
      toast({ title: 'Models refreshed from NVIDIA' });
    } catch {
      toast({ title: 'Error refreshing models', variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdate = async (id: number, updates: Partial<ModelConfig>) => {
    // Optimistic update
    setModels((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    try {
      await api.patch(`/api/models/${id}`, updates);
    } catch {
      fetchModels(); // Revert on error
      toast({ title: 'Failed to update model', variant: 'destructive' });
    }
  };

  const handleSetDefault = async (id: number) => {
    setModels((prev) => prev.map((m) => ({ ...m, is_default: m.id === id })));
    try {
      await api.patch(`/api/models/${id}`, { is_default: true });
      toast({ title: 'Default model updated' });
    } catch {
      fetchModels();
      toast({ title: 'Failed to set default', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 rounded-xl bg-card border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" variants={pageVariants} initial="initial" animate="animate">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Models</h1>
            <Badge variant="secondary">{models.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage AI models available through the gateway.
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh from NVIDIA
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {models.map((model) => (
          <Card
            key={model.id}
            className={`transition-all duration-200 hover:border-border/80 ${model.is_enabled ? '' : 'opacity-55'} ${model.is_default ? 'ring-1 ring-primary/30' : ''}`}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <span className="truncate">{model.display_name}</span>
                    {!model.is_enabled ? (
                      <span className="bg-destructive/15 text-destructive border border-destructive/30 px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-destructive" />
                        DISABLED
                      </span>
                    ) : routingMode === 'auto' ? (
                      <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.25)]">
                        <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                        ⚡️ AUTO-ROUTING ACTIVE
                      </span>
                    ) : model.is_default ? (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        🔒 LOCKED OVERRIDE
                      </span>
                    ) : (
                      <span className="bg-secondary/60 text-muted-foreground border border-border/60 px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-gray-500" />
                        INACTIVE (STANDBY)
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="font-mono text-xs mt-1 truncate">{model.model_id}</CardDescription>
                </div>
                <Switch
                  checked={model.is_enabled}
                  onCheckedChange={(checked) => handleUpdate(model.id, { is_enabled: checked })}
                />
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border ${getProviderColor(model.model_id)}`}>
                  <Cpu className="h-3 w-3" />
                  {getProvider(model.model_id)}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Temperature</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={model.temperature}
                    onChange={(e) => handleUpdate(model.id, { temperature: parseFloat(e.target.value) || 0 })}
                    disabled={!model.is_enabled}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Max Tokens</Label>
                  <Input
                    type="number"
                    value={model.max_tokens}
                    onChange={(e) => handleUpdate(model.id, { max_tokens: parseInt(e.target.value) || 4096 })}
                    disabled={!model.is_enabled}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {routingMode === 'auto' && model.is_enabled ? (
                <div className="w-full text-center py-1.5 px-2 bg-purple-500/10 border border-purple-500/20 rounded-md text-purple-300 text-xs font-medium flex items-center justify-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Smart Router: Selected automatically per request
                </div>
              ) : !model.is_default && model.is_enabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSetDefault(model.id)}
                  className="w-full text-xs h-8 border border-dashed border-border hover:border-primary/50 hover:text-primary"
                >
                  <Star className="mr-1.5 h-3 w-3" />
                  Set as Lock Override (Manual Mode)
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};
