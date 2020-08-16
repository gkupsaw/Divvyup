/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////  Modules ////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

const bcrypt = require('bcryptjs');
const schemas = require('./schemas.js');
const User = schemas.User;
const Party = schemas.Party;
require('colors');

/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////  Query Functions ////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

const authenticateUser = async (username, password) => {
    let result;
    await User.findOne({ username })
        .select('password username id')
        .then((data) => {
            result = data
                ? {
                      user: { username: data.username, id: data.id },
                      success: bcrypt.compareSync(password, data.password),
                  }
                : { user: null, success: false };
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
            if (!data) {
                user = data
                    ? null
                    : await schemas.createUser(username, password);
                result = { user: { username: user.username, id: user.id } };
                console.log('User registered!'.green);
            }
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
