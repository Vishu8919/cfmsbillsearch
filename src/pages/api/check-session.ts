// src/pages/api/check-session.ts
import { NextApiRequest, NextApiResponse } from 'next'
import cookie from 'cookie'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookies = cookie.parse(req.headers.cookie || '')
  const session = cookies.cfmsSession ? JSON.parse(cookies.cfmsSession) : null

  if (!session) {
    return res.status(401).json({ success: false, message: 'Not logged in' })
  }

  return res.status(200).json({ success: true, token: session.authToken })
}
