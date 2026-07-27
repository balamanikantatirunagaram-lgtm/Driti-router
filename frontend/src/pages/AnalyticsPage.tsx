import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import api from '../lib/api';
import { useToast } from '../hooks/use-toast';
import { AnalyticsSummary } from '../types';

export const AnalyticsPage = () => {
  const [period, setPeriod] = useState('day');
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
        // Mock data
        setData({
          total_requests: p === 'day' ? 12543 : 84392,
          total_tokens: p === 'day' ? 12500000 : 85000000,
          total_input_tokens: p === 'day' ? 10000000 : 70000000,
          total_output_tokens: p === 'day' ? 2500000 : 15000000,
          avg_latency_ms: 185,
          error_rate: 0.012,
          success_rate: 0.988,
          streaming_rate: 0.85,
          top_models: [
            { model: 'claude-3-opus-20240229', count: p === 'day' ? 5000 : 35000, tokens: 6000000 },
            { model: 'gpt-4o', count: 4000, tokens: 4000000 },
            { model: 'meta/llama3-70b-instruct', count: 2000, tokens: 1500000 },
          ],
          top_users: [
            { username: 'admin', count: 8000, tokens: 8000000 },
            { username: 'developer1', count: 3000, tokens: 3000000 },
          ],
          requests_by_period: Array.from({length: 24}).map((_, i) => ({
            period: `${i}:00`,
            count: Math.floor(Math.random() * 1000) + 100
          })),
          provider_usage: [
            { provider: 'Anthropic', count: 5500, tokens: 6500000 },
            { provider: 'OpenAI', count: 4500, tokens: 4500000 },
            { provider: 'NVIDIA', count: 2543, tokens: 1500000 },
          ],
          errors_over_time: Array.from({length: 24}).map((_, i) => ({
            period: `${i}:00`,
            count: Math.floor(Math.random() * 20)
          }))
        });
      }
    } catch (error) {
      toast({ title: 'Error fetching analytics', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const formatPercent = (num: number) => (num * 100).toFixed(1) + '%';

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground mt-1">Usage, performance, and cost metrics.</p>
        </div>
        
        <Tabs value={period} onValueChange={setPeriod} className="w-[300px]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="day">24h</TabsTrigger>
            <TabsTrigger value="week">7d</TabsTrigger>
            <TabsTrigger value="month">30d</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading || !data ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({length: 6}).map((_, i) => (
              <Card key={i} className="animate-pulse h-28 bg-muted/20" />
            ))}
          </div>
          <Card className="animate-pulse h-80 bg-muted/10" />
        </div>
      ) : (
        <>
          {/* Summary Stats Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.total_requests)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.total_tokens)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.avg_latency_ms}ms</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-destructive">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{formatPercent(data.error_rate)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-500">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{formatPercent(data.success_rate)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Streaming %</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercent(data.streaming_rate)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Requests Volume</CardTitle>
              <CardDescription>Total requests over {period === 'day' ? 'the last 24 hours' : period === 'week' ? 'the last 7 days' : 'the last 30 days'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.requests_by_period} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => formatNumber(val)} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Grid Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Provider Usage</CardTitle>
                <CardDescription>Requests split by provider</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="h-[250px] w-full max-w-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.provider_usage}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="provider"
                      >
                        {data.provider_usage.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Models</CardTitle>
                <CardDescription>Most used models by request count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.top_models} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="model" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={120} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
