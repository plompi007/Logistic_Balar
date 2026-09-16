# Logistic Balar - מערכת דרישות לוגיסטיות לקורסים

אתר סטטי (ללא שרת) שמתארח על **GitHub Pages**, עם **Firebase** (Firestore + Authentication)
בתור מסד הנתונים המשותף - באותו דפוס כמו במעקב הציוד.

## מה המערכת עושה

1. **טופס הגשה** (`index.html`) - כל מדריך/מפקד קורס ממלא טופס קצר ונוח (מובייל-פרנדלי,
   RTL בעברית): שם הקורס, תאריך ושעות, כמות חניכים, צורך בכיתה ושעותיה, רשימת אמל"ח נדרש
   (פריט + כמות), רשימת ציוד לוגיסטי נדרש (פריט + כמות) והערות. ההגשה נכתבת ישירות ל-Firestore.
2. **עמוד ניהול** (`admin.html`) - כניסה עם **Google Sign-In**, מוגבלת רק לכתובת המייל
   שהוגדרה כמנהל (`nohar.tzur@gmail.com`) - גם אם מישהו אחר ינחש את כתובת האתר, הוא לא יוכל
   לראות שום דבר בלי להתחבר עם אותו חשבון Google. מציג את כל הדרישות שהוגשו, מאפשר סינון
   לפי תאריך קורס, מחיקת דרישה שגויה, ולחיצה על **"ייצוא דוח מסודר"** מייצרת דף HTML מעוצב
   וקריא שמחלק את כל הדרישות לפי קורס/מגיש, כולל סימון ברור לדרישות שהוגשו **באיחור** (אחרי
   השעה 12:00 של היום שלפני הקורס). ניתן להדפיס/לשמור כ-PDF ישירות מהדוח בלחיצת כפתור.
   ניתן להגיש דרישות חדשות בכל יום - כל ההגשות נשמרות ב-Firestore ומצטברות שם.
3. **דוח WhatsApp יומי אוטומטי** - כל יום בשעה 15:00 (שעון ישראל) נשלחת הודעת WhatsApp עם כל
   הדרישות שהוגשו לקורסים של **מחר**, מסודרות וקריאות. רץ אוטומטית דרך GitHub Actions - לא
   דורש שרת. פרטים מלאים בהמשך.

## הקמה חד-פעמית ב-Firebase

