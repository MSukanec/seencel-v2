import { MembersRouteTabs } from "./members-route-tabs";

export default function MembersLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-full flex flex-col">
            <MembersRouteTabs />
            {children}
        </div>
    );
}
