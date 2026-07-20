import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Group as ClubIcon,
  PersonAdd as MemberAddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExitToApp as LeaveIcon,
} from '@mui/icons-material';

interface Club {
  id: string;
  name: string;
  description?: string;
  createdBy: { name: string; email: string };
  _count: { members: number; events: number };
}

interface ClubMember {
  id: string;
  clubId: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const Clubs: React.FC = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState('STUDENT');

  const [searchQuery, setSearchQuery] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editClub, setEditClub] = useState<Club | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const handleOpenEdit = (club: Club) => {
    setEditClub(club);
    setEditName(club.name);
    setEditDescription(club.description || '');
    setEditError(null);
    setEditOpen(true);
  };

  const handleEditClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditLoading(true);
    try {
      await api.put(`/clubs/${editClub!.id}`, { name: editName, description: editDescription });
      setEditOpen(false);
      fetchClubs();
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update club.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    if (!window.confirm('Are you sure you want to delete this department? All events associated with it will remain.')) return;
    try {
      await api.delete(`/clubs/${clubId}`);
      fetchClubs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete club.');
    }
  };

  const handleLeaveClub = async (clubId: string) => {
    if (!window.confirm('Are you sure you want to leave this department?')) return;
    try {
      await api.delete(`/clubs/${clubId}/leave`);
      alert('Successfully left the club.');
      fetchClubs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to leave club.');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/clubs/${selectedClub!.id}/members/${userId}`);
      setInviteSuccess('Member successfully removed.');
      const res = await api.get(`/clubs/${selectedClub!.id}`);
      setMembers(res.data.data.club.members);
      fetchClubs(); // update counts
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  const handleUpdateMemberRole = async (userId: string, newRole: string) => {
    try {
      await api.put(`/clubs/${selectedClub!.id}/members/${userId}`, { role: newRole });
      setInviteSuccess('Member role successfully updated.');
      const res = await api.get(`/clubs/${selectedClub!.id}`);
      setMembers(res.data.data.club.members);
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to update member role.');
    }
  };


  const fetchClubs = async () => {
    try {
      const res = await api.get('/clubs');
      setClubs(res.data.data.clubs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      await api.post('/clubs', { name, description });
      setCreateOpen(false);
      setName('');
      setDescription('');
      fetchClubs();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create club.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenMembers = async (club: Club) => {
    setSelectedClub(club);
    setInviteError(null);
    setInviteSuccess(null);
    setInviteEmail('');
    try {
      const res = await api.get(`/clubs/${club.id}`);
      setMembers(res.data.data.club.members);
      setMembersOpen(true);
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to load department members.');
    }
  };

  const handleAddMember = async () => {
    if (!inviteEmail) return;
    setInviteError(null);
    setInviteSuccess(null);

    try {
      await api.post(`/clubs/${selectedClub!.id}/join`, { email: inviteEmail, role: inviteRole });
      setInviteSuccess('Member successfully added!');
      setInviteEmail('');
      
      const res = await api.get(`/clubs/${selectedClub!.id}`);
      setMembers(res.data.data.club.members);
    } catch (err: any) {
      setInviteError(err.response?.data?.message || err.message || 'Failed to add member.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Academic Departments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Browse active departments, check member lists, or create new organizing bodies.
          </Typography>
        </Box>
        {['ADMIN', 'HOD'].includes(user?.role || '') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Create Department
          </Button>
        )}
      </Box>

      <Box mb={3}>
        <TextField
          fullWidth
          size="small"
          label="Search Departments"
          variant="outlined"
          placeholder="Search by department name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Box>

      {clubs.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">No departments have been registered yet.</Typography>
        </Box>
      ) : (() => {
        const filteredClubs = clubs.filter(
          (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        if (filteredClubs.length === 0) {
          return (
            <Box textAlign="center" py={6}>
              <Typography color="text.secondary">No departments match your search query.</Typography>
            </Box>
          );
        }

        return (
          <Grid container spacing={3}>
            {filteredClubs.map((club) => (
              <Grid item xs={12} sm={6} md={4} key={club.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                      <Box p={1} sx={{ bgcolor: 'rgba(161, 161, 170, 0.15)', borderRadius: 2, color: 'text.primary', display: 'flex' }}>
                        <ClubIcon />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {club.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph sx={{ height: 45, overflow: 'hidden' }}>
                      {club.description || 'No description provided.'}
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="caption" color="text.secondary" display="block">
                      Leader: {club.createdBy.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Members: {club._count.members} | Events: {club._count.events}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button fullWidth variant="outlined" onClick={() => handleOpenMembers(club)}>
                      Manage Members
                    </Button>
                    <Box display="flex" width="100%" gap={1}>
                      {(user?.role === 'ADMIN' || club.createdBy.email.toLowerCase() === user?.email.toLowerCase()) && (
                        <>
                          <Button fullWidth size="small" variant="outlined" color="primary" onClick={() => handleOpenEdit(club)} startIcon={<EditIcon />}>
                            Edit
                          </Button>
                          <Button fullWidth size="small" variant="outlined" color="error" onClick={() => handleDeleteClub(club.id)} startIcon={<DeleteIcon />}>
                            Delete
                          </Button>
                        </>
                      )}
                      {(() => {
                        const isCreator = club.createdBy.email.toLowerCase() === user?.email.toLowerCase();
                        const isMember = user?.clubMembers?.some((cm: { clubId: string; role: string }) => cm.clubId === club.id);
                        if (isMember && !isCreator) {
                          return (
                            <Button fullWidth size="small" variant="outlined" color="warning" onClick={() => handleLeaveClub(club.id)} startIcon={<LeaveIcon />}>
                              Leave
                            </Button>
                          );
                        }
                        return null;
                      })()}
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        );
      })()}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create New Department</DialogTitle>
        <form onSubmit={handleCreateClub}>
          <DialogContent>
            {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
            <TextField
              fullWidth
              label="Department Name"
              margin="dense"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createLoading}
            />
            <TextField
              fullWidth
              label="Description"
              margin="dense"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createLoading}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)} disabled={createLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={createLoading}>
              {createLoading ? <CircularProgress size={24} color="inherit" /> : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Department Details</DialogTitle>
        <form onSubmit={handleEditClub}>
          <DialogContent>
            {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
            <TextField
              fullWidth
              label="Department Name"
              margin="dense"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={editLoading}
            />
            <TextField
              fullWidth
              label="Description"
              margin="dense"
              multiline
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              disabled={editLoading}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)} disabled={editLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={editLoading}>
              {editLoading ? <CircularProgress size={24} color="inherit" /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={membersOpen} onClose={() => setMembersOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Department Directory - {selectedClub?.name}
        </DialogTitle>
        <DialogContent>
          {(() => {
            const isRequesterLeader = members.some((m) => m.user.email.toLowerCase() === user?.email.toLowerCase() && (m.role === 'HOD' || m.role === 'FACULTY'));
            const isRequesterCoordinator = selectedClub?.createdBy.email.toLowerCase() === user?.email.toLowerCase() || user?.role === 'ADMIN';
            const canAddMembers = isRequesterCoordinator || isRequesterLeader;

            return (
              <>
                {canAddMembers && (
                  <Box display="flex" flexDirection="column" gap={1.5} mb={3} mt={1}>
                    <Box display="flex" gap={1}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Student Email to Add"
                        variant="outlined"
                        placeholder="e.g. student@campusflow.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Role</InputLabel>
                        <Select
                          value={inviteRole}
                          label="Role"
                          onChange={(e) => setInviteRole(e.target.value)}
                        >
                          <MenuItem value="STUDENT">Student</MenuItem>
                          {isRequesterCoordinator && <MenuItem value="FACULTY">Faculty</MenuItem>}
                          {isRequesterCoordinator && <MenuItem value="HOD">HOD</MenuItem>}
                        </Select>
                      </FormControl>
                      <Button variant="contained" startIcon={<MemberAddIcon />} onClick={handleAddMember}>
                        Add
                      </Button>
                    </Box>
                  </Box>
                )}

                {inviteError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setInviteError(null)}>{inviteError}</Alert>}
                {inviteSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInviteSuccess(null)}>{inviteSuccess}</Alert>}

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Members List
                </Typography>
                <Divider sx={{ mb: 1 }} />
                {members.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No members in this department yet.</Typography>
                ) : (
                  <List>
                    {members.map((m) => {
                      const isMemberCoordinator = selectedClub?.createdBy.email.toLowerCase() === m.user.email.toLowerCase();
                      return (
                        <ListItem
                          key={m.id}
                          secondaryAction={
                            canAddMembers && !isMemberCoordinator ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Select
                                  size="small"
                                  value={m.role}
                                  onChange={(e) => handleUpdateMemberRole(m.user.id, e.target.value)}
                                  sx={{ minWidth: 120 }}
                                >
                                  <MenuItem value="STUDENT">Student</MenuItem>
                                  {isRequesterCoordinator && <MenuItem value="FACULTY">Faculty</MenuItem>}
                                  {isRequesterCoordinator && <MenuItem value="HOD">HOD</MenuItem>}
                                </Select>
                                <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveMember(m.user.id)}>
                                  <DeleteIcon color="error" />
                                </IconButton>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                                {m.role}
                              </Typography>
                            )
                          }
                          sx={{ py: 0.5 }}
                        >
                          <ListItemText primary={m.user.name} secondary={m.user.email} />
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
