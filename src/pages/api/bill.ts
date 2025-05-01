// src/pages/api/bill.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

type Data = {
  success: boolean
  message?: string
  billUrl?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { year, billNo } = req.body
  const authHeader = req.headers.authorization

  // Validate session
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ success: false, message: 'Please login first' })
  }

  // Validate year and bill number
  const yearRegex = /^\d{4}$/
  const billNoRegex = /^\d{5,8}$/

  if (!yearRegex.test(year)) {
    return res.status(400).json({ success: false, message: 'Year must be 4 digits' })
  }

  if (!billNoRegex.test(billNo)) {
    return res.status(400).json({ success: false, message: 'Bill number must be 5 to 8 digits' })
  }

  const fullBillNum = `${year}-${billNo}`
  const billUrl = `https://prdcfms.apcfss.in:44300/sap/bc/ui5_ui5/sap/zexp_billstatus/index.html?sap-client=350&billNum=${fullBillNum}`

  try {
    // Attempt to fetch the page using credentials
    const cfmsResponse = await axios.get(billUrl, {
      headers: {
        Authorization: authHeader,
      },
      validateStatus: () => true, // Don't throw on 401
    })

    if (cfmsResponse.status === 401) {
      return res.status(401).json({ success: false, message: 'Invalid CFMS session. Please log in again.' })
    }

    // You could parse `cfmsResponse.data` if needed
    return res.status(200).json({ success: true, billUrl })
  } catch (err) {
    console.error('Error contacting CFMS:', err)
    return res.status(500).json({ success: false, message: 'Failed to connect to CFMS' })
  }
}
