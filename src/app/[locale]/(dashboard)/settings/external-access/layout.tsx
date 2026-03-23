import { ExternalAccessRouteTabs } from "./external-access-route-tabs";

export default function ExternalAccessLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-full flex flex-col">
            <ExternalAccessRouteTabs />
            {children}
        </div>
    );
}
