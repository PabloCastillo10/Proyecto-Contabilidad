import { Router } from "express";
import { generarBalanceGeneral } from "./balance.controller.js";

const balanceRoutes = Router();

balanceRoutes.get("/general", generarBalanceGeneral);

export default balanceRoutes;