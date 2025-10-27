import partidasModel from "../partidas/partidas.model.js";
import cuentasModel from "../cuentas/cuentas.model.js";
import { request, response } from "express";

export const generarEstadoResultados = async (req = request, res = response) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        // 1. Obtener las cuentas de ganancia y pérdida
        const cuentasGanancia = await cuentasModel.find({ tipo: "Ganancia" });
        const cuentasPerdida = await cuentasModel.find({ tipo: "Perdida" });

        // 2. Filtros de fechas (opcional)
        const filtro = {};
        if (fechaInicio && fechaFin) {
            filtro.fecha = {
                $gte: new Date(fechaInicio),
                $lte: new Date(fechaFin)
            }
        }

        // 3. Obtener partidas del período
        const partidas = await partidasModel.find(filtro);

        // 4. Calcular saldo de CADA cuenta individual
        const saldosCuentas = {};

        partidas.forEach(partida => {
            partida.movimientos.forEach(mov => {
                const cuentaId = mov.cuenta.toString();
                
                if (!saldosCuentas[cuentaId]) {
                    saldosCuentas[cuentaId] = 0;
                }

                // Las ganancias aumentan en el Haber, las pérdidas en el Debe
                if (mov.tipoMovimiento === "Haber") {
                    saldosCuentas[cuentaId] += mov.monto;
                } else {
                    saldosCuentas[cuentaId] -= mov.monto;
                }
            });
        });

        // 5. Calcular totales
        let totalIngresos = 0;
        let totalGastos = 0;

        cuentasGanancia.forEach(cuenta => {
            const saldo = saldosCuentas[cuenta._id.toString()] || 0;
            totalIngresos += saldo;
        });

        cuentasPerdida.forEach(cuenta => {
            const saldo = Math.abs(saldosCuentas[cuenta._id.toString()] || 0);
            totalGastos += saldo;
        });

        const utilidadNeta = totalIngresos - totalGastos;
        const tipoResultado = utilidadNeta >= 0 ? "Ganancia" : "Perdida";

        // 6. Buscar cuentas necesarias para el cierre
        const cuentaResultados = await cuentasModel.findOne({ tipo: "Resultado" });
        const cuentaUtilidadesRetenidas = await cuentasModel.findOne({ 
            tipo: "Capital", 
            nombre: /Utilidades Retenidas/i 
        });
        const cuentaPerdidasAcumuladas = await cuentasModel.findOne({ 
            tipo: "Capital", 
            nombre: /Perdidas Acumuladas/i 
        });

        if (!cuentaResultados) {
            return res.status(400).json({
                message: "No existe una cuenta de Resultados en el sistema"
            });
        }

        // 7. Crear movimientos de cierre
        const movimientosCierre = [];

        // Cerrar cuentas de GANANCIA (tienen saldo acreedor, se cierran al DEBE)
        cuentasGanancia.forEach(cuenta => {
            const saldo = saldosCuentas[cuenta._id.toString()] || 0;
            if (saldo > 0) {
                movimientosCierre.push({
                    cuenta: cuenta._id,
                    tipoMovimiento: "Debe",
                    monto: saldo
                });
            }
        });

        // Cerrar cuentas de PÉRDIDA (tienen saldo deudor, se cierran al HABER)
        cuentasPerdida.forEach(cuenta => {
            const saldo = Math.abs(saldosCuentas[cuenta._id.toString()] || 0);
            if (saldo > 0) {
                movimientosCierre.push({
                    cuenta: cuenta._id,
                    tipoMovimiento: "Haber",
                    monto: saldo
                });
            }
        });

        // Registrar en cuenta de RESULTADOS
        movimientosCierre.push({
            cuenta: cuentaResultados._id,
            tipoMovimiento: utilidadNeta >= 0 ? "Haber" : "Debe",
            monto: Math.abs(utilidadNeta)
        });

        // Cerrar cuenta de RESULTADOS y trasladar a Capital
        //El .push() agrega un nuevo elemento al final del array
        movimientosCierre.push({
            cuenta: cuentaResultados._id,
            tipoMovimiento: utilidadNeta >= 0 ? "Debe" : "Haber",
            monto: Math.abs(utilidadNeta)
        });

        if (utilidadNeta >= 0) {
            // Hay GANANCIA -> va a Utilidades Retenidas (aumenta capital)
            if (!cuentaUtilidadesRetenidas) {
                return res.status(400).json({
                    message: "No existe cuenta de Utilidades Retenidas"
                });
            }
            movimientosCierre.push({
                cuenta: cuentaUtilidadesRetenidas._id,
                tipoMovimiento: "Haber",
                monto: Math.abs(utilidadNeta)
            });
        } else {
            // Hay PÉRDIDA -> va a Pérdidas Acumuladas (disminuye capital)
            if (!cuentaPerdidasAcumuladas) {
                return res.status(400).json({
                    message: "No existe cuenta de Pérdidas Acumuladas"
                });
            }
            movimientosCierre.push({
                cuenta: cuentaPerdidasAcumuladas._id,
                tipoMovimiento: "Debe",
                monto: Math.abs(utilidadNeta)
            });
        }

        // 8. Crear y guardar partida de cierre
        const partidaCierre = new partidasModel({
            fecha: new Date(),
            descripcion: `Cierre contable del período - ${tipoResultado}`,
            movimientos: movimientosCierre
        });

        await partidaCierre.save();

        // 9. Preparar detalle para respuesta
        const detalleGanancias = cuentasGanancia.map(cuenta => ({
            codigo: cuenta.codigo,
            nombre: cuenta.nombre,
            saldo: saldosCuentas[cuenta._id.toString()] || 0
        }));

        const detallePerdidas = cuentasPerdida.map(cuenta => ({
            codigo: cuenta.codigo,
            nombre: cuenta.nombre,
            saldo: Math.abs(saldosCuentas[cuenta._id.toString()] || 0)
        }));

        res.status(200).json({
            message: "Estado de resultados generado correctamente",
            data: {
                periodo: {
                    fechaInicio: fechaInicio || "Inicio",
                    fechaFin: fechaFin || "Hoy"
                },
                ingresos: {
                    detalle: detalleGanancias,
                    total: totalIngresos
                },
                gastos: {
                    detalle: detallePerdidas,
                    total: totalGastos
                },
                utilidadNeta,
                tipoResultado,
                partidaCierre
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al generar el estado de resultados",
            error: error.message
        });
    }
}

//El estado de resultados muestra los ingresos, gastos y la utilidad o pérdida neta de un período determinado.
//Si se perdio se queda en la cuenta de Pérdidas Acumuladas, si se ganó se queda en la cuenta de Utilidades Retenidas.
//El estado de resultados también muestra el cierre de la partida, que es la suma de todos los ingresos y todos los gastos.