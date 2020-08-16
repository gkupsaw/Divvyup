/////////////////////////////////////////////////////////////////////////////////
////////////////////////////////  HTTP Requests  ////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

module.exports = (app) => {
    const queries = require('../queries.js');
    const schemas = require('../schemas.js');

    app.post('/register', async (req, res) => {
        console.log(
            '- Registration request received:',
            req.method.cyan,
            req.url.underline
        );
        const { username, password } = req.body;
        const result = await queries.registerUser(username, password);
        res.status(200).send(result); //userID and username
    });

    app.post('/login', async (req, res) => {
        console.log(
            '- Login request received:',
            req.method.cyan,
            req.url.underline
        );
        const { username, password } = req.body;
        const result = await queries.authenticateUser(username, password);
        res.status(200).send(result); //userID and username
    });

    app.post('/host', async (req, res) => {
        console.log(
            '- Host request received:',
            req.method.cyan,
            req.url.underline
        );
        const { name, cost, ownerID } = req.body;
        const party = await schemas.createParty(name, cost, ownerID);
        res.status(201).send({ party });
    });

    app.post('/join', async (req, res) => {
        console.log(
            '- Join request received:',
            req.method.cyan,
            req.url.underline
        );
        const party = await queries.getParty(req.body.id);
        party && !party.archived
            ? res.status(200).send({ party })
            : res.status(204).send({ party: null });
    });

    app.post('/info', async (req, res) => {
        console.log(
            '- Info request received:',
            req.method.cyan,
            req.url.underline
        );
        const { userID, partyID } = req.body,
            user = await queries.getUser(userID),
            party = await queries.getParty(partyID);
        res.status(200).send({ user, party });
    });

    // app.delete('/clear/database', async (req, res) => {
    //     console.log('- Deletion request received:', req.method.cyan, req.url.underline);
    //     await schemas.deleteData();
    //     parties = new Map();
    //     console.log('Removed All Data!'.yellow);
    //     res.status(200).end();
    // });

    app.get('*', (req, res) => {
        //bad url
        console.log(
            '- Bad request received:'.red,
            req.method.cyan,
            req.url.underline
        );
        console.log('Error'.red);
        res.status(404).send('<h1>Error 404: Page Does Not Exist</h1>');
    });
};
