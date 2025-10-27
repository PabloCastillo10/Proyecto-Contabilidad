import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { dbConnection } from "./mongo.js";
import express from "express";
import cuentasRoutes from "../src/cuentas/cuentas.routes.js";
import partidasRoutes from "../src/partidas/partidas.routes.js";
import libroMayor from "../src/libroMayor/libroMayor.routes.js"
import esttadosResultadosRoutes from "../src/estadoResultados/estadosResultadosRoutes.routes.js";
import balanceRoutes from "../src/BalanceGeneral/balance.routes.js";


const configMiddleware = (app) => {
    app.use(express.urlencoded({ extended: false }));
    app.use(cors());
    app.use(express.json());
    app.use(helmet());
    app.use(morgan('dev'));
}

const configurarRutas = (app) => {
    app.use("/api/cuentas", cuentasRoutes);
    app.use("/api/partidas", partidasRoutes);
    app.use("/api/libroMayor", libroMayor);
    app.use("/api/estadoResultados", esttadosResultadosRoutes);
    app.use("/api/balance", balanceRoutes);
}


const connectionDB =  async (app) => {
    try {
        await dbConnection();
        console.log('Conectado a la base de datos con éxito');
    } catch (error) {
        console.log('Error al conectar con la base de datos', error);
        process.exit(1);
    }
}

export const initServer = async () => {
    const app = express();
    const port = process.env.PORT || 3000;
    await connectionDB();
    configMiddleware(app);
    configurarRutas(app);
    app.listen(port, () => {
        console.log(`Servidor corriendo en el puerto ${port}`);
    });
}