"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client, orpc } from "@/utils/orpc";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";

export function CreateTodoForm() {
	const [title, setTitle] = useState("");
	const queryClient = useQueryClient();

	const getTodosQueryKey = orpc.todos.getTodos.queryOptions().queryKey;

	const createMutation = useMutation({
		mutationFn: async (title: string) => {
			return await client.todos.createTodo({ title });
		},
		onMutate: async (newTitle) => {
			await queryClient.cancelQueries({ queryKey: getTodosQueryKey });

			const previousTodos = queryClient.getQueryData(getTodosQueryKey);

			queryClient.setQueryData(getTodosQueryKey, (old: any) => {
				const tempTodo = {
					id: `temp-${Date.now()}`,
					title: newTitle,
					completed: false,
					userId: "",
					createdAt: new Date(),
					updatedAt: new Date(),
				};
				return old ? [tempTodo, ...old] : [tempTodo];
			});

			return { previousTodos };
		},
		onError: (error, _variables, context) => {
			if (context?.previousTodos) {
				queryClient.setQueryData(getTodosQueryKey, context.previousTodos);
			}
			toast.error(error.message || "Failed to create todo");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: getTodosQueryKey });
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim()) return;

		createMutation.mutate(title);
		setTitle("");
	};

	return (
		<form onSubmit={handleSubmit} className="flex gap-2">
			<Input
				type="text"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				placeholder="Add a new todo..."
				className="flex-1"
				maxLength={200}
			/>
			<Button type="submit" disabled={!title.trim() || createMutation.isPending}>
				Add
			</Button>
		</form>
	);
}

