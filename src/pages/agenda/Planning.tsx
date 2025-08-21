import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Planning: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Planning</h2>
      <Card>
        <CardHeader><CardTitle>Planning des rendez-vous</CardTitle></CardHeader>
        <CardContent>
          <p className="text-slate-600">Vue planning / créneaux / ressources.</p>
        </CardContent>
      </Card>
    </div>
  );
};
export default Planning;
