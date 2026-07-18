"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { Todo } from "@prisma/client";
import { useDebounceValue } from "usehooks-ts";

function DashboardPage() {
    const { user } = useUser();
    const [todos, setTodos] = useState<Todo[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [debouncedSearchTerm] = useDebounceValue(searchTerm, 300);
    const [loading, setLoading] = useState<boolean>(false);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

    const fetchTodos = useCallback(async (page: number) => {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/todos?page=${page}&search=${encodeURIComponent(debouncedSearchTerm)}`
            );
            if (!response.ok) {
                throw new Error("Failed to fetch todos");
            }
            const data = await response.json();
            setTodos(data.todos);
            setTotalPages(data.totalPages);
            setCurrentPage(data.currentPage);
        } catch (error) {
            console.error("Error fetching todos:", error);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm]);

    const fetchSubscriptionStatus = useCallback(async () => {
        try {
            const response = await fetch("/api/subscription");
            if (!response.ok) {
                throw new Error("Failed to fetch subscription status");
            }
            const data = await response.json();
            setIsSubscribed(data.isSubscribed);
        } catch (error) {
            console.error("Error fetching subscription status:", error);
        }
    }, []);

    const handleAddTodo = async (title: string) => {
        if (!isSubscribed && todos.length >= 3) {
            alert("You have reached the limit of 3 todos. Please subscribe to add more.");
            return;
        }
        try {
            const response = await fetch("/api/todos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title }),
            });
            if (!response.ok) {
                throw new Error("Failed to add todo");
            }
            await fetchTodos(currentPage); // Refresh the todos list after adding a new todo
        } catch (error) {
            console.error("Error adding todo:", error);
        }
    };

    const handleUpdateTodo = async (id: string, completed: boolean) => {
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ completed }),
            });
            if (!response.ok) {
                throw new Error("Failed to update todo");
            }
            await fetchTodos(currentPage); // Refresh the todos list after updating a todo
        } catch (error) {
            console.error("Error updating todo:", error);
        }
    };

    const handleDeleteTodo = async (id: string) => {
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                throw new Error("Failed to delete todo");
            }
            await fetchTodos(currentPage); // Refresh the todos list after deleting a todo
        } catch (error) {
            console.error("Error deleting todo:", error);
        }
    };

    useEffect(() => {
        fetchSubscriptionStatus();
    }, [fetchSubscriptionStatus]);

    useEffect(() => {
        fetchTodos(currentPage);
    }, [fetchTodos, currentPage]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-4xl font-bold mb-4">Welcome, {user?.firstName}!</h1>
            <p className="text-lg mb-8">This is your dashboard.</p>
            <input
                type="text"
                placeholder="Search todos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded px-4 py-2 mb-4"
            />
            {loading ? (
                <p>Loading...</p>
            ) : (
                <ul className="list-disc pl-5">
                    {todos.map((todo) => (
                        <li key={todo.id} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={(e) => handleUpdateTodo(todo.id, e.target.checked)}
                            />
                            <span>{todo.title}</span>
                            <button
                                onClick={() => handleDeleteTodo(todo.id)}
                                className="text-red-500 text-sm"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <div className="flex gap-2 mt-4">
                <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                >
                    Previous
                </button>
                <span>
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default DashboardPage;