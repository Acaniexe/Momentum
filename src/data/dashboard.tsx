import type { Task, Email, NewsItem, PomMode } from "../types";

export const QUOTES = [
  { text: "Discipline is remembering what you said you wanted.", author: "Unknown" },
  { text: "Small steps taken daily build lives that once felt impossible.", author: "Unknown" },
  { text: "A calm mind is sharper than a rushed one.", author: "Unknown" },
  { text: "Consistency outperforms intensity when intensity cannot last.", author: "Unknown" },
  { text: "The work you avoid usually contains the growth you need.", author: "Unknown" },
  { text: "You do not rise to goals. You fall to systems.", author: "James Clear" },
  { text: "Focus is built by returning attention, not by never losing it.", author: "Unknown" },
  { text: "Do not pray for an easy life. Pray for the strength to endure a difficult one.", author: "Bruce Lee" },
  { text: "A year from now you will wish you started today.", author: "Karen Lamb" },
  { text: "Action creates clarity.", author: "Unknown" },
  { text: "Momentum is built in the moments you wanted to quit but continued anyway.", author: "Unknown" },
  { text: "The future is shaped by what you repeatedly do in private.", author: "Unknown" },
  { text: "Peace comes when your habits align with your values.", author: "Unknown" },
  { text: "Do not let comfort turn into captivity.", author: "Unknown" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Hard days are part of strong foundations.", author: "Unknown" },
  { text: "You become what you repeatedly tolerate.", author: "Unknown" },
  { text: "Silence distractions and the path becomes obvious.", author: "Unknown" },
  { text: "Discipline is self-respect in visible form.", author: "Unknown" },
  { text: "The man who moves mountains begins by carrying small stones.", author: "Confucius" },

  { text: "Be strong and courageous. Do not be afraid; do not be discouraged.", author: "Joshua 1:9" },
  { text: "I can do all things through Christ who strengthens me.", author: "Philippians 4:13" },
  { text: "Commit your work to the Lord, and your plans will be established.", author: "Proverbs 16:3" },
  { text: "Be still, and know that I am God.", author: "Psalm 46:10" },
  { text: "Let all that you do be done in love.", author: "1 Corinthians 16:14" },
  { text: "Faith can move mountains.", author: "Matthew 17:20" },
  { text: "The Lord will fight for you; you need only to be still.", author: "Exodus 14:14" },
  { text: "Trust in the Lord with all your heart.", author: "Proverbs 3:5" },
  { text: "His mercies are new every morning.", author: "Lamentations 3:23" },
  { text: "Walk by faith, not by sight.", author: "2 Corinthians 5:7" },
  { text: "Those who hope in the Lord will renew their strength.", author: "Isaiah 40:31" },
  { text: "God is within her, she will not fall.", author: "Psalm 46:5" },
  { text: "Seek first the kingdom of God.", author: "Matthew 6:33" },
  { text: "The light shines in the darkness, and the darkness has not overcome it.", author: "John 1:5" },
  { text: "Cast all your anxiety on Him because He cares for you.", author: "1 Peter 5:7" },
  { text: "With God all things are possible.", author: "Matthew 19:26" },
  { text: "The joy of the Lord is your strength.", author: "Nehemiah 8:10" },
  { text: "Do everything without grumbling or arguing.", author: "Philippians 2:14" },
  { text: "The steadfast love of the Lord never ceases.", author: "Lamentations 3:22" },
  { text: "Blessed are the peacemakers.", author: "Matthew 5:9" },

  { text: "What you do today shapes who you become tomorrow.", author: "Unknown" },
  { text: "Your habits are votes for the person you wish to become.", author: "Unknown" },
  { text: "Do the hard thing before the easy distractions arrive.", author: "Unknown" },
  { text: "You are closer than you think. Keep moving.", author: "Unknown" },
  { text: "A focused hour is more powerful than a distracted day.", author: "Unknown" },
  { text: "Patience is also progress.", author: "Unknown" },
  { text: "Most victories are quiet and repeated daily.", author: "Unknown" },
  { text: "Rest is preparation, not weakness.", author: "Unknown" },
  { text: "Do not waste energy proving yourself. Build yourself.", author: "Unknown" },
  { text: "Clarity grows through movement.", author: "Unknown" },
  { text: "Protect your attention like your future depends on it.", author: "Unknown" },
  { text: "The version of you you admire is built through repetition.", author: "Unknown" },
  { text: "Pressure reveals what your routines are made of.", author: "Unknown" },
  { text: "Do not fear slow progress. Fear standing still.", author: "Unknown" },
  { text: "You were not made to live permanently distracted.", author: "Unknown" },
  { text: "Every disciplined day compounds.", author: "Unknown" },
  { text: "A meaningful life is built deliberately.", author: "Unknown" },
  { text: "Protect the mornings and the rest follows easier.", author: "Unknown" },
  { text: "The strongest people are usually the most consistent.", author: "Unknown" },
  { text: "Keep building even when nobody sees the foundation.", author: "Unknown" },
];

export const SEED_TASKS: Task[] = [];

export const SEED_EMAILS: Email[] = [];

export const EVENTS: { time: string; end: string; title: string; color: string }[] = [];

export const FALLBACK_NEWS: NewsItem[] = [];

export const NEWS_CATEGORIES = ["all", "tech", "finance", "science", "world", "business"] as const;
export const CAT_COLORS: Record<string, string> = {
  tech: "#93C5FD",
  finance: "#FCD34D",
  science: "#6EE7B7",
  world: "#FCA5A5",
  business: "#C4B5FD",
};

export const TAG_COLORS: Record<string, string> = { work: "#93C5FD", dev: "#6EE7B7", finance: "#FCD34D" };
export const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const POM_DURATIONS: Record<PomMode, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
export const POM_LABELS: Record<PomMode, string> = { focus: "Focus", short: "Short Break", long: "Long Break" };
export const POM_COLORS: Record<PomMode, string> = { focus: "#FCA5A5", short: "#6EE7B7", long: "#93C5FD" };

// expose app version from package.json for UI usage
// import package.json (requires resolveJsonModule in tsconfig)
import pkg from "../../package.json";
export const VERSION = (pkg && (pkg as any).version) ? (pkg as any).version : "0.1.0";
export const MADE_BY = "AcaniEXE";
