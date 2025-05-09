// src/components/bills/BillCard.tsx
import React from 'react';

interface Bill {
  id: string;
  date: string;
  amount: number;
  status: string;
}

interface BillCardProps {
  bill: Bill;
}

const BillCard: React.FC<BillCardProps> = ({ bill }) => {
  return (
    <div className="border p-4 rounded-lg shadow-md bg-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Bill ID: {bill.id}</h3>
        <p className="text-sm text-gray-500">{bill.date}</p>
      </div>
      <div className="mb-4">
        <p className="text-xl font-bold text-gray-800">Amount: ${bill.amount.toFixed(2)}</p>
        <p className={`text-sm ${bill.status === 'Paid' ? 'text-green-500' : 'text-red-500'}`}>
          Status: {bill.status}
        </p>
      </div>
      <div className="text-center">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none">
          View Details
        </button>
      </div>
    </div>
  );
};

export default BillCard;
