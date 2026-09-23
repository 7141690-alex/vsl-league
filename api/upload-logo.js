import { createClient } from '@supabase/supabase-js'

export const config = {
  api: { bodyParser: false },
}

// Загрузка идёт с service-role ключом, поэтому эндпоинт обязан сам проверить,
// что запрос пришёл от админа. Раньше проверки не было вовсе: любой человек
// мог залить в публичный бакет произвольный файл с произвольным Content-Type.
const MAX_BYTES = 5 * 1024 * 1024

// Расширение и Content-Type берём отсюда, а не из того, что прислал клиент.
const ALLOWED = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

// Сигнатуры файлов: защита от «png-картинки», внутри которой лежит html.
const SIGNATURES = [
  { type: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { type: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
]

function sniffType(buf) {
  for (const { type, bytes } of SIGNATURES) {
    if (bytes.every((b, i) => buf[i] === b)) return type
  }
  // WEBP: "RIFF" .... "WEBP"
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp'
  }
  return null
}

async function readBodyLimited(req, limit) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) return null
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
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

  // 1. Кто пришёл: access token из сессии Supabase.
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    return res.status(401).json({ error: 'Требуется вход' })
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const { data: userData, error: userError } = await admin.auth.getUser(token)
  const email = userData?.user?.email
  if (userError || !email) {
    return res.status(401).json({ error: 'Недействительная сессия' })
  }

  // 2. Он админ? Проверяем той же таблицей, на которой стоит is_admin() в RLS.
  const { data: adminRow, error: adminError } = await admin
    .from('admin_users')
    .select('email')
    .eq('email', email)
    .maybeSingle()

  if (adminError) {
    return res.status(500).json({ error: 'Не удалось проверить права' })
  }
  if (!adminRow) {
    return res.status(403).json({ error: 'Недостаточно прав' })
  }

  // 3. Тело с жёстким лимитом — иначе один запрос кладёт функцию по памяти.
  const body = await readBodyLimited(req, MAX_BYTES)
  if (body === null) {
    return res.status(413).json({ error: 'Файл больше 5 МБ' })
  }

  const contentType = req.headers['content-type'] || ''
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)
  if (!boundaryMatch) {
    return res.status(400).json({ error: 'No boundary in content-type' })
  }

  const boundary = (boundaryMatch[1] || boundaryMatch[2]).trim()
  const parts = parseMultipart(body, boundary)
  const filePart = parts.find(p => p.name === 'file')

  if (!filePart || filePart.data.length === 0) {
    return res.status(400).json({ error: 'No file in request' })
  }

  // 4. Тип определяем по содержимому файла, заголовку клиента не верим.
  const sniffed = sniffType(filePart.data)
  const ext = ALLOWED[sniffed]
  if (!ext) {
    return res.status(415).json({ error: 'Допустимы только PNG, JPEG, WEBP и GIF' })
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await admin.storage
    .from('team-logos')
    .upload(filename, filePart.data, { upsert: false, contentType: sniffed })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const { data: { publicUrl } } = admin.storage
    .from('team-logos')
    .getPublicUrl(filename)

  return res.status(200).json({ url: publicUrl })
}

function parseMultipart(body, boundary) {
  const parts = []
  const boundaryBuf = Buffer.from('--' + boundary)
  const first = body.indexOf(boundaryBuf)
  if (first === -1) return parts

  let start = first + boundaryBuf.length + 2 // пропускаем CRLF после границы

  while (start < body.length) {
    const end = body.indexOf(boundaryBuf, start)
    if (end === -1) break

    const part = body.slice(start, end - 2) // отрезаем CRLF перед границей
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'))
    if (headerEnd === -1) { start = end + boundaryBuf.length + 2; continue }

    const headerStr = part.slice(0, headerEnd).toString()
    const data = part.slice(headerEnd + 4)

    const nameMatch = headerStr.match(/name="([^"]+)"/)

    parts.push({
      name: nameMatch?.[1] || '',
      data,
    })

    start = end + boundaryBuf.length + 2
  }
  return parts
}
