import App from "../App";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword"; // import
import Home from "../pages/Home";
import Login from "../pages/Login";
import SignUP from "../pages/SignUP";
import Adminpanel from "../pages/Adminpanel";
import AllUsers from "../pages/AllUsers";
import WalletPage from "../pages/WalletPage";
import ProtectedRoute from "./ProtectedRoute";
import { useSelector } from "react-redux";
import { createBrowserRouter, Navigate } from "react-router-dom";

// Redirect component for root path
const RootRedirect = () => {
  const user = useSelector((state) => state?.user?.user);
  return <Navigate to={user ? "/home" : "/login"} replace />;
};

// Guest route wrapper
const GuestRoute = ({ children }) => {
  const user = useSelector((state) => state?.user?.user);
  if (user) {
    // Redirect logged-in users to home
    return <Navigate to="/home" replace />;
  }
  return children;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <RootRedirect /> },
      { path: "login", element: <GuestRoute><Login /></GuestRoute> },
      { path: "forgot-password", element: <GuestRoute><ForgotPassword /></GuestRoute> },
      { path: "reset-password/:token", element: <GuestRoute><ResetPassword /></GuestRoute> }, 
      { path: "sign-up", element: <GuestRoute><SignUP /></GuestRoute> },
      { path: "home", element: <ProtectedRoute><Home /></ProtectedRoute> },
      { path: "wallets", element: <ProtectedRoute><WalletPage /></ProtectedRoute> },
      {
        path: "admin-panel",
        element: <ProtectedRoute><Adminpanel /></ProtectedRoute>,
        children: [
          {
            path: "all-users",
            element: <ProtectedRoute><AllUsers /></ProtectedRoute>,
          },
        ],
      },
    ],
  },
]);

export default router;
