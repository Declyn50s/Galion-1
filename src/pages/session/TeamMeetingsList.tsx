import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const data = [
  { date: '02.09.2025', heure: '09:00', sujet: "Suivi dossiers Q3", animateur: 'C. Dupont', lieu: 'Salle A', statut: 'Planifiée' },
  { date: '16.09.2025', heure: '09:00', sujet: "Onboarding stagiaires", animateur: 'M. Rossi', lieu: 'Salle B', statut: 'Brouillon' },
];

const TeamMeetingsList: React.FC = () => (
  <Card>
    <CardContent className="p-4 overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-100 uppercase text-xs text-gray-600">
          <tr>
            <th className="p-2">Date</th>
            <th className="p-2">Heure</th>
            <th className="p-2">Sujet</th>
            <th className="p-2">Animateur</th>
            <th className="p-2">Lieu</th>
            <th className="p-2">Statut</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td className="p-2">{r.date}</td>
              <td className="p-2">{r.heure}</td>
              <td className="p-2">{r.sujet}</td>
              <td className="p-2">{r.animateur}</td>
              <td className="p-2">{r.lieu}</td>
              <td className="p-2">{r.statut}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardContent>
  </Card>
);

export default TeamMeetingsList;
