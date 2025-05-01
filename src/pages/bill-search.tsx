import { useState, useEffect } from 'react'
import { FaSpinner } from 'react-icons/fa'
import withAuth from '../hoc/withAuth'
import '@/styles/globals.css'


type HistoryItem = {
  year: string
  billNo: string
  timestamp: number
}

function BillSearch() {
  const [year, setYear] = useState('')
  const [billNo, setBillNo] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('billHistory')
    if (stored) {
      setHistory(JSON.parse(stored))
    }
  }, [])

  const handleDelete = (year: string, billNo: string) => {
    const updatedHistory = history.filter(
      (item) => item.year !== year || item.billNo !== billNo
    )
    setHistory(updatedHistory)
    localStorage.setItem('billHistory', JSON.stringify(updatedHistory))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Simulate bill search logic here
      const newItem = { year, billNo, timestamp: Date.now() }
      const updatedHistory = [newItem, ...history].slice(0, 30)
      setHistory(updatedHistory)
      localStorage.setItem('billHistory', JSON.stringify(updatedHistory))

      // Simulate fetching bill details
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network request

      // Redirect or handle successful result here
    } catch (err) {
      setError('An error occurred while searching the bill.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          maxLength={4} // Ensure year is 4 digits
          placeholder="Year (4 digits)"
        />
        <input
          type="text"
          value={billNo}
          onChange={(e) => setBillNo(e.target.value)}
          placeholder="Bill Number"
        />
        <button type="submit" disabled={loading}>
          {loading ? <FaSpinner className="animate-spin" /> : 'Search'}
        </button>
      </form>

      {error && <div className="text-red-500">{error}</div>}

      <div>
        {history.length > 0 && (
          <ul>
            {history.map((item) => (
              <li key={`${item.year}-${item.billNo}`}>
                <span>{item.year}-{item.billNo}</span>
                <button onClick={() => handleDelete(item.year, item.billNo)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default withAuth(BillSearch)
