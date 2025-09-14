// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import Journal from "./pages/journal/Journal";
import { UsersPage } from "./pages/user/UsersPage";
import { UserProfilePage } from "@/features/user-profile";
import TenantProfilePage from "@/features/tenant/TenantProfilePage";
import { Memento } from "./pages/memo/Memento";
import HousingPage from "./pages/housing/HousingPage";
import LlmVacantList from "./pages/housing/LlmVacantList";
import GerancesList from "./pages/housing/GerancesList";
import ImmeublesList from "./pages/housing/ImmeublesList";
import TasksPage from "@/pages/tasks/TasksPage";
import SessionPage from "./pages/session/SessionPage";
import TeamMeetingsList from "./pages/session/TeamMeetingsList";
import RecoursReclamationsList from "./pages/session/RecoursReclamationsList";
import DerogationsList from "./pages/session/DerogationsList";
import DerogationsPV from "./pages/session/DerogationsPV";

import AgendaPage from "./pages/agenda/AgendaPage";
import Convocation from "./pages/agenda/Convocation";
import Planning from "./pages/agenda/Planning";
import Vacances from "./pages/agenda/Vacances";

import { ReportsPage } from "@/pages/reports/ReportsPage";

import { Toaster } from "@/components/ui/toaster";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout parent pour toute l'app */}
        <Route element={<Layout />}>
          {/* / -> /users */}
          <Route index element={<Navigate to="/users" replace />} />

          {/* Détail usager */}
          <Route path="/users/:userId" element={<UserProfilePage />} />
          <Route path="/tenants/:userId" element={<TenantProfilePage />} />

          {/* Pages simples */}
          <Route path="/users" element={<UsersPage />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/memo" element={<Memento />} />
          <Route path="/tasks" element={<TasksPage />} />

          {/* Agenda + sous-pages */}
          <Route path="/agenda" element={<AgendaPage />}>
            <Route index element={<Navigate to="convocation" replace />} />
            <Route path="convocation" element={<Convocation />} />
            <Route path="planning" element={<Planning />} />
            <Route path="vacances" element={<Vacances />} />
          </Route>

          {/* Statistiques / Rapports */}
          <Route path="/reports/*" element={<ReportsPage />} />

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

          {/* 404 */}
          <Route path="*" element={<div className="p-6">Page non trouvée</div>} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
