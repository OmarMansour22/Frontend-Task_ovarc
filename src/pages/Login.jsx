// src/pages/Login.jsx
import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const USERS_KEY = "ovarc_registered_users";

const getRegisteredUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const initialValues = {
    email: "",
    password: "",
  };

  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email address").required("Required"),
    password: Yup.string()
      .min(4, "Password must be at least 4 characters")
      .required("Required"),
  });

  const handleSubmit = (values, { setSubmitting, setStatus }) => {
    setStatus(null);

    const users = getRegisteredUsers();
    const match = users.find(
      (u) => u.email === values.email && u.password === values.password
    );

    if (!match) {
      setSubmitting(false);
      setStatus("Invalid email or password");
      return;
    }

    // ✅ Valid account → log in via context
    login({ email: match.email });
    setSubmitting(false);
    navigate("/"); // redirect after login
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold text-center mb-6">Sign in</h1>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, status }) => (
            <Form className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-main"
                  placeholder="you@example.com"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="mt-1 text-xs text-red-500"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <Field
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-main"
                  placeholder="••••••••"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="mt-1 text-xs text-red-500"
                />
              </div>

              {/* Global error (invalid credentials) */}
              {status && (
                <div className="text-xs text-red-500 text-center">{status}</div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-main text-white py-2 rounded text-sm font-medium hover:bg-main/90 transition disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </Form>
          )}
        </Formik>

        {/* Create account section */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-600">Don&apos;t have an account?</span>
          <Link
            to="/register"
            className="text-main hover:text-main/80 font-medium"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
