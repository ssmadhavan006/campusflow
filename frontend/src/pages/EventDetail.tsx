import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, getUploadUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Schedule as ClockIcon,
  Room as LocationIcon,
  Group as SeatingIcon,
  AttachMoney as FeeIcon,
  ArrowBack as BackIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

interface EventDetailData {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: number;
  location: string;
  capacity: number;
  remainingSeats: number;
  isPaid: boolean;
  price: string;
  status: string;
  poster: string | null;
  organizerId: string;
  club: { id: string; name: string };
  organizer: { id: string; name: string; email: string };
}

export const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { t } = useLanguage();
  const [event, setEvent] = useState<EventDetailData | null>(null);
  const [myRegistration, setMyRegistration] = useState<any | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchEventDetails = async () => {
    try {
      const [eventRes, regsRes] = await Promise.all([
        api.get(`/events/${id}`),
        user?.role === 'STUDENT' ? api.get('/registrations/me') : Promise.resolve({ data: { data: { registrations: [] } } }),
      ]);

      const ev = eventRes.data.data.event;
      setEvent(ev);

      api.get(`/events/${id}/announcements`)
        .then(res => setAnnouncements(res.data.data.announcements || []))
        .catch(() => {});

      if (user?.role === 'STUDENT') {
        const regs = regsRes.data.data.registrations;
        const matched = regs.find((r: any) => r.eventId === id && r.status !== 'CANCELLED');
        setMyRegistration(matched || null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id, user]);

  const handleRegister = async () => {
    setError(null);
    setSuccess(null);
    setActionLoading(true);

    try {
      const res = await api.post('/registrations', { eventId: id });
      const reg = res.data.data.registration;
      
      if (reg.status === 'WAITLISTED') {
        setSuccess('Event capacity reached! You have been placed on the waitlist.');
      } else if (event?.isPaid) {
        setSuccess('Seat temporarily reserved! Please complete the simulated payment to activate your ticket.');
      } else {
        setSuccess('Registration successful! Your ticket is now active.');
      }
      
      await fetchEventDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!event) {
    return (
      <Box p={3}>
        <Alert severity="error">Event not found.</Alert>
      </Box>
    );
  }

  const isOrganizer = event.organizerId === user?.id || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';
  const isWaitlisted = myRegistration?.status === 'WAITLISTED';
  const isActive = myRegistration?.status === 'ACTIVE';
  const isPending = myRegistration?.status === 'PENDING';

  return (
    <Box maxWidth={900} mx="auto">
      <Box mb={3} display="flex" alignItems="center" gap={1}>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
          Back
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Box mb={3}>
            <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 'bold', color: 'primary.main', tracking: 1 }}>
              {event.club.name}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 0.5, mb: 2, letterSpacing: '-0.02em' }}>
              {event.title}
            </Typography>

            <Box display="flex" gap={1} mb={3}>
              <Chip label={event.status} color={event.status === 'APPROVED' || event.status === 'ONGOING' ? 'success' : 'default'} size="small" />
              {event.isPaid ? (
                <Chip label={`Premium: ₹${Number(event.price)}`} color="secondary" size="small" />
              ) : (
                <Chip label={t('freeEvent')} color="info" size="small" />
              )}
            </Box>
          </Box>

          {event.poster && (
            <Box sx={{ width: '100%', mb: 4, borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <img
                src={getUploadUrl(event.poster)}
                alt={event.title}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </Box>
          )}

          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1.5 }}>
            {t('aboutEvent')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7, mb: 4 }}>
            {event.description}
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            {t('announcementsUpdates')}
          </Typography>
          {announcements.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No announcements have been posted for this event yet.
            </Typography>
          ) : (
            <Box display="flex" flexDirection="column" gap={2}>
              {announcements.map((ann) => (
                <Card key={ann.id} variant="outlined" sx={{ borderRadius: 2, p: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Posted on {new Date(ann.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {ann.content}
                  </Typography>
                </Card>
              ))}
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, position: 'sticky', top: 90 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Event Logistical Info
              </Typography>

              <Box display="flex" flexDirection="column" gap={2.5}>
                <Box display="flex" alignItems="center" gap={2}>
                  <CalendarIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Date & Time</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {new Date(event.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                  <ClockIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Duration</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{event.duration} minutes</Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                  <LocationIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Location</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{event.location}</Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                  <SeatingIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Seating Availability</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {event.remainingSeats} / {event.capacity} seats remaining
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                  <FeeIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Registration Fee</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {event.isPaid ? `₹${Number(event.price)}` : 'Free'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box display="flex" flexDirection="column" gap={2}>
                {isStudent && (
                  <>
                    {myRegistration ? (
                      <Box>
                        <Alert
                          severity={isActive ? 'success' : isWaitlisted ? 'warning' : 'info'}
                          sx={{ mb: 2 }}
                        >
                          Status: <strong>{myRegistration.status}</strong>
                          {isPending && ' — Payment approval pending.'}
                          {isWaitlisted && ' — Placed in queue.'}
                        </Alert>
                        <Button
                          fullWidth
                          variant="contained"
                          component={Link}
                          to="/student-registrations"
                          size="large"
                        >
                          View Ticket Details
                        </Button>
                      </Box>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleRegister}
                        disabled={actionLoading || event.status !== 'APPROVED'}
                        size="large"
                      >
                        {actionLoading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : event.remainingSeats > 0 ? (
                          event.isPaid ? 'Pay and Register' : 'Register Now'
                        ) : (
                          'Join Waitlist'
                        )}
                      </Button>
                    )}
                  </>
                )}

                {isOrganizer && (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/events/${event.id}/edit`)}
                    disabled={event.status !== 'DRAFT' && event.status !== 'REJECTED' && user?.role !== 'ADMIN'}
                    size="large"
                  >
                    Edit Event Details
                  </Button>
                )}

                {!isStudent && !isOrganizer && (
                  <Typography variant="body2" color="text.secondary" align="center">
                    Logged in as <strong>{user?.role}</strong>
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
