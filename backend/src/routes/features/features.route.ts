import { Router } from "express";
import {
     individualGhostTransactionsHandler,
     individualOpportunityCostEngineHandler,
     individualPeerBenchmarkingHandler,
     individualSafeToSpendHandler,
} from "../../controllers/features/features.controller";
import { individualOpportunityCostValidator } from "../../middleware/validators/featuresValidator";
import { validate } from "../../middleware/validators/validate";

const router = Router();

router.get("/individual/safe-to-spend", individualSafeToSpendHandler);
router.get("/individual/ghost-transactions", individualGhostTransactionsHandler);
router.get(
     "/individual/opportunity-cost/:years",
     individualOpportunityCostValidator,
     validate,
     individualOpportunityCostEngineHandler,
);
router.get("/individual/peer-benchmarking", individualPeerBenchmarkingHandler);

export default router;
