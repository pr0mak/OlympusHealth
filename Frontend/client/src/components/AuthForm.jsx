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
    const values = Object.fromEntries(new FormData(form).entries());

    if (register && values.password !== values.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      if (register) {
        await authApi.register({
          firstname: values.firstname,
          lastname: values.lastname,
          phone: values.phone,
          email: values.email,
          password: values.password,
        });
        navigate("/sign-in", { replace: true, state: { notice: "Account created. Please sign in." } });
      } else {
        await signIn(values.email, values.password);
        navigate("/profile", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="dashboard auth-page" id="main-content" tabIndex={-1}>
      <Link to="/" className="back-link">← Back to overview</Link>
      <section className="content-card auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">Your mission starts here</p>
        <h1 id="auth-title">{register ? "Create your account" : "Sign in"}</h1>
        <p className="muted-copy">{register ? "Set up your astronaut health profile." : "Access your astronaut health profile."}</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {register && (
            <>
              <label htmlFor="firstname">First name<input id="firstname" name="firstname" autoComplete="given-name" maxLength={100} required /></label>
              <label htmlFor="lastname">Last name<input id="lastname" name="lastname" autoComplete="family-name" maxLength={100} required /></label>
              <label htmlFor="phone">Phone<input id="phone" name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={30} required /></label>
            </>
          )}
          <label htmlFor="email">Email address<input id="email" name="email" type="email" autoComplete="email" maxLength={254} required /></label>
          <label htmlFor="password">Password<input id="password" name="password" type="password" autoComplete={register ? "new-password" : "current-password"} minLength={register ? 8 : undefined} required /></label>
          {register && (
            <>
              <p className="field-hint">Use at least 8 characters.</p>
              <label htmlFor="confirm-password">Confirm password<input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
            </>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Please wait..." : register ? "Register" : "Sign in"}
          </button>
        </form>
        <p className="auth-switch">{register ? "Already have an account?" : "New to the mission?"}{" "}<Link to={register ? "/sign-in" : "/register"}>{register ? "Sign in" : "Register"}</Link></p>
      </section>
    </main>
  );
}
