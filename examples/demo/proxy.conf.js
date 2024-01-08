const PROXY_CONFIG = {
  '/kinto/*': {
    target: 'http://localhost:8888',
    pathRewrite: {
      '^/kinto/': '/',
    },
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
  },
};

module.exports = PROXY_CONFIG;
