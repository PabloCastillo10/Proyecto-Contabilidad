import cuentasModel from "./cuentas.model.js";
import {request, response} from "express";

export const crearCuenta = async (req = request, res = response) => {
    try {
        const data = req.body;
        const newCuenta = new cuentasModel({
            ...data
        })
        await newCuenta.save();

        res.status(201).json({
            message: "Cuenta creada correctamente",
            data: newCuenta
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al crear la cuenta",
            error: error.message
        })
    }
}

export const obtenerCuentas = async (req = request, res = response) => {
    try {
        const cuenta = await cuentasModel.find();
        res.status(200).json({
            message: "Cuentas obtenidas correctamente",
            data: cuenta
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Error al obtener las cuentas",
            error: error.message
        })
    }
}


export const actualizarCuenta = async (req = request, res = response) => {
    try {
        const {id} = req.params;
        const data = req.body;

        const updatedCuenta = await cuentasModel.findByIdAndUpdate(id, data, {new: true});

        res.status(200).json({
            message: "Cuenta actualizada correctamente",
            data: updatedCuenta
        })
    } catch (error) {
        console.log(error) 
        res.status(500).json({
            message: "Error al actualizar la cuenta",
            error: error.message
        })
    }
}

export const eliminarCuenta = async (req = request, res = response) => {
    try {
        const {id} = req.params;
        const deletedCuenta = await cuentasModel.findByIdAndDelete(id);

        res.status(200).json({
            message: "Cuenta eliminada correctamente",
            data: deletedCuenta
        })
    } catch (error) {
        console.log(error) 
        res.status(500).json({
            message: "Error al eliminar la cuenta",
            error: error.message
        })
    }
}