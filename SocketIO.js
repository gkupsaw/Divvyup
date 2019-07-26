/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////  Modules ////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

const MongoSchemas = require('./MongoSchemas.js');
const User = MongoSchemas.User;
const Party = MongoSchemas.Party;
require('colors');

/////////////////////////////////////////////////////////////////////////////////
///////////////////////////////  Helper Functions ///////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

const determinePrice = (cost, amountOfUsers, myContribution) => {
    if (amountOfUsers == 0) {
        console.error('Error, no users in party ==> user is not accounted for.'.red)
        return 0;
    }
    return Math.round(parseFloat(parseFloat(cost) / parseFloat(amountOfUsers) - parseFloat(myContribution)) * 100) / 100;
}

const updateUserParties = async (payment, userID, party, cancelled) => {
    const prevParty = {
        ...party,
        cost: cancelled ? 0 : payment,
        cancelled
    };

    await User.updateOne( { id: userID }, {
        $push: { previousParties: prevParty }, 
        $pull: { activeParties: { id: party.id } }, 
        $inc: { accountBalance: -1 * parseFloat(payment) }
    }).catch(err => console.error('Error updating User document parties'.red, err));
}

const archiveParty = async options => {
    const { party, guests, payment, cancelled } = options;
    await Party.updateOne({ id: party.id }, { archived: true })
            .then(() => {
                console.log('Archiving party...'.yellow);
                guests.forEach(async guest => await updateUserParties(payment, guest.id, party, cancelled));
            })
            .catch(err => console.error('Error updating party status to archived:'.red, err));
}

module.exports = {

    determinePrice,

    updateUserParties,
    
    archiveParty

}