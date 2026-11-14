import { useState } from "react";
import { Link } from "react-router-dom";

export default function AuthForm({ register = false }) {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");
    const form = event.currentTarget;
    if (
      register &&
      form.elements.password.value !== form.elements.confirmPassword.value
    ) {
      setError("Your passwords do not match.");
      form.elements.confirmPassword.focus();
      return;
    }
    setError("");
    setFeedback(
      register
        ? "This is a frontend preview. Account registration is not connected yet; no account was created."
        : "This is a frontend preview. Authentication is not connected yet; you have not been signed in.",
    );
    form.reset();
  }

  return (
    <main className="dashboard auth-page" id="main-content" tabIndex={-1}>
      <Link to="/" className="back-link">
        ← Back to overview
      </Link>
      <section className="content-card auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">Your mission starts here</p>
        <h1 id="auth-title">{register ? "Create your account" : "Sign in"}</h1>
        <p className="muted-copy">
          {register
            ? "Set up your astronaut health profile."
            : "Access your astronaut health profile."}
        </p>
        <p className="demo-note">
          Frontend preview · Account services are not connected.
        </p>
        <form
          className="auth-form"
          onSubmit={handleSubmit}
          onChange={() => {
            setError("");
            setFeedback("");
          }}
        >
          {register && (
            <label htmlFor="full-name">
              Full name
              <input
                id="full-name"
                name="fullName"
                autoComplete="name"
                required
              />
            </label>
          )}
          <label htmlFor="email">
            Email address
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label htmlFor="password">
            Password
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={register ? 8 : undefined}
              aria-describedby={register ? "password-hint" : undefined}
              required
            />
          </label>
          {register && (
            <>
              <p id="password-hint" className="field-hint">
                Use at least 8 characters.
              </p>
              <label htmlFor="confirm-password">
                Confirm password
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "password-error" : undefined}
                  required
                />
              </label>
            </>
          )}
          {error && (
            <p className="form-error" id="password-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="primary-button">
            {register ? "Register" : "Sign in"}
          </button>
          {feedback && (
            <p className="form-feedback" role="status">
              {feedback}
            </p>
          )}
        </form>
        <p className="auth-switch">
          {register ? "Already have an account?" : "New to the mission?"}{" "}
          <Link to={register ? "/sign-in" : "/register"}>
            {register ? "Sign in" : "Register"}
          </Link>
        </p>
      </section>
    </main>
  );
}
