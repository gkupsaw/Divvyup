/////////////////////////////////////////////////////////////////////////////////
////////////////////////////////  DB Connection  ////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
const mongoose = require('mongoose');

module.exports = async () => {
    const db = mongoose.connection;

    db.once('open', () => {
        // bind a function to perform when the database has been opened
        console.log('Connected to DB!'.green);
    });
    process.on('SIGINT', () => {
        //CTR-C to close
        mongoose.connection.close(() => {
            console.log('\nDB connection closed by Node process ending'.cyan);
            process.exit(0);
        });
    });
    const url = process.env.DB_HOST;
    await mongoose
        .connect(url, {
            useNewUrlParser: true,
            w: 1,
            useUnifiedTopology: true,
        })
        .catch((err) => {
            console.error(`Error connecting to DB: ${JSON.stringify(err)}`);
        });

    db.on('error', console.error);

    return db;
};
