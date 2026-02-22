interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    theme: string;
    variant?: 'danger' | 'warning' | 'info';
}
export declare function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmLabel, cancelLabel, theme, variant }: ConfirmationModalProps): import("react/jsx-runtime").JSX.Element;
export {};
