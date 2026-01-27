import { Zap, Pause, Settings } from 'lucide-react';
import type { SessionLimits, UsageData } from '../../../src/types';

interface HeaderProps {
  sessionLimits: SessionLimits | null;
  usage: UsageData | null;
}

export function Header({ sessionLimits, usage }: HeaderProps) {
  return (
    <header className="bg-background-secondary border-b border-border px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <h1 className="font-semibold text-foreground">LeadScout AI</h1>
      </div>
      <div className="flex items-center gap-3">
        {sessionLimits?.isPaused && (
          <span className="text-xs text-foreground-secondary flex items-center gap-1">
            <Pause className="w-3 h-3" />
            Paused
          </span>
        )}
        {usage && (
          <span className="px-2 py-1 rounded-full bg-card text-xs text-foreground-secondary">
            {usage.leadsFoundToday} today
          </span>
        )}
        <button className="text-foreground-muted hover:text-foreground-secondary transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
