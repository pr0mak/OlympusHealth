import { useLocation } from "react-router-dom";
import AuthForm from "../components/AuthForm.jsx";
export default function SignIn() {
  const { state } = useLocation();
  return <>{state?.notice && <p className="auth-notice" role="status">{state.notice}</p>}<AuthForm /></>;
}
