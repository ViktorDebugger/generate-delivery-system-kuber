export const ValidationMessages = {
  typeNumber: 'Поле має бути числом',
  typeBoolean: 'Поле має бути логічним значенням (true або false)',
  courier: {
    nameRequired: "Ім'я кур'єра обов'язкове",
    nameString: "Ім'я кур'єра має бути рядком",
    transportIdString: 'ID транспорту має бути рядком',
  },
  location: {
    latitudeRange: 'Широта має бути в діапазоні від -90 до 90',
    longitudeRange: 'Довгота має бути в діапазоні від -180 до 180',
    orderIdString: 'ID замовлення має бути рядком',
  },
  transport: {
    nameRequired: "Назва транспорту обов'язкова",
    nameString: 'Назва транспорту має бути рядком',
    descriptionString: 'Опис транспорту має бути рядком',
  },
} as const;
