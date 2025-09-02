import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Building, Phone, Mail, FileCheck, MessageSquare } from 'lucide-react'
import { INTERACTION_TYPES } from '@/types/interaction'

interface Props {
  onClick: (type: keyof typeof INTERACTION_TYPES) => void
}

const InteractionBar: React.FC<Props> = ({ onClick }) => (
  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
    <CardContent className="pt-6">
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          variant="outline"
          className="gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
          onClick={() => onClick('guichet')}
        >
          <Building className="h-4 w-4" /> Guichet
        </Button>

        <Button
          variant="outline"
          className="gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
          onClick={() => onClick('telephone')}
        >
          <Phone className="h-4 w-4" /> Téléphone
        </Button>

        <Button
          variant="outline"
          className="gap-2 bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
          onClick={() => onClick('courrier')}
        >
          <Mail className="h-4 w-4" /> Courrier
        </Button>

        <Button
          variant="outline"
          className="gap-2 bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
          onClick={() => onClick('email')}
        >
          <Mail className="h-4 w-4" /> E-mail
        </Button>

        <Button
          variant="outline"
          className="gap-2 bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700"
          onClick={() => onClick('jaxform')}
        >
          <FileCheck className="h-4 w-4" /> Jaxform
        </Button>

        <Button
          variant="outline"
          className="gap-2 bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700"
          onClick={() => onClick('commentaire')}
        >
          <MessageSquare className="h-4 w-4" /> Commentaire
        </Button>
      </div>
    </CardContent>
  </Card>
)

export default InteractionBar