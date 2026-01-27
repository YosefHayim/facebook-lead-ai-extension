import { activePersonaIdStorage } from '../../../src/lib/storage';
import type { Persona } from '../../../src/types';

interface PersonasTabProps {
  personas: Persona[];
  activePersonaId: string;
}

export function PersonasTab({ personas, activePersonaId }: PersonasTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-muted">
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
      className={`bg-card rounded-xl border p-4 ${
        isActive ? 'border-foreground ring-1 ring-foreground' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-medium text-foreground">{persona.name}</h3>
          <p className="text-sm text-foreground-muted">{persona.role}</p>
        </div>
        {!isActive && (
          <button
            onClick={handleSetActive}
            className="text-xs text-foreground-secondary hover:text-foreground"
          >
            Set active
          </button>
        )}
      </div>
      <div className="text-xs text-foreground-secondary space-y-1">
        <p>
          <strong className="text-foreground-secondary">Keywords:</strong> {persona.keywords.join(', ')}
        </p>
        <p>
          <strong className="text-foreground-secondary">Tone:</strong> {persona.aiTone}
        </p>
      </div>
    </div>
  );
}
