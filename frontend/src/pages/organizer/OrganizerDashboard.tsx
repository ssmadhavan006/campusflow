import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  IconButton,
  Divider,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  CheckCircle as AttendanceIcon,
  Send as SubmitIcon,
  PersonAdd as VolunteerIcon,
  HourglassEmpty as WaitlistIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';

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
  registrations?: any[];
}
export const OrganizerDashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [registrants, setRegistrants] = useState<any[]>([]);
  const [registrantsOpen, setRegistrantsOpen] = useState(false);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [volunteerOpen, setVolunteerOpen] = useState(false);
  const [volunteers, setVolunteers] = useState<any[]>([]);

  // Input states
  const [volunteerEmail, setVolunteerEmail] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [volunteerError, setVolunteerError] = useState<string | null>(null);
  const [volunteerSuccess, setVolunteerSuccess] = useState<string | null>(null);

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

  const handleOpenVolunteers = async (event: Event) => {
    setActiveEvent(event);
    setVolunteerError(null);
    setVolunteerSuccess(null);
    setVolunteerEmail('');
    try {
      const res = await api.get(`/events/${event.id}`);
      setVolunteers(res.data.data.event.volunteers || []);
      setVolunteerOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddVolunteer = async () => {
    if (!volunteerEmail) return;
    setVolunteerError(null);
    setVolunteerSuccess(null);

    try {
      await api.post(`/attendance/events/${activeEvent!.id}/volunteers`, { email: volunteerEmail });
      setVolunteerSuccess('Volunteer successfully assigned.');
      setVolunteerEmail('');
      // Reload volunteers
      const eventDetail = await api.get(`/events/${activeEvent!.id}`);
      setVolunteers(eventDetail.data.data.event.volunteers || []);
    } catch (err: any) {
      setVolunteerError(err.response?.data?.message || err.message || 'Failed to assign volunteer.');
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
        <CircularProgress />
      </Box>
    );
  }

  const totalRegistrations = events.reduce((sum, e) => sum + (e._count?.registrations || 0), 0);
  const totalRevenue = events.reduce((sum, e) => {
    const eventRevenue = e.registrations?.reduce((acc: number, r: any) => {
      if (r.payment && r.payment.status === 'PAID') {
        return acc + parseFloat(r.payment.amount);
      }
      return acc;
    }, 0) || 0;
    return sum + eventRevenue;
  }, 0);
  const totalWaitlisted = events.reduce((sum, e) => {
    const eventWaitlisted = e.registrations?.filter((r: any) => r.status === 'WAITLISTED').length || 0;
    return sum + eventWaitlisted;
  }, 0);
  const totalCheckedIn = events.reduce((sum, e) => sum + (e._count?.attendance || 0), 0);
  const attendanceRate = totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, fontFamily: '"Outfit", sans-serif' }}>
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
                <Typography variant="h4" sx={{ fontWeight: 'bold', fontFamily: '"Outfit", sans-serif' }}>
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
                <Typography variant="h4" sx={{ fontWeight: 'bold', fontFamily: '"Outfit", sans-serif' }}>
                  ${totalRevenue.toFixed(2)}
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
                <Typography variant="h4" sx={{ fontWeight: 'bold', fontFamily: '"Outfit", sans-serif' }}>
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
                <Typography variant="h4" sx={{ fontWeight: 'bold', fontFamily: '"Outfit", sans-serif' }}>
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
                const eventWaitlistCount = event.registrations?.filter((r: any) => r.status === 'WAITLISTED').length || 0;
                const eventCheckedInCount = event._count?.attendance || 0;
                const eventRevenue = event.registrations?.reduce((sum: number, r: any) => {
                  if (r.payment && r.payment.status === 'PAID') {
                    return sum + parseFloat(r.payment.amount);
                  }
                  return sum;
                }, 0) || 0;
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
                      {eventRevenue > 0 ? `$${eventRevenue.toFixed(2)}` : 'Free'}
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
                            <IconButton color="primary" onClick={() => handleViewRegistrants(event)}>
                              <PeopleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Checked-In Attendance">
                            <IconButton color="success" onClick={() => handleViewAttendance(event)}>
                              <AttendanceIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Assign Volunteers">
                            <IconButton color="warning" onClick={() => handleOpenVolunteers(event)}>
                              <VolunteerIcon />
                            </IconButton>
                          </Tooltip>
                        </>
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

      {/* Registrants Dialog */}
      <Dialog open={registrantsOpen} onClose={() => setRegistrantsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 'bold' }}>
          Registrants List - {activeEvent?.title}
        </DialogTitle>
        <DialogContent>
          {registrants.length === 0 ? (
            <Typography>No students registered yet.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Roll Number</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registrants.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.student.name}</TableCell>
                      <TableCell>{r.student.rollNumber || 'N/A'}</TableCell>
                      <TableCell>{r.student.department || 'N/A'}</TableCell>
                      <TableCell>{r.student.email}</TableCell>
                      <TableCell>
                        <Chip label={r.status} size="small" color={getStatusColor(r.status) as any} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegistrantsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Live Attendance Dialog */}
      <Dialog open={attendanceOpen} onClose={() => setAttendanceOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 'bold' }}>
          Live Scanned Attendance - {activeEvent?.title}
        </DialogTitle>
        <DialogContent>
          {attendance.length === 0 ? (
            <Typography>No attendance scanned yet.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Roll Number</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Scanned At</TableCell>
                    <TableCell>Scanned By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendance.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.registration.student.name}</TableCell>
                      <TableCell>{a.registration.student.rollNumber || 'N/A'}</TableCell>
                      <TableCell>{a.registration.student.department || 'N/A'}</TableCell>
                      <TableCell>{new Date(a.scannedAt).toLocaleTimeString()}</TableCell>
                      <TableCell>{a.volunteer.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttendanceOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Volunteer Assignment Dialog */}
      <Dialog open={volunteerOpen} onClose={() => setVolunteerOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 'bold' }}>
          Manage Volunteers - {activeEvent?.title}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" gap={1} mb={3} mt={1}>
            <TextField
              fullWidth
              size="small"
              label="Volunteer Email"
              variant="outlined"
              placeholder="e.g. volunteer@campusflow.com"
              value={volunteerEmail}
              onChange={(e) => setVolunteerEmail(e.target.value)}
            />
            <Button variant="contained" onClick={handleAddVolunteer}>
              Assign
            </Button>
          </Box>

          {volunteerError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setVolunteerError(null)}>{volunteerError}</Alert>}
          {volunteerSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setVolunteerSuccess(null)}>{volunteerSuccess}</Alert>}

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
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVolunteerOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
