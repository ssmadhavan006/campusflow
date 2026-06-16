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
} from '@mui/material';
import { Add as AddIcon, Group as ClubIcon, PersonAdd as MemberAddIcon } from '@mui/icons-material';

interface Club {
  id: string;
  name: string;
  description?: string;
  createdBy: { name: string; email: string };
  _count: { members: number; events: number };
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
  const [members, setMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState('MEMBER');

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
    } catch (err) {
      console.error(err);
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
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, fontFamily: '"Outfit", sans-serif' }}>
            Campus Clubs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Browse active clubs, check member lists, or create new organizing bodies.
          </Typography>
        </Box>
        {['ADMIN', 'FACULTY'].includes(user?.role || '') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Create Club
          </Button>
        )}
      </Box>

      {clubs.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">No clubs have been registered yet.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {clubs.map((club) => (
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
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button fullWidth variant="outlined" onClick={() => handleOpenMembers(club)}>
                    Manage Members
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 'bold' }}>Create New Club</DialogTitle>
        <form onSubmit={handleCreateClub}>
          <DialogContent>
            {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
            <TextField
              fullWidth
              label="Club Name"
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

      <Dialog open={membersOpen} onClose={() => setMembersOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 'bold' }}>
          Club Directory - {selectedClub?.name}
        </DialogTitle>
        <DialogContent>
          {(() => {
            const isRequesterLeader = members.some((m) => m.user.email.toLowerCase() === user?.email.toLowerCase() && m.role === 'LEADER');
            const isRequesterCoordinator = selectedClub?.createdBy.email.toLowerCase() === user?.email.toLowerCase() || user?.role === 'ADMIN';
            const canAddMembers = isRequesterCoordinator || isRequesterLeader;
            if (!canAddMembers) return null;

            return (
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
                      <MenuItem value="MEMBER">Member</MenuItem>
                      {isRequesterCoordinator && <MenuItem value="LEADER">Leader</MenuItem>}
                      {isRequesterCoordinator && <MenuItem value="CO_LEADER">Co-Leader</MenuItem>}
                    </Select>
                  </FormControl>
                  <Button variant="contained" startIcon={<MemberAddIcon />} onClick={handleAddMember}>
                    Add
                  </Button>
                </Box>
              </Box>
            );
          })()}

          {inviteError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setInviteError(null)}>{inviteError}</Alert>}
          {inviteSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInviteSuccess(null)}>{inviteSuccess}</Alert>}

          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Members List
          </Typography>
          <Divider sx={{ mb: 1 }} />
          {members.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No members in this club yet.</Typography>
          ) : (
            <List>
              {members.map((m) => (
                <ListItem key={m.id} disablePadding sx={{ py: 0.5 }}>
                  <ListItemText primary={m.user.name} secondary={`${m.user.email} | Role: ${m.role}`} />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
