// EUR functie verwacht ALTIJD euro's (niet cents)
export const EUR = (euros: number) => {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros);
};

// Aparte functie voor cents naar euro's conversie
export const centsToEUR = (cents: number) => {
  return EUR(cents / 100);
};