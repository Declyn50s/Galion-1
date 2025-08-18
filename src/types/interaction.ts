export interface Interaction {
  id: string;
  type: 'guichet' | 'telephone' | 'courrier' | 'email' | 'jaxform' | 'commentaire';
  subject: string;
  customSubject?: string;
  comment: string;
  tags: string[];
  observations: string;
  isAlert: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InteractionFormData {
  subject: string;
  customSubject?: string;
  comment: string;
  tags: string[];
  observations: string;
  isAlert: boolean;
}

export const PREDEFINED_SUBJECTS = [
  'inscription',
  'renouvellement',
  'mise à jour',
  'contrôle',
  'résiliation',
  'rendez-vous',
  'gérance',
  'autres'
];

export const INTERACTION_TYPES = {
  guichet: { label: 'Guichet', icon: 'Building', color: 'blue' },
  telephone: { label: 'Téléphone', icon: 'Phone', color: 'green' },
  courrier: { label: 'Courrier', icon: 'Mail', color: 'purple' },
  email: { label: 'E-mail', icon: 'Mail', color: 'orange' },
  jaxform: { label: 'Jaxform', icon: 'FileCheck', color: 'indigo' },
  commentaire: { label: 'Commentaire', icon: 'MessageSquare', color: 'yellow' }
} as const;

// Mock API functions
export const mockAPI = {
  create: async (data: InteractionFormData & { type: string }): Promise<Interaction> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    
    const interaction: Interaction = {
      id: Date.now().toString(),
      type: data.type as Interaction['type'],
      subject: data.subject,
      customSubject: data.customSubject,
      comment: data.comment,
      tags: data.tags,
      observations: data.observations,
      isAlert: data.isAlert,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Created interaction:', interaction);
    return interaction;
  },
  
  update: async (id: string, data: Partial<InteractionFormData>): Promise<Interaction> => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    
    const interaction: Interaction = {
      id,
      type: 'guichet', // Mock type
      subject: data.subject || '',
      customSubject: data.customSubject,
      comment: data.comment || '',
      tags: data.tags || [],
      observations: data.observations || '',
      isAlert: data.isAlert || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Updated interaction:', interaction);
    return interaction;
  }
};