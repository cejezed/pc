export const EUR = (amountOrCents: number) => {
  // Als het > 1000 is, gaan we ervan uit dat het cents zijn
  const euros = amountOrCents > 1000 ? amountOrCents / 100 : amountOrCents;
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros);
};