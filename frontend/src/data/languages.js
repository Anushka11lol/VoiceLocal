export const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्" },
  { code: "ks", name: "Kashmiri", native: "کٲشُر" },
  { code: "sd", name: "Sindhi", native: "سنڌي" },
  { code: "ne", name: "Nepali", native: "नेपाली" },
  { code: "kok", name: "Konkani", native: "कोंकणी" },
  { code: "mai", name: "Maithili", native: "मैथिली" },
  { code: "doi", name: "Dogri", native: "डोगरी" },
  { code: "brx", name: "Bodo", native: "बड़ो" },
  { code: "mni", name: "Manipuri", native: "মৈতৈলোন্" },
  { code: "sat", name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ" },
];

export const langName = (code) => LANGUAGES.find((l) => l.code === code)?.name || code;
export const langNative = (code) => LANGUAGES.find((l) => l.code === code)?.native || code;

// Demo transcript (Hindi source) with timestamps — ISRO Explained
export const DEMO_TRANSCRIPT = [
  { t: "00:00", text: "आज हम भारत के अंतरिक्ष अनुसंधान के बारे में बात करेंगे।" },
  { t: "00:06", text: "इसरो ने चंद्रयान और मंगलयान जैसे कई सफल अभियान पूरे किए हैं।" },
  { t: "00:13", text: "इन मिशनों ने दुनिया को भारत की क्षमता दिखाई है।" },
  { t: "00:20", text: "कम लागत में अंतरिक्ष तक पहुँचना हमारी सबसे बड़ी उपलब्धि है।" },
  { t: "00:28", text: "आने वाले वर्षों में हम मानव अंतरिक्ष उड़ान की तैयारी कर रहे हैं।" },
];

export const DEMO_PROJECTS = [
  { title: "ISRO Explained", source: "hi", target: "bn", duration: "00:42", status: "Completed" },
  { title: "Climate Change Basics", source: "en", target: "as", duration: "01:20", status: "Completed" },
  { title: "AI for Students", source: "en", target: "hi", duration: "00:58", status: "Completed" },
  { title: "Indian Space Missions", source: "hi", target: "ta", duration: "01:05", status: "Completed" },
];

export const VOICE_TYPES = ["female", "male", "neutral"];
export const VOICE_STYLES = ["natural", "professional", "energetic", "calm"];
