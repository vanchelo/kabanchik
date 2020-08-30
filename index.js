const fs = require('fs');
const http = require('https');
const { authCookie, channels, checkInterval } = require('./config.json');
const { sendMessage: sms } = require('./sms');
const { sendMessage: telegram } = require('./telegram');
const category = +process.argv[2];

// При первом запуске собираем новые задачи без отправки уведомлений
let isFirstCheck = true;

//
// Пример использования программы
//
const cmdExample = `
Использование:
  node index.js category

Параметры:
  category - Идентификатор отслеживаемой категории.
             https://kiev.kabanchik.ua/cabinet/all-tasks?page=1&category=212
                                                                         ^^^
Пример:
  node index.js 212
`;

if (!authCookie) {
  console.log('Не задана кука авторизации!');
  console.log(cmdExample);

  process.exit();
}

if (!category) {
  console.log('Не задана категория!');
  console.log(cmdExample);

  process.exit();
}

if (!fs.existsSync(`./tasks-${category}.json`)) {
  writeCheckedTasks();
}

//
// Старт процесса проверки на новые задачи
//
check();

function checkForNewTasks({ authCookie, category }) {
  let checkedTasks = readCheckedTasks();

  const options = {
    type: 'get',
    host: 'kiev.kabanchik.ua',
    path: `/cabinet/all-tasks?page=1&category=${category}`,
    headers: {
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'ru,en-US;q=0.9,en;q=0.8,uk;q=0.7',
      'cache-control': 'no-cache',
      'pragma': 'no-cache',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-requested-with': 'XMLHttpRequest',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36',
      'referrer': 'https://kiev.kabanchik.ua/cabinet/category/santehnik',
      'referrerPolicy': 'no-referrer-when-downgrade',
      'cookie': `auth=${authCookie}`,
    },
  };

  return new Promise(function (resolve) {
    http
      .request(options, function (res) {
        let response = '';
        res.on('data', function (chunk) {
          response += chunk;
        });

        res
          .on('end', function () {
            let result;
            try {
              result = JSON.parse(response);
            } catch (e) {
              console.log('Необходимо обновить куку авторизации!');

              process.exit();
            }

            const notArchivedTasks = result
              .items
              .filter(({ archived }) => !archived);
            const newTasks = notArchivedTasks
              .filter(({ id }) => !checkedTasks.has(id));

            checkedTasks = new Set([...checkedTasks, ...newTasks.map(({ id }) => id)]);

            writeCheckedTasks(checkedTasks);

            resolve(newTasks);
          });
      })
      .on('error', ({ code } = { code: 'EUNKNOWN' }) => {
        if (code === 'ENOTFOUND') {
          console.log(new Date().toISOString(), 'Нет интернет соединения.');
        } else {
          console.log(new Date().toISOString(), 'Неизвестная ошибка: ', code);
        }

        resolve(null);
      })
      .end();
  });
}

function check() {
  checkForNewTasks({ authCookie, category })
    .then((tasks) => {
      if (tasks == null) {
        return;
      }

      if (tasks.length > 0) {
        if (!isFirstCheck) {
          notify(tasks);
        }
      }

      isFirstCheck = false;
    })
    .finally(() => {
      setTimeout(function () {
        check();

        // Проверяем на новые задачи раз в n минут.
        // Случайное значение от "checkInterval.min" до "checkInterval.max".
        // По умолчанию в интервале от 2 до 5 мин.
      }, rand(checkInterval.min, checkInterval.max) * 60 * 1000);
    });
}

function notify(tasks) {
  if (channels.console) {
    console.log(new Date().toISOString());
    console.log(tasks.map((task) => task.url).join('\n'));
  }

  //
  // Отправляем уведомления в Telegram
  //
  if (channels.telegram) {
    const text = tasks.map((task) => task.url).join('\n');

    telegram({ text });
  }

  //
  // Отправляем уведомления на телефон как СМС
  //
  if (channels.sms) {
    const text = tasks.map(task => task.url).join('\n');

    sms({ text });
  }
}

function writeCheckedTasks(tasks = []) {
  return fs.writeFileSync(`./tasks-${category}.json`, JSON.stringify([...tasks], null, 2), 'utf8');
}

function readCheckedTasks() {
  try {
    return new Set(JSON.parse(fs.readFileSync(`./tasks-${category}.json`, 'utf8')));
  } catch (e) {
    return new Set();
  }
}

function rand(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}
