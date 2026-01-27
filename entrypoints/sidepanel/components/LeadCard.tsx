import { useState } from 'react';
import { Send, MessageCircle, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { updateLeadStatus, updateLeadResponse, updateLeadFeedback } from '../../../src/lib/storage';
import type { Lead, LeadFeedback } from '../../../src/types';
import { formatDate } from '../../../src/utils/formatters';
import { LeadCardExpanded } from './LeadCardExpanded';

interface LeadCardProps {
  lead: Lead;
  copiedId: string | null;
  onCopyReply: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: Lead['status']) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function LeadCard({ 
  lead, 
  copiedId, 
  onCopyReply, 
  onStatusChange,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}: LeadCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleMarkResponded = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await updateLeadResponse(lead.id, { responded: true, respondedAt: Date.now() });
    await updateLeadStatus(lead.id, 'contacted');
  };

  const handleMarkGotReply = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await updateLeadResponse(lead.id, { gotReply: true, repliedAt: Date.now() });
  };

  const handleFeedback = async (e: React.MouseEvent, quality: LeadFeedback['quality']) => {
    e.stopPropagation();
    await updateLeadFeedback(lead.id, { quality, givenAt: Date.now() });
  };

  const handleClick = () => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect(lead.id);
    } else {
      setExpanded(!expanded);
    }
  };

  const borderClass = isSelected 
    ? 'border-foreground ring-2 ring-card-elevated' 
    : 'border-border';

  return (
    <div className={`bg-card rounded-xl border overflow-hidden ${borderClass}`}>
      <div className="p-4 cursor-pointer hover:bg-card-elevated flex gap-3" onClick={handleClick}>
        {isSelectionMode && (
          <div className="flex items-start pt-1">
            <div 
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                isSelected 
                  ? 'bg-foreground border-foreground' 
                  : 'border-foreground-muted hover:border-foreground-secondary'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-background" />}
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <LeadCardHeader lead={lead} />
          <p className="text-sm text-foreground-secondary line-clamp-2">{lead.postText}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-foreground-muted">
            <span className="capitalize">{lead.intent.replace('_', ' ')}</span>
            <span>-</span>
            <span>{formatDate(lead.createdAt)}</span>
          </div>
        </div>
      </div>
      {expanded && !isSelectionMode && (
        <LeadCardExpanded
          lead={lead}
          copiedId={copiedId}
          onCopyReply={onCopyReply}
          onStatusChange={onStatusChange}
          onMarkResponded={handleMarkResponded}
          onMarkGotReply={handleMarkGotReply}
          onFeedback={handleFeedback}
        />
      )}
    </div>
  );
}

function LeadCardHeader({ lead }: { lead: Lead }) {
  return (
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">{lead.authorName}</span>
          <LeadScoreBadge score={lead.leadScore} />
          {lead.responseTracking?.responded && <span title="Responded"><Send className="w-3 h-3 text-foreground-secondary" /></span>}
          {lead.responseTracking?.gotReply && <span title="Got reply"><MessageCircle className="w-3 h-3 text-foreground-secondary" /></span>}
          <FeedbackIcon feedback={lead.feedback} />
        </div>
        {lead.groupName && <p className="text-xs text-foreground-muted mt-0.5">{lead.groupName}</p>}
      </div>
      <StatusBadge status={lead.status} />
    </div>
  );
}

function LeadScoreBadge({ score }: { score: number }) {
  return <span className="text-xs px-1.5 py-0.5 rounded-full bg-card-elevated text-foreground-secondary">{score}%</span>;
}

function StatusBadge({ status }: { status: Lead['status'] }) {
  return <span className="text-xs px-2 py-1 rounded-full bg-card-elevated text-foreground-secondary uppercase">{status}</span>;
}

function FeedbackIcon({ feedback }: { feedback?: LeadFeedback }) {
  if (!feedback) return null;
  if (feedback.quality === 'good') return <ThumbsUp className="w-3 h-3 text-foreground-secondary" />;
  if (feedback.quality === 'bad') return <ThumbsDown className="w-3 h-3 text-foreground-secondary" />;
  return null;
}
