import { Router } from "express"
import boardController from "./board.controller"
import authMiddleware from "../../middlewares/auth.middleware"
import validate from "../../middlewares/validate.middleware"
import { createBoardSchema, updateBoardSchema } from "./board.validator"

const router = Router()

router.use(authMiddleware)

router.post("/", validate(createBoardSchema), boardController.createBoard)
router.get("/", boardController.getUserBoards)
router.put("/:id", validate(updateBoardSchema), boardController.updateBoard)
router.delete("/:id", boardController.deleteBoard)

export default router