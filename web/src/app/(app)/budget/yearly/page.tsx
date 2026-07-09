import { redirect } from 'next/navigation';
import { getCurrentYear } from '@/lib/utils';

export default function BudgetYearlyRedirect() {
  redirect(`/budget/${getCurrentYear()}`);
}
