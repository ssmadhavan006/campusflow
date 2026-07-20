import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
} from 'recharts';

interface RegistrationTrendPoint {
  date: string;
  signups: number;
  cumulative: number;
}

interface AnalyticsData {
  totalRegistrations: number;
  checkInRate: number;
  revenue: {
    collected: number | string;
    pending: number | string;
  };
  registrationTrend: RegistrationTrendPoint[];
  statusBreakdown: Record<string, number>;
}

interface AnalyticsDialogProps {
  open: boolean;
  onClose: () => void;
  event: { id: string; title: string } | null;
  analyticsData: AnalyticsData | null;
  analyticsLoading: boolean;
  onExportCSV: (type: 'registrations' | 'attendance') => void;
}

export const AnalyticsDialog: React.FC<AnalyticsDialogProps> = ({
  open,
  onClose,
  event,
  analyticsData,
  analyticsLoading,
  onExportCSV,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        Event Analytics - {event?.title}
      </DialogTitle>
      <DialogContent>
        {analyticsLoading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : !analyticsData ? (
          <Typography color="text.secondary">No analytics available.</Typography>
        ) : (
          <Box>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">Total Registrations</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{analyticsData.totalRegistrations}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">Check-in Rate</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{Math.round(analyticsData.checkInRate * 100)}%</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">Revenue Collected</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>₹{Number(analyticsData.revenue.collected).toFixed(2)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">Revenue Pending</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>₹{Number(analyticsData.revenue.pending).toFixed(2)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Registration Trend
            </Typography>
            {analyticsData.registrationTrend.length === 0 ? (
              <Typography variant="body2" color="text.secondary" mb={3}>No registrations recorded yet.</Typography>
            ) : (
              <Box height={260} mb={3}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.registrationTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip />
                    <Line type="monotone" dataKey="cumulative" name="Cumulative Signups" stroke="#0A84FF" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="signups" name="Daily Signups" stroke="#34C759" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Registration Status Breakdown
            </Typography>
            <Box height={220}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(analyticsData.statusBreakdown).map(([status, count]) => ({ status, count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip />
                  <Bar dataKey="count" fill="#0A84FF" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => onExportCSV('registrations')}
          >
            Export Registrations (CSV)
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => onExportCSV('attendance')}
          >
            Export Attendance (CSV)
          </Button>
        </Box>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
