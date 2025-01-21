const API_URL = 'http://localhost:3001/api';

export const fetchActivites = async () => {
    try {
        const response = await fetch(`${API_URL}/activites`);
        return await response.json();
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
            body: JSON.stringify(activite),
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la création de l\'activité:', error);
        return null;
    }
};

export const updateActivite = async (activite) => {
    try {
        const response = await fetch(`${API_URL}/activites/${activite.idActivite}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(activite),
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'activité:', error);
        return null;
    }
};

export const deleteActivite = async (id) => {
    try {
        const response = await fetch(`${API_URL}/activites/${id}`, {
            method: 'DELETE',
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'activité:', error);
        return null;
    }
};
