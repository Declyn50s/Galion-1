import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Vacances: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Vacances</h2>
      <Card>
        <CardHeader><CardTitle>Gestion des vacances</CardTitle></CardHeader>
        <CardContent>
          <p className="text-slate-600">Périodes d’absence, validation, visibilité planning.</p>
        </CardContent>
      </Card>
    </div>
  );
};
export default Vacances;
