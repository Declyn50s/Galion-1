import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
permit?: string
value?: string
onChange: (v: string) => void
}

const PermitExpiryField: React.FC<Props> = ({ permit, value, onChange }) => {
if (!(permit === 'Permis B' || permit === 'Permis F')) return null
return (
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="space-y-2">
<Label htmlFor="permitExpiryDate">Échéance de permis</Label>
<Input id="permitExpiryDate" type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} />
</div>
</div>
)
}

export default PermitExpiryField