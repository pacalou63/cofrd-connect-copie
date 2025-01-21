import React from 'react';
import './modal.css';

export const Modal = ({ isOpen, onClose, onSubmit, newActivite, setNewActivite }) => {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(e); 
    };


    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Ajouter une Activité</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Libellé"
                        value={newActivite.libelleActivite}
                        onChange={(e) => setNewActivite({ ...newActivite, libelleActivite: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Description"
                        value={newActivite.description}
                        onChange={(e) => setNewActivite({ ...newActivite, description: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Lieu"
                        value={newActivite.lieu}
                        onChange={(e) => setNewActivite({ ...newActivite, lieu: e.target.value })}
                        required
                    />
                    <input
                        type="date"
                        value={newActivite.date}
                        onChange={(e) => setNewActivite({ ...newActivite, date: e.target.value })}
                        required
                    />
                    <div className="modal-buttons">
                        <button type="submit">Ajouter Activité</button>
                        <button type="button" onClick={onClose}>Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Modal;