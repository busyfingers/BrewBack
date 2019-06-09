var express = require('express');
var router = express.Router();
const db = require('../database/db');

/* GET users listing. */
router.get('/', async function(req, res, next) {
    try {
        const result = await db.execQuery('SELECT * FROM Measurements');
        res.send(result).status(200);
    } catch (err) {
        res.send(err).status(500);
    }
});

module.exports = router;
