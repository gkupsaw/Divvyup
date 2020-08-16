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
const port = process.env.PORT;

const setupServer = async () => {
    await connectDb();
    const app = setupRoutes();
    const server = http.createServer(app);
    setupSockets(server);

    server.listen(port, () => {
        console.log('Server listening on', String(port).yellow);
    });
};

setupServer();
