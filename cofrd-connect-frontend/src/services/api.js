import { activites as mockActivites } from '../mockData';

const mockUsers = [
    { id: 1, username: 'admin', email: 'admin@example.com', admin: 1 },
    { id: 2, username: 'user1', email: 'user1@example.com', admin: 0 },
    { id: 3, username: 'user2', email: 'user2@example.com', admin: 0 },
];

const API_URL = 'http://localhost:3001/api';

let activites = [...mockActivites];
let users = [...mockUsers];

export const fetchActivites = async () => {
    try {
        const response = await fetch(`${API_URL}/activites`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des activités');
        }
        const data = await response.json();
        console.log('Data:', data);
        activites = data.activites;
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des activités:', error);
        return null;
    }
};

export const createActivite = async (activite) => {
    try {
        const response = await fetch(`${API_URL}/activites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(activite)
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la création de l\'activité');
        }

        const newActivite = await response.json();
        activites = [...activites, newActivite];
        return newActivite;
    } catch (error) {
        console.error('Erreur lors de la création de l\'activité:', error);
        return null;
    }
};

export const updateActivite = async (activite) => {
    try {
        console.log("Données reçues dans updateActivite:", activite);
        // Essayer d'abord l'API
        try {
            const response = await fetch(`${API_URL}/activites/${activite.idActivite}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(activite)
            });

            if (!response.ok) {
                throw new Error('API non disponible');
            }

            const updatedActivite = await response.json();
            return updatedActivite;
        } catch (apiError) {
            console.log('API non disponible, utilisation des données mockées');
            
            // Mise à jour locale des activités mockées
            const index = activites.findIndex(a => a.idActivite === activite.idActivite);
            if (index !== -1) {
                const updatedActivite = {
                    ...activites[index],
                    ...activite
                };
                console.log("Activité mise à jour:", updatedActivite);
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
        const response = await fetch(`${API_URL}/activites/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression de l\'activité');
        }

        activites = activites.filter(a => a.idActivite !== id);
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'activité:', error);
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
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression de l\'utilisateur');
        }
        users = users.filter(u => u.id !== id);
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        return { success: false };
    }
};

export const saveMessages = (conversations) => {
    try {
        localStorage.setItem('chatMessages', JSON.stringify(conversations));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des messages:', error);
    }
};

export const loadMessages = () => {
    try {
        const savedMessages = localStorage.getItem('chatMessages');
        return savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        return [];
    }
};
