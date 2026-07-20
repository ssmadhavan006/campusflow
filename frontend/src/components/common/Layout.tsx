import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeModeContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
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
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
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
  const { mode, toggleTheme } = useThemeMode();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notiAnchor, setNotiAnchor] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const [notificationPage, setNotificationPage] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);

  const fetchNotifications = async (page = 1) => {
    try {
      const res = await api.get(`/users/notifications?page=${page}&limit=5`);
      if (page === 1) {
        setNotifications(res.data.data.notifications);
      } else {
        setNotifications((prev) => {
          const existingIds = new Set(prev.map(n => n.id));
          const newItems = res.data.data.notifications.filter((n: any) => !existingIds.has(n.id));
          return [...prev, ...newItems];
        });
      }
      setTotalNotifications(res.data.data.total || 0);
      setNotificationPage(page);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications(1);

      const socket = getSocket();
      const handleNewNotification = (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setTotalNotifications((prev) => prev + 1);
      };
      const handleReconnect = () => fetchNotifications(1);

      socket.on('notification:new', handleNewNotification);
      socket.on('connect', handleReconnect);

      return () => {
        socket.off('notification:new', handleNewNotification);
        socket.off('connect', handleReconnect);
      };
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

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/users/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;


  const getNavLinks = () => {
    const links = [];

    // All authenticated users can see events list
    links.push({ text: t('allEvents'), path: '/events', icon: <EventIcon /> });

    // Student pages
    if (user?.role === 'STUDENT' || user?.role === 'ADMIN') {
      links.push(
        { text: t('dashboard'), path: '/student-dashboard', icon: <DashboardIcon /> },
        { text: t('registrations'), path: '/student-registrations', icon: <EventIcon /> },
        { text: t('myODs'), path: '/student-ods', icon: <ODLetterIcon /> }
      );
    }

    // HOD pages (Approvals)
    if (user?.role === 'HOD' || user?.role === 'ADMIN') {
      links.push({ text: t('dashboard'), path: '/faculty-dashboard', icon: <FacultyIcon /> });
    }

    // Faculty & HOD Event Creation and Event Center pages
    if (user?.role === 'FACULTY' || user?.role === 'HOD' || user?.role === 'ADMIN') {
      links.push(
        { text: t('dashboard'), path: '/organizer-dashboard', icon: <DashboardIcon /> },
        { text: t('createEvent'), path: '/create-event', icon: <EventIcon /> }
      );
    }

    // Scanner Dashboard (Hosts, HODs, Admins, and Student Volunteers)
    const isVolunteer = user?.clubMembers && user.clubMembers.length > 0;
    const canScan = ['ADMIN', 'FACULTY', 'HOD'].includes(user?.role || '') || (user?.role === 'STUDENT' && isVolunteer);
    if (canScan) {
      links.push({ text: t('dashboard'), path: '/volunteer-scanner', icon: <ScannerIcon /> });
    }

    if (user?.role === 'ADMIN') {
      links.push({ text: t('admin'), path: '/admin-dashboard', icon: <AdminIcon /> });
    }

    // Departments (represented by Club model)
    if (user && user.role === 'ADMIN') {
      links.push({ text: t('clubs'), path: '/clubs', icon: <ClubIcon /> });
    }

    // Common Profile Link
    links.push({ text: t('profile'), path: '/profile', icon: <ProfileIcon /> });

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
            fontFamily: '"Inter", sans-serif',
            fontWeight: 600,
            color: mode === 'dark' ? '#ffffff' : '#1d1d1f',
            letterSpacing: '-0.02em',
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
          {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
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
          const isActive = link.path === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(link.path);
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
          {t('logout')}
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
          <Typography variant="h6" noWrap component="div" sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, letterSpacing: '-0.01em' }}>
            {navLinks.find((l) => l.path === '/' ? location.pathname === '/' : location.pathname.startsWith(l.path))?.text || t('dashboard')}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              color="inherit"
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
              sx={{ fontWeight: 'bold', minWidth: 40, mr: 1 }}
            >
              {language === 'en' ? 'EN' : 'தமிழ்'}
            </Button>
            <IconButton color="inherit" onClick={toggleTheme} aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <IconButton color="inherit" onClick={(e) => setNotiAnchor(e.currentTarget)} aria-label="Notifications">
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
                  <Button
                    size="small"
                    onClick={handleMarkAllAsRead}
                    sx={{ fontSize: '0.72rem', py: 0 }}
                  >
                    Mark all read
                  </Button>
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
              {notifications.length < totalNotifications && (
                <>
                  <Divider />
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                    <Button
                      size="small"
                      onClick={() => fetchNotifications(notificationPage + 1)}
                      sx={{ fontSize: '0.72rem' }}
                    >
                      Load More
                    </Button>
                  </Box>
                </>
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
