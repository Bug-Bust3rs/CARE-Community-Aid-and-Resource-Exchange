import { Router } from "express";
import {
  getAllDonationPosts,
  createDonationPost,
  getDonationPostById,
  updateDonationPost,
  deleteDonationPost,
} from "../controllers/donationPosts";

const router = Router();

router.get("/", getAllDonationPosts);
router.post("/", createDonationPost);
router.get("/:id", getDonationPostById);
router.put("/:id", updateDonationPost);
router.delete("/:id", deleteDonationPost);

export default router;
