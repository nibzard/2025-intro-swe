const HRK_TO_EUR = 7.53450;

export const convertKunaToEuro = (kunaAmount) => {
  return (kunaAmount / HRK_TO_EUR).toFixed(2);
};

export const formatEuro = (amount) => {
  return `€${parseFloat(amount).toFixed(2)}`;
};

export const formatPrice = (kunaAmount) => {
  const euros = convertKunaToEuro(kunaAmount);
  return formatEuro(euros);
};