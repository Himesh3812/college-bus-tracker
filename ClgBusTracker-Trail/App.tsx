
import React, { useState, useCallback } from 'react';
import type { UserDetails } from './types';
import { BUS_STOPS } from './constants';
import LoginPage from './components/LoginPage';
import MapPage from './components/MapPage';

const App: React.FC = () => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  const handleLogin = useCallback((details: UserDetails) => {
    setUserDetails(details);
  }, []);

  const handleLogout = useCallback(() => {
    setUserDetails(null);
  }, []);

  return (
    <div className="w-screen h-screen bg-gray-100">
      {userDetails ? (
        <MapPage 
          userDetails={userDetails} 
          busStops={BUS_STOPS} 
          onLogout={handleLogout} 
        />
      ) : (
        <LoginPage onLogin={handleLogin} busStops={BUS_STOPS} />
      )}
    </div>
  );
};

export default App;
