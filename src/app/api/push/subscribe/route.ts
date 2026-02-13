import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/push/subscribe
 * Saves a push subscription for the authenticated user.
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Get public user ID (users.id, not auth_id — Rule 6)
        const { data: userData } = await supabase
            .from("users")
            .select("id")
            .eq("auth_id", user.id)
            .single();

        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await request.json();
        const { subscription } = body;

        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
        }

        // Upsert subscription (unique on user_id + endpoint)
        const { error } = await supabase
            .from("push_subscriptions")
            .upsert(
                {
                    user_id: userData.id,
                    endpoint: subscription.endpoint,
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                    user_agent: request.headers.get("user-agent") || null,
                },
                {
                    onConflict: "user_id,endpoint",
                }
            );

        if (error) {
            console.error("[Push Subscribe] Error:", error);
            return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
        }

        return NextResponse.json({ message: "Subscribed successfully" });
    } catch (error) {
        console.error("[Push Subscribe] Unexpected error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * DELETE /api/push/subscribe
 * Removes a push subscription for the authenticated user.
 */
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Get public user ID
        const { data: userData } = await supabase
            .from("users")
            .select("id")
            .eq("auth_id", user.id)
            .single();

        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await request.json();
        const { endpoint } = body;

        if (!endpoint) {
            return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
        }

        const { error } = await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", userData.id)
            .eq("endpoint", endpoint);

        if (error) {
            console.error("[Push Unsubscribe] Error:", error);
            return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
        }

        return NextResponse.json({ message: "Unsubscribed successfully" });
    } catch (error) {
        console.error("[Push Unsubscribe] Unexpected error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
