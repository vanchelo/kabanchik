# Kabanchik new task checker

### Требования
- Node.js >= 10

### Подготовка
1. Создаем конфиг.
    ```bash
    cp config.example.json config.json
    ```
2. Настраиваем отправку SMS. Заходим в аккаунт https://atomic.center/settings/ → API. Копируем и добавляем в конфиг публичный и приватный ключи.
3. Настраиваем отправку в Telegram.

### Использование
```bash
node index.js auth_cookie category
```

### Параметры:
- **auth_cookie** - Значение куки которую устанавливает Кабанчик после успешной авторизации. Можно найти в `Dev Tools → Storage → Cookies → "auth"`.
- **category** - Идентификатор отслеживаемой категории.
    Можно найти в `Dev Tools → Network` открыв нужную категорию. Искать в запросе `all-tasks`.
    ```
    https://kiev.kabanchik.ua/cabinet/all-tasks?page=1&category=212
                                                                ^^^
    ```
### Пример
```bash
node index.js xyz 212
```

### Дополнительная информация

Категории:
- 212 - Установка и замена фильтров для воды
- 1121 - Сантехнические услуги
