import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
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

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 5;

  const fetchODs = async (pageVal = 1) => {
    try {
      const res = await api.get(`/od/me?page=${pageVal}&limit=${limit}`);
      setOds(res.data.data.odLetters);
      setTotal(res.data.data.total || 0);
      setPage(res.data.data.page || 1);
    } catch (err) {
      console.error('Failed to fetch OD letters', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchODs(1);
  }, []);

  const handleDownload = async (verificationId: string, eventTitle: string) => {
    try {
      const res = await api.get(`/od/download/${verificationId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `OD_${eventTitle.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download OD letter', err);
      alert('Failed to download OD letter. Please try again.');
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
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
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
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
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
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownload(od.verificationId, od.registration.event.title)}
                    >
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {total > limit && (
        <Box display="flex" justifyContent="center" mt={4} mb={2} gap={1}>
          <Button
            variant="outlined"
            disabled={page <= 1}
            onClick={() => fetchODs(page - 1)}
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
            onClick={() => fetchODs(page + 1)}
          >
            Next
          </Button>
        </Box>
      )}
    </Box>
  );
};
