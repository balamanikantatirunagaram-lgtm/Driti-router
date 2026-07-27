import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Terminal, Code2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { getToken } from '../lib/auth';

const BASE_URL = 'http://localhost:8000';

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

export const ClaudeCodePage = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const token = getToken() || '';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      // fallback for non-https
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

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 rounded-md border border-white/10 transition-all shrink-0"
    >
      {copiedKey === id ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copiedKey === id ? 'Copied!' : 'Copy'}
    </button>
  );

  const shellSnippet = `export ANTHROPIC_BASE_URL="${BASE_URL}"\nexport ANTHROPIC_AUTH_TOKEN="${token}"`;

  return (
    <motion.div className="max-w-3xl space-y-6" variants={pageVariants} initial="initial" animate="animate">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <Code2 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Claude Code Integration</h1>
        </div>
        <p className="text-muted-foreground">
          Set these environment variables to route Claude Code through Driti Gateway to NVIDIA's models.
          Your auth token acts as the <code className="text-xs bg-muted px-1 py-0.5 rounded">ANTHROPIC_AUTH_TOKEN</code>.
        </p>
      </div>

      {/* Env var cards */}
      <motion.div className="grid gap-4" variants={stagger}>
        <motion.div variants={cardVariant}>
          <Card className="group hover:border-border/80 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-sm text-muted-foreground tracking-wider">ANTHROPIC_BASE_URL</CardTitle>
              <CardDescription>Gateway endpoint — where Claude Code sends all requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between bg-black/40 px-4 py-3 rounded-lg border border-white/5">
                <code className="text-primary font-mono text-sm">{BASE_URL}</code>
                <CopyButton text={BASE_URL} id="base_url" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariant}>
          <Card className="group hover:border-border/80 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="font-mono text-sm text-muted-foreground tracking-wider">ANTHROPIC_AUTH_TOKEN</CardTitle>
              <CardDescription>Your current JWT session token — regenerated each login</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between bg-black/40 px-4 py-3 rounded-lg border border-white/5 gap-4">
                <code className="text-primary font-mono text-xs break-all leading-relaxed">
                  {token.length > 60 ? `${token.substring(0, 60)}…` : token || '(not logged in)'}
                </code>
                <CopyButton text={token} id="token" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Shell snippet */}
      <motion.div variants={cardVariant} initial="initial" animate="animate">
        <Card className="bg-card/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Shell Export</CardTitle>
              </div>
              <CopyButton text={shellSnippet} id="snippet" />
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-sm font-mono bg-black/40 p-4 rounded-lg border border-white/5 overflow-x-auto">
              <span className="text-pink-400">export </span>
              <span className="text-foreground">ANTHROPIC_BASE_URL=</span>
              <span className="text-green-400">"{BASE_URL}"</span>
              {'\n'}
              <span className="text-pink-400">export </span>
              <span className="text-foreground">ANTHROPIC_AUTH_TOKEN=</span>
              <span className="text-green-400">"{token}"</span>
            </pre>
          </CardContent>
        </Card>
      </motion.div>

      {/* Steps */}
      <motion.div variants={cardVariant} initial="initial" animate="animate">
        <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Setup Steps</h3>
        <div className="space-y-3">
          {[
            'Copy the environment variables above.',
            'Paste them into your shell profile (.zshrc, .bashrc) or project .env file.',
            'Claude Code will automatically route all requests through Driti Gateway.',
            'Your requests will be forwarded to NVIDIA\'s NIM API using the configured default model.',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                {i + 1}
              </div>
              <p className="text-sm text-muted-foreground pt-0.5">{step}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
