export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function getCategoryLabel(key: string): string {
  const labels: Record<string, string> = {
    groceries: 'Groceries',
    babySupplies: 'Baby Supplies',
    bathroomSupplies: 'Bathroom Supplies',
    houseSupplies: 'House Supplies',
    pharmacy: 'Pharmacy',
    charity: 'Charity',
    unknown: 'Unknown',
  };
  if (labels[key]) return labels[key];
  return key
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
