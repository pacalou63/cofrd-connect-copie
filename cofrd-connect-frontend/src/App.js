import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/login';
import Main from './components/main';
import Signup from './components/signup';
import Dashboard from './components/dashboard';
import UsersView from './components/usersView';
import Messagerie from './components/messagerie';

function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSignup, setShowSignup] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showMain, setShowMain] = useState(false);
  const [showUsersView, setShowUsersView] = useState(false);
  const [showMessagerie, setShowMessagerie] = useState(false);
  
  useEffect(() => {
    // Nettoyer le localStorage quand la page est fermée
    const handleBeforeUnload = () => {
      localStorage.removeItem('currentUser');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    console.log("Déconnexion en cours...");
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setShowDashboard(false);
    setShowMain(false);
    setShowUsersView(false);
    console.log("Utilisateur déconnecté.");
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

  const handleMessagerie = () => {
    setShowMessagerie(true);
    setShowMain(false);
    setShowDashboard(false);
    setShowUsersView(false);
  };

  return (

      <div>
        {showSignup ? (
          <Signup
            onSignupSuccess={handleSignupSuccess}
            onBackToLogin={() => setShowSignup(false)}
          />
        ) : isLoggedIn ? (
          showMessagerie ? (
            <Messagerie
              user={currentUser}
              onLogout={handleLogout}
            />
          ) : showDashboard ? (
            <Dashboard
              user={currentUser}
              onLogout={handleLogout}
            />
          ) : showMain ? (
            <Main           
              user={currentUser}
              onLogout={handleLogout}
            />
          ) : showUsersView ? (
            <UsersView           
              user={currentUser}
              onLogout={handleLogout}
            />
          ) : (
            <Dashboard 
              user={currentUser}
            />
          )
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
