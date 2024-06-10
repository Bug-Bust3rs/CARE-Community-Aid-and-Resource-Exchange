import { Router } from "express";
import {
  getAllPetPosts,
  createPetPost,
  getPetPostById,
  updatePetPost,
  deletePetPost,
} from "../controllers/petPostController";

const router = Router();

router.get("/", getAllPetPosts);
router.post("/", createPetPost);
router.get("/:id", getPetPostById);
router.put("/:id", updatePetPost);
router.delete("/:id", deletePetPost);

export default router;
