// שולח התראות Push לדפדפנים שנרשמו (ראו js/push-subscribe.js), דרך web-push + VAPID.
const webpush = require('web-push');

let configured = false;
function ensureVapid() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error('חסרים VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY');
  webpush.setVapidDetails('mailto:nohar.tzur@gmail.com', publicKey, privateKey);
  configured = true;
}

// שולח את אותה התראה לכל המנויים הרשומים תחת אימייל נתון (למשתמש יכולים להיות כמה
// מכשירים/דפדפנים רשומים). מנוי שפג/בוטל (404/410 מהדפדפן) נמחק אוטומטית מ-Firestore.
async function sendPushToEmail(db, email, payload) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return; // Push לא מוגדר - שקט
  ensureVapid();

  const snapshot = await db.collection('pushSubscriptions').where('userEmail', '==', email).get();
  await Promise.all(
    snapshot.docs.map(async (doc) => {
      const sub = doc.data();
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload));
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await doc.ref.delete();
        } else {
          console.error(`שגיאה בשליחת push ל-${email}:`, err.message);
        }
      }
    })
  );
}

module.exports = { sendPushToEmail };
