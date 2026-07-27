import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Cpu, Code2, Activity, Scroll, Settings, LogOut, Radio, BarChart3, Network, GitBranch, Bot, Puzzle, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

export const Sidebar = () => {
  const { user, logout } = useAuth();

  const navSections = [
    {
      title: 'Monitor',
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/live', icon: Radio, label: 'Live', badge: 'live' },
        { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      ]
    },
    {
      title: 'Gateway',
      items: [
        { to: '/models', icon: Cpu, label: 'Models' },
        { to: '/providers', icon: Network, label: 'Providers' },
        { to: '/routing', icon: GitBranch, label: 'Router' },
        { to: '/mcp', icon: Puzzle, label: 'MCP' },
        { to: '/agents', icon: Bot, label: 'Agents' },
      ]
    },
    {
      title: 'Manage',
      items: [
        { to: '/users', icon: Users, label: 'Users' },
        { to: '/claude-code', icon: Code2, label: 'Claude Code' },
      ]
    },
    {
      title: 'System',
      items: [
        { to: '/health', icon: Activity, label: 'Health' },
        { to: '/logs', icon: Scroll, label: 'Logs' },
        { to: '/settings', icon: Settings, label: 'Settings' },
      ]
    }
  ];

  return (
    <div className="flex w-64 flex-col border-r bg-card/50 px-4 py-6 overflow-y-auto">
      <div className="flex items-center gap-3 px-2 mb-8 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          DG
        </div>
        <span className="text-lg font-semibold tracking-tight">Driti Gateway</span>
      </div>

      <nav className="flex-1 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section.title}
            </h4>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground',
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  {item.badge && (
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-border/50">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground font-medium">
            {user?.username.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">{user?.username}</span>
            <span className="text-xs text-muted-foreground mt-1">
              {user?.is_admin ? 'Admin' : 'User'}
            </span>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};
