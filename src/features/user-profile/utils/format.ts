export const formatCurrency = (amount?: number) => {
if (amount == null) return ''
return amount.toLocaleString('fr-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}


export const formatDateCH = (iso?: string) => {
if (!iso) return ''
const d = new Date(iso)
if (Number.isNaN(d.getTime())) return ''
return d.toLocaleDateString('fr-CH')
}


export const calcAge = (iso?: string) => {
if (!iso) return ''
const now = new Date()
const dob = new Date(iso)
if (Number.isNaN(dob.getTime())) return ''
const diff = now.getTime() - dob.getTime()
return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}