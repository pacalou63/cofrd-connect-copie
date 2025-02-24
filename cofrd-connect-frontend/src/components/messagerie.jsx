import React, { useState, useEffect, useRef } from 'react';
import './messagerie.css';
import activiteLogo from '../img/appointment.png';
import Main from './main';
import Dashboard from './dashboard';
import UsersView from './usersView';
import userLogo from '../img/people.png';
import userGrpLogo from '../img/group.png';
import logoutLogo from '../img/logout.png';
import cofrdLogo from '../img/cofrd-logo.webp'; 
import petitPoints from '../img/more.png';
import allUsers from '../img/profile.png';
import dashboard from '../img/dashboard.png';
import messageIcon from '../img/message.png';
import { fetchUsers, saveMessages, loadMessages } from '../services/api';
import io from 'socket.io-client';

const Messagerie = ({ user, onLogout }) => {
    const [showMain, setShowMain] = useState(false);
    const [showUserInfo, setShowUserInfo] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [showUsersView, setShowUsersView] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [message, setMessage] = useState('');
    const [users, setUsers] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [showAllUsers, setShowAllUsers] = useState(false);
    const socketRef = useRef();
    const [unreadMessages, setUnreadMessages] = useState({});  // { userId: count }
    const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);

    useEffect(() => {
        const loadUsers = async () => {
            const fetchedUsers = await fetchUsers();
            // Filtrer l'utilisateur actuel de la liste
            const otherUsers = fetchedUsers.filter(u => u.id !== user.id);
            setUsers(otherUsers);
        };
        loadUsers();
    }, [user.id]);

    useEffect(() => {
        console.log('Connecting socket for user:', user.id);
        socketRef.current = io('http://localhost:3001');

        socketRef.current.emit('login', user.id);

        const handlePrivateMessage = ({ from, message }) => {
            console.log('Socket received message:', { from, message, currentUser: user.id });
            if (from !== user.id) {
                // Incrémenter le compteur de messages non lus
                setUnreadMessages(prev => ({
                    ...prev,
                    [from]: (prev[from] || 0) + 1
                }));
                
                console.log('Processing received message from other user');
                setConversations(prevConversations => {
                    const conversationIndex = prevConversations.findIndex(
                        conv => conv.user?.id === from
                    );
                    
                    const messageId = `${from}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const newMessage = {
                        id: messageId,
                        sender: from,
                        text: message,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };

                    const updatedConversations = [...prevConversations];
                    if (conversationIndex > -1) {
                        updatedConversations[conversationIndex] = {
                            ...updatedConversations[conversationIndex],
                            messages: [...updatedConversations[conversationIndex].messages, newMessage]
                        };
                    } else {
                        const sender = users.find(u => u.id === from);
                        if (sender) {
                            updatedConversations.push({
                                id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                user: sender,
                                messages: [newMessage]
                            });
                        }
                    }
                    return updatedConversations;
                });
            }
        };

        socketRef.current.on('private message', handlePrivateMessage);

        return () => {
            socketRef.current.off('private message', handlePrivateMessage);
            socketRef.current.disconnect();
        };
    }, [user.id, users]);

    // Charger l'historique des messages au démarrage
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/messages/${user.id}`);
                if (!response.ok) {
                    throw new Error('Erreur lors du chargement des messages');
                }
                const messages = await response.json();
                console.log('Messages chargés:', messages);
                
                if (Array.isArray(messages)) {
                    // Organiser les messages par conversation
                    const messagesByConversation = messages.reduce((acc, msg) => {
                        const otherId = msg.from === user.id ? msg.to : msg.from;
                        if (!acc[otherId]) {
                            acc[otherId] = [];
                        }
                        acc[otherId].push({
                            id: msg.id,
                            sender: msg.from,
                            text: msg.text,
                            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })
                        });
                        return acc;
                    }, {});

                    // Créer les conversations
                    const newConversations = Object.entries(messagesByConversation)
                        .map(([userId, messages]) => {
                            const otherUser = users.find(u => u.id === parseInt(userId));
                            if (otherUser) {
                                return {
                                    id: `conv-${userId}`,
                                    user: otherUser,
                                    messages: messages
                                };
                            }
                            return null;
                        })
                        .filter(conv => conv !== null);

                    console.log('Conversations créées:', newConversations);
                    setConversations(newConversations);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des messages:', error);
            }
        };

        if (users.length > 0) {
            loadMessages();
        }
    }, [user.id, users]);

    // Sauvegarder les conversations quand elles changent
    useEffect(() => {
        saveMessages(conversations);
    }, [conversations]);

    // Mettre à jour le total des messages non lus quand unreadMessages change
    useEffect(() => {
        const total = Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
        setTotalUnreadMessages(total);
    }, [unreadMessages]);

    const toggleUserInfo = () => {
        setShowUserInfo(!showUserInfo);
    };

    const toggleMain = () => {
        setShowMain(!showMain);
    };

    const toggleDashboard = () => {
        setShowDashboard(!showDashboard);
    };

    const toggleUsersView = () => {
        setShowUsersView(!showUsersView);
    };

    const handleLogout = () => {
        console.log("Tentative de déconnexion");
        localStorage.removeItem('currentUser');
        if (onLogout) {
            onLogout();
        }
        window.location.reload();
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (message.trim() && selectedUser) {
            const newMessage = {
                id: `${user.id}-${Date.now()}`,
                sender: user.id,
                text: message,
                timestamp: new Date().toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })
            };

            socketRef.current.emit('private message', {
                from: user.id,
                to: selectedUser.id,
                message: message
            });

            setConversations(prevConversations => {
                const conversationIndex = prevConversations.findIndex(
                    conv => conv.user.id === selectedUser.id
                );

                const updatedConversations = [...prevConversations];
                if (conversationIndex > -1) {
                    updatedConversations[conversationIndex] = {
                        ...updatedConversations[conversationIndex],
                        messages: [...updatedConversations[conversationIndex].messages, newMessage]
                    };
                } else {
                    updatedConversations.push({
                        id: `conv-${selectedUser.id}`,
                        user: selectedUser,
                        messages: [newMessage]
                    });
                }
                return updatedConversations;
            });

            setMessage('');
        }
    };

    const handleConversationClick = (otherUser) => {
        setSelectedUser(otherUser);
        // Réinitialiser le compteur de messages non lus pour cet utilisateur
        setUnreadMessages(prev => ({
            ...prev,
            [otherUser.id]: 0
        }));
    };

    const toggleAllUsers = () => {
        setShowAllUsers(!showAllUsers);
    };

    const startNewConversation = (newUser) => {
        setSelectedUser(newUser);
        setShowAllUsers(false);
        
        // Vérifier si une conversation existe déjà
        const existingConv = conversations.find(conv => conv.user.id === newUser.id);
        if (!existingConv) {
            // Créer une nouvelle conversation vide
            const newConversation = {
                id: `conv-${newUser.id}-${Date.now()}`,
                user: newUser,
                messages: []
            };
            setConversations([...conversations, newConversation]);
        }
    };

    return (
        <div>
            {showMain ? (
                <Main user={user} onLogout={onLogout}/>
            ) : showDashboard ? (
                <Dashboard user={user} onLogout={onLogout}/>
            ) : showUsersView ? (
                <UsersView user={user} onLogout={onLogout}/>
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
                                    <div className='line'></div>  
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
                                            <div className='logout-messagerie' onClick={handleLogout}>
                                                <img src={logoutLogo} alt='logout'/>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className='paging'>
                                    
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
                                    {user.admin === 1 && (
                                        <div className='users-paging'> 
                                            <div className='users-logo' onClick={toggleUsersView}>
                                                <img src={userGrpLogo} alt="users-paging" />
                                                <h2 className='users-logo-text'>Utilisateurs</h2>
                                            </div>
                                        </div>
                                    )}
                                    <div className='messagerie-paging'> 
                                        <div className='messagerie-logo'>
                                            <img src={messageIcon} alt="messagerie-paging" />
                                            <div className='messagerie-text-container'>
                                                <h2 className='messagerie-logo-text active'>Messagerie</h2>
                                                {totalUnreadMessages > 0 && (
                                                    <div className='messagerie-text-badge'>{totalUnreadMessages}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='messagerie-content'>
                            <div className='contacts-list'>
                                <div className='contacts-header'>
                                    <h2>Conversations</h2>
                                    <img 
                                        src={allUsers} 
                                        style={{ width: '40px', height: '40px', cursor: 'pointer' }} 
                                        alt="allUsers" 
                                        onClick={toggleAllUsers}
                                    />
                                </div>
                                <div className='contacts'>
                                    {conversations.map(conversation => (
                                        <div 
                                            key={conversation.id} 
                                            className={`contact-item ${selectedUser?.id === conversation.user.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedUser(conversation.user)}
                                        >
                                            <div className='contact-avatar'>
                                                <img src={userLogo} alt={conversation.user.username} />
                                                {unreadMessages[conversation.user.id] > 0 && (
                                                    <span className='unread-badge'>
                                                        {unreadMessages[conversation.user.id]}
                                                    </span>
                                                )}
                                            </div>
                                            <div className='contact-info'>
                                                <h3>{conversation.user.username}</h3>
                                                {conversation.messages.length > 0 && (
                                                    <p className='last-message'>
                                                        {conversation.messages[conversation.messages.length - 1].text.substring(0, 30)}
                                                        {conversation.messages[conversation.messages.length - 1].text.length > 30 ? '...' : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {showAllUsers && (
                                <div className='modal-overlay'>
                                    <div className='users-modal'>
                                        <div className='modal-header'>
                                            <h2>Tous les utilisateurs</h2>
                                            <button onClick={toggleAllUsers} className='close-modal'>×</button>
                                        </div>
                                        <div className='modal-content'>
                                            {users.map(otherUser => (
                                                <div 
                                                    key={otherUser.id} 
                                                    className='contact-item'
                                                    onClick={() => startNewConversation(otherUser)}
                                                >
                                                    <div className='contact-avatar'>
                                                        <img src={userLogo} alt={otherUser.username} />
                                                    </div>
                                                    <div className='contact-info'>
                                                        <h3>{otherUser.username}</h3>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className='chat-container'>
                                {selectedUser ? (
                                    <>
                                        <div className='chat-header'>
                                            <h2>{selectedUser.username}</h2>
                                        </div>
                                        <div className='messages-container'>
                                            {conversations
                                                .find(conv => conv.user.id === selectedUser.id)
                                                ?.messages.map(msg => (
                                                    <div 
                                                        key={msg.id} 
                                                        className={`message ${msg.sender === user.id ? 'sent' : 'received'}`}
                                                    >
                                                        <p>{msg.text}</p>
                                                        <span className='timestamp'>{msg.timestamp}</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                        <form className='message-input' onSubmit={handleSendMessage}>
                                            <input
                                                type="text"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder="Écrivez votre message..."
                                            />
                                            <button type="submit">Envoyer</button>
                                        </form>
                                    </>
                                ) : (
                                    <div className='no-chat-selected'>
                                        <h2>Sélectionnez une conversation pour commencer</h2>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messagerie;
