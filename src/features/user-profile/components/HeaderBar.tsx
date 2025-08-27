import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Save, Copy } from 'lucide-react'


interface Props {
isApplicant: boolean
isTenant: boolean
onSave: () => void
onAttestation: () => void
onCopyAddress: () => void
}


const HeaderBar: React.FC<Props> = ({ isApplicant, isTenant, onSave, onAttestation, onCopyAddress }) => {
return (
<div className="flex justify-between items-center">
<div className="flex gap-3">
<Badge variant={isApplicant ? 'destructive' : 'secondary'} className="px-3 py-1.5 text-sm font-medium">
Demandeur
</Badge>
<Badge variant={isTenant ? 'default' : 'outline'} className="px-3 py-1.5 text-sm font-medium">
Locataire
</Badge>
</div>
<div className="flex gap-3">
<Button variant="outline" className="gap-2" onClick={onAttestation}>
<FileText className="h-4 w-4" /> Attestation
</Button>
<Button variant="outline" className="gap-2" onClick={onCopyAddress}>
<Copy className="h-4 w-4" /> Copier adresse
</Button>
<Button className="gap-2" onClick={onSave}>
<Save className="h-4 w-4" /> Enregistrer
</Button>
</div>
</div>
)
}

export default HeaderBar