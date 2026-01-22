import { activePersonaIdStorage } from '../../../src/lib/storage';
import type { Persona } from '../../../src/types';

interface PersonasTabProps {
  personas: Persona[];
  activePersonaId: string;
}

export function PersonasTab({ personas, activePersonaId }: PersonasTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Configure personas with different keywords and AI tones for various use cases.
      </p>
      {personas.map((persona) => (
        <PersonaCard
          key={persona.id}
          persona={persona}
          isActive={persona.id === activePersonaId}
        />
      ))}
    </div>
  );
}

interface PersonaCardProps {
  persona: Persona;
  isActive: boolean;
}

function PersonaCard({ persona, isActive }: PersonaCardProps) {
  const handleSetActive = async () => {
    await activePersonaIdStorage.setValue(persona.id);
  };

  return (
    <div
      className={`bg-white rounded-lg border p-4 ${
        isActive ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-medium text-gray-900">{persona.name}</h3>
          <p className="text-sm text-gray-500">{persona.role}</p>
        </div>
        {!isActive && (
          <button
            onClick={handleSetActive}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Set active
          </button>
        )}
      </div>
      <div className="text-xs text-gray-600 space-y-1">
        <p>
          <strong>Keywords:</strong> {persona.keywords.join(', ')}
        </p>
        <p>
          <strong>Tone:</strong> {persona.aiTone}
        </p>
      </div>
    </div>
  );
}
