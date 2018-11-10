const axios = require('axios');
const Promise = require('bluebird');

const redis = Promise.promisifyAll(require('redis'));
const client = redis.createClient();
const redisConnection = require("./redis-connection");

redisConnection.on("create", (data, channel) => {
	let message = data.message;
	console.log("\n\n\n=================");
	console.log("We've received a message! It's:");
	console.log(message);
	console.log(JSON.stringify(data));
	console.log("=================\n\n\n");
});

redisConnection.on("get_user:request:*", async (message, channel) => {
	const requestId = message.requestId;
	const eventName = message.eventName;
	const successEvent = `${eventName}:success:${requestId}`;

	const user_id = message.data.user_id;
	const usersString = await client.getAsync('users');
	const users = JSON.parse(usersString).users;

	const user = users.find(user => {
		return user.id === user_id;
	});

	redisConnection.emit(successEvent, {
		requestId: requestId,
		data: {
			user: user
		},
		eventName: eventName
	});
})

async function init() {
	const res = await axios.get("https://gist.githubusercontent.com/philbarresi/5cf15393d245b38a2d86ce8207d5076c/raw/d529fb474c1af347702ca4d7b992256237fa2819/lab5.json")
	const users = res.data;

	client.setAsync('users', JSON.stringify({users: users})).then(() => {
		console.log('Set initial users.')
	}).catch(err => {
		console.error(err);
	});
}

init();