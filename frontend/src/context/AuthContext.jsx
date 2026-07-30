import { createContext, useCallback, useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUserDetails } from "../store/userSlice";
import SummaryApi from "../common";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.user?.user);
  const loading = useSelector((state) => state?.user?.loading);

  const logout = useCallback(async () => {
    try {
      await fetch(SummaryApi.logout_user.url, {
        method: SummaryApi.logout_user.method,
        credentials: "include",
      });
    } finally {
      dispatch(setUserDetails(null));
    }
  }, [dispatch]);

  const updateLocalUser = useCallback((nextUser) => dispatch(setUserDetails(nextUser)), [dispatch]);

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user?._id || user?.id),
    logout,
    updateLocalUser,
  }), [user, loading, logout, updateLocalUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
