import React, { useState } from 'react'
import './login.css'

export const Login = ({ onLoginSuccess, onSignupClick }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            // Construire l'URL de l'API
            let API_URL = process.env.REACT_APP_API_URL 
                ? `${process.env.REACT_APP_API_URL}/api/login` 
                : 'http://localhost:3001/api/login';
            
            console.log('Login API URL:', API_URL);
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password }),
                mode: 'cors', // Mode CORS explicite
                credentials: 'include' // Toujours inclure les credentials
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Réponse de login:', data);

            // Vérifier si data.user existe, sinon utiliser data directement
            const userData = data.user || data;
            onLoginSuccess(userData);
        } catch (error) {
            console.error('Erreur de connexion:', error);
            setError(error.message || 'Email ou mot de passe incorrect');
        }
    };

    const handleSignupClick = () => { 
        if (typeof onSignupClick === 'function') {
            onSignupClick();
        }
    };

  return (
    <div className='main'>
        <div className='container'>          
            <div className='content'>
                <div className='form'>
                    <div className='header-login'>
                        <h1>Authentication</h1>
                    </div>  
                    <form onSubmit={handleSubmit}>
                        {error && <div className="error">{error}</div>}
                        <div className='input'>
                            <input type='text' placeholder='Entrez mail' value={email} onChange={(e) => setEmail(e.target.value)}></input>
                            <span className="bar"></span>
                        </div>
                        <div className='input'>
                            <input type={showPassword ? 'text' : 'password'}  placeholder='Entrez mot de passe' value={password} onChange={(e) => setPassword(e.target.value)}></input>
                            <span className="bar"></span>
                            <span className="password-toggle" onClick={() => setShowPassword(!showPassword)} >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </span>   
                        </div>                                                                                                                          
                        <div className='button'>
                            <button type='submit'>Se connecter</button>
                        </div>
                        <div className='button signup-button'>
                            <button type='button' onClick={handleSignupClick}>S'inscrire</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>        
    </div>
  )
}

export default Login;
