
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { authApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthForm({ register = false }) {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const form = event.currentTarget;
    const values = Object.fromEntries(
      new FormData(form).entries()
    );

    // Register password confirmation
    if (
      register &&
      values.password !== values.confirmPassword
    ) {
      setError("Your passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      if (register) {
        // POST /api/auth/register
        await authApi.register({
          username: values.username.trim(),
          password: values.password,
          gender: values.gender,
          age: Number(values.age)
        });

        navigate("/sign-in", {
          replace: true,
          state: {
            notice: "Account created successfully. Please sign in."
          }
        });

      } else {
        // POST /api/auth/login
        // and GET /api/auth/me
        await signIn(
          values.username.trim(),
          values.password
        );

      navigate("/", {
        replace: true
      });
      }

    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );

    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="dashboard auth-page"
      id="main-content"
      tabIndex={-1}
    >
      <Link to="/" className="back-link">
        ← Back to overview
      </Link>

      <section
        className="content-card auth-card"
        aria-labelledby="auth-title"
      >
        <p className="eyebrow">
          Your mission starts here
        </p>

        <h1 id="auth-title">
          {register ? "Create your account" : "Sign in"}
        </h1>

        <p className="muted-copy">
          {register
            ? "Set up your astronaut profile."
            : "Access your astronaut profile."}
        </p>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          {/* Username */}
          <label htmlFor="username">
            Username

            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              minLength={3}
              maxLength={50}
              pattern="[a-zA-Z0-9_]{3,50}"
              title="Use 3–50 letters, numbers or underscores."
              required
            />
          </label>

          {/* Password */}
          <label htmlFor="password">
            Password

            <input
              id="password"
              name="password"
              type="password"
              autoComplete={
                register
                  ? "new-password"
                  : "current-password"
              }
              minLength={register ? 8 : undefined}
              required
            />
          </label>

          {register && (
            <>
              <p className="field-hint">
                Use at least 8 characters.
              </p>

              {/* Confirm Password */}
              <label htmlFor="confirm-password">
                Confirm password

                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              {/* Gender */}
              <label htmlFor="gender">
                Gender

                <select
                  id="gender"
                  name="gender"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Select gender
                  </option>
                  <option value="male">
                    Male
                  </option>
                  <option value="female">
                    Female
                  </option>
                </select>
              </label>

              {/* Age */}
              <label htmlFor="age">
                Age

                <input
                  id="age"
                  name="age"
                  type="number"
                  min={18}
                  max={120}
                  step={1}
                  required
                />
              </label>
            </>
          )}

          {error && (
            <p
              className="form-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
          >
            {submitting
              ? "Please wait..."
              : register
                ? "Register"
                : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          {register
            ? "Already have an account?"
            : "New to the mission?"}
          {" "}

          <Link to={register ? "/sign-in" : "/register"}>
            {register ? "Sign in" : "Register"}
          </Link>
        </p>

      </section>
    </main>
  );
}
