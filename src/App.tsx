// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Journal from './pages/Journal';
import { UsersPage } from './pages/UsersPage';
import { Memento } from './pages/Memento';

import HousingPage from './pages/housing/HousingPage';
import LlmVacantList from './pages/housing/LlmVacantList';
import GerancesList from './pages/housing/GerancesList';
import ImmeublesList from './pages/housing/ImmeublesList';

import SessionPage from './pages/session/SessionPage';
import TeamMeetingsList from './pages/session/TeamMeetingsList';
import RecoursReclamationsList from './pages/session/RecoursReclamationsList';
import DerogationsList from './pages/session/DerogationsList';
import DerogationsPV from './pages/session/DerogationsPV';

import AgendaPage from './pages/agenda/AgendaPage';
import Convocation from './pages/agenda/Convocation';
import Planning from './pages/agenda/Planning';
import Vacances from './pages/agenda/Vacances';

import { Toaster } from '@/components/ui/toaster';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/users" replace />} />
          <Route path="/users" element={<UsersPage />} />

          <Route path="/journal" element={<Journal />} />

          {/* Agenda + sous-pages */}
          <Route path="/agenda" element={<AgendaPage />}>
          <Route index element={<Navigate to="convocation" replace />} />
          <Route path="convocation" element={<Convocation />} />
          <Route path="planning" element={<Planning />} />
          <Route path="vacances" element={<Vacances />} />
          </Route>

          {/* Séances + sous-pages */}
          <Route path="/session" element={<SessionPage />}>
            <Route index element={<Navigate to="equipe" replace />} />
            <Route path="equipe" element={<TeamMeetingsList />} />
            <Route path="recours" element={<RecoursReclamationsList />} />
            <Route path="derogations" element={<DerogationsList />} />
            <Route path="derogations/:id/pv" element={<DerogationsPV />} />
          </Route>

          {/* Logements + sous-pages */}
          <Route path="/housing" element={<HousingPage />}>
            <Route index element={<Navigate to="llm-vacant" replace />} />
            <Route path="llm-vacant" element={<LlmVacantList />} />
            <Route path="gerances" element={<GerancesList />} />
            <Route path="immeubles" element={<ImmeublesList />} />
          </Route>

          <Route path="/memo" element={<Memento />} />

          <Route path="*" element={<div className="p-6">Page non trouvée</div>} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
