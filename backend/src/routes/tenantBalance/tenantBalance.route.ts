import { Router } from "express";
import { validate } from "../../middleware/validators/validate";
import { upsertBalanceValidator } from "../../middleware/validators/balanceValidator";
import {
     getLatestBalanceHandler,
     upsertBalanceHandler,
} from "../../controllers/tenantBalance/tenantBalance.controller";

const router = Router();

router.get("/", getLatestBalanceHandler);
router.post("/upsert", upsertBalanceValidator, validate, upsertBalanceHandler);

export default router;
