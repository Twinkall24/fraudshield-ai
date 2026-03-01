import { useAuth } from '../contexts/AuthContext';

export const useRole = () => {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isAnalyst = user?.role === 'analyst';
  const isViewer = user?.role === 'viewer';

  const canModifyAlerts = isAdmin || isAnalyst;
  const canApproveTransactions = isAdmin;
  const canUseDemoMode = isAdmin;
  const canManageUsers = isAdmin;

  return {
    role: user?.role,
    isAdmin,
    isAnalyst,
    isViewer,
    canModifyAlerts,
    canApproveTransactions,
    canUseDemoMode,
    canManageUsers,
  };
};