// src/pages/Register.jsx
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

const saveRegisteredUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const RegisterSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-center mb-6">Sign Up</h1>

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={RegisterSchema}
          onSubmit={(values, { setSubmitting, setStatus, setErrors }) => {
            setStatus(null);

            const users = getRegisteredUsers();
            const alreadyExists = users.some(
              (u) => u.email.toLowerCase() === values.email.toLowerCase()
            );

            if (alreadyExists) {
              setSubmitting(false);
              setErrors({ email: "An account with this email already exists" });
              return;
            }

            const newUser = {
              email: values.email,
              password: values.password,
            };

            const updatedUsers = [...users, newUser];
            saveRegisteredUsers(updatedUsers);

            // Optional: auto-login after registration
            login({ email: newUser.email });

            setSubmitting(false);
            navigate("/");
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div className="flex flex-col">
                <label htmlFor="email" className="text-sm text-gray-700 mb-1">
                  Email
                </label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-xs text-red-600 mt-1"
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="password"
                  className="text-sm text-gray-700 mb-1"
                >
                  Password
                </label>
                <Field
                  id="password"
                  name="password"
                  type="password"
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="********"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-xs text-red-600 mt-1"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-main text-white py-2 rounded-md text-sm font-medium hover:bg-main/90 transition disabled:opacity-60"
              >
                {isSubmitting ? "Creating account..." : "Sign Up"}
              </button>

              <p className="text-xs text-gray-600 text-center mt-2">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-main font-medium hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Register;
