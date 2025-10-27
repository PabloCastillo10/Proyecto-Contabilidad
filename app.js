import { config } from "dotenv"; //La librería dotenv se utiliza para cargar variables de entorno de forma segura.
import { initServer } from "./config/server.js"; 

config(); //Cargar las variables de entorno desde el archivo .env
initServer(); //Iniciar el servidor