const mongoose = require('mongoose');

const DatabaseConnection = ()=>{
    mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology:true
    }).then((data)=>{
        console.log(`Connect to database with server:${data.connection.host}`);
        });
}

module.exports = DatabaseConnection;

