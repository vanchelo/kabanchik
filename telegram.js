const http = require('https');
const { stringify } = require('querystring');
const { telegram: { token, chatId } } = require('./config.json');

module.exports = function sendMessage({ text }) {
  if (!token || !chatId) {
    return;
  }

  const options = {
    method: 'post',
    host: 'api.telegram.org',
    path: `/bot${token}/sendMessage?chat_id=${chatId}&${stringify({ text })}`,
  };

  http.request(options, function (res) {
    let response = '';
    res.on('data', function (chunk) {
      response += chunk;
    });

    res.on('end', function () {
      // TODO Обработать ответ
      // console.log(response);
    });
  }).end();
};
