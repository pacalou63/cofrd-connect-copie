const express = require('express');
const cors = require('cors');
const { addActivite, updateActivite, deleteActivite, readData } = require('./cofrd-connect-frontend/src/services/dataService');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Middleware pour logger les requêtes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Middleware pour gérer les erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(500).json({ error: 'Une erreur est survenue sur le serveur' });
});

// Lire toutes les activités
app.get('/api/activites', (req, res) => {
    try {
        const data = readData();
        if (!data) {
            return res.status(500).json({ error: 'Erreur lors de la lecture des données' });
        }
        console.log('Activités récupérées:', data.activites);
        res.json(data.activites);
    } catch (error) {
        console.error('Erreur lors de la récupération des activités:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des activités' });
    }
});

// Ajouter une activité
app.post('/api/activites', (req, res) => {
    try {
        const newActivite = req.body;
        console.log('Tentative d\'ajout d\'activité:', newActivite);
        
        if (!newActivite.libelleActivite || !newActivite.description || !newActivite.lieu || !newActivite.date) {
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }

        if (addActivite(newActivite)) {
            console.log('Activité ajoutée avec succès:', newActivite);
            res.json(newActivite);
        } else {
            console.error('Échec de l\'ajout de l\'activité');
            res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'activité' });
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'activité:', error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'activité' });
    }
});

// Mettre à jour une activité
app.put('/api/activites/:id', (req, res) => {
    try {
        const updatedActivite = req.body;
        console.log('Tentative de mise à jour d\'activité:', updatedActivite);

        if (!updatedActivite.libelleActivite || !updatedActivite.description || !updatedActivite.lieu || !updatedActivite.date) {
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }

        if (updateActivite(updatedActivite)) {
            console.log('Activité mise à jour avec succès:', updatedActivite);
            res.json(updatedActivite);
        } else {
            console.error('Échec de la mise à jour de l\'activité');
            res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'activité' });
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'activité:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'activité' });
    }
});

// Supprimer une activité
app.delete('/api/activites/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        console.log('Tentative de suppression de l\'activité:', id);

        if (deleteActivite(id)) {
            console.log('Activité supprimée avec succès:', id);
            res.json({ success: true });
        } else {
            console.error('Échec de la suppression de l\'activité');
            res.status(500).json({ error: 'Erreur lors de la suppression de l\'activité' });
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'activité:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'activité' });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
    console.log('Chemin vers le fichier de données:', require('path').resolve('./cofrd-connect-frontend/src/mockData.json'));
});
