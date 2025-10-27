import mongoose from "mongoose";

const partidasSchema = new mongoose.Schema({
    fecha: {type : Date, required : true, default : Date.now},
    descripcion: {type : String},
    movimientos: [
        {
            cuenta: {type : mongoose.Schema.Types.ObjectId, ref : "cuentas", required : true},
            tipoMovimiento: {type: String, enum: ["Debe", "Haber"], required : true},
            monto: {type : Number, required : true}
        }
    ]
})

export default mongoose.model("partidas", partidasSchema);