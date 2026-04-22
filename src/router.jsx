import { Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import ClientDashboardPage from "./ClientDashboardPage.jsx";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/client/:slug" element={<ClientDashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}