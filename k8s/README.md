# Kubernetes (namespace `delivery`)

## Навчальний запуск без ручних секретів

Файл **`lab-secrets.yaml`** містить ті самі слабкі облікові дані, що й `docker-compose` (`postgres` / `postgres`, JWT з compose). **Лише для лаби**, не для продакену.

З кореня репозиторію (PowerShell):

```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/lab-secrets.yaml
kubectl apply -k k8s/
```

Далі збери образи в Minikube (див. кореневий `README.md`), перевір:

```powershell
kubectl get pods,svc,deploy -n delivery
```

## Власні секрети (не комітити)

Шаблони: `postgres-secret.yaml.example`, `delivery-secrets.yaml.example`. Копії з паролями: `*.local.yaml` (у `.gitignore`). Детальні ключі див. у прикладах і в кореневому README.
