// src/pages/housing/LlmVacantList.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const data = [
  { adresse: 'Rue du Lac 3', npa: '1007', ville:'Lausanne', type:'2.5p', surface:'55 m²', loyer:'CHF 1’450.–', dispo:'01.10.2025' },
  { adresse: 'Av. du Rhône 24', npa: '1200', ville:'Genève',  type:'3.5p', surface:'72 m²', loyer:'CHF 1’980.–', dispo:'15.09.2025' },
];

const LlmVacantList: React.FC = () => (
  <Card>
    <CardContent className="p-4 overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-100 uppercase text-xs text-gray-600">
          <tr>
            <th className="p-2">Adresse</th>
            <th className="p-2">NPA</th>
            <th className="p-2">Ville</th>
            <th className="p-2">Type</th>
            <th className="p-2">Surface</th>
            <th className="p-2">Loyer</th>
            <th className="p-2">Disponibilité</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td className="p-2">{r.adresse}</td>
              <td className="p-2">{r.npa}</td>
              <td className="p-2">{r.ville}</td>
              <td className="p-2">{r.type}</td>
              <td className="p-2">{r.surface}</td>
              <td className="p-2">{r.loyer}</td>
              <td className="p-2">{r.dispo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardContent>
  </Card>
);

export default LlmVacantList;
