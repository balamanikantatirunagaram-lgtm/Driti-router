import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, Trash2, Eye, CheckCircle2, XCircle, X } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { LiveRequest } from '../types';

export const LivePage = () => {
  const [requests, setRequests] = useState<LiveRequest[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedReq, setSelectedReq] = useState<LiveRequest | null>(null);
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
  useEffect(() => {
    // Generate some mock initial data
    const initialMocks: LiveRequest[] = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() - i * 1000,
      timestamp: new Date(Date.now() - i * 1000).toISOString(),
      username: i % 3 === 0 ? 'admin' : 'developer1',
      model: i % 2 === 0 ? 'claude-3-opus-20240229' : 'gpt-4o',
      provider: i % 2 === 0 ? 'Anthropic' : 'OpenAI',
      endpoint: '/v1/chat/completions',
      prompt_tokens: Math.floor(Math.random() * 500) + 50,
      completion_tokens: Math.floor(Math.random() * 200) + 20,
      total_tokens: 0,
      latency_ms: Math.floor(Math.random() * 1500) + 100,
      status: (i % 10 === 0 ? 'error' : 'success') as 'error' | 'success',
      is_streaming: i % 2 !== 0,
      error_message: i % 10 === 0 ? 'Rate limit exceeded' : null,
      ip_address: '192.168.1.100'
    })).map(r => ({ ...r, total_tokens: r.prompt_tokens + r.completion_tokens }));
    
    setRequests(initialMocks);

    // Mock WebSocket connection
    const interval = setInterval(() => {
      if (!isPaused) {
        const isError = Math.random() > 0.9;
        const newReq: LiveRequest = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          username: Math.random() > 0.5 ? 'admin' : 'developer1',
          model: Math.random() > 0.5 ? 'claude-3-opus-20240229' : 'gpt-4o',
          provider: Math.random() > 0.5 ? 'Anthropic' : 'OpenAI',
          endpoint: '/v1/chat/completions',
          prompt_tokens: Math.floor(Math.random() * 500) + 50,
          completion_tokens: Math.floor(Math.random() * 200) + 20,
          get total_tokens() { return this.prompt_tokens + this.completion_tokens },
          latency_ms: Math.floor(Math.random() * 1500) + 100,
          status: isError ? 'error' : 'success',
          is_streaming: Math.random() > 0.3,
          error_message: isError ? 'Connection timeout' : null,
          ip_address: '192.168.1.100'
        };
        
        setRequests(prev => [newReq, ...prev].slice(0, 100)); // Keep max 100
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const clearLogs = () => setRequests([]);
  
  const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* Main Content */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${selectedReq ? 'mr-[400px]' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Live Requests</h2>
            {!isPaused && (
              <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                LIVE
              </Badge>
            )}
            {isPaused && <Badge variant="secondary">PAUSED</Badge>}
          </div>
          
          <div className="flex items-center gap-2">
            <select 
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="success">Success Only</option>
              <option value="error">Errors Only</option>
            </select>
            <Button variant="outline" size="icon" onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={clearLogs}>
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </div>

        <Card className="flex-1 overflow-hidden flex flex-col rounded-xl">
          <div className="overflow-auto flex-1">
            <Table className="relative w-full">
              <TableHeader className="sticky top-0 bg-card z-10 border-b shadow-sm">
                <TableRow>
                  <TableHead className="w-[100px]">Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {filteredRequests.map((req) => (
                    <motion.tr
                      key={req.id}
                      initial={{ opacity: 0, y: -20, backgroundColor: 'hsl(var(--primary)/0.1)' }}
                      animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(req.timestamp).toLocaleTimeString([], { hour12: false })}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{req.username}</TableCell>
                      <TableCell className="text-sm">
                        <span className={req.provider === 'Anthropic' ? 'text-amber-500' : 'text-teal-500'}>{req.provider}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{req.model}</TableCell>
                      <TableCell className="font-mono text-xs">{req.total_tokens}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-mono text-[10px] ${req.latency_ms > 1000 ? 'text-red-500 border-red-500/20 bg-red-500/10' : req.latency_ms > 500 ? 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10' : 'text-green-500 border-green-500/20 bg-green-500/10'}`}>
                          {req.latency_ms}ms
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {req.status === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedReq(req)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No requests to display.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Slide-out Inspector Panel */}
      <AnimatePresence>
        {selectedReq && (
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="fixed top-14 right-0 bottom-0 w-[400px] border-l bg-card shadow-2xl z-20 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Search className="h-4 w-4" /> Request Inspector
              </h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={() => setSelectedReq(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-6">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status</div>
                <div className="flex items-center gap-2">
                  {selectedReq.status === 'success' ? (
                    <Badge className="bg-green-500 hover:bg-green-600">Success</Badge>
                  ) : (
                    <Badge variant="destructive">Error</Badge>
                  )}
                  <span className="text-sm font-mono text-muted-foreground">{new Date(selectedReq.timestamp).toLocaleString()}</span>
                </div>
                {selectedReq.error_message && (
                  <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md font-mono">
                    {selectedReq.error_message}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold border-b pb-1">Routing</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Provider</div>
                  <div className="font-medium">{selectedReq.provider}</div>
                  <div className="text-muted-foreground">Model</div>
                  <div className="font-medium font-mono text-xs">{selectedReq.model}</div>
                  <div className="text-muted-foreground">Endpoint</div>
                  <div className="font-medium font-mono text-xs">{selectedReq.endpoint}</div>
                  <div className="text-muted-foreground">Streaming</div>
                  <div className="font-medium">{selectedReq.is_streaming ? 'Yes' : 'No'}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold border-b pb-1">Usage</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Prompt Tokens</div>
                  <div className="font-medium">{selectedReq.prompt_tokens}</div>
                  <div className="text-muted-foreground">Completion Tokens</div>
                  <div className="font-medium">{selectedReq.completion_tokens}</div>
                  <div className="text-muted-foreground font-semibold">Total Tokens</div>
                  <div className="font-medium font-semibold">{selectedReq.total_tokens}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold border-b pb-1">Performance</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Total Latency</div>
                  <div className="font-medium">{selectedReq.latency_ms}ms</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold border-b pb-1">Client</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">User</div>
                  <div className="font-medium">{selectedReq.username}</div>
                  <div className="text-muted-foreground">IP Address</div>
                  <div className="font-medium font-mono text-xs">{selectedReq.ip_address}</div>
                  <div className="text-muted-foreground">Request ID</div>
                  <div className="font-medium font-mono text-xs break-all">{selectedReq.id}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Fix the missing Search import
import { Search } from 'lucide-react';
