"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { CreateTodoForm } from "@/components/create-todo-form";
import { TodoList } from "@/components/todo-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function TodosContent() {
	const { data: todos, isLoading, error } = useQuery(orpc.todos.getTodos.queryOptions());

	if (error) {
		return (
			<Card>
				<CardContent className="py-8 text-center text-destructive">
					Error loading todos: {error.message}
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<CreateTodoForm />

			{isLoading ? (
				<div className="space-y-2">
					{[...Array(3)].map((_, i) => (
						<Card key={i}>
							<CardContent className="flex items-center gap-3 p-4">
								<Skeleton className="h-4 w-4 rounded" />
								<Skeleton className="h-4 flex-1" />
								<Skeleton className="h-8 w-8 rounded" />
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<TodoList todos={todos || []} />
			)}
		</div>
	);
}

