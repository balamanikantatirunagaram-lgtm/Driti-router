import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Server, Database, Cloud, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import api from '../lib/api';
import { HealthStatus } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const StatusIcon = ({ status }: { status: string }) => {
  const s = status?.toLowerCase();
  if (s === 'online' || s === 'healthy') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  if (s === 'degraded') return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  return <XCircle className="h-5 w-5 text-red-500" />;
};

const StatusBadge = ({ status }: { status: string }) => {
  const s = status?.toLowerCase();
  const variant = (s === 'online' || s === 'healthy')
    ? 'success'
    : s === 'degraded'
    ? 'warning'
    : 'destructive';
  return <Badge variant={variant} className="capitalize">{status || 'Unknown'}</Badge>;
};

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
};

export const HealthPage = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const fetchHealth = async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const { data } = await api.get('/health');
      setHealth(data);
      setLastChecked(new Date());
    } catch {
      // handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchHealth(); }, []);

  if (loading || !health) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-card border border-border rounded animate-pulse" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const overallVariant =
    health.status === 'healthy' ? 'success' : health.status === 'degraded' ? 'warning' : 'destructive';

  return (
    <motion.div className="space-y-6" variants={pageVariants} initial="initial" animate="animate">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
            <Badge variant={overallVariant} className="capitalize">{health.status}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={() => fetchHealth()} disabled={refreshing} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <motion.div className="grid gap-6 md:grid-cols-3" variants={stagger}>
        {/* Gateway */}
        <motion.div variants={cardVariant}>
          <Card className="hover:border-border/80 transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">Gateway</CardTitle>
              <Server className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusIcon status={health.gateway.status} />
                <StatusBadge status={health.gateway.status} />
              </div>
              <div className="space-y-2.5 pt-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Latency</span>
                  <span className="font-mono">{health.gateway.latency_ms}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-mono text-xs">{health.version}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-mono text-xs">{formatUptime(health.uptime_seconds)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Database */}
        <motion.div variants={cardVariant}>
          <Card className="hover:border-border/80 transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">Database</CardTitle>
              <Database className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusIcon status={health.database.status} />
                <StatusBadge status={health.database.status} />
              </div>
              <div className="space-y-2.5 pt-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Response Time</span>
                  <span className={`font-mono ${health.database.latency_ms < 10 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {health.database.latency_ms}ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Engine</span>
                  <span className="font-mono text-xs">SQLite WAL</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* NVIDIA */}
        <motion.div variants={cardVariant}>
          <Card className="hover:border-border/80 transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">NVIDIA NIM</CardTitle>
              <Cloud className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusIcon status={health.nvidia.status} />
                <StatusBadge status={health.nvidia.status} />
              </div>
              <div className="space-y-2.5 pt-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Connection</span>
                  <span className={health.nvidia.connected ? 'text-green-500 text-xs' : 'text-red-500 text-xs'}>
                    {health.nvidia.connected ? 'Active' : 'Failed'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">API Latency</span>
                  <span className="font-mono">{health.nvidia.latency_ms}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Endpoint</span>
                  <span className="font-mono text-xs">integrate.api.nvidia.com</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" variants={stagger}>
        {/* System Resources */}
        <motion.div variants={cardVariant} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">System Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium flex items-center gap-2"><Server className="h-4 w-4 text-primary" /> CPU Usage</span>
                  <span className="font-mono text-muted-foreground">24%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '24%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> Memory Usage</span>
                  <span className="font-mono text-muted-foreground">3.2 GB / 16 GB (20%)</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '20%' }} />
                </div>
              </div>
              <div className="pt-2 flex justify-between items-center text-sm border-t">
                <span className="text-muted-foreground">Active Connections</span>
                <span className="font-bold text-lg text-primary">1,245</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* MCP Servers */}
        <motion.div variants={cardVariant}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">MCP Servers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">local-fs</span>
                  <StatusIcon status="online" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">postgres-db</span>
                  <StatusIcon status="offline" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">github-tools</span>
                  <StatusIcon status="online" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Providers */}
        <motion.div variants={cardVariant}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Anthropic</span>
                  <StatusIcon status="online" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">OpenAI</span>
                  <StatusIcon status="online" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">NVIDIA NIM</span>
                  <StatusIcon status={health.nvidia.status} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
