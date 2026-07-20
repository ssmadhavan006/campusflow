import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  Alert,
  TextField,
  CircularProgress,
} from '@mui/material';
import { useThemeMode } from '../../context/ThemeModeContext';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reference: string) => Promise<void>;
  amount: number;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  onSubmit,
  amount,
}) => {
  const { mode } = useThemeMode();
  const [paymentMethod, setPaymentMethod] = useState<'gpay' | 'bank'>('gpay');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const handlePaymentSubmit = async () => {
    if (!paymentRef.trim()) {
      setPaymentError('Transaction reference is required.');
      return;
    }
    setPaymentError(null);
    setPaymentLoading(true);
    try {
      await onSubmit(paymentRef);
      setPaymentRef('');
      onClose();
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || 'Failed to submit payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSimulate = () => {
    const randomId = Math.floor(100000 + Math.random() * 900000);
    const prefix = paymentMethod === 'gpay' ? 'CF-GPAY-' : 'CF-BANK-';
    setPaymentRef(`${prefix}${randomId}`);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        Simulated Payment Gateway
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Please select a simulated payment method below to complete your registration.
        </Typography>

        <Box display="flex" gap={1.5} mb={2.5}>
          <Button
            variant={paymentMethod === 'gpay' ? 'contained' : 'outlined'}
            onClick={() => { setPaymentMethod('gpay'); setPaymentRef(''); }}
            fullWidth
            size="small"
          >
            GPay / UPI
          </Button>
          <Button
            variant={paymentMethod === 'bank' ? 'contained' : 'outlined'}
            onClick={() => { setPaymentMethod('bank'); setPaymentRef(''); }}
            fullWidth
            size="small"
          >
            Bank Transfer
          </Button>
        </Box>

        {paymentMethod === 'gpay' ? (
          <Box sx={{ p: 2, mb: 2.5, bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)', borderRadius: 2, border: mode === 'dark' ? '1px dashed #fafafa' : '1px dashed #09090b' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: mode === 'dark' ? '#fafafa' : '#09090b' }}>
              UPI / Google Pay Details
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>UPI ID:</strong> pay@campusflow
            </Typography>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              <strong>Link:</strong> <a href={`upi://pay?pa=pay@campusflow&pn=CampusFlow&am=${amount.toFixed(2)}`} style={{ color: mode === 'dark' ? '#fafafa' : '#09090b', textDecoration: 'underline' }}>Open GPay Link</a>
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Pay using GPay and copy the transaction ID (UPI Ref No) from your app.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2, mb: 2.5, bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)', borderRadius: 2, border: mode === 'dark' ? '1px dashed #a1a1aa' : '1px dashed #71717a' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: mode === 'dark' ? '#a1a1aa' : '#71717a' }}>
              Bank Transfer Details
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Bank Name:</strong> CampusFlow Central Bank
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Account No:</strong> 123498761234
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>IFSC Code:</strong> CFB0001234
            </Typography>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              <strong>Holder:</strong> CampusFlow Events Account
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Transfer via IMPS/NEFT and copy the transaction reference number.
            </Typography>
          </Box>
        )}

        {paymentError && <Alert severity="error" sx={{ mb: 2 }}>{paymentError}</Alert>}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mb: 2 }}>
          <TextField
            fullWidth
            label="Transaction Reference"
            variant="outlined"
            size="small"
            required
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            disabled={paymentLoading}
            placeholder={paymentMethod === 'gpay' ? 'e.g. UPI Ref No' : 'e.g. Txn Ref No'}
          />
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            onClick={handleSimulate}
            sx={{ whiteSpace: 'nowrap', height: 40 }}
          >
            Simulate Reference
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={paymentLoading}>
          Cancel
        </Button>
        <Button
          onClick={handlePaymentSubmit}
          variant="contained"
          color="primary"
          disabled={paymentLoading}
        >
          {paymentLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
