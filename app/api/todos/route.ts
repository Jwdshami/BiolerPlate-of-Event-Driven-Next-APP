import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const itemPerPage = 10;

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
     
    },
     include: { todos: true },
  });

  console.log("User:", user);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.isSubscribed && user.todos.length >= 3) {
    return NextResponse.json(
      {
        error:
          "You have reached the limit of 3 todos. Please subscribe to add more.",
      },
      { status: 403 },
    );
  }
  const { title } = await req.json();
  const newTodo = await prisma.todo.create({
    data: {
      title,
      userId: userId,
    },
  });

  return NextResponse.json({
    newTodo,
    message: "Todo created successfully",
    status: 201,
  });
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";

  try {
    const todos = await prisma.todo.findMany({
      where: {
        userId: userId,
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * itemPerPage,
      take: itemPerPage,
    });

    const totalCount = await prisma.todo.count({
      where: {
        userId: userId,
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
    });

    const totalPages = Math.ceil(totalCount / itemPerPage);

    return NextResponse.json(
      { todos, totalCount, totalPages, currentPage: page },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching todos:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
