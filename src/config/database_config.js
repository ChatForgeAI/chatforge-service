const mongoose = require('mongoose');
const {initClients} = require("../services/whats_app_service/clients_manager");

const dbConnection = () => {
    console.log("DB URI: ", process.env.DATABASE_URL)
    mongoose
        .connect(process.env.DATABASE_URL)
        .then((conn) => {
            console.log(`Database Connected: ${conn.connection.host}`);
            initClients().then(r => console.log(""))
        })
        // .catch((err) => {
        //     console.error(`Database Error: ${err}`);
        //     process.exit(1);
        // });
};

module.exports = dbConnection;
