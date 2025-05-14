import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { AuthService } from '../../services/api';

interface AuthCheckerProps {
  children: React.ReactNode;
}

const AuthChecker: React.FC<AuthCheckerProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const { isAuthenticated, token, login, logout } = useAuthStore();

  useEffect(() => {
    // Only check token validity if we have a token stored
    const validateToken = async () => {
      if (token) {
        try {
          // Get current user data from backend
          const data = await AuthService.getCurrentUser();
          
          // Update user information
          if (data.user) {
            login(token, data.user);
          } else {
            // If no user returned, token might be invalid
            logout();
          }
        } catch (error) {
          // Token is invalid or expired, logout
          console.error('Token validation failed:', error);
          logout();
        }
      }
      
      // Finished checking
      setIsChecking(false);
    };

    validateToken();
  }, [token, login, logout]);

  // Don't render anything while checking authentication
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthChecker; 