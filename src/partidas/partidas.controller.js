import partidasModel from "./partidas.model.js";
import cuentasModel from "../cuentas/cuentas.model.js";
import { request, response } from "express";
import dayjs from "dayjs";

export const crearPartida = async (req = request, res = response) => {
    try {
        const data = req.body;

        const totalDebe = data.movimientos
            .filter(movimiento => movimiento.tipoMovimiento === "Debe") //El filter crea un nuevo array con los movimientos que cumplen la condición
            .reduce((sum, m) => sum + m.monto, 0); //El reduce acumula los montos de los movimientos filtrados

        const totalHaber = data.movimientos
            .filter(movimiento => movimiento.tipoMovimiento === "Haber")
            .reduce((sum, m) => sum + m.monto, 0);

        if (totalDebe !== totalHaber) {
            return res.status(400).json({
                message: "La partida no está balanceada. Debe = Haber"
            });
        }

        for (const movimiento of data.movimientos) {
            const cuenta = await cuentasModel.findById(movimiento.cuenta);
            if (!cuenta) {
                return res.status(400).json({
                    message: "La cuenta no existe"
                });
            }

            if (cuenta.tipo === "Resultado") {
                return res.status(400).json({ message: "La cuenta de Resultados no puede usarse en partidas" });
            }

            if (cuenta.tipo === "Ganancia" && movimiento.tipoMovimiento !== "Haber") {
                return res.status(400).json({ message: "Las cuentas de Ganancia solo aceptan movimientos Haber" });
            }

            if (cuenta.tipo === "Perdida" && movimiento.tipoMovimiento !== "Debe") {
                return res.status(400).json({ message: "Las cuentas de Perdida solo aceptan movimientos Debe" });
            }
        }

        const newPartida = new partidasModel({
            ...data
        })
        await newPartida.save();

        res.status(201).json({
            message: "Partida creada correctamente",
            data: newPartida
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al crear la partida",
            error: error.message
        })
    }
}

export const obtenerPartidas = async (req = request, res = response) => {
    try {
        const partida = await partidasModel.find().populate("movimientos.cuenta", "codigo nombre tipo");
        res.status(200).json({
            message: "Partidas obtenidas correctamente",
            data: partida
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al obtener las partidas",
            error: error.message
        })
    }
}

export const actualizarPartida = async (req = request, res = response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updatedPartida = await partidasModel.findByIdAndUpdate(id, data, { new: true });

        res.status(200).json({
            message: "Partida actualizada correctamente",
            data: updatedPartida
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Error al actualizar la partida",
            error: error.message
        })
    }
}

export const eliminarPartida = async (req = request, res = response) => {
    try {
        const { id } = req.params;
        const deletedPartida = await partidasModel.findByIdAndDelete(id);

        res.status(200).json({
            message: "Partida eliminada correctamente",
            data: deletedPartida
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Error al eliminar la partida",
            error: error.message
        })
    }
}