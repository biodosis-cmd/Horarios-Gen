import React, { createContext, useContext, useState, useCallback } from 'react';
const ModalContext = createContext();
export const useModal = () => useContext(ModalContext);
export const ModalProvider = ({ children }) => {
    const [activeModal, setActiveModal] = useState(null);
    const openModal = useCallback((type, props = {}) => setActiveModal({ type, props }), []);
    const closeModal = useCallback(() => setActiveModal(null), []);
    return (
        <ModalContext.Provider value={{ activeModal, openModal, closeModal }}>
            {children}
        </ModalContext.Provider>
    );
};
