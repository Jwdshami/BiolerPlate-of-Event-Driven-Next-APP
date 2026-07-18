import {NextRequest, NextResponse} from "next/server";
import prisma from "@/lib/prisma";
import {auth} from "@clerk/nextjs/server";




export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if(!user){
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const subscriptonEnd = new Date();
    subscriptonEnd.setMonth(subscriptonEnd.getMonth() + 1);

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isSubscribed: true,
        subscriptionEnd: subscriptonEnd,
      },
    });

    return NextResponse.json({updatedUser, message: "User subscription updated successfully", status: 200});
  } catch (error) {
    console.error("Error updating user subscription:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }


}

export async function GET() {

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user  = await prisma.user.findUnique({
    where: {id:userId},
     select: {
        isSubscribed: true,
        subscriptionEnd: true,
      } 

    }

);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }


const subscriptionEnd = new Date();

  if (user.subscriptionEnd && user.subscriptionEnd < subscriptionEnd) {
    await prisma.user.update({
      where: {id:userId},
      data: {
        isSubscribed: false,
        subscriptionEnd: null,
      },
    });
    return NextResponse.json({ message: "Subscription expired", isSubscribed: false }, { status: 200 });
  }

  return NextResponse.json({ isSubscribed: user.isSubscribed, subscriptionEnd: user.subscriptionEnd }, { status: 200 });

    } catch (error) {   
        console.error("Error fetching user subscription:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });


    }
 
}