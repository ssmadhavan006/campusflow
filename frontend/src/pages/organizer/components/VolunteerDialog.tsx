import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Alert,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export interface Volunteer {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface VolunteerDialogProps {
  open: boolean;
  onClose: () => void;
  event: { id: string; title: string } | null;
  volunteers: Volunteer[];
  onAddVolunteer: (email: string) => Promise<boolean>;
  onRemoveVolunteer: (userId: string) => Promise<boolean>;
}

export const VolunteerDialog: React.FC<VolunteerDialogProps> = ({
  open,
  onClose,
  event,
  volunteers,
  onAddVolunteer,
  onRemoveVolunteer,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!email.trim()) return;
    setError(null);
    setSuccess(null);
    try {
      const ok = await onAddVolunteer(email);
      if (ok) {
        setSuccess('Volunteer successfully assigned.');
        setEmail('');
      } else {
        setError('Failed to assign volunteer.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error assigning volunteer.');
    }
  };

  const handleRemove = async (userId: string) => {
    setError(null);
    setSuccess(null);
    try {
      const ok = await onRemoveVolunteer(userId);
      if (ok) {
        setSuccess('Volunteer successfully removed.');
      } else {
        setError('Failed to remove volunteer.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error removing volunteer.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        Manage Volunteers - {event?.title}
      </DialogTitle>
      <DialogContent>
        <Box display="flex" gap={1} mb={3} mt={1}>
          <TextField
            fullWidth
            size="small"
            label="Volunteer Email"
            variant="outlined"
            placeholder="e.g. volunteer@campusflow.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button variant="contained" onClick={handleAdd}>
            Assign
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Currently Assigned Volunteers
        </Typography>
        <Divider sx={{ mb: 1 }} />
        {volunteers.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No volunteers assigned to this event.</Typography>
        ) : (
          <List>
            {volunteers.map((v) => (
              <ListItem key={v.id} disablePadding sx={{ py: 0.5 }}>
                <ListItemText primary={v.user.name} secondary={v.user.email} />
                <ListItemSecondaryAction>
                  <IconButton edge="end" aria-label="delete" onClick={() => handleRemove(v.user.id)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
