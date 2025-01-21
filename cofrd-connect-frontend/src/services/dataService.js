const fs = require('fs');
const path = require('path');

// Chemin absolu vers le fichier mockData.json
const DATA_FILE_PATH = path.join(__dirname, '..', 'mockData.json');

// Lire les données
const readData = () => {
    try {
        if (!fs.existsSync(DATA_FILE_PATH)) {
            console.error('Le fichier n\'existe pas:', DATA_FILE_PATH);
            return null;
        }
        const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier:', error);
        return null;
    }
};

// Écrire les données
const writeData = (data) => {
    try {
        const dirPath = path.dirname(DATA_FILE_PATH);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 4), 'utf8');
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'écriture du fichier:', error);
        return false;
    }
};

// Ajouter une activité
const addActivite = (newActivite) => {
    try {
        const data = readData();
        if (!data) {
            console.error('Impossible de lire les données existantes');
            return false;
        }

        // S'assurer que data.activites existe
        if (!data.activites) {
            data.activites = [];
        }

        // Générer un nouvel ID unique
        const maxId = Math.max(...data.activites.map(a => a.idActivite), 0);
        newActivite.idActivite = maxId + 1;

        data.activites.push(newActivite);
        return writeData(data);
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'activité:', error);
        return false;
    }
};

// Mettre à jour une activité
const updateActivite = (updatedActivite) => {
    try {
        const data = readData();
        if (!data || !data.activites) {
            console.error('Données invalides');
            return false;
        }

        const index = data.activites.findIndex(act => act.idActivite === updatedActivite.idActivite);
        if (index === -1) {
            console.error('Activité non trouvée');
            return false;
        }

        data.activites[index] = updatedActivite;
        return writeData(data);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'activité:', error);
        return false;
    }
};

// Supprimer une activité
const deleteActivite = (idActivite) => {
    try {
        const data = readData();
        if (!data || !data.activites) {
            console.error('Données invalides');
            return false;
        }

        const initialLength = data.activites.length;
        data.activites = data.activites.filter(act => act.idActivite !== idActivite);

        if (data.activites.length === initialLength) {
            console.error('Activité non trouvée');
            return false;
        }

        return writeData(data);
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'activité:', error);
        return false;
    }
};

module.exports = {
    addActivite,
    updateActivite,
    deleteActivite,
    readData
};
