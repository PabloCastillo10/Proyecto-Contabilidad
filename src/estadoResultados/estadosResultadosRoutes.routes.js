import { Router } from "express";
import { generarEstadoResultados } from "./estadosResultados.controller.js";

const router = Router();

router.get("/", generarEstadoResultados)

export default router;