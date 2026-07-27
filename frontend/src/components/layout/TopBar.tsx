import { useLocation } from 'react-router-dom';

export const TopBar = () => {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/models': return 'Models';
      case '/providers': return 'Providers';
      case '/mcp': return 'MCP Servers';
      case '/routing': return 'Router';
      case '/users': return 'Users';
      case '/analytics': return 'Analytics';
      case '/live': return 'Live Requests';
      case '/agents': return 'Agent Profiles';
      case '/claude-code': return 'Claude Code Integration';
      case '/health': return 'System Health';
      case '/logs': return 'Request Logs';
      case '/settings': return 'Settings';
      default: return '';
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
      
      <button 
        onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
        className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <span>Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
    </header>
  );
};
