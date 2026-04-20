import { Router } from "express";
import { validate } from "../../middleware/validators/validate";
import { signupValidator } from "../../middleware/validators/signupValidator";
import { loginValidator } from "../../middleware/validators/loginValidator";
import { signupHandler, loginHandler } from "../../controllers/auth/auth.controller";

const router = Router();

router.post("/signup", signupValidator, validate, signupHandler);
router.post("/login", loginValidator, validate, loginHandler);

export default router;
