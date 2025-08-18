import React, { useState } from 'react';
import Select, { 
  MultiValue, 
  GroupBase, 
  OptionProps, 
  MultiValueProps,
  components,
  StylesConfig
} from 'react-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface StatusOption {
  value: string;
  label: string;
  icon: string;
  group: string;
  hasPercentage?: boolean;
}

export interface SelectedStatus extends StatusOption {
  percentage?: number;
}

interface StatusSelectProps {
  value: SelectedStatus[];
  onChange: (statuses: SelectedStatus[]) => void;
  className?: string;
}

const statusOptions: StatusOption[] = [
  // Emploi
  { value: 'salarie', label: 'Salarié·e', icon: '👔', group: 'Emploi' },
  { value: 'independant', label: 'Indépendant·e', icon: '💼', group: 'Emploi' },
  
  // Prestations & rentes
  { value: 'pc_famille', label: 'PC Famille', icon: '👪', group: 'Prestations & rentes' },
  { value: 'rente_ai', label: 'Rente AI', icon: '🦾', group: 'Prestations & rentes', hasPercentage: true },
  { value: 'rente_avs', label: 'Rente AVS', icon: '📜', group: 'Prestations & rentes' },
  { value: 'deuxieme_pilier', label: '2ᵉ pilier', icon: '🏦', group: 'Prestations & rentes' },
  { value: 'prestation_complementaire', label: 'Prestation complémentaire', icon: '➕', group: 'Prestations & rentes' },
  { value: 'rente_pont', label: 'Rente-pont', icon: '🌉', group: 'Prestations & rentes' },
  { value: 'autre_revenu', label: 'Autre revenu', icon: '💰', group: 'Prestations & rentes' },
  { value: 'bourse', label: 'Bourse', icon: '🎓', group: 'Prestations & rentes' },
  
  // Autres statuts
  { value: 'ri', label: 'RI', icon: '🔄', group: 'Autres statuts' },
  { value: 'evam', label: 'EVAM', icon: '🔄', group: 'Autres statuts' },
  { value: 'chomage', label: 'Chômage', icon: '📉', group: 'Autres statuts' },
  { value: 'formation', label: 'En formation', icon: '🎓', group: 'Autres statuts' },
  { value: 'sans_precision', label: 'Sans précision', icon: '❔', group: 'Autres statuts' }
];

// Grouper les options
const groupedOptions = statusOptions.reduce((groups, option) => {
  const group = groups.find(g => g.label === option.group);
  if (group) {
    group.options.push(option);
  } else {
    groups.push({
      label: option.group,
      options: [option]
    });
  }
  return groups;
}, [] as GroupBase<StatusOption>[]);

// Composant personnalisé pour les options
const CustomOption = (props: OptionProps<StatusOption>) => {
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{props.data.icon}</span>
        <span>{props.data.label}</span>
      </div>
    </components.Option>
  );
};

// Composant personnalisé pour les tags sélectionnés
const CustomMultiValue = (props: MultiValueProps<StatusOption>) => {
  return (
    <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm mr-1 mb-1">
      <span className="text-sm">{props.data.icon}</span>
      <span>{props.data.label}</span>
      <button
        onClick={() => props.removeProps.onClick()}
        className="ml-1 text-blue-600 hover:text-blue-800 font-bold text-xs"
      >
        ×
      </button>
    </div>
  );
};

// Styles personnalisés
const customStyles: StylesConfig<StatusOption, true> = {
  control: (provided) => ({
    ...provided,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgb(226 232 240)',
    '&:hover': {
      borderColor: 'rgb(59 130 246)'
    },
    '&:focus-within': {
      borderColor: 'rgb(59 130 246)',
      boxShadow: '0 0 0 1px rgb(59 130 246)'
    }
  }),
  multiValue: () => ({
    display: 'none' // On utilise notre composant personnalisé
  }),
  multiValueLabel: () => ({
    display: 'none'
  }),
  multiValueRemove: () => ({
    display: 'none'
  })
};

export const StatusSelect: React.FC<StatusSelectProps> = ({ value, onChange, className = '' }) => {
  const [percentages, setPercentages] = useState<Record<string, number>>({});

  const handleSelectChange = (selectedOptions: MultiValue<StatusOption>) => {
    const newStatuses: SelectedStatus[] = selectedOptions.map(option => ({
      ...option,
      percentage: option.hasPercentage ? percentages[option.value] : undefined
    }));
    onChange(newStatuses);
  };

  const handlePercentageChange = (statusValue: string, percentage: number) => {
    const newPercentages = { ...percentages, [statusValue]: percentage };
    setPercentages(newPercentages);
    
    // Mettre à jour le statut avec le nouveau pourcentage
    const updatedStatuses = value.map(status => 
      status.value === statusValue 
        ? { ...status, percentage }
        : status
    );
    onChange(updatedStatuses);
  };

  const selectedValues = value.map(status => ({
    value: status.value,
    label: status.label,
    icon: status.icon,
    group: status.group,
    hasPercentage: status.hasPercentage
  }));

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Statuts</Label>
        <Select
          isMulti
          options={groupedOptions}
          value={selectedValues}
          onChange={handleSelectChange}
          components={{
            Option: CustomOption,
            MultiValue: CustomMultiValue
          }}
          styles={customStyles}
          placeholder="Sélectionner les statuts..."
          noOptionsMessage={() => "Aucun statut trouvé"}
          className="react-select-container"
          classNamePrefix="react-select"
        />
      </div>

      {/* Affichage des tags sélectionnés */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((status) => (
            <div key={status.value} className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                <span className="text-sm">{status.icon}</span>
                <span>{status.label}</span>
                <button
                  onClick={() => {
                    const newStatuses = value.filter(s => s.value !== status.value);
                    onChange(newStatuses);
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800 font-bold text-xs"
                >
                  ×
                </button>
              </div>
              
              {/* Champ pourcentage pour Rente AI */}
              {status.hasPercentage && (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={status.percentage || ''}
                    onChange={(e) => handlePercentageChange(status.value, parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-16 h-7 text-xs"
                  />
                  <span className="text-xs text-slate-600">%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};