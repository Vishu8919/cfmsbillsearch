// pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

type Data = {
  success: boolean
  message?: string
  session?: {
    authToken: string
    user: string
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Missing credentials' })
  }

  const authToken = Buffer.from(`${username}:${password}`).toString('base64')

  try {
    const response = await axios.get(
      `https://prdcfms.apcfss.in:44300/sap/bc/ui5_ui5/sap/zexp_billstatus/index.html?sap-client=350&billNum=2025-0000001`,
      {
        headers: {
          Authorization: `Basic ${authToken}`,
        },
        validateStatus: () => true, // Allow non-2xx
      }
    )

    if (response.status === 401) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    if (response.status >= 400) {
      return res.status(response.status).json({ success: false, message: 'CFMS server error' })
    }

    const session = { authToken, user: username }

    // ✅ Return session in JSON so frontend can store it in localStorage
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      session,
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
