const { createHandler } = require('@app-core/server');
const mongoose = require('mongoose');

module.exports = createHandler({
  path: '/health',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      data: {
        status: 'ok',
        db: dbStatus,
        timestamp: Date.now(),
      },
    };
  },
});
