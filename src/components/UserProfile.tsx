import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Users, Trash2, FileText, Save, Edit, Eye, User, Phone, Mail, MessageSquare, FileCheck, Building } from 'lucide-react';
import { Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { UserProfile as UserProfileType, HouseholdMember, ROLE_OPTIONS, STATUS_OPTIONS, MARITAL_STATUS_OPTIONS, RESIDENCE_PERMIT_OPTIONS } from '@/types/user';
import { LAUSANNE_STATUS_OPTIONS } from '@/types/user';
import { NationalitySelector } from './NationalitySelector';
import { InteractionDialog } from './InteractionDialog';
import { INTERACTION_TYPES } from '@/types/interaction';
import { StatusSelect, SelectedStatus } from './StatusSelect';

const UserProfile: React.FC = () => {
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [personStatuses, setPersonStatuses] = useState<Record<string, SelectedStatus[]>>({
    'main': [], // Statuts de la personne principale
  });
  const [dialogOpen, setDialogOpen] = useState<{
    isOpen: boolean;
    type: keyof typeof INTERACTION_TYPES | null;
  }>({
    isOpen: false,
    type: null
  });

  // Fonction pour obtenir les statuts de la personne actuelle
  const getCurrentPersonStatuses = (): SelectedStatus[] => {
    return personStatuses['main'] || [];
  };

  // Fonction pour mettre à jour les statuts de la personne actuelle
  const setCurrentPersonStatuses = (statuses: SelectedStatus[]) => {
    setPersonStatuses(prev => ({
      ...prev,
      'main': statuses
    }));
  };

  const [userProfile, setUserProfile] = useState<UserProfileType>({
    isApplicant: true,
    isTenant: false,
    lastName: 'Martin',
    firstName: 'Sophie',
    gender: 'Féminin',
    birthDate: '1985-03-15',
    socialSecurityNumber: '756.1234.5678.90',
    address: 'Rue de la Paix 12',
    addressComplement: 'Apt 3A',
    postalCode: '1000',
    city: 'Lausanne',
    phone: '+41 21 123 45 67',
    email: 'sophie.martin@email.ch',
    nationality: 'Suisse',
    residencePermit: 'Citoyen',
    maritalStatus: 'Marié(e)',
    household: [
      {
        id: '1',
        role: 'Conjoint',
        name: 'Pierre Martin',
        status: 'Employé',
        birthDate: '1982-07-20',
        gender: 'Masculin',
        nationality: 'Suisse',
        residencePermit: 'Citoyen',
        hasCurator: false,
        curatorName: '',
        curatorAddress: '',
        curatorPhone: '',
        curatorEmail: ''
      },
      {
        id: '2',
        role: 'Enfant à charge',
        name: 'Emma Martin',
        status: 'Élève',
        birthDate: '2010-11-08',
        gender: 'Féminin',
        nationality: 'Suisse',
        residencePermit: 'Citoyen',
        hasCurator: false,
        curatorName: '',
        curatorAddress: '',
        curatorPhone: '',
        curatorEmail: ''
      }
    ],
    registrationDate: '2024-01-15',
    deadline: '2024-12-31',
    lastCertificateDate: '2024-11-01',
    individualIncome: 45000,
    householdIncome: 75000,
    maxRooms: undefined,
    minRent: undefined,
    lausanneStatus: 'Arrivé à Lausanne',
    lausanneStatusDate: undefined,
    hasCurator: false,
    curatorName: '',
    curatorAddress: '',
    curatorPhone: '',
    curatorEmail: ''
  });

  const [newMember, setNewMember] = useState<Partial<HouseholdMember>>({
    role: '',
    name: '',
    status: '',
    birthDate: '',
    gender: '',
    nationality: '',
    residencePermit: ''
  });

  const updateProfile = (field: keyof UserProfileType, value: any) => {
    // Si on change la ville, ajuster automatiquement le statut à Lausanne
    if (field === 'city') {
      const updates: Partial<UserProfileType> = { [field]: value };
      
      if (value === 'Lausanne') {
        updates.lausanneStatus = 'Arrivé à Lausanne';
      } else {
        updates.lausanneStatus = 'Rentré par le travail';
      }
      
      setUserProfile(prev => ({
        ...prev,
        ...updates
      }));
      return;
    }
    
    // Si on change la nationalité, ajuster automatiquement le permis de séjour
    if (field === 'nationality') {
      const updates: Partial<UserProfileType> = { [field]: value };
      
      if (value === 'Suisse') {
        updates.residencePermit = 'Citoyen';
        updates.permitExpiryDate = undefined; // Supprimer la date d'échéance
      } else if (userProfile.residencePermit === 'Citoyen') {
        updates.residencePermit = ''; // Réinitialiser si c'était "Citoyen"
        updates.permitExpiryDate = undefined;
      }
      
      setUserProfile(prev => ({
        ...prev,
        ...updates
      }));
      return;
    }
    
    // Si on change le permis de séjour, gérer la date d'échéance
    if (field === 'residencePermit') {
      const updates: Partial<UserProfileType> = { [field]: value };
      
      // Supprimer la date d'échéance si ce n'est pas un permis B ou F
      if (value !== 'Permis B' && value !== 'Permis F') {
        updates.permitExpiryDate = undefined;
      }
      
      setUserProfile(prev => ({
        ...prev,
        ...updates
      }));
      return;
    }
    
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addHouseholdMember = () => {
    if (newMember.role && newMember.name && newMember.status && newMember.birthDate && newMember.gender && newMember.nationality && newMember.residencePermit !== undefined) {
      const member: HouseholdMember = {
        id: Date.now().toString(),
        role: newMember.role,
        name: newMember.name,
        status: newMember.status,
        birthDate: newMember.birthDate,
        gender: newMember.gender,
        nationality: newMember.nationality,
        residencePermit: newMember.residencePermit,
        hasCurator: newMember.hasCurator || false,
        curatorName: newMember.curatorName || '',
        curatorAddress: newMember.curatorAddress || '',
        curatorPhone: newMember.curatorPhone || '',
        curatorEmail: newMember.curatorEmail || ''
      };
      
      setUserProfile(prev => ({
        ...prev,
        household: [...prev.household, member]
      }));
      
      setNewMember({ 
        role: '', 
        name: '', 
        status: '',
        birthDate: '',
        gender: '',
        nationality: '',
        residencePermit: '',
        hasCurator: false,
        curatorName: '',
        curatorAddress: '',
        curatorPhone: '',
        curatorEmail: ''
      });
    }
  };

  const removeHouseholdMember = (id: string) => {
    // Supprimer aussi les statuts de cette personne
    setPersonStatuses(prev => {
      const newStatuses = { ...prev };
      delete newStatuses[id];
      return newStatuses;
    });
    
    setUserProfile(prev => ({
      ...prev,
      household: prev.household.filter(member => member.id !== id)
    }));
  };

  const swapWithPersonalInfo = (member: HouseholdMember) => {
    setIsSwapping(true);
    
    // Sauvegarder les statuts actuels avant l'échange
    const currentStatuses = getCurrentPersonStatuses();
    const memberStatuses = personStatuses[member.id] || [];
    
    // Délai pour l'animation
    setTimeout(() => {
    // Sauvegarder les informations personnelles actuelles
    const currentPersonalInfo = {
      lastName: userProfile.lastName,
      firstName: userProfile.firstName,
      gender: userProfile.gender,
      birthDate: userProfile.birthDate,
      nationality: userProfile.nationality,
      residencePermit: userProfile.residencePermit,
      hasCurator: userProfile.hasCurator,
      curatorName: userProfile.curatorName,
      curatorAddress: userProfile.curatorAddress,
      curatorPhone: userProfile.curatorPhone,
      curatorEmail: userProfile.curatorEmail
    };
    
    // Échanger les statuts
    setPersonStatuses(prev => ({
      ...prev,
      'main': memberStatuses,
      [member.id]: currentStatuses
    }));
    
    // Mettre à jour les informations personnelles avec celles du membre
    const [firstName, ...lastNameParts] = member.name.split(' ');
    const lastName = lastNameParts.join(' ');
    
    setUserProfile(prev => ({
      ...prev,
      firstName: firstName,
      lastName: lastName,
      gender: member.gender,
      birthDate: member.birthDate,
      nationality: member.nationality,
      residencePermit: member.residencePermit,
      hasCurator: member.hasCurator,
      curatorName: member.curatorName,
      curatorAddress: member.curatorAddress,
      curatorPhone: member.curatorPhone,
      curatorEmail: member.curatorEmail,
      // Mettre à jour le membre dans le ménage avec les anciennes informations personnelles
      household: prev.household.map(h => 
        h.id === member.id 
          ? {
              ...h,
              name: `${currentPersonalInfo.firstName} ${currentPersonalInfo.lastName}`,
              gender: currentPersonalInfo.gender,
              birthDate: currentPersonalInfo.birthDate,
              nationality: currentPersonalInfo.nationality,
              residencePermit: currentPersonalInfo.residencePermit,
              hasCurator: currentPersonalInfo.hasCurator,
              curatorName: currentPersonalInfo.curatorName,
              curatorAddress: currentPersonalInfo.curatorAddress,
              curatorPhone: currentPersonalInfo.curatorPhone,
              curatorEmail: currentPersonalInfo.curatorEmail
            }
          : h
      )
    }));
    
    // Fin de l'animation après un délai
    setTimeout(() => {
      setIsSwapping(false);
    }, 300);
    }, 150);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-CH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const savePersonalInfo = () => {
    // Ici on sauvegarderait les données
    setIsEditingPersonalInfo(false);
  };

  const copyAddressInfo = async () => {
    let addressText = `${userProfile.firstName} ${userProfile.lastName.toUpperCase()}`;
    
    if (userProfile.hasCurator && userProfile.curatorName) {
      addressText += `\np.a. ${userProfile.curatorName}`;
      if (userProfile.curatorAddress) {
        addressText += `\n${userProfile.curatorAddress}`;
      }
    } else {
      addressText += `\n${userProfile.address}`;
      if (userProfile.addressComplement) {
        addressText += `\n${userProfile.addressComplement}`;
      }
      addressText += `\n${userProfile.postalCode} ${userProfile.city}`;
    }
    
    try {
      await navigator.clipboard.writeText(addressText);
      // Optionnel: ajouter une notification de succès
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  const handleInteractionClick = (type: keyof typeof INTERACTION_TYPES) => {
    setDialogOpen({ isOpen: true, type });
  };

  const handleDialogClose = () => {
    setDialogOpen({ isOpen: false, type: null });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header avec statut et actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <Badge 
              variant={userProfile.isApplicant ? "destructive" : "secondary"}
              className="px-3 py-1.5 text-sm font-medium"
            >
              Demandeur
            </Badge>
            <Badge 
              variant={userProfile.isTenant ? "default" : "outline"}
              className="px-3 py-1.5 text-sm font-medium"
            >
              Locataire
            </Badge>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Attestation
            </Button>
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Enregistrer
            </Button>
          </div>
        </div>

        {/* Boutons d'actions */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 justify-center">
              <Button 
                variant="outline" 
                className="gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                onClick={() => handleInteractionClick('guichet')}
              >
                <Building className="h-4 w-4" />
                Guichet
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                onClick={() => handleInteractionClick('telephone')}
              >
                <Phone className="h-4 w-4" />
                Téléphone
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                onClick={() => handleInteractionClick('courrier')}
              >
                <Mail className="h-4 w-4" />
                Courrier
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
                onClick={() => handleInteractionClick('email')}
              >
                <Mail className="h-4 w-4" />
                E-mail
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700"
                onClick={() => handleInteractionClick('jaxform')}
              >
                <FileCheck className="h-4 w-4" />
                Jaxform
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700"
                onClick={() => handleInteractionClick('commentaire')}
              >
                <MessageSquare className="h-4 w-4" />
                Commentaire
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bloc Informations personnelles et Dates côte à côte */}
        <div className="grid grid-cols-4 gap-6">
          {/* Bloc Informations personnelles - 5/6 de la largeur */}
          <Card className={`col-span-6 shadow-lg border-0 backdrop-blur-sm transition-all duration-300 ${
            isSwapping ? 'scale-105 shadow-2xl ring-4 ring-blue-200 bg-blue-50/90' : 
            userProfile.gender === 'Masculin' 
              ? 'bg-blue-50/80 dark:bg-blue-900/20' 
              : userProfile.gender === 'Féminin' 
              ? 'bg-pink-50/80 dark:bg-pink-900/20' 
              : 'bg-white/80 dark:bg-slate-800'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className={`text-xl font-semibold transition-colors duration-300 ${
                  isSwapping ? 'text-blue-700' : 'text-slate-800'
                }`}>
                  👤 Informations personnelles
                </CardTitle>
                {!isEditingPersonalInfo && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={copyAddressInfo}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copier
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditingPersonalInfo(true)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Modifier
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingPersonalInfo ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">Nom</Label>
                      <Input
                        id="lastName"
                        value={userProfile.lastName}
                        onChange={(e) => updateProfile('lastName', e.target.value)}
                        className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">Prénom</Label>
                      <Input
                        id="firstName"
                        value={userProfile.firstName}
                        onChange={(e) => updateProfile('firstName', e.target.value)}
                        className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm font-medium text-slate-700">Genre</Label>
                      <Select
                        value={userProfile.gender}
                        onValueChange={(value) => updateProfile('gender', value)}
                      >
                        <SelectTrigger className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Masculin">Masculin</SelectItem>
                          <SelectItem value="Féminin">Féminin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="birthDate" className="text-sm font-medium text-slate-700">Date de naissance</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={userProfile.birthDate}
                        onChange={(e) => updateProfile('birthDate', e.target.value)}
                        className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nss" className="text-sm font-medium text-slate-700">NSS</Label>
                      <Input
                        id="nss"
                        value={userProfile.socialSecurityNumber}
                        onChange={(e) => updateProfile('socialSecurityNumber', e.target.value)}
                        placeholder="756.1234.5678.90"
                        className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium text-slate-700">Adresse</Label>
                      <Input
                        id="address"
                        value={userProfile.address}
                        onChange={(e) => updateProfile('address', e.target.value)}
                        className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="addressComplement" className="text-sm font-medium text-slate-700">Complément d'adresse</Label>
                      <Input
                        id="addressComplement"
                        value={userProfile.addressComplement}
                        onChange={(e) => updateProfile('addressComplement', e.target.value)}
                        className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-sm font-medium text-slate-700">NPA</Label>
                      <Input
                        id="postalCode"
                        value={userProfile.postalCode}
                        onChange={(e) => updateProfile('postalCode', e.target.value)}
                        className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium text-slate-700">Ville</Label>
                      <Input
                        id="city"
                        value={userProfile.city}
                        onChange={(e) => updateProfile('city', e.target.value)}
                        className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Téléphone</Label>
                      <Input
                        id="phone"
                        value={userProfile.phone}
                        onChange={(e) => updateProfile('phone', e.target.value)}
                        className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userProfile.email}
                        onChange={(e) => updateProfile('email', e.target.value)}
                        className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nationality" className="text-sm font-medium text-slate-700">Nationalité</Label>
                      <NationalitySelector
                        value={userProfile.nationality}
                        onChange={(value) => updateProfile('nationality', value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="residencePermit" className="text-sm font-medium text-slate-700">Permis de séjour</Label>
                      <Select
                        value={userProfile.residencePermit}
                        onValueChange={(value) => updateProfile('residencePermit', value)}
                      >
                        <SelectTrigger className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {userProfile.nationality === 'Suisse' ? (
                            <SelectItem value="Citoyen">Citoyen</SelectItem>
                          ) : (
                            RESIDENCE_PERMIT_OPTIONS.filter(permit => permit !== 'Citoyen').map(permit => (
                              <SelectItem key={permit} value={permit}>{permit}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maritalStatus" className="text-sm font-medium text-slate-700">État civil</Label>
                      <Select
                        value={userProfile.maritalStatus}
                        onValueChange={(value) => updateProfile('maritalStatus', value)}
                      >
                        <SelectTrigger className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MARITAL_STATUS_OPTIONS.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="lausanneStatus" className="text-sm font-medium text-slate-700">Via</Label>
                      <Select
                        value={userProfile.lausanneStatus || ''}
                        onValueChange={(value) => {
                          updateProfile('lausanneStatus', value);
                          // Réinitialiser la date si on sélectionne "Conditions étudiantes"
                          if (value === 'Conditions étudiantes') {
                            updateProfile('lausanneStatusDate', undefined);
                          }
                        }}
                      >
                        <SelectTrigger className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {LAUSANNE_STATUS_OPTIONS.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Champ date conditionnel */}
                    {userProfile.lausanneStatus && userProfile.lausanneStatus !== 'Conditions étudiantes' && (
                      <div className="space-y-2">
                        <Label htmlFor="lausanneStatusDate" className="text-sm font-medium text-slate-700">
                          Date {userProfile.lausanneStatus === 'Arrivé à Lausanne' ? "d'arrivée" : "de retour"}
                        </Label>
                        <Input
                          id="lausanneStatusDate"
                          type="date"
                          value={userProfile.lausanneStatusDate || ''}
                          onChange={(e) => updateProfile('lausanneStatusDate', e.target.value)}
                          className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Champ conditionnel pour l'échéance du permis */}
                  {(userProfile.residencePermit === 'Permis B' || userProfile.residencePermit === 'Permis F') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="permitExpiryDate" className="text-sm font-medium text-slate-700">Échéance de permis</Label>
                        <Input
                          id="permitExpiryDate"
                          type="date"
                          value={userProfile.permitExpiryDate || ''}
                          onChange={(e) => updateProfile('permitExpiryDate', e.target.value)}
                          className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                  )}
                  
                  <Separator className="my-6" />
                  
                  {/* Section Curateur */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasCurator"
                        checked={userProfile.hasCurator}
                        onCheckedChange={(checked) => updateProfile('hasCurator', checked)}
                      />
                      <Label htmlFor="hasCurator" className="text-sm font-medium text-slate-700">
                        A un curateur
                      </Label>
                    </div>
                    
                    {userProfile.hasCurator && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="space-y-2">
                          <Label htmlFor="curatorName" className="text-sm font-medium text-slate-700">Nom du curateur</Label>
                          <Input
                            id="curatorName"
                            value={userProfile.curatorName || ''}
                            onChange={(e) => updateProfile('curatorName', e.target.value)}
                            className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="curatorAddress" className="text-sm font-medium text-slate-700">Adresse du curateur</Label>
                          <Input
                            id="curatorAddress"
                            value={userProfile.curatorAddress || ''}
                            onChange={(e) => updateProfile('curatorAddress', e.target.value)}
                            className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="curatorPhone" className="text-sm font-medium text-slate-700">Téléphone du curateur</Label>
                          <Input
                            id="curatorPhone"
                            value={userProfile.curatorPhone || ''}
                            onChange={(e) => updateProfile('curatorPhone', e.target.value)}
                            className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="curatorEmail" className="text-sm font-medium text-slate-700">Email du curateur</Label>
                          <Input
                            id="curatorEmail"
                            type="email"
                            value={userProfile.curatorEmail || ''}
                            onChange={(e) => updateProfile('curatorEmail', e.target.value)}
                            className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Section Statuts */}
                  <StatusSelect
                    value={getCurrentPersonStatuses()}
                    onChange={setCurrentPersonStatuses}
                  />
                  
                  <Separator className="my-6" />
                  
                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditingPersonalInfo(false)}
                    >
                      Annuler
                    </Button>
                    <Button 
                      onClick={savePersonalInfo}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Enregistrer
                    </Button>
                  </div>
                </>
              ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-slate-500 font-medium">Civilité</p>
                    <p className="text-slate-800">{userProfile.gender === 'Féminin' ? 'Madame' : 'Monsieur'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-medium">Nom</p>
                    <p className="text-slate-800">{userProfile.lastName.toUpperCase()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-medium">Prénom</p>
                    <p className="text-slate-800">{userProfile.firstName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-medium">Date de naissance</p>
                    <p className="text-slate-800">{new Date(userProfile.birthDate).toLocaleDateString('fr-CH')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-medium">Adresse</p>
                    <p className="text-slate-800">{userProfile.address}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-medium">Complément</p>
                    <p className="text-slate-800">{userProfile.addressComplement}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-medium">NPA</p>
                    <p className="text-slate-800">{userProfile.postalCode}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-medium">Ville</p>
                    <p className="text-slate-800">{userProfile.city}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-medium">NSS</p>
                    <p className="text-slate-800">{userProfile.socialSecurityNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-medium">Téléphone</p>
                    <p className="text-slate-800">{userProfile.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-medium">Email</p>
                    <p className="text-slate-800">{userProfile.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-medium">Nationalité</p>
                    <p className="text-slate-800">{userProfile.nationality}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-medium">Permis</p>
                    <p className="text-slate-800">{userProfile.residencePermit}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-medium">État civil</p>
                    <p className="text-slate-800">{userProfile.maritalStatus}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-500 font-medium">Âge</p>
                    <p className="text-slate-800">{Math.floor((new Date().getTime() - new Date(userProfile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} ans</p>
                  </div>
                  {userProfile.lausanneStatus && (
                    <div className="space-y-1">
                      <p className="text-slate-500 font-medium">{userProfile.lausanneStatus}</p>
                      <p className="text-slate-800">
                        {userProfile.lausanneStatusDate && userProfile.lausanneStatus !== 'Conditions étudiantes' ? (
                          new Date(userProfile.lausanneStatusDate).toLocaleDateString('fr-CH')
                        ) : (
                          '-'
                        )}
                      </p>
                    </div>
                  )}
                  {userProfile.hasCurator && userProfile.curatorName && (
                    <div className="space-y-1">
                      <p className="text-slate-500 font-medium">⚠️ Curateur</p>
                      <p className="text-red-600 font-medium">{userProfile.curatorName}</p>
                    </div>
                  )}
                  {(userProfile.residencePermit === 'Permis B' || userProfile.residencePermit === 'Permis F') && userProfile.permitExpiryDate && (
                    <div className="space-y-1">
                      <p className="text-slate-500 font-medium">Fin de validité du permis</p>
                      <p className="text-slate-800">{new Date(userProfile.permitExpiryDate).toLocaleDateString('fr-CH')}</p>
                    </div>
                  )}
                </div>
                
                {/* Tags de statuts en bas */}
                {getCurrentPersonStatuses().length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {getCurrentPersonStatuses().map((status) => (
                      <div key={status.value} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-md text-sm">
                        <span className="text-xs">{status.icon}</span>
                        <span>{status.label}</span>
                        {status.percentage && (
                          <span className="font-medium">({status.percentage}%)</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
              )}
            </CardContent>
          </Card>

          {/* Bloc Dates - 1/6 de la largeur */}
          <Card className="col-span-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-semibold text-slate-800">📅 Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="space-y-2">
                  <Label htmlFor="registrationDate" className="text-xs font-medium text-slate-700">
                    Inscription
                  </Label>
                  <Input
                    id="registrationDate"
                    type="date"
                    value={userProfile.registrationDate}
                    onChange={(e) => updateProfile('registrationDate', e.target.value)}
                    className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-xs"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastCertificateDate" className="text-xs font-medium text-slate-700">
                    Attestation envoyée
                  </Label>
                  <Input
                    id="lastCertificateDate"
                    type="date"
                    value={userProfile.lastCertificateDate}
                    onChange={(e) => updateProfile('lastCertificateDate', e.target.value)}
                    className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-xs"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-xs font-medium text-slate-700">Échéance</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={userProfile.deadline}
                    onChange={(e) => updateProfile('deadline', e.target.value)}
                    className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-xs"
                  />
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <Label htmlFor="maxRooms" className="text-xs font-medium text-slate-700">
                    Pièces max
                  </Label>
                  <Select
                    value={userProfile.maxRooms?.toString() || ''}
                    onValueChange={(value) => updateProfile('maxRooms', value ? Number(value) : undefined)}
                  >
                    <SelectTrigger className="bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-xs">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.5">1,5</SelectItem>
                      <SelectItem value="2.5">2,5</SelectItem>
                      <SelectItem value="3.5">3,5</SelectItem>
                      <SelectItem value="4.5">4,5</SelectItem>
                      <SelectItem value="5.5">5,5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minRent" className="text-xs font-medium text-slate-700">
                    Loyer min
                  </Label>
                  <div className="relative">
                    <Input
                      id="minRent"
                      type="text"
                      value={userProfile.minRent ? `CHF ${formatCurrency(userProfile.minRent)}` : 'à déterminer'}
                      readOnly
                      className="bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bloc Ménage */}
        <div className="grid grid-cols-6 gap-6">
          <Card className="user-profile-header col-span-5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Ménage ({userProfile.household.length} personne{userProfile.household.length > 1 ? 's' : ''})
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userProfile.household.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 ${
                      member.gender === 'Masculin' 
                        ? 'bg-blue-50 dark:bg-blue-900/20' 
                        : member.gender === 'Féminin'
                        ? 'bg-pink-50 dark:bg-pink-900/20'
                        : 'bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-600" />
                      </div>
                      <div
                        className="flex-1 cursor-pointer transition-colors duration-200 hover:bg-blue-50 hover:text-blue-700 rounded p-2 -m-2"
                        onDoubleClick={() => swapWithPersonalInfo(member)}
                      >
                        <div className="font-medium text-slate-900 dark:text-white">
                          <span className="capitalize">{member.name.split(' ')[0].toLowerCase()}</span>{' '}
                          <span className="uppercase">{member.name.split(' ').slice(1).join(' ')}</span>
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {member.role} • {member.status}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {new Date(member.birthDate).toLocaleDateString('fr-CH')} • {member.nationality} • {member.residencePermit}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => swapWithPersonalInfo(member)}
                        className="gap-2 w-10 h-10 p-0"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer <strong>{member.name}</strong> du ménage ?
                              Cette action est irréversible et supprimera également tous les statuts associés à cette personne.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeHouseholdMember(member.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bloc Revenus - 1/6 de la largeur */}
          <Card className="col-span-1 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-800">💰 Revenus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="individualIncome" className="text-xs font-medium text-slate-700">
                  Individuel
                </Label>
                <div className="relative">
                  <Input
                    id="individualIncome"
                    type="text"
                    value={`CHF ${formatCurrency(userProfile.individualIncome)}`}
                    readOnly
                    className="bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed text-xs"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="householdIncome" className="text-xs font-medium text-slate-700">
                  Ménage
                </Label>
                <div className="relative">
                  <Input
                    id="householdIncome"
                    type="text"
                    value={`CHF ${formatCurrency(userProfile.householdIncome)}`}
                    readOnly
                    className="bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Dialog d'interaction */}
      {dialogOpen.type && (
        <InteractionDialog
          isOpen={dialogOpen.isOpen}
          onClose={handleDialogClose}
          initialType={dialogOpen.type}
          onSave={(data) => {
            console.log('Interaction saved:', data);
            // Ici on pourrait ajouter l'interaction à une timeline ou liste
          }}
        />
      )}
    </div>
  );
};

export default UserProfile;