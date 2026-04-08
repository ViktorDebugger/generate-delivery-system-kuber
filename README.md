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

## Kubernetes (Minikube): демонстраційний сценарій (Windows, PowerShell)

Нижче — послідовність команд для звіту / здачі лаби: розгортання, перевірки, масштабування, балансування, видалення Pod, rolling update. Усі команди з **кореня** репозиторію (підстав свій шлях замість `D:\nulp\zhenyok\delivery-system`).

**Передумови:** [Minikube](https://minikube.sigs.k8s.io/docs/start/), `kubectl`, Docker Desktop (або інший драйвер Minikube). Namespace у маніфестах: **`delivery`**.

### 1. Запуск кластера та розгортання стеку

```powershell
cd D:\nulp\zhenyok\delivery-system
minikube start
.\scripts\build-minikube-images.ps1
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/lab-secrets.yaml
kubectl apply -k k8s/
```

Дочекайся готовності (коли поди щойно створені, може знадобитися 1–3 хвилини):

```powershell
kubectl get pods,svc,deploy -n delivery
kubectl rollout status deployment -n delivery
```

Очікування: у **`catalog-service`** **2** Pod (**`READY 2/2`** у Deployment), решта мікросервісів — по **1** репліці; **postgres**, **redis** — по **1**.

### 2. Доступність сервісів з хоста (`port-forward`)

`ClusterIP` з Windows напряму не відкритий; потрібен **проброс портів**. Кожна команда займає термінал (або запуск у фоні). Приклад — окремі вікна PowerShell:

**Вікно A — api-gateway:**

```powershell
kubectl port-forward -n delivery svc/api-gateway 3000:3000
```

**Вікно B — catalog-service:**

```powershell
kubectl port-forward -n delivery svc/catalog-service 3001:3001
```

Перевірка (третє вікно або тимчасово зупинивши block у A/B):

```powershell
curl.exe -s http://127.0.0.1:3000/health
curl.exe -s http://127.0.0.1:3001/health
```

Опційно **fleet** / **order**:

```powershell
kubectl port-forward -n delivery svc/fleet-service 3002:3002
kubectl port-forward -n delivery svc/order-service 3003:3003
```

Альтернатива шлюзу без `port-forward` на 3000 (NodePort **30080**):

```powershell
$ip = minikube ip
curl.exe -s "http://${ip}:30080/health"
```

### 3. Міжсервісна взаємодія (внутрішній DNS)

Запити **зсередини** кластера до **catalog** і **order**:

```powershell
kubectl run -n delivery curl-tmp --rm -i --restart=Never --image=curlimages/curl:latest -- curl -sS http://catalog-service:3001/health
kubectl run -n delivery curl-tmp --rm -i --restart=Never --image=curlimages/curl:latest -- curl -sS http://order-service:3003/health
```

Перевірка змінної **order → catalog** (URL з ConfigMap):

```powershell
kubectl exec -n delivery deploy/order-service -- printenv CATALOG_SERVICE_URL
```

Повне DNS-ім’я (приклад):

```powershell
kubectl run -n delivery curl-tmp --rm -i --restart=Never --image=curlimages/curl:latest -- curl -sS http://catalog-service.delivery.svc.cluster.local:3001/health
```

### 4. Підключення до Redis

Ping з тимчасового пода:

```powershell
kubectl run -n delivery redis-tmp --rm -i --restart=Never --image=redis:7-alpine -- redis-cli -h redis ping
```

Очікування: **`PONG`**.

Логи **catalog-service** (підключення кешу до Redis):

```powershell
kubectl logs -n delivery deploy/catalog-service --tail=200 --all-containers=true | Select-String -Pattern "CatalogCacheConnectivity|Redis"
```

Шукай рядок на кшталт **`Catalog cache: Redis connection OK.`**

### 5. Масштабування (збільшення реплік)

Підняти, наприклад, **4** репліки **catalog-service**:

```powershell
kubectl scale deployment/catalog-service -n delivery --replicas=4
kubectl get pods -n delivery -l app=catalog-service
kubectl rollout status deployment/catalog-service -n delivery --timeout=300s
kubectl wait --for=condition=ready pod -l app=catalog-service -n delivery --timeout=300s
```

Повернути як у маніфесті (**2** репліки):

```powershell
kubectl scale deployment/catalog-service -n delivery --replicas=2
```

### 6. Балансування навантаження (кілька реплік)

У кластері для **catalog** увімкнено **`DEV_POD_IDENTITY=true`**: **`GET /dev/pod-identity`** повертає **`hostname`** (ім’я Pod). Потрібні **≥2** репліки та **port-forward** на **catalog** (див. п. 2, порт **3001**).

```powershell
1..24 | ForEach-Object { curl.exe -s "http://127.0.0.1:3001/dev/pod-identity" }
(1..30 | ForEach-Object { curl.exe -s "http://127.0.0.1:3001/dev/pod-identity" }) | Sort-Object -Unique
```

У другому виводі очікуються **різні** значення **`hostname`** — трафік через **Service** розподіляється між Pod.

**Кеш `GET /api/categories/:id`**: кеш спільний через **Redis**. Після POST (отримай **`$id`**) два GET по **`/api/categories/$id`** з **тим самим** UUID; для стабільного ефекту переконайся, що **`$id`** не порожній (див. розділ HTTP вище). Якщо **Redis вимкнено** в Pod, кеш лише in-memory — при кількох репліках запити можуть йти на **різні** Pod і час обох GET залишиться схожим.

### 7. Видалення Pod і відновлення

```powershell
kubectl get pods -n delivery -l app=catalog-service
kubectl delete pod <імя-одного-пода> -n delivery
kubectl get pods -n delivery -l app=catalog-service
kubectl get endpoints catalog-service -n delivery
```

**ReplicaSet** створить новий Pod; **Service** **`catalog-service`** лишається, оновлюються **Endpoints**.

### Rolling update (новий tag образу)

Збірка образу з тегом **v2** і оновлення Deployment:

```powershell
minikube image build -t delivery-system/catalog-service:v2 -f apps/catalog-service/Dockerfile apps/catalog-service
kubectl set image deployment/catalog-service catalog-service=delivery-system/catalog-service:v2 -n delivery
kubectl rollout status deployment/catalog-service -n delivery
kubectl rollout history deployment/catalog-service -n delivery
```

Відкат на попередню ревізію:

```powershell
kubectl rollout undo deployment/catalog-service -n delivery
kubectl rollout status deployment/catalog-service -n delivery
```

Після лаби образи з тегом **`local`** знову узгоджені з YAML, якщо повернеш **`kubectl set image … :local`** або перезастосуєш маніфести.

### Перегляд згенерованих маніфестів (Kustomize)

```powershell
kubectl kustomize k8s/
```

### Зупинка

```powershell
minikube stop
```

(Образи всередині Minikube збережуться до **`minikube delete`**.)

### Для розділу «Аналіз» у звіті (орієнтири)

- **Deployment** у Kubernetes керує ReplicaSet і бажаною кількістю Pod, оновленнями (rolling update) та історією ревізій; **docker-compose** масштабує через `deploy.replicas` лише в межах одного хоста без вбудованої історії rollout/undo на рівні API кластера.
- **Service (ClusterIP)** дає стабільний DNS і IP всередині кластера; трафік розподіляється між Pod (kube-proxy). У compose сервіси резолвляться іменами в одній мережі Docker **на одному вузлі**.
- **Оркестрація (K8s)** додає самовідновлення Pod, горизонтальне масштабування, rolling update, декларативні маніфести та ізоляцію namespace — це дорожче в навчанні, ніж один compose-файл, але потрібно для продакшен-подібних сценаріїв.

---

## Відповідність типовим лабораторним завданням (коротко)

| Задача | Як закрито в репозиторії |
|--------|---------------------------|
| Kubernetes / Minikube (лаба) | Каталог **`k8s/`**, **`lab-secrets.yaml`**, скрипт **`scripts/build-minikube-images.ps1`**, розділ **«Kubernetes (Minikube): демонстраційний сценарій»** вище. |
| Кеш мікросервісу | **catalog-service**, GET `/api/categories/:id` (NestJS `@nestjs/cache-manager` + Redis, не Spring). |
| Redis у Docker | Сервіс **`redis`** у `docker-compose.yml`. |
| Політика очищення | TTL (~90 с) + інвалідація ключа після зміни/видалення категорії. |
| Dockerfile | У кожного з `apps/*/Dockerfile` (gateway, catalog, fleet, order). |
| Збірка та compose | `docker compose up -d --build`. |

**Контейнеризація** зручна для однакового оточення на машинах студентів, ізольованих сервісів і простого підключення БД/Redis за іменами (`postgres`, `redis`). **Кеш** зменшує навантаження на БД і час обробки повторних читань однієї сутності (що видно по `TOTAL_TIME` двох послідовних GET до `:3001`).
