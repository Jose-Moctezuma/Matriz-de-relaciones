import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProjectMatrix from "./pages/ProjectMatrix.jsx";
import Home from "./pages/Home.jsx";

import { getToken, clearToken } from "./api/http.js";

function RequireAuth({ children }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const navigate = useNavigate();

  const onLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard onLogout={onLogout} />
          </RequireAuth>
        }
      />

      <Route
        path="/project/:id"
        element={
          <RequireAuth>
            <ProjectMatrix onLogout={onLogout} />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
