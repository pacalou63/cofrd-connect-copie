const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs');
const path = require('path');

app.use(cors());
app.use(express.json());

// Charger les données mock
const mockDataPath = path.join(__dirname, '../cofrd-connect-frontend/src/mockData.json');
const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

// Route pour récupérer toutes les activités
app.get('/api/activites', (req, res) => {
    res.json(mockData.activites);
});

// Route pour créer une activité
app.post('/api/activites', (req, res) => {
    const newActivite = req.body;
    newActivite.idActivite = mockData.activites.length + 1;
    mockData.activites.push(newActivite);
    res.json(newActivite);
});

app.put('/api/activites/:id', (req, res) => {
    console.log('PUT request received');
    console.log('ID:', req.params.id);
    console.log('Body:', req.body);
    
    const id = parseInt(req.params.id);
    const updatedActivite = req.body;
    
    const index = mockData.activites.findIndex(a => a.idActivite === id);
    if (index === -1) {
        return res.status(404).json({ message: 'Activité non trouvée' });
    }
    
    mockData.activites[index] = { 
        ...mockData.activites[index], 
        ...updatedActivite,
        idActivite: id  
    };
    
    // Optionnel : sauvegarder les modifications dans le fichier
    fs.writeFileSync(mockDataPath, JSON.stringify(mockData, null, 2));
    
    res.json(mockData.activites[index]);
});

app.listen(3001, () => {
    console.log('Serveur démarré sur le port 3001');
});