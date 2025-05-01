import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { FaRegTrashAlt } from 'react-icons/fa' // Importing the delete icon from react-icons
import '@/styles/globals.css'


type HistoryItem = {
  year: string
  billNo: string
  timestamp: number
  name: string // Added a name property
}

export default function Home() {
  const [year, setYear] = useState('')
  const [billNo, setBillNo] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
const [editingIndex, setEditingIndex] = useState<number | null>(null)


  const router = useRouter()

  // Load history from local storage
  useEffect(() => {
    const stored = localStorage.getItem('billHistory')
    if (stored) {
      setHistory(JSON.parse(stored))
    }
  }, [])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
  
    const session = localStorage.getItem('cfmsSession')
    if (!session) {
      setError('Please log in first')
      setLoading(false)
      return
    }

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const updated = [...history]
      updated[index] = { ...updated[index], name: e.target.value }
      setHistory(updated)
      localStorage.setItem('billHistory', JSON.stringify(updated))
    }
  
    const { authToken } = JSON.parse(session)
  
    try {
      const billRes = await fetch('/api/bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authToken}`,
        },
        body: JSON.stringify({ year, billNo }),
      })
  
      const billData = await billRes.json()
  
      if (!billData.success) {
        setError(billData.message || 'Failed to generate bill link')
        return
      }
  
      // Optional: redirect
      router.push(`/bill-search?year=${year}&billNo=${billNo}`)
  
      // Open in new tab
      window.open(billData.billUrl, '_blank')
  
      const newItem = { year, billNo, timestamp: Date.now(), name: '' } // Empty name initially
      const updatedHistory = [newItem, ...history].slice(0, 30)
      setHistory(updatedHistory)
      localStorage.setItem('billHistory', JSON.stringify(updatedHistory))
  
      setYear('')
      setBillNo('')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (index: number) => {
    const updatedHistory = history.filter((_, idx) => idx !== index)
    setHistory(updatedHistory)
    localStorage.setItem('billHistory', JSON.stringify(updatedHistory))
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const updatedHistory = [...history]
    updatedHistory[index].name = e.target.value
    setHistory(updatedHistory)
    localStorage.setItem('billHistory', JSON.stringify(updatedHistory))
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-blue-100">
        <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center tracking-tight">
          AP CFMS Bill Search
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              placeholder="e.g. 2025"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number</label>
            <input
              type="text"
              value={billNo}
              onChange={(e) => setBillNo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              placeholder="e.g. 2375612"
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm font-medium -mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition shadow-md"
          >
            {loading ? 'Searching...' : 'Search Bill'}
          </button>
        </form>

        {history.map((item, idx) => (
  <li
    key={`${item.year}-${item.billNo}-${idx}`}
    className="flex items-center justify-between text-sm text-gray-700 bg-blue-50 px-3 py-2 rounded-md hover:bg-blue-100"
  >
    <div className="flex-1">
    {editingIndex === idx ? (
  <input
    type="text"
    value={item.name || ''}
    onChange={(e) => handleNameChange(e, idx)}
    onClick={(e) => e.stopPropagation()}
    className="text-sm text-black bg-white placeholder-gray-500 px-2 py-1 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
    placeholder="Enter a name"
  />
) : (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-blue-700">{item.name}</span>
    <button
      className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
      onClick={(e) => {
        e.stopPropagation()
        setEditingIndex(idx)
      }}
    >
      Edit
    </button>
  </div>
)}

    </div>

    <button
      className="mx-4 text-blue-700 hover:underline whitespace-nowrap"
      onClick={() => {
        const url = `https://prdcfms.apcfss.in:44300/sap/bc/ui5_ui5/sap/zexp_billstatus/index.html?sap-client=350&billNum=${item.year}-${item.billNo}`
        window.open(url, '_blank')
      }}
    >
      {item.year}-{item.billNo}
    </button>

    <div className="flex items-center">
      <span className="text-xs text-gray-400 mr-2">
        {new Date(item.timestamp).toLocaleDateString()}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDelete(idx)
        }}
        className="text-red-600 hover:text-red-800"
      >
        <FaRegTrashAlt />
      </button>
    </div>
  </li>
))}

      </div>
    </main>
  )
}
