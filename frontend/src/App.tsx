import { useEffect } from 'react';
import { AppRoutes } from './routes';
import { useAuthStore } from './store/authStore';

function App() {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return <AppRoutes />;
}

export default App;
