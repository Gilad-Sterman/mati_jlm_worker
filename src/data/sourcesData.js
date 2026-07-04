/**
 * Predefined sources list for client report "Sources" section.
 * Each category has:
 *   - id: unique identifier
 *   - title: Hebrew display title for the category
 *   - baseline: if true, always included in output (1 link) regardless of matching
 *   - keywords: Hebrew/English/Arabic terms that trigger this category
 *   - links: curated list – only the first matching link is shown per category
 *
 * Matching runs against the generated report's general_summary + key_insights content,
 * NOT the raw transcript. This ensures signal-dense, clean text for keyword scoring.
 *
 * Output structure per report: 2-3 { category, links: [{ title, url }] } objects.
 */

export const SOURCES_CATEGORIES = [
  // ── BASELINE ─────────────────────────────────────────────────────────────────
  // Always included (1 link). Covers official Israeli SME data – relevant to every report.
  {
    id: 'official_materials',
    title: 'חומרים רשמיים – מדינת ישראל',
    baseline: true,
    keywords: { he: [], en: [], ar: [] },
    links: [
      {
        title: 'דו״ח שנתי: מצב העסקים הקטנים והבינוניים בישראל (2023)',
        url: 'https://www.sba.org.il/hb/PolicyAndInformation/Researches/Pages/SR77.aspx'
      },
      {
        title: 'ביז דאטא – נתוני עסקים קטנים',
        url: 'https://bizdata.org.il/dashboard'
      },
      {
        title: 'סיכום פעילות שנתי – הסוכנות לעסקים קטנים (Gov.il)',
        url: 'https://www.gov.il/he/departments/publications/publicationsmallbusinessactivitysummary2023'
      },
      {
        title: 'דמוגרפיית עסקים – שרידות ותנועות עסקים 2021–2023 (PDF)',
        url: 'https://www.cbs.gov.il/he/mediarelease/DocLib/2024/236/29_24_236b.pdf'
      },
      {
        title: 'סקירות על עסקים קטנים והיבטים גיאוגרפיים – ממ״מ הכנסת (PDF)',
        url: 'https://fs.knesset.gov.il/globaldocs/MMM/7fcdf267-f4a9-ec11-8149-00155d082403/2_7fcdf267-f4a9-ec11-8149-00155d082403_11_20002.pdf'
      }
    ]
  },

  // ── TOPICAL CATEGORIES ────────────────────────────────────────────────────────
  // Scored by keyword frequency. Top 1-2 categories (score > 0) contribute 1 link each.

  {
    id: 'regulation',
    title: 'חקיקה ורגולציה בישראל',
    baseline: false,
    keywords: {
      he: ['חוק', 'רגולציה', 'רישוי', 'חקיקה', 'תקנות', 'פיקוח', 'ציות', 'אישור', 'היתר', 'קנס',
           'חוזה', 'משפטי', 'עורך דין', 'רגולטורי', 'אסדרה', 'עמידה בדרישות', 'עבירה', 'חוקי',
           'פריצת חוק', 'חוק מוסר תשלומים', 'תשלומים לספקים', 'נושא משפטי'],
      en: ['law', 'regulation', 'licensing', 'compliance', 'legal', 'permit', 'contract',
           'legislation', 'regulatory', 'fine', 'penalty', 'attorney', 'clause', 'obligation'],
      ar: ['قانون', 'تنظيم', 'ترخيص', 'امتثال', 'قانوني', 'عقد', 'إذن', 'غرامة', 'تشريع']
    },
    links: [
      {
        title: 'רישוי עסקים – פורטל רשמי (Gov.il)',
        url: 'https://www.gov.il/he/Departments/Topics/business_licensing'
      },
      {
        title: 'כל זכות – עסקים קטנים',
        url: 'https://www.kolzchut.org.il/he/%D7%A2%D7%A1%D7%A7%D7%99%D7%9D_%D7%A7%D7%98%D7%A0%D7%99%D7%9D'
      },
      {
        title: 'חוק מוסר תשלומים לספקים 2017 – עמוד חוק רשמי בכנסת',
        url: 'https://main.knesset.gov.il/Activity/Legislation/Laws/Pages/LawPrimary.aspx?lawitemid=2063315'
      },
      {
        title: 'נוסח חוק מוסר תשלומים לספקים (PDF)',
        url: 'https://fs.knesset.gov.il/20/plaw/20_plaw_475161.pdf'
      }
    ]
  },

  {
    id: 'support_programs',
    title: 'תוכניות סיוע, ייעוץ וליווי יזמים – ישראל',
    baseline: false,
    keywords: {
      he: ['מענק', 'סיוע', 'תמיכה', 'מעוף', 'תוכנית', 'ייעוץ מסובסד', 'השתתפות עצמית',
           'תנופה', 'חדשנות', 'קרן', 'סובסידיה', 'הטבה', 'תמריץ', 'ייעוץ', 'שאגת הארי',
           'הסוכנות', 'ביז דאטא', 'רשות החדשנות', 'מחמ"ד', 'כלכלה', 'משרד הכלכלה',
           'הטבות מס', 'החזר', 'בקשה לסיוע', 'זכאות', 'קבלת סיוע'],
      en: ['grant', 'subsidy', 'support', 'program', 'consulting', 'assistance', 'incentive',
           'fund', 'benefit', 'eligible', 'application', 'sponsored', 'innovation authority'],
      ar: ['منحة', 'دعم', 'برنامج', 'استشارة', 'تمويل', 'مساعدة', 'حافز', 'أهلية', 'طلب']
    },
    links: [
      {
        title: 'מעוף – מידע לעסקים, מחקרים וסריקות',
        url: 'https://www.sba.org.il/hb/MaofServices/Pages/default.aspx'
      },
      {
        title: 'פורטל עסקים – המרכז הממשלתי לעסקים',
        url: 'https://p.biz.gov.il/join'
      },
      {
        title: 'Maof – מדריך שירותים ליזמים ועסקים (ייעוץ מסובסד)',
        url: 'https://www.sba.org.il/hb/PromotionPrograms/Pages/maof.aspx'
      },
      {
        title: 'שאגת הארי – תמיכה בעסקים',
        url: 'https://www.haravot-barzel.org.il/sheagat_ari/'
      },
      {
        title: 'רשות החדשנות – מסלול "תנופה" ליזמים בתחילת הדרך',
        url: 'https://innovationisrael.org.il/programs/tnoofa'
      }
    ]
  },

  {
    id: 'sector_data',
    title: 'נתונים לפי תחום עסק בישראל',
    baseline: false,
    keywords: {
      he: ['ענף', 'תחום', 'שוק', 'סקטור', 'ענפי', 'תחומי', 'מגזר', 'מגמה', 'תעשייה',
           'ייצור', 'קמעונאות', 'מסחר', 'שירותים', 'הייטק', 'בנייה', 'נדל"ן', 'מזון',
           'אוכל', 'בריאות', 'חינוך', 'תחרות', 'מתחרים', 'פלח שוק', 'נתח שוק',
           'אפיון שוק', 'שוק יעד', 'קהל יעד', 'ענף מסחרי'],
      en: ['sector', 'industry', 'market', 'field', 'domain', 'trend', 'retail',
           'manufacturing', 'services', 'competition', 'competitors', 'niche', 'target market'],
      ar: ['قطاع', 'صناعة', 'سوق', 'مجال', 'اتجاه', 'منافسة', 'تجارة']
    },
    links: [
      {
        title: 'דוח סקר חסמים לפי ענף – הסוכנות לעסקים קטנים',
        url: 'https://www.sba.org.il/hb/PolicyAndInformation/Researches/Pages/SR71.aspx'
      },
      {
        title: 'דמוגרפיית עסקים של עצמאים 2022 – למ"ס (PDF)',
        url: 'https://www.cbs.gov.il/he/mediarelease/DocLib/2024/036/29_24_036b.pdf'
      }
    ]
  },

  {
    id: 'geographic_data',
    title: 'נתונים לפי ישוב ורשות מקומית בישראל',
    baseline: false,
    keywords: {
      he: ['ישוב', 'עיר', 'אזור', 'מקום', 'מקומי', 'רשות מקומית', 'עירייה', 'מועצה',
           'גיאוגרפי', 'נפה', 'מחוז', 'פריפריה', 'ירושלים', 'תל אביב', 'חיפה',
           'באר שבע', 'אשדוד', 'נגב', 'גליל', 'מרכז', 'צפון', 'דרום', 'ערבה', 'שרון',
           'שפלה', 'אזור תעשייה', 'עסק מקומי', 'קהילה', 'שכונה'],
      en: ['city', 'region', 'local', 'municipality', 'area', 'geographic', 'location',
           'peripheral', 'district', 'neighborhood', 'community'],
      ar: ['مدينة', 'منطقة', 'محلي', 'بلدية', 'موقع', 'إقليم', 'حي', 'مجتمع']
    },
    links: [
      {
        title: 'מבט גיאוגרפי על עסקים בישראל – ממ״מ הכנסת (PDF)',
        url: 'https://fs.knesset.gov.il/globaldocs/MMM/7fcdf267-f4a9-ec11-8149-00155d082403/2_7fcdf267-f4a9-ec11-8149-00155d082403_11_20002.pdf'
      }
    ]
  },

  {
    id: 'mentoring',
    title: 'מנטורינג עסקי',
    baseline: false,
    keywords: {
      he: ['מנטורינג', 'מנטור', 'ליווי אישי', 'חניכה', 'אימון', 'מאמן', 'פיתוח אישי',
           'הכוונה', 'מנהיגות', 'coaching', 'פיתוח מנהלים', 'מיומנויות ניהול', 'התפתחות',
           'ליווי עסקי', 'ייעוץ אישי', 'תהליך אישי', 'חיזוק יכולות', 'מנטור עסקי'],
      en: ['mentor', 'mentoring', 'coaching', 'guidance', 'training', 'leadership',
           'personal development', 'skill', 'accompany', 'business coach'],
      ar: ['توجيه', 'إرشاد', 'تدريب', 'مرشد', 'تطوير', 'قيادة', 'تطوير الأعمال']
    },
    links: [
      {
        title: 'ג׳וינט-תבת – מדריך מנטורינג וחניכה (PDF)',
        url: 'https://www.thejoint.org.il/wp-content/uploads/2020/09/MentoringManual.pdf'
      },
      {
        title: 'סקירה מקצועית – מנטורינג ואימון עסקי',
        url: 'https://nihul4u.com/management-and-leadership/mentoring-and-business-coaching-insights-and-research/'
      },
      {
        title: 'שיתופים – מדריך לתכנון תהליכי מנטורינג (PDF)',
        url: 'https://wiki.sheatufim.org.il/wp-content/uploads/2024/06/%D7%9E%D7%A0%D7%98%D7%95%D7%A8%D7%99%D7%A0%D7%92.pdf'
      },
      {
        title: 'אוניברסיטת חיפה – מחקר על מנטורינג במאיצנים (PDF)',
        url: 'https://cohrm.haifa.ac.il/wp-content/uploads/2021/08/Rechter-Avnimelech.pdf'
      },
      {
        title: 'מה זה מנטורינג עסקי?',
        url: 'https://www.reuta.co.il/business-consulting/%D7%9E%D7%A0%D7%98%D7%95%D7%A8%D7%99%D7%A0%D7%92-%D7%A2%D7%A1%D7%A7%D7%99/'
      }
    ]
  },

  {
    id: 'academic_research',
    title: 'מחקרים אקדמיים – ייעוץ עסקי ויזמות',
    baseline: false,
    keywords: {
      he: ['מחקר', 'אקדמי', 'אוניברסיטה', 'מדעי', 'נתונים', 'ניתוח', 'ממצאים',
           'כתב עת', 'השפעה', 'יעילות', 'מדידה', 'הוכחה', 'ראיות', 'אמפירי',
           'מחקר אקדמי', 'עדות', 'מאמר', 'ספרות מקצועית', 'בסיס ראיות'],
      en: ['research', 'academic', 'university', 'study', 'analysis', 'evidence',
           'impact', 'empirical', 'findings', 'journal', 'paper', 'literature', 'data driven'],
      ar: ['بحث', 'أكاديمي', 'جامعة', 'دراسة', 'تحليل', 'أدلة', 'تأثير', 'نتائج']
    },
    links: [
      {
        title: 'Meta-analysis: Business Training Impacts – McKenzie (World Bank)',
        url: 'https://documents.worldbank.org/en/publication/documents-reports/documentdetail/410171468153872036'
      },
      {
        title: 'Impact of Consulting Services on SMEs – Bruhn, Karlan, Schoar (JPE)',
        url: 'https://pubs.aeaweb.org/doi/pdfplus/10.1257/pol.20150024'
      },
      {
        title: 'Does Management Matter? – Bloom et al., QJE',
        url: 'https://economics.mit.edu/sites/default/files/WorkingPaper_5.pdf'
      },
      {
        title: 'Teaching Entrepreneurship – Karlan & Valdivia (REStat)',
        url: 'https://www.nber.org/papers/w16829'
      }
    ]
  },

  {
    id: 'oecd_international',
    title: 'מדיניות SME בינלאומית – OECD ויזמות',
    baseline: false,
    keywords: {
      he: ['בינלאומי', 'OECD', 'עולמי', 'השוואתי', 'מדיניות', 'גלובלי', 'ייצוא',
           'יבוא', 'מדינות', 'השוואה', 'מגמה עולמית', 'כלכלה עולמית', 'סחר חוץ'],
      en: ['international', 'OECD', 'global', 'policy', 'comparative', 'export',
           'import', 'worldwide', 'global trend', 'foreign trade'],
      ar: ['دولي', 'عالمي', 'سياسة', 'مقارنة', 'صادرات', 'واردات', 'تجارة خارجية']
    },
    links: [
      {
        title: 'SME and Entrepreneurship Outlook – OECD',
        url: 'https://www.oecd.org/industry/smes/'
      },
      {
        title: 'Financing SMEs & Entrepreneurs – OECD Scoreboard',
        url: 'https://www.oecd.org/finance/financing-smes-and-entrepreneurs-23094853.htm'
      },
      {
        title: 'GEM – Global Entrepreneurship Monitor (דו״ח עולמי)',
        url: 'https://www.gemconsortium.org/report'
      }
    ]
  },

  {
    id: 'finance',
    title: 'מימון והון לעסקים קטנים',
    baseline: false,
    keywords: {
      he: ['מימון', 'אשראי', 'הלוואה', 'הון', 'השקעה', 'משקיע', 'גיוס הון', 'קרן',
           'בנק', 'ריבית', 'ערבות', 'תזרים', 'תזרים מזומנים', 'הכנסות', 'רווחיות',
           'הפסד', 'חוב', 'מינוף', 'גיוס', 'אנג\'ל', 'הון סיכון', 'השקעת זרע',
           'הלוואה בנקאית', 'מסגרת אשראי', 'גרעון', 'עלויות', 'הוצאות'],
      en: ['finance', 'funding', 'loan', 'capital', 'investment', 'investor', 'credit',
           'bank', 'interest', 'revenue', 'profit', 'debt', 'cash flow', 'raise', 'angel',
           'venture capital', 'seed', 'overdraft', 'budget'],
      ar: ['تمويل', 'قرض', 'رأس مال', 'استثمار', 'ائتمان', 'بنك', 'ربح', 'دين',
           'تدفق نقدي', 'ميزانية', 'مستثمر']
    },
    links: [
      {
        title: 'World Bank – SME Finance',
        url: 'https://www.worldbank.org/en/topic/smefinance'
      },
      {
        title: 'IFC – MSME Finance Gap',
        url: 'https://www.ifc.org/wps/wcm/connect/Industry_EXT_Content/IFC_External_Corporate_Site/Financial+Institutions/Priorities/MSME+Finance/MSME+Finance+Gap'
      },
      {
        title: 'G20 – Plan for MSME Financing',
        url: 'https://www.gpfi.org/publications'
      }
    ]
  },

  {
    id: 'employment',
    title: 'תעסוקה ועובדים בעסקים קטנים',
    baseline: false,
    keywords: {
      he: ['עובד', 'עובדים', 'תעסוקה', 'שכר', 'גיוס עובדים', 'משאבי אנוש', 'העסקה',
           'פיטורים', 'שוק עבודה', 'משכורת', 'שעות עבודה', 'הסכם עבודה', 'עובד שכיר',
           'עצמאי', 'גיוס כוח אדם', 'תגמול', 'הכשרת עובדים', 'צוות', 'כוח אדם',
           'אנשי צוות', 'שמירה על עובדים', 'שחיקה', 'תנאי העסקה'],
      en: ['employee', 'employment', 'salary', 'hiring', 'labor', 'workforce', 'wage',
           'recruitment', 'dismissal', 'training', 'HR', 'human resources', 'staff', 'team'],
      ar: ['موظف', 'عمالة', 'راتب', 'توظيف', 'عمل', 'قوى عاملة', 'تدريب', 'فريق']
    },
    links: [
      {
        title: 'ILO – Employment & SME Policy Evidence',
        url: 'https://www.ilo.org/global/topics/small-enterprises/lang--en/index.htm'
      }
    ]
  }
];
