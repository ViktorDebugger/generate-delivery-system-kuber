export const ValidationMessages = {
  typeNumber: 'Поле має бути числом',
  typeArray: 'Поле має бути масивом',
  auth: {
    passwordRequired: 'Пароль обовʼязковий',
    passwordString: 'Пароль має бути рядком',
    passwordMinLength: 'Пароль має містити щонайменше 8 символів',
  },
  client: {
    fullNameRequired: "ПІБ клієнта обов'язкове",
    fullNameString: 'ПІБ клієнта має бути рядком',
    emailInvalid: 'Некоректний формат email',
    addressString: 'Адреса має бути рядком',
  },
  location: {
    latitudeRange: 'Широта має бути в діапазоні від -90 до 90',
    longitudeRange: 'Довгота має бути в діапазоні від -180 до 180',
  },
  order: {
    orderNumberRequired: "Номер замовлення обов'язковий",
    orderNumberString: 'Номер замовлення має бути рядком',
    weightPositive: 'Вага повинна бути більше 0',
    senderIdRequired: "ID відправника обов'язковий",
    senderIdString: 'ID відправника має бути рядком',
    receiverIdRequired: "ID отримувача обов'язковий",
    receiverIdString: 'ID отримувача має бути рядком',
    statusString: 'Статус має бути рядком',
    statusInvalid:
      'Невідомий статус. Дозволено: CREATED, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED',
    courierIdString: "ID кур'єра має бути рядком",
    estimatedArrivalString: 'Час прибуття має бути рядком',
  },
  product: {
    productIdString: 'ID товару має бути рядком',
  },
  report: {
    dateFromInvalid: 'dateFrom має бути коректною датою (ISO 8601)',
    dateToInvalid: 'dateTo має бути коректною датою (ISO 8601)',
    courierIdString: "ID кур'єра має бути рядком",
    statusString: 'Статус має бути рядком',
  },
} as const;
