import { activites as mockActivites } from '../mockData';

const mockUsersInitial = [
    { id: 1, username: 'admin', email: 'admin@example.com', admin: 1 },
    { id: 2, username: 'user1', email: 'user1@example.com', admin: 0 },
    { id: 3, username: 'user2', email: 'user2@example.com', admin: 0 },
];

// URL de l'API - Utilise la variable d'environnement ou une valeur par défaut
let API_URL = process.env.REACT_APP_API_URL 
    ? `${process.env.REACT_APP_API_URL}/api` 
    : 'http://localhost:3001/api';

// Ne pas utiliser l'astuce du point qui cause des problèmes
// if (API_URL.includes('vercel.app') && !API_URL.includes('vercel.app.')) {
//     API_URL = API_URL.replace('vercel.app', 'vercel.app.');
// }

console.log('API URL:', API_URL);

let activites = [...mockActivites];
let users = [...mockUsersInitial];
let mockUsers = [...mockUsersInitial];

export const fetchActivites = async () => {
    try {
        const response = await fetch(`${API_URL}/activites`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des activités');
        }
        const data = await response.json();
        console.log('Data:', data);
        
        // Vérifier si data est un tableau ou s'il contient une propriété activites
        if (Array.isArray(data)) {
            activites = data;
        } else if (data && data.activites && Array.isArray(data.activites)) {
            activites = data.activites;
        } else {
            console.warn('Format de données inattendu:', data);
            // Garder les activités mock si les données reçues ne sont pas valides
        }
        
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des activités:', error);
        return null;
    }
};

export const createActivite = async (activite) => {
    try {
        console.log('Frontend - Envoi de la requête pour créer une activité:', activite);
        const response = await fetch(`${API_URL}/activites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(activite)
        });

        console.log('Frontend - Statut de la réponse:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Frontend - Erreur de réponse:', errorText);
            throw new Error(`Erreur lors de la création de l'activité: ${response.status} ${errorText}`);
        }

        const newActivite = await response.json();
        console.log('Frontend - Activité créée avec succès:', newActivite);
        
        // Vérifier que activites est bien un tableau avant de l'utiliser
        if (Array.isArray(activites)) {
            activites = [...activites, newActivite];
        } else {
            console.warn('Frontend - activites n\'est pas un tableau, initialisation avec le nouvel élément');
            activites = [newActivite];
        }
        
        return newActivite;
    } catch (error) {
        console.error('Frontend - Erreur lors de la création de l\'activité:', error);
        return null;
    }
};

