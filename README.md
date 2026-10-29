# EventStyle – Client (React)

## 1. הפרויקט ומטרתו

**EventStyle** היא מערכת לסטודיו לעיצוב אירועים: אתר ציבורי עם גלריות ומחירונים לפי סוג אירוע, אזור אישי שבו לקוחות שולחות בקשות לעיצוב ועוקבות אחרי האירוע, וממשק ניהול שבו המנהלת מאשרת בקשות ומנהלת את הסטודיו.

## 2. צד הלקוח

ה־Repository הזה הוא צד הלקוח: אפליקציית SPA ב־React ו־TypeScript, בעברית ומימין לשמאל (RTL), שמותאמת למחשב ולטלפון.
האפליקציה מתחברת לשרת ה־API של EventStyle (Repository נפרד, `backend`). כל המידע מגיע מה־API; באתר עצמו יש רק טקסטים ואת פרטי הקשר של הסטודיו.

| מסמך | למה |
|---|---|
| [FRONTEND-REQUIREMENTS-CHECKLIST.md](FRONTEND-REQUIREMENTS-CHECKLIST.md) | כל 26 דרישות הצ'קליסט: איפה מומשה כל דרישה ואיך נבדקה |
| `backend/FRONTEND-API-GUIDE.md` | מדריך ה־API: כל Endpoint, טיפוסים ושגיאות |
| `backend/DEPLOYMENT.md` | הוראות העלאה עתידית ל־Render (שרת, מסד ואתר) |

## 3. טכנולוגיות

| תחום | ספרייה |
|---|---|
| בסיס | React 19, TypeScript (strict), Vite 8 |
| ניתוב | React Router 7 (`BrowserRouter`, `ProtectedRoute` לפי תפקיד) |
| מידע מהשרת | TanStack Query 5 (`useQuery`, `useMutation`, `invalidateQueries`) |
| תקשורת | Axios – instance מרכזי אחד (`src/api/apiClient.ts`) |
| טפסים | React Hook Form (ולידציה זהה לכללי השרת) |
| התחברות Google | `@react-oauth/google` |
| עיצוב | Tailwind CSS 4 (`@tailwindcss/vite`), בלי ספריית רכיבים (ראו "העיצוב" בהמשך) |
| בדיקות | Vitest, Testing Library, MSW (Mock API), Playwright (E2E) |
| איכות קוד | TypeScript strict, Oxlint |

### העיצוב

