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