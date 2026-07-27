import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/ui/toaster';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ModelsPage } from './pages/ModelsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ConnectPage } from './pages/ConnectPage';
import { LogsPage } from './pages/LogsPage';
import { HealthPage } from './pages/HealthPage';
import { ProvidersPage } from './pages/ProvidersPage';
import { MCPPage } from './pages/MCPPage';
import { RoutingPage } from './pages/RoutingPage';
import { UsersPage } from './pages/UsersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { LivePage } from './pages/LivePage';
import { AgentsPage } from './pages/AgentsPage';
import { CommandPalette } from './components/ui/command-palette';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/models" element={<ModelsPage />} />
              <Route path="/providers" element={<ProvidersPage />} />
              <Route path="/mcp" element={<MCPPage />} />
              <Route path="/routing" element={<RoutingPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/live" element={<LivePage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/connect" element={<ConnectPage />} />
              <Route path="/claude-code" element={<ConnectPage />} />
              <Route path="/health" element={<HealthPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
        <CommandPalette />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
