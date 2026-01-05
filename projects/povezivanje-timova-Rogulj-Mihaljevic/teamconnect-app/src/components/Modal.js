import React from 'react';
import './Modal.css';

function Modal({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onClose}>
            {cancelText || 'Odustani'}
          </button>
          <button className="btn btn-confirm" onClick={onConfirm}>
            {confirmText || 'Potvrdi'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;