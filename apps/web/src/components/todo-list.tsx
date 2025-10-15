"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client, orpc } from "@/utils/orpc";
import { Card, CardContent } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Todo {
	id: string;
	title: string;
	completed: boolean;
	userId: string;
	createdAt: Date;
	updatedAt: Date;
}

interface TodoListProps {
	todos: Todo[];
}

export function TodoList({ todos }: TodoListProps) {
	const queryClient = useQueryClient();

	const getTodosQueryKey = orpc.todos.getTodos.queryOptions().queryKey;

	const toggleMutation = useMutation({
		mutationFn: async (id: string) => {
			return await client.todos.toggleTodo({ id });
		},
		onMutate: async (todoId) => {
			await queryClient.cancelQueries({ queryKey: getTodosQueryKey });

			const previousTodos = queryClient.getQueryData(getTodosQueryKey);

			queryClient.setQueryData(getTodosQueryKey, (old: any) => {
				if (!old) return old;
				return old.map((todo: Todo) =>
					todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
				);
			});

			return { previousTodos };
		},
		onError: (error, _variables, context) => {
			if (context?.previousTodos) {
				queryClient.setQueryData(getTodosQueryKey, context.previousTodos);
			}
			toast.error(error.message || "Failed to toggle todo");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: getTodosQueryKey });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			return await client.todos.deleteTodo({ id });
		},
		onMutate: async (todoId) => {
			await queryClient.cancelQueries({ queryKey: getTodosQueryKey });

			const previousTodos = queryClient.getQueryData(getTodosQueryKey);

			queryClient.setQueryData(getTodosQueryKey, (old: any) => {
				if (!old) return old;
				return old.filter((todo: Todo) => todo.id !== todoId);
			});

			return { previousTodos };
		},
		onError: (error, _variables, context) => {
			if (context?.previousTodos) {
				queryClient.setQueryData(getTodosQueryKey, context.previousTodos);
			}
			toast.error(error.message || "Failed to delete todo");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: getTodosQueryKey });
		},
	});

	if (todos.length === 0) {
		return (
			<Card>
				<CardContent className="py-8 text-center text-muted-foreground">
					No todos yet. Create one to get started!
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-2">
			{todos.map((todo) => (
				<Card key={todo.id}>
					<CardContent className="flex items-center gap-3 p-4">
						<Checkbox
							checked={todo.completed}
							onCheckedChange={() => toggleMutation.mutate(todo.id)}
							disabled={toggleMutation.isPending || deleteMutation.isPending}
						/>
						<span
							className={`flex-1 ${todo.completed ? "text-muted-foreground line-through" : ""}`}
						>
							{todo.title}
						</span>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => deleteMutation.mutate(todo.id)}
							disabled={toggleMutation.isPending || deleteMutation.isPending}
						>
							<Trash2 className="h-4 w-4 text-destructive" />
						</Button>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

