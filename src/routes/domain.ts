// src/routes/domain.ts
import express from "express";
import { getDomains, syncNow, getDistinctDomains,updateDomainWithEmails} from "../controllers/domainController";

const router = express.Router();

router.get("/", getDomains);
router.post("/sync", syncNow);
router.get("/distinct-domains", getDistinctDomains);
router.put("/:domainName", updateDomainWithEmails);



export default router;  // ✅ default export
