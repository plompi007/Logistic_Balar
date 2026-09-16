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
   הכללים מאפשרים לכל אחד להגיש דרישה חדשה, אבל קריאה/עדכון/מחיקה מותרים רק לחשבון ה-Google
   שמוגדר כמנהל (`nohar.tzur@gmail.com`, ניתן לשינוי גם ב-`firestore.rules` וגם ב-`js/admin.js`
   באותו זמן אם רוצים להוסיף/להחליף כתובת).

## פרסום כאתר חי דרך GitHub Pages

1. בריפו ב-GitHub: **Settings → Pages**.
2. תחת **Build and deployment → Source** לבחור **Deploy from a branch**.
3. לבחור את הענף הזה (או `main` אחרי מיזוג) ותיקייה **`/ (root)`** → **Save**.
4. אחרי דקה-שתיים יופיע קישור ציבורי בסגנון `https://<username>.github.io/Logistic_Balar/`.
   זה קישור הטופס. עמוד הניהול נמצא בכתובת `.../admin.html`.
5. כל פוש לענף שנבחר יעדכן את האתר החי אוטומטית (עד דקה-שתיים).

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
index.html          טופס ההגשה הציבורי
admin.html           עמוד הניהול (כניסה מוגנת)
css/style.css         עיצוב משותף
js/form.js            לוגיקת טופס ההגשה + כתיבה ל-Firestore
js/admin.js           התחברות מנהל, טבלת הגשות, מחיקה, ייצוא
js/report.js          בניית דוח ה-HTML המודפס (משותף לעמוד הניהול)
js/firebase-init.js   אתחול Firebase SDK
js/firebase-config.js פרטי החיבור לפרויקט Firebase שלכם (יש למלא!)
firestore.rules       כללי האבטחה של מסד הנתונים
firebase.json         הגדרת CLI לפריסת ה-rules
```
