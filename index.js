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
		res.status(400).json({error: "id is not a number"})
	} else {
		try {
			//TODO event names should be moved to static string constants file
            const user = await nrpSender.sendMessage({
                redis: redisConnection,
                eventName: "get_user",
                data: userId
            });

            res.json(user);
		} catch (e) {
            res.status(404).json({error: e.message})
		}
	}
});

app.post('/api/people', async (req, res) => {
	const {first_name, last_name, email, gender, ip_address} = req.body;
	if (!first_name || !last_name || !email || !gender || !ip_address) {
		res.status(400).json({error: "One of more of the following fields is missing: 'first_name', 'last_name', 'email', 'gender', 'ip_address'."})
	} else {
		try {
            const user = await nrpSender.sendMessage({
                redis: redisConnection,
                eventName: 'post_user',
                data: req.body
            });

            res.json(user);
		} catch (e) {
			res.status(500).json({error: e.message});
		}
	}
});

app.delete('/api/people/:id', async (req, res) => {
	const userId = parseInt(req.params.id);

	if (isNaN(userId)) {
        res.status(400).json({error: "id is not a number"})
	} else {
		try {
            const response = await nrpSender.sendMessage({
                redis: redisConnection,
                eventName: "delete_user",
                data: {
                    user_id: userId
                }
            });

            res.json({'success': response.message})
		} catch (e) {
			res.status(500).json({error: e.message})
		}
	}
});

app.put('/api/people/:id', async(req, res) => {
    const {first_name, last_name, email, gender, ip_address} = req.body;
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
    	res.status(400).json({error: "id is not a number"});
	} else if (!first_name || !last_name || !email || !gender || !ip_address) {
        res.status(400).json({error: "One of more of the following fields is missing: 'first_name', 'last_name', 'email', 'gender', 'ip_address'."})
	} else {
        try {
            const response = await nrpSender.sendMessage({
                redis: redisConnection,
                eventName: 'put_user',
                data: {
                	userBody: req.body,
					userId
				}
            });

            res.json(response.user);
        } catch (e) {
            res.status(500).json({error: e.message});
        }
	}
});

app.listen(3000, () => console.log(`Example app listening on port 3000!`));