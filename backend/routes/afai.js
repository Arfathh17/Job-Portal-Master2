const express = require('express');
const afaiController = require('../controllers/afaiController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/start', optionalAuth, (req, res) => afaiController.startSession(req, res));
router.post('/', optionalAuth, (req, res) => afaiController.sendMessage(req, res));
router.post('/answer', optionalAuth, (req, res) => afaiController.sendMessage(req, res));
router.post('/stream', optionalAuth, (req, res) => afaiController.streamMessage(req, res));
router.post('/summary', optionalAuth, (req, res) => afaiController.summarize(req, res));

module.exports = router;
