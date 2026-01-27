import { ExternalLink, Play, Pause, Trash2 } from 'lucide-react';
import { removeWatchedGroup, updateWatchedGroup } from '../../../src/lib/storage';
import { formatDate } from '../../../src/utils/formatters';
import type { WatchedGroup } from '../../../src/types';

interface GroupCardProps {
  group: WatchedGroup;
}

export function GroupCard({ group }: GroupCardProps) {
  const handleVisitGroup = async () => {
    await browser.runtime.sendMessage({ type: 'OPEN_GROUP', url: group.url, groupId: group.id });
  };

  const handleToggleGroup = async () => {
    await updateWatchedGroup(group.id, { isActive: !group.isActive });
  };

  const handleRemoveGroup = async () => {
    await removeWatchedGroup(group.id);
  };

  return (
    <div className={`bg-card rounded-xl border p-3 ${group.isActive ? 'border-border' : 'border-border-subtle opacity-60'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{group.name}</h4>
          <p className="text-xs text-foreground-muted mt-0.5">{group.category}</p>
          <p className="text-xs text-foreground-muted mt-1">
            {group.leadsFound} leads • Last visited {group.lastVisited ? formatDate(group.lastVisited) : 'Never'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleVisitGroup} className="p-1.5 text-foreground-secondary hover:bg-card-elevated rounded" title="Visit group">
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleGroup}
            className={`p-1.5 rounded ${group.isActive ? 'text-foreground-secondary hover:bg-card-elevated' : 'text-foreground-muted hover:bg-card-elevated'}`}
            title={group.isActive ? 'Pause' : 'Activate'}
          >
            {group.isActive ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button onClick={handleRemoveGroup} className="p-1.5 text-foreground-muted hover:text-foreground-secondary hover:bg-card-elevated rounded" title="Remove">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
