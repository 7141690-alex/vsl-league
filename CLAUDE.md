# VSL — Volleyball Super League

## Инструкция для агента
Этот файл — главный источник знаний о проекте. **Обязательные правила:**
- При начале работы с проектом — прочитать этот файл полностью перед тем как сканировать код
- После каждого значимого изменения (новая фича, изменение схемы БД, изменение деплоя, новые зависимости) — **обновить этот файл** чтобы он отражал актуальное состояние
- Файл должен быть достаточно полным чтобы новый агент мог сразу приступить к работе без изучения всего кода

## Что это
Веб-приложение для управления волейбольной лигой: турнирная таблица, расписание матчей, составы команд. React + Vite + Supabase + Tailwind CSS v4. PWA (устанавливается на телефон).

### SEO и индексация
- **`index.html`**: `lang="ru"`, title/description/keywords (ВСЛ, VSL, Ташкент, волейбольная лига, любительская лига), canonical `https://vsl-league.vercel.app/`, Open Graph и Twitter Card, geo-мета для Ташкента, JSON-LD `SportsLeague` (Schema.org).
- **`public/robots.txt`**: `Allow: /`, ссылка на sitemap.
- **`public/sitemap.xml`**: главная страница (SPA без path-маршрутов — один URL).
- После смены продакшен-домена обновить canonical, og:url, og:image, sitemap и JSON-LD `url`.
- Регистрация в [Google Search Console](https://search.google.com/search-console) и [Яндекс.Вебмастер](https://webmaster.yandex.ru): добавить сайт, подтвердить владение, указать sitemap `https://vsl-league.vercel.app/sitemap.xml`.

## Стек
- **Frontend**: React 19, Vite 8, Tailwind CSS v4
- **База данных**: Supabase (PostgreSQL) — `https://gvkdumzyhdguupdhcqeb.supabase.co`
- **Хостинг**: Vercel — `https://vsl-league.vercel.app`
- **GitHub**: `https://github.com/7141690-alex/vsl-league` (branch: main)
- **PWA**: vite-plugin-pwa v1.2.0 (установлен через --legacy-peer-deps, есть .npmrc)

## Структура файлов
```
src/
  pages/
    Standings.jsx   — турнирная таблица (с CalendarWidget внизу)
    Schedule.jsx    — расписание матчей, группировка по неделям и датам
    TeamPage.jsx    — страница команды: состав, предстоящие/сыгранные матчи
    Admin.jsx       — панель администратора (авторизация, управление, вкладка аналитики посещений с графиками)
  components/
    CalendarWidget.jsx  — виджет календаря под таблицей
    MikasaBall.jsx      — SVG-иконка мяча в шапке
  lib/
    supabase.js     — клиент Supabase (ключи из .env)
    analytics.js    — сбор аналитики посещений (session/page view + metadata)
    standings.js    — правила лиги: очки за матч, строка и сортировка таблицы
    matches.js      — фильтры матчей: сыгранные, предстоящие, по сезону
  test/
    logic.test.js   — unit-тесты бизнес-логики (Vitest)
    setup.js        — setup файл для тестов
  App.jsx           — роутинг, шапка, переключение лига/таб, InstallBanner (PWA); при следующем визите восстанавливается последняя выбранная лига (`localStorage` ключ `vsl_preferred_league`, значение — `leagues.name`)
```

## База данных Supabase — таблицы

### teams
| Колонка   | Тип    | Описание                                      |
|-----------|--------|-----------------------------------------------|
| id        | uuid   | PK                                            |
| name      | text   | Название команды                              |
| league    | text   | 'male' или 'female'                           |
| photo_url | text   | Путь к фото команды (напр. /teams/Unity.jpg)  |

Фото женских команд лежат в `public/teams/`. Отображаются в шапке страницы TeamPage.

### players
| Колонка       | Тип     | Описание                        |
|---------------|---------|---------------------------------|
| id            | uuid    | PK                              |
| team_id       | uuid    | FK → teams.id                   |
| name          | text    | Имя игрока                      |
| height        | integer | Рост в см (опционально)         |
| jersey_number | integer | Игровой номер (опционально)     |
| is_captain    | boolean | Капитан команды (default false) |

### matches
| Колонка      | Тип       | Описание                          |
|--------------|-----------|-----------------------------------|
| id           | uuid      | PK                                |
| league       | text      | 'male' или 'female'               |
| home_team_id | uuid      | FK → teams.id                     |
| away_team_id | uuid      | FK → teams.id                     |
| match_date   | timestamp | Дата и время матча                |
| venue        | text      | Зал (опционально)                 |
| status       | text      | 'scheduled' или 'finished'        |
| home_sets    | integer   | Сеты хозяев                       |
| away_sets    | integer   | Сеты гостей                       |
| photo_url    | text      | Ссылка на фотоотчёт (опционально) |
| video_url    | text      | Ссылка на YouTube (опционально)   |

### set_scores
| Колонка     | Тип     | Описание              |
|-------------|---------|-----------------------|
| id          | uuid    | PK                    |
| match_id    | uuid    | FK → matches.id       |
| set_number  | integer | Номер сета (1–5)      |
| home_points | integer | Очки хозяев           |
| away_points | integer | Очки гостей           |

### site_visit_events
| Колонка    | Тип        | Описание |
|------------|------------|----------|
| id         | uuid       | PK |
| created_at | timestamptz| Когда зафиксировано событие |
| event_type | text       | `session_start` или `page_view` |
| visitor_id | text       | Постоянный ID посетителя (localStorage) |
| session_id | text       | ID сессии (sessionStorage) |
| page_key   | text       | Экран приложения (`standings`, `schedule`, `stats`, `team`, `player`, `awards`, `admin`) |
| league     | text       | Активная лига в момент события |
| season_id  | uuid       | Активный сезон |
| referrer   | text       | Источник перехода |
| url        | text       | Полный URL |
| path       | text       | path+query+hash |
| metadata   | jsonb      | Детальная телеметрия (UTM, устройство, экран, язык, connection, navigation timing, PWA mode, context) |

## Логика начисления очков (Standings)
- Победа 3:0 или 3:1 → **3 очка** победителю, **0** проигравшему
- Победа 3:2 → **2 очка** победителю, **1 очко** проигравшему
- Зона плей-офф: топ-4 (синяя полоса)
- Зона вылета: последние 2 (красная полоса)

## Правила капитана
- У команды может быть только один капитан (is_captain = true)
- При назначении нового капитана через saveEdit() сначала снимается флаг у всех игроков команды, затем устанавливается новому
- Чекбокс "Капитан" заблокирован для остальных игроков если капитан уже есть

## Деплой

### Переменные окружения (Vercel и локально .env)
```
VITE_SUPABASE_URL=https://gvkdumzyhdguupdhcqeb.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_8ht117lVNAOJw04Jr_zbdA_nO50wrEo
```

### Процесс деплоя
1. Внести изменения в код
2. `git add <файлы> && git commit -m "описание"`
3. Push на GitHub (SSH, `gh auth login` или PAT из настроек GitHub — **не хранить в репозитории**):
   ```
   git push origin main
   ```
4. Vercel подхватывает коммит автоматически (иногда нужно Redeploy вручную через Dashboard)

### Если Vercel не деплоит автоматически
Зайти на vercel.com → проект vsl-league → Deployments → три точки у последнего деплоя → **Redeploy**

### Миграции БД
Новые колонки добавляются вручную через Supabase SQL Editor:
`https://supabase.com/dashboard/project/gvkdumzyhdguupdhcqeb/sql/new`

SQL-файлы применяются вручную, журнала применённых миграций нет — порядок и статус
нужно отслеживать самостоятельно:

| Файл | Что делает | Статус |
|------|-----------|--------|
| `scripts/site-visit-events.sql` | Таблица аналитики посещений, индексы, RLS | применён |
| `scripts/rls-hardening.sql` | Право записи = членство в `admin_users` (после атаки 22.09.2026) | применён |
| `scripts/rls-hardening-2.sql` | Закрывает саму `admin_users` (её первая миграция не покрывала), лимиты на анонимную запись в аналитику | применён |
| `scripts/atomic-writes.sql` | RPC `replace_set_scores`, `replace_match_stats`, `set_current_season` — транзакционная замена вместо delete+insert | применён |

Статус в таблице легко разъезжается с реальностью — сверяться запросом, а не
доверять строке:

```sql
select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in ('replace_set_scores','replace_match_stats','set_current_season');
```

В конце `rls-hardening-2.sql` — запросы для аудита политик. Прогонять после
любых изменений RLS.

### Резервные копии
```
SUPABASE_SERVICE_KEY=... node scripts/backup.mjs
```
Выгружает все содержательные таблицы в `backups/<дата>/*.json` (папка в .gitignore).
На бесплатном тарифе Supabase нет PITR — после атаки 22.09.2026 данные пришлось
восстанавливать из `activity_log`, потому что копий не было. Хранить вне сервера.

**Автоматический бэкап на Contabo** (`ssh contabo`, пользователь `agent`):
- `~/vsl-backup/` — `backup.mjs` (копия `scripts/backup.mjs`), `run.sh`, `.env` (ключ `SUPABASE_SERVICE_KEY`, права 600, только на сервере), `backup.log`, `data/<дата UTC>/*.json`.
- cron: `0 3 * * * /home/agent/vsl-backup/run.sh` (каждый день 03:00 по времени сервера, UTC+5); копии старше 30 дней удаляются.
- Проверка: `ssh contabo 'tail -20 ~/vsl-backup/backup.log; ls ~/vsl-backup/data'`. Ручной запуск: `ssh contabo '~/vsl-backup/run.sh'`.
- При изменении `scripts/backup.mjs` (например, новые таблицы) — скопировать на сервер: `scp scripts/backup.mjs contabo:vsl-backup/`.
- Если ротировали service_role ключ — обновить `.env` на сервере.

### Безопасность — что должно оставаться верным
- `/api/upload-logo` работает с service-role ключом: он **обязан** проверять
  Bearer-токен сессии и членство в `admin_users`, лимит размера и тип файла по
  сигнатуре. Без этих проверок эндпоинт = публичная загрузка чего угодно.
- Проверка прав в админке — fail-closed: ошибка запроса означает «доступа нет».
- Суб-админа заводить только вместе с учётной записью: `is_admin()` сверяет
  `auth.email()`, поэтому email в `admin_users` без аккаунта может занять кто угодно.
- Кэширование — тоже в `vercel.json`: `/assets/*` immutable на год, `/teams/*` и PNG (логотип, иконки) на неделю. Без этого Vercel отдаёт `max-age=0, must-revalidate`, и каждый визит = десятки Edge Requests (лимит free — 1 млн/мес). Новые статические файлы в `public/` — добавлять в правила; при замене файла с тем же именем кэш живёт до недели.
- Заголовки безопасности (CSP и прочее) — в `vercel.json`. При добавлении внешних
  доменов (шрифты, аналитика, CDN) их нужно вписать в CSP, иначе браузер их молча
  заблокирует.

## Производительность
- Страницы `Admin`, `TeamPage`, `PlayerPage`, `AwardsPage`, `Stats` подгружаются через `React.lazy` (админка ~100 КБ не грузится обычным посетителям). Новые тяжёлые страницы делать так же.
- `App.jsx` не рендерит страницы, пока не ответил запрос `seasons` (`seasonsReady`) — иначе данные грузятся дважды. Исключение — вкладка «Таблица»: её запросы (лига, команды со связью `season_teams`, матчи) стартуют сразу, а по сезону фильтруются на клиенте. Календарь монтируется после номинаций (иначе CLS).
- Запросы на странице делать параллельно (`Promise.all`), а не цепочкой: Supabase в Европе, до Ташкента ~0.8 с на запрос.
- Фото команд (`public/teams/*.jpg`) — до 900 px, JPEG q50; логотип 160×160. Пути в БД (`teams.photo_url`) указывают на эти имена — не переименовывать.
- `@tanstack/react-query` установлен, но не используется; кэша данных между экранами нет (возможное улучшение).

## Зависимости — важное
- `vite-plugin-pwa@1.2.0` не поддерживает Vite 8 официально → установлен через `--legacy-peer-deps`, в корне есть `.npmrc` с `legacy-peer-deps=true` (без него Vercel упадёт при установке зависимостей)

## Тесты
```
npm run test        # однократный прогон
npm run test:watch  # в режиме наблюдения
```
27 тестов покрывают: определение победителя, начисление очков, строку и сортировку
турнирной таблицы, фильтрацию матчей по статусу и сезону.

**Важно:** тесты импортируют код из `src/lib/` — тот же, что выполняется в приложении.
Новую доменную логику класть туда, а не внутрь компонентов: иначе она снова окажется
непокрытой. Раньше тесты содержали собственные копии функций и проверяли копию.

`.claude/worktrees` исключены из vitest и eslint — иначе они прогоняются по
нескольким копиям репозитория сразу.

## Управление пользователями (доступ в админку)
Добавляются через Supabase Dashboard:
`https://supabase.com/dashboard/project/gvkdumzyhdguupdhcqeb/auth/users`
→ Add user → Create new user → email + пароль


---

## Серверная архитектура

Если в рамках задачи изменяется что-то на уровне сервера Sreda (`78.111.89.182`) — порты, nginx-конфиги, Docker-контейнеры, systemd-сервисы, PM2-процессы — **обязательно обнови `/root/SERVER_MAP.md`** на сервере.

Примеры изменений, требующих обновления карты:
- изменился или добавился порт
- добавлен/удалён Docker-контейнер или systemd-сервис
- изменился nginx-конфиг в `/etc/nginx/sites-enabled/`
- добавлен новый PM2-процесс

Корневые файлы сервера: `/root/CLAUDE.md` (инструкции агенту) и `/root/SERVER_MAP.md` (карта всех сервисов).
