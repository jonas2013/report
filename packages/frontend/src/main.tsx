import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AppLayout } from './components/Layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { WriteReportPage } from './pages/reports/WriteReportPage';
import { MyReportsPage } from './pages/reports/MyReportsPage';
import { ProjectListPage } from './pages/projects/ProjectListPage';
import { NewProjectPage } from './pages/projects/NewProjectPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { ProjectReportsPage } from './pages/projects/ProjectReportsPage';
import { ProjectStatsPage } from './pages/projects/ProjectStatsPage';
import { ProjectSettingsPage } from './pages/projects/ProjectSettingsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { UserManagePage } from './pages/admin/UserManagePage';
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { ProfilePage } from './pages/auth/ProfilePage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="reports/my" element={<MyReportsPage />} />
          <Route path="reports/write" element={<WriteReportPage />} />
          <Route path="projects" element={<ProjectListPage />} />
          <Route path="projects/new" element={<NewProjectPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />}>
            <Route path="reports" element={<ProjectReportsPage />} />
            <Route path="stats" element={<ProjectStatsPage />} />
            <Route path="settings" element={<ProjectSettingsPage />} />
          </Route>
          <Route path="projects/:projectId/reports/write" element={<WriteReportPage />} />
          <Route path="admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="admin/projects" element={<ProtectedRoute requiredRole="ADMIN"><AdminProjectsPage /></ProtectedRoute>} />
          <Route path="admin/reports" element={<ProtectedRoute requiredRole="ADMIN"><AdminReportsPage /></ProtectedRoute>} />
          <Route path="admin/users" element={<ProtectedRoute requiredRole="ADMIN"><UserManagePage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
