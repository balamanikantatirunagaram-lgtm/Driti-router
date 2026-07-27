import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Code2, Shield, Zap, Sparkles, FolderGit2, Workflow, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { getToken } from '../lib/auth';

const BASE_URL = window.location.origin.replace('5173', '8000');

type OS = 'unix' | 'powershell' | 'cmd';

export const ConnectPage = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedOS, setSelectedOS] = useState<OS>('unix');
  const token = getToken() || 'your-admin-jwt-token';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all shrink-0"
    >
      {copiedKey === id ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" />
          <span className="text-green-500">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span>Copy Code</span>
        </>
      )}
    </button>
  );

  const getClaudeSnippet = (os: OS) => {
    const install = 'npm install -g @anthropic-ai/claude-code';
    if (os === 'unix') {
      return {
        install,
        env: `export ANTHROPIC_BASE_URL="${BASE_URL}"\nexport ANTHROPIC_AUTH_TOKEN="${token}"\n\n# Launch Claude Code with Auto-Routing\nclaude`,
      };
    }
    if (os === 'powershell') {
      return {
        install,
        env: `$env:ANTHROPIC_BASE_URL="${BASE_URL}"\n$env:ANTHROPIC_AUTH_TOKEN="${token}"\n\n# Launch Claude Code with Auto-Routing\nclaude`,
      };
    }
    return {
      install,
      env: `set ANTHROPIC_BASE_URL=${BASE_URL}\nset ANTHROPIC_AUTH_TOKEN=${token}\n\n:: Launch Claude Code with Auto-Routing\nclaude`,
    };
  };

  const currentSnippet = getClaudeSnippet(selectedOS);

  return (
    <motion.div
      className="max-w-5xl space-y-8 pb-12"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20">
              <Code2 className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
              Claude Code Setup Hub
            </h1>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 font-medium px-2.5 py-0.5">
              100% Free & Unlocked
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Connect Anthropic's official Claude Code CLI directly to Driti Gateway. We translate protocols on the fly, inject architectural reasoning boosters, and route requests to NVIDIA NIM frontier models.
          </p>
        </div>

        {/* OS Selector Pills */}
        <div className="flex items-center gap-1 p-1 bg-card border rounded-xl shadow-sm self-start md:self-auto">
          {[
            { id: 'unix', label: '🍏 Mac / Linux' },
            { id: 'powershell', label: '🪟 Windows (PS)' },
            { id: 'cmd', label: '🪟 Windows (CMD)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedOS(tab.id as OS)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedOS === tab.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Your Universal Token Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card overflow-hidden relative shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">Your Active Gateway Token</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Pass this token as your <code className="text-primary font-mono bg-primary/10 px-1 py-0.5 rounded">ANTHROPIC_AUTH_TOKEN</code> to authenticate with Driti Gateway.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-background/80 border rounded-xl px-4 py-2 font-mono text-xs text-foreground max-w-md w-full md:w-auto justify-between overflow-hidden shadow-inner">
              <span className="truncate mr-2 select-all">{token}</span>
              <CopyBtn text={token} id="main-token" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claude Code Main Card */}
      <Card className="border-purple-500/30 shadow-xl overflow-hidden bg-card/90">
        <CardHeader className="bg-gradient-to-r from-purple-500/10 via-muted/20 to-muted/10 border-b pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Code2 className="h-5 w-5 text-purple-400" /> Official Claude Code CLI
              </CardTitle>
              <CardDescription className="text-xs">
                Translates Anthropic tool calls (Read, Edit, Write, Bash) into NVIDIA NIM function calling with zero restrictions.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <FolderGit2 className="h-3 w-3 mr-1 inline" /> CRUD Enabled
              </Badge>
              <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Sparkles className="h-3 w-3 mr-1 inline" /> Prompt Booster
              </Badge>
              <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20">
                <Zap className="h-3 w-3 mr-1 inline" /> Failover Safe
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Step 1: Install Command */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold">1</span>
              Install Claude Code CLI
            </label>
            <div className="relative rounded-xl bg-black/60 border border-white/10 p-4 font-mono text-sm text-foreground flex items-center justify-between shadow-inner">
              <code className="text-purple-300 overflow-x-auto pr-4">{currentSnippet.install}</code>
              <CopyBtn text={currentSnippet.install} id="install-cmd" />
            </div>
          </div>

          {/* Step 2: Configure & Connect */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold">2</span>
              Configure Environment & Launch
            </label>
            <div className="relative rounded-xl bg-black/60 border border-white/10 p-4 font-mono text-sm text-foreground overflow-hidden shadow-inner">
              <div className="absolute top-3 right-3 z-10">
                <CopyBtn text={currentSnippet.env} id="env-cmd" />
              </div>
              <pre className="overflow-x-auto text-xs leading-relaxed text-blue-300 pr-24 pb-2">
                {currentSnippet.env}
              </pre>
            </div>
          </div>

          {/* Feature Verification Callout */}
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0 mt-0.5">
              <Workflow className="h-4 w-4" />
            </div>
            <div className="text-xs space-y-1">
              <p className="font-semibold text-foreground">Why we exclusively feature Claude Code:</p>
              <p className="text-muted-foreground leading-relaxed">
                Unlike proprietary clients that lock down custom URLs or require paid tiers, <code className="text-foreground">Claude Code</code> allows 100% unrestricted routing via <code className="text-foreground">ANTHROPIC_BASE_URL</code>. All terminal execution, directory inspection (<code className="text-foreground">ls</code>, <code className="text-foreground">grep</code>), and file modifications (<code className="text-foreground">Write</code>, <code className="text-foreground">Edit</code>) sent by your CLI are intercepted by Driti Gateway and executed securely on NVIDIA NIM!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Honesty & Transparency Audit Report */}
      <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-card to-card shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base font-bold text-foreground">
              Compatibility Audit Report: Why Other Clients Are Excluded
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            In complete transparency, we audited every AI coding client to ensure you never waste time on third-party paywalls or locked protocols.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-black/40 border border-green-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-green-400 font-semibold">
              <CheckCircle2 className="h-4 w-4" /> 100% Capable & Unlocked
            </div>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Claude Code CLI</strong>: Zero restrictions. By setting <code className="text-green-300">ANTHROPIC_BASE_URL</code>, 100% of your requests route through Driti Gateway without requiring a paid subscription from third parties.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-black/40 border border-red-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-red-400 font-semibold">
              <XCircle className="h-4 w-4" /> Excluded Vendor Clients
            </div>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Cursor Free, Agy, & @openai/codex CLI</strong>: Cursor Free requires a $20/mo Pro plan for custom URLs. The native <code className="text-red-300">agy</code> binary hardcodes cloud servers, and <code className="text-red-300">codex</code> CLI connects exclusively via WebSockets to ChatGPT.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
