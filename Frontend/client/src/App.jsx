import { useCallback, useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import OrbitalBackground from './components/OrbitalBackground.jsx';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import SignIn from './pages/SignIn.jsx';
import HealthData from './pages/HealthData.jsx';
import FutureProjection from './pages/FutureProjection.jsx';
import NotFound from './pages/NotFound.jsx';
import Profile from './pages/Profile.jsx';
import Alerts from "./pages/Alerts.jsx";
import { useAuth } from './context/AuthContext.jsx';
import useStartupIntro from './components/useStartupIntro.js';

const pageTitles = {
  '/': 'Overview',
  '/register': 'Register',
  '/sign-in': 'Sign in',
  '/profile': 'My profile',
  '/health-data': 'Health Data',
  '/future-projection': 'Future Projection',
};

export default function App() {
  const { pathname } = useLocation();
  const { loading: authLoading } = useAuth();
  const [modelReady, setModelReady] = useState(false);
  const finishModelLoading = useCallback(() => setModelReady(true), []);
  const startupPhase = useStartupIntro(!authLoading && (pathname !== '/' || modelReady));
  const entered = startupPhase === 'complete';

  useEffect(() => {
    document.title = `${pageTitles[pathname] ?? 'Page not found'} | Olympus Health`;
    window.scrollTo(0, 0);
    if (entered) document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [pathname, entered]);

  return (
    <div className="app-shell">
      <OrbitalBackground />
      <div className="site-content" inert={!entered} aria-hidden={!entered}>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <Header showMission={pathname === '/'} />
        <Routes>
          <Route path="/" element={<Home onStartupReady={finishModelLoading} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/health-data" element={<HealthData />} />
          <Route path="/future-projection" element={<FutureProjection ready={entered} />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <footer className="page-footer">
          <span>NASA Space Apps Challenge 2026</span>
          <span>Astronaut Health Monitoring</span>
          {pathname === '/' && <span className="model-attribution">
            Anatomy: BodyParts3D © The Database Center for Life Science;
            female anatomy: Human Reference Atlas / HuBMAP and MakeHuman; adapted by{' '}
            <a href="https://github.com/MervinR07/open-anatomy-3d" target="_blank" rel="noreferrer">Open Anatomy 3D</a>{' · '}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>{' · '}
            Appearance customized. <a href={`${import.meta.env.BASE_URL}models/anatomy/ATTRIBUTION.md`} target="_blank" rel="noreferrer">Full credits</a>
          </span>}
        </footer>
      </div>
    </div>
  );
}
