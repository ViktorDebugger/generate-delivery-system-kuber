# delivery-system

Монорепозиторій мікросервісів (NestJS): **api-gateway**, **catalog-service** (кеш категорій у Redis), **fleet-service**, **order-service**, **PostgreSQL**, **Redis**. Нижче — запуск у Docker, перевірка Redis, тести та HTTP-запити з JSON у **Windows** (PowerShell).

## Що знадобиться

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (WSL2 увімкнено за рекомендаціями Docker).
- [Node.js](https://nodejs.org/) (LTS) — для локальних тестів без повного стеку або для `npm test` з кореня.

У PowerShell перейди в корінь репозиторію:

```powershell
cd D:\nulp\zhenyok\delivery-system
```

(заміни шлях на свій).

---

## Запуск системи в Docker

Підняти БД, Redis і всі сервіси, зібрати образи:

```powershell
docker compose up -d --build
```

Зачекай, поки контейнери стануть **healthy** (особливо `postgres` і `redis`). Переглянути статус:

```powershell
docker compose ps
```

Зупинити:

```powershell
docker compose down
```

Основні порти на хості: **3000** (gateway), **3001** (catalog), **3002** (fleet), **3003** (order), **5432** (Postgres), **6379** (Redis).

---

## Minikube: збірка образів для Kubernetes (Windows, PowerShell)

Щоб Kubernetes у Minikube бачив образи без зовнішнього registry, зберігай їх у **Docker daemon самого Minikube**.

**Передумови:** встановлені [Minikube](https://minikube.sigs.k8s.io/docs/start/) і `kubectl`, запущений гіпервізор / Docker (залежно від драйвера Minikube).

### 1) Запуск кластера

```powershell
minikube start
```

### 2а) Варіант A — перемкнути поточний PowerShell на Docker Minikube (рекомендовано)

Після цієї команди **`docker build`** і **`docker images`** стосуються кластера Minikube, а не Docker Desktop (поки не скинеш контекст).

```powershell
minikube docker-env | Invoke-Expression
```

З **кореня репозиторію** `delivery-system`:

```powershell
docker build -t delivery-system/catalog-service:local -f apps/catalog-service/Dockerfile apps/catalog-service
docker build -t delivery-system/fleet-service:local -f apps/fleet-service/Dockerfile apps/fleet-service
docker build -t delivery-system/order-service:local -f apps/order-service/Dockerfile apps/order-service
docker build -t delivery-system/api-gateway:local -f apps/api-gateway/Dockerfile apps/api-gateway
```

Переконатися, що теги є всередині Minikube:

```powershell
minikube image ls | Select-String delivery-system
```

Повернути Docker CLI до звичайного десктопного daemon (опційно):

```powershell
minikube docker-env -u | Invoke-Expression
```

### 2б) Варіант B — `minikube image build` (без `docker-env`)

Кожна збірка виконується в середовищі Minikube; контекст — каталог сервісу:

```powershell
minikube image build -t delivery-system/catalog-service:local -f apps/catalog-service/Dockerfile apps/catalog-service
minikube image build -t delivery-system/fleet-service:local -f apps/fleet-service/Dockerfile apps/fleet-service
minikube image build -t delivery-system/order-service:local -f apps/order-service/Dockerfile apps/order-service
minikube image build -t delivery-system/api-gateway:local -f apps/api-gateway/Dockerfile apps/api-gateway
```

Те саме одним скриптом (корінь репозиторію; опційно інший тег: `.\scripts\build-minikube-images.ps1 -Tag v2`):

```powershell
.\scripts\build-minikube-images.ps1
```

На **Windows** скрипт за замовчуванням підключає **`minikube docker-env`** і викликає **`docker build`** (без проблемних зворотних слішів у `minikube image build`). Якщо потрібен саме **`minikube image build`**: `.\scripts\build-minikube-images.ps1 -MinikubeNative` (шляхи до Dockerfile передаються з `/`).

Або подвійний клік / cmd: `scripts\build-minikube-images.cmd`.

Якщо зʼявляється помилка шляху на Windows, виконуй команди з кореня репозиторію (як вище).

### Kubernetes-маніфести

У `Deployment` для локальних тегів зазвичай вказують `image: delivery-system/catalog-service:local` та **`imagePullPolicy: IfNotPresent`** або **`Never`**, щоб kubelet не намагався тягнути образ із registry.

**ConfigMap, Secret, PostgreSQL і Redis у кластері**: каталог **`k8s/`** — `namespace.yaml`, `postgres-*`, `redis-*`, `configmap.yaml`, **`lab-secrets.yaml`** (навчальні фіксовані паролі як у compose), шаблони `*-secret.yaml.example`, інструкція **`k8s/README.md`**. Для власних паролів: `*.local.yaml` (у `.gitignore`) або `kubectl create secret`.

---

## Перевірка Redis у терміналі (Windows)

Переконатися, що Redis у контейнері відповідає:

```powershell
docker compose exec redis redis-cli ping
```

Очікувана відповідь: `PONG`.

Додатково (приклад ключа після роботи catalog; префікс залежить від клієнта Keyv):

```powershell
docker compose exec redis redis-cli keys "*categories*"
```

Якщо `redis-cli` встановлений на Windows окремо, можна також (при проброшеному `6379`):

```powershell
redis-cli -h 127.0.0.1 -p 6379 ping
```

(частіше достатньо лише `docker compose exec`.)

**catalog-service** у compose очікує Redis за хостом `redis` усередині мережі Docker. Якщо Redis недоступний, сервіс падає на старті з чітким логом. Для локального запуску **без** Redis можна виставити `REDIS_DISABLED=true` (див. `apps/catalog-service/.env.example`) — не для продакшену.

---

## Тестування (Windows)

### Лише catalog-service (інключи кеш: інтеграційний тест без Redis)

З кореня:

```powershell
npm test --prefix apps/catalog-service
```

Або:

```powershell
cd apps\catalog-service
npm test
```

Тут перевіряється в тому числі кеш **GET** категорії за `id` (другий HTTP GET не дублює виклик репозиторію).

### Повний прогін з кореня репозиторію

```powershell
npm test
```

Скрипт `scripts/run-tests.mjs` послідовно запускає **unit** і **e2e** для catalog, fleet, order та **integration** для api-gateway. Для **e2e** потрібні робочий **PostgreSQL** і змінні в `apps/<сервіс>/.env` (скопіюй з `.env.example` і підправ `DATABASE_URL`). У **catalog-service** перед e2e автоматично виконується **`prisma migrate deploy`** (`test/global-setup-e2e.cjs`), щоб таблиці відповідали схемі. У **catalog-service** e2e за замовчуванням вмикає **`REDIS_DISABLED=true`** у `test/setup-e2e.ts`, щоб не вимагати Redis; щоб прогнати e2e з реальним Redis, встанови змінну оточення **`CATALOG_E2E_REDIS=1`** і підніми Redis на `127.0.0.1:6379`.

### Окремо e2e catalog-service

Потрібен **PostgreSQL** на хості з `DATABASE_URL` (перед тестами підніми compose з **кореня** репозиторію):

```powershell
docker compose up -d postgres
cd apps\catalog-service
npm run test:e2e
```

---

## HTTP-запити з JSON (PowerShell, `curl.exe`)

Використовуй **`curl.exe`**, щоб уникнути псевдоніма `curl` → `Invoke-WebRequest`.

### Створити категорію (POST, JSON)

```powershell
curl.exe -s -X POST http://localhost:3001/api/categories `
  -H "Content-Type: application/json" `
  -d "{\"name\":\"Probe\",\"description\":\"from JSON\"}"
```

Відповідь — JSON із полем `id` (UUID).

### Отримати категорію за id (GET)

Підстав повернутий `id`:

```powershell
curl.exe -s http://localhost:3001/api/categories/ТВІЙ-UUID-ID
```

### Перевірка часу відповіді (кеш: другий запит зазвичай швидший)

Після POST зручно витягнути `id` в змінну:

```powershell
$json = curl.exe -s -X POST http://localhost:3001/api/categories `
  -H "Content-Type: application/json" `
  -d "{\"name\":\"TimingTest\"}"
$id = ($json | ConvertFrom-Json).id

curl.exe -w "`nTOTAL_TIME %{time_total}s`n" -s -o NUL "http://localhost:3001/api/categories/$id"
curl.exe -w "`nTOTAL_TIME %{time_total}s`n" -s -o NUL "http://localhost:3001/api/categories/$id"
```

Порівняй два рядки `TOTAL_TIME` — другий часто суттєво менший, коли запис вже в Redis.

### Через API gateway

Префікс для catalog: **`/api/catalog/...`** на порт **3000**:

```powershell
curl.exe -s -X POST http://localhost:3000/api/catalog/categories `
  -H "Content-Type: application/json" `
  -d "{\"name\":\"ViaGateway\"}"
```

Кеш як і раніше лише в **catalog-service**; час через шлюз може відрізнятися менш помітно через додатковий хоп.

---

## Відповідність типовим лабораторним завданням (коротко)

| Задача | Як закрито в репозиторії |
|--------|---------------------------|
| Кеш мікросервісу | **catalog-service**, GET `/api/categories/:id` (NestJS `@nestjs/cache-manager` + Redis, не Spring). |
| Redis у Docker | Сервіс **`redis`** у `docker-compose.yml`. |
| Політика очищення | TTL (~90 с) + інвалідація ключа після зміни/видалення категорії. |
| Dockerfile | У кожного з `apps/*/Dockerfile` (gateway, catalog, fleet, order). |
| Збірка та compose | `docker compose up -d --build`. |

**Контейнеризація** зручна для однакового оточення на машинах студентів, ізольованих сервісів і простого підключення БД/Redis за іменами (`postgres`, `redis`). **Кеш** зменшує навантаження на БД і час обробки повторних читань однієї сутності (що видно по `TOTAL_TIME` двох послідовних GET до `:3001`).
