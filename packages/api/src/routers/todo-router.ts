import { z } from "zod";
import { protectedProcedure } from "../index";
import prisma from "@orpc-better-t-stack/db";

const createTodoSchema = z.object({
	title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
});

const todoIdSchema = z.object({
	id: z.string().min(1, "Todo ID is required"),
});

export const todoRouter = {
	getTodos: protectedProcedure.handler(async ({ context }) => {
		const todos = await prisma.todo.findMany({
			where: {
				userId: context.session.user.id,
			},
			orderBy: {
				createdAt: "desc",
			},
		});
		return todos;
	}),

	createTodo: protectedProcedure
		.input(createTodoSchema)
		.handler(async ({ context, input }) => {
			const todo = await prisma.todo.create({
				data: {
					title: input.title,
					userId: context.session.user.id,
				},
			});
			return todo;
		}),

	toggleTodo: protectedProcedure
		.input(todoIdSchema)
		.handler(async ({ context, input }) => {
			const existingTodo = await prisma.todo.findUnique({
				where: {
					id: input.id,
				},
			});

			if (!existingTodo) {
				throw new Error("Todo not found");
			}

			if (existingTodo.userId !== context.session.user.id) {
				throw new Error("Unauthorized");
			}

			const todo = await prisma.todo.update({
				where: {
					id: input.id,
				},
				data: {
					completed: !existingTodo.completed,
				},
			});
			return todo;
		}),

	deleteTodo: protectedProcedure
		.input(todoIdSchema)
		.handler(async ({ context, input }) => {
			const existingTodo = await prisma.todo.findUnique({
				where: {
					id: input.id,
				},
			});

			if (!existingTodo) {
				throw new Error("Todo not found");
			}

			if (existingTodo.userId !== context.session.user.id) {
				throw new Error("Unauthorized");
			}

			await prisma.todo.delete({
				where: {
					id: input.id,
				},
			});

			return { success: true };
		}),
};

