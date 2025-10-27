import { Router } from "express";
import { crearCuenta, obtenerCuentas, actualizarCuenta, eliminarCuenta } from "./cuentas.controller.js";

const router = Router();

router.post("/create", crearCuenta);
router.get("/", obtenerCuentas);
router.put("/:id", actualizarCuenta);
router.delete("/:id", eliminarCuenta);

export default router;