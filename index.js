const express = require('express');
const Promise = require('bluebird');
const cache = Promise.promisifyAll(require('express-redis-cache')());

const redisConnection = require("./redis-connection");
const app = express();

app.get('/api/people/:id', async (req, res) => {
	redisConnection.emit("create", {message: "Hello, world!"});

	res.json({"hello": "world"})
});

app.listen(3000, () => console.log(`Example app listening on port 3000!`))