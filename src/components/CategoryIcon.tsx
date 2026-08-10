import { 
  Zap, Wrench, HeartPulse, Utensils, ShoppingCart, Car, Smartphone, 
  Home, Shield, Book, CreditCard, Shirt, ShoppingBag, Film, Coffee, 
  Gift, MoreHorizontal, TrendingUp, PiggyBank, CircleDollarSign
} from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../utils/categories';

const iconMap: Record<string, any> = {
  'zap': Zap,
  'wrench': Wrench,
  'heart-pulse': HeartPulse,
  'utensils': Utensils,
  'shopping-cart': ShoppingCart,
  'car': Car,
  'smartphone': Smartphone,
  'home': Home,
  'shield': Shield,
  'book': Book,
  'credit-card': CreditCard,
  'shirt': Shirt,
  'shopping-bag': ShoppingBag,
  'film': Film,
  'coffee': Coffee,
  'gift': Gift,
  'more-horizontal': MoreHorizontal,
  'trending-up': TrendingUp,
  'piggy-bank': PiggyBank
};

export function CategoryIcon({ categoryName, className }: { categoryName?: string, className?: string }) {
  if (!categoryName) return <CircleDollarSign className={className} size={20} />;
  const category = DEFAULT_CATEGORIES.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
  const IconComponent = category && category.icon ? iconMap[category.icon] || CircleDollarSign : CircleDollarSign;
  
  return <IconComponent className={className} size={20} />;
}
