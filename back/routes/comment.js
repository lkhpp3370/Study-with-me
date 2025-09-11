const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

router.get('/:studyId', commentController.getComments);
router.post('/:studyId', commentController.createComment);
router.delete('/:commentId', commentController.deleteComment);

module.exports = router;