- **Tailwind CSS 4** דרך התוסף `@tailwindcss/vite` (ב־`vite.config.ts`). קובץ הכניסה הוא `src/index.css`.
- **משתני עיצוב (CSS Custom Properties)** ב־`:root`: צבעים (שנהב, כחול עמוק וזהב), רדיוסים, צללים, גופנים ורוחב התוכן. ב־`@theme inline` הם ממופים למחלקות Tailwind (`text-ink`, `bg-navy`, `text-gold`, `rounded-card`, `shadow-raised`, `font-serif` וכו'), כך שהמראה אחיד.
- **מחלקות משותפות** שחוזרות בכמה עמודים מרוכזות בקבועים ב־`src/styles/`: `authClasses.ts` (התחברות והרשמה), `filterClasses.ts` (סרגלי סינון), `tabClasses.ts` (לשוניות), `eventTypeBackgrounds.ts` (רקע לפי סוג אירוע).
- **CSS משלים:** `src/styles/eventstyle.css` נטען בשכבת `components`, ומחלקות Tailwind גוברות עליו. הוא מחזיק את משתני העיצוב, את סגנונות הבסיס (גופנים, קישורים, פוקוס) ואת רכיבי מערכת העיצוב המשותפים (`btn`, `card`, `form`, `field`, טבלאות, חלונות, תפריט הניווט בנייד). אלה נשארו ב־CSS כי יש להם מצבי hover, פוקוס ו־disabled ונקודות שבירה בכמה שכבות, שקל יותר לשמור מדויקים בקובץ אחד.
- **Preflight כבוי:** איפוס הבסיס של Tailwind לא נטען, כדי שהמראה יישאר זהה לעיצוב המקורי. ההמרה אומתה בהשוואת צילומי מסך פיקסל־לפיקסל (17 עמודים, מחשב ונייד, אורחת, לקוחה ומנהלת).
- **גופנים:** Heebo לטקסט ו־Frank Ruhl Libre לכותרות (Google Fonts, נטענים ב־`index.html`).
- **רספונסיביות:** נקודות שבירה ב־900px, ‏760px ו־480px – תפריט נפתח בנייד, טבלאות שהופכות לכרטיסים, וטפסים בטור אחד.
- **נגישות:** ניגודיות AA לכפתורים ולקישורים, פוקוס בולט, קישור דילוג לתוכן, ו־`prefers-reduced-motion` שמבטל אנימציות.
- רכיבים חוזרים נמצאים ב־`src/components/ui`.

## 4. מבנה התיקיות

```
src/
├── api/          # Axios instance, ApiError, פונקציה לכל Endpoint, QueryClient ומפתחות Cache
├── components/   # רכיבים חוזרים: ui/ (Modal, Alert, Pagination, QueryState...), photos/ (תמונות פרטיות)
├── config/       # משתני הסביבה (נבדקים בטעינה)
├── context/      # AuthContext (משתמשת, Token, התחברות/התנתקות), Toasts
├── hooks/        # useAuth, useToast, ו-Hooks של TanStack Query לכל ישות
├── layouts/      # פריסת האתר ופריסת ממשק הניהול
├── pages/        # עמודים: ציבוריים, client/ (לקוחה), admin/ (מנהלת – נטען ב-Lazy Loading)
├── routes/       # ProtectedRoute (לפי התחברות ותפקיד)
├── types/        # טיפוסים לפי ה-Swagger: user, event, package, gallery, photo, common
├── utils/        # הודעות שגיאה בעברית, ולידציה, Reducers, פורמטים
├── test/         # Mock API (MSW), נתוני בדיקה ובדיקות אינטגרציה
├── styles/       # קבועי מחלקות Tailwind משותפים ו־CSS משלים (eventstyle.css)
└── index.css     # כניסת Tailwind ומיפוי משתני העיצוב
e2e/              # בדיקות End-to-End (Playwright) מול Mock API
```

### ניהול State

| כלי | איפה ולמה |
|---|---|
| `useState` | שדות זמניים, פתיחת חלונות, הודעות, סינון בעמודים פשוטים |
| `useReducer` | העלאת תמונות (`utils/uploadReducer.ts`) ומסנני רשימת האירועים (`utils/eventFiltersReducer.ts` – כל שינוי מחזיר לעמוד 1) |
| `useContext` | רק המשתמשת, ה־Token ופעולות ההתחברות (`AuthContext`), והודעות Toast. **אין** ב־Context נתונים מהשרת |
| `useQuery` / `useMutation` | כל המידע מהשרת. אחרי כל שינוי – `invalidateQueries` לפי מפתחות מרוכזים (`api/queryClient.ts`) |
| התנתקות | מוחקת את ה־Token **ואת כל ה־Cache**, כולל הקישורים הזמניים לתמונות הפרטיות |

## 5. דרישות להפעלה

- Node.js 20.19 ומעלה (מומלץ 22).
- שרת ה־API של EventStyle פועל (ברירת מחדל `http://localhost:4000`) – ראו `backend/START-HERE.md`.
- לבדיקות E2E: Google Chrome מותקן במחשב.
- להתחברות Google (רשות): Client ID מ־Google Cloud Console.

## 6. התקנה מקומית

```bash
cd EventStyle-Client
npm install
cp .env.example .env.development   # ולמלא ערכים (ראו סעיף 8)
```

## 7. הרצה

```bash
# 1. השרת (בטרמינל נפרד) – פורט 4000
cd backend
npm run dev

# 2. צד הלקוח – פורט 5173
cd EventStyle-Client
npm run dev
```

| מה | כתובת |
|---|---|
| האתר (פיתוח) | <http://localhost:5173> |
| ה־API | <http://localhost:4000/api> |
| Swagger | <http://localhost:4000/api-docs/> |

### משתמשי הדגמה (פיתוח בלבד – נוצרים ב־Seed של השרת)

| תפקיד | אימייל | סיסמה |
|---|---|---|
| מנהלת | admin@eventstyle.example | `Admin12345` (סיסמת הפיתוח, או `SEED_ADMIN_PASSWORD` בשרת) |
| לקוחה | noa.levi@example.com | `Client12345` |

**כניסה כמנהלת:** **התחברות** ← אימייל וסיסמה (לא Google) ← מעבר אוטומטי לממשק הניהול (`/admin`). בענן אין סיסמת ברירת מחדל – המנהלת נוצרת עם `SEED_ADMIN_EMAIL` ו־`SEED_ADMIN_PASSWORD` שמוגדרים בשרת.

### בדיקות

```bash
npm test            # בדיקות Unit ו-Component/אינטגרציה (Vitest + MSW)
npm run test:e2e    # בדיקות End-to-End בדפדפן, מחשב ונייד (Playwright)
npm run typecheck   # TypeScript
npm run lint        # Oxlint
npm run build       # Build ל-Production
npm run check       # typecheck + lint + test + build
```

כל הבדיקות האוטומטיות רצות מול Mock API בלבד – אין פנייה לשרת אמיתי ואין שינוי של נתונים.

## 8. חיבור לשרת ומשתני סביבה

כל הקריאות עוברות דרך Axios instance אחד (`src/api/apiClient.ts`): כתובת הבסיס מ־`VITE_API_URL`, Header של `Authorization: Bearer <token>`, והמרת כל שגיאה ל־`ApiError` עם `status` ו־`code`. ‏`401` מנתק את המשתמשת ומוחק את ה־Cache. לכל Endpoint יש פונקציה ב־`src/api/*Api.ts`, והטיפוסים ב־`src/types/` תואמים ל־Swagger של השרת.

כל ערכי ה־`VITE_*` גלויים לדפדפן – **אין לשים בהם סודות**. קובצי `.env` אמיתיים לא עולים ל־Git; רק קובצי הדוגמה.

| משתנה | חובה | תיאור |
|---|---|---|
| `VITE_API_URL` | ✔ | כתובת ה־API כולל `/api`. בלעדיה האפליקציה מציגה שגיאה ברורה ולא עולה |
| `VITE_GOOGLE_CLIENT_ID` | ✘ | Client ID של Google (כמו `GOOGLE_CLIENT_ID` בשרת). ריק = בלי כפתור Google |
| `VITE_CONTACT_EMAIL`, `VITE_CONTACT_PHONE` | ✘ | פרטי הקשר בעמוד "איך מזמינים" ובתחתית האתר. ריקים = פרטי הסטודיו הציבוריים (`DEFAULT_CONTACT` ב־`src/config/env.ts`) |

אחרי שינוי בקובץ `.env` יש להפעיל מחדש את `npm run dev`, ובסביבות אחרות – ליצור Build חדש.

## 9. סוגי משתמשים

| משתמשת | מה אפשר לעשות |
|---|---|
| **אורחת** | דף בית, סוגי אירועים, מחירון לכל סוג אירוע, גלריה לכל סוג אירוע (עם תצוגה מוגדלת), הסבר על הזמנה ופרטי קשר, הרשמה והתחברות |
| **לקוחה** | כל מה שמותר לאורחת, וגם: פרופיל (שם, טלפון, כתובת), שליחת בקשה לעיצוב ועריכתה כל עוד היא ממתינה, האירועים והבקשות שלה (חיפוש, סינון ומיון, סטטוס, סיבת דחייה), תמונות פרטיות של האירוע – צפייה, העלאה, מחיקת תמונות שהעלתה, והסכמה או ביטול הסכמה לפרסום בגלריה |
| **מנהלת** | אישור ודחייה של בקשות, ניהול אירועים (חיפוש, סינון, מיון ועמודים, יצירה, עריכה, סטטוס, מחיקה), תמונות האירועים ופרסום תמונות שקיבלו הסכמה, ניהול הגלריה, ניהול חבילות ומחירון (כולל ארכיון) |

ההגנה בצד הלקוח (`ProtectedRoute`, הסתרת כפתורים) היא חוויית משתמש בלבד – השרת בודק הרשאות בכל בקשה.

## 10. המסכים המרכזיים

| נתיב | מסך | הרשאה |
|---|---|---|
| `/` | דף הבית: סוגי אירועים, עבודות נבחרות, איך זה עובד | כולם |
| `/packages?type=` | מחירון לפי סוג אירוע (וחבילות כלליות) | כולם |
| `/gallery`, `/gallery/:category` | גלריות לפי סוג אירוע, עם עמודים ותצוגה מוגדלת | כולם |
| `/contact` | איך מזמינים: בקשה מקוונת או פנייה ישירה (טלפון ומייל) | כולם |
| `/login`, `/register` | התחברות והרשמה (אימייל וסיסמה, או Google) | אורחת |
| `/account` | הפרופיל: שם, טלפון, כתובת | מחוברת |
| `/my-events`, `/my-events/:id` | האירועים והבקשות שלי: חיפוש, סינון ומיון, סטטוס, תמונות פרטיות והסכמה לפרסום | לקוחה |
| `/my-events/new` | בקשה חדשה לעיצוב אירוע | לקוחה |
| `/my-events/:id/edit` | עריכת בקשה ממתינה (בקשה שאושרה או נדחתה – נעולה) | בעלת הבקשה |
| `/admin` … | ממשק ניהול: סקירה עם מונה בקשות, אירועים ובקשות (אישור / דחייה), תמונות לפרסום, גלריה, חבילות | מנהלת |
| `/forbidden`, `*` | אין הרשאה / הדף לא נמצא | – |

**תהליך בקשה:** הלקוחה ממלאת טופס (שם, סוג, תאריך, מיקום, חבילה מהמחירון, צבע, אורחים, תקציב, קונספט, הערות) ← הבקשה `Pending` ← אפשר לערוך אותה עד שהמנהלת מאשרת (`New`) או דוחה עם סיבה (`Rejected`). אחרי אישור הסטטוס מתעדכן באזור האישי ואפשר להעלות תמונות. אין באתר תשלום.

**תמונות פרטיות:** מוצגות רק דרך קישור זמני (10 דקות) שהשרת יוצר אחרי בדיקת הרשאות. הרשימה מתרעננת לפני שהקישור פג, ותמונה שלא נטענת מבקשת קישור חדש פעם אחת. הסכמה לפרסום **לא** מפרסמת תמונה – רק המנהלת מפרסמת, והשרת יוצר עותק ציבורי נפרד.

## 11. התחברות עם Google

- כפתור Google (Google Identity Services, דרך `@react-oauth/google`) מופיע במסכי ההתחברות וההרשמה, ומשמש לשניהם.
- הכפתור מחזיר ID Token של Google, וצד הלקוח שולח אותו לשרת (`POST /auth/google`). השרת מאמת אותו, יוצר חשבון לקוחה או מחבר חשבון קיים, ומחזיר את ה־JWT של המערכת – בדיוק כמו בהתחברות רגילה. ה־Token של Google לא נשמר.
- חשבון מנהלת מתחבר רק עם אימייל וסיסמה.
- הכפתור מוצג רק כש־`VITE_GOOGLE_CLIENT_ID` מוגדר ובפורמט תקין (`<id>.apps.googleusercontent.com`). בנוסף, ב־Google Cloud Console כתובת האתר חייבת להופיע ב־**Authorized JavaScript origins** (בפיתוח: `http://localhost:5173`).
- בהתנתקות מבוטלת גם הכניסה האוטומטית של Google.

## 12. סביבות פיתוח ופריסה

| סביבה | קובץ | פקודה | API |
|---|---|---|---|
| Development | `.env.development` (מ־`.env.example`) | `npm run dev` | השרת המקומי |
| Test | בתוך `vite.config.ts` (`test.env`) | `npm test` | Mock API (MSW) |
| E2E | `playwright.config.ts` (`webServer.env`) | `npm run test:e2e` | Mock API בדפדפן |
| QA | `.env.qa` (מ־`.env.qa.example`) | `npm run build:qa` | שרת QA |
| Production | משתני Render (או `.env.production` מ־`.env.production.example`) | `npm run build` | שרת Production |

אותו קוד בכל הסביבות – רק כתובת ה־API משתנה, ואף כתובת לא כתובה בתוך רכיב.

**פריסה ל־Render** (לא בוצעה עדיין):
- [render.yaml](render.yaml) מגדיר Static Site: `npm ci && npm run build`, פרסום `dist`, ו־**rewrite של כל נתיב ל־`index.html`** – כך רענון של `/my-events/5` או קישור ישיר עובדים עם `BrowserRouter`.
- `VITE_API_URL` ו־`VITE_GOOGLE_CLIENT_ID` מוגדרים ב־Render ונכנסים לקוד בזמן ה־Build. אחרי שינוי – Build חדש.
- בשרת: `CORS_ORIGIN` = כתובת האתר. ב־Google Cloud Console: כתובת האתר ב־Authorized JavaScript origins.
- ההוראות המלאות, צעד אחר צעד: `backend/DEPLOYMENT.md`.

## פתרון תקלות

| תקלה | פתרון |
|---|---|
| מסך שגיאה `VITE_API_URL is missing` | חסר `.env.development`. להעתיק מ־`.env.example` ולהפעיל מחדש את `npm run dev` |
| "אין חיבור לשרת" | השרת לא פועל, או ש־`VITE_API_URL` שגוי. לבדוק <http://localhost:4000/api/health> |
| שגיאת CORS בקונסול | כתובת האתר חסרה ב־`CORS_ORIGIN` בשרת (ברירת מחדל `http://localhost:5173`) |
| חזרה כל הזמן למסך ההתחברות | ה־Token פג (שעתיים). להתחבר מחדש |
| "התמונה לא זמינה כרגע" | הקישור הזמני פג ולא חודש. ללחוץ "טעינה מחדש", או לבדוק ש־Cloudinary מוגדר בשרת |
| אין כפתור Google | `VITE_GOOGLE_CLIENT_ID` ריק או לא בפורמט `<id>.apps.googleusercontent.com`. במקרה כזה מודפסת אזהרה בקונסול |
| Google מחזיר 403 / "origin not allowed" | ה־Client ID שגוי, או שכתובת האתר לא רשומה כ־Authorized JavaScript origin ב־Google Cloud Console |
| העלאה נכשלת עם 503 | Cloudinary לא מוגדר בשרת |
| 404 ברענון עמוד פנימי (בענן) | חסר ה־rewrite ל־`index.html` – ראו `render.yaml` |
