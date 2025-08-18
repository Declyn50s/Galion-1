import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, Check, AlertTriangle, Building, Phone, Mail, FileCheck, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  InteractionFormData, 
  PREDEFINED_SUBJECTS, 
  INTERACTION_TYPES,
  mockAPI 
} from '@/types/interaction';

const iconMap = {
  Building,
  Phone,
  Mail,
  FileCheck,
  MessageSquare
};

interface InteractionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialType: keyof typeof INTERACTION_TYPES;
  onSave?: (data: InteractionFormData) => void;
}

export const InteractionDialog: React.FC<InteractionDialogProps> = ({
  isOpen,
  onClose,
  initialType,
  onSave
}) => {
  const [selectedType, setSelectedType] = useState<keyof typeof INTERACTION_TYPES>(initialType);
  const [formData, setFormData] = useState<InteractionFormData>({
    subject: '',
    customSubject: '',
    comment: '',
    tags: [],
    observations: '',
    isAlert: false
  });
  
  const [newTag, setNewTag] = useState('');
  const [selectedTab, setSelectedTab] = useState<'taches' | 'journal' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // États pour les champs spécifiques par sujet
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentMoved, setAppointmentMoved] = useState(false);
  const [convocationSelected, setConvocationSelected] = useState(false);
  const [convocationReason, setConvocationReason] = useState('');
  const [convocationDate, setConvocationDate] = useState('');
  const [signatureConvention, setSignatureConvention] = useState(false);
  const [terminationDate, setTerminationDate] = useState('');
  const [selectedProlongations, setSelectedProlongations] = useState<string[]>([]);
  const [prolongationDates, setProlongationDates] = useState<{[key: string]: string}>({});
  
  // États pour les options de commentaire
  const [commentOptions, setCommentOptions] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [observationTags, setObservationTags] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const typeConfig = INTERACTION_TYPES[selectedType];

  // Debounced autosave
  useEffect(() => {
    if (formData.subject) { // Only autosave if subject is filled
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 2000);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key === 's') {
          e.preventDefault();
          handleSave();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleSaveAndClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, formData]);

  const handleAutoSave = async () => {
    if (!formData.subject) return;
    
    setIsSaving(true);
    try {
      await mockAPI.update('temp-id', formData);
    } catch (error) {
      console.error('Autosave failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.subject) return;
    
    setIsSaving(true);
    try {
      await mockAPI.create({ ...formData, type: selectedType });
      onSave?.(formData);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndClose = async () => {
    if (!formData.subject) return;
    
    setIsSaving(true);
    try {
      await mockAPI.create({ ...formData, type: selectedType });
      onSave?.(formData);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
    onClose();
  };

  const handleSubjectSelect = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subject: subject
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      customSubject: '',
      comment: '',
      tags: [],
      observations: '',
      isAlert: false
    });
    setNewTag('');
    setSelectedTab(null);
    setSelectedType(initialType);
    
    // Réinitialiser les champs spécifiques
    setAppointmentDate('');
    setAppointmentMoved(false);
    setConvocationSelected(false);
    setConvocationReason('');
    setConvocationDate('');
    setSignatureConvention(false);
    setTerminationDate('');
    setSelectedProlongations([]);
    setProlongationDates({});
    setCommentOptions([]);
    setUploadedFiles([]);
    setObservationTags([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleProlongationToggle = (prolongation: string) => {
    setSelectedProlongations(prev => {
      if (prev.includes(prolongation)) {
        // Retirer la prolongation et sa date
        const newDates = { ...prolongationDates };
        delete newDates[prolongation];
        setProlongationDates(newDates);
        return prev.filter(p => p !== prolongation);
      } else {
        // Ajouter la prolongation
        return [...prev, prolongation];
      }
    });
  };

  const handleProlongationDateChange = (prolongation: string, date: string) => {
    setProlongationDates(prev => ({
      ...prev,
      [prolongation]: date
    }));
  };

  const handleCommentOptionToggle = (option: string) => {
    setCommentOptions(prev => {
      if (prev.includes(option)) {
        // Si on décoche "dossier" ou "complément", supprimer les fichiers
        if (option === 'dossier' || option === 'complément') {
          setUploadedFiles([]);
        }
        return prev.filter(o => o !== option);
      } else {
        return [...prev, option];
      }
    });
  };

  const handleObservationTagToggle = (tag: string) => {
    setObservationTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isValid = formData.subject !== '';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              `bg-${typeConfig.color}-100 text-${typeConfig.color}-700`
            )}>
              {React.createElement(iconMap[typeConfig.icon as keyof typeof iconMap] || MessageSquare, { className: "w-4 h-4" })}
            </div>
            <span>Nouvelle interaction</span>
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Sauvegarde...
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sélecteur de canal */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Canal de communication</Label>
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as keyof typeof INTERACTION_TYPES)}
            >
              <SelectTrigger className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INTERACTION_TYPES).map(([key, config]) => {
                  const IconComponent = iconMap[config.icon as keyof typeof iconMap] || MessageSquare;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Sélection de sujet */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Sujet <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {PREDEFINED_SUBJECTS.filter(subject => {
                // Masquer "rendez-vous" si le canal est "courrier"
                if (selectedType === 'courrier' && subject === 'rendez-vous') {
                  return false;
                }
                return true;
              }).map((subject) => (
                <Button
                  key={subject}
                  variant={formData.subject === subject ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSubjectSelect(subject)}
                  className="justify-start"
                >
                  {subject}
                </Button>
              ))}
            </div>
            
          </div>

          <Separator />

          {/* Champs spécifiques par sujet */}
          {formData.subject === 'rendez-vous' && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Rendez-vous</Label>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="appointmentDate" className="text-sm">Date du rendez-vous</Label>
                    <Input
                      id="appointmentDate"
                      type="datetime-local"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="appointmentMoved"
                      checked={appointmentMoved}
                      onCheckedChange={(checked) => setAppointmentMoved(!!checked)}
                    />
                    <Label htmlFor="appointmentMoved" className="text-sm">
                      Rendez-vous déplacé
                    </Label>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {formData.subject === 'contrôle' && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Contrôle</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="convocationSelected"
                      checked={convocationSelected}
                      onCheckedChange={(checked) => setConvocationSelected(checked as boolean)}
                    />
                    <Label htmlFor="convocationSelected" className="text-sm">
                      Convocation
                    </Label>
                  </div>
                  
                  {convocationSelected && (
                    <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                      <div className="space-y-2">
                        <Label className="text-sm">Motif de la convocation</Label>
                        <Select
                          value={convocationReason}
                          onValueChange={setConvocationReason}
                        >
                          <SelectTrigger className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400">
                            <SelectValue placeholder="Sélectionner un motif..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="revenu-trop-eleve">Revenu trop élevé</SelectItem>
                            <SelectItem value="sous-occupation">Sous-occupation notoire</SelectItem>
                            <SelectItem value="devoir-information">Devoir d'information</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="convocationDate" className="text-sm">Date de convocation</Label>
                        <Input
                          id="convocationDate"
                          type="datetime-local"
                          value={convocationDate}
                          onChange={(e) => setConvocationDate(e.target.value)}
                          className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {formData.subject === 'résiliation' && (
            <>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Résiliation</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="signatureConvention"
                      checked={signatureConvention}
                      onCheckedChange={(checked) => setSignatureConvention(checked as boolean)}
                    />
                    <Label htmlFor="signatureConvention" className="text-sm">
                      Signature de convention
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="terminationDate" className="text-sm">Date de résiliation</Label>
                    <Input
                      id="terminationDate"
                      type="date"
                      value={terminationDate}
                      onChange={(e) => setTerminationDate(e.target.value)}
                      className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                    />
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}


          {/* Commentaire */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Commentaire</Label>
            <Textarea
              placeholder="Commentaire sur l'interaction..."
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              rows={3}
              className="resize-none"
            />
            
            {/* Options de commentaire */}
            <div className="space-y-3">
              {/*<Label className="text-sm font-medium">Options</Label>*/}
              <div className="flex flex-wrap gap-2">
                {(formData.subject === 'autres' 
                  ? ['complément', 'dénonciation']
                  : ['dossier', 'docs listés', 'complément', 'conditions', 'recours', 'réclamation']
                ).map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={commentOptions.includes(option) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCommentOptionToggle(option)}
                    className="capitalize"
                  >
                    {option}
                  </Button>
                ))}
              </div>
              
              {/* Upload de fichiers si "dossier" ou "complément" sélectionné */}
              {(commentOptions.includes('dossier') || commentOptions.includes('complément')) && (
                <div 
                  className={`space-y-3 p-4 rounded-lg border-2 border-dashed transition-colors ${
                    isDragOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-slate-300 bg-slate-50'
                  }`}
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Label className="text-sm font-medium">Pièces jointes</Label>
                  <div className="text-center py-4">
                    <div className="text-slate-600 mb-2">
                      Glissez-déposez vos fichiers ici ou
                    </div>
                    <div className="space-y-2">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      <label 
                        htmlFor="file-upload"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                      >
                        Sélectionner des fichiers
                      </label>
                    </div>
                  </div>
                    
                  {/* Liste des fichiers uploadés */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">Fichiers sélectionnés :</Label>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-slate-700">{file.name}</span>
                            <span className="text-xs text-slate-500">({Math.round(file.size / 1024)} KB)</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Observations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Observations</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isAlert}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAlert: checked }))}
                />
                <Label className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Alerte
                </Label>
              </div>
            </div>
            <Textarea
              placeholder="Détails de l'interaction..."
              value={formData.observations}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              rows={4}
              className="resize-none"
            />
            
            {/* Tags d'observation */}
            <div className="space-y-2">
              {/*<Label className="text-sm font-medium">Options 2</Label>*/}
              <div className="flex gap-2">
                {['Refus', 'Incomplet', 'Dérogation',].map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant={observationTags.includes(tag) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleObservationTagToggle(tag)}
                    className={tag === 'Refus' ? 'text-red-700 border-red-200 hover:bg-red-50' : ''}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Onglets Tâche/Journal/Information - Optionnel */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Suivi</Label>
            <div className="flex gap-2">
              <Button
                variant={selectedTab === 'tache' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTab(selectedTab === 'tache' ? null : 'tache')}
                className="flex-1"
              >
                Tâche
              </Button>
              <Button
                variant={selectedTab === 'journal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTab(selectedTab === 'journal' ? null : 'journal')}
                className="flex-1"
              >
                Journal
              </Button>
              <Button
                variant={selectedTab === 'information' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTab(selectedTab === 'information' ? null : 'information')}
                className="flex-1"
              >
                Information
              </Button>
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tags (collaborateurs à notifier)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter un collaborateur..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleAddTag}
                disabled={!newTag.trim() || formData.tags.includes(newTag.trim())}
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-2">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-xs text-slate-500">
              <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs ml-1">Ctrl+Enter</kbd> Sauvegarder et fermer • 
              <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs ml-1">Esc</kbd> Fermer
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={handleSaveAndClose}
                disabled={!isValid || isSaving}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                Sauvegarder et fermer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};