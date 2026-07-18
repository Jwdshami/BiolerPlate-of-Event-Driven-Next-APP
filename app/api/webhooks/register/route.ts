import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        return new Response("Webhook secret is not defined", { status: 500 });
    }

    const headersPayload = await headers();

    const svix_id = headersPayload.get("svix-id");
    const svix_timestamp = headersPayload.get("svix-timestamp");
    const svix_signature = headersPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Missing required headers", { status: 400 });
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const webhook = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    try {
        evt = webhook.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error("Error verifying webhook:", err);
        return new Response("Invalid signature", { status: 400 });
    }

    if (evt.type === "user.created") {
        try {
            const { email_addresses, primary_email_address_id } = evt.data;
            const email = email_addresses.find(
                (ea) => ea.id === primary_email_address_id
            )?.email_address;

            if (!email) {
                return new Response("Email not found in event data", { status: 400 });
            }

            const newUser = await prisma.user.create({
                data: {
                    clerkId: evt.data.id, // confirm this matches your schema
                    email: email,
                    isSubscribed: false,
                },
            });

            console.log("New user created in database:", newUser);
        } catch (err) {
            console.error("Error creating user in database:", err);
            return new Response("Error creating user", { status: 500 });
        }
    }

    return new Response("Webhook received", { status: 200 });
}