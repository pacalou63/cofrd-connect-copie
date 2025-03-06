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
            console.log('Main - Données d\'activités chargées:', data);
            if (data) {
                // Vérifier si data est un tableau ou s'il contient une propriété activites
                if (Array.isArray(data)) {
                    console.log('Main - Structure de la première activité:', data.length > 0 ? data[0] : 'Aucune activité');
                    setActivites(data);
                } else if (data.activites && Array.isArray(data.activites)) {
                    console.log('Main - Structure de la première activité:', data.activites.length > 0 ? data.activites[0] : 'Aucune activité');
                    setActivites(data.activites);
                } else {
                    console.warn('Format de données inattendu:', data);
                }
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
        
        console.log('Main - Tentative d\'ajout d\'activité:', newActiviteWithId);
        const result = await createActivite(newActiviteWithId);
        console.log('Main - Résultat de createActivite:', result);
        
        if (result) {
            console.log('Main - Activité ajoutée avec succès');
            setActivites([...activites, result]); 
            updateLocalStorageActivites([...activites, result]);
            setNewActivite({ libelleActivite: '', description: '', lieu: '', date: '' }); 
            setShowAddForm(false);
            
            // Recharger les activités depuis le backend après l'ajout
            setTimeout(reloadActivites, 500);
        } else {
            console.error('Main - Erreur lors de l\'ajout de l\'activité');
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

    const reloadActivites = async () => {
        console.log('Main - Rechargement des activités depuis le backend');
        const data = await fetchActivites();
        console.log('Main - Données d\'activités rechargées:', data);
        
        if (data) {
            let newActivites = [];
            
            // Vérifier si data est un tableau ou s'il contient une propriété activites
            if (Array.isArray(data)) {
                console.log('Main - Structure de la première activité rechargée:', data.length > 0 ? data[0] : 'Aucune activité');
                newActivites = data;
            } else if (data.activites && Array.isArray(data.activites)) {
                console.log('Main - Structure de la première activité rechargée:', data.activites.length > 0 ? data.activites[0] : 'Aucune activité');
                newActivites = data.activites;
            } else {
                console.warn('Format de données inattendu lors du rechargement:', data);
                return; // Ne pas continuer si le format est inattendu
            }
            
            // Mettre à jour l'état et le localStorage
            console.log('Main - Mise à jour de l\'état avec les nouvelles activités:', newActivites);
            setActivites(newActivites);
            updateLocalStorageActivites(newActivites);
        }
    };

    const handleDeleteActivite = async (id) => {
        console.log('Main - Tentative de suppression d\'activité avec ID:', id);
        
        // Vérifier si l'activité a un _id (ID MongoDB) ou idActivite
        const activite = activites.find(a => 
            (a._id && a._id === id) || 
            (a.idActivite && a.idActivite === id)
        );
        
        console.log('Main - Activité à supprimer:', activite);
        
        // Utiliser _id s'il existe, sinon utiliser idActivite
        const idToDelete = activite && activite._id ? activite._id : id;
        console.log('Main - ID à utiliser pour la suppression:', idToDelete);
        
        const result = await deleteActiviteApi(idToDelete);
        console.log('Main - Résultat de deleteActivite:', result);
        
        if (result && result.success) {
            console.log('Main - Suppression réussie, mise à jour de l\'état');
            console.log('Main - Activités avant suppression:', activites);
            
            // Filtrer les activités en utilisant l'ID approprié
            const updatedActivites = activites.filter(a => {
                if (activite && activite._id && a._id) {
                    return a._id !== activite._id;
                }
                if (activite && activite.idActivite && a.idActivite) {
                    return a.idActivite !== activite.idActivite;
                }
                return true; // Garder les activités qui n'ont pas d'ID correspondant
            });
            
            console.log('Main - Activités après suppression:', updatedActivites);
            setActivites(updatedActivites);
            updateLocalStorageActivites(updatedActivites);
            
            // Recharger les activités depuis le backend après la suppression
            setTimeout(reloadActivites, 500);
        } else {
            console.error('Main - Erreur lors de la suppression de l\'activité:', result?.error);
            alert('Erreur lors de la suppression de l\'activité');
        }
    };

    const handleEditActivite = (id) => {
        console.log('Tentative d\'édition de l\'activité avec ID:', id);
        
        // Rechercher l'activité par _id ou idActivite
        const activiteToEdit = activites.find(activite => 
            (activite._id && activite._id === id) || 
            (activite.idActivite && activite.idActivite === id)
        );
        
        console.log('Activité trouvée pour édition:', activiteToEdit);
        
        if (activiteToEdit) {
            setEditingActivite(activiteToEdit);
            setShowEditForm(true);
        } else {
            console.error('Activité non trouvée avec ID:', id);
            alert('Erreur: Activité non trouvée');
        }
    };

    const handleUpdateActivite = async (updatedActivite) => {
        try {
            console.log("Données envoyées pour mise à jour:", updatedActivite);
            
            // Vérifier si des champs sont vides et les remplir avec les valeurs existantes
            const activiteToUpdate = activites.find(a => 
                (a._id && updatedActivite._id && a._id === updatedActivite._id) || 
                (a.idActivite && updatedActivite.idActivite && a.idActivite === updatedActivite.idActivite)
            );
            
            console.log("Activité trouvée pour mise à jour:", activiteToUpdate);
            
            if (activiteToUpdate) {
                // Créer une copie de l'activité existante
                const mergedActivite = { ...activiteToUpdate };
                
                // Ne mettre à jour que les champs qui ont été modifiés
                if (updatedActivite.libelleActivite) mergedActivite.libelleActivite = updatedActivite.libelleActivite;
                if (updatedActivite.description) mergedActivite.description = updatedActivite.description;
                if (updatedActivite.lieu) mergedActivite.lieu = updatedActivite.lieu;
                if (updatedActivite.date) mergedActivite.date = updatedActivite.date;
                
                console.log("Données fusionnées pour mise à jour:", mergedActivite);
                
                const result = await updateActiviteApi(mergedActivite);
                console.log("Résultat de la mise à jour:", result);
                
                if (result) {
                    // Mettre à jour l'état local avec le résultat de l'API
                    const newActivites = activites.map(activite => {
                        if ((activite._id && result._id && activite._id === result._id) || 
                            (activite.idActivite && result.idActivite && activite.idActivite === result.idActivite)) {
                            return result;
                        }
                        return activite;
                    });
                    
                    console.log("Nouvel état des activités après mise à jour:", newActivites);
                    
                    setActivites(newActivites);
                    updateLocalStorageActivites(newActivites);
                    setShowEditForm(false);
                    setEditingActivite(null);
                    
                    // Recharger les activités depuis le backend après la mise à jour
                    setTimeout(reloadActivites, 500);
                } else {
                    throw new Error('La mise à jour a échoué');
                }
            } else {
                throw new Error('Activité non trouvée');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la mise à jour de l\'activité');
        }
    };

    const formatDate = (dateString) => {
        const options = { 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
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
    
    console.log('Activités avant filtrage:', activites); 
    
    const filteredActivites = activites.filter(activite => {
        if (!activite || !activite.lieu) {
            console.log('Activité filtrée car manquante ou sans lieu:', activite);
            return false;
        }
        const shouldInclude = lieuFilter === '' || activite.lieu.toLowerCase().includes(lieuFilter.toLowerCase());
        if (!shouldInclude) {
            console.log('Activité filtrée par le filtre de lieu:', activite);
        }
        return shouldInclude;
    });
    
    console.log('Activités après filtrage:', filteredActivites);

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
                                                {filteredActivites.map((activite) => {
                                                    console.log('Affichage de l\'activité:', activite);
                                                    return (
                                                        <tr key={activite._id || activite.idActivite}>
                                                            <td>{activite.libelleActivite}</td>
                                                            <td>{activite.description}</td>
                                                            <td>{activite.lieu}</td>
                                                            <td>{formatDate(activite.date)}</td>
                                                            {user.admin === 1 && ( 
                                                                <td>
                                                                    <img 
                                                                        src={editIcon} 
                                                                        alt="Edit" 
                                                                        onClick={() => handleEditActivite(activite._id || activite.idActivite)} 
                                                                        style={{ cursor: 'pointer', width: '20px', height: '20px', marginRight: '10px' }} 
                                                                    />
                                                                    <img 
                                                                        src={deleteIcon} 
                                                                        alt="Delete" 
                                                                        onClick={() => handleDeleteActivite(activite._id || activite.idActivite)} 
                                                                        style={{ cursor: 'pointer', width: '20px', height: '20px' }} 
                                                                    />
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
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