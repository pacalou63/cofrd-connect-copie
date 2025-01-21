import React from 'react';
import './logout.css';

 const Logout = ({ onLogout }) => {

    const handleLogout = (e) => {
        e.preventDefault();
        onLogout();
    };

    return (
        <div className='main'>
            <div className='container'>
                <button onClick={handleLogout}>Se deconnecter</button>
            </div>
        </div>
    );
};

export default Logout;