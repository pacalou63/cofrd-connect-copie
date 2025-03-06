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
import { fetchUsers, loadMessages, saveMessages } from '../services/api';
import io from 'socket.io-client';

// Fonction utilitaire pour formater la date selon les critères spécifiés
const formatDate = (timestamp) => {
    // Si la date est déjà formatée, la retourner telle quelle
    if (typeof timestamp === 'string' && !timestamp.includes('T') && !timestamp.includes('-')) {
        return timestamp;
    }
    
    const messageDate = new Date(timestamp);
    const now = new Date();
    
    // Formater l'heure (HH:MM)
    const hours = messageDate.getHours().toString().padStart(2, '0');
    const minutes = messageDate.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    // Vérifier si c'est aujourd'hui
    if (messageDate.toDateString() === now.toDateString()) {
        return timeString;
    }
    
    // Vérifier si c'est hier
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
        return `Hier, ${timeString}`;
    }
    
    // Vérifier si c'est avant-hier
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);
    if (messageDate.toDateString() === twoDaysAgo.toDateString()) {
        return `Avant-hier, ${timeString}`;
    }
    
    // Vérifier si c'est cette année
    if (messageDate.getFullYear() === now.getFullYear()) {
        const day = messageDate.getDate().toString().padStart(2, '0');
        const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
        return `${day}/${month}, ${timeString}`;
    }
    
    // Si c'est une année différente
    const day = messageDate.getDate().toString().padStart(2, '0');
    const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
    const year = messageDate.getFullYear();
    return `${day}/${month}/${year}`;
};

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
    const [processedMessageIds, setProcessedMessageIds] = useState(new Set());

    // Vérifier si l'utilisateur est connecté au chargement
    useEffect(() => {
        if (!user) {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                try {
                    const parsedUser = JSON.parse(savedUser);
                    if (!parsedUser || !parsedUser.id) {
                        console.error('Utilisateur invalide dans le localStorage');
                        localStorage.removeItem('currentUser');
                        if (onLogout) onLogout();
                        return;
                    }
                } catch (error) {
                    console.error('Erreur lors de la lecture de l\'utilisateur:', error);
                    localStorage.removeItem('currentUser');
                    if (onLogout) onLogout();
                    return;
                }
            } else {
                console.log('Pas d\'utilisateur connecté');
                if (onLogout) onLogout();
                return;
            }
        }
    }, [user, onLogout]);

    useEffect(() => {
        const loadUsers = async () => {
            if (!user || !user.id) return;
            
            try {
                const fetchedUsers = await fetchUsers();
                // Filtrer l'utilisateur actuel de la liste
                const otherUsers = fetchedUsers.filter(u => u.id !== user.id);
                setUsers(otherUsers);
            } catch (error) {
                console.error('Erreur lors du chargement des utilisateurs:', error);
            }
        };
        loadUsers();
    }, [user]);

    useEffect(() => {
        if (!user || !user.id) {
            console.log('Pas d\'utilisateur connecté');
            return;
        }

        const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        
        console.log('Socket.IO URL:', socketUrl);
        console.log('Connecting socket for user:', user.id);
        
        // Configuration améliorée pour Socket.IO avec Vercel
        socketRef.current = io(socketUrl, {
            query: { userId: user.id },
            transports: ['polling', 'websocket'], // Commencer par polling pour Vercel
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            forceNew: true,
            autoConnect: true
        });

        // Ajouter des gestionnaires d'événements pour le débogage
        socketRef.current.on('connect', () => {
            console.log('Socket connecté avec succès, ID:', socketRef.current.id);
            socketRef.current.emit('login', user.id);
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('Erreur de connexion socket:', error);
        });

        socketRef.current.on('reconnect_attempt', (attemptNumber) => {
            console.log(`Tentative de reconnexion #${attemptNumber}`);
        });

        socketRef.current.on('reconnect_failed', () => {
            console.error('Échec de la reconnexion après plusieurs tentatives');
        });

        const handlePrivateMessage = ({ from, message, id }) => {
            console.log('Message reçu via socket:', { from, message, id });
            
            // Si l'ID du message n'est pas défini, on en génère un
            const messageId = id || `msg_${from}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Vérifier si le message a déjà été traité
            if (processedMessageIds.has(messageId)) {
                console.log('Message déjà traité, ignoré:', messageId);
                return;
            }
            
            // Marquer le message comme traité
            setProcessedMessageIds(prev => new Set([...prev, messageId]));

            // Si le message vient d'un autre utilisateur, incrémenter les compteurs
            if (from !== user.id) {
                console.log('Message reçu d\'un autre utilisateur:', from);
                setUnreadMessages(prev => ({
                    ...prev,
                    [from]: (prev[from] || 0) + 1
                }));
                setTotalUnreadMessages(prev => prev + 1);
            } else {
                console.log('Message reçu de moi-même, pas d\'incrémentation des compteurs');
            }

            const formattedDate = formatDate(new Date());

            setConversations(prev => {
                const newConversations = [...prev];
                
                // Rechercher la conversation en tenant compte des deux formats d'ID possibles
                const conversation = newConversations.find(
                    c => c.user && (c.user.id === from || c.user._id === from || c.from === from)
                );

                // Vérifier si le message existe déjà dans la conversation
                const messageExists = conversation && conversation.messages.some(m => m.id === messageId);
                if (messageExists) {
                    console.log('Message déjà présent dans la conversation, ignoré:', messageId);
                    return prev; // Retourner l'état précédent sans modification
                }

                const newMessage = {
                    id: messageId,
                    from,
                    message,
                    timestamp: formattedDate
                };

                if (conversation) {
                    // Vérifier si le message existe déjà dans la conversation
                    if (!conversation.messages.some(m => m.id === messageId)) {
                        conversation.messages.push(newMessage);
                    }
                } else {
                    // Trouver l'utilisateur correspondant
                    const fromUser = users.find(u => u.id === from || u._id === from);
                    // S'assurer que l'utilisateur a un ID normalisé
                    const normalizedUser = fromUser ? {
                        ...fromUser,
                        id: fromUser.id || fromUser._id
                    } : { id: from, username: 'Utilisateur inconnu' };
                    
                    newConversations.push({
                        from,
                        to: user.id,
                        user: normalizedUser,
                        messages: [newMessage]
                    });
                }

                return newConversations;
            });
        };

        socketRef.current.on('private message', handlePrivateMessage);

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [user, users, setUnreadMessages, setTotalUnreadMessages, setConversations]);

    useEffect(() => {
        const total = Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
        setTotalUnreadMessages(total);
    }, [unreadMessages, setTotalUnreadMessages]);

    useEffect(() => {
        const loadInitialMessages = async () => {
            if (!user || !user.id) {
                console.log('Pas d\'utilisateur connecté pour charger les messages');
                return;
            }

            try {
                console.log('Chargement des messages pour l\'utilisateur:', user.id);
                const messages = await loadMessages(user.id);
                console.log('Messages chargés:', messages);
                
                if (Array.isArray(messages)) {
                    // Vider l'ensemble des IDs de messages traités pour éviter les conflits
                    setProcessedMessageIds(new Set());
                    
                    // Chargement des utilisateurs pour enrichir les conversations
                    const allUsers = await fetchUsers();
                    console.log('Utilisateurs chargés pour enrichir les conversations:', allUsers.length);
                    
                    // Transformer les conversations pour inclure les informations utilisateur
                    const enrichedConversations = messages.map(conv => {
                        // Déterminer l'autre utilisateur dans la conversation
                        const otherUserId = conv.from === user.id ? conv.to : conv.from;
                        console.log('Recherche de l\'utilisateur:', otherUserId);
                        
                        const otherUser = allUsers.find(u => u.id === otherUserId || u._id === otherUserId);
                        console.log('Utilisateur trouvé:', otherUser ? otherUser.username : 'Non trouvé');
                        
                        // S'assurer que l'utilisateur a un ID normalisé
                        const normalizedUser = otherUser ? {
                            ...otherUser,
                            id: otherUser.id || otherUser._id
                        } : { id: otherUserId, username: 'Utilisateur inconnu' };
                        
                        // Formater les dates des messages et s'assurer que chaque message a un ID
                        const messagesWithFormattedDates = conv.messages.map(msg => {
                            let timestamp = msg.timestamp;
                            
                            // Si la date est au format ISO, la convertir
                            if (timestamp && timestamp.includes('T')) {
                                timestamp = formatDate(new Date(timestamp));
                            }
                            
                            // S'assurer que chaque message a un ID
                            const messageId = msg.id || `msg_${msg.from}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                            
                            // Marquer ce message comme déjà traité pour éviter les doublons
                            setProcessedMessageIds(prev => new Set([...prev, messageId]));
                            
                            return {
                                ...msg,
                                id: messageId,
                                timestamp
                            };
                        });
                        
                        // Dédupliquer les messages par ID
                        const uniqueMessages = messagesWithFormattedDates.filter(
                            (msg, index, self) => {
                                // Trouver le premier message avec cet ID
                                const firstIndex = self.findIndex(m => m.id === msg.id);
                                // Ne garder que la première occurrence
                                return index === firstIndex;
                            }
                        );
                        
                        return {
                            ...conv,
                            messages: uniqueMessages,
                            user: normalizedUser
                        };
                    });
                    
                    setConversations(enrichedConversations);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des messages:', error);
            }
        };

        loadInitialMessages();
    }, [user, setConversations]);

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
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        localStorage.removeItem('currentUser');
        if (onLogout) {
            onLogout();
        }
        window.location.reload();
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedUser || !user) return;

        try {
            const messageText = message.trim();
            
            // S'assurer que selectedUser a un ID valide
            if (!selectedUser.id && !selectedUser._id) {
                console.error('ID de destinataire manquant', selectedUser);
                return;
            }
            
            // Utiliser l'ID correct (id ou _id)
            const recipientId = selectedUser.id || selectedUser._id;
            
            // Générer un ID unique pour ce message
            const messageId = `msg_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Marquer le message comme déjà traité pour éviter les doublons
            setProcessedMessageIds(prev => new Set([...prev, messageId]));
            
            console.log('Envoi du message:', {
                id: messageId,
                to: recipientId,
                from: user.id,
                message: messageText
            });

            const formattedDate = formatDate(new Date());

            // Sauvegarder le message dans la base de données AVANT de l'ajouter localement
            let savedMessageId = messageId;
            try {
                const savedMessage = await saveMessages({
                    id: messageId,
                    from: user.id,
                    to: recipientId,
                    text: messageText
                });
                console.log('Message sauvegardé avec succès:', savedMessage);
                
                // Si le backend a généré un nouvel ID, l'utiliser
                if (savedMessage && savedMessage._id) {
                    savedMessageId = savedMessage._id.toString();
                    console.log('Utilisation de l\'ID généré par le backend:', savedMessageId);
                }
            } catch (saveError) {
                console.error('Erreur lors de la sauvegarde du message:', saveError);
                // Continuer même si la sauvegarde échoue
            }

            // Mettre à jour les conversations localement avec l'ID correct
            setConversations(prev => {
                const newConversations = [...prev];
                const conversation = newConversations.find(
                    c => c.user && (c.user.id === recipientId || c.user._id === recipientId)
                );

                const newMessage = {
                    id: savedMessageId, // Utiliser l'ID du message sauvegardé
                    from: user.id,
                    message: messageText,
                    timestamp: formattedDate
                };

                if (conversation) {
                    // Vérifier si le message existe déjà dans la conversation
                    if (!conversation.messages.some(m => m.id === savedMessageId)) {
                        conversation.messages.push(newMessage);
                    }
                } else {
                    newConversations.push({
                        from: user.id,
                        to: recipientId,
                        user: selectedUser,
                        messages: [newMessage]
                    });
                }

                return newConversations;
            });

            // Envoyer via socket APRÈS avoir mis à jour l'état local
            // pour éviter le double envoi
            if (socketRef.current) {
                // Éviter d'envoyer le message à soi-même via socket.io
                // car il est déjà ajouté localement
                if (recipientId !== user.id) {
                    socketRef.current.emit('private message', {
                        id: savedMessageId,
                        to: recipientId,
                        from: user.id,
                        message: messageText
                    });
                }
            } else {
                console.error('Socket non connecté');
            }

            setMessage('');
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
        }
    };

    const handleConversationClick = (otherUser) => {
        // S'assurer que otherUser a un ID valide
        if (!otherUser || (!otherUser.id && !otherUser._id)) {
            console.error('Utilisateur invalide:', otherUser);
            return;
        }
        
        // Normaliser l'ID de l'utilisateur (utiliser _id si id n'existe pas)
        const userId = otherUser.id || otherUser._id;
        
        // Créer une copie normalisée de l'utilisateur avec un ID garanti
        const normalizedUser = {
            ...otherUser,
            id: userId
        };
        
        // Mettre à jour l'utilisateur sélectionné
        setSelectedUser(normalizedUser);
        
        // Réinitialiser le compteur de messages non lus pour cet utilisateur
        setUnreadMessages(prev => ({
            ...prev,
            [userId]: 0
        }));
    };

    const toggleAllUsers = () => {
        setShowAllUsers(!showAllUsers);
    };

    const startNewConversation = (newUser) => {
        // S'assurer que newUser a un ID valide
        if (!newUser || (!newUser.id && !newUser._id)) {
            console.error('Utilisateur invalide:', newUser);
            return;
        }
        
        // Normaliser l'ID de l'utilisateur (utiliser _id si id n'existe pas)
        const userId = newUser.id || newUser._id;
        
        // Créer une copie normalisée de l'utilisateur avec un ID garanti
        const normalizedUser = {
            ...newUser,
            id: userId
        };
        
        // Mettre à jour l'utilisateur sélectionné
        setSelectedUser(normalizedUser);
        setShowAllUsers(false);
        
        // Vérifier si une conversation existe déjà
        const existingConv = conversations.find(conv => 
            conv.user && (conv.user.id === userId || conv.user._id === userId)
        );
        
        if (!existingConv) {
            // Créer une nouvelle conversation vide
            const newConversation = {
                id: `conv-${userId}-${Date.now()}`,
                from: user.id,
                to: userId,
                user: normalizedUser,
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
                                            className={`contact-item ${selectedUser?.id === conversation.user?.id ? 'selected' : ''}`}
                                            onClick={() => handleConversationClick(conversation.user)}
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
                                                        {conversation.messages[conversation.messages.length - 1].message.substring(0, 30)}
                                                        {conversation.messages[conversation.messages.length - 1].message.length > 30 ? '...' : ''}
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
                                                ?.messages
                                                // Filtrer les messages dupliqués par ID de manière plus stricte
                                                .filter((msg, index, self) => {
                                                    // Trouver le premier message avec cet ID
                                                    const firstIndex = self.findIndex(m => m.id === msg.id);
                                                    // Ne garder que la première occurrence
                                                    return index === firstIndex;
                                                })
                                                .map(msg => (
                                                    <div 
                                                        key={msg.id} 
                                                        className={`message ${msg.from === user.id ? 'sent' : 'received'}`}
                                                    >
                                                        <p>{msg.message}</p>
                                                        <span className='timestamp'>{msg.timestamp}</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                        <form className='message-input' onSubmit={(e) => {e.preventDefault(); handleSendMessage()}}>
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
