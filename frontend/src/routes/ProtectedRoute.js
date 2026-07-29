import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { getDefaultRouteForUser, getUserRole } from "../common/role";

const LoadingScreen = () => (
  <div className="grid min-h-screen place-items-center bg-ink-950">
    <div
      className="h-10 w-10 animate-spin rounded-full border-2 border-archive-amber border-t-transparent"
      role="status"
      aria-label="Checking session"
    />
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = useSelector((state) => state?.user?.user);
  const loading = useSelector((state) => state?.user?.loading);
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const currentRole = getUserRole(user);
    const canAccess = allowedRoles.some(
      (role) => String(role || "").trim().toUpperCase() === currentRole,
    );

    if (!canAccess) {
      return (
        <Navigate
          to={getDefaultRouteForUser(user)}
          replace
          state={{ accessDenied: true, requestedPath: location.pathname }}
        />
      );
    }
  }

  return children;
};

export default ProtectedRoute;
