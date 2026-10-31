'use strict';

const { Router } = require('express');
const { uploadResume } = require('../middleware/upload');
const controller = require('../controllers/analysis.controller');

const router = Router();

router.post('/', uploadResume, controller.createAnalysis);
router.get('/', controller.listAnalyses);
router.get('/:id', controller.getAnalysis);
router.delete('/:id', controller.deleteAnalysis);

module.exports = router;
