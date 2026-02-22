interface StatsBarProps {
    label: string;
    value: number;
    total: number;
    colorClass?: string;
    theme?: string;
    suffix?: string;
}
export declare function StatsBar({ label, value, total, colorClass, theme, suffix }: StatsBarProps): import("react/jsx-runtime").JSX.Element;
export {};
