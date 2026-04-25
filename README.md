# delivery-system

ÐœÐ¾Ð½Ð¾Ñ€ÐµÐ¿Ð¾Ð·Ð¸Ñ‚Ð¾Ñ€Ñ–Ð¹ Ð¼Ñ–ÐºÑ€Ð¾ÑÐµÑ€Ð²Ñ–ÑÑ–Ð² (NestJS): **api-gateway**, **catalog-service** (ÐºÐµÑˆ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ñ–Ð¹ Ñƒ Redis), **fleet-service**, **order-service**, **PostgreSQL**, **Redis**. ÐÐ¸Ð¶Ñ‡Ðµ â€” Ð·Ð°Ð¿ÑƒÑÐº Ñƒ Docker, Ð¿ÐµÑ€ÐµÐ²Ñ–Ñ€ÐºÐ° Redis, Ñ‚ÐµÑÑ‚Ð¸ Ñ‚Ð° HTTP-Ð·Ð°Ð¿Ð¸Ñ‚Ð¸ Ð· JSON Ñƒ **Windows** (PowerShell).

## Ð©Ð¾ Ð·Ð½Ð°Ð´Ð¾Ð±Ð¸Ñ‚ÑŒÑÑ

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (WSL2 ÑƒÐ²Ñ–Ð¼ÐºÐ½ÐµÐ½Ð¾ Ð·Ð° Ñ€ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ñ–ÑÐ¼Ð¸ Docker).
- [Node.js](https://nodejs.org/) (LTS) â€” Ð´Ð»Ñ Ð»Ð¾ÐºÐ°Ð»ÑŒÐ½Ð¸Ñ… Ñ‚ÐµÑÑ‚Ñ–Ð² Ð±ÐµÐ· Ð¿Ð¾Ð²Ð½Ð¾Ð³Ð¾ ÑÑ‚ÐµÐºÑƒ Ð°Ð±Ð¾ Ð´Ð»Ñ `npm test` Ð· ÐºÐ¾Ñ€ÐµÐ½Ñ.

Ð£ PowerShell Ð¿ÐµÑ€ÐµÐ¹Ð´Ð¸ Ð² ÐºÐ¾Ñ€Ñ–Ð½ÑŒ Ñ€ÐµÐ¿Ð¾Ð·Ð¸Ñ‚Ð¾Ñ€Ñ–ÑŽ:

```powershell
cd D:\nulp\zhenyok\delivery-system
```

(Ð·Ð°Ð¼Ñ–Ð½Ð¸ ÑˆÐ»ÑÑ… Ð½Ð° ÑÐ²Ñ–Ð¹).

---

## Ð—Ð°Ð¿ÑƒÑÐº ÑÐ¸ÑÑ‚ÐµÐ¼Ð¸ Ð² Docker

ÐŸÑ–Ð´Ð½ÑÑ‚Ð¸ Ð‘Ð”, Redis Ñ– Ð²ÑÑ– ÑÐµÑ€Ð²Ñ–ÑÐ¸, Ð·Ñ–Ð±Ñ€Ð°Ñ‚Ð¸ Ð¾Ð±Ñ€Ð°Ð·Ð¸:

```powershell
docker compose up -Body --build
```

Ð—Ð°Ñ‡ÐµÐºÐ°Ð¹, Ð¿Ð¾ÐºÐ¸ ÐºÐ¾Ð½Ñ‚ÐµÐ¹Ð½ÐµÑ€Ð¸ ÑÑ‚Ð°Ð½ÑƒÑ‚ÑŒ **healthy** (Ð¾ÑÐ¾Ð±Ð»Ð¸Ð²Ð¾ `postgres` Ñ– `redis`). ÐŸÐµÑ€ÐµÐ³Ð»ÑÐ½ÑƒÑ‚Ð¸ ÑÑ‚Ð°Ñ‚ÑƒÑ:

```powershell
docker compose ps
```

Ð—ÑƒÐ¿Ð¸Ð½Ð¸Ñ‚Ð¸:

```powershell
docker compose down
```

ÐžÑÐ½Ð¾Ð²Ð½Ñ– Ð¿Ð¾Ñ€Ñ‚Ð¸ Ð½Ð° Ñ…Ð¾ÑÑ‚Ñ–: **3000** (gateway), **3001** (catalog), **3002** (fleet), **3003** (order), **5432** (Postgres), **6379** (Redis).

---

## Minikube: Ð·Ð±Ñ–Ñ€ÐºÐ° Ð¾Ð±Ñ€Ð°Ð·Ñ–Ð² Ð´Ð»Ñ Kubernetes (Windows, PowerShell)

Ð©Ð¾Ð± Kubernetes Ñƒ Minikube Ð±Ð°Ñ‡Ð¸Ð² Ð¾Ð±Ñ€Ð°Ð·Ð¸ Ð±ÐµÐ· Ð·Ð¾Ð²Ð½Ñ–ÑˆÐ½ÑŒÐ¾Ð³Ð¾ registry, Ð·Ð±ÐµÑ€Ñ–Ð³Ð°Ð¹ Ñ—Ñ… Ñƒ **Docker daemon ÑÐ°Ð¼Ð¾Ð³Ð¾ Minikube**.

**ÐŸÐµÑ€ÐµÐ´ÑƒÐ¼Ð¾Ð²Ð¸:** Ð²ÑÑ‚Ð°Ð½Ð¾Ð²Ð»ÐµÐ½Ñ– [Minikube](https://minikube.sigs.k8s.io/docs/start/) Ñ– `kubectl`, Ð·Ð°Ð¿ÑƒÑ‰ÐµÐ½Ð¸Ð¹ Ð³Ñ–Ð¿ÐµÑ€Ð²Ñ–Ð·Ð¾Ñ€ / Docker (Ð·Ð°Ð»ÐµÐ¶Ð½Ð¾ Ð²Ñ–Ð´ Ð´Ñ€Ð°Ð¹Ð²ÐµÑ€Ð° Minikube).

### 1) Ð—Ð°Ð¿ÑƒÑÐº ÐºÐ»Ð°ÑÑ‚ÐµÑ€Ð°

```powershell
minikube start
```

### 2Ð°) Ð’Ð°Ñ€Ñ–Ð°Ð½Ñ‚ A â€” Ð¿ÐµÑ€ÐµÐ¼ÐºÐ½ÑƒÑ‚Ð¸ Ð¿Ð¾Ñ‚Ð¾Ñ‡Ð½Ð¸Ð¹ PowerShell Ð½Ð° Docker Minikube (Ñ€ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð¾Ð²Ð°Ð½Ð¾)

ÐŸÑ–ÑÐ»Ñ Ñ†Ñ–Ñ”Ñ— ÐºÐ¾Ð¼Ð°Ð½Ð´Ð¸ **`docker build`** Ñ– **`docker images`** ÑÑ‚Ð¾ÑÑƒÑŽÑ‚ÑŒÑÑ ÐºÐ»Ð°ÑÑ‚ÐµÑ€Ð° Minikube, Ð° Ð½Ðµ Docker Desktop (Ð¿Ð¾ÐºÐ¸ Ð½Ðµ ÑÐºÐ¸Ð½ÐµÑˆ ÐºÐ¾Ð½Ñ‚ÐµÐºÑÑ‚).

```powershell
minikube docker-env | Invoke-Expression
```

Ð— **ÐºÐ¾Ñ€ÐµÐ½Ñ Ñ€ÐµÐ¿Ð¾Ð·Ð¸Ñ‚Ð¾Ñ€Ñ–ÑŽ** `delivery-system`:

```powershell
docker build -t delivery-system/catalog-service:local -f apps/catalog-service/Dockerfile apps/catalog-service
docker build -t delivery-system/fleet-service:local -f apps/fleet-service/Dockerfile apps/fleet-service
docker build -t delivery-system/order-service:local -f apps/order-service/Dockerfile apps/order-service
docker build -t delivery-system/api-gateway:local -f apps/api-gateway/Dockerfile apps/api-gateway
```

ÐŸÐµÑ€ÐµÐºÐ¾Ð½Ð°Ñ‚Ð¸ÑÑ, Ñ‰Ð¾ Ñ‚ÐµÐ³Ð¸ Ñ” Ð²ÑÐµÑ€ÐµÐ´Ð¸Ð½Ñ– Minikube:

```powershell
minikube image ls | Select-String delivery-system
```

ÐŸÐ¾Ð²ÐµÑ€Ð½ÑƒÑ‚Ð¸ Docker CLI Ð´Ð¾ Ð·Ð²Ð¸Ñ‡Ð°Ð¹Ð½Ð¾Ð³Ð¾ Ð´ÐµÑÐºÑ‚Ð¾Ð¿Ð½Ð¾Ð³Ð¾ daemon (Ð¾Ð¿Ñ†Ñ–Ð¹Ð½Ð¾):

```powershell
minikube docker-env -u | Invoke-Expression
```

### 2Ð±) Ð’Ð°Ñ€Ñ–Ð°Ð½Ñ‚ B â€” `minikube image build` (Ð±ÐµÐ· `docker-env`)

ÐšÐ¾Ð¶Ð½Ð° Ð·Ð±Ñ–Ñ€ÐºÐ° Ð²Ð¸ÐºÐ¾Ð½ÑƒÑ”Ñ‚ÑŒÑÑ Ð² ÑÐµÑ€ÐµÐ´Ð¾Ð²Ð¸Ñ‰Ñ– Minikube; ÐºÐ¾Ð½Ñ‚ÐµÐºÑÑ‚ â€” ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³ ÑÐµÑ€Ð²Ñ–ÑÑƒ:

```powershell
minikube image build -t delivery-system/catalog-service:local -f apps/catalog-service/Dockerfile apps/catalog-service
minikube image build -t delivery-system/fleet-service:local -f apps/fleet-service/Dockerfile apps/fleet-service
minikube image build -t delivery-system/order-service:local -f apps/order-service/Dockerfile apps/order-service
minikube image build -t delivery-system/api-gateway:local -f apps/api-gateway/Dockerfile apps/api-gateway
```

Ð¢Ðµ ÑÐ°Ð¼Ðµ Ð¾Ð´Ð½Ð¸Ð¼ ÑÐºÑ€Ð¸Ð¿Ñ‚Ð¾Ð¼ (ÐºÐ¾Ñ€Ñ–Ð½ÑŒ Ñ€ÐµÐ¿Ð¾Ð·Ð¸Ñ‚Ð¾Ñ€Ñ–ÑŽ; Ð¾Ð¿Ñ†Ñ–Ð¹Ð½Ð¾ Ñ–Ð½ÑˆÐ¸Ð¹ Ñ‚ÐµÐ³: `.\scripts\build-minikube-images.ps1 -Tag v2`):

```powershell
.\scripts\build-minikube-images.ps1
```

ÐÐ° **Windows** ÑÐºÑ€Ð¸Ð¿Ñ‚ Ð·Ð° Ð·Ð°Ð¼Ð¾Ð²Ñ‡ÑƒÐ²Ð°Ð½Ð½ÑÐ¼ Ð¿Ñ–Ð´ÐºÐ»ÑŽÑ‡Ð°Ñ” **`minikube docker-env`** Ñ– Ð²Ð¸ÐºÐ»Ð¸ÐºÐ°Ñ” **`docker build`** (Ð±ÐµÐ· Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ð½Ð¸Ñ… Ð·Ð²Ð¾Ñ€Ð¾Ñ‚Ð½Ð¸Ñ… ÑÐ»Ñ–ÑˆÑ–Ð² Ñƒ `minikube image build`). Ð¯ÐºÑ‰Ð¾ Ð¿Ð¾Ñ‚Ñ€Ñ–Ð±ÐµÐ½ ÑÐ°Ð¼Ðµ **`minikube image build`**: `.\scripts\build-minikube-images.ps1 -MinikubeNative` (ÑˆÐ»ÑÑ…Ð¸ Ð´Ð¾ Dockerfile Ð¿ÐµÑ€ÐµÐ´Ð°ÑŽÑ‚ÑŒÑÑ Ð· `/`).

ÐÐ±Ð¾ Ð¿Ð¾Ð´Ð²Ñ–Ð¹Ð½Ð¸Ð¹ ÐºÐ»Ñ–Ðº / cmd: `scripts\build-minikube-images.cmd`.

Ð¯ÐºÑ‰Ð¾ Ð·Ê¼ÑÐ²Ð»ÑÑ”Ñ‚ÑŒÑÑ Ð¿Ð¾Ð¼Ð¸Ð»ÐºÐ° ÑˆÐ»ÑÑ…Ñƒ Ð½Ð° Windows, Ð²Ð¸ÐºÐ¾Ð½ÑƒÐ¹ ÐºÐ¾Ð¼Ð°Ð½Ð´Ð¸ Ð· ÐºÐ¾Ñ€ÐµÐ½Ñ Ñ€ÐµÐ¿Ð¾Ð·Ð¸Ñ‚Ð¾Ñ€Ñ–ÑŽ (ÑÐº Ð²Ð¸Ñ‰Ðµ).

### Kubernetes-Ð¼Ð°Ð½Ñ–Ñ„ÐµÑÑ‚Ð¸

Ð£ `Deployment` Ð´Ð»Ñ Ð»Ð¾ÐºÐ°Ð»ÑŒÐ½Ð¸Ñ… Ñ‚ÐµÐ³Ñ–Ð² Ð·Ð°Ð·Ð²Ð¸Ñ‡Ð°Ð¹ Ð²ÐºÐ°Ð·ÑƒÑŽÑ‚ÑŒ `image: delivery-system/catalog-service:local` Ñ‚Ð° **`imagePullPolicy: IfNotPresent`** Ð°Ð±Ð¾ **`Never`**, Ñ‰Ð¾Ð± kubelet Ð½Ðµ Ð½Ð°Ð¼Ð°Ð³Ð°Ð²ÑÑ Ñ‚ÑÐ³Ð½ÑƒÑ‚Ð¸ Ð¾Ð±Ñ€Ð°Ð· Ñ–Ð· registry.

**ConfigMap, Secret, PostgreSQL Ñ– Redis Ñƒ ÐºÐ»Ð°ÑÑ‚ÐµÑ€Ñ–**: ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³ **`k8s/`** â€” `namespace.yaml`, `postgres-*`, `redis-*`, `configmap.yaml`, **`lab-secrets.yaml`** (Ð½Ð°Ð²Ñ‡Ð°Ð»ÑŒÐ½Ñ– Ñ„Ñ–ÐºÑÐ¾Ð²Ð°Ð½Ñ– Ð¿Ð°Ñ€Ð¾Ð»Ñ– ÑÐº Ñƒ compose), ÑˆÐ°Ð±Ð»Ð¾Ð½Ð¸ `*-secret.yaml.example`, Ñ–Ð½ÑÑ‚Ñ€ÑƒÐºÑ†Ñ–Ñ **`k8s/README.md`**. Ð”Ð»Ñ Ð²Ð»Ð°ÑÐ½Ð¸Ñ… Ð¿Ð°Ñ€Ð¾Ð»Ñ–Ð²: `*.local.yaml` (Ñƒ `.gitignore`) Ð°Ð±Ð¾ `kubectl create secret`.

---

## ÐŸÐµÑ€ÐµÐ²Ñ–Ñ€ÐºÐ° Redis Ñƒ Ñ‚ÐµÑ€Ð¼Ñ–Ð½Ð°Ð»Ñ– (Windows)

ÐŸÐµÑ€ÐµÐºÐ¾Ð½Ð°Ñ‚Ð¸ÑÑ, Ñ‰Ð¾ Redis Ñƒ ÐºÐ¾Ð½Ñ‚ÐµÐ¹Ð½ÐµÑ€Ñ– Ð²Ñ–Ð´Ð¿Ð¾Ð²Ñ–Ð´Ð°Ñ”:

```powershell
docker compose exec redis redis-cli ping
```

ÐžÑ‡Ñ–ÐºÑƒÐ²Ð°Ð½Ð° Ð²Ñ–Ð´Ð¿Ð¾Ð²Ñ–Ð´ÑŒ: `PONG`.

Ð”Ð¾Ð´Ð°Ñ‚ÐºÐ¾Ð²Ð¾ (Ð¿Ñ€Ð¸ÐºÐ»Ð°Ð´ ÐºÐ»ÑŽÑ‡Ð° Ð¿Ñ–ÑÐ»Ñ Ñ€Ð¾Ð±Ð¾Ñ‚Ð¸ catalog; Ð¿Ñ€ÐµÑ„Ñ–ÐºÑ Ð·Ð°Ð»ÐµÐ¶Ð¸Ñ‚ÑŒ Ð²Ñ–Ð´ ÐºÐ»Ñ–Ñ”Ð½Ñ‚Ð° Keyv):

```powershell
docker compose exec redis redis-cli keys "*categories*"
```

Ð¯ÐºÑ‰Ð¾ `redis-cli` Ð²ÑÑ‚Ð°Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ð¹ Ð½Ð° Windows Ð¾ÐºÑ€ÐµÐ¼Ð¾, Ð¼Ð¾Ð¶Ð½Ð° Ñ‚Ð°ÐºÐ¾Ð¶ (Ð¿Ñ€Ð¸ Ð¿Ñ€Ð¾Ð±Ñ€Ð¾ÑˆÐµÐ½Ð¾Ð¼Ñƒ `6379`):

```powershell
redis-cli -h 127.0.0.1 -p 6379 ping
```

(Ñ‡Ð°ÑÑ‚Ñ–ÑˆÐµ Ð´Ð¾ÑÑ‚Ð°Ñ‚Ð½ÑŒÐ¾ Ð»Ð¸ÑˆÐµ `docker compose exec`.)

**catalog-service** Ñƒ compose Ð¾Ñ‡Ñ–ÐºÑƒÑ” Redis Ð·Ð° Ñ…Ð¾ÑÑ‚Ð¾Ð¼ `redis` ÑƒÑÐµÑ€ÐµÐ´Ð¸Ð½Ñ– Ð¼ÐµÑ€ÐµÐ¶Ñ– Docker. Ð¯ÐºÑ‰Ð¾ Redis Ð½ÐµÐ´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð¸Ð¹, ÑÐµÑ€Ð²Ñ–Ñ Ð¿Ð°Ð´Ð°Ñ” Ð½Ð° ÑÑ‚Ð°Ñ€Ñ‚Ñ– Ð· Ñ‡Ñ–Ñ‚ÐºÐ¸Ð¼ Ð»Ð¾Ð³Ð¾Ð¼. Ð”Ð»Ñ Ð»Ð¾ÐºÐ°Ð»ÑŒÐ½Ð¾Ð³Ð¾ Ð·Ð°Ð¿ÑƒÑÐºÑƒ **Ð±ÐµÐ·** Redis Ð¼Ð¾Ð¶Ð½Ð° Ð²Ð¸ÑÑ‚Ð°Ð²Ð¸Ñ‚Ð¸ `REDIS_DISABLED=true` (Ð´Ð¸Ð². `apps/catalog-service/.env.example`) â€” Ð½Ðµ Ð´Ð»Ñ Ð¿Ñ€Ð¾Ð´Ð°ÐºÑˆÐµÐ½Ñƒ.

---

## Ð¢ÐµÑÑ‚ÑƒÐ²Ð°Ð½Ð½Ñ (Windows)

### Ð›Ð¸ÑˆÐµ catalog-service (Ñ–Ð½ÐºÐ»ÑŽÑ‡Ð¸ ÐºÐµÑˆ: Ñ–Ð½Ñ‚ÐµÐ³Ñ€Ð°Ñ†Ñ–Ð¹Ð½Ð¸Ð¹ Ñ‚ÐµÑÑ‚ Ð±ÐµÐ· Redis)

Ð— ÐºÐ¾Ñ€ÐµÐ½Ñ:

```powershell
npm test --prefix apps/catalog-service
```

ÐÐ±Ð¾:

```powershell
cd apps\catalog-service
npm test
```

Ð¢ÑƒÑ‚ Ð¿ÐµÑ€ÐµÐ²Ñ–Ñ€ÑÑ”Ñ‚ÑŒÑÑ Ð² Ñ‚Ð¾Ð¼Ñƒ Ñ‡Ð¸ÑÐ»Ñ– ÐºÐµÑˆ **GET** ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ñ–Ñ— Ð·Ð° `id` (Ð´Ñ€ÑƒÐ³Ð¸Ð¹ HTTP GET Ð½Ðµ Ð´ÑƒÐ±Ð»ÑŽÑ” Ð²Ð¸ÐºÐ»Ð¸Ðº Ñ€ÐµÐ¿Ð¾Ð·Ð¸Ñ‚Ð¾Ñ€Ñ–ÑŽ).

### ÐŸÐ¾Ð²Ð½Ð¸Ð¹ Ð¿Ñ€Ð¾Ð³Ñ–Ð½ Ð· ÐºÐ¾Ñ€ÐµÐ½Ñ Ñ€ÐµÐ¿Ð¾Ð·Ð¸Ñ‚Ð¾Ñ€Ñ–ÑŽ

```powershell
npm test
```

Ð¡ÐºÑ€Ð¸Ð¿Ñ‚ `scripts/run-tests.mjs` Ð¿Ð¾ÑÐ»Ñ–Ð´Ð¾Ð²Ð½Ð¾ Ð·Ð°Ð¿ÑƒÑÐºÐ°Ñ” **unit** Ñ– **e2e** Ð´Ð»Ñ catalog, fleet, order Ñ‚Ð° **integration** Ð´Ð»Ñ api-gateway. Ð”Ð»Ñ **e2e** Ð¿Ð¾Ñ‚Ñ€Ñ–Ð±Ð½Ñ– Ñ€Ð¾Ð±Ð¾Ñ‡Ð¸Ð¹ **PostgreSQL** Ñ– Ð·Ð¼Ñ–Ð½Ð½Ñ– Ð² `apps/<ÑÐµÑ€Ð²Ñ–Ñ>/.env` (ÑÐºÐ¾Ð¿Ñ–ÑŽÐ¹ Ð· `.env.example` Ñ– Ð¿Ñ–Ð´Ð¿Ñ€Ð°Ð² `DATABASE_URL`). Ð£ **catalog-service** Ð¿ÐµÑ€ÐµÐ´ e2e Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡Ð½Ð¾ Ð²Ð¸ÐºÐ¾Ð½ÑƒÑ”Ñ‚ÑŒÑÑ **`prisma migrate deploy`** (`test/global-setup-e2e.cjs`), Ñ‰Ð¾Ð± Ñ‚Ð°Ð±Ð»Ð¸Ñ†Ñ– Ð²Ñ–Ð´Ð¿Ð¾Ð²Ñ–Ð´Ð°Ð»Ð¸ ÑÑ…ÐµÐ¼Ñ–. Ð£ **catalog-service** e2e Ð·Ð° Ð·Ð°Ð¼Ð¾Ð²Ñ‡ÑƒÐ²Ð°Ð½Ð½ÑÐ¼ Ð²Ð¼Ð¸ÐºÐ°Ñ” **`REDIS_DISABLED=true`** Ñƒ `test/setup-e2e.ts`, Ñ‰Ð¾Ð± Ð½Ðµ Ð²Ð¸Ð¼Ð°Ð³Ð°Ñ‚Ð¸ Redis; Ñ‰Ð¾Ð± Ð¿Ñ€Ð¾Ð³Ð½Ð°Ñ‚Ð¸ e2e Ð· Ñ€ÐµÐ°Ð»ÑŒÐ½Ð¸Ð¼ Redis, Ð²ÑÑ‚Ð°Ð½Ð¾Ð²Ð¸ Ð·Ð¼Ñ–Ð½Ð½Ñƒ Ð¾Ñ‚Ð¾Ñ‡ÐµÐ½Ð½Ñ **`CATALOG_E2E_REDIS=1`** Ñ– Ð¿Ñ–Ð´Ð½Ñ–Ð¼Ð¸ Redis Ð½Ð° `127.0.0.1:6379`.

### ÐžÐºÑ€ÐµÐ¼Ð¾ e2e catalog-service

ÐŸÐ¾Ñ‚Ñ€Ñ–Ð±ÐµÐ½ **PostgreSQL** Ð½Ð° Ñ…Ð¾ÑÑ‚Ñ– Ð· `DATABASE_URL` (Ð¿ÐµÑ€ÐµÐ´ Ñ‚ÐµÑÑ‚Ð°Ð¼Ð¸ Ð¿Ñ–Ð´Ð½Ñ–Ð¼Ð¸ compose Ð· **ÐºÐ¾Ñ€ÐµÐ½Ñ** Ñ€ÐµÐ¿Ð¾Ð·Ð¸Ñ‚Ð¾Ñ€Ñ–ÑŽ):

```powershell
docker compose up -Body postgres
cd apps\catalog-service
npm run test:e2e
```

---

## HTTP-Ð·Ð°Ð¿Ð¸Ñ‚Ð¸ Ð· JSON (PowerShell, `curl.exe`)

Ð’Ð¸ÐºÐ¾Ñ€Ð¸ÑÑ‚Ð¾Ð²ÑƒÐ¹ **`curl.exe`**, Ñ‰Ð¾Ð± ÑƒÐ½Ð¸ÐºÐ½ÑƒÑ‚Ð¸ Ð¿ÑÐµÐ²Ð´Ð¾Ð½Ñ–Ð¼Ð° `curl.exe` â†’ `Invoke-WebRequest`.

### Ð¡Ñ‚Ð²Ð¾Ñ€Ð¸Ñ‚Ð¸ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ñ–ÑŽ (POST, JSON)

```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:3001/api/categories `
  -ContentType "application/json" `
  -Body "{\"name\":\"Probe\",\"description\":\"from JSON\"}"
```

Ð’Ñ–Ð´Ð¿Ð¾Ð²Ñ–Ð´ÑŒ â€” JSON Ñ–Ð· Ð¿Ð¾Ð»ÐµÐ¼ `id` (UUID).

### ÐžÑ‚Ñ€Ð¸Ð¼Ð°Ñ‚Ð¸ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ñ–ÑŽ Ð·Ð° id (GET)

ÐŸÑ–Ð´ÑÑ‚Ð°Ð² Ð¿Ð¾Ð²ÐµÑ€Ð½ÑƒÑ‚Ð¸Ð¹ `id`:

```powershell
Invoke-RestMethod -Method GET -Uri http://localhost:3001/api/categories/Ð¢Ð’Ð†Ð™-UUID-ID
```

### ÐŸÐµÑ€ÐµÐ²Ñ–Ñ€ÐºÐ° Ñ‡Ð°ÑÑƒ Ð²Ñ–Ð´Ð¿Ð¾Ð²Ñ–Ð´Ñ– (ÐºÐµÑˆ: Ð´Ñ€ÑƒÐ³Ð¸Ð¹ Ð·Ð°Ð¿Ð¸Ñ‚ Ð·Ð°Ð·Ð²Ð¸Ñ‡Ð°Ð¹ ÑˆÐ²Ð¸Ð´ÑˆÐ¸Ð¹)

ÐŸÑ–ÑÐ»Ñ POST Ð·Ñ€ÑƒÑ‡Ð½Ð¾ Ð²Ð¸Ñ‚ÑÐ³Ð½ÑƒÑ‚Ð¸ `id` Ð² Ð·Ð¼Ñ–Ð½Ð½Ñƒ:

```powershell
$json = Invoke-RestMethod -Method POST -Uri http://localhost:3001/api/categories `
  -ContentType "application/json" `
  -Body "{\"name\":\"TimingTest\"}"
$id = ($json | ConvertFrom-Json).id

curl.exe -w "`nTOTAL_TIME %{time_total}s`n" -s -o NUL "http://localhost:3001/api/categories/$id"
curl.exe -w "`nTOTAL_TIME %{time_total}s`n" -s -o NUL "http://localhost:3001/api/categories/$id"
```

ÐŸÐ¾Ñ€Ñ–Ð²Ð½ÑÐ¹ Ð´Ð²Ð° Ñ€ÑÐ´ÐºÐ¸ `TOTAL_TIME` â€” Ð´Ñ€ÑƒÐ³Ð¸Ð¹ Ñ‡Ð°ÑÑ‚Ð¾ ÑÑƒÑ‚Ñ‚Ñ”Ð²Ð¾ Ð¼ÐµÐ½ÑˆÐ¸Ð¹, ÐºÐ¾Ð»Ð¸ Ð·Ð°Ð¿Ð¸Ñ Ð²Ð¶Ðµ Ð² Redis.

### Ð§ÐµÑ€ÐµÐ· API gateway

ÐŸÑ€ÐµÑ„Ñ–ÐºÑ Ð´Ð»Ñ catalog: **`/api/catalog/...`** Ð½Ð° Ð¿Ð¾Ñ€Ñ‚ **3000**:

```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/catalog/categories `
  -ContentType "application/json" `
  -Body "{\"name\":\"ViaGateway\"}"
```

ÐšÐµÑˆ ÑÐº Ñ– Ñ€Ð°Ð½Ñ–ÑˆÐµ Ð»Ð¸ÑˆÐµ Ð² **catalog-service**; Ñ‡Ð°Ñ Ñ‡ÐµÑ€ÐµÐ· ÑˆÐ»ÑŽÐ· Ð¼Ð¾Ð¶Ðµ Ð²Ñ–Ð´Ñ€Ñ–Ð·Ð½ÑÑ‚Ð¸ÑÑ Ð¼ÐµÐ½Ñˆ Ð¿Ð¾Ð¼Ñ–Ñ‚Ð½Ð¾ Ñ‡ÐµÑ€ÐµÐ· Ð´Ð¾Ð´Ð°Ñ‚ÐºÐ¾Ð²Ð¸Ð¹ Ñ…Ð¾Ð¿.

---

## Kubernetes (Minikube): Ð´ÐµÐ¼Ð¾Ð½ÑÑ‚Ñ€Ð°Ñ†Ñ–Ð¹Ð½Ð¸Ð¹ ÑÑ†ÐµÐ½Ð°Ñ€Ñ–Ð¹ (Windows, PowerShell)

ÐÐ¸Ð¶Ñ‡Ðµ â€” Ð¿Ð¾ÑÐ»Ñ–Ð´Ð¾Ð²Ð½Ñ–ÑÑ‚ÑŒ ÐºÐ¾Ð¼Ð°Ð½Ð´ Ð´Ð»Ñ Ð·Ð²Ñ–Ñ‚Ñƒ / Ð·Ð´Ð°Ñ‡Ñ– Ð»Ð°Ð±Ð¸: Ñ€Ð¾Ð·Ð³Ð¾Ñ€Ñ‚Ð°Ð½Ð½Ñ, Ð¿ÐµÑ€ÐµÐ²Ñ–Ñ€ÐºÐ¸, Ð¼Ð°ÑÑˆÑ‚Ð°Ð±ÑƒÐ²Ð°Ð½Ð½Ñ, Ð±Ð°Ð»Ð°Ð½ÑÑƒÐ²Ð°Ð½Ð½Ñ, Ð²Ð¸Ð´Ð°Ð»ÐµÐ½Ð½Ñ Pod, rolling update. Ð£ÑÑ– ÐºÐ¾Ð¼Ð°Ð½Ð´Ð¸ Ð· **ÐºÐ¾Ñ€ÐµÐ½Ñ** Ñ€ÐµÐ¿Ð¾Ð·Ð¸Ñ‚Ð¾Ñ€Ñ–ÑŽ (Ð¿Ñ–Ð´ÑÑ‚Ð°Ð² ÑÐ²Ñ–Ð¹ ÑˆÐ»ÑÑ… Ð·Ð°Ð¼Ñ–ÑÑ‚ÑŒ `D:\nulp\zhenyok\delivery-system`).

**ÐŸÐµÑ€ÐµÐ´ÑƒÐ¼Ð¾Ð²Ð¸:** [Minikube](https://minikube.sigs.k8s.io/docs/start/), `kubectl`, Docker Desktop (Ð°Ð±Ð¾ Ñ–Ð½ÑˆÐ¸Ð¹ Ð´Ñ€Ð°Ð¹Ð²ÐµÑ€ Minikube). Namespace Ñƒ Ð¼Ð°Ð½Ñ–Ñ„ÐµÑÑ‚Ð°Ñ…: **`delivery`**.

### 1. Ð—Ð°Ð¿ÑƒÑÐº ÐºÐ»Ð°ÑÑ‚ÐµÑ€Ð° Ñ‚Ð° Ñ€Ð¾Ð·Ð³Ð¾Ñ€Ñ‚Ð°Ð½Ð½Ñ ÑÑ‚ÐµÐºÑƒ

```powershell
cd D:\nulp\zhenyok\delivery-system
minikube start
.\scripts\build-minikube-images.ps1
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/lab-secrets.yaml
kubectl apply -k k8s/
```

Ð”Ð¾Ñ‡ÐµÐºÐ°Ð¹ÑÑ Ð³Ð¾Ñ‚Ð¾Ð²Ð½Ð¾ÑÑ‚Ñ– (ÐºÐ¾Ð»Ð¸ Ð¿Ð¾Ð´Ð¸ Ñ‰Ð¾Ð¹Ð½Ð¾ ÑÑ‚Ð²Ð¾Ñ€ÐµÐ½Ñ–, Ð¼Ð¾Ð¶Ðµ Ð·Ð½Ð°Ð´Ð¾Ð±Ð¸Ñ‚Ð¸ÑÑ 1â€“3 Ñ…Ð²Ð¸Ð»Ð¸Ð½Ð¸):

```powershell
kubectl get pods,svc,deploy -n delivery
kubectl rollout status deployment -n delivery
```

ÐžÑ‡Ñ–ÐºÑƒÐ²Ð°Ð½Ð½Ñ: Ñƒ **`catalog-service`** **2** Pod (**`READY 2/2`** Ñƒ Deployment), Ñ€ÐµÑˆÑ‚Ð° Ð¼Ñ–ÐºÑ€Ð¾ÑÐµÑ€Ð²Ñ–ÑÑ–Ð² â€” Ð¿Ð¾ **1** Ñ€ÐµÐ¿Ð»Ñ–Ñ†Ñ–; **postgres**, **redis** â€” Ð¿Ð¾ **1**.

### 2. Ð”Ð¾ÑÑ‚ÑƒÐ¿Ð½Ñ–ÑÑ‚ÑŒ ÑÐµÑ€Ð²Ñ–ÑÑ–Ð² Ð· Ñ…Ð¾ÑÑ‚Ð° (`port-forward`)

`ClusterIP` Ð· Windows Ð½Ð°Ð¿Ñ€ÑÐ¼Ñƒ Ð½Ðµ Ð²Ñ–Ð´ÐºÑ€Ð¸Ñ‚Ð¸Ð¹; Ð¿Ð¾Ñ‚Ñ€Ñ–Ð±ÐµÐ½ **Ð¿Ñ€Ð¾Ð±Ñ€Ð¾Ñ Ð¿Ð¾Ñ€Ñ‚Ñ–Ð²**. ÐšÐ¾Ð¶Ð½Ð° ÐºÐ¾Ð¼Ð°Ð½Ð´Ð° Ð·Ð°Ð¹Ð¼Ð°Ñ” Ñ‚ÐµÑ€Ð¼Ñ–Ð½Ð°Ð» (Ð°Ð±Ð¾ Ð·Ð°Ð¿ÑƒÑÐº Ñƒ Ñ„Ð¾Ð½Ñ–). ÐŸÑ€Ð¸ÐºÐ»Ð°Ð´ â€” Ð¾ÐºÑ€ÐµÐ¼Ñ– Ð²Ñ–ÐºÐ½Ð° PowerShell:

**Ð’Ñ–ÐºÐ½Ð¾ A â€” api-gateway:**

```powershell
kubectl port-forward -n delivery svc/api-gateway 3000:3000
```

**Ð’Ñ–ÐºÐ½Ð¾ B â€” catalog-service:**

```powershell
kubectl port-forward -n delivery svc/catalog-service 3001:3001
```

ÐŸÐµÑ€ÐµÐ²Ñ–Ñ€ÐºÐ° (Ñ‚Ñ€ÐµÑ‚Ñ” Ð²Ñ–ÐºÐ½Ð¾ Ð°Ð±Ð¾ Ñ‚Ð¸Ð¼Ñ‡Ð°ÑÐ¾Ð²Ð¾ Ð·ÑƒÐ¿Ð¸Ð½Ð¸Ð²ÑˆÐ¸ block Ñƒ A/B):

```powershell
Invoke-RestMethod -Method GET -Uri http://127.0.0.1:3000/health
Invoke-RestMethod -Method GET -Uri http://127.0.0.1:3001/health
```

ÐžÐ¿Ñ†Ñ–Ð¹Ð½Ð¾ **fleet** / **order**:

```powershell
kubectl port-forward -n delivery svc/fleet-service 3002:3002
kubectl port-forward -n delivery svc/order-service 3003:3003
```

ÐÐ»ÑŒÑ‚ÐµÑ€Ð½Ð°Ñ‚Ð¸Ð²Ð° ÑˆÐ»ÑŽÐ·Ñƒ Ð±ÐµÐ· `port-forward` Ð½Ð° 3000 (NodePort **30080**):

```powershell
$ip = minikube ip
curl.exe -s "http://${ip}:30080/health"
```

### 3. ÐœÑ–Ð¶ÑÐµÑ€Ð²Ñ–ÑÐ½Ð° Ð²Ð·Ð°Ñ”Ð¼Ð¾Ð´Ñ–Ñ (Ð²Ð½ÑƒÑ‚Ñ€Ñ–ÑˆÐ½Ñ–Ð¹ DNS)

Ð—Ð°Ð¿Ð¸Ñ‚Ð¸ **Ð·ÑÐµÑ€ÐµÐ´Ð¸Ð½Ð¸** ÐºÐ»Ð°ÑÑ‚ÐµÑ€Ð° Ð´Ð¾ **catalog** Ñ– **order**:

```powershell
kubectl run -n delivery curl-tmp --rm -i --restart=Never --image=curl.exeimages/curl:latest -- curl.exe -sS http://catalog-service:3001/health
kubectl run -n delivery curl-tmp --rm -i --restart=Never --image=curl.exeimages/curl:latest -- curl.exe -sS http://order-service:3003/health
```

ÐŸÐµÑ€ÐµÐ²Ñ–Ñ€ÐºÐ° Ð·Ð¼Ñ–Ð½Ð½Ð¾Ñ— **order â†’ catalog** (URL Ð· ConfigMap):

```powershell
kubectl exec -n delivery deploy/order-service -- printenv CATALOG_SERVICE_URL
```

ÐŸÐ¾Ð²Ð½Ðµ DNS-Ñ–Ð¼â€™Ñ (Ð¿Ñ€Ð¸ÐºÐ»Ð°Ð´):

```powershell
kubectl run -n delivery curl-tmp --rm -i --restart=Never --image=curl.exeimages/curl:latest -- curl.exe -sS http://catalog-service.delivery.svc.cluster.local:3001/health
```

### 4. ÐŸÑ–Ð´ÐºÐ»ÑŽÑ‡ÐµÐ½Ð½Ñ Ð´Ð¾ Redis

Ping Ð· Ñ‚Ð¸Ð¼Ñ‡Ð°ÑÐ¾Ð²Ð¾Ð³Ð¾ Ð¿Ð¾Ð´Ð°:

```powershell
kubectl run -n delivery redis-tmp --rm -i --restart=Never --image=redis:7-alpine -- redis-cli -h redis ping
```

ÐžÑ‡Ñ–ÐºÑƒÐ²Ð°Ð½Ð½Ñ: **`PONG`**.

Ð›Ð¾Ð³Ð¸ **catalog-service** (Ð¿Ñ–Ð´ÐºÐ»ÑŽÑ‡ÐµÐ½Ð½Ñ ÐºÐµÑˆÑƒ Ð´Ð¾ Redis):

```powershell
kubectl logs -n delivery deploy/catalog-service --tail=200 --all-containers=true | Select-String -Pattern "CatalogCacheConnectivity|Redis"
```

Ð¨ÑƒÐºÐ°Ð¹ Ñ€ÑÐ´Ð¾Ðº Ð½Ð° ÐºÑˆÑ‚Ð°Ð»Ñ‚ **`Catalog cache: Redis connection OK.`**

### 5. ÐœÐ°ÑÑˆÑ‚Ð°Ð±ÑƒÐ²Ð°Ð½Ð½Ñ (Ð·Ð±Ñ–Ð»ÑŒÑˆÐµÐ½Ð½Ñ Ñ€ÐµÐ¿Ð»Ñ–Ðº)

ÐŸÑ–Ð´Ð½ÑÑ‚Ð¸, Ð½Ð°Ð¿Ñ€Ð¸ÐºÐ»Ð°Ð´, **4** Ñ€ÐµÐ¿Ð»Ñ–ÐºÐ¸ **catalog-service**:

```powershell
kubectl scale deployment/catalog-service -n delivery --replicas=4
kubectl get pods -n delivery -l app=catalog-service
kubectl rollout status deployment/catalog-service -n delivery --timeout=300s
kubectl wait --for=condition=ready pod -l app=catalog-service -n delivery --timeout=300s
```

ÐŸÐ¾Ð²ÐµÑ€Ð½ÑƒÑ‚Ð¸ ÑÐº Ñƒ Ð¼Ð°Ð½Ñ–Ñ„ÐµÑÑ‚Ñ– (**2** Ñ€ÐµÐ¿Ð»Ñ–ÐºÐ¸):

```powershell
kubectl scale deployment/catalog-service -n delivery --replicas=2
```

### 6. Ð‘Ð°Ð»Ð°Ð½ÑÑƒÐ²Ð°Ð½Ð½Ñ Ð½Ð°Ð²Ð°Ð½Ñ‚Ð°Ð¶ÐµÐ½Ð½Ñ (ÐºÑ–Ð»ÑŒÐºÐ° Ñ€ÐµÐ¿Ð»Ñ–Ðº)

Ð£ ÐºÐ»Ð°ÑÑ‚ÐµÑ€Ñ– Ð´Ð»Ñ **catalog** ÑƒÐ²Ñ–Ð¼ÐºÐ½ÐµÐ½Ð¾ **`DEV_POD_IDENTITY=true`**: **`GET /dev/pod-identity`** Ð¿Ð¾Ð²ÐµÑ€Ñ‚Ð°Ñ” **`hostname`** (Ñ–Ð¼â€™Ñ Pod). ÐŸÐ¾Ñ‚Ñ€Ñ–Ð±Ð½Ñ– **â‰¥2** Ñ€ÐµÐ¿Ð»Ñ–ÐºÐ¸ Ñ‚Ð° **port-forward** Ð½Ð° **catalog** (Ð´Ð¸Ð². Ð¿. 2, Ð¿Ð¾Ñ€Ñ‚ **3001**).

```powershell
1..24 | ForEach-Object { curl.exe -s "http://127.0.0.1:3001/dev/pod-identity" }
(1..30 | ForEach-Object { curl.exe -s "http://127.0.0.1:3001/dev/pod-identity" }) | Sort-Object -Unique
```

Ð£ Ð´Ñ€ÑƒÐ³Ð¾Ð¼Ñƒ Ð²Ð¸Ð²Ð¾Ð´Ñ– Ð¾Ñ‡Ñ–ÐºÑƒÑŽÑ‚ÑŒÑÑ **Ñ€Ñ–Ð·Ð½Ñ–** Ð·Ð½Ð°Ñ‡ÐµÐ½Ð½Ñ **`hostname`** â€” Ñ‚Ñ€Ð°Ñ„Ñ–Ðº Ñ‡ÐµÑ€ÐµÐ· **Service** Ñ€Ð¾Ð·Ð¿Ð¾Ð´Ñ–Ð»ÑÑ”Ñ‚ÑŒÑÑ Ð¼Ñ–Ð¶ Pod.

**ÐšÐµÑˆ `GET /api/categories/:id`**: ÐºÐµÑˆ ÑÐ¿Ñ–Ð»ÑŒÐ½Ð¸Ð¹ Ñ‡ÐµÑ€ÐµÐ· **Redis**. ÐŸÑ–ÑÐ»Ñ POST (Ð¾Ñ‚Ñ€Ð¸Ð¼Ð°Ð¹ **`$id`**) Ð´Ð²Ð° GET Ð¿Ð¾ **`/api/categories/$id`** Ð· **Ñ‚Ð¸Ð¼ ÑÐ°Ð¼Ð¸Ð¼** UUID; Ð´Ð»Ñ ÑÑ‚Ð°Ð±Ñ–Ð»ÑŒÐ½Ð¾Ð³Ð¾ ÐµÑ„ÐµÐºÑ‚Ñƒ Ð¿ÐµÑ€ÐµÐºÐ¾Ð½Ð°Ð¹ÑÑ, Ñ‰Ð¾ **`$id`** Ð½Ðµ Ð¿Ð¾Ñ€Ð¾Ð¶Ð½Ñ–Ð¹ (Ð´Ð¸Ð². Ñ€Ð¾Ð·Ð´Ñ–Ð» HTTP Ð²Ð¸Ñ‰Ðµ). Ð¯ÐºÑ‰Ð¾ **Redis Ð²Ð¸Ð¼ÐºÐ½ÐµÐ½Ð¾** Ð² Pod, ÐºÐµÑˆ Ð»Ð¸ÑˆÐµ in-memory â€” Ð¿Ñ€Ð¸ ÐºÑ–Ð»ÑŒÐºÐ¾Ñ… Ñ€ÐµÐ¿Ð»Ñ–ÐºÐ°Ñ… Ð·Ð°Ð¿Ð¸Ñ‚Ð¸ Ð¼Ð¾Ð¶ÑƒÑ‚ÑŒ Ð¹Ñ‚Ð¸ Ð½Ð° **Ñ€Ñ–Ð·Ð½Ñ–** Pod Ñ– Ñ‡Ð°Ñ Ð¾Ð±Ð¾Ñ… GET Ð·Ð°Ð»Ð¸ÑˆÐ¸Ñ‚ÑŒÑÑ ÑÑ…Ð¾Ð¶Ð¸Ð¼.

### 7. Ð’Ð¸Ð´Ð°Ð»ÐµÐ½Ð½Ñ Pod Ñ– Ð²Ñ–Ð´Ð½Ð¾Ð²Ð»ÐµÐ½Ð½Ñ

```powershell
kubectl get pods -n delivery -l app=catalog-service
kubectl delete pod <Ñ–Ð¼Ñ-Ð¾Ð´Ð½Ð¾Ð³Ð¾-Ð¿Ð¾Ð´Ð°> -n delivery
kubectl get pods -n delivery -l app=catalog-service
kubectl get endpoints catalog-service -n delivery
```

**ReplicaSet** ÑÑ‚Ð²Ð¾Ñ€Ð¸Ñ‚ÑŒ Ð½Ð¾Ð²Ð¸Ð¹ Pod; **Service** **`catalog-service`** Ð»Ð¸ÑˆÐ°Ñ”Ñ‚ÑŒÑÑ, Ð¾Ð½Ð¾Ð²Ð»ÑŽÑŽÑ‚ÑŒÑÑ **Endpoints**.

### Rolling update (Ð½Ð¾Ð²Ð¸Ð¹ tag Ð¾Ð±Ñ€Ð°Ð·Ñƒ)

Ð—Ð±Ñ–Ñ€ÐºÐ° Ð¾Ð±Ñ€Ð°Ð·Ñƒ Ð· Ñ‚ÐµÐ³Ð¾Ð¼ **v2** Ñ– Ð¾Ð½Ð¾Ð²Ð»ÐµÐ½Ð½Ñ Deployment:

```powershell
minikube image build -t delivery-system/catalog-service:v2 -f apps/catalog-service/Dockerfile apps/catalog-service
kubectl set image deployment/catalog-service catalog-service=delivery-system/catalog-service:v2 -n delivery
kubectl rollout status deployment/catalog-service -n delivery
kubectl rollout history deployment/catalog-service -n delivery
```

Ð’Ñ–Ð´ÐºÐ°Ñ‚ Ð½Ð° Ð¿Ð¾Ð¿ÐµÑ€ÐµÐ´Ð½ÑŽ Ñ€ÐµÐ²Ñ–Ð·Ñ–ÑŽ:

```powershell
kubectl rollout undo deployment/catalog-service -n delivery
kubectl rollout status deployment/catalog-service -n delivery
```

ÐŸÑ–ÑÐ»Ñ Ð»Ð°Ð±Ð¸ Ð¾Ð±Ñ€Ð°Ð·Ð¸ Ð· Ñ‚ÐµÐ³Ð¾Ð¼ **`local`** Ð·Ð½Ð¾Ð²Ñƒ ÑƒÐ·Ð³Ð¾Ð´Ð¶ÐµÐ½Ñ– Ð· YAML, ÑÐºÑ‰Ð¾ Ð¿Ð¾Ð²ÐµÑ€Ð½ÐµÑˆ **`kubectl set image â€¦ :local`** Ð°Ð±Ð¾ Ð¿ÐµÑ€ÐµÐ·Ð°ÑÑ‚Ð¾ÑÑƒÑ”Ñˆ Ð¼Ð°Ð½Ñ–Ñ„ÐµÑÑ‚Ð¸.

### ÐŸÐµÑ€ÐµÐ³Ð»ÑÐ´ Ð·Ð³ÐµÐ½ÐµÑ€Ð¾Ð²Ð°Ð½Ð¸Ñ… Ð¼Ð°Ð½Ñ–Ñ„ÐµÑÑ‚Ñ–Ð² (Kustomize)

```powershell
kubectl kustomize k8s/
```

### Ð—ÑƒÐ¿Ð¸Ð½ÐºÐ°

```powershell
minikube stop
```

(ÐžÐ±Ñ€Ð°Ð·Ð¸ Ð²ÑÐµÑ€ÐµÐ´Ð¸Ð½Ñ– Minikube Ð·Ð±ÐµÑ€ÐµÐ¶ÑƒÑ‚ÑŒÑÑ Ð´Ð¾ **`minikube delete`**.)

### Ð”Ð»Ñ Ñ€Ð¾Ð·Ð´Ñ–Ð»Ñƒ Â«ÐÐ½Ð°Ð»Ñ–Ð·Â» Ñƒ Ð·Ð²Ñ–Ñ‚Ñ– (Ð¾Ñ€Ñ–Ñ”Ð½Ñ‚Ð¸Ñ€Ð¸)

- **Deployment** Ñƒ Kubernetes ÐºÐµÑ€ÑƒÑ” ReplicaSet Ñ– Ð±Ð°Ð¶Ð°Ð½Ð¾ÑŽ ÐºÑ–Ð»ÑŒÐºÑ–ÑÑ‚ÑŽ Pod, Ð¾Ð½Ð¾Ð²Ð»ÐµÐ½Ð½ÑÐ¼Ð¸ (rolling update) Ñ‚Ð° Ñ–ÑÑ‚Ð¾Ñ€Ñ–Ñ”ÑŽ Ñ€ÐµÐ²Ñ–Ð·Ñ–Ð¹; **docker-compose** Ð¼Ð°ÑÑˆÑ‚Ð°Ð±ÑƒÑ” Ñ‡ÐµÑ€ÐµÐ· `deploy.replicas` Ð»Ð¸ÑˆÐµ Ð² Ð¼ÐµÐ¶Ð°Ñ… Ð¾Ð´Ð½Ð¾Ð³Ð¾ Ñ…Ð¾ÑÑ‚Ð° Ð±ÐµÐ· Ð²Ð±ÑƒÐ´Ð¾Ð²Ð°Ð½Ð¾Ñ— Ñ–ÑÑ‚Ð¾Ñ€Ñ–Ñ— rollout/undo Ð½Ð° Ñ€Ñ–Ð²Ð½Ñ– API ÐºÐ»Ð°ÑÑ‚ÐµÑ€Ð°.
- **Service (ClusterIP)** Ð´Ð°Ñ” ÑÑ‚Ð°Ð±Ñ–Ð»ÑŒÐ½Ð¸Ð¹ DNS Ñ– IP Ð²ÑÐµÑ€ÐµÐ´Ð¸Ð½Ñ– ÐºÐ»Ð°ÑÑ‚ÐµÑ€Ð°; Ñ‚Ñ€Ð°Ñ„Ñ–Ðº Ñ€Ð¾Ð·Ð¿Ð¾Ð´Ñ–Ð»ÑÑ”Ñ‚ÑŒÑÑ Ð¼Ñ–Ð¶ Pod (kube-proxy). Ð£ compose ÑÐµÑ€Ð²Ñ–ÑÐ¸ Ñ€ÐµÐ·Ð¾Ð»Ð²Ð»ÑÑ‚ÑŒÑÑ Ñ–Ð¼ÐµÐ½Ð°Ð¼Ð¸ Ð² Ð¾Ð´Ð½Ñ–Ð¹ Ð¼ÐµÑ€ÐµÐ¶Ñ– Docker **Ð½Ð° Ð¾Ð´Ð½Ð¾Ð¼Ñƒ Ð²ÑƒÐ·Ð»Ñ–**.
- **ÐžÑ€ÐºÐµÑÑ‚Ñ€Ð°Ñ†Ñ–Ñ (K8s)** Ð´Ð¾Ð´Ð°Ñ” ÑÐ°Ð¼Ð¾Ð²Ñ–Ð´Ð½Ð¾Ð²Ð»ÐµÐ½Ð½Ñ Pod, Ð³Ð¾Ñ€Ð¸Ð·Ð¾Ð½Ñ‚Ð°Ð»ÑŒÐ½Ðµ Ð¼Ð°ÑÑˆÑ‚Ð°Ð±ÑƒÐ²Ð°Ð½Ð½Ñ, rolling update, Ð´ÐµÐºÐ»Ð°Ñ€Ð°Ñ‚Ð¸Ð²Ð½Ñ– Ð¼Ð°Ð½Ñ–Ñ„ÐµÑÑ‚Ð¸ Ñ‚Ð° Ñ–Ð·Ð¾Ð»ÑÑ†Ñ–ÑŽ namespace â€” Ñ†Ðµ Ð´Ð¾Ñ€Ð¾Ð¶Ñ‡Ðµ Ð² Ð½Ð°Ð²Ñ‡Ð°Ð½Ð½Ñ–, Ð½Ñ–Ð¶ Ð¾Ð´Ð¸Ð½ compose-Ñ„Ð°Ð¹Ð», Ð°Ð»Ðµ Ð¿Ð¾Ñ‚Ñ€Ñ–Ð±Ð½Ð¾ Ð´Ð»Ñ Ð¿Ñ€Ð¾Ð´Ð°ÐºÑˆÐµÐ½-Ð¿Ð¾Ð´Ñ–Ð±Ð½Ð¸Ñ… ÑÑ†ÐµÐ½Ð°Ñ€Ñ–Ñ—Ð².

---

## Ð’Ñ–Ð´Ð¿Ð¾Ð²Ñ–Ð´Ð½Ñ–ÑÑ‚ÑŒ Ñ‚Ð¸Ð¿Ð¾Ð²Ð¸Ð¼ Ð»Ð°Ð±Ð¾Ñ€Ð°Ñ‚Ð¾Ñ€Ð½Ð¸Ð¼ Ð·Ð°Ð²Ð´Ð°Ð½Ð½ÑÐ¼ (ÐºÐ¾Ñ€Ð¾Ñ‚ÐºÐ¾)

| Ð—Ð°Ð´Ð°Ñ‡Ð° | Ð¯Ðº Ð·Ð°ÐºÑ€Ð¸Ñ‚Ð¾ Ð² Ñ€ÐµÐ¿Ð¾Ð·Ð¸Ñ‚Ð¾Ñ€Ñ–Ñ— |
|--------|---------------------------|
| Kubernetes / Minikube (Ð»Ð°Ð±Ð°) | ÐšÐ°Ñ‚Ð°Ð»Ð¾Ð³ **`k8s/`**, **`lab-secrets.yaml`**, ÑÐºÑ€Ð¸Ð¿Ñ‚ **`scripts/build-minikube-images.ps1`**, Ñ€Ð¾Ð·Ð´Ñ–Ð» **Â«Kubernetes (Minikube): Ð´ÐµÐ¼Ð¾Ð½ÑÑ‚Ñ€Ð°Ñ†Ñ–Ð¹Ð½Ð¸Ð¹ ÑÑ†ÐµÐ½Ð°Ñ€Ñ–Ð¹Â»** Ð²Ð¸Ñ‰Ðµ. |
| ÐšÐµÑˆ Ð¼Ñ–ÐºÑ€Ð¾ÑÐµÑ€Ð²Ñ–ÑÑƒ | **catalog-service**, GET `/api/categories/:id` (NestJS `@nestjs/cache-manager` + Redis, Ð½Ðµ Spring). |
| Redis Ñƒ Docker | Ð¡ÐµÑ€Ð²Ñ–Ñ **`redis`** Ñƒ `docker-compose.yml`. |
| ÐŸÐ¾Ð»Ñ–Ñ‚Ð¸ÐºÐ° Ð¾Ñ‡Ð¸Ñ‰ÐµÐ½Ð½Ñ | TTL (~90 Ñ) + Ñ–Ð½Ð²Ð°Ð»Ñ–Ð´Ð°Ñ†Ñ–Ñ ÐºÐ»ÑŽÑ‡Ð° Ð¿Ñ–ÑÐ»Ñ Ð·Ð¼Ñ–Ð½Ð¸/Ð²Ð¸Ð´Ð°Ð»ÐµÐ½Ð½Ñ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ñ–Ñ—. |
| Dockerfile | Ð£ ÐºÐ¾Ð¶Ð½Ð¾Ð³Ð¾ Ð· `apps/*/Dockerfile` (gateway, catalog, fleet, order). |
| Ð—Ð±Ñ–Ñ€ÐºÐ° Ñ‚Ð° compose | `docker compose up -Body --build`. |

**ÐšÐ¾Ð½Ñ‚ÐµÐ¹Ð½ÐµÑ€Ð¸Ð·Ð°Ñ†Ñ–Ñ** Ð·Ñ€ÑƒÑ‡Ð½Ð° Ð´Ð»Ñ Ð¾Ð´Ð½Ð°ÐºÐ¾Ð²Ð¾Ð³Ð¾ Ð¾Ñ‚Ð¾Ñ‡ÐµÐ½Ð½Ñ Ð½Ð° Ð¼Ð°ÑˆÐ¸Ð½Ð°Ñ… ÑÑ‚ÑƒÐ´ÐµÐ½Ñ‚Ñ–Ð², Ñ–Ð·Ð¾Ð»ÑŒÐ¾Ð²Ð°Ð½Ð¸Ñ… ÑÐµÑ€Ð²Ñ–ÑÑ–Ð² Ñ– Ð¿Ñ€Ð¾ÑÑ‚Ð¾Ð³Ð¾ Ð¿Ñ–Ð´ÐºÐ»ÑŽÑ‡ÐµÐ½Ð½Ñ Ð‘Ð”/Redis Ð·Ð° Ñ–Ð¼ÐµÐ½Ð°Ð¼Ð¸ (`postgres`, `redis`). **ÐšÐµÑˆ** Ð·Ð¼ÐµÐ½ÑˆÑƒÑ” Ð½Ð°Ð²Ð°Ð½Ñ‚Ð°Ð¶ÐµÐ½Ð½Ñ Ð½Ð° Ð‘Ð” Ñ– Ñ‡Ð°Ñ Ð¾Ð±Ñ€Ð¾Ð±ÐºÐ¸ Ð¿Ð¾Ð²Ñ‚Ð¾Ñ€Ð½Ð¸Ñ… Ñ‡Ð¸Ñ‚Ð°Ð½ÑŒ Ð¾Ð´Ð½Ñ–Ñ”Ñ— ÑÑƒÑ‚Ð½Ð¾ÑÑ‚Ñ– (Ñ‰Ð¾ Ð²Ð¸Ð´Ð½Ð¾ Ð¿Ð¾ `TOTAL_TIME` Ð´Ð²Ð¾Ñ… Ð¿Ð¾ÑÐ»Ñ–Ð´Ð¾Ð²Ð½Ð¸Ñ… GET Ð´Ð¾ `:3001`).

