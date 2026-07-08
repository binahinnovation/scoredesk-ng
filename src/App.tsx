import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Documentation from "./pages/Documentation";
import Blog from "./pages/Blog";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ResponsiveTest from "./pages/ResponsiveTest";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/layout/MainLayout";
import { useAuth } from "./hooks/use-auth";
import { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";

import { ProtectedRoute } from "./components/ProtectedRoute";

// New Pages
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/users/UserManagement";
import CreateLoginDetails from "./pages/users/CreateLoginDetails";
import StudentManagement from "./pages/students/StudentManagement";
import ClassSubjectManagement from "./pages/classes/ClassSubjectManagement";
import ResultEntry from "./pages/results/ResultEntry";
import StudentResultApproval from "./pages/results/StudentResultApproval";
import ClassRanking from "./pages/ranking/ClassRanking";
import ReportCardDesigner from "./pages/reportcards/ReportCardDesigner";
import SchoolBranding from "./pages/branding/SchoolBranding";
import ScratchCards from "./pages/scratchcards/ScratchCards";
import ScratchCardTester from "./components/ScratchCardTester";
import AnalyticsDashboard from "./pages/analytics/AnalyticsDashboard";
import SettingsPage from "./pages/settings/SettingsPage";
import StudentResultPortal from "./pages/students/StudentResultPortal";
import ManageUsers from "./pages/users/ManageUsers";
import RolePermissions from "./pages/users/RolePermissions";
import AssessmentSettings from "./pages/settings/AssessmentSettings";
import TermManagement from "./pages/settings/TermManagement";
import ProfileSettings from "./pages/ProfileSettings";
import QuestionPaperSubmission from "./pages/QuestionPaperSubmission";
import QuestionPaperManagement from "./pages/questions/QuestionPaperManagement";
import AuditLogsPage from "./pages/admin/AuditLogsPage";

// Attendance Pages
import MarkAttendancePage from "./pages/attendance/MarkAttendancePage";
import AttendanceSummaryPage from "./pages/attendance/AttendanceSummaryPage";

// New Messaging Pages
import InboxPage from "./pages/messages/InboxPage";
import SentPage from "./pages/messages/SentPage";
import DraftsPage from "./pages/messages/DraftsPage";
import MessageViewPage from "./pages/messages/MessageViewPage";
import ComposeMessagePage from "./pages/messages/ComposeMessagePage";

// AI Features
import LessonPlanGenerator from "./pages/LessonPlanGenerator";
import TimetableManagement from "./pages/TimetableManagement";

// Finance
import FeeManagement from "./pages/finance/FeeManagement";
import StudentFees from "./pages/finance/StudentFees";
import FinanceReports from "./pages/finance/FinanceReports";

// Communication
import SMSNotifications from "./pages/communication/SMSNotifications";

// Parent Portal
import ParentPortal from "./pages/parents/ParentPortal";

// Staff
import StaffDirectory from "./pages/staff/StaffDirectory";

// CBT
import CBTExamManagement from "./pages/cbt/CBTExamManagement";
import CBTStudentPortal from "./pages/students/CBTStudentPortal";

// Academic Calendar
import AcademicCalendar from "./pages/AcademicCalendar";

// Analytics
import StudentPerformanceTracker from "./pages/analytics/StudentPerformanceTracker";

// Storage & Backup
import CloudStorage from "./pages/settings/CloudStorage";
import DataBackup from "./pages/settings/DataBackup";

// Create a new client
const queryClient = new QueryClient();

// Auth-only protected route component
const AuthProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/documentation" element={<Documentation />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/student-results" element={<StudentResultPortal />} />
      <Route path="/parent-portal" element={<ParentPortal />} />
      <Route path="/cbt-portal" element={<CBTStudentPortal />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <AuthProtectedRoute>
          <MainLayout />
        </AuthProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={
          <ProtectedRoute requiredPermission="User Management">
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="users/create-login" element={
          <ProtectedRoute requiredPermission="User Management">
            <CreateLoginDetails />
          </ProtectedRoute>
        } />
        <Route path="users/manage" element={
          <ProtectedRoute requiredPermission="User Management">
            <ManageUsers />
          </ProtectedRoute>
        } />
        <Route path="users/permissions" element={
          <ProtectedRoute requiredPermission="User Management">
            <RolePermissions />
          </ProtectedRoute>
        } />
        <Route path="students" element={
          <ProtectedRoute requiredPermission="Student Management">
            <StudentManagement />
          </ProtectedRoute>
        } />
        <Route path="classes" element={
          <ProtectedRoute requiredPermission="Class/Subject Setup">
            <ClassSubjectManagement />
          </ProtectedRoute>
        } />
        <Route path="results/entry" element={
          <ProtectedRoute requiredPermission="Result Upload">
            <ResultEntry />
          </ProtectedRoute>
        } />
        <Route path="results/approval" element={
          <ProtectedRoute requiredPermission="Result Approval">
            <StudentResultApproval />
          </ProtectedRoute>
        } />
        <Route path="ranking" element={
          <ProtectedRoute requiredPermission="Position & Ranking">
            <ClassRanking />
          </ProtectedRoute>
        } />
        <Route path="reportcards" element={
          <ProtectedRoute requiredPermission="Report Card Designer">
            <ReportCardDesigner />
          </ProtectedRoute>
        } />
        <Route path="branding" element={
          <ProtectedRoute requiredPermission="School Branding">
            <SchoolBranding />
          </ProtectedRoute>
        } />
        <Route path="scratchcards" element={
          <ProtectedRoute requiredPermission="Scratch Card Generator">
            <ScratchCards />
          </ProtectedRoute>
        } />
        <Route path="scratchcards/test" element={
          <ProtectedRoute requiredPermission="Scratch Card Generator">
            <ScratchCardTester />
          </ProtectedRoute>
        } />
        <Route path="analytics" element={
          <ProtectedRoute requiredPermission="Analytics Dashboard">
            <AnalyticsDashboard />
          </ProtectedRoute>
        } />
        <Route path="settings/terms" element={
          <ProtectedRoute requiredPermission="Settings">
            <TermManagement />
          </ProtectedRoute>
        } />
        <Route path="settings/assessments" element={
          <ProtectedRoute requiredPermission="Assessment Management">
            <AssessmentSettings />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute requiredPermission="Settings">
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="profile-settings" element={<ProfileSettings />} />
        <Route path="questions/submission" element={
          <ProtectedRoute requiredPermission="Result Upload">
            <QuestionPaperSubmission />
          </ProtectedRoute>
        } />
        <Route path="questions/management" element={
          <ProtectedRoute requiredPermission="Result Approval">
            <QuestionPaperManagement />
          </ProtectedRoute>
        } />

        {/* New Messaging Routes */}
        <Route path="messages/inbox" element={<InboxPage />} />
        <Route path="messages/sent" element={<SentPage />} />
        <Route path="messages/drafts" element={<DraftsPage />} />
        <Route path="messages/view/:messageId" element={<MessageViewPage />} />
        <Route path="messages/compose" element={<ComposeMessagePage />} />
        <Route path="messages/:id" element={<MessageViewPage />} />

        {/* Attendance Routes */}
        <Route path="attendance/mark" element={
          <ProtectedRoute requiredPermission="Attendance Management">
            <MarkAttendancePage />
          </ProtectedRoute>
        } />
        <Route path="attendance/summary" element={
          <ProtectedRoute requiredPermission="Attendance Management">
            <AttendanceSummaryPage />
          </ProtectedRoute>
        } />

        {/* AI Features */}
        <Route path="lesson-plans" element={
          <ProtectedRoute requiredPermission="Settings">
            <LessonPlanGenerator />
          </ProtectedRoute>
        } />
        <Route path="timetable" element={
          <ProtectedRoute requiredPermission="Settings">
            <TimetableManagement />
          </ProtectedRoute>
        } />

        {/* Finance Routes */}
        <Route path="finance/fees" element={
          <ProtectedRoute requiredPermission="Settings">
            <FeeManagement />
          </ProtectedRoute>
        } />
        <Route path="finance/payments" element={
          <ProtectedRoute requiredPermission="Settings">
            <StudentFees />
          </ProtectedRoute>
        } />
        <Route path="finance/reports" element={
          <ProtectedRoute requiredPermission="Settings">
            <FinanceReports />
          </ProtectedRoute>
        } />

        {/* SMS Notifications */}
        <Route path="sms" element={
          <ProtectedRoute requiredPermission="Settings">
            <SMSNotifications />
          </ProtectedRoute>
        } />

        {/* Staff Management */}
        <Route path="staff" element={
          <ProtectedRoute requiredPermission="User Management">
            <StaffDirectory />
          </ProtectedRoute>
        } />

        {/* CBT Management */}
        <Route path="cbt" element={
          <ProtectedRoute requiredPermission="Settings">
            <CBTExamManagement />
          </ProtectedRoute>
        } />

        {/* Academic Calendar */}
        <Route path="academic-calendar" element={
          <ProtectedRoute requiredPermission="Settings">
            <AcademicCalendar />
          </ProtectedRoute>
        } />

        {/* Student Performance Tracker */}
        <Route path="analytics/performance" element={
          <ProtectedRoute requiredPermission="Analytics Dashboard">
            <StudentPerformanceTracker />
          </ProtectedRoute>
        } />

        {/* Settings Routes */}
        <Route path="settings/storage" element={
          <ProtectedRoute requiredPermission="Settings">
            <CloudStorage />
          </ProtectedRoute>
        } />
        <Route path="settings/backup" element={
          <ProtectedRoute requiredPermission="Settings">
            <DataBackup />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="admin/logs" element={
          <ProtectedRoute requiredPermission="User Management">
            <AuditLogsPage />
          </ProtectedRoute>
        } />
        
        {/* Development/Testing Route */}
        <Route path="responsive-test" element={<ResponsiveTest />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// App component - Make sure we explicitly wrap in React.StrictMode
const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
