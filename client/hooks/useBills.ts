import { useState, useEffect } from 'react';
import { 
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Bill {
  id: string;
  amount: number;
  description: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  userId: string;
}

export const useBills = (userId: string | undefined) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'bills'),
      where('userId', '==', userId),
      orderBy('dueDate', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const billsData: Bill[] = [];
      querySnapshot.forEach((doc) => {
        billsData.push({ id: doc.id, ...doc.data() } as Bill);
      });
      setBills(billsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addBill = async (bill: Omit<Bill, 'id'>) => {
    await addDoc(collection(db, 'bills'), bill);
  };

  const updateBill = async (billId: string, updates: Partial<Bill>) => {
    await updateDoc(doc(db, 'bills', billId), updates);
  };

  const deleteBill = async (billId: string) => {
    await deleteDoc(doc(db, 'bills', billId));
  };

  return { bills, loading, addBill, updateBill, deleteBill };
};