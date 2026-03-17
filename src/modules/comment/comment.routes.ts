import { Router } from "express"
import commentController from "./comment.controller"
import authMiddleware from "../../middlewares/auth.middleware"
import validate from "../../middlewares/validate.middleware"
import { createCommentSchema, updateCommentSchema } from "./comment.validator"

const router = Router({ mergeParams: true })

router.use(authMiddleware)

router.post("/", validate(createCommentSchema), commentController.createComment)
router.get("/", commentController.getCommentsByCard)
router.put("/:id", validate(updateCommentSchema), commentController.updateComment)
router.delete("/:id", commentController.deleteComment)
router.post("/:commentId/replies", validate(createCommentSchema), commentController.createReply)

export default router