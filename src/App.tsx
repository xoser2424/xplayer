import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Onboarding } from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import LiveTV from "./pages/LiveTV";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import MovieDetail from "./pages/MovieDetail";
import SeriesDetail from "./pages/SeriesDetail";
import Favorites from "./pages/Favorites";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Player from "./pages/Player";
import { GlobalPlayerOverlay } from "./components/GlobalPlayerOverlay";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Player - fullscreen, outside layout */}
          <Route path="/player/:type/:id" element={
            <ProtectedRoute><Player /></ProtectedRoute>
          } />

          <Route path="/" element={
            <ProtectedRoute><Layout /></ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="live-tv" element={<LiveTV />} />
            <Route path="movies" element={<Movies />} />
            <Route path="movie/:id" element={<MovieDetail />} />
            <Route path="series" element={<Series />} />
            <Route path="series/:id" element={<SeriesDetail />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <GlobalPlayerOverlay />
      </>
    </HashRouter>
  );
};

export default App;
