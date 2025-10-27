import { Router } from "express";
import { generarLibroMayor } from "./libroMayor.controller.js";

const router = Router();

router.get("/", generarLibroMayor)

export default router;