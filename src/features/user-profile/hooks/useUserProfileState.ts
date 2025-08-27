// src/features/user-profile/hooks/useUserProfileState.ts
import { useEffect, useState } from 'react'
import type { UserProfile as UserProfileType, HouseholdMember } from '@/types/user'
import { INTERACTION_TYPES } from '@/types/interaction'

export type SelectedStatus = {
  value: string
  label: string
  icon?: string
  percentage?: number
}

// --------- helpers locaux (mêmes règles que UsersPage) ----------
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-\.]/g, '')

const makeUserId = (p: { nom: string; prenom: string; dateNaissance: string }) =>
  slugify(`${p.nom}-${p.prenom}-${p.dateNaissance}`)

const pad2 = (n: number) => String(n).padStart(2, '0')
/** Convertit 31.12.1990 -> 1990-12-31 ; laisse passer les ISO déjà valides */
const toISOFromCH = (d?: string) => {
  if (!d) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  const m = d.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (m) {
    const day = pad2(Number(m[1]))
    const mon = pad2(Number(m[2]))
    const year = m[3]
    return `${year}-${mon}-${day}`
  }
  return d // fallback
}
// ---------------------------------------------------------------

export function useUserProfileState(userId?: string) {
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [personStatuses, setPersonStatuses] = useState<Record<string, SelectedStatus[]>>({
    main: [],
  })
  const [dialogOpen, setDialogOpen] = useState<{
    isOpen: boolean
    type: keyof typeof INTERACTION_TYPES | null
  }>({ isOpen: false, type: null })

  // ⚠️ état initial par défaut (sera remplacé quand on trouve l’usager)
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
    phone: '',
    email: '',
    nationality: 'Suisse',
    residencePermit: 'Citoyen',
    maritalStatus: 'Marié(e)',
    household: [],
    registrationDate: '2024-01-15',
    deadline: '2024-12-31',
    lastCertificateDate: '2024-11-01',
    individualIncome: 0,
    householdIncome: 0,
    maxRooms: undefined,
    minRent: undefined,
    lausanneStatus: 'Arrivé à Lausanne',
    lausanneStatusDate: undefined,
    hasCurator: false,
    curatorName: '',
    curatorAddress: '',
    curatorPhone: '',
    curatorEmail: '',
  })

  // ===== CHARGER L’USAGER DEPUIS /people.json EN FONCTION DE :userId =====
  useEffect(() => {
    if (!userId) return
    const load = async () => {
      try {
        const res = await fetch('/people.json', { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        type PersonJSON = {
          genre: string
          nom: string
          prenom: string
          dateNaissance: string
          adresse: string
          complement?: string
          npa: string
          ville: string
          statut: string
        }
        const people: PersonJSON[] = await res.json()

        const decodedId = decodeURIComponent(userId)
        const found = people.find((p) => makeUserId(p) === decodedId)

        if (!found) {
          console.warn('[UserProfile] userId non trouvé dans people.json :', decodedId)
          return
        }

        // map -> UserProfileType
        setUserProfile((prev) => ({
          ...prev,
          lastName: found.nom,
          firstName: found.prenom,
          gender: found.genre, // 'Masculin' / 'Féminin'
          birthDate: toISOFromCH(found.dateNaissance),
          address: found.adresse,
          addressComplement: found.complement || '',
          postalCode: found.npa,
          city: found.ville,
          // champs sans source dans people.json -> valeurs par défaut
          phone: '',
          email: '',
          nationality: prev.nationality ?? 'Suisse',
          residencePermit: prev.residencePermit ?? 'Citoyen',
          maritalStatus: prev.maritalStatus ?? 'Célibataire',
          // mini logique Lausanne
          lausanneStatus: found.ville === 'Lausanne' ? 'Arrivé à Lausanne' : 'Rentré par le travail',
        }))
      } catch (e) {
        console.error('[UserProfile] échec de chargement people.json', e)
      }
    }
    load()
  }, [userId])

  // === Status helpers ===
  const getCurrentPersonStatuses = (): SelectedStatus[] => personStatuses['main'] || []
  const setCurrentPersonStatuses = (statuses: SelectedStatus[]) =>
    setPersonStatuses((prev) => ({ ...prev, main: statuses }))

  // === Mutations ===
  const updateProfile = (field: keyof UserProfileType, value: any) => {
    if (field === 'city') {
      const updates: Partial<UserProfileType> = { [field]: value }
      updates.lausanneStatus = value === 'Lausanne' ? 'Arrivé à Lausanne' : 'Rentré par le travail'
      setUserProfile((prev) => ({ ...prev, ...updates }))
      return
    }

    if (field === 'nationality') {
      const updates: Partial<UserProfileType> = { [field]: value }
      if (value === 'Suisse') {
        updates.residencePermit = 'Citoyen'
        updates.permitExpiryDate = undefined
      } else if (userProfile.residencePermit === 'Citoyen') {
        ;(updates as any).residencePermit = ''
        updates.permitExpiryDate = undefined
      }
      setUserProfile((prev) => ({ ...prev, ...updates }))
      return
    }

    if (field === 'residencePermit') {
      const updates: Partial<UserProfileType> = { [field]: value }
      if (value !== 'Permis B' && value !== 'Permis F') updates.permitExpiryDate = undefined
      setUserProfile((prev) => ({ ...prev, ...updates }))
      return
    }

    setUserProfile((prev) => ({ ...prev, [field]: value as any }))
  }

  const addHouseholdMember = () => {
    const id = Date.now().toString()
    const member: HouseholdMember = {
      id,
      role: 'Autre',
      name: 'Nouveau Membre',
      status: 'N/A',
      birthDate: '2000-01-01',
      gender: 'Masculin',
      nationality: 'Suisse',
      residencePermit: 'Citoyen',
      hasCurator: false,
      curatorName: '',
      curatorAddress: '',
      curatorPhone: '',
      curatorEmail: '',
    }
    setUserProfile((prev) => ({ ...prev, household: [...prev.household, member] }))
  }

  const removeHouseholdMember = (id: string) => {
    setPersonStatuses((prev) => {
      const n = { ...prev }
      delete n[id]
      return n
    })
    setUserProfile((prev) => ({ ...prev, household: prev.household.filter((m) => m.id !== id) }))
  }

  const swapWithPersonalInfo = (member: HouseholdMember) => {
    setIsSwapping(true)

    const currentStatuses = getCurrentPersonStatuses()
    const memberStatuses = personStatuses[member.id] || []

    setTimeout(() => {
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
        curatorEmail: userProfile.curatorEmail,
      }

      setPersonStatuses((prev) => ({ ...prev, main: memberStatuses, [member.id]: currentStatuses }))

      const [firstName, ...lastNameParts] = member.name.split(' ')
      const lastName = lastNameParts.join(' ')

      setUserProfile((prev) => ({
        ...prev,
        firstName,
        lastName,
        gender: member.gender,
        birthDate: member.birthDate,
        nationality: member.nationality,
        residencePermit: member.residencePermit,
        hasCurator: member.hasCurator,
        curatorName: member.curatorName,
        curatorAddress: member.curatorAddress,
        curatorPhone: member.curatorPhone,
        curatorEmail: member.curatorEmail,
        household: prev.household.map((h) =>
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
                curatorEmail: currentPersonalInfo.curatorEmail,
              }
            : h
        ),
      }))

      setTimeout(() => setIsSwapping(false), 300)
    }, 150)
  }

  const savePersonalInfo = () => setIsEditingPersonalInfo(false)

  const copyAddressInfo = async () => {
    let addressText = `${userProfile.firstName} ${userProfile.lastName.toUpperCase()}`
    if (userProfile.hasCurator && userProfile.curatorName) {
      addressText += `\np.a. ${userProfile.curatorName}`
      if (userProfile.curatorAddress) addressText += `\n${userProfile.curatorAddress}`
    } else {
      addressText += `\n${userProfile.address}`
      if (userProfile.addressComplement) addressText += `\n${userProfile.addressComplement}`
      addressText += `\n${userProfile.postalCode} ${userProfile.city}`
    }
    try {
      await navigator.clipboard.writeText(addressText)
    } catch (e) {
      console.error('Clipboard error', e)
    }
  }

  const handleInteractionClick = (type: keyof typeof INTERACTION_TYPES) =>
    setDialogOpen({ isOpen: true, type })

  const handleDialogClose = () => setDialogOpen({ isOpen: false, type: null })

  return {
    // state
    userProfile,
    isEditingPersonalInfo,
    setIsEditingPersonalInfo,
    isSwapping,
    personStatuses,
    dialogOpen,

    // helpers
    getCurrentPersonStatuses,

    // actions
    setCurrentPersonStatuses,
    updateProfile,
    addHouseholdMember,
    removeHouseholdMember,
    swapWithPersonalInfo,
    savePersonalInfo,
    copyAddressInfo,
    handleInteractionClick,
    handleDialogClose,
  }
}
