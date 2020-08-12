const http = require('https');
const { stringify } = require('querystring');
const { telegram: { token, chatId } } = require('./config.json');

module.exports = sendMessage;

function sendMessage({ text }) {
  if (!token || !chatId) {
    return;
  }

  const options = {
    method: 'post',
    host: 'api.telegram.org',
    path: `/bot${token}/sendMessage?chat_id=1${chatId}&${stringify({ text })}`,
  };

  http.request(options, function (res) {
    let response = '';
    res.on('data', function (chunk) {
      response += chunk;
    });

    res.on('end', function () {
      if (res.statusCode !== 200) {
        const { description } = JSON.parse(response);

        console.log('[telegram]', description);
      }
    });
  }).end();
}
