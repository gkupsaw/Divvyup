/////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////  Socket.io  //////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

const { User, Party } = require('../schemas.js');
const socketFunctions = require('../socket-functions.js');

const setupPartiesMap = async () => {
    const allParties = await Party.find({});
    allParties.forEach((partyDoc) => {
        parties.set(partyDoc.id, partyDoc.users);
    });
};

const parties = new Map(); // map keeps track of users currently in the party

module.exports = (server) => {
    const io = require('socket.io').listen(server);
    setupPartiesMap();

    io.sockets.on('connection', async (socket) => {
        socket.on('join', async (party, user, callback) => {
            console.log(
                '- Socket Connected! Party:',
                party.name,
                'User:',
                user.username
            );

            socket.join(party.id);
            socket.user = user;
            socket.party = {
                id: party.id,
                cost: party.cost,
                name: party.name,
                timestamp: party.timestamp,
                ownerID: party.ownerID,
            };

            if (!parties.get(party.id)) {
                //make a new party item in the map if needed
                console.log('Adding party to map...'.yellow);
                parties.set(party.id, []);
            }

            const userIsGuest = parties
                .get(party.id)
                .find((guest) => guest.id === user.id);
            if (!userIsGuest) {
                // add a new guest
                console.log(
                    'Adding new active guest to party:'.yellow,
                    user.username
                );
                parties.get(party.id).push({
                    id: user.id,
                    username: user.username,
                    contribution: 0,
                    payment: socketFunctions.determinePrice(
                        party.cost,
                        parties.get(party.id).length + 1,
                        0
                    ), //length is one less bc not pushed yet
                    active: true,
                    sessionID: socket.id,
                });
                const partyInfo = {
                    name: party.name,
                    id: party.id,
                    timestamp: party.timestamp,
                };
                await User.updateOne(
                    { id: user.id },
                    { $push: { activeParties: partyInfo } }
                ).catch((err) =>
                    console.error('Error updating user active parties', err)
                );
            } else {
                // update sessionID and active status
                const myInfo = parties
                    .get(party.id)
                    .find((guest) => guest.id === user.id);
                if (myInfo) {
                    guest.sessionID = socket.id;
                    guest.active = true;
                }
            }
            parties
                .get(party.id)
                .forEach(
                    (guest) =>
                        (guest.payment = socketFunctions.determinePrice(
                            party.cost,
                            parties.get(party.id).length,
                            guest.contribution
                        ))
                );
            // every payment has to be updated as there's a new user

            Party.updateOne({ id: party.id }, { users: parties.get(party.id) }) //update party data on users accordingly
                .then(() => {
                    console.log('Updated users!'.green);
                    callback(party.users);
                    io.sockets
                        .in(party.id)
                        .emit('membershipChanged', parties.get(party.id)); //notify guests
                })
                .catch((err) =>
                    console.error(
                        'Error updating Party data on guest joining:'.red,
                        err
                    )
                );
        });

        // Guest emits this from frontend, host receives contributeRequest on their socket
        socket.on('getConfirmation', (requester, contribution) => {
            // requester = {name, id}
            console.log('- Contribution confirmation request received'.yellow);

            const party = parties.get(socket.party.id);
            const host = party.find(
                (guest) => guest.id === socket.party.ownerID
            );
            io.to(host.sessionID).emit(
                'contributeRequest',
                requester,
                contribution
            );
        });

        // Host frontend emits this to server
        socket.on('contribute', (requester, addedContribution) => {
            console.log('- Contribution received from guest'.yellow);

            const party = socket.party,
                guests = parties.get(party.id),
                requesterCurr = guests.find(
                    (guest) => guest.id === requester.id
                ),
                newContribution =
                    parseFloat(addedContribution) +
                    parseFloat(requesterCurr.contribution);
            requesterUpdated = {
                ...requesterCurr,
                contribution: newContribution,
                payment: socketFunctions.determinePrice(
                    party.cost,
                    guests.length,
                    newContribution
                ),
            };
            parties.get(party.id)[
                guests.indexOf(requesterCurr)
            ] = requesterUpdated;
            parties
                .get(party.id)
                .forEach(
                    (guest) =>
                        guest.id === party.ownerID &&
                        (guest.payment = guest.payment - addedContribution)
                );

            Party.updateOne(
                { id: party.id },
                { $set: { users: parties.get(party.id) } }
            )
                .then(() => {
                    io.sockets
                        .in(party.id)
                        .emit('membershipChanged', parties.get(party.id));
                    console.log('Updated costs!'.green);
                })
                .catch((err) =>
                    console.error(
                        'Error updating User document after contribution:'.red,
                        err
                    )
                );
        });

        // Host frontend emits this to server
        socket.on('endParty', async (payment) => {
            const { id } = socket.party;
            const options = {
                guests: parties.get(socket.party.id),
                party: socket.party,
                payment,
                cancelled: false,
            };
            await socketFunctions
                .archiveParty(options)
                .then(
                    () =>
                        io.sockets.in(id).emit('partyEnded') &&
                        io.sockets.in(id).emit('disconnect')
                );
        });

        // Host frontend emits this to server
        socket.on('cancelParty', async () => {
            let { id } = socket.party,
                options = {
                    guests: parties.get(socket.party.id),
                    party: socket.party,
                    payment: 0,
                    cancelled: true,
                };
            await socketFunctions
                .archiveParty(options)
                .then(
                    () =>
                        io.sockets.in(id).emit('partyEnded') &&
                        io.sockets.in(id).emit('disconnect')
                );
        });

        socket.on('error', () => {});
    });
};
