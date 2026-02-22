interface TagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    className?: string;
    theme?: string;
}
export declare function TagInput({ tags, onChange, placeholder, className, theme }: TagInputProps): import("react/jsx-runtime").JSX.Element;
export {};
