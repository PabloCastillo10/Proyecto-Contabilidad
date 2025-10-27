import mongoose from "mongoose";

const cuentasSchema = new mongoose.Schema({
    codigo: {type : String, required : true, unique : true},    
    nombre: {type : String, required : true},
    tipo: {
        type : String,
        enum : ["Activo", "Pasivo", "Capital", "Ganancia", "Perdida", "Resultado"],
        required : true
    },
    saldoDeudor: {type : Number, default : 0},
    saldoAcreedor: {type : Number, default : 0},
}, {timestamps: true});

export default mongoose.model("cuentas", cuentasSchema);