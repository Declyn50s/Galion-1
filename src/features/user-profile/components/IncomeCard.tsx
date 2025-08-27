import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '../utils/format'

interface Props {
individualIncome: number
householdIncome: number
}

const IncomeCard: React.FC<Props> = ({ individualIncome, householdIncome }) => (
<Card className="col-span-1 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
<CardHeader className="pb-3">
<CardTitle className="text-sm font-semibold text-slate-800">💰 Revenus</CardTitle>
</CardHeader>
<CardContent className="space-y-4">
<div className="space-y-2">
<Label htmlFor="individualIncome" className="text-xs">Individuel</Label>
<Input id="individualIncome" type="text" value={`CHF ${formatCurrency(individualIncome)}`} readOnly className="bg-slate-100 text-slate-600 cursor-not-allowed text-xs" />
</div>
<div className="space-y-2">
<Label htmlFor="householdIncome" className="text-xs">Ménage</Label>
<Input id="householdIncome" type="text" value={`CHF ${formatCurrency(householdIncome)}`} readOnly className="bg-slate-100 text-slate-600 cursor-not-allowed text-xs" />
</div>
</CardContent>
</Card>
)

export default IncomeCard