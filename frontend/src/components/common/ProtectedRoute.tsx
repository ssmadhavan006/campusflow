import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  allowedRoles?: ('STUDENT' | 'FACULTY' | 'HOD' | 'ADMIN')[];
  requireClubOrganizer?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, requireClubOrganizer }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress color="primary" size={50} />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requireClubOrganizer) {
    const isClubOrganizer = user.clubMembers && user.clubMembers.length > 0;
    const isPrivileged = ['ADMIN', 'FACULTY', 'HOD'].includes(user.role);
    if (!isPrivileged && !(user.role === 'STUDENT' && isClubOrganizer)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};
