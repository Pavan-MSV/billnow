import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SplashScreen } from '../components/splash/SplashScreen';

export function SplashPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleComplete = () => {
    // Transition smoothly based on auth state
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return <SplashScreen onComplete={handleComplete} durationMs={2500} />;
}

export default SplashPage;
