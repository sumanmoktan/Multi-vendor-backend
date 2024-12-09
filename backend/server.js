const app = require('./app');
const DatabaseConnection = require('./db/Database');

//Handling uncaught Exception
process.on("uncaughtException", (err) =>{
    console.log(`Error: ${err.message}`);
    console.log(`shutting down server for handling uncaught exception`);
})

//config
if(process.env.NODE_ENV !== "PRODUCTION"){
    require('dotenv').config({
        path: "backend/config/.env"
    });
}

//connection 
DatabaseConnection();

//create server
const server = app.listen(process.env.PORT, ()=>{
    console.log(`server is running on http://localhost:${process.env.PORT}`);
});

// handling promise rejection
process.on("unhandledRejection", (err)=>{
    console.log(`Error:${err.message}`);
    console.log(`shutting down a server for unhandling rejection`);

    server.close(()=>{
        process.exit(1);
    })
})