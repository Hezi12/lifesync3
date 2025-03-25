# תוכנית הגירה מאחסון מקומי ל-Firebase

תוכנית זו מפרטת את השלבים הנדרשים להגירת נתונים מאחסון מקומי (localStorage) לשירות ענן Firebase.

## עקרונות כלליים

1. ההגירה תבוצע בהדרגה, קומפוננטה אחר קומפוננטה
2. יש לשמור על תאימות לאחור כדי לאפשר למשתמשים להמשיך להשתמש באפליקציה גם במהלך ההגירה
3. בכל שלב יש לבדוק אם הנתונים קיימים ב-Firebase לפני הניסיון לקרוא אותם מהאחסון המקומי
4. אם נמצאו נתונים באחסון מקומי שאינם קיימים ב-Firebase, יש להעלות אותם אוטומטית

## שלבי הגירה

### 1. מערכת אימות משתמשים

* יצירת מסכי התחברות והרשמה
* התאמת AppContext לעבודה עם מערכת האימות של Firebase
* שמירת מזהה המשתמש ב-Context וב-localStorage לשימוש בכל הקומפוננטות

### 2. מערכת המסמכים

* התאמת DocumentsContext כך שיעבוד מול Firebase במקום localStorage
* הוספת שדה userId לכל המסמכים כדי לאפשר אחסון והפרדה לפי משתמש
* מימוש לוגיקת ההגירה הבאה:
  1. בדיקה אם קיימים מסמכים ב-Firebase עבור המשתמש
  2. אם לא, בדיקה אם קיימים מסמכים ב-localStorage
  3. אם כן, העלאתם ל-Firebase באופן אוטומטי
  4. מחיקת המסמכים מ-localStorage לאחר העלאה מוצלחת

### 3. מערכת לוח השנה

* התאמת CalendarContext לעבודה מול Firebase
* הוספת שדה userId לכל האירועים וקטגוריות האירועים
* מימוש לוגיקת הגירה דומה:
  1. בדיקה אם קיימים נתונים ב-Firebase
  2. העלאה אוטומטית מ-localStorage אם צריך
  3. מימוש תצוגת אירועים ושמירתם ב-Firebase

### 4. מערכת פיננסים

* התאמת ניהול העסקאות, שיטות התשלום והקטגוריות הפיננסיות לעבודה מול Firebase
* הוספת שדה userId לכל האובייקטים
* מימוש לוגיקת הגירה מ-localStorage ל-Firebase

### 5. מערכת בריאות

* התאמת ניהול נתוני המשקל, יעדי המשקל והפעילויות הגופניות לעבודה מול Firebase
* הוספת שדה userId לכל האובייקטים
* מימוש לוגיקת הגירה ל-Firebase

## פונקציות הגירה כלליות

יש ליצור פונקציות הגירה גנריות שיכולות לשמש את כל הקומפוננטות:

```typescript
// פונקציה גנרית להגירת נתונים מ-localStorage ל-Firebase
async function migrateDataToFirebase<T>(
  userId: string,
  localStorageKey: string,
  firestoreCollection: string,
  convertLocalItemToFirestore: (item: T) => any
): Promise<void> {
  // בדיקה אם יש נתונים ב-Firebase
  const existingFirestoreData = await checkFirestoreData(userId, firestoreCollection);
  
  if (existingFirestoreData.length === 0) {
    // אין נתונים ב-Firebase, בדיקה אם יש נתונים ב-localStorage
    const localData = localStorage.getItem(localStorageKey);
    
    if (localData) {
      try {
        const parsedData: T[] = JSON.parse(localData);
        
        // העלאת הנתונים ל-Firebase
        for (const item of parsedData) {
          const firestoreData = convertLocalItemToFirestore(item);
          await addDoc(collection(db, firestoreCollection), {
            ...firestoreData,
            userId
          });
        }
        
        // מחיקת הנתונים מ-localStorage לאחר העלאה מוצלחת
        localStorage.removeItem(localStorageKey);
        
        console.log(`הנתונים הועברו בהצלחה מ-localStorage ל-Firebase: ${localStorageKey}`);
      } catch (error) {
        console.error(`שגיאה בהגירת נתונים מ-localStorage ל-Firebase: ${localStorageKey}`, error);
      }
    }
  }
}

// פונקציה לבדיקה אם יש נתונים ב-Firebase
async function checkFirestoreData(userId: string, firestoreCollection: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, firestoreCollection),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const data: any[] = [];
    
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    
    return data;
  } catch (error) {
    console.error(`שגיאה בבדיקת נתונים ב-Firebase: ${firestoreCollection}`, error);
    return [];
  }
}
```

## אבטחה ואישור גישה

* יש להגדיר חוקי אבטחה ב-Firestore שיאפשרו גישה לנתונים רק למשתמש המתאים
* יש להשתמש בטוקנים וchallenge כדי לוודא שרק המשתמש המזוהה יכול לגשת לנתונים שלו

## יצירת גיבויים

* לפני ביצוע ההגירה, יש ליצור גיבוי של כל הנתונים מה-localStorage
* יש לשמור את הגיבוי בקובץ JSON שניתן להוריד למחשב המשתמש
* יש לספק אפשרות לשחזור מגיבוי במקרה של תקלות

## בדיקות

* יש לכתוב בדיקות מקיפות לכל תהליך ההגירה
* יש לוודא שהנתונים מועברים באופן שלם ומדויק
* יש לבדוק תרחישי קצה כמו ניתוק אינטרנט באמצע ההגירה

## לוח זמנים

1. שלב 1 (אימות משתמשים) - 1 שבוע
2. שלב 2 (מערכת מסמכים) - 1 שבוע
3. שלב 3 (לוח שנה) - 1 שבוע
4. שלב 4 (פיננסים) - 1 שבוע
5. שלב 5 (בריאות) - 1 שבוע

סה"כ: 5 שבועות להשלמת ההגירה 