import { createClient } from '@supabase/supabase-js'

export const config = {
  api: { bodyParser: false },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL

  if (!serviceKey || !supabaseUrl) {
    return res.status(500).json({ error: 'Server not configured' })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Parse multipart form data
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = Buffer.concat(chunks)

  // Extract boundary from content-type header
  const contentType = req.headers['content-type'] || ''
  const boundaryMatch = contentType.match(/boundary=(.+)/)
  if (!boundaryMatch) {
    return res.status(400).json({ error: 'No boundary in content-type' })
  }

  const boundary = boundaryMatch[1]
  const parts = parseMultipart(body, boundary)
  const filePart = parts.find(p => p.name === 'file')

  if (!filePart) {
    return res.status(400).json({ error: 'No file in request' })
  }

  const ext = (filePart.filename || 'file').split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('team-logos')
    .upload(filename, filePart.data, { upsert: true, contentType: filePart.contentType })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('team-logos')
    .getPublicUrl(filename)

  return res.status(200).json({ url: publicUrl })
}

function parseMultipart(body, boundary) {
  const parts = []
  const boundaryBuf = Buffer.from('--' + boundary)
  let start = body.indexOf(boundaryBuf) + boundaryBuf.length + 2 // skip \r\n

  while (start < body.length) {
    const end = body.indexOf(boundaryBuf, start)
    if (end === -1) break

    const part = body.slice(start, end - 2) // trim \r\n before boundary
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'))
    if (headerEnd === -1) { start = end + boundaryBuf.length + 2; continue }

    const headerStr = part.slice(0, headerEnd).toString()
    const data = part.slice(headerEnd + 4)

    const nameMatch = headerStr.match(/name="([^"]+)"/)
    const filenameMatch = headerStr.match(/filename="([^"]+)"/)
    const ctMatch = headerStr.match(/Content-Type:\s*(\S+)/i)

    parts.push({
      name: nameMatch?.[1] || '',
      filename: filenameMatch?.[1] || '',
      contentType: ctMatch?.[1] || 'application/octet-stream',
      data,
    })

    start = end + boundaryBuf.length + 2
  }
  return parts
}
