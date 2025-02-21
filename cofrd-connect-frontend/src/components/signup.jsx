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
            const response = await fetch('http://localhost:3001/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    password
                }),
            });

            console.log('Status:', response.status);
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);

            if (!response.ok) {
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    throw new Error(data.message || 'Erreur lors de l\'inscription');
                } else {
                    const text = await response.text();
                    console.error('Réponse non-JSON reçue:', text);
                    throw new Error('Le serveur a retourné une réponse invalide');
                }
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