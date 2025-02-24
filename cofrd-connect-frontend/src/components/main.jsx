import React, { useState, useEffect } from 'react';
import './main.css';

import deleteIcon from '../img/delete.png';
import activiteLogo from '../img/appointment.png';
import plusIcon from '../img/plus.png';
import editIcon from '../img/edit.png';
import groupuser from '../img/group.png';
import userLogo from '../img/people.png';
import dashboardLogo from '../img/dashboard.png';
import cofrdLogo from '../img/cofrd-logo.webp'; 
import petitPoints from '../img/more.png';
import userGrpLogo from '../img/group.png';
import logoutLogo from '../img/logout.png';
import { fetchActivites, createActivite, updateActivite as updateActiviteApi, deleteActivite as deleteActiviteApi, fetchUsers, deleteUser as deleteUserApi } from '../services/api';
import Modal from './modal';
import { ModalEdit } from './modaledit';
import Dashboard from './dashboard'; 
import UsersView from './usersView';
import messageIcon from '../img/message.png';
import Messagerie from './messagerie';


const Main = ({ user, onClickDashboard, onLogout }) => {

    const [showUserInfo, setShowUserInfo] = useState(false);
    const [showUsersView, setshowUsersView] = useState(false);
    const [activites, setActivites] = useState([]);
    const [users, setUsers] = useState([]);
    const [showDashboard, setShowDashboard] = useState(false); 
    const [newActivite, setNewActivite] = useState({
        libelleActivite: '',
        description: '',
        lieu: '',
        date: ''
    }); 
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        email: '',
        admin: ''
    });
    const [lieuFilter, setLieuFilter] = useState('');
    const [showMessagerie, setShowMessagerie] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingActivite, setEditingActivite] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    useEffect(() => {
        const loadActivites = async () => {
            const data = await fetchActivites();
            if (data) {
                setActivites(data);
            }
        };
        loadActivites();
    }, []);

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

    const toggleUsersView = () => {
        setshowUsersView(!showUsersView);
    }

    const toggleDashboard = () => {
        setShowDashboard(!showDashboard);
    }

    const toggleMessagerie = () => {
        setShowMessagerie(!showMessagerie);
    }

    const updateLocalStorageActivites = (activites) => {
        localStorage.setItem('activites', JSON.stringify(activites));
    }

    const handleAddActivite = async (e) => {
        e.preventDefault();
        const idActivite = activites.length + 1;
        const newActiviteWithId = { idActivite, ...newActivite };
        
        const result = await createActivite(newActiviteWithId);
        if (result) {
            setActivites([...activites, result]); 
            updateLocalStorageActivites([...activites, result]);
            setNewActivite({ libelleActivite: '', description: '', lieu: '', date: '' }); 
            setShowAddForm(false);
        } else {
            alert('Erreur lors de l\'ajout de l\'activité');
        }
    };

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

    const handleDeleteActivite = async (id) => {
        const result = await deleteActiviteApi(id);
        if (result && result.success) {
            setActivites(activites.filter(activite => activite.idActivite !== id));
            updateLocalStorageActivites(activites.filter(activite => activite.idActivite !== id));
        } else {
            alert('Erreur lors de la suppression de l\'activité');
        }
    };

    const handleEditActivite = (id) => {
        const activiteToEdit = activites.find(activite => activite.idActivite === id);
        setEditingActivite(activiteToEdit);
        setShowEditForm(true);
    };

    const handleUpdateActivite = async (updatedActivite) => {
        try {
            console.log("Données envoyées pour mise à jour:", updatedActivite);
            const result = await updateActiviteApi(updatedActivite);
            console.log("Résultat de la mise à jour:", result);
            if (result) {
                const newActivites = activites.map(activite => 
                    activite.idActivite === updatedActivite.idActivite ? result : activite
                );
                setActivites(newActivites);
                updateLocalStorageActivites(newActivites);
                setShowEditForm(false);
                setEditingActivite(null);
            } else {
                throw new Error('La mise à jour a échoué');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la mise à jour de l\'activité');
        }
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });

        const sortedActivites = [...activites].sort((a, b) => {
            if (key === 'date') {
                const dateA = new Date(a[key]);
                const dateB = new Date(b[key]);
                if (direction === 'ascending') {
                    return dateA - dateB;
                }
                return dateB - dateA;
            }
            return 0;
        });
        setActivites(sortedActivites);
    };

    console.log('Activités:', activites); 

    
    const filteredActivites = activites.filter(activite => {
        if (!activite || !activite.lieu) return false;
        return lieuFilter === '' || activite.lieu.toLowerCase().includes(lieuFilter.toLowerCase());
    });

    const handleFilter = (e) => {
        const value = e.target.value || '';
        setLieuFilter(value);
    };

    const handleLogout = () => {
        console.log("Tentative de déconnexion");
        localStorage.removeItem('currentUser');
        if (onLogout) {
            onLogout();
        }
        window.location.reload();
    };

    if (!user) {
        return <div>Utilisateur non connecté</div>; 
    }

    return (
        <div>
            {showMessagerie ? (
                <Messagerie user={user}/>
            ) : showDashboard ? (
                <Dashboard user={user} onClickDashboard={onClickDashboard}/>
            ) : showUsersView ? (
                <UsersView user={user}/>
            ) : (
                <div className='main'>
                    <div className='container'>
                        <div className='header'>
                            <div className='navbar'>
                                <div className='cofrd'>
                                    <div className='cofrd-logo'>
                                        <img src={cofrdLogo} alt="cofrd"/>
                                        <h2 className='cofrd-logo-text'>Connect</h2>
                                    </div>
                                </div>   
                                <div className='paging'>
                                    
                                    <div className='dashboard-paging'> 
                                        <div className='dashboard-logo' onClick={toggleDashboard}>
                                            <img src={dashboardLogo} alt="dashboard-paging" />
                                            <h2 className='dashboard-logo-text'>Tableau de bord</h2>
                                        </div>
                                    </div>
                                    <div className='activite-paging'> 
                                        <div className='activite-logo'>
                                            <img src={activiteLogo} alt="activite-paging" />
                                            <h2 className='activite-logo-text active'>Événements</h2>
                                        </div>
                                    </div>
                                    {user.admin === 1 && (
                                        <div className='users-paging'> 
                                            <div className='users-logo' onClick={toggleUsersView}>
                                                <img src={userGrpLogo} alt="users-paging" />
                                                <h2 className='users-logo-text'>Utilisateurs</h2>
                                            </div>
                                        </div>
                                    )}
                                    <div className='messagerie-paging'>
                                        <div className='messagerie-logo' onClick={toggleMessagerie}>
                                            <img src={messageIcon} alt="messagerie-paging" />
                                            <h2 className='messagerie-logo-text'>Messagerie</h2>
                                        </div>
                                    </div>
                                </div>                                
                                
                                <div className='user'>
                                    <div className='user-logo'>
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
                                            <div className='logout-main' onClick={handleLogout}>
                                                <img src={logoutLogo} alt='logout'/>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>                   
                        </div>

                        <div className='content'>
                            
                            <div className='activites-container'>
                                <div className='activites-header'>
                                    <div className='activites-title'>
                                        <h2>Liste des Spectacles</h2>
                                    </div>
                                    {user.admin === 1 && (
                                        <div className='groupuser-logo' onClick={toggleUsersView}>
                                            <img src={groupuser} alt='groupuser'/>
                                        </div>
                                    )}
                                </div>
                                {!showUsersView ? (
                                    <div className='activites-table'>
                                        
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Libellé</th>
                                                    <th>Description</th>
                                                    <th>
                                                        Lieu
                                                        <div>
                                                            <input
                                                                type="text"
                                                                placeholder="Filtrer par lieu..."
                                                                value={lieuFilter}
                                                                onChange={handleFilter}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '5px',
                                                                    marginTop: '5px',
                                                                    border: '1px solid #ddd',
                                                                    borderRadius: '4px'
                                                                }}
                                                            />
                                                        </div>
                                                    </th>
                                                    <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                                                        Date {sortConfig.key === 'date' && (
                                                            <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                                                        )}
                                                    </th>
                                                    {user.admin === 1 && <th>Actions</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredActivites.map((activite) => (
                                                    <tr key={activite.idActivite}>
                                                        <td>{activite.libelleActivite}</td>
                                                        <td>{activite.description}</td>
                                                        <td>{activite.lieu}</td>
                                                        <td>{activite.date}</td>
                                                        {user.admin === 1 && ( 
                                                            <td>
                                                                <img 
                                                                    src={editIcon} 
                                                                    alt="Edit" 
                                                                    onClick={() => handleEditActivite(activite.idActivite)} 
                                                                    style={{ cursor: 'pointer', width: '20px', height: '20px', marginRight: '10px' }} 
                                                                />
                                                                <img 
                                                                    src={deleteIcon} 
                                                                    alt="Delete" 
                                                                    onClick={() => handleDeleteActivite(activite.idActivite)} 
                                                                    style={{ cursor: 'pointer', width: '20px', height: '20px' }} 
                                                                />
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
                                ) : (
                                    
                                    <div className='users-table'>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Nom d'utilisateur</th>
                                                    <th>Email</th>
                                                    <th>Rôle</th>
                                                    {user.admin === 1 && <th>Actions</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((user) => (
                                                    <tr key={user.id}>
                                                        <td>{user.username}</td>
                                                        <td>{user.email}</td>
                                                        <td>{user.admin === 1 ? 'Administrateur' : 'Utilisateur'}</td>
                                                        {user.admin === 0 && user.id !== user.id && (
                                                            <td>
                                                                <img 
                                                                    src={deleteIcon} 
                                                                    alt="Delete" 
                                                                    onClick={() => handleDeleteUser(user.id)} 
                                                                    style={{ cursor: 'pointer', width: '20px', height: '20px' }} 
                                                                />
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
                                )}
                            </div>
                        </div>
                        {showAddForm && (
                            <Modal 
                                isOpen={showAddForm}
                                onClose={() => setShowAddForm(false)}
                                onSubmit={handleAddActivite}
                                newActivite={newActivite}
                                setNewActivite={setNewActivite}
                            />
                        )}
                        {showEditForm && (
                            <ModalEdit 
                                isOpen={showEditForm}
                                onClose={() => setShowEditForm(false)}
                                onSubmit={handleUpdateActivite}
                                editingActivite={editingActivite}
                                setEditingActivite={setEditingActivite}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Main;