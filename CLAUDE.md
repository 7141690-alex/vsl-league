# VSL — Volleyball Super League

## Инструкция для агента
Этот файл — главный источник знаний о проекте. **Обязательные правила:**
- При начале работы с проектом — прочитать этот файл полностью перед тем как сканировать код
- После каждого значимого изменения (новая фича, изменение схемы БД, изменение деплоя, новые зависимости) — **обновить этот файл** чтобы он отражал актуальное состояние
- Файл должен быть достаточно полным чтобы новый агент мог сразу приступить к работе без изучения всего кода

## Что это
Веб-приложение для управления волейбольной лигой: турнирная таблица, расписание матчей, составы команд. React + Vite + Supabase + Tailwind CSS v4. PWA (устанавливается на телефон).

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
    Admin.jsx       — панель администратора (авторизация через Supabase Auth)
  components/
    CalendarWidget.jsx  — виджет календаря под таблицей
    MikasaBall.jsx      — SVG-иконка мяча в шапке
  lib/
    supabase.js     — клиент Supabase (ключи из .env)
  test/
    logic.test.js   — unit-тесты бизнес-логики (Vitest)
    setup.js        — setup файл для тестов
  App.jsx           — роутинг, шапка, переключение лига/таб, InstallBanner (PWA)
```

## База данных Supabase — таблицы

### teams
| Колонка | Тип    | Описание               |
|---------|--------|------------------------|
| id      | uuid   | PK                     |
| name    | text   | Название команды       |
| league  | text   | 'male' или 'female'    |

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

## Логика начисления очков (Standings)
- Победа 3:0 или 3:1 → **3 очка** победителю, **0** проигравшему
- Победа 3:2 → **3 очка** победителю, **1 очко** проигравшему
- Зона плей-офф: топ-3 (синяя полоса)
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
3. Push через токен (токен хранить только временно в URL, после push убирать):
   ```
   git remote set-url origin https://7141690-alex:<TOKEN>@github.com/7141690-alex/vsl-league.git
   git push
   git remote set-url origin https://github.com/7141690-alex/vsl-league.git
   ```
4. Vercel подхватывает коммит автоматически (иногда нужно Redeploy вручную через Dashboard)

### Если Vercel не деплоит автоматически
Зайти на vercel.com → проект vsl-league → Deployments → три точки у последнего деплоя → **Redeploy**

### Миграции БД
Новые колонки добавляются вручную через Supabase SQL Editor:
`https://supabase.com/dashboard/project/gvkdumzyhdguupdhcqeb/sql/new`

## Зависимости — важное
- `vite-plugin-pwa@1.2.0` не поддерживает Vite 8 официально → установлен через `--legacy-peer-deps`, в корне есть `.npmrc` с `legacy-peer-deps=true` (без него Vercel упадёт при установке зависимостей)

## Тесты
```
npm run test  # или npx vitest run
```
24 теста покрывают: победы/поражения, фильтрацию матчей, счётчик побед, логику капитана, сортировку по номеру, отображение счёта по сетам.

## Управление пользователями (доступ в админку)
Добавляются через Supabase Dashboard:
`https://supabase.com/dashboard/project/gvkdumzyhdguupdhcqeb/auth/users`
→ Add user → Create new user → email + пароль
