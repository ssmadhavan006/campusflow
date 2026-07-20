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
  Typography,
  Button,
  Paper,
} from '@mui/material';

export interface AttendanceRecord {
  id: string;
  scannedAt: string;
  registration: {
    student: {
      name: string;
      rollNumber?: string | null;
      department?: string | null;
    };
  };
  volunteer: {
    name: string;
  };
}

interface AttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  event: { title: string } | null;
  attendance: AttendanceRecord[];
  onRevokeAttendance: (attendanceId: string) => void;
}

export const AttendanceDialog: React.FC<AttendanceDialogProps> = ({
  open,
  onClose,
  event,
  attendance,
  onRevokeAttendance,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        Live Scanned Attendance - {event?.title}
      </DialogTitle>
      <DialogContent>
        {attendance.length === 0 ? (
          <Typography>No attendance scanned yet.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Roll Number</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Scanned At</TableCell>
                  <TableCell>Scanned By</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.registration.student.name}</TableCell>
                    <TableCell>{a.registration.student.rollNumber || 'N/A'}</TableCell>
                    <TableCell>{a.registration.student.department || 'N/A'}</TableCell>
                    <TableCell>{new Date(a.scannedAt).toLocaleTimeString()}</TableCell>
                    <TableCell>{a.volunteer.name}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => onRevokeAttendance(a.id)}
                      >
                        Revoke
                      </Button>
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
