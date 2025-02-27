import React from 'react';
import { useState } from 'react';
import './signup.css';

export const Signup = ({ onSignupSuccess, onBackToLogin }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (!password || !username || !email || !confirmPassword) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        if (!isValidEmail(email)) {
            setError('Veuillez entrer une adresse email valide');
            return;
        }

        try {
            console.log('Tentative d\'inscription...');
            console.log('Tentative d\'inscription avec les données:', { username, email });
            const response = await fetch('https://cofrd-connect-backend.vercel.app/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': window.location.origin
                },
                credentials: 'include',
                body: JSON.stringify({
                    username,
                    email,
                    password
                }),
            });

            console.log('Réponse complète:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            console.log('Status:', response.status);
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Réponse d\'erreur:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(errorText || 'Erreur lors de l\'inscription');
            }

            const newUser = await response.json();
            console.log('Inscription réussie:', newUser);
            onSignupSuccess(newUser);
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            setError(error.message || 'Une erreur est survenue lors de l\'inscription');
        }
    };
    
    const handleEmailChange = (e) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
  
        if (isValidEmail(newEmail) || newEmail === '') {
            setError('');
        }
    };

    const handleLoginClick = () => {
        if (typeof onBackToLogin === 'function') {
            onBackToLogin();
        }
    };

    return (
        <div className='main'>
            <div className='container'>
                
                <div className='form'>
                    <div className='header-signup'>
                        <h1>Inscription</h1>
                    </div>
                    {error && <div className="error">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        
                        <div className='input'>
                            <input type='text' placeholder='Nom utilisateur' value={username} onChange={(e) => setUsername(e.target.value)} />
                            <span className="bar"></span>
                        </div>                       

                        <div className='input'>
                            <input 
                                type='email'
                                placeholder='Email'
                                value={email}
                                onChange={handleEmailChange} 
                                className={email && !isValidEmail(email) ? 'invalid' : ''}  
                            />
                            <span className="bar"></span>
                        </div>

                        <div className='input'>
                            <input type={showPassword ? 'text' : 'password'} placeholder='Mot de passe' value={password} onChange={(e) => setPassword(e.target.value)} />
                            <span className="bar"></span>
                            <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </span>
                        </div>

                        <div className='input'>
                            <input type={showPassword ? 'text' : 'password'} placeholder='Confirmer mot de passe' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            <span className="bar"></span>
                        </div>

                        <div className='button'>
                            <button type='submit'>S'inscrire</button>
                        </div>
                    </form>
                    <div className='button login-button'>
                        <button type='button' onClick={handleLoginClick}>Se connecter</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;