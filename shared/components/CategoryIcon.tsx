import { Icon, type IconName } from '@/shared/components/ui/Icon';

interface CategoryIconProps {
  category: string;
  class?: string;
}

const categoryToIcon: Record<string, IconName> = {
  groceries: 'groceries',
  babySupplies: 'babySupplies',
  bathroomSupplies: 'bathroomSupplies',
  houseSupplies: 'houseSupplies',
  pharmacy: 'pharmacy',
  charity: 'charity',
};

export function CategoryIcon({ category, class: className = 'w-5 h-5' }: CategoryIconProps) {
  const iconName = categoryToIcon[category] || 'tag';
  return <Icon name={iconName} class={className} />;
}
