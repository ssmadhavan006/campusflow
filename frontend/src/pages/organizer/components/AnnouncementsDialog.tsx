import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  CircularProgress,
  Card,
} from '@mui/material';

export interface Announcement {
  id: string;
  content: string;
  createdAt: string;
}

interface AnnouncementsDialogProps {
  open: boolean;
  onClose: () => void;
  event: { id: string; title: string } | null;
  announcementsList: Announcement[];
  announcementsLoading: boolean;
  onPostAnnouncement: (content: string) => Promise<boolean>;
}

export const AnnouncementsDialog: React.FC<AnnouncementsDialogProps> = ({
  open,
  onClose,
  event,
  announcementsList,
  announcementsLoading,
  onPostAnnouncement,
}) => {
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const ok = await onPostAnnouncement(content);
      if (ok) {
        setContent('');
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        Event Announcements - {event?.title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, mt: 1 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            label="Post New Announcement"
            placeholder="Type announcement here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 1.5 }}
            disabled={posting}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handlePost}
            disabled={!content.trim() || posting}
          >
            {posting ? 'Posting...' : 'Post Announcement'}
          </Button>
        </Box>

        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Announcement History
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {announcementsLoading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={24} />
          </Box>
        ) : announcementsList.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No announcements posted yet.
          </Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={2} sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {announcementsList.map((ann) => (
              <Card key={ann.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  Posted on {new Date(ann.createdAt).toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {ann.content}
                </Typography>
              </Card>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
