import { Category } from '../types/category';

export const DEFAULT_CATEGORIES: Category[] = [
  // Needs
  { name: 'Electricity Bill', type: 'Needs', icon: 'zap' },
  { name: 'Maintenance', type: 'Needs', icon: 'wrench' },
  { name: 'Health', type: 'Needs', icon: 'heart-pulse' },
  { name: 'Food', type: 'Needs', icon: 'utensils' },
  { name: 'Travel', type: 'Needs', icon: 'car' },
  { name: 'Recharge', type: 'Needs', icon: 'smartphone' },
  { name: 'Rent / Housing', type: 'Needs', icon: 'home' },
  { name: 'Insurance', type: 'Needs', icon: 'shield' },
  { name: 'Education', type: 'Needs', icon: 'book' },
  
  // Wants
  { name: 'EMIs', type: 'Wants', icon: 'credit-card' },
  { name: 'Lifestyle', type: 'Wants', icon: 'shirt' },
  { name: 'Shopping', type: 'Wants', icon: 'shopping-bag' },
  { name: 'Entertainment', type: 'Wants', icon: 'film' },
  { name: 'Eating Out', type: 'Wants', icon: 'coffee' },
  { name: 'Gifts', type: 'Wants', icon: 'gift' },
  { name: 'Miscellaneous', type: 'Wants', icon: 'more-horizontal' },
  
  // Investments
  { name: 'Investment', type: 'Investments', icon: 'trending-up' },
  { name: 'Emergency Fund', type: 'Investments', icon: 'piggy-bank' },
];

export function getCategoryType(categoryName: string): 'Needs' | 'Wants' | 'Investments' {
  const category = DEFAULT_CATEGORIES.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
  return category ? category.type : 'Needs'; // Default to Needs if unknown
}
