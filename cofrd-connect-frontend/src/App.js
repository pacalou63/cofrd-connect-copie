import React, { useState } from 'react';
import './App.css';
import Login from './components/login';
import Main from './components/main';
import Signup from './components/signup';

function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSignup, setShowSignup] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleSignupSuccess = (newUser) => {
    setShowSignup(false);
    setIsSignup(true);
    setCurrentUser(newUser);
  };

  return (
    <div>
      {isLoggedIn ? (
        <Main 
        user={currentUser}
        onLogout={handleLogout}
        />

      ) : showSignup ? (
        <Signup 
          onSignupSuccess={handleSignupSuccess} 
          onLoginClick={() => setShowSignup(false)} 
        />
      ) : (
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          onSignupClick={() => setShowSignup(true)} 
        />
      )}
    </div>

  );
}

export default App;
