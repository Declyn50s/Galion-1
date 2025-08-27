import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'


interface Props {
hasCurator: boolean
curatorName?: string
curatorAddress?: string
curatorPhone?: string
curatorEmail?: string
onChange: (field: any, value: any) => void
}


const CuratorSection: React.FC<Props> = ({ hasCurator, curatorName, curatorAddress, curatorPhone, curatorEmail, onChange }) => {
return (
<div className="space-y-4">
<div className="flex items-center space-x-2">
<Checkbox id="hasCurator" checked={hasCurator} onCheckedChange={(c) => onChange('hasCurator', c)} />
<Label htmlFor="hasCurator">A un curateur</Label>
</div>
{hasCurator && (
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
<div className="space-y-2">
<Label htmlFor="curatorName">Nom du curateur</Label>
<Input id="curatorName" value={curatorName || ''} onChange={(e) => onChange('curatorName', e.target.value)} />
</div>
<div className="space-y-2">
<Label htmlFor="curatorAddress">Adresse du curateur</Label>
<Input id="curatorAddress" value={curatorAddress || ''} onChange={(e) => onChange('curatorAddress', e.target.value)} />
</div>
<div className="space-y-2">
<Label htmlFor="curatorPhone">Téléphone du curateur</Label>
<Input id="curatorPhone" value={curatorPhone || ''} onChange={(e) => onChange('curatorPhone', e.target.value)} />
</div>
<div className="space-y-2">
<Label htmlFor="curatorEmail">Email du curateur</Label>
<Input id="curatorEmail" type="email" value={curatorEmail || ''} onChange={(e) => onChange('curatorEmail', e.target.value)} />
</div>
</div>
)}
</div>
)
}

export default CuratorSection