import { NLPParseResult, TransactionType } from '../types';

// Convert Eastern Arabic numerals (٠-٩) to standard digits (0-9)
export function normalizeArabicNumbers(str: string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = str;
  for (let i = 0; i < arabicDigits.length; i++) {
    result = result.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }
  return result;
}

// Local Arabic Natural Language Parser (Instant, 100% offline & fast)
export function parseArabicLocally(rawText: string): NLPParseResult {
  const text = normalizeArabicNumbers(rawText.trim());
  const today = new Date().toISOString().split('T')[0];

  // Number extraction: matches numbers like 500, 1200, 1,200, 70.5
  // Also looks for currency mentions like ريال, ر.س
  const numberRegex = /(\d+(?:[,\.]\d+)?)/g;
  const matches = [...text.matchAll(numberRegex)];

  let amount: number | null = null;
  if (matches.length > 0) {
    // Clean commas
    const numStr = matches[0][1].replace(/,/g, '');
    const parsedNum = parseFloat(numStr);
    if (!isNaN(parsedNum) && parsedNum > 0) {
      amount = parsedNum;
    }
  }

  // Determine transaction type
  const lowerText = text.toLowerCase();
  let type: TransactionType = 'expense'; // default fallback
  let typeDetected = false;

  // 1. Commission (عمولة / بونص / حافز / مكافأة)
  if (
    /عمول[ةه]|بونص|حافز|مكاف[اأإآ]?[ةه]|ارباح|أرباح|كوميشن/.test(lowerText) ||
    /حصلت على عمول[ةه]|لي عمول[ةه]|أضف لي.*عمول[ةه]|اضف لي.*عمول[ةه]/.test(lowerText)
  ) {
    type = 'commission';
    typeDetected = true;
  }
  // 2. Withdrawal (سحبة / سحبت / أخذت من الراتب / سلفة)
  else if (
    /سحب[تةه]?|سلف[ةه]|أخذت من الراتب|اخذت من الراتب|لي سحب|أخذت سلف[ةه]|اخذت سلف[ةه]|دفعة من الراتب|دفعه من الراتب/.test(lowerText)
  ) {
    type = 'withdrawal';
    typeDetected = true;
  }
  // 3. Salary (راتب / الراتب)
  else if (
    /^راتب\s+\d+/i.test(lowerText) ||
    /راتب شهر|الراتب الاساسي|الراتب الأساسي/.test(lowerText)
  ) {
    type = 'salary';
    typeDetected = true;
  }
  // 4. Expense (صرف / مصروف / دفعت / شريت / فاتورة / بنزين / مطعم / قهوة)
  else if (
    /صرف[ت]?|مصروف|دفعت|شريت|اشتريت|فاتور[ةه]|بنزين|مطعم|قهو[ةه]|غداء|عشاء|ضياف[ةه]|توصيل|تاكسي|اوبر|أوبر|مستلزمات|قرطاسي[ةه]/.test(lowerText)
  ) {
    type = 'expense';
    typeDetected = true;
  }

  // Determine category & description
  let category = 'عام';
  let description = rawText;

  if (type === 'commission') {
    category = 'عمولة مبيعات وإنجاز';
    description = rawText.includes('مبيعات') ? 'عمولة مبيعات' : 'عمولة إضافية للموظف';
  } else if (type === 'withdrawal') {
    category = 'سلفة وسحوبات شخصية';
    description = rawText.includes('راتب') ? 'سحب من الراتب' : 'سحب نقدي من المستحقات';
  } else if (type === 'salary') {
    category = 'راتب أساسي';
    description = 'تسجيل راتب شهري';
  } else {
    // Specific expense categories
    if (/بنزين|وقود|محطة|ديزل/.test(lowerText)) {
      category = 'وقود ومواصلات';
      description = 'مصروف وقود وبنزين للعمل';
    } else if (/مطعم|غداء|عشاء|فطور|اكل|وجب[ةه]/.test(lowerText)) {
      category = 'طعام وضيافة';
      description = 'مصروف مطعم ووجبات عمل';
    } else if (/قهو[ةه]|شاي|كافيه|مشروبات/.test(lowerText)) {
      category = 'ضيافة ومشروبات';
      description = 'مصروف قهوة وضيافة';
    } else if (/فاتور[ةه]|كهرباء|انترنت|اتصالات|جوال/.test(lowerText)) {
      category = 'فواتير واتصالات';
      description = 'سداد فاتورة عمل';
    } else if (/قرطاسي[ةه]|مكتب|أوراق|اقلام|أقلام/.test(lowerText)) {
      category = 'مستلزمات مكتبية';
      description = 'شراء مستلزمات مكتبية';
    } else if (/تاكسي|اوبر|أوبر|كريم|مشوار|مواقف/.test(lowerText)) {
      category = 'مواصلات وتنقل';
      description = 'تكاليف تنقل ومواصلات';
    } else {
      category = 'مصروفات تشغيلية';
      description = rawText;
    }
  }

  // Date detection: check for "أمس" or "اليوم"
  let date = today;
  if (/أمس|امس/.test(lowerText)) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    date = yesterday.toISOString().split('T')[0];
  } else if (/قبل يومين/.test(lowerText)) {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    date = twoDaysAgo.toISOString().split('T')[0];
  }

  // Check if clarification is needed
  const clarificationNeeded = amount === null || amount <= 0;
  let clarificationQuestion: string | undefined;

  if (clarificationNeeded) {
    if (!typeDetected) {
      clarificationQuestion = 'لم أتمكن من معرفة نوع العملية أو المبلغ. يرجى توضيح العملية، مثلاً: "عمولة 500" أو "سحبت 300" أو "صرف 70 بنزين".';
    } else {
      const typeLabel =
        type === 'commission'
          ? 'العمولة'
          : type === 'withdrawal'
          ? 'السحبة'
          : type === 'salary'
          ? 'الراتب'
          : 'المصروف';
      clarificationQuestion = `لم يتم تحديد مبلغ ${typeLabel} بدقة. كم هو المبلغ بالريال؟`;
    }
  }

  return {
    type,
    amount,
    category,
    description,
    date,
    clarificationNeeded,
    clarificationQuestion,
    sourceText: rawText,
  };
}

