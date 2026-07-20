import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getUploadUrl } from '../../services/api';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

export const EditEvent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingEvent, setFetchingEvent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(0.0);
  const [clubName, setClubName] = useState('');
  const [poster, setPoster] = useState<string>('');
  const [currentPoster, setCurrentPoster] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPoster(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        const ev = res.data.data.event;
        setTitle(ev.title);
        setDescription(ev.description);
        // Format ISO date to local datetime-local string (YYYY-MM-DDTHH:MM)
        const d = new Date(ev.date);
        const offset = d.getTimezoneOffset() * 60000;
        const localISO = new Date(d.getTime() - offset).toISOString().slice(0, 16);
        setDate(localISO);
        setDuration(ev.duration);
        setLocation(ev.location);
        setCapacity(ev.capacity);
        setIsPaid(ev.isPaid);
        setPrice(Number(ev.price));
        setClubName(ev.club?.name || '');
        setCurrentPoster(ev.poster);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch event details.');
      } finally {
        setFetchingEvent(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!date) {
      setError('Please select a valid date and time.');
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        title,
        description,
        date: new Date(date).toISOString(),
        duration: Number(duration),
        location,
        capacity: Number(capacity),
        isPaid,
        price: isPaid ? Number(price) : 0,
      };

      if (poster) {
        payload.poster = poster;
      }

      await api.put(`/events/${id}`, payload);
      navigate('/organizer-dashboard');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errorDetails = err.response.data.errors
          .map((e: any) => `${e.field}: ${e.message}`)
          .join(', ');
        setError(`Validation failed: ${errorDetails}`);
      } else {
        setError(err.response?.data?.message || 'Failed to update event. Please check details.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchingEvent) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth={800} mx="auto">
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Edit Event Details
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Update event details for department: <strong>{clubName}</strong>
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Event Title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  required
                  multiline
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date & Time"
                  type="datetime-local"
                  required
                  InputLabelProps={{ shrink: true }}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Duration (in minutes)"
                  type="number"
                  required
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Total Seating Capacity"
                  type="number"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  disabled={loading}
                  helperText="Adjusting capacity updates remaining seats accordingly."
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isPaid}
                      onChange={(e) => setIsPaid(e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label="This is a Premium/Paid Event"
                />
              </Grid>

              {isPaid && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Price (in ₹)"
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    disabled={loading}
                    placeholder="e.g. 150"
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Event Poster Image
                </Typography>
                <input
                  accept="image/*"
                  type="file"
                  onChange={handleFileChange}
                  disabled={loading}
                  style={{ display: 'block', marginBottom: '15px' }}
                />
                {(poster || currentPoster) && (
                  <Box sx={{ mt: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1, maxWidth: 300 }}>
                    <img
                      src={poster || (currentPoster ? getUploadUrl(currentPoster) : '')}
                      alt="Event poster preview"
                      style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                    />
                  </Box>
                )}
              </Grid>
            </Grid>

            <Box display="flex" gap={2} justifyContent="flex-end" mt={4}>
              <Button variant="outlined" onClick={() => navigate('/organizer-dashboard')} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
