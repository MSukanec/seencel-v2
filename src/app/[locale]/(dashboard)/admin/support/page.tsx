import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, HelpCircle, MessageSquareText } from "lucide-react";
import { PageWrapper, ContentLayout } from "@/components/layout";
import { setRequestLocale } from 'next-intl/server';
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SupportInboxView } from "@/features/admin/support/components/support-inbox-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function SupportPage({ params }: PageProps) {
    const { locale } = await params;
    setRequestLocale(locale);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth/login');
    // Fetch feedback data
    const { data: feedback } = await supabase
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

    return (
        <Tabs defaultValue="tickets" className="w-full h-full flex flex-col">
            <PageWrapper
                type="page"
                title="Soporte"
                icon={<MessageCircle />}
                tabs={
                    <TabsList className="bg-transparent p-0 gap-6 flex items-start justify-start">
                        <TabsTrigger
                            value="tickets"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                <span>Mensajes</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="feedback"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <MessageSquareText className="h-4 w-4" />
                                <span>Feedback</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="faq"
                            className="relative h-8 pb-2 rounded-none border-b-2 border-transparent bg-transparent px-0 font-medium text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none hover:text-foreground"
                        >
                            <div className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4" />
                                <span>FAQ</span>
                            </div>
                        </TabsTrigger>
                    </TabsList>
                }
            >
                {/* Tab: Mensajes de soporte */}
                <TabsContent value="tickets" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <SupportInboxView />
                    </ContentLayout>
                </TabsContent>

                {/* Tab: Feedback */}
                <TabsContent value="feedback" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Feedback</CardTitle>
                                        <CardDescription>
                                            {feedback?.length || 0} mensajes recibidos
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[250px]">Usuario</TableHead>
                                            <TableHead>Mensaje</TableHead>
                                            <TableHead className="w-[150px] text-right">Fecha</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!feedback || feedback.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="h-24 text-center">
                                                    No se encontró feedback.
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
                                                                    {item.users?.full_name || "Desconocido"}
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
                    </ContentLayout>
                </TabsContent>

                {/* Tab: FAQ */}
                <TabsContent value="faq" className="m-0 h-full focus-visible:outline-none">
                    <ContentLayout variant="wide">
                        <div className="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-lg">
                            <div className="text-center text-muted-foreground">
                                <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p className="text-lg font-medium">Preguntas Frecuentes</p>
                                <p className="text-sm">Gestiona las FAQ y centro de ayuda</p>
                            </div>
                        </div>
                    </ContentLayout>
                </TabsContent>
            </PageWrapper>
        </Tabs>
    );
}
