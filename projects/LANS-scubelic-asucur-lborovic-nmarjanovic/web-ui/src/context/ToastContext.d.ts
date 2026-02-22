import { ReactNode } from 'react';
export type ToastType = 'success' | 'error' | 'info';
export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}
interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}
export declare const useToast: () => ToastContextType;
export declare const ToastProvider: ({ children }: {
    children: ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export {};
