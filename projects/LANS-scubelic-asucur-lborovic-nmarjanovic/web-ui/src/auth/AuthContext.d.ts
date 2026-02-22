import { ReactNode } from 'react';
interface User {
    id: number;
    username: string;
    email: string;
    created_at: string;
    is_active: boolean;
}
interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
}
export declare function useAuth(): AuthContextType;
interface AuthProviderProps {
    children: ReactNode;
}
export declare function AuthProvider({ children }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
