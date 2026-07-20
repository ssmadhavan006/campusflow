import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Typography,
  Button,
  Grid,
  Container,
  useTheme,
  Card,
  CardContent,
  Link,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  QrCode as QrIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Smartphone as PhoneIcon,
  Download as DownloadIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Interactive Simulator State
  const [activeStep, setActiveStep] = useState<number>(0);
  const [registerSimState, setRegisterSimState] = useState<'idle' | 'success'>('idle');
  const [scanSimState, setScanSimState] = useState<'scanning' | 'verified'>('scanning');

  // Trigger state resets when switching tabs in simulator
  useEffect(() => {
    if (activeStep === 0) {
      setRegisterSimState('idle');
    }
    if (activeStep === 2) {
      setScanSimState('scanning');
      const timer = setTimeout(() => {
        setScanSimState('verified');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [activeStep]);

  const handleActionClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const steps = [
    {
      title: '1. Register in One Click',
      description: 'Students sign in securely with their Google Workspace IDs, instantly browse active campus events, and register for seats in seconds.',
    },
    {
      title: '2. Generate Signed QR Passes',
      description: 'Once registered, a cryptographic digital ticket is generated and added to the student profile, verifying registration parameters.',
    },
    {
      title: '3. Instant Gate Verification',
      description: 'Volunteers scan the ticket using the built-in web scanner. In-memory locks verify the signatures in real time to grant check-in.',
    },
    {
      title: '4. Automated OD Approval',
      description: 'Upon successful ticket scans, the system automates On-Duty requests. HODs approve the rosters in bulk and generate verified OD letters.',
    },
  ];

  return (
    <Box sx={{ bgcolor: isDarkMode ? '#000000' : '#ffffff', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* 1. Frosted Glass Sticky Navigation Header */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, md: 6 },
        bgcolor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography sx={{
            fontFamily: '"SF Pro Display", "Inter", sans-serif',
            fontSize: '19px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: isDarkMode ? '#ffffff' : '#1d1d1f',
          }}>
            CampusFlow
          </Typography>
          <Box sx={{
            bgcolor: '#0066cc',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 700,
            px: 1,
            py: 0.2,
            borderRadius: '4px',
            letterSpacing: '0.05em'
          }}>
            RAMAPURAM
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="contained"
            onClick={handleActionClick}
            sx={{
              bgcolor: '#0066cc',
              color: '#ffffff',
              fontFamily: '"SF Pro Text", "Inter", sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '9999px',
              px: 2.5,
              py: 0.5,
              minHeight: '28px',
              textTransform: 'none',
              boxShadow: 'none',
              transition: 'all 0.15s ease-in-out',
              '&:hover': {
                bgcolor: '#0071e3',
                boxShadow: 'none',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            {user ? 'Go to Dashboard' : 'Sign In'}
          </Button>
        </Box>
      </Box>

      {/* 2. Hero Section (Edge-to-Edge display with minimalist style) */}
      <Box sx={{
        bgcolor: isDarkMode ? '#000000' : '#ffffff',
        pt: { xs: 8, md: 12 },
        pb: { xs: 6, md: 8 },
        textAlign: 'center',
        px: 2,
      }}>
        <Container maxWidth="md">
          <Typography variant="h1" sx={{
            fontFamily: '"SF Pro Display", "Inter", sans-serif',
            fontSize: { xs: '44px', md: '64px' },
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: isDarkMode ? '#ffffff' : '#1d1d1f',
            mb: 2
          }}>
            CampusFlow.
          </Typography>
          <Typography sx={{
            fontFamily: '"SF Pro Text", "Inter", sans-serif',
            fontSize: { xs: '20px', md: '26px' },
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: '0.01em',
            color: isDarkMode ? '#a1a1a6' : '#86868b',
            mb: 4,
            maxWidth: '640px',
            mx: 'auto'
          }}>
            Every registration tracked. Every check-in verified. Every On-Duty automated.
          </Typography>

          <Box display="flex" justifyContent="center" gap={2} mb={6}>
            <Button
              variant="contained"
              onClick={handleActionClick}
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: '#0066cc',
                color: '#ffffff',
                fontFamily: '"SF Pro Text", "Inter", sans-serif',
                fontSize: '16px',
                fontWeight: 500,
                borderRadius: '9999px',
                px: 4,
                py: 1.2,
                textTransform: 'none',
                boxShadow: 'none',
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                  bgcolor: '#0071e3',
                  boxShadow: 'none',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                }
              }}
            >
              {user ? 'Open Dashboard' : 'Get Started'}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* 3. Interactive Workflow Simulator (Alternating Parchment Canvas) */}
      <Box sx={{
        bgcolor: isDarkMode ? '#121212' : '#f5f5f7',
        py: { xs: 8, md: 12 },
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="overline" sx={{
              fontFamily: '"SF Pro Text", sans-serif',
              fontWeight: 600,
              color: '#0066cc',
              letterSpacing: '0.08em',
              fontSize: '12px',
              textTransform: 'uppercase',
              display: 'block',
              mb: 1
            }}>
              Interactive Demo
            </Typography>
            <Typography variant="h2" sx={{
              fontFamily: '"SF Pro Display", "Inter", sans-serif',
              fontSize: { xs: '32px', md: '40px' },
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: isDarkMode ? '#ffffff' : '#1d1d1f',
            }}>
              Experience the campus lifecycle.
            </Typography>
          </Box>

          <Grid container spacing={6} alignItems="center">
            {/* Left Steps Switcher */}
            <Grid item xs={12} md={6}>
              <Box display="flex" flexDirection="column" gap={2}>
                {steps.map((step, idx) => {
                  const isActive = activeStep === idx;
                  return (
                    <Box
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      tabIndex={0}
                      role="button"
                      aria-pressed={isActive}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveStep(idx);
                        }
                      }}
                      sx={{
                        p: 3,
                        borderRadius: '16px',
                        cursor: 'pointer',
                        bgcolor: isActive ? (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff') : 'transparent',
                        border: '1px solid',
                        borderColor: isActive ? 'divider' : 'transparent',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          bgcolor: isActive ? (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff') : (isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                        },
                        '&:focus-visible': {
                          outline: '2px solid #0066cc',
                          outlineOffset: '2px',
                        }
                      }}
                    >
                      <Typography sx={{
                        fontFamily: '"SF Pro Display", sans-serif',
                        fontWeight: 600,
                        fontSize: '19px',
                        color: isActive ? '#0066cc' : (isDarkMode ? '#ffffff' : '#1d1d1f'),
                        mb: 1
                      }}>
                        {step.title}
                      </Typography>
                      <Typography sx={{
                        fontFamily: '"SF Pro Text", sans-serif',
                        fontSize: '14px',
                        color: isDarkMode ? '#a1a1a6' : '#7a7a7a',
                        lineHeight: 1.4
                      }}>
                        {step.description}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Grid>

            {/* Right Phone Simulator Frame */}
            <Grid item xs={12} md={6} display="flex" justifyContent="center">
              <Box sx={{
                width: '270px',
                height: '520px',
                borderRadius: '38px',
                border: '12px solid #1d1d1f',
                boxShadow: 'rgba(0, 0, 0, 0.25) 0px 20px 50px',
                bgcolor: isDarkMode ? '#000000' : '#ffffff',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Phone Speaker notch */}
                <Box sx={{
                  width: '110px',
                  height: '18px',
                  bgcolor: '#1d1d1f',
                  borderBottomLeftRadius: '14px',
                  borderBottomRightRadius: '14px',
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 200,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Box sx={{ width: '40px', height: '3px', borderRadius: '1.5px', bgcolor: '#333', mb: '2px' }} />
                </Box>

                {/* iPhone Screen Header */}
                <Box sx={{
                  pt: 2.5,
                  pb: 1,
                  px: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: isDarkMode ? '#0d0d0d' : '#f5f5f7'
                }}>
                  <Typography sx={{ fontSize: '11px', fontWeight: 600, color: 'text.primary' }}>9:41</Typography>
                  <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#0066cc' }}>CampusFlow</Typography>
                </Box>

                {/* Simulated App Content Canvas */}
                <Box sx={{ flex: 1, p: 2, position: 'relative', overflow: 'hidden', bgcolor: 'background.default' }}>
                  
                  {/* STEP 1: Registration View */}
                  {activeStep === 0 && (
                    <Box display="flex" flexDirection="column" height="100%" justifyContent="center" alignItems="center">
                      <Card sx={{ width: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: '12px', bgcolor: 'background.paper' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography sx={{ fontSize: '10px', color: '#0066cc', fontWeight: 700, mb: 0.5 }}>CSE DEPT</Typography>
                          <Typography sx={{ fontSize: '15px', fontWeight: 600, color: 'text.primary', mb: 1, lineHeight: 1.2 }}>National Tech Quest</Typography>
                          
                          <Box display="flex" flexDirection="column" gap={0.5} mb={2}>
                            <Typography sx={{ fontSize: '11px', color: 'text.secondary' }}>📅 Date: July 28, 2026</Typography>
                            <Typography sx={{ fontSize: '11px', color: 'text.secondary' }}>📍 Venue: Auditorium 3</Typography>
                            <Typography sx={{ fontSize: '11px', color: 'text.secondary' }}>🎟 Seats Remaining: 14</Typography>
                          </Box>

                          {registerSimState === 'idle' ? (
                            <Button
                              variant="contained"
                              onClick={() => setRegisterSimState('success')}
                              fullWidth
                              sx={{
                                bgcolor: '#0066cc',
                                color: '#ffffff',
                                fontSize: '12px',
                                textTransform: 'none',
                                borderRadius: '9999px',
                                py: 0.8,
                                boxShadow: 'none',
                                '&:hover': { bgcolor: '#0071e3', boxShadow: 'none' }
                              }}
                            >
                              Register Seat
                            </Button>
                          ) : (
                            <Box sx={{
                              bgcolor: 'rgba(0, 102, 204, 0.08)',
                              border: '1px solid #0066cc',
                              borderRadius: '8px',
                              py: 1,
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 1
                            }}>
                              <CheckCircleIcon sx={{ color: '#0066cc', fontSize: '16px' }} />
                              <Typography sx={{ fontSize: '12px', color: '#0066cc', fontWeight: 600 }}>Seat Confirmed!</Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Box>
                  )}

                  {/* STEP 2: Digital Ticket / QR View */}
                  {activeStep === 1 && (
                    <Box display="flex" flexDirection="column" height="100%" justifyContent="center" alignItems="center">
                      <Box sx={{
                        width: '100%',
                        bgcolor: 'background.paper',
                        borderRadius: '16px',
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                        textAlign: 'center',
                      }}>
                        <Box sx={{ bgcolor: '#0066cc', py: 1, color: '#ffffff' }}>
                          <Typography sx={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em' }}>DIGITAL PASS</Typography>
                        </Box>
                        <Box p={2} display="flex" flexDirection="column" alignItems="center">
                          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: 'text.primary' }}>Aditya Kumar</Typography>
                          <Typography sx={{ fontSize: '10px', color: 'text.secondary', mb: 2 }}>CSE • CSE-A • IV Year</Typography>
                          
                          {/* Mock QR Code representation */}
                          <Box sx={{
                            width: '120px',
                            height: '120px',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '8px',
                            p: 1,
                            bgcolor: '#ffffff',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <QrIcon sx={{ fontSize: '100px', color: '#1d1d1f' }} />
                            {/* Scanning laser line */}
                            <Box sx={{
                              position: 'absolute',
                              left: 0,
                              right: 0,
                              height: '2px',
                              bgcolor: '#0066cc',
                              boxShadow: '0 0 6px #0066cc',
                              animation: 'laserLine 2.5s infinite linear',
                              '@keyframes laserLine': {
                                '0%': { top: '10%' },
                                '50%': { top: '90%' },
                                '100%': { top: '10%' }
                              }
                            }} />
                          </Box>
                          <Typography sx={{ fontSize: '10px', color: 'text.secondary', mt: 1.5 }}>Token Signature Verified ✓</Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {/* STEP 3: Scanner View */}
                  {activeStep === 2 && (
                    <Box display="flex" flexDirection="column" height="100%" justifyContent="center" alignItems="center">
                      <Box sx={{
                        width: '100%',
                        height: '220px',
                        border: '1px dashed #0066cc',
                        borderRadius: '12px',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2,
                        textAlign: 'center',
                        position: 'relative'
                      }}>
                        {scanSimState === 'scanning' ? (
                          <>
                            <PhoneIcon sx={{ fontSize: '48px', color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                            <Typography sx={{ fontSize: '11px', color: 'text.secondary' }}>Align QR pass inside window</Typography>
                            <Box sx={{
                              position: 'absolute',
                              left: '20px',
                              right: '20px',
                              height: '1px',
                              bgcolor: '#0066cc',
                              animation: 'scanSweep 1.5s infinite ease-in-out',
                              '@keyframes scanSweep': {
                                '0%': { top: '20%' },
                                '50%': { top: '80%' },
                                '100%': { top: '20%' }
                              }
                            }} />
                          </>
                        ) : (
                          <Box display="flex" flexDirection="column" alignItems="center">
                            <CheckCircleIcon sx={{ color: '#0066cc', fontSize: '44px', mb: 1 }} />
                            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: 'text.primary' }}>Attendance Recorded</Typography>
                            <Typography sx={{ fontSize: '11px', color: 'text.secondary', mt: 0.5 }}>Aditya Kumar (CSE-A)</Typography>
                          </Box>
                        )}
                      </Box>
                      <Button
                        variant="text"
                        onClick={() => setScanSimState('scanning')}
                        disabled={scanSimState === 'scanning'}
                        sx={{ mt: 2, fontSize: '11px', textTransform: 'none', color: '#0066cc' }}
                      >
                        {scanSimState === 'scanning' ? 'Scanning camera...' : 'Reset Scanner'}
                      </Button>
                    </Box>
                  )}

                  {/* STEP 4: OD PDF Certificate */}
                  {activeStep === 3 && (
                    <Box display="flex" flexDirection="column" height="100%" justifyContent="center" alignItems="center">
                      <Box sx={{
                        width: '100%',
                        bgcolor: 'background.paper',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        p: 1.5,
                        textAlign: 'left',
                        boxShadow: 'rgba(0,0,0,0.05) 0px 4px 12px'
                      }}>
                        <Box sx={{ borderBottom: '1px solid #eee', pb: 1, mb: 1, textAlign: 'center' }}>
                          <Typography sx={{ fontSize: '8px', fontWeight: 700, color: '#1d1d1f' }}>SRM RAMAPURAM</Typography>
                          <Typography sx={{ fontSize: '6px', color: 'text.secondary' }}>ON-DUTY LETTER CERTIFICATE</Typography>
                        </Box>
                        
                        <Box display="flex" flexDirection="column" gap={0.5} mb={1.5}>
                          <Typography sx={{ fontSize: '7px', color: 'text.primary' }}><strong>Student:</strong> Aditya Kumar</Typography>
                          <Typography sx={{ fontSize: '7px', color: 'text.primary' }}><strong>Event:</strong> National Tech Quest 2026</Typography>
                          <Typography sx={{ fontSize: '7px', color: 'text.primary' }}><strong>Status:</strong> Approved & Verified</Typography>
                        </Box>

                        <Box display="flex" justifyContent="space-between" alignItems="center" pt={1} sx={{ borderTop: '1px dashed #eee' }}>
                          <Typography sx={{ fontSize: '6px', color: 'text.secondary' }}>Key: CF-29AA-9F</Typography>
                          <Box sx={{ width: '30px', height: '10px', bgcolor: '#f5f5f7', borderRadius: '2px', border: '1px solid #ddd' }} />
                        </Box>
                      </Box>
                      
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          mt: 2,
                          bgcolor: '#0066cc',
                          color: '#ffffff',
                          fontSize: '11px',
                          textTransform: 'none',
                          borderRadius: '9999px',
                          py: 0.8,
                          boxShadow: 'none',
                          '&:hover': { bgcolor: '#0071e3', boxShadow: 'none' }
                        }}
                      >
                        Download PDF
                      </Button>
                    </Box>
                  )}

                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 4. High-Yield Feature Cards Grid (Museum Gallery style) */}
      <Box sx={{ bgcolor: isDarkMode ? '#000000' : '#ffffff', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="overline" sx={{
              fontFamily: '"SF Pro Text", sans-serif',
              fontWeight: 600,
              color: '#0066cc',
              letterSpacing: '0.08em',
              fontSize: '12px',
              textTransform: 'uppercase',
              display: 'block',
              mb: 1
            }}>
              Product Advantages
            </Typography>
            <Typography variant="h2" sx={{
              fontFamily: '"SF Pro Display", "Inter", sans-serif',
              fontSize: { xs: '32px', md: '40px' },
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: isDarkMode ? '#ffffff' : '#1d1d1f',
            }}>
              Designed for modern campus scale.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: '18px', bgcolor: isDarkMode ? '#121212' : '#ffffff' }}>
                <CardContent sx={{ p: 4 }}>
                  <SpeedIcon sx={{ color: '#0066cc', fontSize: 36, mb: 2 }} />
                  <Typography variant="h6" sx={{ fontFamily: '"SF Pro Display", sans-serif', fontWeight: 600, mb: 1 }}>High Throughput</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                    Built with concurrency locking and in-memory rate limiters, allowing hundreds of concurrent ticket registrations without bottlenecking event capacities.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: '18px', bgcolor: isDarkMode ? '#121212' : '#ffffff' }}>
                <CardContent sx={{ p: 4 }}>
                  <SecurityIcon sx={{ color: '#0066cc', fontSize: 36, mb: 2 }} />
                  <Typography variant="h6" sx={{ fontFamily: '"SF Pro Display", sans-serif', fontWeight: 600, mb: 1 }}>Cryptographic Security</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                    Tickets are signed using dynamic HMAC functions, completely eliminating verification forgery, screenshot manipulation, or unauthorized gate check-ins.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: '18px', bgcolor: isDarkMode ? '#121212' : '#ffffff' }}>
                <CardContent sx={{ p: 4 }}>
                  <SchoolIcon sx={{ color: '#0066cc', fontSize: 36, mb: 2 }} />
                  <Typography variant="h6" sx={{ fontFamily: '"SF Pro Display", sans-serif', fontWeight: 600, mb: 1 }}>OD Automations</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                    Integrates ticket gate scanning directly with the academic approval registry, saving coordinators hours of manual signing via bulk HOD PDF generators.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 5. Dark Marketing Call-To-Action Tile */}
      <Box sx={{
        bgcolor: isDarkMode ? '#0d0d0d' : '#272729',
        py: { xs: 10, md: 15 },
        px: { xs: 2, md: 6 },
        textAlign: 'center'
      }}>
        <Container maxWidth="md">
          <Typography variant="h2" sx={{
            fontFamily: '"SF Pro Display", "Inter", sans-serif',
            fontSize: { xs: '32px', md: '48px' },
            fontWeight: 600,
            lineHeight: 1.1,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            mb: 3
          }}>
            Ready to experience CampusFlow?
          </Typography>
          <Typography sx={{
            fontFamily: '"SF Pro Text", "Inter", sans-serif',
            fontSize: '17px',
            lineHeight: 1.5,
            color: '#cccccc',
            maxWidth: '540px',
            mx: 'auto',
            mb: 5
          }}>
            Join SRM Ramapuram's faculty, HODs, and student body today. Sign in to start registering for events or coordinate approvals.
          </Typography>
          <Button
            variant="contained"
            onClick={handleActionClick}
            sx={{
              bgcolor: '#ffffff',
              color: '#1d1d1f',
              fontFamily: '"SF Pro Text", "Inter", sans-serif',
              fontSize: '16px',
              fontWeight: 500,
              borderRadius: '9999px',
              px: 4,
              py: 1.2,
              textTransform: 'none',
              boxShadow: 'none',
              transition: 'all 0.15s ease-in-out',
              '&:hover': {
                bgcolor: '#f5f5f7',
                boxShadow: 'none',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            {user ? 'Enter App Dashboard' : 'Sign In Now'}
          </Button>
        </Container>
      </Box>

      {/* 6. Footer Column Layout */}
      <Box sx={{
        bgcolor: isDarkMode ? '#121212' : '#f5f5f7',
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 8,
        px: { xs: 2, md: 6 }
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid item xs={12} sm={4}>
              <Typography sx={{
                fontFamily: '"SF Pro Text", sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: isDarkMode ? '#ffffff' : '#1d1d1f',
                mb: 2
              }}>
                CampusFlow Ramapuram
              </Typography>
              <Typography sx={{
                fontFamily: '"SF Pro Text", sans-serif',
                fontSize: '12px',
                lineHeight: 1.5,
                color: 'text.secondary'
              }}>
                The unified portal for students, student volunteers, faculty coordinators, and HODs at SRM IST, Ramapuram.
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography sx={{
                fontFamily: '"SF Pro Text", sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: isDarkMode ? '#ffffff' : '#1d1d1f',
                mb: 2
              }}>
                Engineering & Tech
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography sx={{ fontFamily: '"SF Pro Text", sans-serif', fontSize: '12px', color: 'text.secondary' }}>HMAC Ticket Signatures</Typography>
                <Typography sx={{ fontFamily: '"SF Pro Text", sans-serif', fontSize: '12px', color: 'text.secondary' }}>Express Rate Limit Protection</Typography>
                <Typography sx={{ fontFamily: '"SF Pro Text", sans-serif', fontSize: '12px', color: 'text.secondary' }}>PDFKit Batch Generator</Typography>
                <Typography sx={{ fontFamily: '"SF Pro Text", sans-serif', fontSize: '12px', color: 'text.secondary' }}>Prisma PostgreSQL Schema</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography sx={{
                fontFamily: '"SF Pro Text", sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: isDarkMode ? '#ffffff' : '#1d1d1f',
                mb: 2
              }}>
                Institutional Links
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Link
                  href="https://www.srmramapuram.ac.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{ fontFamily: '"SF Pro Text", sans-serif', fontSize: '12px', color: 'text.secondary' }}
                >
                  SRM Ramapuram Home
                </Link>
                <Link
                  href="#"
                  role="button"
                  onClick={(e) => e.preventDefault()}
                  underline="hover"
                  sx={{ fontFamily: '"SF Pro Text", sans-serif', fontSize: '12px', color: 'text.secondary' }}
                >
                  Student IT Helpdesk
                </Link>
                <Link
                  href="#"
                  role="button"
                  onClick={(e) => e.preventDefault()}
                  underline="hover"
                  sx={{ fontFamily: '"SF Pro Text", sans-serif', fontSize: '12px', color: 'text.secondary' }}
                >
                  Security & Privacy Code
                </Link>
              </Box>
            </Grid>
          </Grid>

          <Typography sx={{
            fontFamily: '"SF Pro Text", sans-serif',
            fontSize: '12px',
            color: 'text.secondary',
            textAlign: 'center',
            borderTop: '1px solid',
            borderColor: 'divider',
            pt: 4
          }}>
            © {new Date().getFullYear()} SRM Institute of Science and Technology. All rights reserved. Built exclusively for SRM IST Ramapuram.
          </Typography>
        </Container>
      </Box>

    </Box>
  );
};
