import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import SignIn from './pages/SignIn.jsx';
import HealthData from './pages/HealthData.jsx';
import MissionAssistant from './pages/MissionAssistant.jsx';
import FutureProjection from './pages/FutureProjection.jsx';
import NotFound from './pages/NotFound.jsx';

const pageTitles = {
  '/': 'Overview',
  '/register': 'Register',
  '/sign-in': 'Sign in',
  '/health-data': 'Health Data',
  '/mission-assistant': 'Mission Assistant',
  '/future-projection': 'Future Projection',
};

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = `${pageTitles[pathname] ?? 'Page not found'} | Space Apps Challenge`;
    window.scrollTo(0, 0);
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/health-data" element={<HealthData />} />
        <Route path="/mission-assistant" element={<MissionAssistant />} />
        <Route path="/future-projection" element={<FutureProjection />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer className="page-footer">
        <span>NASA Space Apps Challenge 2026</span>
        <span>Astronaut Health Monitoring</span>
      </footer>
    </div>
  );
}
