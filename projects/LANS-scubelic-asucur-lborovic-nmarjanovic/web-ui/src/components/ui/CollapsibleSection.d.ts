import { ReactNode } from 'react';
interface CollapsibleSectionProps {
    title: string;
    icon: ReactNode;
    children: ReactNode;
    theme: string;
    isComplete?: boolean;
    defaultOpen?: boolean;
    isOpen?: boolean;
    onToggle?: () => void;
    className?: string;
}
export declare function CollapsibleSection({ title, icon, children, theme, isComplete, defaultOpen, isOpen: propsIsOpen, onToggle, className }: CollapsibleSectionProps): import("react/jsx-runtime").JSX.Element;
export {};
