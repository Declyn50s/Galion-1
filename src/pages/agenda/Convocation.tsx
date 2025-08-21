import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Convocation: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Convocation</h2>
      <Card>
        <CardHeader><CardTitle>Convocations des usagers</CardTitle></CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Préparez et envoyez les convocations (modèles, listes, exports…)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
export default Convocation;
