import { useRef, useState } from "react";
import Icon from "./Icon.jsx";

export default function Header() {
  const dialogRef = useRef(null);
  const [accountAction, setAccountAction] = useState("Sign in");

  function openAccountNotice(event, action) {
    event.preventDefault();
    setAccountAction(action);
    dialogRef.current.showModal();
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#" aria-label="Mission Health home">
          <span className="brand-symbol">
            <Icon name="orbit" />
          </span>
          <span className="brand-name">
            My<span>Logo</span>
          </span>
        </a>
        <nav className="account-nav" aria-label="Account">
          <a
            className="register-link"
            href="#register"
            onClick={(event) => openAccountNotice(event, "Register")}
          >
            Register
          </a>
          <a
            className="sign-in-link"
            href="#sign-in"
            onClick={(event) => openAccountNotice(event, "Sign in")}
          >
            Sign in <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
      <dialog
        ref={dialogRef}
        className="account-dialog"
        aria-labelledby="account-dialog-title"
      >
        <p className="eyebrow">Account access</p>
        <h2 id="account-dialog-title">{accountAction}</h2>
        <p>
          Account access is coming soon. You can explore the dashboard layout
          while we prepare this feature.
        </p>
        <form method="dialog">
          <button className="dialog-close">Back to dashboard</button>
        </form>
      </dialog>
    </>
  );
}
