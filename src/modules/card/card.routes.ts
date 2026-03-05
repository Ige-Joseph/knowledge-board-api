import { Router } from "express"
import cardController from "./card.controller"
import authMiddleware from "../../middlewares/auth.middleware"
import validate from "../../middlewares/validate.middleware"
import { createCardSchema, updateCardSchema, assignTagsSchema } from "./card.validator"

const router = Router({ mergeParams: true })

router.use(authMiddleware)

router.post("/", validate(createCardSchema), cardController.createCard)
router.get("/", cardController.getCardsByColumn)
router.put("/:id", validate(updateCardSchema), cardController.updateCard)
router.delete("/:id", cardController.deleteCard)
router.post("/:id/tags", validate(assignTagsSchema), cardController.assignTags)

export default router