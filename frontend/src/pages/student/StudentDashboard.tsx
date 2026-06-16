import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import {
  EventAvailable as ActiveIcon,
  HourglassEmpty as WaitIcon,
  AssignmentTurnedIn as ODIcon,
  Event as CalendarIcon,
} from '@mui/icons-material';

interface Stats {
  activeRegs: number;
  waitlistedRegs: number;
  approvedODs: number;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  clubName: string;
  status: string;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ activeRegs: 0, waitlistedRegs: 0, approvedODs: 0 });
  const [upcoming, setUpcoming] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [regsRes, odsRes] = await Promise.all([
          api.get('/registrations/me'),
          api.get('/od/me'),
        ]);

        const regs = regsRes.data.data.registrations;
        const ods = odsRes.data.data.odLetters;

        const active = regs.filter((r: any) => r.status === 'ACTIVE').length;
        const waitlisted = regs.filter((r: any) => r.status === 'WAITLISTED').length;

        setStats({
          activeRegs: active,
          waitlistedRegs: waitlisted,
          approvedODs: ods.length,
        });

        const upcomingEvents = regs
          .filter((r: any) => r.status === 'ACTIVE' && new Date(r.event.date) > new Date())
          .map((r: any) => ({
            id: r.event.id,
            title: r.event.title,
            date: r.event.date,
            location: r.event.location,
            clubName: r.event.club.name,
            status: r.status,
          }))
          .slice(0, 3);

        setUpcoming(upcomingEvents);
      } catch (err) {
        console.error('Failed to fetch dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your registered events, QR scan status, and download approved OD certificates.
        </Typography>
      </Box>

      <Grid container spacing={3} mb={5}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box p={1.5} sx={{ bgcolor: 'rgba(161, 161, 170, 0.15)', borderRadius: 2, color: 'text.primary', display: 'flex' }}>
                <ActiveIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.activeRegs}</Typography>
                <Typography variant="caption" color="text.secondary">Active Registrations</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box p={1.5} sx={{ bgcolor: 'rgba(161, 161, 170, 0.15)', borderRadius: 2, color: 'text.primary', display: 'flex' }}>
                <WaitIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.waitlistedRegs}</Typography>
                <Typography variant="caption" color="text.secondary">Waitlisted Events</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box p={1.5} sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', borderRadius: 2, color: 'success.main', display: 'flex' }}>
                <ODIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.approvedODs}</Typography>
                <Typography variant="caption" color="text.secondary">Approved OD Letters</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon color="primary" /> Upcoming Registered Events
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {upcoming.length === 0 ? (
                <Box py={4} textAlign="center">
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    You have no upcoming registered events.
                  </Typography>
                  <Button variant="contained" component={Link} to="/events" size="small">
                    Browse Catalog
                  </Button>
                </Box>
              ) : (
                <List disablePadding>
                  {upcoming.map((event, index) => (
                    <React.Fragment key={event.id}>
                      <ListItem
                        sx={{
                          py: 1.5,
                          px: 0,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <ListItemText
                          primary={event.title}
                          secondary={`${event.clubName} | ${new Date(event.date).toLocaleDateString()} at ${event.location}`}
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                        <Chip label="Confirmed" color="success" size="small" />
                      </ListItem>
                      {index < upcoming.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Student Credentials Info
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary" paragraph>
                  Please ensure your <strong>Roll Number</strong> and <strong>Department</strong> are correctly updated in your profile.
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  OD letter generation fetches details directly from your account profile. Incorrect profile details will result in invalid OD documentation.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                component={Link}
                to="/profile"
                sx={{ mt: 2 }}
              >
                Verify Profile Details
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
