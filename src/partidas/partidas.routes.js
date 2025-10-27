import { Router } from "express";
import { crearPartida, obtenerPartidas, actualizarPartida, eliminarPartida } from "./partidas.controller.js";

const router = Router();

router.post("/create", crearPartida);
router.get("/partidas", obtenerPartidas);
router.put("/partidas/:id", actualizarPartida);
router.delete("/partidas/:id", eliminarPartida);

export default router;