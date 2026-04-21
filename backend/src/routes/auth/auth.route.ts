import { Router } from "express";
import { validate } from "../../middleware/validators/validate";
import { signupValidator } from "../../middleware/validators/signupValidator";
import { loginValidator } from "../../middleware/validators/loginValidator";
import { authMiddleware } from "../../middleware/auth/authMiddleware";
import {
     signupHandler,
     loginHandler,
     refreshHandler,
     logoutHandler,
     meHandler,
} from "../../controllers/auth/auth.controller";

const router = Router();

router.post("/signup", signupValidator, validate, signupHandler);
router.post("/login", loginValidator, validate, loginHandler);
router.post("/refresh", validate, refreshHandler);
router.post("/logout", validate, logoutHandler);
router.get("/me", authMiddleware, meHandler);

export default router;
