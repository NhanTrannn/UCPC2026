import { useRoutes } from 'react-router-dom';
import { appRoutes } from './routes';

function AppRouter() {
  return useRoutes(appRoutes);
}

export default AppRouter;
