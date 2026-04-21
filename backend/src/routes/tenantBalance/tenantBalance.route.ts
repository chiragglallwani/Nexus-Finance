import { type Request, type Response, Router } from "express";
import { validate } from "../../middleware/validators/validate";
import { upsertBalanceValidator } from "../../middleware/validators/balanceValidator";
import {
     getLatestBalanceHandler,
     upsertBalanceHandler,
} from "../../controllers/tenantBalance/tenantBalance.controller";

const router = Router();

router.get("/", (req: Request, res: Response) => getLatestBalanceHandler(req, res));
router.post("/upsert", upsertBalanceValidator, validate, (req: Request, res: Response) =>
     upsertBalanceHandler(req, res),
);

export default router;
