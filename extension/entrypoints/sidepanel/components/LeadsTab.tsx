import { useState } from 'react';
import { Filter, MessageSquare, ListChecks } from 'lucide-react';
import { updateLeadStatus } from '../../../src/lib/storage';
import { bulkUpdateStatus, bulkDeleteLeads, exportSelectedLeads } from '../../../src/lib/bulk-actions';
import { useBulkSelection } from '../../../src/hooks/useBulkSelection';
import type { Lead } from '../../../src/types';
import { LeadCard } from './LeadCard';
import { BulkActionToolbar } from './BulkActionToolbar';

type LeadFilter = 'all' | 'new' | 'contacted' | 'converted';

interface LeadsTabProps {
  leads: Lead[];
}

export function LeadsTab({ leads }: LeadsTabProps) {
  const [filter, setFilter] = useState<LeadFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredLeads = leads.filter((lead) => {
    if (filter === 'all') return true;
    return lead.status === filter;
  });

  const {
    selectedIds,
    selectedCount,
    isSelectionMode,
    allSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    enterSelectionMode,
    exitSelectionMode,
    isSelected,
  } = useBulkSelection(filteredLeads);

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

  const handleBulkMarkContacted = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    await bulkUpdateStatus(selectedIds, 'contacted');
    exitSelectionMode();
    setIsProcessing(false);
  };

  const handleBulkGenerateReplies = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    chrome.runtime.sendMessage({
      type: 'BULK_GENERATE_REPLIES',
      leadIds: selectedIds,
    });
    setIsProcessing(false);
  };

  const handleBulkExport = () => {
    if (selectedIds.length === 0) return;
    exportSelectedLeads(leads, selectedIds);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} leads? This cannot be undone.`)) return;
    setIsProcessing(true);
    await bulkDeleteLeads(selectedIds);
    exitSelectionMode();
    setIsProcessing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <LeadFilterBar leads={leads} filter={filter} setFilter={setFilter} />
        {!isSelectionMode && filteredLeads.length > 0 && (
          <button
            onClick={enterSelectionMode}
            className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground font-medium px-2 py-1 rounded hover:bg-card transition-colors"
          >
            <ListChecks className="w-4 h-4" />
            Select
          </button>
        )}
      </div>

      {isSelectionMode && (
        <BulkActionToolbar
          selectedCount={selectedCount}
          totalCount={filteredLeads.length}
          allSelected={allSelected}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onMarkContacted={handleBulkMarkContacted}
          onGenerateReplies={handleBulkGenerateReplies}
          onExport={handleBulkExport}
          onDelete={handleBulkDelete}
          onCancel={exitSelectionMode}
          isProcessing={isProcessing}
        />
      )}

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
              isSelectionMode={isSelectionMode}
              isSelected={isSelected(lead.id)}
              onToggleSelect={toggleSelection}
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
      <Filter className="w-4 h-4 text-foreground-muted" />
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value as LeadFilter)}
        className="text-sm border border-border rounded-lg px-2 py-1.5 bg-card text-foreground"
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
    <div className="text-center py-8 text-foreground-muted">
      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-foreground-muted" />
      <p className="text-foreground-secondary">No leads found</p>
      <p className="text-sm mt-1">Click "Scan This Page" on a Facebook group</p>
    </div>
  );
}
