import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
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
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  QrCodeScanner as QrCodeIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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

const getActionColor = (action: string) => {
  const act = action.toUpperCase();
  if (act.includes('DELETE') || act.includes('REVOKE') || act.includes('CANCEL')) return 'error';
  if (act.includes('CREATE') || act.includes('REGISTER') || act.includes('APPROVE') || act.includes('PROMOTE')) return 'success';
  if (act.includes('LOGIN') || act.includes('LOGOUT')) return 'info';
  if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('ROTATE')) return 'warning';
  return 'default';
};

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User creation states
  const [createOpen, setCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createName, setCreateName] = useState('');
  const [createRole, setCreateRole] = useState('STUDENT');
  const [createRollNumber, setCreateRollNumber] = useState('');
  const [createDepartment, setCreateDepartment] = useState('');
  const [createClass, setCreateClass] = useState('');
  const [createSection, setCreateSection] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // CSV Import states
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // Pagination & Search States
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersSearch, setUsersSearch] = useState('');
  
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const limit = 10;

  const fetchUsers = async (page = 1, search = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
      setUsers(res.data.data.users);
      setUsersTotal(res.data.data.total || 0);
      setUsersPage(res.data.data.page || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/audit-logs?page=${page}&limit=${limit}`);
      setAuditLogs(res.data.data.auditLogs);
      setLogsTotal(res.data.data.total || 0);
      setLogsPage(res.data.data.page || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data.stats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch system metrics.');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return setImportError('Please select a CSV file.');
    setImportLoading(true);
    setImportError(null);
    setImportSuccess(null);

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await api.post('/admin/users/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportSuccess(`Import successful! ${res.data.data.createdCount} accounts created.`);
      setImportFile(null);
      fetchUsers(1, usersSearch);
    } catch (err: any) {
      setImportError(err.response?.data?.message || 'Failed to import CSV.');
    } finally {
      setImportLoading(false);
    }
  };

  useEffect(() => {
    if (tabIndex === 0) {
      fetchUsers(1, usersSearch);
    } else if (tabIndex === 1) {
      fetchLogs(1);
    } else if (tabIndex === 2) {
      fetchStats();
    }
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    setCreateLoading(true);
    try {
      await api.post('/admin/users', {
        email: createEmail,
        password: createPassword,
        name: createName,
        role: createRole,
        rollNumber: createRollNumber || null,
        department: createDepartment || null,
        class: createClass || null,
        section: createSection || null,
      });
      setCreateSuccess('User account successfully created.');
      setCreateEmail('');
      setCreatePassword('');
      setCreateName('');
      setCreateRole('STUDENT');
      setCreateRollNumber('');
      setCreateDepartment('');
      setCreateClass('');
      setCreateSection('');
      fetchUsers(1, usersSearch);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create user account.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      alert('You cannot delete your own admin account.');
      return;
    }
    if (!window.confirm('Are you sure you want to permanently delete this user account? This action is irreversible.')) return;
    setError(null);
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers(usersPage, usersSearch);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user account.');
    }
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
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
          <Tab label="System Stats" />
        </Tabs>
      </Box>

      {tabIndex === 0 && (
        <Box>
          <Box display="flex" gap={1.5} mb={3} alignItems="center">
            <TextField
              label="Search Users"
              variant="outlined"
              size="small"
              value={usersSearch}
              onChange={(e) => setUsersSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchUsers(1, usersSearch); }}
              placeholder="Search by name or email..."
              sx={{ flexGrow: 1, maxWidth: 400 }}
            />
            <Button variant="contained" onClick={() => fetchUsers(1, usersSearch)}>
              Search
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              color="secondary"
              onClick={() => {
                setCreateOpen(true);
                setCreateError(null);
                setCreateSuccess(null);
              }}
              sx={{ mr: 1 }}
            >
              Create User
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setImportOpen(true);
                setImportError(null);
                setImportSuccess(null);
              }}
            >
              Bulk Import (CSV)
            </Button>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Credentials</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>System Role</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
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
                              <MenuItem value="HOD">Head of Department (HOD)</MenuItem>
                              <MenuItem value="ADMIN">Administrator</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            disabled={u.id === user?.id}
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {usersTotal > limit && (
                <Box display="flex" justifyContent="center" mt={3} gap={1}>
                  <Button
                    variant="outlined"
                    disabled={usersPage <= 1}
                    onClick={() => fetchUsers(usersPage - 1, usersSearch)}
                  >
                    Previous
                  </Button>
                  <Box display="flex" alignItems="center" px={2}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Page {usersPage} of {Math.ceil(usersTotal / limit)}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    disabled={usersPage >= Math.ceil(usersTotal / limit)}
                    onClick={() => fetchUsers(usersPage + 1, usersSearch)}
                  >
                    Next
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      {tabIndex === 1 && (
        <Box>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : (
            <>
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
                          <Chip label={log.action} size="small" color={getActionColor(log.action) as any} sx={{ fontWeight: 600 }} />
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

              {logsTotal > limit && (
                <Box display="flex" justifyContent="center" mt={3} gap={1}>
                  <Button
                    variant="outlined"
                    disabled={logsPage <= 1}
                    onClick={() => fetchLogs(logsPage - 1)}
                  >
                    Previous
                  </Button>
                  <Box display="flex" alignItems="center" px={2}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Page {logsPage} of {Math.ceil(logsTotal / limit)}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    disabled={logsPage >= Math.ceil(logsTotal / limit)}
                    onClick={() => fetchLogs(logsPage + 1)}
                  >
                    Next
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      {tabIndex === 2 && (
        <Box>
          {statsLoading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : !stats ? (
            <Alert severity="warning">No statistical data found.</Alert>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{
                  borderLeft: '4px solid #3b82f6',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography color="text.secondary" variant="subtitle2" sx={{ fontWeight: 600 }}>Total Registered Users</Typography>
                      <PeopleIcon sx={{ color: '#3b82f6', opacity: 0.8 }} />
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, letterSpacing: '-0.02em' }}>
                      {stats.users.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Students: <strong>{stats.users.students}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Faculty: <strong>{stats.users.faculty}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      HODs: <strong>{stats.users.hods}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Admins: <strong>{stats.users.admins}</strong>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{
                  borderLeft: '4px solid #10b981',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography color="text.secondary" variant="subtitle2" sx={{ fontWeight: 600 }}>Event Catalog Metrics</Typography>
                      <EventIcon sx={{ color: '#10b981', opacity: 0.8 }} />
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, letterSpacing: '-0.02em' }}>
                      {stats.events.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Approved: <strong>{stats.events.approved}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ongoing: <strong>{stats.events.ongoing}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed: <strong>{stats.events.completed}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Approval: <strong>{stats.events.pending}</strong>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{
                  borderLeft: '4px solid #f59e0b',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography color="text.secondary" variant="subtitle2" sx={{ fontWeight: 600 }}>Student Registrations</Typography>
                      <AssignmentIcon sx={{ color: '#f59e0b', opacity: 0.8 }} />
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, letterSpacing: '-0.02em' }}>
                      {stats.registrations.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active seats: <strong>{stats.registrations.active}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending payment: <strong>{stats.registrations.pending}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Waitlisted: <strong>{stats.registrations.waitlisted}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cancelled: <strong>{stats.registrations.cancelled}</strong>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{
                  borderLeft: '4px solid #ec4899',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography color="text.secondary" variant="subtitle2" sx={{ fontWeight: 600 }}>Attendance Records</Typography>
                      <QrCodeIcon sx={{ color: '#ec4899', opacity: 0.8 }} />
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, letterSpacing: '-0.02em' }}>
                      {stats.attendance.scans}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verified Check-ins: <strong>{stats.attendance.scans}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      System Audit Trails: <strong>{logsTotal} logs</strong>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Graphical Visualizations */}
              <Grid item xs={12} md={6}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      User Role Distribution
                    </Typography>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Students', value: stats.users.students },
                              { name: 'Faculty', value: stats.users.faculty },
                              { name: 'HODs', value: stats.users.hods },
                              { name: 'Admins', value: stats.users.admins },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {['#0088FE', '#00C49F', '#FFBB28', '#FF8042'].map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <ChartTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Registration Status Summary
                    </Typography>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Active', count: stats.registrations.active },
                          { name: 'Pending', count: stats.registrations.pending },
                          { name: 'Waitlisted', count: stats.registrations.waitlisted },
                          { name: 'Cancelled', count: stats.registrations.cancelled },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <ChartTooltip />
                          <Legend />
                          <Bar dataKey="count" name="Registrations" fill="#00C49F" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      )}
      {/* Create User Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create New User Account</DialogTitle>
        <form onSubmit={handleCreateUser}>
          <DialogContent>
            {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
            {createSuccess && <Alert severity="success" sx={{ mb: 2 }}>{createSuccess}</Alert>}

            <TextField
              fullWidth
              label="Full Name"
              required
              margin="dense"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              required
              margin="dense"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              required
              margin="dense"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
            />

            <FormControl fullWidth margin="dense">
              <InputLabel id="role-select-label">System Role</InputLabel>
              <Select
                labelId="role-select-label"
                value={createRole}
                label="System Role"
                onChange={(e) => setCreateRole(e.target.value as string)}
              >
                <MenuItem value="STUDENT">Student</MenuItem>
                <MenuItem value="FACULTY">Faculty</MenuItem>
                <MenuItem value="HOD">Head of Department (HOD)</MenuItem>
                <MenuItem value="ADMIN">Administrator</MenuItem>
              </Select>
            </FormControl>

            {createRole === 'STUDENT' && (
              <>
                <TextField
                  fullWidth
                  label="Roll Number"
                  margin="dense"
                  value={createRollNumber}
                  onChange={(e) => setCreateRollNumber(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Department"
                  margin="dense"
                  value={createDepartment}
                  onChange={(e) => setCreateDepartment(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Class"
                  placeholder="e.g. III CSE"
                  margin="dense"
                  value={createClass}
                  onChange={(e) => setCreateClass(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Section"
                  placeholder="e.g. A"
                  margin="dense"
                  value={createSection}
                  onChange={(e) => setCreateSection(e.target.value)}
                />
              </>
            )}

            {(createRole === 'FACULTY' || createRole === 'HOD') && (
              <TextField
                fullWidth
                label="Department"
                margin="dense"
                value={createDepartment}
                onChange={(e) => setCreateDepartment(e.target.value)}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={createLoading}>
              {createLoading ? <CircularProgress size={24} /> : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Bulk Import Users via CSV</DialogTitle>
        <form onSubmit={handleBulkImport}>
          <DialogContent>
            {importError && <Alert severity="error" sx={{ mb: 2 }}>{importError}</Alert>}
            {importSuccess && <Alert severity="success" sx={{ mb: 2 }}>{importSuccess}</Alert>}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Select a CSV file containing user accounts to create. The file should have a header row with columns:
              <br />
              <code>name, email, password, role, rollNumber, department, class, section</code>
              <br /><br />
              * <strong>role</strong> values must be one of: <code>STUDENT, FACULTY, HOD, ADMIN</code>.
            </Typography>

            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ p: 3, borderStyle: 'dashed' }}
            >
              {importFile ? importFile.name : 'Choose CSV File'}
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={handleFileChange}
              />
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setImportOpen(false)} disabled={importLoading}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={importLoading || !importFile}>
              {importLoading ? <CircularProgress size={24} /> : 'Import'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
