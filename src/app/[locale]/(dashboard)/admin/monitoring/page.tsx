import { redirect } from "next/navigation";

// All monitoring views have been moved to /admin/system (Plataforma)
export default function MonitoringPage() {
    redirect("/admin/system");
}
