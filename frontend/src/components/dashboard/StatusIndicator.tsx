import { cn } from '../../lib/utils';

interface StatusIndicatorProps {
  status: 'online' | 'degraded' | 'offline' | 'connected' | 'disconnected';
  className?: string;
}

export const StatusIndicator = ({ status, className }: StatusIndicatorProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
      case 'connected':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'offline':
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-muted';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online': return 'Online';
      case 'connected': return 'Connected';
      case 'degraded': return 'Degraded';
      case 'offline': return 'Offline';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-3 w-3">
        {(status === 'online' || status === 'connected') && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        )}
        <span className={cn("relative inline-flex rounded-full h-3 w-3", getStatusColor())}></span>
      </div>
      <span className="text-sm font-medium capitalize">{getStatusText()}</span>
    </div>
  );
};
