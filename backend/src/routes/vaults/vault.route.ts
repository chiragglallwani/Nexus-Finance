import { type Request, type Response, Router } from "express";
import { validate } from "../../middleware/validators/validate";
import {
     createVaultValidator,
     deleteVaultValidator,
} from "../../middleware/validators/vaultValidator";
import {
     createVaultHandler,
     listVaultsHandler,
     deleteVaultHandler,
} from "../../controllers/vaults/vault.controller";

const router = Router();

router.post("/create", createVaultValidator, validate, (req: Request, res: Response) =>
     createVaultHandler(req, res),
);
router.get("/", (req: Request, res: Response) => listVaultsHandler(req, res));
router.delete("/:vaultId", deleteVaultValidator, validate, (req: Request, res: Response) =>
     deleteVaultHandler(req, res),
);

export default router;
