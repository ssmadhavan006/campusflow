import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Alert,
  Chip,
} from '@mui/material';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  rollNumber?: string;
  department?: string;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  metadata?: any;
  user?: {
    name: string;
    email: string;
  };
}

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tabIndex === 0) {
        const res = await api.get('/admin/users');
        setUsers(res.data.data.users);
      } else {
        const res = await api.get('/admin/audit-logs');
        setAuditLogs(res.data.data.auditLogs);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch administrator data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tabIndex]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setError(null);
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  if (loading && users.length === 0 && auditLogs.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, fontFamily: '"Outfit", sans-serif' }}>
          Platform Administration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor system actions, manage account permissions, adjust security roles, and view access audit trails.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} aria-label="Admin tasks">
          <Tab label="User Roles" />
          <Tab label="Audit Logs" />
        </Tabs>
      </Box>

      {tabIndex === 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Credentials</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>System Role</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    {u.rollNumber ? `${u.rollNumber} (${u.department || 'N/A'})` : u.department || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as string)}
                      >
                        <MenuItem value="STUDENT">Student</MenuItem>
                        <MenuItem value="FACULTY">Faculty</MenuItem>
                        <MenuItem value="ADMIN">Administrator</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Entity Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Entity ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Metadata</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.user?.name || 'System / Anonymous'}</TableCell>
                  <TableCell>
                    <Chip label={log.action} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>{log.entityType}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.entityId || 'N/A'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.metadata ? JSON.stringify(log.metadata) : 'None'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
