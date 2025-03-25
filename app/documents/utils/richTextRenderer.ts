export const renderRichContent = (text: string) => {
  // המרת שורות שמתחילות ב-# לכותרות
  let formattedText = text.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold my-3">$1</h1>');
  formattedText = formattedText.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold my-2">$1</h2>');
  formattedText = formattedText.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold my-2">$1</h3>');
  
  // המרת טקסט מודגש
  formattedText = formattedText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // המרת טקסט נטוי
  formattedText = formattedText.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // המרת רשימות
  formattedText = formattedText.replace(/^- (.+)$/gm, '<li class="mr-5">$1</li>');
  
  // תיקון לשגיאת regex: טיפול ברשימות בדרך אחרת
  let outputText = '';
  let inList = false;
  
  formattedText.split('\n').forEach(line => {
    if (line.match(/^<li/)) {
      if (!inList) {
        outputText += '<ul class="list-disc my-2">';
        inList = true;
      }
      outputText += line;
    } else {
      if (inList) {
        outputText += '</ul>';
        inList = false;
      }
      outputText += line;
    }
  });
  
  if (inList) {
    outputText += '</ul>';
  }
  
  // המרת שורות רגילות לפסקאות
  formattedText = outputText.replace(/^(?!(<h[1-3]|<ul|<li)).+$/gm, '<p class="my-1">$&</p>');
  
  // המרת שורות ריקות למרווחים
  formattedText = formattedText.replace(/^\s*$/gm, '<div class="h-2"></div>');
  
  return { __html: formattedText };
}; 