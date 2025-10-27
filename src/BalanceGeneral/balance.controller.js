import partidasModel from "../partidas/partidas.model.js";
import cuentasModel from "../cuentas/cuentas.model.js";
import { request, response } from "express";

export const generarBalanceGeneral = async (req = request, res = response) => {
    try {
        const {fecha } = req.query;

        // 1. Obtener todas las cuentas Activo, Pasivo y Capital
        const todasLasCuentas = await cuentasModel.find().sort({codigo : 1});

        // 2. Filtro de fecha (opcional - hasta que fecha calcular el balance)
        const filtro = {};
        if (fecha) {
            filtro.fecha = { $lte: new Date(fecha) }; //el filtro $lte significa "menor o igual a"
        }

        // 3. Obtener todas las partidas hasta la fecha
        const partidas = await partidasModel.find(filtro).populate("movimientos.cuenta");

        // 4. Calcular saldo de cada cuenta
        const saldosCuentas = {};

        partidas.forEach(partida => {
            partida.movimientos.forEach(mov => {
                const cuentaId = mov.cuenta._id.toString();
                const tipoCuenta = mov.cuenta.tipo;

                if (!saldosCuentas[cuentaId]) {
                    saldosCuentas[cuentaId] = 0;
                }

                // Lógica de naturaleza contable
                if (tipoCuenta === "Activo") {
                    // Activos aumentan en el Debe, disminuyen en el Haber
                    if (mov.tipoMovimiento === "Debe") {
                        saldosCuentas[cuentaId] += mov.monto;
                    } else {
                        saldosCuentas[cuentaId] -= mov.monto;
                    }
                } else if (tipoCuenta === "Pasivo" || tipoCuenta === "Capital") {
                    // Pasivos y Capital aumentan en el Haber, disminuyen en el Debe
                    if (mov.tipoMovimiento === "Haber") {
                        saldosCuentas[cuentaId] += mov.monto;
                    } else {
                        saldosCuentas[cuentaId] -= mov.monto;
                    }
                }
            });
        });

        //5. Función para construir jerarquía
        const construirJerarquia = (cuentas) => {
            const resultado = []; //Array que almacenará los resultados
            const mapaJerarquia = {}; //Objeto para mapear cuentas por su id

            //Primero, crear el mapa de cuentas con sus saldos
            cuentas.forEach(cuenta => {
                const saldo = saldosCuentas[cuenta._id.toString()] || 0;
                mapaJerarquia[cuenta.codigo] = {
                    codigo: cuenta.codigo,
                    nombre: cuenta.nombre,
                    saldo: saldo,
                    hijos: []
                };
            });

            //Construir jerarquía y sumar hacia arriba
            cuentas.forEach(cuenta => {
                const partesCodigo = cuenta.codigo.split("."); //El .split() divide el string en un array usando el punto como separador

                if (partesCodigo.length === 1) {
                    // Cuenta padre principal
                    resultado.push(mapaJerarquia[cuenta.codigo]);
                } else {
                    // Cuenta hija encontrar padre
                    const padre = partesCodigo.slice(0, -1).join(".");
                    if (mapaJerarquia[padre]) {
                        mapaJerarquia[padre].hijos.push(mapaJerarquia[cuenta.codigo]);
                    }
                }
            });

            //Funcion recursiva para sumar saldos hacia arriba
            const calcularSaldoPadre = (cuenta) => {
                if (cuenta.hijos.length === 0) {
                    return cuenta.saldo;
                }

                let totalHijos = 0;
                cuenta.hijos.forEach(hijo => {
                    totalHijos += calcularSaldoPadre(hijo);
                });

                cuenta.saldo = totalHijos;
                return cuenta.saldo;
            };

            //Calcular saldos de todas las cuentas padre
            resultado.forEach(cuenta => calcularSaldoPadre(cuenta));

            return resultado;
        };

        //6. Construir Jerarquias
        const activosJerarquias = construirJerarquia(todasLasCuentas.filter(cuenta => cuenta.tipo === "Activo"));
        const pasivosJerarquias = construirJerarquia(todasLasCuentas.filter(cuenta => cuenta.tipo === "Pasivo"));
        const capitalJerarquias = construirJerarquia(todasLasCuentas.filter(cuenta => cuenta.tipo === "Capital"));
    
        // 7. Calcular totales
        const totalActivos = activosJerarquias.reduce((sum, cuenta) => sum + cuenta.saldo, 0); //El reduce sirve para acumular los saldos de los objetos en un array
        const totalPasivos = pasivosJerarquias.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
        const totalCapital = capitalJerarquias.reduce((sum, cuenta) => sum + cuenta.saldo, 0);

        // 8. Verificar ecuación contable
        const ecuacionBalanceada = Math.abs(totalActivos - (totalPasivos + totalCapital)) < 0.01;

        res.status(200).json({
            message: "Balance general generado correctamente",
            data: {
                fecha: fecha || new Date(),
                activos: {
                    detalle: activosJerarquias,
                    total: totalActivos
                },
                pasivos: {
                    detalle: pasivosJerarquias,
                    total: totalPasivos
                },
                capital: {
                    detalle: capitalJerarquias,
                    total: totalCapital
                },
                totales: {
                    activos: totalActivos,
                    pasivos: totalPasivos,
                    capital: totalCapital,
                    pasivosMasCapital: totalPasivos + totalCapital,
                    ecuacionBalanceada
                }
            }
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al generar el balance general",
            error: error.message
        });
    }
}