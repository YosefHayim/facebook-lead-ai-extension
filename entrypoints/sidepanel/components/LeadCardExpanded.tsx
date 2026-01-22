import { ExternalLink, Copy, Check, Trash2, ThumbsUp, ThumbsDown, MessageCircle, Send } from 'lucide-react';
import type { Lead, LeadFeedback } from '../../../src/types';

interface LeadCardExpandedProps {
  lead: Lead;
  copiedId: string | null;
  onCopyReply: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: Lead['status']) => void;
  onMarkResponded: (e: React.MouseEvent) => void;
  onMarkGotReply: (e: React.MouseEvent) => void;
  onFeedback: (e: React.MouseEvent, quality: LeadFeedback['quality']) => void;
}

export function LeadCardExpanded({
  lead, copiedId, onCopyReply, onStatusChange, onMarkResponded, onMarkGotReply, onFeedback,
}: LeadCardExpandedProps) {
  return (
    <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
      {lead.aiAnalysis && (
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs text-gray-500 mb-1">AI Analysis</p>
          <p className="text-sm text-gray-700">{lead.aiAnalysis.reasoning}</p>
        </div>
      )}
      {lead.aiDraftReply && (
        <SuggestedReplySection lead={lead} copiedId={copiedId} onCopyReply={onCopyReply} />
      )}
      <ResponseTrackingSection lead={lead} onMarkResponded={onMarkResponded} onMarkGotReply={onMarkGotReply} />
      <FeedbackSection lead={lead} onFeedback={onFeedback} />
      <LeadCardActions lead={lead} onStatusChange={onStatusChange} />
    </div>
  );
}

function SuggestedReplySection({ lead, copiedId, onCopyReply }: { lead: Lead; copiedId: string | null; onCopyReply: (lead: Lead) => void }) {
  return (
    <div className="bg-blue-50 rounded-md p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-blue-600">Suggested Reply</p>
        <button
          onClick={(e) => { e.stopPropagation(); onCopyReply(lead); }}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
        >
          {copiedId === lead.id ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <p className="text-sm text-gray-700">{lead.aiDraftReply}</p>
    </div>
  );
}

function ResponseTrackingSection({ lead, onMarkResponded, onMarkGotReply }: { lead: Lead; onMarkResponded: (e: React.MouseEvent) => void; onMarkGotReply: (e: React.MouseEvent) => void }) {
  return (
    <div className="flex items-center gap-2 py-2 border-t border-gray-100">
      <span className="text-xs text-gray-500">Track:</span>
      {!lead.responseTracking?.responded ? (
        <button onClick={onMarkResponded} className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
          <Send className="w-3 h-3" /> I Responded
        </button>
      ) : !lead.responseTracking?.gotReply ? (
        <button onClick={onMarkGotReply} className="flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100">
          <MessageCircle className="w-3 h-3" /> Got Reply
        </button>
      ) : (
        <span className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Conversation started</span>
      )}
    </div>
  );
}

function FeedbackSection({ lead, onFeedback }: { lead: Lead; onFeedback: (e: React.MouseEvent, quality: LeadFeedback['quality']) => void }) {
  return (
    <div className="flex items-center gap-2 py-2 border-t border-gray-100">
      <span className="text-xs text-gray-500">Lead quality:</span>
      <button
        onClick={(e) => onFeedback(e, 'good')}
        className={`p-1.5 rounded ${lead.feedback?.quality === 'good' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-green-50 hover:text-green-500'}`}
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => onFeedback(e, 'bad')}
        className={`p-1.5 rounded ${lead.feedback?.quality === 'bad' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
}

function LeadCardActions({ lead, onStatusChange }: { lead: Lead; onStatusChange: (leadId: string, status: Lead['status']) => void }) {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
      <div className="flex gap-2">
        {lead.status === 'new' && (
          <button onClick={(e) => { e.stopPropagation(); onStatusChange(lead.id, 'contacted'); }} className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
            Mark Contacted
          </button>
        )}
        {lead.status === 'contacted' && (
          <button onClick={(e) => { e.stopPropagation(); onStatusChange(lead.id, 'converted'); }} className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">
            Mark Converted
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <a href={lead.postUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
          <ExternalLink className="w-3 h-3" /> View Post
        </a>
        <button onClick={(e) => { e.stopPropagation(); onStatusChange(lead.id, 'ignored'); }} className="p-1 text-gray-400 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
