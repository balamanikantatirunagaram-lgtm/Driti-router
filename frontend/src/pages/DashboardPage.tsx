import { motion } from 'framer-motion';
import { Activity, Server, Users, Zap, Clock, Database, Globe, Cpu } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { useWebSocket } from '../hooks/useWebSocket';
import { StatCard } from '../components/dashboard/StatCard';
import { RequestChart } from '../components/dashboard/RequestChart';
import { StatusIndicator } from '../components/dashboard/StatusIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { DashboardStats } from '../types';
import { formatNumber } from '../lib/utils';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const cardVariant = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const DashboardPage = () => {
  const { stats, loading, setStats } = useDashboard();

  useWebSocket('ws://localhost:8000/ws/stats', (data: DashboardStats) => {
    setStats(data);
  });

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
        <div className="h-[340px] rounded-xl bg-card border border-border animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" variants={pageVariants} initial="initial" animate="animate">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* Metric stat cards */}
      <motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" variants={stagger}>
        <motion.div variants={cardVariant}>
          <StatCard title="Requests Today" value={formatNumber(stats.requests_today)} icon={Activity} trend={{ value: 12, isPositive: true }} />
        </motion.div>
        <motion.div variants={cardVariant}>
          <StatCard title="Total Requests" value={formatNumber(stats.total_requests)} icon={Globe} />
        </motion.div>
        <motion.div variants={cardVariant}>
          <StatCard title="Tokens Today" value={formatNumber(stats.tokens_today)} icon={Zap} trend={{ value: 5.2, isPositive: true }} />
        </motion.div>
        <motion.div variants={cardVariant}>
          <StatCard title="Avg Latency" value={`${stats.avg_latency_ms.toFixed(0)}ms`} icon={Clock} />
        </motion.div>
      </motion.div>

      {/* Status cards */}
      <motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" variants={stagger}>
        <motion.div variants={cardVariant}>
          <Card className="hover:border-border/80 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gateway Status</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <StatusIndicator status={stats.gateway_status} className="mt-1" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariant}>
          <Card className="hover:border-border/80 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NVIDIA Connection</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <StatusIndicator status={stats.nvidia_connected ? 'online' : 'offline'} className="mt-1" />
              {stats.default_model && (
                <p className="text-xs text-muted-foreground mt-2 truncate">{stats.default_model.split('/').pop()}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariant}>
          <Card className="hover:border-border/80 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mt-1">{stats.online_users}</div>
              <p className="text-xs text-muted-foreground">connected now</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariant}>
          <Card className="hover:border-border/80 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mt-1">{stats.success_rate.toFixed(1)}%</div>
              <Badge
                variant={stats.success_rate >= 99 ? 'success' : stats.success_rate >= 95 ? 'warning' : 'destructive'}
                className="mt-1"
              >
                {stats.success_rate >= 99 ? 'Excellent' : stats.success_rate >= 95 ? 'Good' : 'Degraded'}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Chart */}
      <motion.div variants={cardVariant}>
        <RequestChart data={stats.requests_24h} />
      </motion.div>
    </motion.div>
  );
};
