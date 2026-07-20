import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { Snackbar } from '@mui/material';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

  const [actionOpen, setActionOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Custom Confirmations
  const [regenerateAllConfirmOpen, setRegenerateAllConfirmOpen] = useState(false);
  const [regeneratingEventId, setRegeneratingEventId] = useState<string | null>(null);
  const [revokeSingleConfirmOpen, setRevokeSingleConfirmOpen] = useState(false);
  const [revokingVerificationId, setRevokingVerificationId] = useState<string | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  const triggerToast = (message: string, severity: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
  };

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
      triggerToast('On-Duty letters approved successfully.', 'success');
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to approve OD generation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [odListOpen, setOdListOpen] = useState(false);
  const [odEvent, setOdEvent] = useState<Event | null>(null);
  const [odRegistrations, setOdRegistrations] = useState<any[]>([]);
  const [odListLoading, setOdListLoading] = useState(false);

  const handleOpenODList = async (event: Event) => {
    setOdEvent(event);
    setOdListOpen(true);
    setOdListLoading(true);
    try {
      const res = await api.get(`/registrations/event/${event.id}`);
      const attended = res.data.data.registrations.filter((r: any) => r.attendance);
      setOdRegistrations(attended);
    } catch (err) {
      console.error(err);
    } finally {
      setOdListLoading(false);
    }
  };

  const handleRegenerateEventOD = (eventId: string) => {
    setRegeneratingEventId(eventId);
    setRegenerateAllConfirmOpen(true);
  };

  const executeRegenerateEventOD = async () => {
    if (!regeneratingEventId) return;
    setRegenerateAllConfirmOpen(false);
    setLoading(true);
    try {
      await api.post(`/od/event/${regeneratingEventId}/regenerate`);
      triggerToast('All OD letters regenerated successfully.', 'success');
      if (odEvent) {
        handleOpenODList(odEvent);
      }
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to regenerate OD letters.', 'error');
    } finally {
      setLoading(false);
      setRegeneratingEventId(null);
    }
  };

  const handleRegenerateSingleOD = async (verificationId: string) => {
    try {
      await api.post(`/od/regenerate/${verificationId}`);
      triggerToast('OD letter regenerated successfully.', 'success');
      if (odEvent) handleOpenODList(odEvent);
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to regenerate OD letter.', 'error');
    }
  };

  const handleRevokeSingleOD = (verificationId: string) => {
    setRevokingVerificationId(verificationId);
    setRevokeSingleConfirmOpen(true);
  };

  const executeRevokeSingleOD = async () => {
    if (!revokingVerificationId) return;
    setRevokeSingleConfirmOpen(false);
    try {
      await api.post(`/od/revoke/${revokingVerificationId}`);
      triggerToast('OD letter revoked successfully.', 'success');
      if (odEvent) handleOpenODList(odEvent);
    } catch (err: any) {
      triggerToast(err.response?.data?.message || 'Failed to revoke OD letter.', 'error');
    } finally {
      setRevokingVerificationId(null);
    }
  };

  const handleDownloadOD = async (verificationId: string, studentName: string) => {
    try {
      const res = await api.get(`/od/download/${verificationId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `OD_${studentName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to download OD letter.', 'error');
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
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
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
                      <Box display="flex" gap={1}>
                        {event.status === 'COMPLETED' ? (
                          <>
                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={<ODIcon />}
                              onClick={() => handleOpenODList(event)}
                            >
                              Manage OD Letters
                            </Button>
                            <Button
                              variant="outlined"
                              color="secondary"
                              onClick={() => handleRegenerateEventOD(event.id)}
                            >
                              Regenerate All
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<ODIcon />}
                            onClick={() => handleApproveOD(event)}
                          >
                            Approve OD Generation
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      <Dialog open={actionOpen} onClose={() => setActionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
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

      <Dialog open={odListOpen} onClose={() => setOdListOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          On-Duty Letter Management - {odEvent?.title}
        </DialogTitle>
        <DialogContent>
          {odListLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : odRegistrations.length === 0 ? (
            <Typography color="text.secondary" p={2}>
              No students checked in for this event (no attendance scans).
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Roll Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Verification ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>OD Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {odRegistrations.map((reg) => {
                    const od = reg.odLetter;
                    return (
                      <TableRow key={reg.id}>
                        <TableCell>{reg.student.name}</TableCell>
                        <TableCell>{reg.student.email}</TableCell>
                        <TableCell>{reg.student.rollNumber || 'N/A'}</TableCell>
                        <TableCell>
                          {od ? (
                            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {od.verificationId}
                            </Typography>
                          ) : (
                            'Not generated'
                          )}
                        </TableCell>
                        <TableCell>
                          {od ? (
                            <Chip
                              label={od.revoked ? 'Revoked' : 'Active'}
                              color={od.revoked ? 'error' : 'success'}
                              size="small"
                            />
                          ) : (
                            <Chip label="Pending" color="warning" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            {od && !od.revoked && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleDownloadOD(od.verificationId, reg.student.name)}
                              >
                                Download
                              </Button>
                            )}
                            {od ? (
                              <>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="secondary"
                                  onClick={() => handleRegenerateSingleOD(od.verificationId)}
                                >
                                  Regenerate
                                </Button>
                                {!od.revoked && (user?.role === 'HOD' || user?.role === 'ADMIN') && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleRevokeSingleOD(od.verificationId)}
                                  >
                                    Revoke
                                  </Button>
                                )}
                              </>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No Actions
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOdListOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={regenerateAllConfirmOpen}
        title="Regenerate All OD Letters"
        message="Are you sure you want to regenerate all On-Duty letters for this event?"
        onConfirm={executeRegenerateEventOD}
        onCancel={() => {
          setRegenerateAllConfirmOpen(false);
          setRegeneratingEventId(null);
        }}
        severity="warning"
        confirmText="Regenerate All"
      />

      <ConfirmationDialog
        open={revokeSingleConfirmOpen}
        title="Revoke OD Letter"
        message="Are you sure you want to revoke this student's OD letter?"
        onConfirm={executeRevokeSingleOD}
        onCancel={() => {
          setRevokeSingleConfirmOpen(false);
          setRevokingVerificationId(null);
        }}
        severity="error"
        confirmText="Revoke OD"
      />

      {/* Toast Notification */}
      <Snackbar
        open={!!toastMessage}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setToastMessage(null)} severity={toastSeverity} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
