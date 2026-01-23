import { createClient } from "@/lib/supabase/server";

export interface UserNotification {
    id: string;
    user_id: string;
    notification_id: string;
    delivered_at: string;
    read_at: string | null;
    clicked_at: string | null;
    notification: {
        id: string;
        type: string;
        title: string;
        body: string | null;
        data: Record<string, unknown> | null;
        created_at: string;
    };
}

export async function getUserNotifications(): Promise<{ notifications: UserNotification[] }> {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { notifications: [] };

    // Get public user ID
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!userData) return { notifications: [] };

    // Get user notifications with notification details
    const { data: userNotifications, error } = await supabase
        .from('user_notifications')
        .select(`
            id,
            user_id,
            notification_id,
            delivered_at,
            read_at,
            clicked_at,
            notification:notifications (
                id,
                type,
                title,
                body,
                data,
                created_at
            )
        `)
        .eq('user_id', userData.id)
        .order('delivered_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error("Error fetching user notifications:", error);
        return { notifications: [] };
    }

    return { notifications: (userNotifications || []) as unknown as UserNotification[] };
}

export async function getUnreadNotificationsCount(): Promise<number> {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    // Get public user ID
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

    if (!userData) return 0;

    const { count, error } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.id)
        .is('read_at', null);

    if (error) {
        console.error("Error counting unread notifications:", error);
        return 0;
    }

    return count || 0;
}

