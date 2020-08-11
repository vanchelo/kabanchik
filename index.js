const fs = require('fs');
const http = require('https');
const { channels } = require('./config.json');
const sms = require('./sms');
const telegram = require('./telegram');
const authCookie = process.argv[2];
const category = +process.argv[3];

const writeCheckedTasks = (tasks = []) => fs.writeFileSync('./tasks-' + category + '.json', JSON.stringify([...tasks], null, 2), 'utf8');
const readCheckedTasks = () => {
  try {
    return new Set(JSON.parse(fs.readFileSync('./tasks-' + category + '.json', 'utf8')));
  } catch (e) {
    return new Set();
  }
};

const cmdExample = `
Использование:
  node index.js auth_cookie category

Параметры:
  auth_cookie - Значение куки которую устанавливает Кабанчик после успешной авторизации.
                Можно найти в Dev Tools → Storage → Cookies → "auth".
  category    - Идентификатор отслеживаемой категории.
                https://kiev.kabanchik.ua/cabinet/all-tasks?page=1&category=212
                                                                            ^^^
Пример:
  node index.js xyz 212
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

if (!fs.existsSync('./tasks-' + category + '.json')) {
  writeCheckedTasks();
}

//
// URL: https://kiev.kabanchik.ua/cabinet/all-tasks?page=1&category=212
//

function checkForNewTasks({ authCookie, category }) {
  let checkedTasks = readCheckedTasks();

  const options = {
    type: 'get',
    host: 'kiev.kabanchik.ua',
    path: `/cabinet/all-tasks?page=1&category=${category}`,
    headers: {
      'x-requested-with': 'XMLHttpRequest',
      cookie: `auth=${authCookie}`,
    },
  };

  return new Promise(function (resolve) {
    http.request(options, function (res) {
      let response = '';
      res.on('data', function (chunk) {
        response += chunk;
      });

      res.on('end', function () {
        let result;
        try {
          result = JSON.parse(response);
        } catch (e) {
          console.log('Нужно обновить куку авторизации!');

          process.exit();
        }

        const notArchivedTasks = result
          .items
          .filter(({ archived }) => !archived);
        const newTasks = notArchivedTasks
          .filter(({ id }) => !checkedTasks.has(id));

        checkedTasks = new Set([...checkedTasks, ...newTasks.map(task => task.id)]);

        writeCheckedTasks(checkedTasks);

        resolve(newTasks);
      });
    }).end();
  });
}

let isFirstCheck = true;

function check() {
  checkForNewTasks({ authCookie, category }).then((tasks) => {
    if (tasks.length > 0) {
      console.log(new Date(), `Найдены новые задачи: ${tasks.length}`);

      if (!isFirstCheck) {
        notify(tasks);
      }
    }

    isFirstCheck = false;
  });

  setTimeout(function () {
    check();
  }, 5 * 60 * 1000); // Проверяем на новые задачи раз в 5 мин
}

function notify(tasks) {
  if (channels.telegram) {
    telegram({ text: 'Найдены новые задания' });

    const text = tasks.map((task) => {
      return `${task.title}
${task.url}
${task.cost}`;
    }).join('\n\n');

    telegram({ text });
  }

  if (channels.sms) {
    const text = tasks.map(task => task.url).join('\n');

    sms({ text });
  }
}

//
// Старт процесса проверки на новые задачи
//
check();
