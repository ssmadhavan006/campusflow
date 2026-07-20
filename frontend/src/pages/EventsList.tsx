import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, getUploadUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeModeContext';
import { useLanguage } from '../context/LanguageContext';
import { PaymentDialog } from '../components/common/PaymentDialog';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  TextField,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  CalendarToday as DateIcon,
  Room as LocationIcon,
  People as CapacityIcon,
  GridView as GridIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';

interface Event {
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
  club: { id: string; name: string };
  organizer: { id: string; name: string; email: string };
  poster?: string;
}

interface Registration {
  id: string;
  eventId: string;
  status: string;
  payment?: { status: string; id: string };
}

export const EventsList: React.FC = () => {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const { language, t } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewType, setViewType] = useState<'grid' | 'calendar'>('grid');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Pagination & Filters
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(9); // 9 events per page
  const [total, setTotal] = useState(0);
  const [clubId, setClubId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [feeType, setFeeType] = useState<'FREE' | 'PAID' | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);

  // Payment Dialog state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payingRegId, setPayingRegId] = useState<string | null>(null);
  const [payingAmount, setPayingAmount] = useState<number>(0);

  // Delete Confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // General Dialog/Alert status
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async (pageVal = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pageVal.toString());
      params.append('limit', limit.toString());
      if (search) params.append('search', search);
      if (clubId) params.append('clubId', clubId);
      if (statusFilter) params.append('status', statusFilter);
      if (feeType) params.append('feeType', feeType);
      if (dateFrom) params.append('dateFrom', new Date(dateFrom).toISOString());
      if (dateTo) params.append('dateTo', new Date(`${dateTo}T23:59:59`).toISOString());
      if (availableOnly) params.append('availableOnly', 'true');

      const [eventsRes, regsRes, clubsRes] = await Promise.all([
        api.get(`/events?${params.toString()}`),
        user?.role === 'STUDENT' ? api.get('/registrations/me') : Promise.resolve({ data: { data: { registrations: [] } } }),
        api.get('/clubs'),
      ]);

      setEvents(eventsRes.data.data.events);
      setTotal(eventsRes.data.data.total || 0);
      setPage(eventsRes.data.data.page || 1);
      setClubs(clubsRes.data.data.clubs || []);

      if (user?.role === 'STUDENT') {
        setRegistrations(regsRes.data.data.registrations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [user, clubId, statusFilter, feeType, dateFrom, dateTo, availableOnly]);


  const handleRegister = async (eventId: string, price: string) => {
    setMessage(null);
    try {
      const res = await api.post('/registrations', { eventId });
      const reg = res.data.data.registration;

      if (reg.status === 'PENDING') {
        // Requires payment
        setPayingRegId(reg.id);
        setPayingAmount(Number(price));
        setPaymentOpen(true);
        fetchData();
      } else {
        setMessage({ type: 'success', text: reg.status === 'WAITLISTED' ? 'Successfully joined the waitlist!' : 'Registration successful!' });
        fetchData();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to register.' });
    }
  };

  const handleCancelRegistration = async (registrationId: string) => {
    if (!window.confirm('Are you sure you want to cancel your registration?')) return;
    setMessage(null);
    try {
      await api.put(`/registrations/${registrationId}/cancel`);
      setMessage({ type: 'success', text: 'Registration cancelled.' });
      fetchData(page);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to cancel registration.' });
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setDeletingEventId(eventId);
    setDeleteConfirmOpen(true);
  };

  const executeDeleteEvent = async () => {
    if (!deletingEventId) return;
    setDeleteConfirmOpen(false);
    setMessage(null);
    try {
      await api.delete(`/events/${deletingEventId}`);
      setMessage({ type: 'success', text: 'Event successfully deleted.' });
      fetchData(page);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete event.' });
    } finally {
      setDeletingEventId(null);
    }
  };

  const isUserRegistered = (eventId: string) => {
    return registrations.find((r) => r.eventId === eventId && r.status !== 'CANCELLED');
  };

  const filteredEvents = events;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" flexWrap="wrap" gap={2} mb={4} alignItems="center">
        <TextField
          label={t('searchEvents')}
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') fetchData(1); }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <Button variant="contained" onClick={() => fetchData(1)}>
          Search
        </Button>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t('department')}</InputLabel>
          <Select
            value={clubId}
            label={t('department')}
            onChange={(e) => setClubId(e.target.value)}
          >
            <MenuItem value="">{t('allDepartments')}</MenuItem>
            {clubs.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t('feeType')}</InputLabel>
          <Select
            value={feeType}
            label={t('feeType')}
            onChange={(e) => setFeeType(e.target.value as any)}
          >
            <MenuItem value="">{t('allFeeTypes')}</MenuItem>
            <MenuItem value="FREE">{t('freeEvent')}</MenuItem>
            <MenuItem value="PAID">Premium (Paid)</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t('status')}</InputLabel>
          <Select
            value={statusFilter}
            label={t('status')}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">{t('allStatuses')}</MenuItem>
            <MenuItem value="APPROVED">Approved / Upcoming</MenuItem>
            <MenuItem value="ONGOING">Ongoing</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label={t('fromDate')}
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          sx={{ minWidth: 150 }}
        />
        <TextField
          label={t('toDate')}
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          sx={{ minWidth: 150 }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
          }
          label={t('availableSeatsOnly')}
        />

        <Box sx={{ flexGrow: 1 }} />
        <ToggleButtonGroup
          value={viewType}
          exclusive
          onChange={(_, next) => { if (next) setViewType(next); }}
          size="small"
        >
          <ToggleButton value="grid" aria-label="grid view">
            <GridIcon />
          </ToggleButton>
          <ToggleButton value="calendar" aria-label="calendar view">
            <CalendarIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      {viewType === 'grid' ? (
        filteredEvents.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography color="text.secondary">{t('noEventsFound')}</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredEvents.map((event) => {
              const reg = isUserRegistered(event.id);
              const remaining = event.remainingSeats;

              return (
                <Grid item xs={12} sm={6} md={4} key={event.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {event.poster ? (
                      <Box
                        component="img"
                        src={getUploadUrl(event.poster)}
                        alt={event.title}
                        sx={{
                          width: '100%',
                          height: 180,
                          objectFit: 'cover',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: 180,
                          backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#272729' : '#f5f5f7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <Typography variant="subtitle1" color="text.secondary" sx={{ opacity: 0.8, fontWeight: 'bold' }}>
                          Department Event
                        </Typography>
                      </Box>
                    )}
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start" mb={1.5}>
                        <Chip label={event.club.name} color="primary" size="small" variant="outlined" />
                        <Chip
                          label={event.isPaid ? `₹${Number(event.price)}` : t('freeEvent')}
                          color={event.isPaid ? 'secondary' : 'success'}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>

                      <Typography
                        variant="h6"
                        component={Link}
                        to={`/events/${event.id}`}
                        sx={{
                          fontWeight: 'bold',
                          mb: 1,
                          display: 'block',
                          textDecoration: 'none',
                          color: 'text.primary',
                          '&:hover': { color: 'primary.main' }
                        }}
                      >
                        {event.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          minHeight: 60,
                          mb: 2
                        }}
                      >
                        {event.description}
                      </Typography>

                      <Box display="flex" flexDirection="column" gap={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <DateIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {event.location}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CapacityIcon fontSize="small" color="action" />
                          <Typography variant="caption" color={remaining === 0 ? 'error.main' : 'text.secondary'} sx={{ fontWeight: remaining === 0 ? 'bold' : 'normal' }}>
                            {remaining === 0 ? t('capacityFull') : `${remaining} / ${event.capacity} seats left`}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      {reg ? (
                        <Box width="100%">
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              Your Status:
                            </Typography>
                            <Chip
                              label={reg.status}
                              color={reg.status === 'ACTIVE' ? 'success' : reg.status === 'WAITLISTED' ? 'warning' : 'default'}
                              size="small"
                            />
                          </Box>
                          {reg.status === 'PENDING' && reg.payment?.status === 'PENDING' && (
                            <Button
                              fullWidth
                              variant="contained"
                              color="secondary"
                              onClick={() => { setPayingRegId(reg.id); setPayingAmount(Number(event.price)); setPaymentOpen(true); }}
                              sx={{ mb: 1 }}
                            >
                              Submit Payment
                            </Button>
                          )}
                          <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            onClick={() => handleCancelRegistration(reg.id)}
                          >
                            Cancel Ticket
                          </Button>
                        </Box>
                      ) : ['APPROVED', 'ONGOING'].includes(event.status) ? (
                        user?.role === 'STUDENT' && (
                          <Button
                            fullWidth
                            variant="contained"
                            color={remaining === 0 ? 'warning' : 'primary'}
                            onClick={() => handleRegister(event.id, event.price)}
                          >
                            {remaining === 0 ? 'Join Waitlist' : 'Register Now'}
                          </Button>
                        )
                      ) : (
                        <Button fullWidth variant="outlined" disabled>
                          Event Status: {event.status}
                        </Button>
                      )}

                      {user?.role === 'ADMIN' && (
                        <Button
                          fullWidth
                          variant="contained"
                          color="error"
                          onClick={() => handleDeleteEvent(event.id)}
                          sx={{ mt: 1 }}
                        >
                          Delete Event
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )
      ) : (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Button onClick={handlePrevMonth} variant="outlined" size="small">
              {t('previous') || 'Previous'}
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 'bold', fontFamily: '"Inter", sans-serif' }}>
              {currentMonth.toLocaleString(language === 'ta' ? 'ta-IN' : 'en-US', { month: 'long', year: 'numeric' })}
            </Typography>
            <Button onClick={handleNextMonth} variant="outlined" size="small">
              {t('next') || 'Next'}
            </Button>
          </Box>

          <Grid container columns={7} spacing={1} sx={{ mb: 1 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <Grid item xs={1} key={d} textAlign="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                  {language === 'ta' ? (d === 'Sun' ? 'ஞாயிறு' : d === 'Mon' ? 'திங்கள்' : d === 'Tue' ? 'செவ்வாய்' : d === 'Wed' ? 'புதன்' : d === 'Thu' ? 'வியாழன்' : d === 'Fri' ? 'வெள்ளி' : 'சனி') : d}
                </Typography>
              </Grid>
            ))}
          </Grid>

          <Grid container columns={7} spacing={1}>
            {getDaysInMonth(currentMonth).map((day, idx) => {
              if (!day) {
                return (
                  <Grid item xs={1} key={`empty-${idx}`} sx={{ minHeight: 120, border: '1px solid', borderColor: 'divider', opacity: 0.3 }} />
                );
              }

              const dayEvents = filteredEvents.filter((ev) => {
                const evDate = new Date(ev.date);
                return (
                  evDate.getDate() === day.getDate() &&
                  evDate.getMonth() === day.getMonth() &&
                  evDate.getFullYear() === day.getFullYear()
                );
              });

              const isToday = new Date().toDateString() === day.toDateString();

              return (
                <Grid
                  item
                  xs={1}
                  key={day.toISOString()}
                  sx={{
                    minHeight: 120,
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 1,
                    position: 'relative',
                    bgcolor: isToday ? (mode === 'dark' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(25, 118, 210, 0.04)') : 'transparent',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isToday ? 'bold' : 'normal',
                      color: isToday ? 'primary.main' : 'text.primary',
                      display: 'inline-block',
                      width: 20,
                      height: 20,
                      textAlign: 'center',
                      lineHeight: '20px',
                      borderRadius: '50%',
                      bgcolor: isToday ? (mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)') : 'transparent',
                    }}
                  >
                    {day.getDate()}
                  </Typography>

                  <Box sx={{ mt: 1, maxHeight: 85, overflowY: 'auto' }}>
                    {dayEvents.map((ev) => (
                      <Box
                        key={ev.id}
                        component={Link}
                        to={`/events/${ev.id}`}
                        sx={{
                          display: 'block',
                          fontSize: '0.7rem',
                          color: '#ffffff',
                          bgcolor: ev.status === 'APPROVED' ? 'primary.main' : ev.status === 'ONGOING' ? 'success.main' : 'grey.600',
                          borderRadius: 1,
                          px: 0.5,
                          py: 0.2,
                          mb: 0.5,
                          textDecoration: 'none',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          '&:hover': { opacity: 0.85 },
                        }}
                        title={ev.title}
                      >
                        {ev.title}
                      </Box>
                    ))}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {viewType === 'grid' && total > limit && (
        <Box display="flex" justifyContent="center" mt={4} mb={2} gap={1}>
          <Button
            variant="outlined"
            disabled={page <= 1}
            onClick={() => fetchData(page - 1)}
          >
            Previous
          </Button>
          <Box display="flex" alignItems="center" px={2}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              Page {page} of {Math.ceil(total / limit)}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            disabled={page >= Math.ceil(total / limit)}
            onClick={() => fetchData(page + 1)}
          >
            Next
          </Button>
        </Box>
      )}

      <PaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        amount={payingAmount}
        onSubmit={async (reference) => {
          await api.post(`/registrations/${payingRegId}/submit-reference`, { reference });
          setMessage({ type: 'success', text: 'Payment reference submitted! Pending organizer verification.' });
          fetchData(page);
        }}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        title="Confirm Event Deletion"
        message="Are you sure you want to permanently delete this event and all associated registrations?"
        onConfirm={executeDeleteEvent}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDeletingEventId(null);
        }}
        severity="error"
        confirmText="Delete"
      />
    </Box>
  );
};
