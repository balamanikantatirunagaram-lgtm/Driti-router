import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Terminal, Code2, Bot, Shield, Zap, Sparkles, FolderGit2, Cpu, Workflow } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { getToken } from '../lib/auth';

const BASE_URL = window.location.origin.replace('5173', '8000');

type OS = 'unix' | 'powershell' | 'cmd';
type AgentTab = 'claude' | 'agy' | 'codex' | 'sdk';

export const ConnectPage = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedOS, setSelectedOS] = useState<OS>('unix');
  const [activeTab, setActiveTab] = useState<AgentTab>('claude');
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

  const getSnippets = (agent: AgentTab, os: OS) => {
    if (agent === 'claude') {
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
    }

    if (agent === 'agy') {
      const install = 'pip install google-antigravity-sdk';
      if (os === 'unix') {
        return {
          install,
          env: `export OPENAI_API_BASE="${BASE_URL}/v1"\nexport OPENAI_API_KEY="${token}"\n\n# Launch Antigravity CLI workflow\nagy --model antigravity`,
        };
      }
      if (os === 'powershell') {
        return {
          install,
          env: `$env:OPENAI_API_BASE="${BASE_URL}/v1"\n$env:OPENAI_API_KEY="${token}"\n\n# Launch Antigravity CLI workflow\nagy --model antigravity`,
        };
      }
      return {
        install,
        env: `set OPENAI_API_BASE=${BASE_URL}/v1\nset OPENAI_API_KEY=${token}\n\n:: Launch Antigravity CLI workflow\nagy --model antigravity`,
      };
    }

    if (agent === 'codex') {
      const install = 'pip install aider-chat   # Or install Cursor IDE from cursor.com';
      if (os === 'unix') {
        return {
          install,
          env: `export OPENAI_BASE_URL="${BASE_URL}/v1"\nexport OPENAI_API_KEY="${token}"\n\n# Launch Aider with Driti Auto-Routing\naider --openai-api-base ${BASE_URL}/v1 --model gpt-4o`,
        };
      }
      if (os === 'powershell') {
        return {
          install,
          env: `$env:OPENAI_BASE_URL="${BASE_URL}/v1"\n$env:OPENAI_API_KEY="${token}"\n\n# Launch Aider with Driti Auto-Routing\naider --openai-api-base ${BASE_URL}/v1 --model gpt-4o`,
        };
      }
      return {
        install,
        env: `set OPENAI_BASE_URL=${BASE_URL}/v1\nset OPENAI_API_KEY=${token}\n\n:: Launch Aider with Driti Auto-Routing\naider --openai-api-base ${BASE_URL}/v1 --model gpt-4o`,
      };
    }

    // SDK
    const install = 'pip install openai anthropic httpx';
    const env = `# Python SDK Universal Connection Example
from openai import OpenAI
from anthropic import Anthropic

# 1. Connect via OpenAI client (Codex / AGY compatible)
client = OpenAI(base_url="${BASE_URL}/v1", api_key="${token}")
resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello Driti Gateway!"}]
)
print("OpenAI:", resp.choices[0].message.content)

# 2. Connect via Anthropic client (Claude Code compatible)
claude_client = Anthropic(base_url="${BASE_URL}", auth_token="${token}")
resp2 = claude_client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello via Anthropic SDK!"}]
)
print("Anthropic:", resp2.content[0].text)`;
    return { install, env };
  };

  const currentSnippet = getSnippets(activeTab, selectedOS);

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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-primary-foreground shadow-lg shadow-primary/20">
              <Terminal className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
              Agent Setup & Hub
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-medium px-2.5 py-0.5">
              Universal Protocol
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Connect any frontier AI coding assistant to Driti Gateway. We translate protocols on the fly, inject architectural reasoning boosters, and route requests to NVIDIA NIM frontier models.
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
                Pass this token as your <code className="text-primary font-mono bg-primary/10 px-1 py-0.5 rounded">API_KEY</code> or <code className="text-primary font-mono bg-primary/10 px-1 py-0.5 rounded">AUTH_TOKEN</code> in any tool below.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-background/80 border rounded-xl px-4 py-2 font-mono text-xs text-foreground max-w-md w-full md:w-auto justify-between overflow-hidden shadow-inner">
              <span className="truncate mr-2 select-all">{token}</span>
              <CopyBtn text={token} id="main-token" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Switcher Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { id: 'claude', name: 'Claude Code', desc: 'Anthropic Messages API', icon: Code2, color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400' },
          { id: 'agy', name: 'Google Antigravity', desc: 'AGY CLI & SDK Workflows', icon: Bot, color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400' },
          { id: 'codex', name: 'Codex / Aider / Cursor', desc: 'OpenAI Chat Completions', icon: Terminal, color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400' },
          { id: 'sdk', name: 'Python & Node SDKs', desc: 'LangChain & Custom Apps', icon: Cpu, color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AgentTab)}
              className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? `bg-gradient-to-br ${tab.color} shadow-lg ring-1 ring-white/20`
                  : 'bg-card/60 border-border/60 hover:bg-card hover:border-border opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {isActive && (
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground mb-0.5">{tab.name}</h4>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{tab.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + selectedOS}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-border/60 shadow-xl overflow-hidden bg-card/90">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    {activeTab === 'claude' && <><Code2 className="h-5 w-5 text-purple-400" /> Claude Code CLI Setup</>}
                    {activeTab === 'agy' && <><Bot className="h-5 w-5 text-blue-400" /> Google Antigravity (AGY) Setup</>}
                    {activeTab === 'codex' && <><Terminal className="h-5 w-5 text-emerald-400" /> OpenAI Codex / Aider / Cursor Setup</>}
                    {activeTab === 'sdk' && <><Cpu className="h-5 w-5 text-amber-400" /> Python & Node.js SDK Setup</>}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {activeTab === 'claude' && 'Translates Anthropic tool calls (Read, Edit, Write, Bash) into NVIDIA NIM function calling.'}
                    {activeTab === 'agy' && 'Integrates Antigravity autonomous agents with Driti Auto-Routing and reasoning scaffolding.'}
                    {activeTab === 'codex' && 'Full CRUD filesystem operations and diff editing with 0ms semantic caching support.'}
                    {activeTab === 'sdk' && 'Instantiate standard OpenAI or Anthropic SDK clients pointing directly to this gateway.'}
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
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">1</span>
                  Install the CLI / SDK
                </label>
                <div className="relative rounded-xl bg-black/60 border border-white/10 p-4 font-mono text-sm text-foreground flex items-center justify-between shadow-inner">
                  <code className="text-emerald-400 overflow-x-auto pr-4">{currentSnippet.install}</code>
                  <CopyBtn text={currentSnippet.install} id="install-cmd" />
                </div>
              </div>

              {/* Step 2: Configure & Connect */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">2</span>
                  Configure Environment & Run
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
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                  <Workflow className="h-4 w-4" />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-foreground">What happens when you run this?</p>
                  <p className="text-muted-foreground leading-relaxed">
                    All terminal execution, directory inspection (<code className="text-foreground">ls</code>, <code className="text-foreground">grep</code>), and file modifications (<code className="text-foreground">Write</code>, <code className="text-foreground">Edit</code>) sent by your agent are intercepted by Driti Gateway. We inject our architectural prompt scaffolding and stream the response directly from NVIDIA NIM with automatic self-healing failover protection.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};
