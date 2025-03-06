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
    // Vérifier si l'utilisateur est déjà connecté au chargement
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setIsLoggedIn(true);
        setCurrentUser(user);
        setShowDashboard(true); // Rediriger vers le dashboard
      } catch (error) {
        console.error('Erreur lors de la restauration de l\'utilisateur:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const handleLoginSuccess = (user) => {
    // S'assurer que l'utilisateur a un ID valide
    if (!user || (!user.id && !user._id)) {
      console.error('Utilisateur invalide:', user);
      return;
    }

    const userToStore = {
      id: user.id || user._id, // Utiliser id ou _id
      username: user.username,
      email: user.email,
      admin: user.admin,
    };

    console.log('Utilisateur connecté:', userToStore);
    setIsLoggedIn(true);
    setCurrentUser(userToStore);
    setShowDashboard(true); // Rediriger vers le dashboard
    localStorage.setItem('currentUser', JSON.stringify(userToStore));
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
