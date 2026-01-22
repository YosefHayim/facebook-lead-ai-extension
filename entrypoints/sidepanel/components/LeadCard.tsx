import { useState } from 'react';
import { Send, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { updateLeadStatus, updateLeadResponse, updateLeadFeedback } from '../../../src/lib/storage';
import type { Lead, LeadFeedback } from '../../../src/types';
import { formatDate } from '../../../src/utils/formatters';
import { LeadCardExpanded } from './LeadCardExpanded';

interface LeadCardProps {
  lead: Lead;
  copiedId: string | null;
  onCopyReply: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: Lead['status']) => void;
}

export function LeadCard({ lead, copiedId, onCopyReply, onStatusChange }: LeadCardProps) {
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(!expanded)}>
        <LeadCardHeader lead={lead} />
        <p className="text-sm text-gray-600 line-clamp-2">{lead.postText}</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
          <span className="capitalize">{lead.intent.replace('_', ' ')}</span>
          <span>-</span>
          <span>{formatDate(lead.createdAt)}</span>
        </div>
      </div>
      {expanded && (
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
          <span className="font-medium text-gray-900 truncate">{lead.authorName}</span>
          <LeadScoreBadge score={lead.leadScore} />
          {lead.responseTracking?.responded && <Send className="w-3 h-3 text-blue-500" title="Responded" />}
          {lead.responseTracking?.gotReply && <MessageCircle className="w-3 h-3 text-green-500" title="Got reply" />}
          <FeedbackIcon feedback={lead.feedback} />
        </div>
        {lead.groupName && <p className="text-xs text-gray-500 mt-0.5">{lead.groupName}</p>}
      </div>
      <StatusBadge status={lead.status} />
    </div>
  );
}

function LeadScoreBadge({ score }: { score: number }) {
  const colorClass = score >= 70 ? 'bg-green-50 text-green-600' : score >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600';
  return <span className={`text-xs px-1.5 py-0.5 rounded-full ${colorClass}`}>{score}%</span>;
}

function StatusBadge({ status }: { status: Lead['status'] }) {
  const colorClass = status === 'new' ? 'bg-blue-50 text-blue-600' : status === 'contacted' ? 'bg-amber-50 text-amber-600' : status === 'converted' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600';
  return <span className={`text-xs px-2 py-1 rounded-full ${colorClass}`}>{status}</span>;
}

function FeedbackIcon({ feedback }: { feedback?: LeadFeedback }) {
  if (!feedback) return null;
  if (feedback.quality === 'good') return <ThumbsUp className="w-3 h-3 text-green-500" />;
  if (feedback.quality === 'bad') return <ThumbsDown className="w-3 h-3 text-red-500" />;
  return null;
}
