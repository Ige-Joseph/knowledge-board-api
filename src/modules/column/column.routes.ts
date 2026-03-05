import { Router } from "express"
import columnController from "./column.controller"
import authMiddleware from "../../middlewares/auth.middleware"
import validate from "../../middlewares/validate.middleware"
import { createColumnSchema, updateColumnSchema } from "./column.validator"

const router = Router({ mergeParams: true })

router.use(authMiddleware)

router.post("/", validate(createColumnSchema), columnController.createColumn)
router.put("/:id", validate(updateColumnSchema), columnController.updateColumn)
router.delete("/:id", columnController.deleteColumn)

export default router