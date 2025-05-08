// src/pages/bill-search.tsx
import { useState, useEffect } from 'react'

type HistoryItem = {
  year: string
  billNo: string
  timestamp: number
}

export default function BillSearch() {
  const [year, setYear] = useState('')
  const [billNo, setBillNo] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('billHistory')
    if (stored) {
      setHistory(JSON.parse(stored))
    }
  }, [])

  const handleDelete = (year: string, billNo: string) => {
    const updated = history.filter(item => item.year !== year || item.billNo !== billNo)
    setHistory(updated)
    localStorage.setItem('billHistory', JSON.stringify(updated))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const yearRegex = /^\d{4}$/
    const billNoRegex = /^\d{5,8}$/

    if (!yearRegex.test(year)) {
      setError('Year must be 4 digits')
      return
    }

    if (!billNoRegex.test(billNo)) {
      setError('Bill number must be 5 to 8 digits')
      return
    }

    const newItem = { year, billNo, timestamp: Date.now() }
    const updatedHistory = [newItem, ...history].slice(0, 30)
    setHistory(updatedHistory)
    localStorage.setItem('billHistory', JSON.stringify(updatedHistory))

    const url = `https://prdcfms.apcfss.in:44300/sap/bc/ui5_ui5/sap/zexp_billstatus/index.html?sap-client=350&billNum=${year}-${billNo}`
    window.open(url, '_blank')
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">CFMS Bill Search</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="Year (e.g. 2025)"
          className="w-full border px-3 py-2 rounded"
          maxLength={4}
          required
        />
        <input
          type="text"
          value={billNo}
          onChange={(e) => setBillNo(e.target.value)}
          placeholder="Bill Number"
          className="w-full border px-3 py-2 rounded"
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Open CFMS
        </button>
      </form>

      {history.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Search History</h2>
          <ul className="space-y-2">
            {history.map((item) => (
              <li key={`${item.year}-${item.billNo}`} className="flex justify-between">
                <span>{item.year}-{item.billNo}</span>
                <button
                  className="text-red-600 text-sm"
                  onClick={() => handleDelete(item.year, item.billNo)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
