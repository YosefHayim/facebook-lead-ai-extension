import { useState } from 'react';
import { ExternalLink, Copy, Check, Trash2, ThumbsUp, ThumbsDown, MessageCircle, Send, User, Briefcase, MapPin, GraduationCap, Loader2 } from 'lucide-react';
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
    <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
      <LCISection lead={lead} />
      {lead.aiAnalysis && (
        <div className="bg-card-elevated rounded-lg p-3">
          <p className="text-xs text-foreground-muted mb-1">AI Analysis</p>
          <p className="text-sm text-foreground-secondary">{lead.aiAnalysis.reasoning}</p>
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
    <div className="bg-card-elevated rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-foreground-muted">Suggested Reply</p>
        <button
          onClick={(e) => { e.stopPropagation(); onCopyReply(lead); }}
          className="flex items-center gap-1 text-xs text-foreground-secondary hover:text-foreground"
        >
          {copiedId === lead.id ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <p className="text-sm text-foreground-secondary">{lead.aiDraftReply}</p>
    </div>
  );
}

function ResponseTrackingSection({ lead, onMarkResponded, onMarkGotReply }: { lead: Lead; onMarkResponded: (e: React.MouseEvent) => void; onMarkGotReply: (e: React.MouseEvent) => void }) {
  return (
    <div className="flex items-center gap-2 py-2 border-t border-border">
      <span className="text-xs text-foreground-muted">Track:</span>
      {!lead.responseTracking?.responded ? (
        <button onClick={onMarkResponded} className="flex items-center gap-1 text-xs px-2 py-1 bg-card-elevated text-foreground-secondary rounded-lg hover:bg-zinc-600 hover:text-foreground">
          <Send className="w-3 h-3" /> I Responded
        </button>
      ) : !lead.responseTracking?.gotReply ? (
        <button onClick={onMarkGotReply} className="flex items-center gap-1 text-xs px-2 py-1 bg-card-elevated text-foreground-secondary rounded-lg hover:bg-zinc-600 hover:text-foreground">
          <MessageCircle className="w-3 h-3" /> Got Reply
        </button>
      ) : (
        <span className="text-xs text-foreground-secondary flex items-center gap-1"><Check className="w-3 h-3" /> Conversation started</span>
      )}
    </div>
  );
}

function FeedbackSection({ lead, onFeedback }: { lead: Lead; onFeedback: (e: React.MouseEvent, quality: LeadFeedback['quality']) => void }) {
  return (
    <div className="flex items-center gap-2 py-2 border-t border-border">
      <span className="text-xs text-foreground-muted">Lead quality:</span>
      <button
        onClick={(e) => onFeedback(e, 'good')}
        className={`p-1.5 rounded-lg ${lead.feedback?.quality === 'good' ? 'bg-zinc-600 text-foreground' : 'text-foreground-muted hover:bg-card-elevated hover:text-foreground-secondary'}`}
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => onFeedback(e, 'bad')}
        className={`p-1.5 rounded-lg ${lead.feedback?.quality === 'bad' ? 'bg-zinc-600 text-foreground' : 'text-foreground-muted hover:bg-card-elevated hover:text-foreground-secondary'}`}
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
}

function LeadCardActions({ lead, onStatusChange }: { lead: Lead; onStatusChange: (leadId: string, status: Lead['status']) => void }) {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-border">
      <div className="flex gap-2">
        {lead.status === 'new' && (
          <button onClick={(e) => { e.stopPropagation(); onStatusChange(lead.id, 'contacted'); }} className="text-xs px-3 py-1.5 bg-foreground text-background rounded-lg font-medium hover:bg-accent-hover">
            Mark Contacted
          </button>
        )}
        {lead.status === 'contacted' && (
          <button onClick={(e) => { e.stopPropagation(); onStatusChange(lead.id, 'converted'); }} className="text-xs px-3 py-1.5 bg-foreground text-background rounded-lg font-medium hover:bg-accent-hover">
            Mark Converted
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <a href={lead.postUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-xs text-foreground-secondary hover:text-foreground hover:underline">
          <ExternalLink className="w-3 h-3" /> View Post
        </a>
        <button onClick={(e) => { e.stopPropagation(); onStatusChange(lead.id, 'ignored'); }} className="p-1 text-foreground-muted hover:text-red-400">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function LCISection({ lead }: { lead: Lead }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchLCI = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    setError(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_LEAD_LCI',
        leadId: lead.id,
      });

      if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to fetch profile data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!lead.lci && !isLoading) {
    return (
      <div className="bg-card-elevated rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-foreground-secondary" />
            <span className="text-xs text-foreground-secondary font-medium">Lead Context Intelligence</span>
          </div>
          <button
            onClick={handleFetchLCI}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 bg-foreground text-background rounded-lg font-medium hover:bg-accent-hover disabled:opacity-50"
          >
            Fetch Profile
          </button>
        </div>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card-elevated rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-foreground-secondary animate-spin" />
          <span className="text-xs text-foreground-secondary">Fetching profile data...</span>
        </div>
      </div>
    );
  }

  if (!lead.lci) return null;

  const { lci } = lead;

  return (
    <div className="bg-card-elevated rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-foreground-secondary" />
          <span className="text-xs text-foreground-secondary font-medium">Lead Context Intelligence</span>
        </div>
        <span className="text-xs text-foreground-muted">{lci.confidenceScore}% confidence</span>
      </div>

      <div className="space-y-1.5">
        {lci.workplace && (
          <div className="flex items-center gap-2 text-xs text-foreground-secondary">
            <Briefcase className="w-3 h-3 text-foreground-muted" />
            <span>{lci.workplace}</span>
          </div>
        )}
        {lci.location && (
          <div className="flex items-center gap-2 text-xs text-foreground-secondary">
            <MapPin className="w-3 h-3 text-foreground-muted" />
            <span>{lci.location}</span>
          </div>
        )}
        {lci.education && (
          <div className="flex items-center gap-2 text-xs text-foreground-secondary">
            <GraduationCap className="w-3 h-3 text-foreground-muted" />
            <span>{lci.education}</span>
          </div>
        )}
        {lci.profileBio && (
          <p className="text-xs text-foreground-muted mt-2 italic">"{lci.profileBio}"</p>
        )}
      </div>

      <p className="text-xs text-foreground-muted mt-2">
        Fetched {new Date(lci.fetchedAt).toLocaleDateString()}
      </p>
    </div>
  );
}
