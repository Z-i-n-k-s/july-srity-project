import { useSelector } from "react-redux";
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import ROLE, { getDefaultRouteForUser } from "../common/role";
import UserShell from "../components/layout/UserShell";
import AboutPage from "../pages/AboutPage";
import Adminpanel from "../pages/Adminpanel";
import AllUsers from "../pages/AllUsers";
import ForgotPassword from "../pages/ForgotPassword";
import Home from "../pages/Home";
import Login from "../pages/Login";
import NotFoundPage from "../pages/NotFoundPage";
import ResetPassword from "../pages/ResetPassword";
import SignUP from "../pages/SignUP";
import SubmitEvidencePage from "../pages/SubmitEvidencePage";
import TimelinePage from "../pages/TimelinePage";
import WalletPage from "../pages/WalletPage";
import AdminArchiveManager from "../pages/admin/AdminArchiveManager";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminMissingReports from "../pages/admin/AdminMissingReports";
import AdminSettings from "../pages/admin/AdminSettings";
import AdminSubmissions from "../pages/admin/AdminSubmissions";
import AdminSupportCaseDetail from "../pages/admin/AdminSupportCaseDetail";
import AdminSupportCases from "../pages/admin/AdminSupportCases";
import ArchiveDetailsPage from "../pages/archive/ArchiveDetailsPage";
import ArchivePage from "../pages/archive/ArchivePage";
import MissingPersonDetailsPage from "../pages/missing/MissingPersonDetailsPage";
import MissingPersonsPage from "../pages/missing/MissingPersonsPage";
import ReportMissingPersonPage from "../pages/missing/ReportMissingPersonPage";
import StoriesPage from "../pages/stories/StoriesPage";
import StoryDetailsPage from "../pages/stories/StoryDetailsPage";
import NewSupportRequestPage from "../pages/support/NewSupportRequestPage";
import SupportPage from "../pages/support/SupportPage";
import SupportRoomPage from "../pages/support/SupportRoomPage";
import SupportRoomsPage from "../pages/support/SupportRoomsPage";
import DraftsPage from "../pages/user/DraftsPage";
import MyReportsPage from "../pages/user/MyReportsPage";
import MySubmissionsPage from "../pages/user/MySubmissionsPage";
import ProfilePage from "../pages/user/ProfilePage";
import UserDashboardPage from "../pages/user/UserDashboardPage";
import ProtectedRoute from "./ProtectedRoute";

const LoadingScreen = () => (
  <div className="grid min-h-screen place-items-center bg-ink-950">
    <div
      className="h-10 w-10 animate-spin rounded-full border-2 border-archive-amber border-t-transparent"
      role="status"
      aria-label="Checking session"
    />
  </div>
);

// Root access follows the existing project flow: guests go to login,
// users go to the user site, and administrators go to the admin panel.
// const RootRedirect = () => {
//   const user = useSelector((state) => state?.user?.user);
//   const loading = useSelector((state) => state?.user?.loading);

//   if (loading) return <LoadingScreen />;
//   return <Navigate to={user ? getDefaultRouteForUser(user) : "/login"} replace />;
// };

// Logged-in visitors cannot reopen authentication pages.
const GuestRoute = ({ children }) => {
  const user = useSelector((state) => state?.user?.user);
  const loading = useSelector((state) => state?.user?.loading);

  if (loading) return <LoadingScreen />;
  return user ? (
    <Navigate to={getDefaultRouteForUser(user)} replace />
  ) : (
    children
  );
};

const protect = (element, allowedRoles = [ROLE.USER, ROLE.ADMIN]) => (
  <ProtectedRoute allowedRoles={allowedRoles}>{element}</ProtectedRoute>
);

const userOnly = (element) => protect(element, [ROLE.USER]);
const adminOnly = (element) => protect(element, [ROLE.ADMIN]);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      {
        path: "login",
        element: (
          <GuestRoute>
            <Login />
          </GuestRoute>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        ),
      },
      {
        path: "reset-password/:token",
        element: (
          <GuestRoute>
            <ResetPassword />
          </GuestRoute>
        ),
      },
      {
        path: "sign-up",
        element: (
          <GuestRoute>
            <SignUP />
          </GuestRoute>
        ),
      },

      // Shared authenticated pages.
      {
        path: "home",
        element: <Navigate to="/" replace />,
      },
      { path: "archive", element: protect(<ArchivePage />) },
      { path: "archive/:id", element: protect(<ArchiveDetailsPage />) },
      { path: "timeline", element: protect(<TimelinePage />) },
      { path: "stories", element: protect(<StoriesPage />) },
      { path: "stories/:id", element: protect(<StoryDetailsPage />) },
      { path: "support", element: protect(<SupportPage />) },
      { path: "missing-persons", element: protect(<MissingPersonsPage />) },
      {
        path: "missing-persons/:id",
        element: protect(<MissingPersonDetailsPage />),
      },
      { path: "about", element: protect(<AboutPage />) },

      // User-only contribution, support and account pages.
      { path: "submit", element: userOnly(<SubmitEvidencePage />) },
      { path: "support/new", element: userOnly(<NewSupportRequestPage />) },
      {
        path: "missing-persons/report",
        element: userOnly(<ReportMissingPersonPage />),
      },
      { path: "wallets", element: userOnly(<WalletPage />) },
      {
        path: "account",
        element: userOnly(<UserShell />),
        children: [
          { index: true, element: <UserDashboardPage /> },
          { path: "submissions", element: <MySubmissionsPage /> },
          { path: "support-rooms", element: <SupportRoomsPage /> },
          { path: "support-rooms/:roomId", element: <SupportRoomPage /> },
          { path: "reports", element: <MyReportsPage /> },
          { path: "drafts", element: <DraftsPage /> },
          { path: "profile", element: <ProfilePage /> },
        ],
      },

      // Administrator-only workspace. The protected parent guards every child route.
      {
        path: "admin-panel",
        element: adminOnly(<Adminpanel />),
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "submissions", element: <AdminSubmissions /> },
          { path: "support-cases", element: <AdminSupportCases /> },
          {
            path: "support-cases/:caseId",
            element: <AdminSupportCaseDetail />,
          },
          { path: "missing-reports", element: <AdminMissingReports /> },
          { path: "archive-manager", element: <AdminArchiveManager /> },
          { path: "all-users", element: <AllUsers /> },
          { path: "settings", element: <AdminSettings /> },
        ],
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default router;
