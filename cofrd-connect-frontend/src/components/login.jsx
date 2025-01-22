import React, { useState } from 'react'
import './login.css'
import {users} from '../mockData.js';

export const Login = ({ onLoginSuccess, onSignupClick }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const user = users.find(
            user => user.email === email && user.password === password
        );

        if (user) {
            onLoginSuccess(user);
        } else {
            setError('Email ou mot de passe incorrect');
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
