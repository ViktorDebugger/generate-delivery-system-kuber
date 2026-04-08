export const ValidationMessages = {
  typeNumber: 'Поле має бути числом',
  category: {
    nameRequired: "Назва категорії обов'язкова",
    nameString: 'Назва категорії має бути рядком',
    descriptionString: 'Опис має бути рядком',
  },
  product: {
    nameRequired: "Назва товару обов'язкова",
    nameString: 'Назва товару має бути рядком',
    pricePositive: 'Ціна повинна бути більше 0',
    categoryIdString: 'ID категорії має бути рядком',
  },
} as const;
