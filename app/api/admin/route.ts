import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";


async function isAdminUser(userId: string) {
   const client = await clerkClient();
   const user = await client.users.getUser(userId);
   return user.publicMetadata?.role === "admin";
}


   