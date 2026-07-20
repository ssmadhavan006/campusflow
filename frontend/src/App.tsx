import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeModeProvider } from './context/ThemeModeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Layout } from './components/common/Layout';

import { Login } from './pages/auth/Login';
import { CompleteProfile } from './pages/auth/CompleteProfile';
import { Unauthorized } from './pages/Unauthorized';
import { EventsList } from './pages/EventsList';
import { EventDetail } from './pages/EventDetail';
import { Profile } from './pages/Profile';
import { Clubs } from './pages/Clubs';

import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentRegistrations } from './pages/student/StudentRegistrations';
import { StudentODs } from './pages/student/StudentODs';

import { OrganizerDashboard } from './pages/organizer/OrganizerDashboard';
import { CreateEvent } from './pages/organizer/CreateEvent';
import { EditEvent } from './pages/organizer/EditEvent';

import { VolunteerScanner } from './pages/volunteer/VolunteerScanner';

import { FacultyDashboard } from './pages/faculty/FacultyDashboard';

import { AdminDashboard } from './pages/admin/AdminDashboard';

import { LandingPage } from './pages/LandingPage';

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'STUDENT': return <Navigate to="/student-dashboard" replace />;
    case 'FACULTY': return <Navigate to="/organizer-dashboard" replace />;
    case 'HOD': return <Navigate to="/faculty-dashboard" replace />;
    case 'ADMIN': return <Navigate to="/admin-dashboard" replace />;
    default: return <Navigate to="/events" replace />;
  }
};

function App() {
  return (
    <ThemeModeProvider>
      <LanguageProvider>
        <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<RoleRedirect />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              
              <Route element={<Layout><Outlet /></Layout>}>
                <Route path="/events" element={<EventsList />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/clubs" element={<Clubs />} />

                {/* Standard Student Routes */}
                <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']} />}>
                  <Route path="/student-dashboard" element={<StudentDashboard />} />
                  <Route path="/student-registrations" element={<StudentRegistrations />} />
                  <Route path="/student-ods" element={<StudentODs />} />
                </Route>

                {/* Faculty & HOD Organizer Routes */}
                <Route element={<ProtectedRoute allowedRoles={['FACULTY', 'HOD', 'ADMIN']} />}>
                  <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
                  <Route path="/create-event" element={<CreateEvent />} />
                  <Route path="/events/:id/edit" element={<EditEvent />} />
                </Route>

                {/* Scanner Route (Faculty, HOD, Admin, and Volunteer Students) */}
                <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'FACULTY', 'HOD', 'ADMIN']} requireClubOrganizer />}>
                  <Route path="/volunteer-scanner" element={<VolunteerScanner />} />
                </Route>

                {/* HOD Approver Route */}
                <Route element={<ProtectedRoute allowedRoles={['HOD', 'ADMIN']} />}>
                  <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </LanguageProvider>
    </ThemeModeProvider>
  );
}

export default App;
