import { useState, useEffect, useRef } from 'react'
import { FaRegTrashAlt } from 'react-icons/fa'
import { FaTimes } from 'react-icons/fa'
import { FaHistory } from 'react-icons/fa'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()
  const [year, setYear] = useState('2025')
  const [billNo, setBillNo] = useState('')
  const [combinedBill, setCombinedBill] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const billNoInputRef = useRef<HTMLInputElement>(null)
  const combinedBillInputRef = useRef<HTMLInputElement>(null)

  // Enhanced sidebar state for responsive behavior
  const [isDesktop, setIsDesktop] = useState(false)


    // Check for credentials on mount
  useEffect(() => {
    const session = localStorage.getItem('cfmsSession');
    if (!session) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768)
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('billHistory')
    if (stored) {
      setHistory(JSON.parse(stored))
    }
  }, [])

  // Handle the combined Bill input
  const handleCombinedBillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCombinedBill(value);
    
    // Auto-populate year and billNo if format is correct
    if (value.includes('-')) {
      const [inputYear, ...rest] = value.split('-');
      const inputBillNo = rest.join('-');
      
      if (/^\d{4}$/.test(inputYear)) {
        setYear(inputYear);
      }
      
      if (inputBillNo) {
        setBillNo(inputBillNo);
      }
    }
  };

  useEffect(() => {
    if (year.length === 4 && billNoInputRef.current) {
      billNoInputRef.current.focus()
    }
  }, [year])


  useEffect(() => {
    // Close sidebar when clicking outside of it
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector('.sidebar') as HTMLElement;
      if (sidebar && !sidebar.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };
  
    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  const openBillInNewTab = (year: string, billNo: string) => {
    const session = localStorage.getItem('cfmsSession')
    if (!session) {
      setError('Please log in first')
      return false
    }
  
    const { authToken } = JSON.parse(session)
    const url = `https://prdcfms.apcfss.in:44300/sap/bc/ui5_ui5/sap/zexp_billstatus/index.html?sap-client=350&billNum=${year}-${billNo}`
    
    // Method 1: Using window.open with credentials
    try {
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        // Store credentials temporarily for the new tab
        const tempKey = `cfms_temp_${Date.now()}`
        localStorage.setItem(tempKey, authToken)
        setTimeout(() => localStorage.removeItem(tempKey), 5000) // Clean up after 5s
        
        newWindow.location.href = `${url}?authKey=${tempKey}`
        return true
      }
    } catch (e) {
      console.error('Failed to open window:', e)
    }
  
    // Fallback method if popup is blocked
    const opened = openBillInNewTab(year, billNo);
    if (!opened) {
      setError('Popup was blocked - please allow popups for this site');
    }
    return false
  }
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
  
    const session = localStorage.getItem('cfmsSession');
    if (!session) {
      setError('Please log in first');
      setLoading(false);
      return;
    }
  
    const { authToken } = JSON.parse(session);
  
    try {
      const billRes = await fetch('/api/bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authToken}`,
        },
        body: JSON.stringify({ year, billNo }),
      });
  
      const billData = await billRes.json();
  
      if (!billData.success) {
        setError(billData.message || 'Failed to generate bill link');
        return;
      }
  
      // Open bill in new tab with credentials
      const url = `https://prdcfms.apcfss.in:44300/sap/bc/ui5_ui5/sap/zexp_billstatus/index.html?sap-client=350&billNum=${year}-${billNo}`;
      const newWindow = window.open('', '_blank');
      
      if (newWindow) {
        newWindow.document.write(`
          <script>
            localStorage.setItem('cfmsSession', '${JSON.stringify({authToken})}');
            window.location.href = '${url}';
          </script>
        `);
        newWindow.document.close();
      } else {
        setError('Popup was blocked - please allow popups');
      }
  
      // Add to history
      const newItem = { year, billNo, timestamp: Date.now(), name: '' };
      const updatedHistory = [newItem, ...history].slice(0, 30);
      setHistory(updatedHistory);
      localStorage.setItem('billHistory', JSON.stringify(updatedHistory));
  
      setYear('2025');
      setBillNo('');
      setCombinedBill('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };
  

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

  /* ===== NEW UI ENHANCEMENTS ===== */
  // Backdrop component for mobile sidebar
  const Backdrop = () => (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 z-0 transition-opacity duration-300 md:hidden ${
        isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setIsSidebarOpen(false)}
    />
  )

  // Enhanced input clear buttons
  const ClearInputButton = ({ onClick }: { onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      <FaTimes className="w-4 h-4" />
    </button>
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Backdrop for mobile sidebar */}
      <Backdrop />

      {/* Main content (Bill Search Form) */}
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-blue-100 relative z-10 transform transition-all hover:scale-[1.01]">
        {/* Removed BETA badge */}
        <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center tracking-tight">
          AP CFMS Bill Search
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Combined Bill input field */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bill (YYYY-BillNumber)</label>
            <input
              type="text"
              value={combinedBill}
              onChange={handleCombinedBillChange}
              ref={combinedBillInputRef}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              placeholder="e.g. 2025-2358642"
            />
            {combinedBill && <ClearInputButton onClick={() => setCombinedBill('')} />}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input
              type="text"
              value={year}
              onChange={(e) => {
                if (/^\d*$/.test(e.target.value) && e.target.value.length <= 4) {
                  setYear(e.target.value)
                      if (e.target.value.length === 4 && billNoInputRef.current) {
                        billNoInputRef.current.focus()
                      }
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              placeholder="e.g. 2025"
              required
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number</label>
            <input  
              type="text"
              value={billNo}
              onChange={(e) => setBillNo(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition pr-10"
              placeholder="e.g. 2375612"
              required
              ref={billNoInputRef}
            />
            {billNo && <ClearInputButton onClick={() => setBillNo('')} />}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-md ${
              loading ? 'opacity-80 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </span>
            ) : (
              'Search Bill'
            )}
          </button>
        </form>
      </div>

      {/* Enhanced Sidebar */}
            <div
        className={`fixed right-0 top-0 h-full bg-white p-5 rounded-l-2xl shadow-xl border border-blue-100 transform transition-transform duration-300 z-20 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isDesktop ? 'w-96' : 'w-80'}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-800 flex items-center">
            <FaHistory className="mr-2" /> Previous Bills
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700 transition"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p>No search history yet</p>
            <p className="text-sm mt-1">Your searched bills will appear here</p>
          </div>
        ) : (
          <ul className="space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 custom-scrollbar">
            {history.map((item, idx) => (
              <li
                key={`${item.year}-${item.billNo}-${idx}`}
                className="group flex items-center justify-between text-sm text-gray-700 bg-blue-50 px-3 py-3 rounded-md hover:bg-blue-100 transition-colors"
              >
                <div className="flex-1 mr-3 min-w-0">
                  {editingIndex === idx ? (
                    <input
                      type="text"
                      value={item.name || ''}
                      onChange={(e) => handleNameChange(e, idx)}
                      onBlur={() => setEditingIndex(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setEditingIndex(null)
                        }
                      }}
                      autoFocus
                      className="text-sm text-black bg-white placeholder-gray-500 px-2 py-1 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Enter a name"
                    />
                  ) : (
                    <div className="flex items-center justify-between min-w-0">
                      <button
                        onClick={() => {
                          const url = `https://prdcfms.apcfss.in:44300/sap/bc/ui5_ui5/sap/zexp_billstatus/index.html?sap-client=350&billNum=${item.year}-${item.billNo}`
                          window.open(url, '_blank')
                        }}
                        className="text-blue-700 hover:underline text-left truncate min-w-0"
                        title={item.name || `Bill ${item.year}-${item.billNo}`}
                      >
                        {item.name || 'Unnamed Bill'}
                      </button>
                      <button
                        className="ml-2 text-blue-600 hover:text-blue-800 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
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
                  className="mx-2 text-blue-700 hover:underline whitespace-nowrap text-xs sm:text-sm"
                  onClick={() => {
                    const url = `https://prdcfms.apcfss.in:44300/sap/bc/ui5_ui5/sap/zexp_billstatus/index.html?sap-client=350&billNum=${item.year}-${item.billNo}`
                    window.open(url, '_blank')
                  }}
                >
                  {item.year}-{item.billNo}
                </button>

                <div className="flex items-center">
                  <span className="text-xs text-gray-400 mr-2 hidden sm:inline">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(idx)
                    }}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Delete"
                  >
                    <FaRegTrashAlt className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Enhanced Mobile Button to Open Sidebar */}
        {/* Button to Open Sidebar (Visible on All Screens) */}
    <button
      className={`fixed top-4 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-full shadow-lg z-10 transition-all ${
        isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onClick={() => setIsSidebarOpen(true)}
    >
      <FaHistory className="w-5 h-5" />
    </button>


      {/* Custom styles for animations and scrollbar */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
    </main>
  )
}