import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

export const CompleteProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) {
      setError('Department is required.');
      return;
    }
    if (user?.role === 'STUDENT' && !rollNumber.trim()) {
      setError('Roll Number is required.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await updateProfile({
        rollNumber: user?.role === 'STUDENT' ? rollNumber.trim() : undefined,
        department,
        class: user?.role === 'STUDENT' ? className.trim() : undefined,
        section: user?.role === 'STUDENT' ? section.trim() : undefined,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile details.');
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
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              Complete Your Profile
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Please provide your department and roll details to continue to CampusFlow.
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <FormControl fullWidth size="small" sx={{ mb: 2 }} required>
              <InputLabel>Department</InputLabel>
              <Select
                value={department}
                label="Department"
                onChange={(e) => setDepartment(e.target.value)}
              >
                <MenuItem value="CSE">Computer Science & Engineering (CSE)</MenuItem>
                <MenuItem value="IT">Information Technology (IT)</MenuItem>
                <MenuItem value="ECE">Electronics & Communication (ECE)</MenuItem>
                <MenuItem value="EEE">Electrical & Electronics (EEE)</MenuItem>
                <MenuItem value="MECH">Mechanical Engineering (MECH)</MenuItem>
                <MenuItem value="CIVIL">Civil Engineering (CIVIL)</MenuItem>
                <MenuItem value="MBA">Master of Business Administration (MBA)</MenuItem>
              </Select>
            </FormControl>

            {user?.role === 'STUDENT' && (
              <>
                <TextField
                  fullWidth
                  size="small"
                  label="Roll Number"
                  variant="outlined"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. RA2111003010123"
                  sx={{ mb: 2 }}
                />

                <Box display="flex" gap={2} mb={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Class"
                    variant="outlined"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="e.g. CSE-A"
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Section"
                    variant="outlined"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g. A"
                  />
                </Box>
              </>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ py: 1, fontWeight: 'bold' }}
            >
              Save & Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
