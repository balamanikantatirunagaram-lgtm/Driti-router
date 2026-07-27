import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search, Inbox, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import { RequestLog } from '../types';
import { formatDateTime } from '../lib/utils';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const getLatencyColor = (ms: number) => {
  if (ms < 500) return 'text-green-500';
  if (ms < 2000) return 'text-yellow-500';
  return 'text-red-500';
};

export const LogsPage = () => {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await api.get('/api/logs', {
        params: { page, per_page: 50, search: search || undefined },
      });
      // Backend returns: { items, total, page, per_page }
      setLogs(data.items ?? data.logs ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(Math.ceil((data.total ?? 0) / 50) || 1);
    } catch {
      // silently fail on refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => fetchLogs(true), 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return (
    <motion.div className="space-y-4" variants={pageVariants} initial="initial" animate="animate">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Request Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total requests logged</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchLogs(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
              <tr>
                <th className="px-5 py-3.5 font-medium">Timestamp</th>
                <th className="px-5 py-3.5 font-medium">User</th>
                <th className="px-5 py-3.5 font-medium">Model</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Tokens</th>
                <th className="px-5 py-3.5 font-medium">Latency</th>
                <th className="px-5 py-3.5 font-medium">Stream</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 rounded bg-muted animate-pulse" style={{ width: `${40 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-10 w-10 opacity-20" />
                      <span className="text-sm">No request logs yet</span>
                      <span className="text-xs opacity-60">Requests from Claude Code will appear here</span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-3 whitespace-nowrap text-muted-foreground text-xs font-mono">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-5 py-3 font-medium">{log.username}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground font-mono max-w-[180px] truncate">
                      {log.model?.split('/').pop() ?? log.model}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={log.status === 'success' ? 'success' : 'destructive'} className="text-xs">
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {log.total_tokens?.toLocaleString() ?? '—'}
                    </td>
                    <td className={`px-5 py-3 font-mono text-xs font-medium ${getLatencyColor(log.latency_ms)}`}>
                      {log.latency_ms}ms
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs ${log.is_streaming ? 'text-blue-400' : 'text-muted-foreground'}`}>
                        {log.is_streaming ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-1">
        <p className="text-xs text-muted-foreground">
          Page {page} of {totalPages || 1} — {total} total
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
