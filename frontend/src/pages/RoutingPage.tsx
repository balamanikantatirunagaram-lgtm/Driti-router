import { useState, useEffect } from 'react';
import { Brain, Zap, DollarSign, Activity, Play, Plus, GripVertical, Settings2, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import api from '../lib/api';
import { useToast } from '../hooks/use-toast';
import { RoutingRule } from '../types';

export const RoutingPage = () => {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [mode, setMode] = useState('auto');
  const { toast } = useToast();

  const fetchRouting = async () => {
    try {
      const [rulesRes, configRes] = await Promise.all([
        api.get('/routing/rules').then(r => r.data).catch(() => null),
        api.get('/routing/config').then(r => r.data).catch(() => null)
      ]);
      
      setRules(Array.isArray(rulesRes) && rulesRes.length ? rulesRes : [
        { id: 1, name: 'Complex Coding Tasks', description: 'Route to Opus for deep reasoning', is_enabled: true, priority: 10, condition_type: 'prompt_match', condition_value: '(architect|refactor|complex)', provider_id: 2, model_override: 'claude-3-opus-20240229' },
        { id: 2, name: 'Fallback to OpenAI', description: 'When Anthropic is down', is_enabled: true, priority: 20, condition_type: 'provider_down', condition_value: 'anthropic', provider_id: 1, model_override: 'gpt-4o' },
        { id: 3, name: 'Local NIM for simple tasks', description: 'Save cost on easy questions', is_enabled: false, priority: 30, condition_type: 'max_tokens', condition_value: '<100', provider_id: 3, model_override: 'meta/llama3-8b-instruct' }
      ]);
      setMode(configRes?.mode || 'auto');
    } catch (error) {
      toast({ title: 'Error fetching routing', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchRouting();
  }, []);

  const handleModeChange = async (newMode: string) => {
    setMode(newMode);
    try {
      await api.post('/routing/config', { mode: newMode });
      toast({ title: 'Routing Mode Updated', description: `Switched to ${newMode.toUpperCase()} routing mode.` });
    } catch (e) {
      toast({ title: 'Failed to update routing mode', variant: 'destructive' });
    }
  };

  const routingModes = [
    { id: 'manual', name: 'Manual Override', desc: 'Strictly enforce the selected Default Model for all requests', icon: Settings2, color: 'text-gray-500' },
    { id: 'auto', name: 'Auto (Smart)', desc: 'AI analyzes prompt & picks optimal model (120B/550B/GLM)', icon: Brain, color: 'text-purple-500' },
    { id: 'cost', name: 'Cost Optimized', desc: 'Lowest cost per 1k tokens', icon: DollarSign, color: 'text-green-500' },
    { id: 'latency', name: 'Latency Optimized', desc: 'Fastest time to first token', icon: Zap, color: 'text-yellow-500' },
    { id: 'reliability', name: 'Reliability', desc: 'Highest success rate provider', icon: Activity, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Smart Router</h2>
        <p className="text-muted-foreground mt-1">Configure intelligent request routing across model providers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {routingModes.map((m) => {
          const isSelected = mode === m.id;
          const Icon = m.icon;
          return (
            <div 
              key={m.id}
              onClick={() => handleModeChange(m.id)}
              className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                isSelected 
                  ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
                  : 'border-border bg-card hover:border-primary/50 hover:bg-accent/50'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 h-full w-1 bg-primary rounded-r-xl" />
              )}
              <Icon className={`h-6 w-6 mb-3 ${m.color}`} />
              <h3 className="font-semibold text-sm">{m.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.desc}</p>
            </div>
          )
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Routing Rules</CardTitle>
            <CardDescription>Rules are evaluated in order of priority (lowest number first).</CardDescription>
          </div>
          <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Rule</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{rule.name}</div>
                    <div className="text-xs text-muted-foreground">{rule.description}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">{rule.condition_type}</Badge>
                      <span className="text-sm font-mono">{rule.condition_value}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>Provider ID: {rule.provider_id}</span>
                      <span className="text-xs text-muted-foreground">Model: {rule.model_override || 'auto'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch checked={rule.is_enabled} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-dashed border-2 bg-muted/10">
        <CardHeader>
          <CardTitle className="text-lg flex items-center"><Play className="mr-2 h-5 w-5 text-primary" /> Route Tester</CardTitle>
          <CardDescription>Test how a prompt will be routed based on current rules and mode.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label>Sample Prompt</Label>
                <Textarea placeholder="Type a prompt to test routing..." rows={4} className="resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Requested Model (Optional)</Label>
                  <Input placeholder="e.g. gpt-4" />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Tokens</Label>
                  <Input type="number" defaultValue={150} />
                </div>
              </div>
              <Button className="w-full">Test Routing</Button>
            </div>
            
            <div className="border rounded-lg bg-card p-4 flex flex-col justify-center text-center space-y-4 min-h-[200px]">
              <div className="text-muted-foreground text-sm">Simulation Result</div>
              <div>
                <Badge className="bg-primary/20 text-primary hover:bg-primary/30 text-lg py-1 px-4">
                  Claude 3.5 Sonnet
                </Badge>
              </div>
              <div className="text-sm">via <span className="font-semibold">Anthropic</span></div>
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mx-4 text-left">
                <strong>Reason:</strong> Matched Rule #1 "Complex Coding Tasks" due to prompt contents.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
