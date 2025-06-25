# Пошаговая инструкция по установке Free Search Node

## Метод 1: Установка через npm (Рекомендуется)

### Шаг 1: Остановите n8n
```bash
# Если n8n запущен как сервис
sudo systemctl stop n8n

# Или просто закройте процесс n8n в терминале (Ctrl+C)
```

### Шаг 2: Установите пакет
```bash
# Глобальная установка (если n8n установлен глобально)
npm install -g n8n-nodes-free-search

# Или локальная установка в директории проекта
cd /path/to/your/n8n/project
npm install n8n-nodes-free-search
```

### Шаг 3: Настройте переменные окружения (опционально)
```bash
# Добавьте в ~/.bashrc или ~/.zshrc
export N8N_CUSTOM_EXTENSIONS="/path/to/node_modules/n8n-nodes-free-search"
```

### Шаг 4: Запустите n8n
```bash
n8n start
```

## Метод 2: Ручная установка из исходного кода

### Шаг 1: Создайте структуру папок
```bash
mkdir -p ~/.n8n/custom/n8n-nodes-free-search
cd ~/.n8n/custom/n8n-nodes-free-search
```

### Шаг 2: Скопируйте файлы
Поместите все созданные файлы в соответствующие папки:

```
~/.n8n/custom/n8n-nodes-free-search/
├── nodes/
│   └── FreeSearch/
│       └── FreeSearch.node.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Шаг 3: Установите зависимости
```bash
cd ~/.n8n/custom/n8n-nodes-free-search
npm install
```

### Шаг 4: Компилируйте TypeScript
```bash
npm run build
```

### Шаг 5: Настройте n8n для использования кастомных нод
Добавьте в файл настроек n8n (обычно `~/.n8n/config/index.js`):

```javascript
module.exports = {
  nodes: {
    include: [
      '~/.n8n/custom/n8n-nodes-free-search/dist/nodes/**/*.node.js'
    ]
  }
}
```

## Метод 3: Docker установка

### Создайте Dockerfile
```dockerfile
FROM n8nio/n8n:latest

USER root

# Установка дополнительных зависимостей
RUN npm install -g n8n-nodes-free-search

USER node

# Настройка кастомных нод
ENV N8N_CUSTOM_EXTENSIONS=/usr/local/lib/node_modules/n8n-nodes-free-search
```

### Соберите и запустите контейнер
```bash
docker build -t n8n-with-free-search .
docker run -p 5678:5678 n8n-with-free-search
```

## Проверка установки

### Шаг 1: Откройте n8n интерфейс
Перейдите по адресу `http://localhost:5678`

### Шаг 2: Создайте новый workflow
Нажмите "New Workflow"

### Шаг 3: Найдите ноду
В списке нод найдите секцию "Transform" или используйте поиск "Free Search"

### Шаг 4: Тестовый запуск
1. Добавьте ноду Free Search
2. Настройте базовые параметры:
   - Query: "test search"
   - Search Engine: "duckduckgo"
   - Max Results: 5
3. Запустите workflow

## Устранение проблем установки

### Проблема: Нода не появляется в списке

**Решение 1: Проверьте пути**
```bash
# Убедитесь, что файлы находятся в правильных директориях
ls -la ~/.n8n/custom/n8n-nodes-free-search/dist/nodes/
```

**Решение 2: Проверьте права доступа**
```bash
# Установите правильные права
chmod -R 755 ~/.n8n/custom/n8n-nodes-free-search/
```

**Решение 3: Очистите кэш n8n**
```bash
rm -rf ~/.n8n/cache/
```

### Проблема: Ошибки при компиляции TypeScript

**Решение: Обновите зависимости**
```bash
cd ~/.n8n/custom/n8n-nodes-free-search
npm update
npm audit fix
```

### Проблема: Ошибки сети при выполнении поиска

**Решение 1: Проверьте подключение к интернету**
```bash
curl -I https://duckduckgo.com
```

**Решение 2: Настройте прокси (если необходимо)**
```bash
export HTTP_PROXY=http://proxy-server:port
export HTTPS_PROXY=http://proxy-server:port
```

## Настройка для продакшн использования

### Оптимизация производительности

1. **Настройка тайм-аутов**
```javascript
// В конфигурации n8n
module.exports = {
  executions: {
    timeout: 300, // 5 минут
    maxTimeout: 3600 // 1 час максимум
  }
}
```

2. **Настройка кэширования**
```javascript
// Добавьте кэширование результатов поиска
module.exports = {
  cache: {
    backend: 'redis', // или 'memory'
    redis: {
      host: 'localhost',
      port: 6379
    }
  }
}
```

### Мониторинг и логирование

1. **Включите детальное логирование**
```bash
export N8N_LOG_LEVEL=debug
export N8N_LOG_OUTPUT=console,file
export N8N_LOG_FILE=/var/log/n8n/n8n.log
```

2. **Настройте ротацию логов**
```bash
# Создайте logrotate конфигурацию
sudo nano /etc/logrotate.d/n8n

/var/log/n8n/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 n8n n8n
}
```

## Автоматическое обновление

### Создайте скрипт обновления
```bash
#!/bin/bash
# update-free-search-node.sh

echo "Updating Free Search Node..."

# Остановка n8n
sudo systemctl stop n8n

# Обновление пакета
npm update -g n8n-nodes-free-search

# Очистка кэша
rm -rf ~/.n8n/cache/

# Запуск n8n
sudo systemctl start n8n

echo "Update completed!"
```

### Настройте cron для автоматических обновлений
```bash
# Добавьте в crontab (crontab -e)
0 2 * * 0 /path/to/update-free-search-node.sh
```

Эта установка обеспечит стабильную работу ноды в вашей среде n8n и позволит эффективно использовать её для AI агентов.