1. להיכנס ל-[console.firebase.google.com](https://console.firebase.google.com) וליצור פרויקט חדש
   (אפשר גם להשתמש בפרויקט קיים אם יש).
2. **Build → Firestore Database → Create database** - לבחור location אירופאי (למשל `eur3`
   או `europe-west1`) ו-"Start in production mode". **לא ניתן לשנות location אחרי היצירה.**
3. **Build → Authentication → Sign-in method** - להפעיל את **Google**.
4. **Project settings** (גלגל השיניים) **→ General → Your apps → Add app → Web (</>)** -
   להעתיק את אובייקט ה-config שמתקבל.
5. להדביק את הערכים בקובץ [`js/firebase-config.js`](js/firebase-config.js) במקום ה-`REPLACE_ME`.
6. להעלות את כללי האבטחה מהקובץ [`firestore.rules`](firestore.rules) לטאב **Firestore →
   Rules** בקונסולה (העתק-הדבק ו-Publish), או דרך ה-CLI: `firebase deploy --only firestore:rules`.
   הכללים מאפשרים לכל אחד להגיש דרישה חדשה, אבל קריאה/עדכון/מחיקה מותרים רק לחשבונות ה-Google
   שמוגדרים כמנהלים (`nohar.tzur@gmail.com`, `yonatan1279@gmail.com`). כדי להוסיף/להסיר מנהל
   בעתיד יש לעדכן את רשימת האימיילים בשני מקומות יחד: מערך ה-emails ב-`firestore.rules` (ואז
   Publish מחדש) והמערך `ADMIN_EMAILS` ב-`js/admin.js`.

## פרסום כאתר חי דרך GitHub Pages

1. בריפו ב-GitHub: **Settings → Pages**.
2. תחת **Build and deployment → Source** לבחור **Deploy from a branch**.
3. לבחור את הענף הזה (או `main` אחרי מיזוג) ותיקייה **`/ (root)`** → **Save**.
4. אחרי דקה-שתיים יופיע קישור ציבורי בסגנון `https://<username>.github.io/Logistic_Balar/`.
   זה קישור הטופס. עמוד הניהול נמצא בכתובת `.../admin.html`.
5. כל פוש לענף שנבחר יעדכן את האתר החי אוטומטית (עד דקה-שתיים).

## הקמה חד-פעמית - דוח WhatsApp יומי (אופציונלי)

זה רץ דרך **GitHub Actions** (לא דורש שרת, לא דורש שדרוג ל-Firebase בתשלום), ושולח בכל יום
ב-15:00 שעון ישראל הודעת WhatsApp אחת עם כל הדרישות של הקורסים למחר. הבחירה היא ב-**CallMeBot**
(שירות חינמי אך לא רשמי, שולח רק למספר טלפון בודד שנרשם מראש).

**שלב 1 - מפתח גישה ל-Firestore (Service Account):**
1. ב-[console.firebase.google.com](https://console.firebase.google.com) בפרויקט `balar-logistic`:
   **Project settings → Service accounts → Generate new private key**. יורד קובץ JSON - לשמור
   בצד (זה קובץ רגיש, **אסור** להעלות אותו לריפו).

**שלב 2 - הרשמה ל-CallMeBot (עושים פעם אחת, מהטלפון שרוצים לקבל אליו את ההודעות):**
1. להיכנס ל-[callmebot.com](https://www.callmebot.com) ולחפש את העמוד **"WhatsApp Free API"**
   (או "Free API WhatsApp Messages") ולעקוב אחרי ההוראות המדויקות שם - בגדול: שומרים את
   מספר הטלפון של הבוט כאיש קשר בוואטסאפ, שולחים אליו הודעת הפעלה, ומקבלים בחזרה הודעה עם
   **apikey** אישי. ההוראות המדויקות (מספר הטלפון, נוסח ההודעה) מופיעות שם באתר ועשויות
   להשתנות מעת לעת, אז עדיף לפעול לפי מה שכתוב שם באותו רגע ולא לפי הוראות ישנות.
2. חשוב: זה עובד רק עבור **מספר טלפון אחד** שנרשם (זה שביצע את ההרשמה) - לא ניתן לשלוח
   למספרים נוספים בלי שכל אחד ירשם בנפרד עם ה-apikey שלו.

**שלב 3 - הוספת Secrets בריפו ב-GitHub** (Settings → Secrets and variables → Actions →
New repository secret):

| שם ה-secret | ערך |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | כל התוכן של קובץ ה-JSON משלב 1 (העתק-הדבק) |
| `CALLMEBOT_PHONE` | מספר הטלפון שנרשם, בפורמט בינלאומי בלי `+` ורווחים (למשל `972501234567`) |
| `CALLMEBOT_APIKEY` | ה-apikey שהתקבל מ-CallMeBot בשלב 2 |

זהו - מהיום הבא ההודעה תישלח אוטומטית כל יום ב-15:00. אפשר גם להריץ ידנית לבדיקה: בטאב
**Actions** בריפו → **WhatsApp daily logistics report** → **Run workflow**.

הסקריפט עצמו נמצא ב-[`scripts/send-whatsapp-report.js`](scripts/send-whatsapp-report.js),
וה-workflow שמתזמן אותו ב-[`.github/workflows/whatsapp-daily-report.yml`](.github/workflows/whatsapp-daily-report.yml).

## הרצה מקומית לבדיקה

אין תהליך build - מספיק שרת קבצים סטטי כלשהו, למשל:

```bash
python3 -m http.server 8080
# או
npx serve .
```

ואז לפתוח `http://localhost:8080`.

## מבנה הפרויקט

```
index.html                              טופס ההגשה הציבורי
admin.html                              עמוד הניהול (כניסה מוגנת)
css/style.css                           עיצוב משותף
js/form.js                              לוגיקת טופס ההגשה + כתיבה ל-Firestore
js/admin.js                             התחברות מנהל, טבלת הגשות, מחיקה, ייצוא
js/report.js                            בניית דוח ה-HTML המודפס (משותף לעמוד הניהול)
js/firebase-init.js                     אתחול Firebase SDK
js/firebase-config.js                   פרטי החיבור לפרויקט Firebase שלכם (יש למלא!)
firestore.rules                         כללי האבטחה של מסד הנתונים
firebase.json                           הגדרת CLI לפריסת ה-rules
scripts/send-whatsapp-report.js         שליחת דוח WhatsApp יומי (רץ ב-GitHub Actions בלבד)
.github/workflows/whatsapp-daily-report.yml   תזמון ה-cron היומי לדוח ה-WhatsApp
package.json / package-lock.json        תלות ה-Node היחידה (firebase-admin) לסקריפט ה-WhatsApp
```

**חשוב:** מלבד סקריפט ה-WhatsApp (שרץ רק בתוך GitHub Actions, לא בדפדפן), **האתר עצמו נשאר
סטטי לגמרי** - אין שרת שצריך להריץ כדי שהטופס/הניהול יעבדו.
