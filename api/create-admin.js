import { createClient } from '@supabase/supabase-js'

// Создание суб-админа: и учётной записи, и строки в admin_users.
//
// Раньше это делалось прямо в браузере через обычный supabase.auth.signUp()
// с anon-ключом — то есть публичной регистрацией. Это работало только пока
// в проекте включена публичная регистрация (Dashboard → Authentication →
// Sign In / Providers → Allow new users to sign up). Как только её выключают
// (что и нужно сделать: иначе любой посторонний тоже получает роль
// authenticated и подпадает под все политики RLS), тот же signUp() ломается
// и для легитимного создания суб-админа — Supabase эту настройку применяет
// одинаково ко всем вызовам signUp(), не различая, кто их сделал.
//
// Поэтому создание учётки перенесено сюда и идёт через Admin API
// (service-role), которая ограничение на публичную регистрацию не видит.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.VITE_SUPABASE_URL

  if (!serviceKey || !supabaseUrl) {
    return res.status(500).json({ error: 'Server not configured' })
  }

  // 1. Кто пришёл: тот же паттерн, что в upload-logo.js.
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    return res.status(401).json({ error: 'Требуется вход' })
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const { data: userData, error: userError } = await admin.auth.getUser(token)
  const callerEmail = userData?.user?.email
  if (userError || !callerEmail) {
    return res.status(401).json({ error: 'Недействительная сессия' })
  }

  // 2. Только суперадмин может заводить суб-админов — иначе суб-админ с
  // доступом к одной вкладке смог бы через этот эндпоинт выдать себе полный.
  const { data: callerRow, error: callerError } = await admin
    .from('admin_users')
    .select('is_super_admin')
    .eq('email', callerEmail)
    .maybeSingle()

  if (callerError) {
    return res.status(500).json({ error: 'Не удалось проверить права' })
  }
  if (!callerRow?.is_super_admin) {
    return res.status(403).json({ error: 'Недостаточно прав' })
  }

  // 3. Данные нового админа.
  let body
  try {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return res.status(400).json({ error: 'Некорректное тело запроса' })
  }

  const email = String(body?.email || '').trim().toLowerCase()
  const password = String(body?.password || '')
  const allowedTabs = Array.isArray(body?.allowedTabs) ? body.allowedTabs : []

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Некорректный email' })
  }
  if (password.length < 12) {
    return res.status(400).json({ error: 'Пароль минимум 12 символов' })
  }
  if (allowedTabs.length === 0) {
    return res.status(400).json({ error: 'Выберите хотя бы одну вкладку' })
  }

  // 4. Создаём (или переиспользуем существующую) учётную запись через Admin API.
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createError && !createError.message.toLowerCase().includes('already been registered')) {
    return res.status(400).json({ error: createError.message })
  }

  // 5. И запись в admin_users.
  const { error: dbError } = await admin.from('admin_users').upsert(
    { email, is_super_admin: false, allowed_tabs: allowedTabs, created_by: callerEmail },
    { onConflict: 'email' }
  )
  if (dbError) {
    return res.status(500).json({ error: dbError.message })
  }

  return res.status(200).json({ ok: true })
}
