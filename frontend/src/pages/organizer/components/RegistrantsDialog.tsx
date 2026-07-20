import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Typography,
  Box,
  Button,
  Paper,
} from '@mui/material';

export interface Registrant {
  id: string;
  student: {
    name: string;
    email: string;
    rollNumber?: string | null;
    department?: string | null;
  };
  status: string;
  payment?: {
    status: string;
    reference?: string;
  } | null;
}

interface RegistrantsDialogProps {
  open: boolean;
  onClose: () => void;
  event: { title: string } | null;
  registrants: Registrant[];
  onVerifyPayment: (regId: string, reference: string, status: 'PAID' | 'FAILED') => void;
  processingPaymentIds?: Set<string>;
}

export const RegistrantsDialog: React.FC<RegistrantsDialogProps> = ({
  open,
  onClose,
  event,
  registrants,
  onVerifyPayment,
  processingPaymentIds,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'WAITLISTED':
        return 'info';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        Registrants List - {event?.title}
      </DialogTitle>
      <DialogContent>
        {registrants.length === 0 ? (
          <Typography>No students registered yet.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Roll Number</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment Info</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registrants.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.student.name}</TableCell>
                    <TableCell>{r.student.rollNumber || 'N/A'}</TableCell>
                    <TableCell>{r.student.department || 'N/A'}</TableCell>
                    <TableCell>{r.student.email}</TableCell>
                    <TableCell>
                      <Chip label={r.status} size="small" color={getStatusColor(r.status) as any} />
                    </TableCell>
                    <TableCell>
                      {r.payment ? (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            Status: {r.payment.status}
                          </Typography>
                          {r.payment.reference && (
                            <Typography variant="caption" display="block">
                              Ref: {r.payment.reference}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {r.payment && r.payment.status === 'PENDING' && r.payment.reference && (
                        <Box display="flex" gap={1}>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            disabled={processingPaymentIds?.has(r.id)}
                            onClick={() => onVerifyPayment(r.id, r.payment!.reference || '', 'PAID')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            disabled={processingPaymentIds?.has(r.id)}
                            onClick={() => onVerifyPayment(r.id, r.payment!.reference || '', 'FAILED')}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
