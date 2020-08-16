/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////  Start Server  ////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

require('dotenv').config();
require('colors');
require('path');
const http = require('http');
const connectDb = require('./main/db-connect');
const setupRoutes = require('./main/express-http-routes');
const setupSockets = require('./main/sockets');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const port = process.env.PORT;

app.use(cors({ origin: true }));
app.use(express.static(__dirname, +'/party'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use((req, res, next) => {
    //copied from enable-cors.org, handles CORS related errors
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
});

const setupServer = async () => {
    await connectDb();
    setupRoutes(app);
    setupSockets(server);

    server.listen(port, () => {
        console.log('Server listening on', String(port).yellow);
    });
};

setupServer();
