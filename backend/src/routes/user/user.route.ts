import { Router } from "express";
import {
     getTenantNameHandler,
     getUserNameHandler,
     updateTenantNameHandler,
     updateUserNameHandler,
} from "../../controllers/users/users.controller";
import { validate } from "../../middleware/validators/validate";
import { updateNameValidator } from "../../middleware/validators/userValidator";

const router = Router();

router.get("/name", getUserNameHandler);
router.patch("/name", updateNameValidator, validate, updateUserNameHandler);
router.get("/tenant/name", getTenantNameHandler);
router.patch("/tenant/name", updateNameValidator, validate, updateTenantNameHandler);

export default router;
