import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeModeContext';
import { api } from '../../services/api';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Event as EventIcon,
  Dashboard as DashboardIcon,
  QrCodeScanner as ScannerIcon,
  Assignment as ODLetterIcon,
  VerifiedUser as FacultyIcon,
  SupervisorAccount as AdminIcon,
  Notifications as NotificationIcon,
  Logout as LogoutIcon,
  Person as ProfileIcon,
  Group as ClubIcon,
} from '@mui/icons-material';

const drawerWidth = 260;

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { mode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notiAnchor, setNotiAnchor] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/users/notifications');
      setNotifications(res.data.data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/users/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNavLinks = () => {
    const links = [];

    // All authenticated users can see events list
    links.push({ text: 'All Events', path: '/events', icon: <EventIcon /> });

    if (user?.role === 'STUDENT' || user?.role === 'ADMIN') {
      links.push(
        { text: 'Student Dashboard', path: '/student-dashboard', icon: <DashboardIcon /> },
        { text: 'My Registrations', path: '/student-registrations', icon: <EventIcon /> },
        { text: 'My OD Letters', path: '/student-ods', icon: <ODLetterIcon /> }
      );

      const isClubOrganizer = user?.clubMembers && user.clubMembers.length > 0;
      if (user?.role === 'ADMIN' || isClubOrganizer) {
        links.push(
          { text: 'Event Center', path: '/organizer-dashboard', icon: <DashboardIcon /> },
          { text: 'Create Event', path: '/create-event', icon: <EventIcon /> },
          { text: 'Scanner Dashboard', path: '/volunteer-scanner', icon: <ScannerIcon /> }
        );
      }
    }

    if (user?.role === 'FACULTY' || user?.role === 'ADMIN') {
      links.push({ text: 'Faculty Dashboard', path: '/faculty-dashboard', icon: <FacultyIcon /> });
    }

    if (user?.role === 'ADMIN') {
      links.push({ text: 'Admin Dashboard', path: '/admin-dashboard', icon: <AdminIcon /> });
    }

    if (user?.role === 'STUDENT' || user?.role === 'FACULTY' || user?.role === 'ADMIN') {
      links.push({ text: 'Clubs', path: '/clubs', icon: <ClubIcon /> });
    }

    // Common Profile Link
    links.push({ text: 'Profile', path: '/profile', icon: <ProfileIcon /> });

    return links;
  };

  const navLinks = getNavLinks();

  const drawerContent = (
    <Box sx={{ height: '100%', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Typography
          variant="h6"
          noWrap
          sx={{
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 800,
            background: mode === 'dark' ? 'linear-gradient(to right, #ffffff, #a1a1aa)' : 'linear-gradient(to right, #09090b, #71717a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: 1,
          }}
        >
          CampusFlow
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
          }}
        >
          {user?.name.charAt(0).toUpperCase()}
        </Box>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>
            {user?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {user?.role}
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List sx={{ px: 1, flexGrow: 1 }}>
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <ListItem key={link.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={link.path}
                sx={{
                  borderRadius: 1.5,
                  bgcolor: isActive ? (mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)') : 'transparent',
                  color: isActive ? 'primary.main' : 'text.primary',
                  '&:hover': {
                    bgcolor: isActive ? (mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)') : (mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'primary.main' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {link.icon}
                </ListItemIcon>
                <ListItemText
                  primary={link.text}
                  primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isActive ? 600 : 500 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="secondary"
          startIcon={<LogoutIcon />}
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 600 }}>
            {navLinks.find((l) => l.path === location.pathname)?.text || 'Dashboard'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit" onClick={(e) => setNotiAnchor(e.currentTarget)}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationIcon />
              </Badge>
            </IconButton>

            {/* Notification Menu */}
            <Menu
              anchorEl={notiAnchor}
              open={Boolean(notiAnchor)}
              onClose={() => setNotiAnchor(null)}
              PaperProps={{
                sx: { width: 320, maxHeight: 400, mt: 1.5, bgcolor: 'background.paper' },
              }}
            >
              <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Notifications
                </Typography>
                {unreadCount > 0 && (
                  <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}>
                    {unreadCount} unread
                  </Typography>
                )}
              </Box>
              <Divider />
              {notifications.length === 0 ? (
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    No notifications yet.
                  </Typography>
                </MenuItem>
              ) : (
                notifications.map((n) => (
                  <MenuItem
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id)}
                    sx={{
                      whiteSpace: 'normal',
                      bgcolor: n.read ? 'transparent' : (mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'),
                      py: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: n.read ? 500 : 700 }}>
                        {n.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        {n.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
                        {new Date(n.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
