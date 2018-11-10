const axios = require('axios');
const Promise = require('bluebird');

const redis = Promise.promisifyAll(require('redis'));
const client = redis.createClient();
const redisConnection = require("./redis-connection");

let nextUserId;

redisConnection.on("get_user:request:*", async (message) => {
	const {requestId, eventName} = message;
    const userId = message.data;

    const failedEvent = `${eventName}:failed:${requestId}`;

    try {
        const usersString = await client.getAsync('users');
        const users = JSON.parse(usersString).users;

        const user = users.find(user => {
            return user.id === userId;
        });

        if (user) {
            const successEvent = `${eventName}:success:${requestId}`;
            redisConnection.emit(successEvent, {
                requestId: requestId,
                data: user,
                eventName: eventName
            });
        } else {
            redisConnection.emit(failedEvent, {
                requestId: requestId,
                data: {
                    message: `No user found with id: ${userId}`
                },
                eventName: eventName
            });
        }
	} catch (e) {
        redisConnection.emit(failedEvent, {
            requestId: requestId,
            data: {
                message: `Something went wrong.`
            },
            eventName: eventName
        });
	}
});

redisConnection.on('post_user:request:*', async (message) => {
    const {requestId, eventName, data} = message;
    const failedEvent = `${eventName}:failed:${requestId}`;

    try {
        const usersString = await client.getAsync('users');
        const users = JSON.parse(usersString).users;
        const newUser = {
            id: nextUserId,
            ...data
        };
        users.push(newUser);
        await client.setAsync('users', JSON.stringify({users: users}));
        nextUserId++;

        const successEvent = `${eventName}:success:${requestId}`;
        redisConnection.emit(successEvent, {
            requestId: requestId,
            data: newUser,
            eventName: eventName
        });
	} catch (e) {
        redisConnection.emit(failedEvent, {
            requestId: requestId,
            data: {
                message: `Something went wrong.`
            },
            eventName: eventName
        });
	}
});

redisConnection.on('delete_user:request:*', async (message) => {
    const {requestId, eventName, data} = message;

    const user_id = message.data.user_id;
    const usersString = await client.getAsync('users');
    const users = JSON.parse(usersString).users;

    const updatedUsers = users.filter(user => {
    	return user.id !== user_id;
	});

    if (updatedUsers.length === users.length) {
    	// No one was deleted
        const failedEvent = `${eventName}:failed:${requestId}`;
        redisConnection.emit(failedEvent, {
            requestId: requestId,
            data: {
                message: `No user found with id: ${user_id}`
            },
            eventName: eventName
        });
	} else {
        await client.setAsync('users', JSON.stringify({users: updatedUsers}));

        const successEvent = `${eventName}:success:${requestId}`;
        redisConnection.emit(successEvent, {
            requestId: requestId,
            data: {
                message: `Deleted user with id: ${user_id}`
            },
            eventName: eventName
        });
    }
});

redisConnection.on('put_user:request:*', async (message) => {
	//TODO make sure all requests destructure message
	//TODO use userId instead of user_id everywhere
    const {requestId, eventName, data} = message;
    const {userId, userBody} = data;

    const usersString = await client.getAsync('users');
    const users = JSON.parse(usersString).users;

    let userFound;

    const updatedUsers = users.map(user => {
    	if (user.id !== userId) {
    		return user;
		} else {
    		userFound = {
                id: user.id,
                ...userBody
            };
    		return userFound;
		}
	});

    if (userFound) {
        await client.setAsync('users', JSON.stringify({users: updatedUsers}));
        const successEvent = `${eventName}:success:${requestId}`;
        //TODO return data: userBody instead of having an object with one property
        redisConnection.emit(successEvent, {
            requestId: requestId,
            data: {
                user: userFound
            },
            eventName: eventName
        });
	} else {
        const failedEvent = `${eventName}:failed:${requestId}`;
        //TODO return data: userBody instead of having an object with one property
        redisConnection.emit(failedEvent, {
            requestId: requestId,
            data: {
                message: `No user found with id: ${userId}`
            },
            eventName: eventName
        });
	}
});

async function init() {
	// TODO dont reset store stopping server
	const res = await axios.get("https://gist.githubusercontent.com/philbarresi/5cf15393d245b38a2d86ce8207d5076c/raw/d529fb474c1af347702ca4d7b992256237fa2819/lab5.json")
	const users = res.data;
	nextUserId = users.length + 1;

	client.setAsync('users', JSON.stringify({users: users})).then(() => {
		console.log('Set initial users.')
	}).catch(err => {
		console.error(err);
	});
}

init();