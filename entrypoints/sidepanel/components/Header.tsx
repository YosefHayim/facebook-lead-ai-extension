import { Sparkles, Pause } from 'lucide-react';
import type { SessionLimits, UsageData } from '../../../src/types';

interface HeaderProps {
  sessionLimits: SessionLimits | null;
  usage: UsageData | null;
}

export function Header({ sessionLimits, usage }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <h1 className="font-semibold text-gray-900">LeadScout AI</h1>
        </div>
        <div className="flex items-center gap-3">
          {sessionLimits?.isPaused && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <Pause className="w-3 h-3" />
              Paused
            </span>
          )}
          {usage && (
            <span className="text-xs text-gray-500">{usage.leadsFoundToday} today</span>
          )}
        </div>
      </div>
    </header>
  );
}
