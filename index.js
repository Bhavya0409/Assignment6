const express = require('express');
const Promise = require('bluebird');
const bodyParser = require("body-parser");

const redisConnection = require("./redis-connection");
const nrpSender = require("./nrp-sender-shim");
const app = express();

app.use(bodyParser.json());

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

app.post('/api/people', async (req, res) => {
	const {first_name, last_name, email, gender, ip_address} = req.body;
	if (!first_name || !last_name || !email || !gender || !ip_address) {
		res.status(400).json({error: "One of more of the following fields is missing: 'first_name', 'last_name', 'email', 'gender', 'ip_address'."})
	} else {
		const response = await nrpSender.sendMessage({
			redis: redisConnection,
			eventName: 'post_user',
			data: req.body
		});

		res.json(response.user);
	}
});

app.listen(3000, () => console.log(`Example app listening on port 3000!`))