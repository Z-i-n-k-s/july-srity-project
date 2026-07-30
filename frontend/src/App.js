import "./App.css";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCallback, useEffect } from "react";
import SummaryApi from "./common";
import Context from "./context";
import { useDispatch } from "react-redux";
import { setUserDetails } from "./store/userSlice";

function App() {
  const dispatch = useDispatch();
  const location = useLocation();

  const fetchUserDetails = useCallback(async () => {
    try {
      const response = await fetch(SummaryApi.current_user.url, {
        method: SummaryApi.current_user.method,
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      const currentUser = payload?.data?.user || payload?.data || payload?.user || null;
      dispatch(setUserDetails(response.ok && payload?.success !== false && !payload?.error ? currentUser : null));
      return payload;
    } catch {
      dispatch(setUserDetails(null));
      return null;
    }
  }, [dispatch]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const isAdminPanel = location.pathname.startsWith("/admin-panel");
  const isAuthPage = ["/login", "/sign-up", "/forgot-password"].some((path) => location.pathname.startsWith(path)) || location.pathname.startsWith("/reset-password");
  const showPublicChrome = !isAdminPanel && !isAuthPage;

  return (
    <Context.Provider value={{ fetchUserDetails }}>
      <ToastContainer position="top-right" autoClose={3500} />
      <div className="document-grain min-h-screen bg-transparent text-archive-paper">
        {showPublicChrome && <Header />}
        <main className="min-h-screen">
          <Outlet />
        </main>
        {showPublicChrome && <Footer />}
      </div>
    </Context.Provider>
  );
}

export default App;
