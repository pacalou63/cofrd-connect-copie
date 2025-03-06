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
import { fetchActivites, createActivite, updateActivite as updateActiviteApi, deleteActivite as deleteActiviteApi, fetchUsers, deleteUser as deleteUserApi, createUser } from '../services/api';
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
    
    // États pour le modal de création d'utilisateur
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        admin: 0
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

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
        try {
            console.log('UsersView - Tentative de suppression de l\'utilisateur avec ID:', id);
            
            // Trouver l'utilisateur à supprimer
            const userToDelete = users.find(user => user._id === id || user.id === id);
            console.log('UsersView - Utilisateur à supprimer:', userToDelete);
            
            if (!userToDelete) {
                alert('Utilisateur non trouvé.');
                return;
            }
            
            // Vérifier si l'utilisateur est un administrateur
            if (userToDelete.admin === 1 && (userToDelete._id !== user._id && userToDelete.id !== user.id)) {
                alert('Vous ne pouvez pas supprimer un administrateur.');
                return;
            }
            
            // Vérifier si l'utilisateur essaie de se supprimer lui-même
            if ((userToDelete._id === user._id) || (userToDelete.id === user.id)) {
                alert('Vous ne pouvez pas vous supprimer vous-même.');
                return;
            }
            
            // Demander confirmation avant de supprimer
            if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userToDelete.username} ?`)) {
                return;
            }
            
            // Utiliser _id s'il existe, sinon utiliser id
            const idToDelete = userToDelete._id || userToDelete.id;
            console.log('UsersView - ID à utiliser pour la suppression:', idToDelete);
            
            const result = await deleteUserApi(idToDelete);
            console.log('UsersView - Résultat de la suppression:', result);
            
            if (result && result.success) {
                // Filtrer les utilisateurs en utilisant l'ID approprié
                const updatedUsers = users.filter(u => {
                    if (userToDelete._id) {
                        return u._id !== userToDelete._id;
                    }
                    return u.id !== userToDelete.id;
                });
                
                console.log('UsersView - Utilisateurs après suppression:', updatedUsers);
                setUsers(updatedUsers);
                alert('Utilisateur supprimé avec succès.');
            } else {
                throw new Error(result?.error || 'Erreur lors de la suppression de l\'utilisateur');
            }
        } catch (error) {
            console.error('UsersView - Erreur lors de la suppression de l\'utilisateur:', error);
            alert(`Erreur lors de la suppression de l\'utilisateur: ${error.message}`);
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

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewUser({
            ...newUser,
            [name]: value
        });

        // Réinitialiser l'erreur si l'email est valide ou vide
        if (name === 'email' && (isValidEmail(value) || value === '')) {
            setError('');
        }
    };

    const handleAdminChange = (e) => {
        setNewUser({
            ...newUser,
            admin: e.target.checked ? 1 : 0
        });
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        
        // Validation des champs
        if (newUser.password !== newUser.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (!newUser.password || !newUser.username || !newUser.email) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (!isValidEmail(newUser.email)) {
            setError('Veuillez entrer une adresse email valide');
            return;
        }

        try {
            // Préparer les données à envoyer (sans confirmPassword)
            const userData = {
                username: newUser.username,
                email: newUser.email,
                password: newUser.password,
                admin: newUser.admin
            };

            const result = await createUser(userData);
            
            if (result && !result.error) {
                // Vérifier si le résultat contient un utilisateur
                const newUserData = result.user || result;
                
                // Ajouter le nouvel utilisateur à la liste avec un ID approprié
                const userToAdd = {
                    ...userData,
                    _id: newUserData._id || newUserData.id || Date.now().toString(),
                    id: newUserData.id || newUserData._id || Date.now().toString(),
                    username: newUserData.username || userData.username,
                    email: newUserData.email || userData.email,
                    admin: newUserData.admin !== undefined ? newUserData.admin : userData.admin
                };
                
                setUsers([...users, userToAdd]);
                
                // Réinitialiser le formulaire et fermer le modal
                setNewUser({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    admin: 0
                });
                setShowCreateUserModal(false);
                setError('');
                
                alert('Utilisateur créé avec succès');
            } else {
                throw new Error(result.error || 'Erreur lors de la création de l\'utilisateur');
            }
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur:', error);
            setError(error.message || 'Une erreur est survenue lors de la création de l\'utilisateur');
        }
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
                                            </div>
                                        </div>
                                    )}
                                </div>
                                    

                                
                                <div className='dashboard-paging'> 
                                    <div className='dashboard-logo' onClick={toggleDashboard}>
                                        <img src={dashboard} alt="dashboard-paging" />
                                        <h2 className='dashboard-logo-text'>Tableau de bord</h2>
                                    </div>
                                </div>
                                <div className='activite-paging'> 
                                    <div className='activite-logo' onClick={toggleMain}>
                                        <img src={activiteLogo} alt="activite-paging" />
                                        <h2 className='activite-logo-text'>Événements</h2>
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
                                            <tr key="header-row">
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
                                                <tr key={userItem._id || userItem.id}>
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
                                                            {(userItem.admin !== 1 || ((userItem._id === user._id) || (userItem.id === user.id))) && (
                                                                <img 
                                                                    src={deleteIcon} 
                                                                    alt="Delete" 
                                                                    onClick={() => handleDeleteUser(userItem._id || userItem.id)} 
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
                                                onClick={() => setShowCreateUserModal(true)} 
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
            {showCreateUserModal && (
                <div className="modal-overlay">
                    <div className="create-user-modal">
                        <div className="modal-header">
                            <h2>Créer un nouvel utilisateur</h2>
                            <button onClick={() => setShowCreateUserModal(false)} className="close-modal">×</button>
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <form onSubmit={handleCreateUser}>
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    name="username" 
                                    value={newUser.username} 
                                    onChange={handleInputChange} 
                                    placeholder="Nom d'utilisateur"
                                />
                                <span className="bar"></span>
                            </div>
                            <div className="form-group">
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={newUser.email} 
                                    onChange={handleInputChange} 
                                    placeholder="Email"
                                    className={newUser.email && !isValidEmail(newUser.email) ? 'invalid' : ''}
                                />
                                <span className="bar"></span>
                            </div>
                            <div className="form-group password-group">
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    name="password" 
                                    value={newUser.password} 
                                    onChange={handleInputChange} 
                                    placeholder="Mot de passe"
                                />
                                <span className="bar"></span>
                                <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </span>
                            </div>
                            <div className="form-group">
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    name="confirmPassword" 
                                    value={newUser.confirmPassword} 
                                    onChange={handleInputChange} 
                                    placeholder="Confirmer mot de passe"
                                />
                                <span className="bar"></span>
                            </div>
                            <div className="form-group admin-checkbox">
                                <label>
                                    <input 
                                        type="checkbox" 
                                        name="admin" 
                                        checked={newUser.admin === 1} 
                                        onChange={handleAdminChange} 
                                    />
                                    Administrateur
                                </label>
                            </div>
                            <div className="form-buttons">
                                <button type="submit" className="create-button">Créer</button>
                                <button type="button" className="cancel-button" onClick={() => setShowCreateUserModal(false)}>Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersView;
