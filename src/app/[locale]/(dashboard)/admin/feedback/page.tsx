import { createClient } from "@/lib/supabase/server";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { ContentLayout } from "@/components/layout/content-layout";

export default async function AdminFeedbackPage() {
    const supabase = await createClient();

    const { data: feedback, error } = await supabase
        .from('feedback')
        .select(`
            id,
            message,
            created_at,
            metadata,
            users (
                id,
                email,
                full_name,
                avatar_url
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching feedback:", error);
        return <div className="p-8 text-red-500">Error loading feedback: {error.message}</div>;
    }

    return (
        <PageWrapper type="page" title="Feedback">
            <ContentLayout variant="wide">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Inbox</CardTitle>
                                    <CardDescription>
                                        {feedback?.length || 0} messages received
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[250px]">User</TableHead>
                                        <TableHead>Message</TableHead>
                                        <TableHead className="w-[150px] text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!feedback || feedback.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                No feedback found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        feedback.map((item: any) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={item.users?.avatar_url} />
                                                            <AvatarFallback>
                                                                {item.users?.full_name?.substring(0, 2).toUpperCase() || "U"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm">
                                                                {item.users?.full_name || "Unknown"}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {item.users?.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[500px]">
                                                    <div className="whitespace-pre-wrap text-sm">
                                                        {item.message}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                    <div className="text-[10px] opacity-70">
                                                        {new Date(item.created_at).toLocaleTimeString()}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </ContentLayout>
        </PageWrapper>
    );
}
