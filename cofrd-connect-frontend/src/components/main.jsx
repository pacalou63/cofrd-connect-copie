import React, { useState, useEffect } from 'react';
import './main.css';
import userLogo from '../img/user.png';
import logoutLogo from '../img/logout.png';
import deleteIcon from '../img/delete.png';
import plusIcon from '../img/plus.png';
import editIcon from '../img/edit.png';
import { fetchActivites, createActivite, updateActivite as updateActiviteApi, deleteActivite as deleteActiviteApi } from '../services/api';
import Modal from './modal';
import { ModalEdit } from './modaledit';



const Main = ({ user, onLogout }) => {

    const [showUserInfo, setShowUserInfo] = useState(false);
    const [activites, setActivites] = useState([]);
    const [newActivite, setNewActivite] = useState({
        libelleActivite: '',
        description: '',
        lieu: '',
        date: ''
    }); 

    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingActivite, setEditingActivite] = useState(null);

    useEffect(() => {
        const loadActivites = async () => {
            const data = await fetchActivites();
            if (data) {
                setActivites(data);
            }
        };
        loadActivites();
    }, []);

    const toggleUserInfo = () => {
        setShowUserInfo(!showUserInfo);
    }

    const handleAddActivite = async (e) => {
        e.preventDefault();
        const idActivite = activites.length + 1;
        const newActiviteWithId = { idActivite, ...newActivite };
        
        const result = await createActivite(newActiviteWithId);
        if (result) {
            setActivites([...activites, result]); 
            setNewActivite({ libelleActivite: '', description: '', lieu: '', date: '' }); 
            setShowAddForm(false);
        } else {
            alert('Erreur lors de l\'ajout de l\'activité');
        }
    };

    const handleDeleteActivite = async (id) => {
        const result = await deleteActiviteApi(id);
        if (result && result.success) {
            setActivites(activites.filter(activite => activite.idActivite !== id));
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
        const result = await updateActiviteApi(updatedActivite);
        if (result) {
            setActivites(activites.map(activite => 
                activite.idActivite === updatedActivite.idActivite ? result : activite
            ));
            setShowEditForm(false);
            setEditingActivite(null);
        } else {
            alert('Erreur lors de la mise à jour de l\'activité');
        }
    };

    return (
        <div className='main'>
            <div className='container'>
                <div className='header'>
                    <div className='navbar'>
                        <div className='user' onClick={toggleUserInfo}>
                            <div className='user-logo'>
                                <img src={userLogo} alt="User" />
                            </div>
                            {showUserInfo && (
                                <div className='user-container'>
                                        <div className='user-info'>
                                            <h1>Salut, {user.username}!</h1>
                                        <p>Email: {user.email}</p>
                                    </div>
                                    <div className='logout'>
                                        <img src={logoutLogo} alt='logout' onClick={onLogout}/>
                                    </div>
                                </div>                          
                            )}
                        </div>
                    </div>                   
                </div>

                <div className='content'>
                    <div className='activites-container'>
                        <div className='activites-title'>
                            <h2>Liste des Activités</h2>
                        </div>
                        <div className='activites-table'>
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Libellé</th>
                                        <th>Description</th>
                                        <th>Lieu</th>
                                        <th>Date</th>
                                        {user.admin === 1 && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {activites.map((activite) => (
                                        <tr key={activite.idActivite}>
                                            <td>{activite.idActivite}</td>
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

                                {user.admin === 1 && ( 
                                    <img 
                                    src={plusIcon} 
                                    alt="Add" 
                                    onClick={() => setShowAddForm(true)} 
                                    style={{ cursor: 'pointer', width: '20px', height: '20px', marginRight: '10px', marginTop: '10px' }} 
                                    /> 
                                )}
                            </table>
                        </div>
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
    );
};

export default Main;