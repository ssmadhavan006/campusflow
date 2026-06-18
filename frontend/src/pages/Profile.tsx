import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Person as ProfileIcon } from '@mui/icons-material';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [classVal, setClassVal] = useState(user?.class || '');
  const [section, setSection] = useState(user?.section || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await updateProfile({
        name,
        rollNumber: user?.role === 'STUDENT' ? rollNumber : undefined,
        department: department || undefined,
        class: user?.role === 'STUDENT' ? classVal : undefined,
        section: user?.role === 'STUDENT' ? section : undefined,
      });
      setSuccess('Profile details successfully updated!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={600} mx="auto">
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, fontFamily: '"Outfit", sans-serif' }}>
          My Account Profile
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your personal details. Students must enter correct roll numbers to generate On-Duty letters.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <ProfileIcon sx={{ fontSize: 35 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 4 }} />

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email (Not editable)"
                  variant="outlined"
                  disabled
                  value={user?.email || ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="System Role (Not editable)"
                  variant="outlined"
                  disabled
                  value={user?.role || ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  variant="outlined"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </Grid>

              {user?.role === 'STUDENT' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Student Roll Number"
                      variant="outlined"
                      required
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Class"
                      variant="outlined"
                      required
                      value={classVal}
                      onChange={(e) => setClassVal(e.target.value)}
                      disabled={loading}
                      placeholder="e.g. III Year"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Section"
                      variant="outlined"
                      required
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      disabled={loading}
                      placeholder="e.g. CSE-A"
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Department"
                  variant="outlined"
                  placeholder="e.g. Mechanical Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={loading}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 4 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
