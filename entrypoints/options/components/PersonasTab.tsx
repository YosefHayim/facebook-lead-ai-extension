import { Plus, Trash2 } from 'lucide-react';
import { personasStorage, activePersonaIdStorage } from '../../../src/lib/storage';
import type { Persona } from '../../../src/types';

interface PersonasTabProps {
  personas: Persona[];
  activePersonaId: string;
  setPersonas: (personas: Persona[]) => void;
  setActivePersonaId: (id: string) => void;
}

export function PersonasTab({ personas, activePersonaId, setPersonas, setActivePersonaId }: PersonasTabProps) {
  const handleAddPersona = async () => {
    const newPersona: Persona = {
      id: `persona_${Date.now()}`,
      name: 'New Persona',
      role: 'Professional',
      keywords: ['looking for', 'need help'],
      negativeKeywords: [],
      aiTone: 'professional',
      valueProposition: '',
      isActive: false,
      createdAt: Date.now(),
    };
    const updated = [...personas, newPersona];
    await personasStorage.setValue(updated);
    setPersonas(updated);
  };

  const handleDeletePersona = async (id: string) => {
    if (id === 'default') return;
    const updated = personas.filter((p) => p.id !== id);
    await personasStorage.setValue(updated);
    setPersonas(updated);
    if (activePersonaId === id) {
      await activePersonaIdStorage.setValue('default');
      setActivePersonaId('default');
    }
  };

  const handlePersonaChange = async (id: string, changes: Partial<Persona>) => {
    const updated = personas.map((p) => (p.id === id ? { ...p, ...changes } : p));
    await personasStorage.setValue(updated);
    setPersonas(updated);
  };

  const handleSetActivePersona = async (id: string) => {
    await activePersonaIdStorage.setValue(id);
    setActivePersonaId(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Personas</h2>
          <p className="text-sm text-gray-500">Configure different profiles for various use cases</p>
        </div>
        <button
          onClick={handleAddPersona}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Persona
        </button>
      </div>

      <div className="space-y-4">
        {personas.map((persona) => (
          <PersonaEditor
            key={persona.id}
            persona={persona}
            isActive={persona.id === activePersonaId}
            onUpdate={(changes) => handlePersonaChange(persona.id, changes)}
            onDelete={() => handleDeletePersona(persona.id)}
            onSetActive={() => handleSetActivePersona(persona.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface PersonaEditorProps {
  persona: Persona;
  isActive: boolean;
  onUpdate: (changes: Partial<Persona>) => void;
  onDelete: () => void;
  onSetActive: () => void;
}

function PersonaEditor({ persona, isActive, onUpdate, onDelete, onSetActive }: PersonaEditorProps) {
  return (
    <div
      className={`bg-white rounded-xl border p-6 ${
        isActive ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 mr-4">
          <input
            type="text"
            value={persona.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="text-lg font-medium text-gray-900 bg-transparent border-none p-0 focus:ring-0 w-full"
          />
          <input
            type="text"
            value={persona.role}
            onChange={(e) => onUpdate({ role: e.target.value })}
            className="text-sm text-gray-500 bg-transparent border-none p-0 focus:ring-0 w-full mt-1"
            placeholder="Role description"
          />
        </div>
        <div className="flex items-center gap-2">
          {!isActive && (
            <button onClick={onSetActive} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Set Active
            </button>
          )}
          {persona.id !== 'default' && (
            <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Keywords (comma-separated)</label>
          <input
            type="text"
            value={persona.keywords.join(', ')}
            onChange={(e) =>
              onUpdate({ keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="looking for, need help, recommend"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">AI Tone</label>
          <select
            value={persona.aiTone}
            onChange={(e) => onUpdate({ aiTone: e.target.value as Persona['aiTone'] })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="friendly">Friendly</option>
            <option value="expert">Expert</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium text-gray-500 mb-1">Value Proposition</label>
        <textarea
          value={persona.valueProposition}
          onChange={(e) => onUpdate({ valueProposition: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
          rows={2}
          placeholder="Describe how you help your clients..."
        />
      </div>
    </div>
  );
}
