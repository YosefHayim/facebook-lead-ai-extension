import { useState } from 'react';
import { Users, Plus, Search, ExternalLink } from 'lucide-react';
import { addWatchedGroup } from '../../../src/lib/storage';
import { extractFacebookGroupId, generateFacebookSearchUrl } from '../../../src/utils/formatters';
import { GroupCard } from './GroupCard';
import type { WatchedGroup } from '../../../src/types';

interface GroupsTabProps {
  groups: WatchedGroup[];
}

export function GroupsTab({ groups }: GroupsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupForSearch, setSelectedGroupForSearch] = useState<string | null>(null);
  const [newGroupUrl, setNewGroupUrl] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('general');

  const handleAddGroup = async () => {
    if (!newGroupUrl || !newGroupName) return;
    await addWatchedGroup({ name: newGroupName, url: newGroupUrl, category: newGroupCategory, isActive: true });
    setNewGroupUrl('');
    setNewGroupName('');
    setNewGroupCategory('general');
  };

  const handleSearchInGroup = (group: WatchedGroup) => {
    if (!searchQuery.trim()) return;
    const groupId = extractFacebookGroupId(group.url);
    if (!groupId) return;
    window.open(generateFacebookSearchUrl(groupId, searchQuery), '_blank');
  };

  const handleQuickSearch = (group: WatchedGroup, query: string) => {
    const groupId = extractFacebookGroupId(group.url);
    if (!groupId) return;
    window.open(generateFacebookSearchUrl(groupId, query), '_blank');
  };

  return (
    <div className="space-y-4">
      {groups.length > 0 && (
        <GroupSearchSection
          groups={groups}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedGroupForSearch={selectedGroupForSearch}
          setSelectedGroupForSearch={setSelectedGroupForSearch}
          onSearchInGroup={handleSearchInGroup}
          onQuickSearch={handleQuickSearch}
        />
      )}

      <AddGroupForm
        newGroupUrl={newGroupUrl}
        setNewGroupUrl={setNewGroupUrl}
        newGroupName={newGroupName}
        setNewGroupName={setNewGroupName}
        newGroupCategory={newGroupCategory}
        setNewGroupCategory={setNewGroupCategory}
        onAddGroup={handleAddGroup}
      />

      {groups.length === 0 ? (
        <EmptyGroupsState />
      ) : (
        <GroupsList groups={groups} />
      )}
    </div>
  );
}

interface GroupSearchSectionProps {
  groups: WatchedGroup[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedGroupForSearch: string | null;
  setSelectedGroupForSearch: (id: string | null) => void;
  onSearchInGroup: (group: WatchedGroup) => void;
  onQuickSearch: (group: WatchedGroup, query: string) => void;
}

function GroupSearchSection({
  groups,
  searchQuery,
  setSearchQuery,
  selectedGroupForSearch,
  setSelectedGroupForSearch,
  onSearchInGroup,
  onQuickSearch,
}: GroupSearchSectionProps) {
  const selectedGroup = groups.find((g) => g.id === selectedGroupForSearch);
  const quickSearchTerms = ['need help', 'looking for', 'recommendations', 'any suggestions', 'who can'];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
        <Search className="w-4 h-4" />
        Search in Groups
      </h3>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords (e.g., 'need help with website')"
            className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && selectedGroup) onSearchInGroup(selectedGroup);
            }}
          />
          <select
            value={selectedGroupForSearch || ''}
            onChange={(e) => setSelectedGroupForSearch(e.target.value || null)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white min-w-[140px]"
          >
            <option value="">Select group</option>
            {groups.filter((g) => g.isActive).map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => selectedGroup && onSearchInGroup(selectedGroup)}
          disabled={!searchQuery.trim() || !selectedGroupForSearch}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 text-white text-sm rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ExternalLink className="w-4 h-4" />
          Search in Facebook Group
        </button>
        <p className="text-xs text-gray-500">
          Opens Facebook's native search. Click "Scan This Page" on search results to find leads.
        </p>
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500 mb-2">Quick searches:</p>
          <div className="flex flex-wrap gap-1.5">
            {quickSearchTerms.map((q) => (
              <button
                key={q}
                onClick={() => {
                  if (selectedGroup) {
                    onQuickSearch(selectedGroup, q);
                  } else {
                    setSearchQuery(q);
                  }
                }}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AddGroupFormProps {
  newGroupUrl: string;
  setNewGroupUrl: (url: string) => void;
  newGroupName: string;
  setNewGroupName: (name: string) => void;
  newGroupCategory: string;
  setNewGroupCategory: (cat: string) => void;
  onAddGroup: () => void;
}

function AddGroupForm({
  newGroupUrl, setNewGroupUrl, newGroupName, setNewGroupName, newGroupCategory, setNewGroupCategory, onAddGroup,
}: AddGroupFormProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-medium text-gray-900 mb-3">Add Group</h3>
      <div className="space-y-3">
        <input
          type="text"
          value={newGroupUrl}
          onChange={(e) => setNewGroupUrl(e.target.value)}
          placeholder="Facebook group URL"
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name"
            className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm"
          />
          <select
            value={newGroupCategory}
            onChange={(e) => setNewGroupCategory(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="general">General</option>
            <option value="marketing">Marketing</option>
            <option value="tech">Tech</option>
            <option value="business">Business</option>
            <option value="freelance">Freelance</option>
          </select>
        </div>
        <button
          onClick={onAddGroup}
          disabled={!newGroupUrl || !newGroupName}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add Group
        </button>
      </div>
    </div>
  );
}

function EmptyGroupsState() {
  return (
    <div className="text-center py-8 text-gray-500">
      <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
      <p>No groups added</p>
      <p className="text-sm mt-1">Add Facebook groups to track</p>
    </div>
  );
}

function GroupsList({ groups }: { groups: WatchedGroup[] }) {
  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}
