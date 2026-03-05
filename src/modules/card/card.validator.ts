import { z } from "zod"

export const createCardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
})

export const updateCardSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
})

export const assignTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()).min(1, "At least one tag required"),
})

export type CreateCardInput = z.infer<typeof createCardSchema>
export type UpdateCardInput = z.infer<typeof updateCardSchema>
export type AssignTagsInput = z.infer<typeof assignTagsSchema>