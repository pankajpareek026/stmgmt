const express = require('express');
const {
    getAttendances,
    getAttendance,
    addAttendance,
    updateAttendance,
    deleteAttendance
} = require('../controllers/attendance');

const router = express.Router();

router
    .route('/')
    .get(getAttendances)
    .post(addAttendance);

router
    .route('/:id')
    .get(getAttendance)
    .put(updateAttendance)
    .delete(deleteAttendance);

module.exports = router;
