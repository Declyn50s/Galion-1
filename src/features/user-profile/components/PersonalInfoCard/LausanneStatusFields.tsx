import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LAUSANNE_STATUS_OPTIONS as LAUS } from '@/types/user'


interface Props {
value?: string
date?: string
onChange: (field: 'lausanneStatus' | 'lausanneStatusDate', value: any) => void
}


const LausanneStatusFields: React.FC<Props> = ({ value, date, onChange }) => {
return (
<>
<div className="space-y-2">
<Label htmlFor="lausanneStatus">Via</Label>
<Select value={value || ''} onValueChange={(v) => onChange('lausanneStatus', v)}>
<SelectTrigger>
<SelectValue placeholder="Sélectionner..." />
</SelectTrigger>
<SelectContent>
{LAUS.map((s) => (
<SelectItem key={s} value={s}>
{s}
</SelectItem>
))}
</SelectContent>
</Select>
</div>
{value && value !== 'Conditions étudiantes' && (
<div className="space-y-2">
<Label htmlFor="lausanneStatusDate">Date {value === 'Arrivé à Lausanne' ? "d'arrivée" : 'de retour'}</Label>
<Input id="lausanneStatusDate" type="date" value={date || ''} onChange={(e) => onChange('lausanneStatusDate', e.target.value)} />
</div>
)}
</>
)
}

export default LausanneStatusFields