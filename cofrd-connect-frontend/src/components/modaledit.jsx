import React from 'react';
import './modaledit.css';
export const ModalEdit = ({ isOpen, onClose, onSubmit, editingActivite, setEditingActivite }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Modifier l'activité</h2>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit(editingActivite);
                }}>
                    <div className="form-group">
                        <label>Libellé:</label>
                        <input
                            type="text"
                            value={editingActivite?.libelleActivite || ''}
                            onChange={(e) => setEditingActivite({
                                ...editingActivite,
                                libelleActivite: e.target.value
                            })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Description:</label>
                        <textarea
                            value={editingActivite?.description || ''}
                            onChange={(e) => setEditingActivite({
                                ...editingActivite,
                                description: e.target.value
                            })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Lieu:</label>
                        <input
                            type="text"
                            value={editingActivite?.lieu || ''}
                            onChange={(e) => setEditingActivite({
                                ...editingActivite,
                                lieu: e.target.value
                            })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Date:</label>
                        <input
                            type="date"
                            value={editingActivite?.date || ''}
                            onChange={(e) => setEditingActivite({
                                ...editingActivite,
                                date: e.target.value
                            })}
                        />
                    </div>
                    <div className="form-buttons">
                        <button type="submit">Enregistrer</button>
                        <button type="button" onClick={onClose}>Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalEdit;