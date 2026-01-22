import { useState, useEffect } from 'react';
import { leadsStorage } from '../../src/lib/storage';
import type { Lead } from '../../src/types';
import { Sparkles, X, ExternalLink, Copy, Check } from 'lucide-react';

export function LeadOverlay() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  useEffect(() => {
    const loadLeads = async () => {
      const storedLeads = await leadsStorage.getValue();
      setLeads(storedLeads.filter(l => l.status === 'new').slice(0, 10));
    };
    
    loadLeads();
    
    const unwatch = leadsStorage.watch((newLeads) => {
      if (newLeads) {
        setLeads(newLeads.filter(l => l.status === 'new').slice(0, 10));
      }
    });
    
    const handleNewLead = () => loadLeads();
    window.addEventListener('leadscout:newlead', handleNewLead);
    
    return () => {
      unwatch();
      window.removeEventListener('leadscout:newlead', handleNewLead);
    };
  }, []);
  
  const handleCopyReply = async (lead: Lead) => {
    if (lead.aiDraftReply) {
      await navigator.clipboard.writeText(lead.aiDraftReply);
      setCopiedId(lead.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };
  
  const handleDismiss = async (leadId: string) => {
    const allLeads = await leadsStorage.getValue();
    const updated = allLeads.map(l => 
      l.id === leadId ? { ...l, status: 'ignored' as const } : l
    );
    await leadsStorage.setValue(updated);
    setExpandedLeadId(null);
  };
  
  if (leads.length === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 max-w-sm">
      {leads.slice(0, 3).map((lead) => (
        <div
          key={lead.id}
          className={`leadscout-panel bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden transition-all duration-200 ${
            expandedLeadId === lead.id ? 'w-80' : 'w-64'
          }`}
        >
          <div 
            className="p-3 cursor-pointer hover:bg-gray-50"
            onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 truncate">
                  {lead.authorName}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  lead.leadScore >= 70 ? 'bg-success-50 text-success-600' :
                  lead.leadScore >= 50 ? 'bg-warning-50 text-warning-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {lead.leadScore}%
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDismiss(lead.id); }}
                  className="p-0.5 hover:bg-gray-200 rounded"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {lead.postText.slice(0, 100)}...
            </p>
          </div>
          
          {expandedLeadId === lead.id && (
            <div className="px-3 pb-3 border-t border-gray-100 pt-2 animate-fade-in">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs text-gray-500">Intent:</span>
                <span className="text-xs font-medium text-primary-600 capitalize">
                  {lead.intent.replace('_', ' ')}
                </span>
              </div>
              
              {lead.aiDraftReply && (
                <div className="mb-2">
                  <p className="text-xs text-gray-600 bg-gray-50 rounded p-2 mb-2">
                    {lead.aiDraftReply}
                  </p>
                  <button
                    onClick={() => handleCopyReply(lead)}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                  >
                    {copiedId === lead.id ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy reply
                      </>
                    )}
                  </button>
                </div>
              )}
              
              <a
                href={lead.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Open post
              </a>
            </div>
          )}
        </div>
      ))}
      
      {leads.length > 3 && (
        <button
          onClick={() => browser.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' })}
          className="leadscout-badge bg-primary-500 text-white text-xs px-3 py-1.5 rounded-full shadow hover:bg-primary-600 transition-colors"
        >
          +{leads.length - 3} more leads
        </button>
      )}
    </div>
  );
}
