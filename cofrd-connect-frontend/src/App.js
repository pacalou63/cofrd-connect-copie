import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/login';
import Main from './components/main';
import Signup from './components/signup';
import Dashboard from './components/dashboard';
import UsersView from './components/usersView';


function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSignup, setShowSignup] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showMain, setShowMain] = useState(false);
  const [showUsersView, setShowUsersView] = useState(false);
  
  useEffect(() => {
      const storedUser = JSON.parse(localStorage.getItem('currentUser'));
      if (storedUser) {
          setCurrentUser(storedUser);
          setIsLoggedIn(true);
      }
  }, []);

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const handleSignupSuccess = (newUser) => {
    setShowSignup(false);
    setIsSignup(true);
    setCurrentUser(newUser);
  };
  
  const handleDashboard = () => {
    setShowDashboard(true);
  };

  const handleMain = () => {
    setShowMain(true);
    setShowDashboard(false);
  };

  const handleUsersView = () => {
    setShowUsersView(true);
  };

  return (

      <div>
        {isLoggedIn ? (
          <Main 
            user={currentUser}
            onLogout={handleLogout}
            onClickDashboard={handleDashboard}
            onClickUsersView={handleUsersView}
          />
        ) : showSignup ? (
          <Signup 
            onSignupSuccess={handleSignupSuccess} 
            onLoginClick={() => setShowSignup(false)} 
          />
        ) : showDashboard ? (
          <Dashboard
            user={currentUser}
            onClickMain={handleMain}
            onClickUsersView={handleUsersView}
            
          />
        ) : showMain ? (
          <Main           
            user={currentUser}
          />
        ) : showUsersView ?(
          <UsersView           
            user={currentUser}
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