export const updateActivite = async (activite) => {
    try {
        console.log("Données reçues dans updateActivite:", activite);
        
        // Déterminer l'ID à utiliser (MongoDB _id ou idActivite personnalisé)
        const id = activite._id || activite.idActivite;
        
        if (!id) {
            throw new Error('ID d\'activité manquant');
        }
        
        console.log("ID utilisé pour la mise à jour:", id);
        
        // Essayer d'abord l'API
        try {
            const response = await fetch(`${API_URL}/activites/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(activite)
            });

            console.log('Statut de la réponse de mise à jour:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erreur de réponse lors de la mise à jour:', errorText);
                throw new Error(`API non disponible: ${response.status} ${errorText}`);
            }

            const updatedActivite = await response.json();
            console.log('Activité mise à jour avec succès:', updatedActivite);
            return updatedActivite;
        } catch (apiError) {
            console.log('API non disponible, utilisation des données mockées:', apiError);
            
            // Mise à jour locale des activités mockées
            const index = activites.findIndex(a => 
                (a._id && a._id === activite._id) || 
                (a.idActivite && a.idActivite === activite.idActivite)
            );
            
            if (index !== -1) {
                const updatedActivite = {
                    ...activites[index],
                    ...activite
                };
                console.log("Activité mise à jour localement:", updatedActivite);
                activites[index] = updatedActivite;
                return updatedActivite; // Important : retourner l'activité mise à jour
            }
            throw new Error('Activité non trouvée');
        }
    } catch (error) {
        console.error('Erreur dans updateActivite:', error);
        return null;
    }
};

export const deleteActivite = async (id) => {
    try {
        console.log('Frontend - Tentative de suppression d\'activité avec ID:', id);
        
        // Vérifier si l'ID est un ID MongoDB (_id) ou un ID personnalisé (idActivite)
        const mongoId = id.startsWith && id.startsWith('_id_') ? id.substring(4) : id;
        console.log('Frontend - ID MongoDB utilisé pour la suppression:', mongoId);
        
        const response = await fetch(`${API_URL}/activites/${mongoId}`, {
            method: 'DELETE'
        });

        console.log('Frontend - Statut de la réponse de suppression:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Frontend - Erreur de réponse lors de la suppression:', errorText);
            throw new Error(`Erreur lors de la suppression de l'activité: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log('Frontend - Résultat de la suppression:', result);
        
        // Vérifier que activites est bien un tableau avant de l'utiliser
        if (Array.isArray(activites)) {
            // Utiliser l'ID approprié pour filtrer les activités
            activites = activites.filter(a => {
                // Si l'activité a un _id, comparer avec mongoId
                if (a._id) {
                    return a._id !== mongoId;
                }
                // Sinon, comparer avec l'ID personnalisé
                return a.idActivite !== id;
            });
        } else {
            console.warn('Frontend - activites n\'est pas un tableau lors de la suppression');
        }
        
        return { success: true, ...result };
    } catch (error) {
        console.error('Frontend - Erreur lors de la suppression de l\'activité:', error);
        return { success: false, error: error.message };
    }
};

export const fetchUsers = async () => {
    try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) {
            // Si l'API n'est pas disponible, utiliser les données mockées
            console.log('API non disponible, utilisation des données mockées');
            return mockUsers;
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        // En cas d'erreur, retourner les données mockées
        return mockUsers;
    }
};

export const deleteUser = async (id) => {
    try {
        console.log('API - Tentative de suppression de l\'utilisateur avec ID:', id);
        
        if (!id) {
            console.error('API - ID utilisateur non défini');
            throw new Error('ID utilisateur non défini');
        }
        
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
        });

        console.log('API - Réponse de la suppression:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API - Erreur lors de la suppression de l\'utilisateur:', errorData);
            throw new Error(errorData.message || 'Erreur lors de la suppression de l\'utilisateur');
        }
        
        const result = await response.json();
        console.log('API - Résultat de la suppression:', result);
        
        // Mise à jour des données mockées si nécessaire
        users = users.filter(u => u._id !== id && u.id !== id);
        mockUsers = mockUsers.filter(u => u._id !== id && u.id !== id);
        
        return result;
    } catch (error) {
        console.error('API - Erreur lors de la suppression de l\'utilisateur:', error);
        return { success: false, error: error.message };
    }
};

export const createUser = async (userData) => {
    try {
        console.log('Frontend - Envoi de la requête pour créer un utilisateur:', userData);
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Erreur lors de la création de l\'utilisateur:', errorData);
            throw new Error(errorData.message || 'Erreur lors de la création de l\'utilisateur');
        }

        const result = await response.json();
        console.log('Utilisateur créé avec succès:', result);
        
        // Mise à jour des données mockées si nécessaire
        if (result && result.user) {
            const newUser = {
                ...userData,
                _id: result.user._id || result.user.id || Date.now().toString(),
                id: result.user.id || result.user._id || Date.now().toString()
            };
            users.push(newUser);
            mockUsers.push(newUser);
            return result;
        } else if (result && (result._id || result.id)) {
            const newUser = {
                ...userData,
                _id: result._id || result.id,
                id: result.id || result._id
            };
            users.push(newUser);
            mockUsers.push(newUser);
            return result;
        }
        
        return result;
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        return { success: false, error: error.message };
    }
};

export const saveMessages = async (message) => {
    try {
        // Vérifier que les données essentielles sont présentes
        if (!message.from || !message.to) {
            throw new Error('Données de message incomplètes: expéditeur ou destinataire manquant');
        }
        
        // S'assurer que le message a soit text soit message
        const messageContent = message.text || message.message;
        if (!messageContent) {
            throw new Error('Données de message incomplètes: contenu du message manquant');
        }
        
        // Normaliser le format du message pour le backend
        const normalizedMessage = {
            from: message.from,
            to: message.to,
            text: messageContent, // Le backend attend 'text'
            timestamp: new Date().toISOString() // Toujours utiliser le format ISO pour le stockage
        };

        console.log('Envoi du message au backend:', normalizedMessage);

        const response = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(normalizedMessage)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erreur lors de la sauvegarde du message');
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du message:', error);
        throw error;
    }
};

export const loadMessages = async (userId) => {
    try {
        console.log('Chargement des messages pour l\'utilisateur:', userId);
        const response = await fetch(`${API_URL}/messages/${userId}`);
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des messages');
        }
        const messages = await response.json();
        console.log('Messages récupérés:', messages.length);
        return messages;
    } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        return [];
    }
};
