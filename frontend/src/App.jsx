import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GroupsPage   from './pages/GroupsPage';
import GroupDetail  from './pages/GroupDetail';
import ExpensesPage from './pages/ExpensesPage';
import ImportPage   from './pages/ImportPage';
import AnomalyPage  from './pages/AnomalyPage';
import BalancePage  from './pages/BalancePage';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index           element={<Navigate to="/groups" replace />} />
          <Route path="groups"   element={<GroupsPage />} />
          <Route path="groups/:groupId"          element={<GroupDetail />} />
          <Route path="groups/:groupId/expenses" element={<ExpensesPage />} />
          <Route path="groups/:groupId/import"   element={<ImportPage />} />
          <Route path="groups/:groupId/import/:batchId/anomalies" element={<AnomalyPage />} />
          <Route path="groups/:groupId/balances" element={<BalancePage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
