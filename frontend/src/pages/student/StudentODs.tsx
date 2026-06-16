import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { GetApp as DownloadIcon } from '@mui/icons-material';

interface ODLetter {
  id: string;
  verificationId: string;
  approvalTimestamp: string;
  registration: {
    event: {
      title: string;
      date: string;
      duration: number;
    };
  };
}

export const StudentODs: React.FC = () => {
  const [ods, setOds] = useState<ODLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const fetchODs = async () => {
      try {
        const res = await api.get('/od/me');
        setOds(res.data.data.odLetters);
      } catch (err) {
        console.error('Failed to fetch OD letters', err);
      } finally {
        setLoading(false);
      }
    };

    fetchODs();
  }, []);

  const handleDownload = async (verificationId: string) => {
    setDownloading(verificationId);
    try {
      const res = await api.get(`/od/download/${verificationId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `OD_Letter_${verificationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Failed to download OD letter', err);
    } finally {
      setDownloading(null);
    }
  };

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
          My On-Duty Letters
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Download authenticated PDF On-Duty credentials for completed events.
        </Typography>
      </Box>

      {ods.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">No approved On-Duty letters found.</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Event Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Event Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Verification ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Approval Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ods.map((od) => (
                <TableRow key={od.id}>
                  <TableCell>{od.registration.event.title}</TableCell>
                  <TableCell>{new Date(od.registration.event.date).toLocaleDateString()}</TableCell>
                  <TableCell>{od.registration.event.duration} mins</TableCell>
                  <TableCell>
                    <Typography color="secondary" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {od.verificationId}
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(od.approvalTimestamp).toLocaleString()}</TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownload(od.verificationId)}
                      disabled={downloading === od.verificationId}
                    >
                      {downloading === od.verificationId ? 'Downloading...' : 'Download PDF'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
