import React, { useState, useEffect } from 'react';
import './usersView.css';
import Dashboard from './dashboard';
import activiteLogo from '../img/appointment.png';
import Main from './main';
import deleteIcon from '../img/delete.png';
import userLogo from '../img/people.png';
import groupuser from '../img/group.png';
import userGrpLogo from '../img/group.png';
import cofrdLogo from '../img/cofrd-logo.webp'; 
import plusIcon from '../img/plus.png';
import logoutLogo from '../img/logout.png';
import petitPoints from '../img/more.png';
import dashboard from '../img/dashboard.png';
import messageIcon from '../img/message.png';
import { fetchActivites, createActivite, updateActivite as updateActiviteApi, deleteActivite as deleteActiviteApi, fetchUsers, deleteUser as deleteUserApi } from '../services/api';
import Messagerie from './messagerie';

const UsersView = ({ user, onLogout }) => {
    const [showMain, setShowMain] = useState(false);
    const [showUserInfo, setShowUserInfo] = useState(false);
    const [showUsers, setShowUsers] = useState(false);
    const [chartData, setChartData] = useState({ datasets: [] });
    const [activites, setActivites] = useState([]);
    const [showDashboard, setShowDashboard] = useState(false); 
    const [showAddForm, setShowAddForm] = useState(false);
    const [users, setUsers] = useState([]);
    const [showMessagerie, setShowMessagerie] = useState(false);

    useEffect(() => {
        const loadUsers = async () => {
            const data = await fetchUsers();
            if (data) {
                setUsers(data);
            }
        };
        loadUsers();
    }, []);

    const toggleUserInfo = () => {
        setShowUserInfo(!showUserInfo);
    }

    const toggleMain = () => {
        setShowMain(!showMain);
    };

    const toggleDashboard = () => {
        setShowDashboard(!showDashboard);
    }

    const toggleMessagerie = () => {
        setShowMessagerie(!showMessagerie);
    }

    const handleDeleteUser = async (id) => {
        const userToDelete = users.find(user => user.id === id);
        if (userToDelete.admin === 1 && userToDelete.id !== user.id) {
            alert('Vous ne pouvez pas supprimer un administrateur.');
            return;
        }
        if (userToDelete.id === user.id) {
            alert('Vous ne pouvez pas vous supprimer vous-même.');
            return;
        }

        const result = await deleteUserApi(id);
        if (result && result.success) {
            setUsers(users.filter(user => user.id !== id));
        } else {
            alert('Erreur lors de la suppression de l\'utilisateur');
        }
    };

    const handleLogout = () => {
        console.log("Tentative de déconnexion");
        localStorage.removeItem('currentUser');
        if (onLogout) {
            onLogout();
        }
        window.location.reload();
    };

    return (
        <div>
            {showMessagerie ? (
                <Messagerie user={user} onLogout={onLogout}/>
            ) : showMain ? (
                <Main user={user} onLogout={onLogout}/>
            ) : showDashboard ? (
                <Dashboard user={user} onLogout={onLogout}/>
            ) : !user || user.admin !== 1 ? (
                <Dashboard user={user} onLogout={onLogout} />
            ) : (
                <div className='main'>
                    <div className='container'>
                        <div className='header'>
                            <div className='navbarr'>
                                <div className='cofrd'>
                                    <div className='cofrd-logo'>
                                        <img src={cofrdLogo} alt="cofrd"/>
                                        <h2 className='cofrd-logo-text'>Connect</h2>
                                    </div> 
                                </div>

                                <div className='user'>
                                    <div className='user-logo' >
                                        <img src={userLogo} alt="User" />
                                    </div>
                                    <div className='user-text'>
                                        <div className='user-info'>
                                            <h2>{user.username}</h2>
                                        </div>
                                    </div>
                                    <div className='petitPoints' onClick={toggleUserInfo}>
                                        <img src={petitPoints} alt="Points" />
                                    </div>
                                    {showUserInfo && (
                                        <div className='user-container'>
                                            <div className='logout-users' onClick={handleLogout}>
                                                <img src={logoutLogo} alt='logout'/>
                                                <h2 className='logout-logo-text'>Se déconnecter</h2>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                    

                                <div className='activite-paging'> 
                                    <div className='activite-logo' onClick={toggleMain}>
                                        <img src={activiteLogo} alt="activite-paging" />
                                        <h2 className='activite-logo-text'>Événements</h2>
                                    </div>
                                </div>
                                <div className='dashboard-paging'> 
                                    <div className='dashboard-logo' onClick={toggleDashboard}>
                                        <img src={dashboard} alt="dashboard-paging" />
                                        <h2 className='dashboard-logo-text'>Tableau de bord</h2>
                                    </div>
                                </div>
                                <div className='users-paging'> 
                                    <div className='users-logo'>
                                        <img src={userGrpLogo} alt="users-paging" />
                                        <h2 className='users-logo-text active'>Utilisateurs</h2>
                                    </div>
                                </div>
                                <div className='messagerie-paging'> 
                                    <div className='messagerie-logo' onClick={toggleMessagerie}>
                                        <img src={messageIcon} alt="messagerie-paging" />
                                        <h2 className='messagerie-logo-text'>Messagerie</h2>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='contentt'>
                            <div className='users-container'>
                                <div className='users-header'>
                                    <div className='users-title'>
                                        <h2>Liste des Utilisateurs</h2>
                                    </div>
                                    <div className='groupuser-logo' >
                                        <img src={groupuser} alt='groupuser'/>
                                    </div>
                                </div>
                                    
                                <div className='users-table'>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Nom d'utilisateur</th>
                                                <th>Email</th>
                                                <th>Rôle</th>
                                                {user.admin === 1 && (
                                                    <th style={{ 
                                                        width: '40px', 
                                                        minWidth: '40px', 
                                                        maxWidth: '90px'
                                                    }}>Actions</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((userItem) => (
                                                <tr key={userItem.id}>
                                                    <td>{userItem.username}</td>
                                                    <td>{userItem.email}</td>
                                                    <td>{userItem.admin === 1 ? 'Administrateur' : 'Utilisateur'}</td>
                                                    {user.admin === 1 && (
                                                        <td style={{ 
                                                            width: '40px', 
                                                            minWidth: '40px', 
                                                            maxWidth: '40px',
                                                            padding: '0 10px'
                                                        }}>
                                                            {(userItem.admin !== 1 || userItem.id === user.id) && (
                                                                <img 
                                                                    src={deleteIcon} 
                                                                    alt="Delete" 
                                                                    onClick={() => handleDeleteUser(userItem.id)} 
                                                                    style={{ 
                                                                        cursor: 'pointer', 
                                                                        width: '20px', 
                                                                        height: '20px',
                                                                        display: 'block',
                                                                        margin: '0 auto'
                                                                    }} 
                                                                />
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {user.admin === 1 && ( 
                                        <div className="add-button-container">
                                            <img 
                                                src={plusIcon} 
                                                alt="Add" 
                                                onClick={() => setShowAddForm(true)} 
                                                style={{ cursor: 'pointer', width: '20px', height: '20px', marginRight: '10px', marginTop: '10px' }} 
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersView;
