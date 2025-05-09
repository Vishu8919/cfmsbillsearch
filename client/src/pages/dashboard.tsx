import { useAuth } from '../../context/AuthContext';
import { useBills } from '../../hooks/useBills';
import BillCard from '../../components/bills/BillCard';

export default function Dashboard() {
  const { user } = useAuth();
  const { bills, loading, addBill } = useBills(user?.uid);

  if (loading) return <div>Loading...</div>;

  // Check if bills are empty or missing data
  if (!bills || bills.length === 0) return <div>No bills found</div>;

  return (
    <div>
      <h1>Your Bills</h1>
      {bills.map((bill) => (
        <BillCard key={bill.id} bill={{ ...bill, date: bill.date || 'No date available' }} />
      ))}
    </div>
  );
}
