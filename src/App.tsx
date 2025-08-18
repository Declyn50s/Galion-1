import React from 'react';
import { Layout } from './components/layout/Layout';
import { UsersPage } from './pages/UsersPage';
import './App.css';

function App() {
  return (
    <Layout defaultSection="users">
      <UsersPage />
    </Layout>
  );
}

export default App;