import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  
  try {
    if (eventType === 'session.created') {
      const { id, user_id, last_active_at } = evt.data;
      
      // Record login activity
      await prismadb.userActivity.create({
        data: {
          userId: user_id,
          activity: 'login',
          metadata: JSON.stringify({
            sessionId: id,
            lastActiveAt: last_active_at
          })
        }
      });
    } else if (eventType === 'session.ended' || eventType === 'session.revoked') {
      const { id, user_id } = evt.data;
      
      // Record logout activity
      await prismadb.userActivity.create({
        data: {
          userId: user_id,
          activity: 'logout',
          metadata: JSON.stringify({
            sessionId: id
          })
        }
      });
    } else if (eventType === 'user.created') {
      const { id, first_name, last_name, email_addresses } = evt.data;
      
      // Create user in our database if they don't exist
      const existingUser = await prismadb.user.findUnique({
        where: { clerkUserId: id }
      });
      
      if (!existingUser) {
        await prismadb.user.create({
          data: {
            clerkUserId: id,
            firstName: first_name,
            lastName: last_name,
            email: email_addresses[0]?.email_address,
            isAdmin: false
          }
        });
      }
    }
    
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response('Error processing webhook', { status: 500 });
  }

  return new Response('Webhook processed', { status: 200 });
}