import partidasModel from "../partidas/partidas.model.js";
import cuentasModel from "../cuentas/cuentas.model.js";
import { request, response } from "express";


export const generarLibroMayor = async (req = request, res = response) => {
    try {
        const { cuentaId, fechaInicio, fechaFin } = req.query;

        const cuenta = await cuentasModel.findById(cuentaId);
        if (!cuenta) {
            return res.status(404).json({ message: "Cuenta no encontrada" })
        }

        // Filtro base
        const filtro = {
            "movimientos.cuenta": cuentaId
        }

        // Si hay rango de fechas, lo agregamos
        if (fechaInicio && fechaFin) {
            filtro.fecha = {
                $gte: new Date(fechaInicio),
                $lte: new Date(fechaFin)
            }
        }

        // Buscar las partidas que afecten esa cuenta
        const partidas = await partidasModel
            .find(filtro)
            .populate("movimientos.cuenta", "codigo nombre tipo");

        // Procesar los movimientos tipo T (Debe / Haber)
        const movimientos = [];
        let totalDebe = 0;
        let totalHaber = 0;

        partidas.forEach((partida) => {
            partida.movimientos.forEach((mov) => {
                if (mov.cuenta._id.toString() === cuentaId) {
                    movimientos.push({
                        fecha: partida.fecha,
                        descripcion: partida.descripcion,
                        tipoMovimiento: mov.tipoMovimiento,
                        monto: mov.monto,
                    });

                    if (mov.tipoMovimiento === "Debe") totalDebe += mov.monto;
                    if (mov.tipoMovimiento === "Haber") totalHaber += mov.monto;
                }
            });
        });

        res.status(200).json({
            cuenta: {
                id: cuenta._id,
                codigo: cuenta.codigo,
                nombre: cuenta.nombre,
                tipo: cuenta.tipo,
            },
            totales: { totalDebe, totalHaber, saldo: totalDebe - totalHaber },
            movimientos,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al generar el libro mayor",
        })
    }
}