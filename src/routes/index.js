const { Router } = require('express');

const router = Router();

router.get('/', (request, response) => {
    response.send('api routes default view');
});

module.exports = router;