import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { UserProfile as UserProfileType } from '@/types/user'
import { formatCurrency } from '../utils/format'


interface Props {
registrationDate: string
lastCertificateDate: string
deadline: string
maxRooms?: number
minRent?: number
onChange: (field: keyof UserProfileType, value: any) => void
}


const DatesCard: React.FC<Props> = ({ registrationDate, lastCertificateDate, deadline, maxRooms, minRent, onChange }) => {
return (
<Card className="col-span-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
<CardHeader className="pb-1">
<CardTitle className="text-sm font-semibold text-slate-800">📅 Dates</CardTitle>
</CardHeader>
<CardContent className="space-y-4">
<div className="space-y-2">
<Label htmlFor="registrationDate" className="text-xs">Inscription</Label>
<Input id="registrationDate" type="date" value={registrationDate} onChange={(e) => onChange('registrationDate', e.target.value)} className="text-xs" />
</div>
<div className="space-y-2">
<Label htmlFor="lastCertificateDate" className="text-xs">Attestation envoyée</Label>
<Input id="lastCertificateDate" type="date" value={lastCertificateDate} onChange={(e) => onChange('lastCertificateDate', e.target.value)} className="text-xs" />
</div>
<div className="space-y-2">
<Label htmlFor="deadline" className="text-xs">Échéance</Label>
<Input id="deadline" type="date" value={deadline} onChange={(e) => onChange('deadline', e.target.value)} className="text-xs" />
</div>
<Separator className="my-4" />
<div className="space-y-2">
<Label htmlFor="maxRooms" className="text-xs">Pièces max</Label>
<Select value={maxRooms?.toString() || ''} onValueChange={(v) => onChange('maxRooms', v ? Number(v) : undefined)}>
<SelectTrigger className="text-xs"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
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
<Label htmlFor="minRent" className="text-xs">Loyer min</Label>
<Input id="minRent" type="text" value={minRent ? `CHF ${formatCurrency(minRent)}` : 'à déterminer'} readOnly className="bg-slate-100 text-slate-600 cursor-not-allowed text-xs" />
</div>
</CardContent>
</Card>
)
}

export default DatesCard