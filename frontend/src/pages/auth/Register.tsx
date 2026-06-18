import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeModeContext';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'FACULTY' | 'HOD'>('STUDENT');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);

    try {
      await register({
        email,
        passwordHash: password,
        name,
        rollNumber: role === 'STUDENT' ? rollNumber : undefined,
        department: department || undefined,
        class: role === 'STUDENT' ? className : undefined,
        section: role === 'STUDENT' ? section : undefined,
        role,
      });

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="background.default"
      p={2}
    >
      <Card sx={{ width: '100%', maxWidth: 460, p: 2 }}>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 800,
                background: isDark ? 'linear-gradient(to right, #ffffff, #a1a1aa)' : 'linear-gradient(to right, #09090b, #71717a)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Join CampusFlow
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your account to start managing events
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              variant="outlined"
              margin="dense"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              variant="outlined"
              margin="dense"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            <FormControl fullWidth margin="dense" required>
              <InputLabel>Account Role</InputLabel>
              <Select
                value={role}
                label="Account Role"
                onChange={(e) => setRole(e.target.value as any)}
                disabled={loading}
              >
                <MenuItem value="STUDENT">Student</MenuItem>
                <MenuItem value="FACULTY">Faculty</MenuItem>
                <MenuItem value="HOD">Head of Department (HOD)</MenuItem>
              </Select>
            </FormControl>

            {role === 'STUDENT' && (
              <>
                <TextField
                  fullWidth
                  label="Roll Number"
                  variant="outlined"
                  margin="dense"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  label="Class"
                  variant="outlined"
                  margin="dense"
                  placeholder="e.g. III CSE"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  label="Section"
                  variant="outlined"
                  margin="dense"
                  placeholder="e.g. A"
                  required
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  disabled={loading}
                />
              </>
            )}

            <TextField
              fullWidth
              label="Department"
              variant="outlined"
              margin="dense"
              placeholder="e.g. Computer Science"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="dense"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              variant="outlined"
              margin="dense"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
            </Button>
          </form>

          <Box mt={2} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link to="/login" style={{ color: isDark ? '#fafafa' : '#09090b', textDecoration: 'underline', fontWeight: 600 }}>
                Sign In here
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
