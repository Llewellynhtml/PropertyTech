export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString();
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}
