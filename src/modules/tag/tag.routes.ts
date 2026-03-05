import { Router } from "express"
import tagController from "./tag.controller"
import authMiddleware from "../../middlewares/auth.middleware"
import validate from "../../middlewares/validate.middleware"
import { createTagSchema } from "./tag.validator"

const router = Router()

router.use(authMiddleware)

router.post("/", validate(createTagSchema), tagController.createTag)
router.get("/", tagController.getAllTags)

export default router