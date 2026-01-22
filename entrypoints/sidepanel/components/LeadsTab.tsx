import { useState } from 'react';
import { Filter, MessageSquare } from 'lucide-react';
import { updateLeadStatus } from '../../../src/lib/storage';
import type { Lead } from '../../../src/types';
import { LeadCard } from './LeadCard';

type LeadFilter = 'all' | 'new' | 'contacted' | 'converted';

interface LeadsTabProps {
  leads: Lead[];
}

export function LeadsTab({ leads }: LeadsTabProps) {
  const [filter, setFilter] = useState<LeadFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredLeads = leads.filter((lead) => {
    if (filter === 'all') return true;
    return lead.status === filter;
  });

  const handleCopyReply = async (lead: Lead) => {
    if (lead.aiDraftReply) {
      await navigator.clipboard.writeText(lead.aiDraftReply);
      setCopiedId(lead.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleStatusChange = async (leadId: string, status: Lead['status']) => {
    await updateLeadStatus(leadId, status);
  };

  return (
    <div className="space-y-4">
      <LeadFilterBar leads={leads} filter={filter} setFilter={setFilter} />

      {filteredLeads.length === 0 ? (
        <EmptyLeadsState />
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              copiedId={copiedId}
              onCopyReply={handleCopyReply}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LeadFilterBarProps {
  leads: Lead[];
  filter: LeadFilter;
  setFilter: (f: LeadFilter) => void;
}

function LeadFilterBar({ leads, filter, setFilter }: LeadFilterBarProps) {
  const counts = {
    all: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    converted: leads.filter((l) => l.status === 'converted').length,
  };

  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-gray-400" />
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value as LeadFilter)}
        className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white"
      >
        <option value="all">All ({counts.all})</option>
        <option value="new">New ({counts.new})</option>
        <option value="contacted">Contacted ({counts.contacted})</option>
        <option value="converted">Converted ({counts.converted})</option>
      </select>
    </div>
  );
}

function EmptyLeadsState() {
  return (
    <div className="text-center py-8 text-gray-500">
      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p>No leads found</p>
      <p className="text-sm mt-1">Click "Scan This Page" on a Facebook group</p>
    </div>
  );
}
