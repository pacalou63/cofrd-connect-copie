import React from 'react';
import { useState } from 'react';
import './signup.css';
import {users} from '../mockData';

export const Signup = ({ onSignupSuccess, onLoginClick }) => {
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

    const handleSubmit = (e) => {
        e.preventDefault();
        
        
        const userExists = users.find(user => user.username === username && user.password === password && user.email === email && user.confirmPassword === confirmPassword);
        
        if (userExists) {
            setError('Nom d\'utilisateur déjà utilisé');
            return;
        }

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




        const newUser = {
            id: users.length + 1,
            username,
            password,
            email
        };


        users.push(newUser);
        onSignupSuccess(newUser);
    };
    
    const handleEmailChange = (e) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
  
        if (isValidEmail(newEmail) || newEmail === '') {
            setError('');
        }
    };

    const handleLoginClick = () => {
        if (typeof onLoginClick === 'function') {
            onLoginClick();
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
                                required
                                className={email && !isValidEmail(email) ? 'invalid' : ''}  
                            />
                            <span className="bar"></span>
                        </div>

                        <div className='input'>
                            <input type={showPassword ? 'text' : 'password'} placeholder='Mot de passe' value={password} onChange={(e) => setPassword(e.target.value)} />
                            <span className="bar"></span>
                            <span className="password-toggle" onClick={() => setShowPassword(!showPassword)} style={{ marginLeft: '30px'}}>
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </span>
                        </div>

                        <div className='input'> 
                            <input type={showPassword ? 'text' : 'password'} placeholder='Confirmer mot de passe' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            <span className="bar"></span>
                            <span className="password2-toggle" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </span>
                        </div>

                        <div className='button'>
                            <button type='submit'>S'inscrire</button>
                        </div>

                        <div className='button'>
                            <button type='submit' onClick={onLoginClick}>Se connecter</button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;