# Мапінг тестів моноліту → мікросервіси

Моноліт: репозиторій `generate-delivery-system-db` (клон поруч з `delivery-system`, напр. `D:\nulp\zhenyok\generate-delivery-system-db`).

При переносі не копіювати імпорти типу `../prisma` з кореня моноліту: підлаштувати під `PrismaService`, репозиторії та модулі відповідного `apps/<service>`.

## Unit (`src/**/*.spec.ts`)

| Джерело (моноліт) | Сервіс | Шлях призначення |
|-------------------|--------|------------------|
| `src/categories/categories.service.spec.ts` | catalog-service | `apps/catalog-service/src/categories/` |
| `src/products/products.service.spec.ts` | catalog-service | `apps/catalog-service/src/products/` |
| `src/transports/transports.service.spec.ts` | fleet-service | `apps/fleet-service/src/transports/` |
| `src/couriers/couriers.service.spec.ts` | fleet-service | `apps/fleet-service/src/couriers/` |
| `src/couriers/courier-locations.service.spec.ts` | fleet-service | `apps/fleet-service/src/couriers/` |
| `src/auth/auth.service.spec.ts` | order-service | `apps/order-service/src/auth/` |
| `src/clients/clients.service.spec.ts` | order-service | `apps/order-service/src/clients/` |
| `src/orders/orders.service.spec.ts` | order-service | `apps/order-service/src/orders/` |
| `src/orders/order.prisma-repository.spec.ts` | order-service | `apps/order-service/src/orders/` |
| `src/reports/reports.service.spec.ts` | order-service | `apps/order-service/src/reports/` (коли з’явиться модуль reports) |
| `src/common/filters/error-response.body.spec.ts` | catalog, fleet, order | `apps/<service>/src/common/filters/` — лише де реалізація збігається з монолітом |
| `src/common/filters/error-response.filter.spec.ts` | catalog, fleet, order | `apps/<service>/src/common/filters/` |
| `src/common/list-query/list-query.util.spec.ts` | catalog, fleet, order | `apps/<service>/src/common/list-query/` |
| `{global-validation.pipe,dto-validation}.spec.ts` | catalog, fleet, order | `apps/<service>/src/common/validation/` — там, де pipe/messages паритетні; у `order-service` зараз немає `dto-validation.spec.ts`, доки не з’явиться відповідний файл |
| `src/app.module.spec.ts` | кожен сервіс за потреби | Компактний тест зборки `AppModule` конкретного застосунку, без копіювання монолітного кореня |

## E2E (`test/app.e2e-spec.ts`)

Рознести сценарії за префіксами API:

| Область API (орієнтир) | Сервіс | Примітка |
|------------------------|--------|----------|
| `/api/auth`, `/api/clients` | order-service | `apps/order-service/test/` |
| categories, products | catalog-service | `apps/catalog-service/test/` |
| transports, couriers | fleet-service | `apps/fleet-service/test/` |
| orders, reports | order-service | `apps/order-service/test/` |

За потреби окремі e2e через API Gateway — окремий набір у `apps/api-gateway`.

## Детальні інструкції

Див. `data.txt` (розділи після «Підготовка»): Jest, спільний `common`, домени.
