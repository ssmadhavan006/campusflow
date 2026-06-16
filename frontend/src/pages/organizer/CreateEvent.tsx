import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

export const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingClubs, setFetchingClubs] = useState(true);
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
  const [clubId, setClubId] = useState('');

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await api.get('/clubs');
        setClubs(res.data.data.clubs);
        if (res.data.data.clubs.length > 0) {
          setClubId(res.data.data.clubs[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetchingClubs(false);
      }
    };
    fetchClubs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        title,
        description,
        date: new Date(date).toISOString(),
        duration: Number(duration),
        location,
        capacity: Number(capacity),
        isPaid,
        price: isPaid ? Number(price) : 0,
        clubId,
      };

      await api.post('/events', payload);
      navigate('/organizer-dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingClubs) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth={600} mx="auto">
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, fontFamily: '"Outfit", sans-serif' }}>
        Create New Event
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Event Title"
              margin="normal"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Event Description"
              margin="normal"
              required
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Date & Time"
                  margin="normal"
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
                  type="number"
                  label="Duration (in minutes)"
                  margin="normal"
                  required
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  disabled={loading}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location / Venue"
                  margin="normal"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Capacity / Seats"
                  margin="normal"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  disabled={loading}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Organizing Club</InputLabel>
              <Select
                value={clubId}
                label="Organizing Club"
                onChange={(e) => setClubId(e.target.value)}
                disabled={loading}
              >
                {clubs.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box display="flex" alignItems="center" gap={2} mt={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    disabled={loading}
                  />
                }
                label="This is a Paid Event"
              />
              {isPaid && (
                <TextField
                  type="number"
                  label="Ticket Price ($)"
                  size="small"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  disabled={loading}
                />
              )}
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 4 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Event (Save as Draft)'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
