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

          {/* Séances + sous-pages */}
          <Route path="/session" element={<SessionPage />}>
            <Route index element={<Navigate to="/session/equipe" replace />} />
            <Route path="equipe" element={<TeamMeetingsList />} />
            <Route path="recours" element={<RecoursReclamationsList />} />
            <Route path="derogation" element={<DerogationsList />} />
            </Route>

          {/* Logements + sous-pages */}
          <Route path="/housing" element={<HousingPage />}>
            <Route index element={<Navigate to="/housing/llm-vacant" replace />} />
            <Route path="llm-vacant" element={<LlmVacantList />} />
            <Route path="gerances" element={<GerancesList />} />
            <Route path="immeubles" element={<ImmeublesList />} />
          </Route>
          <Route path="/memo" element={<Memento />} />

          <Route path="*" element={<div className="p-6">Page non trouvée</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}