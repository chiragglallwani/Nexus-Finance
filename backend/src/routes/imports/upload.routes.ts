import { Router } from "express";
import multer from "multer";
import {
     uploadTransactions,
     getUploadStatus,
     listJobs,
} from "../../controllers/imports/upload.controller";

const upload = multer({
     storage: multer.memoryStorage(),
     limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router();

router.post("/transactions", upload.single("file"), (req, res) => uploadTransactions(req, res));

router.get("/jobs/:jobId", (req, res) => getUploadStatus(req, res));

router.get("/jobs", (req, res) => listJobs(req, res));

export default router;
