const express = require('express');
const auth = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/stats', auth, getDashboardStats);

module.exports = router;