// Hybrid Parser: Try server Gemini endpoint first; fall back to local parser
export async function parseTransactionWithAI(rawText: string): Promise<NLPParseResult> {
  const localResult = parseArabicLocally(rawText);

  // If local parsing is already high confidence with clear amount, we can return it instantly,
  // or check server endpoint if text is complex or ambiguous.
  try {
    const response = await fetch('/api/parse-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText }),
    });

    if (response.ok) {
      const serverData = await response.json();
      if (serverData && serverData.type) {
        let mappedType: TransactionType = 'expense';
        if (serverData.type === 'commission' || serverData.type === 'عمولة') mappedType = 'commission';
        else if (serverData.type === 'withdrawal' || serverData.type === 'سحبة' || serverData.type === 'سحب') mappedType = 'withdrawal';
        else if (serverData.type === 'salary' || serverData.type === 'راتب') mappedType = 'salary';

        return {
          type: mappedType,
          amount: typeof serverData.amount === 'number' ? serverData.amount : localResult.amount,
          category: serverData.category || localResult.category,
          description: serverData.description || localResult.description,
          date: serverData.date || localResult.date,
          clarificationNeeded: !!serverData.clarificationNeeded && !serverData.amount && !localResult.amount,
          clarificationQuestion: serverData.clarificationQuestion || localResult.clarificationQuestion,
          sourceText: rawText,
        };
      }
    }
  } catch {
    // Network or server offline: seamlessly use robust local parser
  }

  return localResult;
}

export function formatCurrency(amount: number, currency: string = 'ريال'): string {
  const formatted = new Intl.NumberFormat('ar-SA', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${currency}`;
}

export function formatStandardNumber(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}
