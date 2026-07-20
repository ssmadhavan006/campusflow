import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  IconButton,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  CheckCircle as AttendanceIcon,
  Send as SubmitIcon,
  PersonAdd as VolunteerIcon,
  HourglassEmpty as WaitlistIcon,
  AttachMoney as MoneyIcon,
  GetApp as DownloadIcon,
  SupervisorAccount as CoHostIcon,
  BarChart as AnalyticsIcon,
  Campaign as CampaignIcon,
} from '@mui/icons-material';

import { RegistrantsDialog, Registrant } from './components/RegistrantsDialog';
import { AttendanceDialog, AttendanceRecord } from './components/AttendanceDialog';
import { VolunteerDialog, Volunteer } from './components/VolunteerDialog';
import { CoHostDialog, CoHost } from './components/CoHostDialog';
import { AnalyticsDialog } from './components/AnalyticsDialog';
import { AnnouncementsDialog, Announcement } from './components/AnnouncementsDialog';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  status: string;
  remainingSeats: number;
  capacity: number;
  club: { name: string };
  _count: { registrations: number; attendance: number };
  waitlistCount?: number;
  revenueCollected?: number;
  revenuePending?: number;
}

export const OrganizerDashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [registrantsOpen, setRegistrantsOpen] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [volunteerOpen, setVolunteerOpen] = useState(false);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [coHostOpen, setCoHostOpen] = useState(false);
  const [coHosts, setCoHosts] = useState<CoHost[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [processingPaymentIds, setProcessingPaymentIds] = useState<Set<string>>(new Set());
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);

  // Confirmation/Revoke states
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [revokingAttendanceId, setRevokingAttendanceId] = useState<string | null>(null);

  // Alert stats
  const [alertText, setAlertText] = useState<string | null>(null);
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'info'>('info');
  const [statusError, setStatusError] = useState<string | null>(null);

  const triggerAlert = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setAlertText(message);
    setAlertSeverity(severity);
  };

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events?onlyManage=true');
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

  // Live updates: while the registrants or attendance dialog is open for an
  // event, join its socket room so scans/registrations reflect instantly.
  useEffect(() => {
    if (!activeEvent || (!registrantsOpen && !attendanceOpen)) return;

    const eventId = activeEvent.id;
    const socket = getSocket();

    socket.emit('event:join', eventId);

    const handleAttendanceNew = (record: AttendanceRecord & { eventId: string }) => {
      if (record.eventId !== eventId) return;
      setAttendance((prev) => (prev.some((a) => a.id === record.id) ? prev : [record, ...prev]));
    };

    const refetchRegistrants = async () => {
      try {
        const res = await api.get(`/registrations/event/${eventId}`);
        setRegistrants(res.data.data.registrations);
      } catch (err) {
        console.error(err);
      }
    };

    const handleRegistrationUpdate = (payload: { eventId: string }) => {
      if (payload.eventId !== eventId) return;
      refetchRegistrants();
      fetchEvents();
    };

    socket.on('attendance:new', handleAttendanceNew);
    socket.on('registration:update', handleRegistrationUpdate);

    return () => {
      socket.off('attendance:new', handleAttendanceNew);
      socket.off('registration:update', handleRegistrationUpdate);
      socket.emit('event:leave', eventId);
    };
  }, [activeEvent, registrantsOpen, attendanceOpen]);

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    setStatusError(null);
    try {
      await api.put(`/events/${eventId}/status`, { status: newStatus });
      fetchEvents();
    } catch (err: any) {
      setStatusError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleSubmitForApproval = async (eventId: string) => {
    setStatusError(null);
    try {
      await api.post(`/events/${eventId}/submit`);
      fetchEvents();
    } catch (err: any) {
      setStatusError(err.response?.data?.message || 'Failed to submit event.');
    }
  };

  const handleViewRegistrants = async (event: Event) => {
    setActiveEvent(event);
    try {
      const res = await api.get(`/registrations/event/${event.id}`);
      setRegistrants(res.data.data.registrations);
      setRegistrantsOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyPayment = async (regId: string, reference: string, status: 'PAID' | 'FAILED') => {
    setProcessingPaymentIds(prev => new Set(prev).add(regId));
    try {
      await api.post(`/registrations/${regId}/verify-payment`, {
        reference,
        status,
      });
      if (activeEvent) {
        const res = await api.get(`/registrations/event/${activeEvent.id}`);
        setRegistrants(res.data.data.registrations);
      }
      fetchEvents();
      triggerAlert(`Payment reference ${status === 'PAID' ? 'approved' : 'rejected'}.`, 'success');
    } catch (err: any) {
      triggerAlert(err.response?.data?.message || 'Failed to verify payment.', 'error');
    } finally {
      setProcessingPaymentIds(prev => {
        const next = new Set(prev);
        next.delete(regId);
        return next;
      });
    }
  };

  const handleViewAttendance = async (event: Event) => {
    setActiveEvent(event);
    try {
      const res = await api.get(`/attendance/event/${event.id}`);
      setAttendance(res.data.data.attendance);
      setAttendanceOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeScan = (attendanceId: string) => {
    setRevokingAttendanceId(attendanceId);
    setRevokeConfirmOpen(true);
  };

  const executeRevokeScan = async () => {
    if (!revokingAttendanceId) return;
    setRevokeConfirmOpen(false);
    try {
      await api.delete(`/attendance/revoke/${revokingAttendanceId}`);
      triggerAlert("Attendance check-in successfully revoked.", "success");
      if (activeEvent) {
        const res = await api.get(`/attendance/event/${activeEvent.id}`);
        setAttendance(res.data.data.attendance || []);
      }
      fetchEvents();
    } catch (err: any) {
      triggerAlert(err.response?.data?.message || "Failed to revoke attendance.", "error");
    } finally {
      setRevokingAttendanceId(null);
    }
  };

  const handleViewAnalytics = async (event: Event) => {
    setActiveEvent(event);
    setAnalyticsOpen(true);
    setAnalyticsLoading(true);
    setAnalyticsData(null);
    try {
      const res = await api.get(`/events/${event.id}/analytics`);
      setAnalyticsData(res.data.data.analytics);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleExportCSV = async (type: 'registrations' | 'attendance') => {
    try {
      const response = await api.get(`/events/${activeEvent!.id}/export/${type}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event_${activeEvent!.id}_${type}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      triggerAlert(`Successfully exported ${type} CSV.`, 'success');
    } catch (err: any) {
      triggerAlert(err.response?.data?.message || 'Failed to export CSV.', 'error');
    }
  };

  const handleOpenVolunteers = async (event: Event) => {
    setActiveEvent(event);
    try {
      const res = await api.get(`/events/${event.id}`);
      setVolunteers(res.data.data.event.volunteers || []);
      setVolunteerOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAnnouncements = async (event: Event) => {
    setActiveEvent(event);
    setAnnouncementsOpen(true);
    setAnnouncementsLoading(true);
    try {
      const res = await api.get(`/events/${event.id}/announcements`);
      setAnnouncementsList(res.data.data.announcements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const handlePostAnnouncement = async (content: string): Promise<boolean> => {
    try {
      const res = await api.post(`/events/${activeEvent!.id}/announcements`, { content });
      setAnnouncementsList(prev => [res.data.data.announcement, ...prev]);
      triggerAlert('Announcement successfully posted and sent to all registrants!', 'success');
      return true;
    } catch (err: any) {
      triggerAlert(err.response?.data?.message || 'Failed to post announcement.', 'error');
      return false;
    }
  };

  const handleAddVolunteer = async (email: string): Promise<boolean> => {
    await api.post(`/attendance/events/${activeEvent!.id}/volunteers`, { email });
    const eventDetail = await api.get(`/events/${activeEvent!.id}`);
    setVolunteers(eventDetail.data.data.event.volunteers || []);
    return true;
  };

  const handleRemoveVolunteer = async (userId: string): Promise<boolean> => {
    await api.delete(`/attendance/events/${activeEvent!.id}/volunteers/${userId}`);
    const res = await api.get(`/events/${activeEvent!.id}`);
    setVolunteers(res.data.data.event.volunteers || []);
    return true;
  };

  const handleOpenCoHosts = async (event: Event) => {
    setActiveEvent(event);
    try {
      const res = await api.get(`/events/${event.id}`);
      setCoHosts(res.data.data.event.coHosts || []);
      setCoHostOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCoHost = async (email: string): Promise<boolean> => {
    await api.post(`/events/${activeEvent!.id}/co-hosts`, { email });
    const eventDetail = await api.get(`/events/${activeEvent!.id}`);
    setCoHosts(eventDetail.data.data.event.coHosts || []);
    return true;
  };

  const handleDownloadConsolidatedOD = async (eventId: string) => {
    setDownloading(eventId);
    try {
      const res = await api.get(`/od/event/${eventId}/consolidated`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `consolidated_od_${eventId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      triggerAlert('Consolidated OD Letter downloaded successfully.', 'success');
    } catch (err: any) {
      console.error('Failed to download consolidated OD letter', err);
      triggerAlert('Failed to download consolidated OD letter. Please try again.', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'PENDING_APPROVAL':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'ONGOING':
        return 'primary';
      case 'COMPLETED':
        return 'secondary';
      case 'ATTENDANCE_VERIFIED':
        return 'success';
      case 'OD_GENERATED':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const totalRegistrations = events.reduce((sum, e) => sum + (e._count?.registrations || 0), 0);
  const totalRevenue = events.reduce((sum, e) => sum + (e.revenueCollected || 0), 0);
  const totalWaitlisted = events.reduce((sum, e) => sum + (e.waitlistCount || 0), 0);
  const totalCheckedIn = events.reduce((sum, e) => sum + (e._count?.attendance || 0), 0);
  const attendanceRate = totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Organizer Event Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your draft events, track registration orders, assign check-in volunteers, and submit attendance reports.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} component={Link} to="/create-event">
          Create Event
        </Button>
      </Box>

      {/* Statistics Dashboard Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(161, 161, 170, 0.05)', border: '1px solid rgba(161, 161, 170, 0.15)', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Total Registered
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {totalRegistrations}
                </Typography>
                <Box sx={{ color: 'text.primary', p: 1, bgcolor: 'rgba(161, 161, 170, 0.15)', borderRadius: 2, display: 'flex' }}>
                  <PeopleIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Total Revenue
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  ₹{totalRevenue.toFixed(2)}
                </Typography>
                <Box sx={{ color: 'success.main', p: 1, bgcolor: 'rgba(16, 185, 129, 0.1)', borderRadius: 2, display: 'flex' }}>
                  <MoneyIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Waitlisted Students
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {totalWaitlisted}
                </Typography>
                <Box sx={{ color: 'warning.main', p: 1, bgcolor: 'rgba(245, 158, 11, 0.1)', borderRadius: 2, display: 'flex' }}>
                  <WaitlistIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(161, 161, 170, 0.05)', border: '1px solid rgba(161, 161, 170, 0.15)', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Check-in Rate
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {attendanceRate}%
                </Typography>
                <Box sx={{ color: 'text.primary', p: 1, bgcolor: 'rgba(161, 161, 170, 0.15)', borderRadius: 2, display: 'flex' }}>
                  <AttendanceIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {statusError && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setStatusError(null)}>{statusError}</Alert>}

      {events.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">You have not created any events yet.</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Event Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Club</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Capacity</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Registrations</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Revenue</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Attendance</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => {
                const eventRegsCount = event._count?.registrations || 0;
                const eventWaitlistCount = event.waitlistCount || 0;
                const eventCheckedInCount = event._count?.attendance || 0;
                const eventRevenue = event.revenueCollected || 0;
                const attendancePercent = eventRegsCount > 0 ? Math.round((eventCheckedInCount / eventRegsCount) * 100) : 0;

                return (
                  <TableRow key={event.id}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{event.title}</TableCell>
                    <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                    <TableCell>{event.club.name}</TableCell>
                    <TableCell>{event.capacity}</TableCell>
                    <TableCell>
                      {eventRegsCount} registered
                      {eventWaitlistCount > 0 && (
                        <Typography variant="caption" display="block" color="warning.main">
                          ({eventWaitlistCount} waitlisted)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: eventRevenue > 0 ? 'success.main' : 'text.secondary' }}>
                      {eventRevenue > 0 ? `₹${eventRevenue.toFixed(2)}` : 'Free'}
                    </TableCell>
                    <TableCell>
                      {eventCheckedInCount} scanned
                      {eventRegsCount > 0 && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          ({attendancePercent}% rate)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={event.status} color={getStatusColor(event.status) as any} size="small" />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        {event.status === 'DRAFT' && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<SubmitIcon />}
                            onClick={() => handleSubmitForApproval(event.id)}
                          >
                            Submit
                          </Button>
                        )}

                        {event.status === 'APPROVED' && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleStatusChange(event.id, 'ONGOING')}
                          >
                            Start
                          </Button>
                        )}

                        {event.status === 'ONGOING' && (
                          <Button
                            variant="outlined"
                            size="small"
                            color="secondary"
                            onClick={() => handleStatusChange(event.id, 'COMPLETED')}
                          >
                            Complete
                          </Button>
                        )}

                        {event.status === 'COMPLETED' && (
                          <Button
                            variant="contained"
                            size="small"
                            color="success"
                            onClick={() => handleStatusChange(event.id, 'ATTENDANCE_VERIFIED')}
                          >
                            Submit Report
                          </Button>
                        )}

                        {['APPROVED', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED', 'ATTENDANCE_VERIFIED', 'OD_GENERATED'].includes(event.status) && (
                          <>
                            <Tooltip title="View Registrants">
                              <IconButton color="primary" aria-label={`View registrants for ${event.title}`} onClick={() => handleViewRegistrants(event)}>
                                <PeopleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Checked-In Attendance">
                              <IconButton color="success" aria-label={`View checked-in attendance for ${event.title}`} onClick={() => handleViewAttendance(event)}>
                                <AttendanceIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Assign Volunteers">
                              <IconButton color="warning" aria-label={`Assign volunteers for ${event.title}`} onClick={() => handleOpenVolunteers(event)}>
                                <VolunteerIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Event Analytics">
                              <IconButton color="info" aria-label={`View analytics for ${event.title}`} onClick={() => handleViewAnalytics(event)}>
                                <AnalyticsIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}

                        <Tooltip title="Manage Co-Hosts">
                          <IconButton color="info" aria-label={`Manage co-hosts for ${event.title}`} onClick={() => handleOpenCoHosts(event)}>
                            <CoHostIcon />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Post Announcement">
                          <IconButton color="secondary" aria-label={`Post announcement for ${event.title}`} onClick={() => handleOpenAnnouncements(event)}>
                            <CampaignIcon />
                          </IconButton>
                        </Tooltip>

                        {event.status === 'OD_GENERATED' && (
                          <Tooltip title="Download Consolidated OD">
                            <IconButton
                              color="secondary"
                              aria-label={`Download consolidated OD for ${event.title}`}
                              onClick={() => handleDownloadConsolidatedOD(event.id)}
                              disabled={downloading === event.id}
                            >
                              {downloading === event.id ? <CircularProgress size={20} /> : <DownloadIcon />}
                            </IconButton>
                          </Tooltip>
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

      {/* Decomposed Dialog Components */}
      <RegistrantsDialog
        open={registrantsOpen}
        onClose={() => setRegistrantsOpen(false)}
        event={activeEvent}
        registrants={registrants}
        onVerifyPayment={handleVerifyPayment}
        processingPaymentIds={processingPaymentIds}
      />

      <AttendanceDialog
        open={attendanceOpen}
        onClose={() => setAttendanceOpen(false)}
        event={activeEvent}
        attendance={attendance}
        onRevokeAttendance={handleRevokeScan}
      />

      <VolunteerDialog
        open={volunteerOpen}
        onClose={() => setVolunteerOpen(false)}
        event={activeEvent}
        volunteers={volunteers}
        onAddVolunteer={handleAddVolunteer}
        onRemoveVolunteer={handleRemoveVolunteer}
      />

      <CoHostDialog
        open={coHostOpen}
        onClose={() => setCoHostOpen(false)}
        event={activeEvent}
        coHosts={coHosts}
        onAddCoHost={handleAddCoHost}
      />

      <AnalyticsDialog
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        event={activeEvent}
        analyticsData={analyticsData}
        analyticsLoading={analyticsLoading}
        onExportCSV={handleExportCSV}
      />

      <AnnouncementsDialog
        open={announcementsOpen}
        onClose={() => setAnnouncementsOpen(false)}
        event={activeEvent}
        announcementsList={announcementsList}
        announcementsLoading={announcementsLoading}
        onPostAnnouncement={handlePostAnnouncement}
      />

      {/* Revoke check-in confirmation */}
      <ConfirmationDialog
        open={revokeConfirmOpen}
        title="Revoke Attendance Scan"
        message="Are you sure you want to revoke this student's attendance check-in record?"
        onConfirm={executeRevokeScan}
        onCancel={() => {
          setRevokeConfirmOpen(false);
          setRevokingAttendanceId(null);
        }}
        severity="error"
        confirmText="Revoke"
      />

      {/* Premium alert toasts */}
      <Snackbar
        open={!!alertText}
        autoHideDuration={4000}
        onClose={() => setAlertText(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setAlertText(null)} severity={alertSeverity} sx={{ width: '100%' }}>
          {alertText}
        </Alert>
      </Snackbar>
    </Box>
  );
};
