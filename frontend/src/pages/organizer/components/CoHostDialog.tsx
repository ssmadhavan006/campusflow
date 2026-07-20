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
} from '@mui/material';

export interface CoHost {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface CoHostDialogProps {
  open: boolean;
  onClose: () => void;
  event: { id: string; title: string } | null;
  coHosts: CoHost[];
  onAddCoHost: (email: string) => Promise<boolean>;
}

export const CoHostDialog: React.FC<CoHostDialogProps> = ({
  open,
  onClose,
  event,
  coHosts,
  onAddCoHost,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!email.trim()) return;
    setError(null);
    setSuccess(null);
    try {
      const ok = await onAddCoHost(email);
      if (ok) {
        setSuccess('Co-host successfully assigned.');
        setEmail('');
      } else {
        setError('Failed to assign co-host.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error assigning co-host.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        Manage Co-Hosts - {event?.title}
      </DialogTitle>
      <DialogContent>
        <Box display="flex" gap={1} mb={3} mt={1}>
          <TextField
            fullWidth
            size="small"
            label="Co-Host Email"
            variant="outlined"
            placeholder="e.g. faculty@campusflow.com"
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
          Currently Assigned Co-Hosts
        </Typography>
        <Divider sx={{ mb: 1 }} />
        {coHosts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No co-hosts assigned to this event.</Typography>
        ) : (
          <List>
            {coHosts.map((ch) => (
              <ListItem key={ch.id} disablePadding sx={{ py: 0.5 }}>
                <ListItemText primary={ch.user.name} secondary={ch.user.email} />
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
