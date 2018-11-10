const express = require('express');
const Promise = require('bluebird');

const redisConnection = require("./redis-connection");
const nrpSender = require("./nrp-sender-shim");
const app = express();

app.get('/api/people/:id', async (req, res) => {
	const userId = parseInt(req.params.id);

	if (isNaN(userId)) {
		res.status(400).json({"error": "id is not a number"})
	} else {
		const response = await nrpSender.sendMessage({
			redis: redisConnection,
			eventName: "get_user",
			data: {
				user_id: userId
			}
		});

		if (response.user) {
			res.json(response.user);
		} else {
			res.status(404).json({error: "couldn't find user with that id"})
		}
	}
});

app.listen(3000, () => console.log(`Example app listening on port 3000!`))