import { redirect } from 'next/navigation';
import { getCurrentMonth } from '@/lib/utils';

export default function BudgetMonthlyRedirect() {
  const [year, month] = getCurrentMonth().split('-');
  redirect(`/budget/${year}/${month}`);
}
