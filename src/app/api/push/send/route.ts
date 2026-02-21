import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

let vapidConfigured = false;

function ensureVapidConfigured() {
    if (vapidConfigured) return true;

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
        console.error("[Push] VAPID keys not configured");
        return false;
    }

    webpush.setVapidDetails(
        "mailto:soporte@seencel.com",
        publicKey,
        privateKey
    );
    vapidConfigured = true;
    return true;
}

/**
 * POST /api/push/send
 * Called by Supabase trigger (pg_net) when a new user_notification is created.
 * Sends Web Push to all subscribed devices of the target user.
 */
export async function POST(request: NextRequest) {
    try {
        // Validate API secret
        const authHeader = request.headers.get("Authorization");
        const apiSecret = process.env.PUSH_API_SECRET;
        if (!authHeader || !apiSecret || authHeader !== `Bearer ${apiSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Lazy VAPID config
        if (!ensureVapidConfigured()) {
            return NextResponse.json({ error: "VAPID not configured" }, { status: 500 });
        }

        const body = await request.json();
        const { user_id, title, body: notifBody, data } = body;

        if (!user_id || !title) {
            return NextResponse.json({ error: "Missing user_id or title" }, { status: 400 });
        }

        // Use service role to bypass RLS and read subscriptions for target user
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get all push subscriptions for this user
        const { data: subscriptions, error } = await supabase
            .schema('notifications').from("push_subscriptions")
            .select("id, endpoint, p256dh, auth")
            .eq("user_id", user_id);

        if (error) {
            console.error("[Push] Error fetching subscriptions:", error);
            return NextResponse.json({ error: "DB error" }, { status: 500 });
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ message: "No subscriptions found" }, { status: 200 });
        }

        // Build push payload
        const payload = JSON.stringify({
            title,
            body: notifBody || "",
            data: data || {},
            tag: `seencel-${Date.now()}`,
        });

        // Send to all subscriptions
        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh,
                                auth: sub.auth,
                            },
                        },
                        payload
                    );
                    return { id: sub.id, success: true };
                } catch (err: any) {
                    // If subscription is expired/invalid (410 Gone or 404), remove it
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await supabase
                            .schema('notifications').from("push_subscriptions")
                            .delete()
                            .eq("id", sub.id);
                        console.log(`[Push] Removed expired subscription ${sub.id}`);
                    } else {
                        console.error(`[Push] Error sending to ${sub.id}:`, err.statusCode, err.body);
                    }
                    return { id: sub.id, success: false, error: err.statusCode };
                }
            })
        );

        const sent = results.filter(
            (r) => r.status === "fulfilled" && (r.value as any).success
        ).length;

        return NextResponse.json({
            message: `Sent ${sent}/${subscriptions.length} push notifications`,
        });
    } catch (error) {
        console.error("[Push] Unexpected error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
