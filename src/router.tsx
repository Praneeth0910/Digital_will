import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import RoleSelector from './components/RoleSelector';
import MainDashboard from './pages/MainDashboard';
import LoginUser from './pages/LoginUser';
import LoginNominee from './pages/LoginNominee';
import RegisterUser from './pages/RegisterUser';
import NomineeVerification from './pages/NomineeVerification';
import UserDashboard from './pages/UserDashboard';
import NomineeDashboard from './pages/NomineeDashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <MainDashboard />
      },
      {
        path: 'get-started',
        element: <RoleSelector />
      },
      {
        path: 'login-user',
        element: <LoginUser />
      },
      {
        path: 'login-nominee',
        element: <LoginNominee />
      },
      {
        path: 'register',
        element: <RegisterUser />
      },
      {
        path: 'nominee-verification',
        element: <NomineeVerification />
      },
      {
        path: 'user-dashboard',
        element: <UserDashboard />
      },
      {
        path: 'nominee-dashboard',
        element: <NomineeDashboard />
      }
    ]
  }
]);

