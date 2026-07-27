import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import api from '../lib/api';
import { useToast } from '../hooks/use-toast';
import { AnalyticsSummary } from '../types';

export const AnalyticsPage = () => {
  const [period, setPeriod] = useState('overall');
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = async (p: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/analytics/summary?period=${p}`).then(r => r.data).catch(() => null);
      if (res) {
        setData(res);
      } else {
        setData({
          total_requests: 0,
          total_tokens: 0,
          total_input_tokens: 0,
          total_output_tokens: 0,
          avg_latency_ms: 0,
          error_rate: 0,
          success_rate: 100,
          streaming_rate: 0,
          top_models: [],
          top_users: [],
          requests_by_period: [],
          provider_usage: [],
          errors_over_time: []
        });
      }
    } catch (error) {
      toast({ title: 'Error fetching real-time analytics', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const formatNumber = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const formatPercent = (num: number) => {
    if (num === undefined || num === null) return '0.0%';
    // If backend returns percentage 0..100 directly
    if (num > 1) return num.toFixed(1) + '%';
    return (num * 100).toFixed(1) + '%';
  };

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Real-Time Analytics
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Live usage, latency, provider breakdown, and token volume directly from database logs.
          </p>
        </div>
        
        <Tabs value={period} onValueChange={setPeriod} className="w-full sm:w-[380px]">
          <TabsList className="grid w-full grid-cols-5 bg-card border p-1 rounded-xl shadow-sm">
            <TabsTrigger value="day" className="rounded-lg text-xs font-semibold">Day</TabsTrigger>
            <TabsTrigger value="week" className="rounded-lg text-xs font-semibold">Week</TabsTrigger>
            <TabsTrigger value="month" className="rounded-lg text-xs font-semibold">Month</TabsTrigger>
            <TabsTrigger value="year" className="rounded-lg text-xs font-semibold">Year</TabsTrigger>
            <TabsTrigger value="overall" className="rounded-lg text-xs font-semibold">Overall</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading || !data ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({length: 6}).map((_, i) => (
              <Card key={i} className="animate-pulse h-28 bg-muted/20 rounded-xl border-border/40" />
            ))}
          </div>
          <Card className="animate-pulse h-80 bg-muted/10 rounded-xl border-border/40" />
        </div>
      ) : (
        <>
          {/* Summary Stats Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card className="bg-card/80 border-border/60 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatNumber(data.total_requests)}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Real database count</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border/60 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatNumber(data.total_tokens)}</div>
                <p className="text-[11px] text-muted-foreground mt-1">In: {formatNumber(data.total_input_tokens)} / Out: {formatNumber(data.total_output_tokens)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border/60 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Latency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{data.avg_latency_ms} ms</div>
                <p className="text-[11px] text-muted-foreground mt-1">Roundtrip NIM time</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border/60 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-destructive uppercase tracking-wider">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{formatPercent(data.error_rate)}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Failed requests</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border/60 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">{formatPercent(data.success_rate)}</div>
                <p className="text-[11px] text-muted-foreground mt-1">Completed status</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border/60 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Streaming %</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">{formatPercent(data.streaming_rate)}</div>
                <p className="text-[11px] text-muted-foreground mt-1">SSE streaming</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart */}
          <Card className="bg-card/90 border-border/60 shadow-xl overflow-hidden">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="text-lg font-bold">Requests Volume</CardTitle>
              <CardDescription className="text-xs">
                Total requests over {period === 'day' ? 'the last 24 hours' : period === 'week' ? 'the last 7 days' : period === 'month' ? 'the last 30 days' : period === 'year' ? 'the last 12 months' : 'all time'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.requests_by_period} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                    <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => formatNumber(val)} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: 'hsl(var(--foreground))', fontSize: '12px', fontWeight: 'bold' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '11px', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="count" name="Requests" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Grid Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-card/90 border-border/60 shadow-xl overflow-hidden">
              <CardHeader className="border-b bg-muted/20 pb-4">
                <CardTitle className="text-base font-bold">Provider Usage Breakdown</CardTitle>
                <CardDescription className="text-xs">Requests categorized by target AI provider</CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex justify-center items-center">
                {data.provider_usage && data.provider_usage.length > 0 ? (
                  <div className="h-[260px] w-full max-w-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.provider_usage}
                          cx="50%"
                          cy="45%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="count"
                          nameKey="provider"
                        >
                          {data.provider_usage.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '10px' }}
                          formatter={(value: any, name: any, props: any) => [`${value} reqs (${formatNumber(props.payload.tokens)} tokens)`, name]}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                    No provider usage recorded yet
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/90 border-border/60 shadow-xl overflow-hidden">
              <CardHeader className="border-b bg-muted/20 pb-4">
                <CardTitle className="text-base font-bold">Top Models by Request Count</CardTitle>
                <CardDescription className="text-xs">Most actively queried frontier models</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {data.top_models && data.top_models.length > 0 ? (
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.top_models} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} opacity={0.3} />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis dataKey="model" type="category" stroke="hsl(var(--foreground))" fontSize={11} tickLine={false} axisLine={false} width={130} tickFormatter={(val) => val.length > 18 ? val.substring(0, 18) + '...' : val} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '10px' }}
                          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                          formatter={(value: any, _: any, props: any) => [`${value} requests (${formatNumber(props.payload.tokens)} tokens)`, 'Usage']}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                    No model usage recorded yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
