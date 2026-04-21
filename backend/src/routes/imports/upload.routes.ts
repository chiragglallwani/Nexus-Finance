import { Router } from "express";
import multer from "multer";
import { validate } from "../../middleware/validators/validate";
import {
     getUploadStatusValidator,
     listUploadJobsValidator,
} from "../../middleware/validators/uploadValidator";
import {
     uploadTransactions,
     getUploadStatus,
     listJobs,
     downloadUploadTemplate,
} from "../../controllers/imports/upload.controller";

const upload = multer({
     storage: multer.memoryStorage(),
     limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router();

router.post("/transactions", upload.single("file"), uploadTransactions);

router.get("/jobs/:jobId", getUploadStatusValidator, validate, getUploadStatus);

router.get("/jobs", listUploadJobsValidator, validate, listJobs);
router.get("/template/download", downloadUploadTemplate);

export default router;
