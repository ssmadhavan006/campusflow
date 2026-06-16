import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Assignment as ODIcon,
} from '@mui/icons-material';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: number;
  location: string;
  status: string;
  club: { name: string };
  organizer: { name: string };
}

export const FacultyDashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

  const [actionOpen, setActionOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data.data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenAction = (event: Event) => {
    setSelectedEvent(event);
    setComments('');
    setAlert(null);
    setActionOpen(true);
  };

  const handleReview = async (approved: boolean) => {
    if (!selectedEvent) return;
    setActionLoading(true);
    setAlert(null);

    try {
      await api.post(`/events/${selectedEvent.id}/approve`, {
        approved,
        comments: comments || undefined,
      });
      setActionOpen(false);
      fetchEvents();
    } catch (err: any) {
      setAlert({ type: 'error', text: err.response?.data?.message || 'Failed to submit review.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveOD = async (event: Event) => {
    setLoading(true);
    try {
      await api.post(`/od/approve-event/${event.id}`);
      fetchEvents();
    } catch (err: any) {
      window.alert(err.response?.data?.message || 'Failed to approve OD generation.');
    } finally {
      setLoading(false);
    }
  };

  const pendingApprovalEvents = events.filter((e) => e.status === 'PENDING_APPROVAL');
  const pendingODEvents = events.filter((e) => e.status === 'ATTENDANCE_VERIFIED' || e.status === 'COMPLETED');

  if (loading) {
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
          Faculty Coordinator Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and approve submitted draft events or approve OD generation requests for completed events.
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} aria-label="Faculty coordination tasks">
          <Tab label={`Event Approvals (${pendingApprovalEvents.length})`} />
          <Tab label={`On-Duty Requisitions (${pendingODEvents.length})`} />
        </Tabs>
      </Box>

      {tabIndex === 0 && (
        <Box>
          {pendingApprovalEvents.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No events pending approval at this time.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {pendingApprovalEvents.map((event) => (
                <Grid item xs={12} key={event.id}>
                  <Card>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {event.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
                          Club: {event.club.name} | Organizer: {event.organizer.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Date: {new Date(event.date).toLocaleString()} | Venue: {event.location}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ApproveIcon />}
                        onClick={() => handleOpenAction(event)}
                      >
                        Review Request
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {tabIndex === 1 && (
        <Box>
          {pendingODEvents.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No OD requisitions pending approval.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {pendingODEvents.map((event) => (
                <Grid item xs={12} key={event.id}>
                  <Card>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {event.title}
                          </Typography>
                          <Chip label={event.status} color="secondary" size="small" />
                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
                          Club: {event.club.name} | Organizer: {event.organizer.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Date: {new Date(event.date).toLocaleDateString()} | Duration: {event.duration} minutes
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<ODIcon />}
                        onClick={() => handleApproveOD(event)}
                      >
                        Approve OD Generation
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      <Dialog open={actionOpen} onClose={() => setActionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 'bold' }}>
          Review Event: {selectedEvent?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>
            Description
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
            {selectedEvent?.description}
          </Typography>

          {alert && <Alert severity={alert.type} sx={{ mb: 2 }}>{alert.text}</Alert>}

          <TextField
            fullWidth
            label="Comments (Optional for approval, required for rejection)"
            multiline
            rows={3}
            variant="outlined"
            size="small"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            disabled={actionLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => handleReview(false)}
            variant="outlined"
            color="error"
            startIcon={<RejectIcon />}
            disabled={actionLoading || !comments}
          >
            Reject
          </Button>
          <Button
            onClick={() => handleReview(true)}
            variant="contained"
            color="primary"
            startIcon={<ApproveIcon />}
            disabled={actionLoading}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
