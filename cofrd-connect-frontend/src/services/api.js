import { activites as mockActivites } from '../mockData';

// Mock data pour les utilisateurs
const mockUsers = [
    { id: 1, username: 'admin', email: 'admin@example.com', admin: 1 },
    { id: 2, username: 'user1', email: 'user1@example.com', admin: 0 },
    { id: 3, username: 'user2', email: 'user2@example.com', admin: 0 },
];

let activites = [...mockActivites];
let users = [...mockUsers];

export const fetchActivites = async () => {
    try {
        return activites;
    } catch (error) {
        console.error('Erreur lors de la récupération des activités:', error);
        return null;
    }
};

export const createActivite = async (activite) => {
    try {
        activites = [...activites, activite];
        return activite;
    } catch (error) {
        console.error('Erreur lors de la création de l\'activité:', error);
        return null;
    }
};

export const updateActivite = async (activite) => {
    try {
        const index = activites.findIndex(a => a.idActivite === activite.idActivite);
        if (index !== -1) {
            activites[index] = activite;
            return activite;
        }
        throw new Error('Activité non trouvée');
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'activité:', error);
        return null;
    }
};

export const deleteActivite = async (id) => {
    try {
        const index = activites.findIndex(a => a.idActivite === id);
        if (index !== -1) {
            activites = activites.filter(a => a.idActivite !== id);
            return { success: true };
        }
        throw new Error('Activité non trouvée');
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'activité:', error);
        return null;
    }
};

export const fetchUsers = async () => {
    try {
        return users;
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        return null;
    }
};
