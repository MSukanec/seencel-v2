import { redirect } from "next/navigation";

// Team page has been merged into Organization Settings
// Redirect to /organization/settings/members
export default function TeamPage() {
    redirect("/organization/settings/members");
}
