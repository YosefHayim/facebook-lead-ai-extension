import { MessageCircle, Sparkles, Download, Trash2, X, CheckSquare } from 'lucide-react';

interface BulkActionToolbarProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onMarkContacted: () => void;
  onGenerateReplies: () => void;
  onExport: () => void;
  onDelete: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function BulkActionToolbar({
  selectedCount,
  totalCount,
  allSelected,
  onSelectAll,
  onDeselectAll,
  onMarkContacted,
  onGenerateReplies,
  onExport,
  onDelete,
  onCancel,
  isProcessing = false,
}: BulkActionToolbarProps) {
  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1 text-foreground-muted hover:text-foreground hover:bg-card-elevated rounded"
            title="Cancel selection"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-foreground">
            {selectedCount} selected
          </span>
        </div>
        <button
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-foreground font-medium"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          {allSelected ? 'Deselect All' : `Select All (${totalCount})`}
        </button>
      </div>

      <div className="flex items-center gap-1 p-2">
        <ActionButton
          icon={MessageCircle}
          label="Contacted"
          onClick={onMarkContacted}
          disabled={selectedCount === 0 || isProcessing}
          variant="default"
        />
        <ActionButton
          icon={Sparkles}
          label="AI Replies"
          onClick={onGenerateReplies}
          disabled={selectedCount === 0 || isProcessing}
          variant="default"
        />
        <ActionButton
          icon={Download}
          label="Export"
          onClick={onExport}
          disabled={selectedCount === 0 || isProcessing}
          variant="default"
        />
        <ActionButton
          icon={Trash2}
          label="Delete"
          onClick={onDelete}
          disabled={selectedCount === 0 || isProcessing}
          variant="destructive"
        />
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled: boolean;
  variant: 'default' | 'destructive';
}

const variantStyles = {
  default: 'bg-card-elevated text-foreground-secondary hover:bg-zinc-600 hover:text-foreground disabled:bg-card disabled:text-foreground-muted',
  destructive: 'bg-card-elevated text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:bg-card disabled:text-foreground-muted',
};

function ActionButton({ icon: Icon, label, onClick, disabled, variant }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${variantStyles[variant]}`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
