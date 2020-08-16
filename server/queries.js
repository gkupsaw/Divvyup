/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////  Modules ////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

const bcrypt = require('bcryptjs');
const MongoSchemas = require('./schemas.js');
const User = MongoSchemas.User;
const Party = MongoSchemas.Party;
require('colors');

/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////  Query Functions ////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

const authenticateUser = async (username, password) => {
    let result;
    await User.findOne({ username })
        .select('password username id')
        .then((data) => {
            const success = data && bcrypt.compareSync(password, data.password),
                user = { username: data.username, id: data.id };
            result = { user, success };
        })
        .catch((err) =>
            console.error('Error finding User doc for authentication'.red, err)
        );
    return result;
};

const registerUser = async (username, password) => {
    let result, user;
    await User.findOne({ username })
        .then(async (data) => {
            user = data
                ? null
                : await MongoSchemas.createUser(username, password);
            result = user
                ? { user: { username: user.username, id: user.id } }
                : null;
            result && console.log('User registered!'.green);
        })
        .catch((err) =>
            console.error('Error while registering user:'.red, err)
        );
    return result;
};

const getParty = async (id) => {
    let party;
    await Party.findOne({ id })
        .then((data) => (party = data))
        .catch((err) => console.error('Error getting Party doc:'.red, err));
    return party;
};

const getUser = async (id) => {
    let user;
    await User.findOne({ id })
        .then((data) => (user = data))
        .catch((err) => console.error('Error getting User doc:'.red, err));
    return user;
};

module.exports = {
    authenticateUser,
    registerUser,
    getParty,
    getUser,
};
