/**
 * Content for MSD — THE LEGEND.
 * Every fact is tagged:
 *   "verified" – widely documented, cross-checkable (ESPNcricinfo / ICC / BCCI / IPL records)
 *   "approx"   – figure is rounded/approximate or may have changed since; check an official source
 *   "fan"      – fan interpretation / opinion, NOT a fact
 * Unofficial fan tribute. Not endorsed by MS Dhoni, BCCI, ICC or CSK.
 */
export type Verify = "verified" | "approx" | "fan";

export const VERIFY_LABEL: Record<Verify, string> = { verified: "Verified", approx: "Approx.", fan: "Fan view" };

/* ───────────── Sections ───────────── */
export interface SectionDef {
  id: string;
  no: string;
  label: string;
  short: string;
  blurb: string;
  keywords: string;
  icon: string;
}
export const SECTIONS: SectionDef[] = [
  { id: "home", no: "01", label: "Home", short: "Home", blurb: "Cinematic 3D hero", keywords: "hero stadium landing start", icon: "Home" },
  { id: "career", no: "02", label: "Career Journey", short: "Career", blurb: "Debut to retirement timeline", keywords: "timeline debut retirement journey history", icon: "Route" },
  { id: "stats", no: "03", label: "Stats & Records", short: "Stats", blurb: "Batting, keeping & captaincy", keywords: "runs average dismissals records batting bowling wicketkeeping captaincy", icon: "BarChart3" },
  { id: "trophy-room", no: "04", label: "Trophy Room", short: "Trophies", blurb: "Interactive 3D museum", keywords: "trophy cup world cup museum 3d champions", icon: "Trophy" },
  { id: "csk", no: "05", label: "CSK Universe", short: "CSK", blurb: "IPL journey & yellow theme", keywords: "chennai super kings ipl yellow thala whistle", icon: "Flame" },
  { id: "odi", no: "06", label: "ODI Legacy", short: "ODI", blurb: "World Cup history · blue", keywords: "one day international world cup 2011 blue", icon: "Medal" },
  { id: "t20", no: "07", label: "T20 Legacy", short: "T20", blurb: "T20 career · teal", keywords: "t20 world cup 2007 teal twenty20", icon: "Zap" },
  { id: "themes", no: "08", label: "Theme Universe", short: "Themes", blurb: "Three complete themes", keywords: "theme colour color preview skin appearance", icon: "Palette" },
  { id: "moments", no: "09", label: "Legendary Moments", short: "Moments", blurb: "Iconic matches & moments", keywords: "moments iconic matches six helicopter", icon: "Sparkles" },
  { id: "media", no: "10", label: "Media Vault", short: "Media", blurb: "Gallery, wallpapers, favourites", keywords: "photos gallery wallpapers favourites collections upload download", icon: "Images" },
  { id: "quiz", no: "11", label: "Quiz Arena", short: "Quiz", blurb: "Quiz, mini-games, leaderboard", keywords: "quiz game play score leaderboard badges mini games", icon: "Gamepad2" },
  { id: "about", no: "12", label: "About MSD", short: "About", blurb: "Biography & career story", keywords: "biography about ranchi story life", icon: "BookOpen" },
  { id: "developer", no: "13", label: "Developer Studio", short: "Dev", blurb: "Sohom Giri · portfolio", keywords: "developer sohom giri portfolio github instagram credits", icon: "Code2" },
  { id: "settings", no: "14", label: "Settings & DataVault", short: "Settings", blurb: "Preferences, sound, backups", keywords: "settings sound data backup export import storage pwa offline install performance", icon: "Settings" },
];

/* ───────────── Career timeline ───────────── */
export interface CareerEvent {
  id: string;
  year: string;
  date: string;
  era: "Rise" | "Captain" | "Summit" | "Twilight" | "Farewell";
  title: string;
  text: string;
  tag: Verify;
}
export const CAREER: CareerEvent[] = [
  { id: "born", year: "1981", date: "7 Jul 1981", era: "Rise", title: "Born in Ranchi", text: "Mahendra Singh Dhoni is born in Ranchi (then Bihar, now Jharkhand). He plays football as a goalkeeper at school before a cricket coach spots his hands and moves him behind the stumps.", tag: "verified" },
  { id: "tte", year: "2001–03", date: "c. 2001–2003", era: "Rise", title: "The railway ticket collector", text: "While chasing cricket, Dhoni works as a ticket collector at Kharagpur railway station. The job is one of the best-known parts of his story of persistence.", tag: "approx" },
  { id: "india-a", year: "2004", date: "2004", era: "Rise", title: "India A breakthrough", text: "Strong performances on India A tours (Zimbabwe & Kenya) put the power-hitting wicketkeeper on the national selectors' radar.", tag: "approx" },
  { id: "odi-debut", year: "2004", date: "23 Dec 2004", era: "Rise", title: "ODI debut · Chittagong", text: "Debuts against Bangladesh in Chittagong and is run out for 0 — the quietest possible start to a record-shattering career.", tag: "verified" },
  { id: "148", year: "2005", date: "5 Apr 2005", era: "Rise", title: "148 at Visakhapatnam", text: "Promoted up the order against Pakistan, Dhoni smashes 148 — his first ODI century — and announces a new kind of Indian wicketkeeper.", tag: "verified" },
  { id: "183", year: "2005", date: "31 Oct 2005", era: "Rise", title: "183* at Jaipur", text: "An unbeaten 183 against Sri Lanka in a chase — then the highest ODI score by a wicketkeeper — and still his career-best in ODIs.", tag: "verified" },
  { id: "test-debut", year: "2005", date: "2 Dec 2005", era: "Rise", title: "Test debut · Chennai", text: "Makes his Test debut against Sri Lanka at Chennai.", tag: "verified" },
  { id: "t20-debut", year: "2006", date: "1 Dec 2006", era: "Rise", title: "T20I debut · Johannesburg", text: "Plays India's first-ever T20 International against South Africa in Johannesburg.", tag: "verified" },
  { id: "t20wc-07", year: "2007", date: "24 Sep 2007", era: "Captain", title: "Captain of the T20 World Champions", text: "Leading a young side in the inaugural ICC World Twenty20, Dhoni's India beat Pakistan by 5 runs in the Johannesburg final. Shortly after, he is named ODI captain too (Sept 2007).", tag: "verified" },
  { id: "ipl-08", year: "2008", date: "Feb–Apr 2008", era: "Captain", title: "Chennai Super Kings is born", text: "Chennai Super Kings buy Dhoni at the inaugural IPL auction for US$1.5 million — the highest price of that auction — and make him captain. A love story begins.", tag: "verified" },
  { id: "test-cap", year: "2008", date: "Nov 2008", era: "Captain", title: "Test captaincy", text: "Takes over the Test captaincy as Anil Kumble retires. Dhoni would go on to captain India in 60 Tests.", tag: "verified" },
  { id: "no1", year: "2009", date: "Dec 2009", era: "Summit", title: "India reach No.1 in Tests", text: "Under Dhoni, India climb to the top of the ICC Test rankings for the first time.", tag: "verified" },
  { id: "wc-11", year: "2011", date: "2 Apr 2011", era: "Summit", title: "World Champions · Wankhede", text: "India chase 275 against Sri Lanka at the Wankhede Stadium. Dhoni promotes himself, scores an unbeaten 91 off 79 balls and finishes the World Cup final with a six.", tag: "verified" },
  { id: "bell", year: "2011", date: "Jul 2011", era: "Summit", title: "Spirit of Cricket", text: "At Trent Bridge, Dhoni withdraws the appeal after Ian Bell is run out on the tea break and Bell is recalled. The ICC later honours the gesture with its Spirit of Cricket award.", tag: "verified" },
  { id: "224", year: "2013", date: "Feb 2013", era: "Summit", title: "224 at Chennai", text: "A Test-best 224 against Australia — the highest Test score by an Indian wicketkeeper.", tag: "verified" },
  { id: "ct-13", year: "2013", date: "23 Jun 2013", era: "Summit", title: "Champions Trophy · Edgbaston", text: "India beat England by 5 runs in a rain-shortened final. Dhoni becomes the first captain to win the World T20, the World Cup and the Champions Trophy.", tag: "verified" },
  { id: "test-ret", year: "2014", date: "30 Dec 2014", era: "Twilight", title: "Steps away from Tests", text: "Announces his retirement from Test cricket in the middle of the series in Australia, after 90 Tests.", tag: "verified" },
  { id: "step-down", year: "2017", date: "4 Jan 2017", era: "Twilight", title: "Hands over the limited-overs captaincy", text: "Steps down as captain of India's ODI and T20I sides, after 332 matches as captain across formats.", tag: "verified" },
  { id: "last-match", year: "2019", date: "10 Jul 2019", era: "Twilight", title: "Old Trafford", text: "His last international innings comes in the World Cup semi-final against New Zealand, ending in a run-out as India fall 18 runs short.", tag: "verified" },
  { id: "retire", year: "2020", date: "15 Aug 2020", era: "Farewell", title: "“Consider me retired”", text: "Announces his retirement from international cricket with a simple, understated Instagram post — in character to the last.", tag: "verified" },
  { id: "ipl-23", year: "2023", date: "29 May 2023", era: "Farewell", title: "A fifth IPL star", text: "CSK win their fifth IPL title under Dhoni, defeating Gujarat Titans in a rain-delayed final decided on the last ball.", tag: "verified" },
];

/* ───────────── Stats ───────────── */
export interface FormatStats {
  id: "test" | "odi" | "t20i";
  name: string;
  m: number;
  inns: number;
  no: number;
  runs: number;
  hs: string;
  avg: number;
  sr: string;
  h: number;
  f: number;
  fours: string;
  sixes: string;
  ct: number;
  st: number;
  cap: { m: number; w: number; l: number; t: number; d: number; nr: number };
  bowl: string;
}
export const FORMATS: FormatStats[] = [
  { id: "test", name: "TEST", m: 90, inns: 144, no: 16, runs: 4876, hs: "224", avg: 38.09, sr: "≈59.1", h: 6, f: 33, fours: "≈544", sixes: "≈78", ct: 256, st: 38, cap: { m: 60, w: 27, l: 18, t: 0, d: 15, nr: 0 }, bowl: "No Test wickets" },
  { id: "odi", name: "ODI", m: 350, inns: 297, no: 84, runs: 10773, hs: "183*", avg: 50.57, sr: "≈87.6", h: 10, f: 73, fours: "≈826", sixes: "≈229", ct: 321, st: 123, cap: { m: 200, w: 110, l: 74, t: 5, d: 0, nr: 11 }, bowl: "≈1 ODI wicket" },
  { id: "t20i", name: "T20I", m: 98, inns: 85, no: 42, runs: 1617, hs: "56", avg: 37.6, sr: "≈126.1", h: 0, f: 2, fours: "≈116", sixes: "≈52", ct: 57, st: 34, cap: { m: 72, w: 41, l: 28, t: 1, d: 0, nr: 2 }, bowl: "No T20I wickets (≈)" },
];
export const TOTALS = {
  matches: 538,
  runs: 17266,
  dismissals: 829,
  captaincyMatches: 332,
  note: "Totals are the sum of the Test, ODI and T20I figures above (90+350+98 matches; 4,876+10,773+1,617 runs; 256+38 / 321+123 / 57+34 dismissals).",
};
export const IPL_STATS = [
  { k: "Titles with CSK", v: "5", sub: "2010 · 2011 · 2018 · 2021 · 2023", tag: "verified" as Verify },
  { k: "IPL finals with CSK", v: "10", sub: "Most by any franchise captain", tag: "approx" as Verify },
  { k: "IPL runs", v: "5,000+", sub: "Approx. — varies by season; check iplt20.com", tag: "approx" as Verify },
  { k: "Champions League T20", v: "2", sub: "CSK champions in 2010 and 2014", tag: "verified" as Verify },
];

/* ───────────── Trophies ───────────── */
export type TrophyKind = "globe" | "t20" | "bowl" | "ipl" | "mace";
export interface TrophyDef {
  id: string;
  name: string;
  year: string;
  kind: TrophyKind;
  role: string;
  story: string;
  tag: Verify;
}
export const TROPHIES: TrophyDef[] = [
  { id: "wt20-2007", name: "ICC World Twenty20", year: "2007", kind: "t20", role: "Captain · India", story: "Inaugural World T20 in South Africa. India beat Pakistan by 5 runs in the final at Johannesburg on 24 September 2007.", tag: "verified" },
  { id: "cwc-2011", name: "ICC Cricket World Cup", year: "2011", kind: "globe", role: "Captain · India", story: "India beat Sri Lanka by 6 wickets at the Wankhede Stadium on 2 April 2011 — India's second World Cup. Dhoni was Player of the Match with 91*.", tag: "verified" },
  { id: "ct-2013", name: "ICC Champions Trophy", year: "2013", kind: "bowl", role: "Captain · India", story: "Beat England by 5 runs at Edgbaston in a rain-reduced 20-over final on 23 June 2013, completing Dhoni's set of all three ICC white-ball trophies.", tag: "verified" },
  { id: "mace-2009", name: "No.1 Test ranking", year: "2009", kind: "mace", role: "Captain · India", story: "India reached the top of the ICC Test rankings for the first time in December 2009. The mace here is a symbolic model of that milestone.", tag: "verified" },
  { id: "ipl-2010", name: "IPL Champions", year: "2010", kind: "ipl", role: "Captain · CSK", story: "CSK's first IPL title, beating Mumbai Indians in the final.", tag: "verified" },
  { id: "ipl-2011", name: "IPL Champions", year: "2011", kind: "ipl", role: "Captain · CSK", story: "Back-to-back: CSK defend the title, beating Royal Challengers Bangalore in the final.", tag: "verified" },
  { id: "clt-2010", name: "Champions League T20", year: "2010", kind: "bowl", role: "Captain · CSK", story: "CSK win the Champions League Twenty20, the club tournament that ran until 2014.", tag: "verified" },
  { id: "clt-2014", name: "Champions League T20", year: "2014", kind: "bowl", role: "Captain · CSK", story: "A second Champions League T20 title for CSK under Dhoni.", tag: "verified" },
  { id: "ipl-2018", name: "IPL Champions", year: "2018", kind: "ipl", role: "Captain · CSK", story: "CSK return from a two-season suspension and win the title — the ‘Dad's Army’ story.", tag: "verified" },
  { id: "ipl-2021", name: "IPL Champions", year: "2021", kind: "ipl", role: "Captain · CSK", story: "A fourth IPL title, beating Kolkata Knight Riders in the final in Dubai.", tag: "verified" },
  { id: "ipl-2023", name: "IPL Champions", year: "2023", kind: "ipl", role: "Captain · CSK", story: "A fifth IPL title, level with Mumbai Indians, after a last-ball finish against Gujarat Titans.", tag: "verified" },
];

/* ───────────── Moments ───────────── */
export interface Moment {
  id: string;
  date: string;
  fmt: "ODI" | "T20" | "TEST" | "IPL" | "OFF";
  title: string;
  venue: string;
  blurb: string;
  detail: string;
  fan: string;
  tag: Verify;
}
export const MOMENTS: Moment[] = [
  { id: "m148", date: "5 Apr 2005", fmt: "ODI", title: "148 vs Pakistan", venue: "Visakhapatnam", blurb: "The first ODI hundred.", detail: "Sent in at No.3 against Pakistan, Dhoni plays with fearless power and reaches 148 — his first ODI century and the moment the cricket world noticed.", fan: "Fan view: this innings rewrote what an Indian wicketkeeper-batter could be.", tag: "verified" },
  { id: "m183", date: "31 Oct 2005", fmt: "ODI", title: "183* vs Sri Lanka", venue: "Jaipur", blurb: "A chase for the ages.", detail: "Chasing a big total, Dhoni finishes unbeaten on 183 — at the time the highest ODI score by a wicketkeeper and still his highest in the format.", fan: "Fan view: the blueprint for his later role as the ultimate finisher.", tag: "verified" },
  { id: "m07", date: "24 Sep 2007", fmt: "T20", title: "World T20 final", venue: "Johannesburg", blurb: "5 runs. A new era.", detail: "India beat Pakistan by 5 runs to win the first ICC World Twenty20. Dhoni's decision to give the final over to Joginder Sharma is one of cricket's most replayed calls.", fan: "Fan view: the night a calm captain made nerve look easy.", tag: "verified" },
  { id: "m10", date: "25 Apr 2010", fmt: "IPL", title: "CSK's first IPL title", venue: "Mumbai", blurb: "Yellow rises.", detail: "Chennai Super Kings beat Mumbai Indians in the IPL final to claim their first title — the beginning of a franchise dynasty.", fan: "Fan view: this is where ‘Thala’ became a movement.", tag: "verified" },
  { id: "m11", date: "2 Apr 2011", fmt: "ODI", title: "World Cup final · 91*", venue: "Wankhede, Mumbai", blurb: "The six. The night.", detail: "Chasing 275, India win by 6 wickets with 10 balls to spare. Dhoni walks in ahead of Yuvraj Singh, shares a match-turning partnership with Gautam Gambhir (97), and finishes with 91* off 79 balls and the winning six.", fan: "Fan view: the image of the bat held still after that six is the defining picture of Indian cricket.", tag: "verified" },
  { id: "mbell", date: "Jul 2011", fmt: "TEST", title: "Recalling Ian Bell", venue: "Trent Bridge", blurb: "Spirit of Cricket.", detail: "Ian Bell was given run out after wrongly assuming tea had been called. India's captain withdrew the appeal and Bell was allowed to resume. The ICC recognised the gesture with its Spirit of Cricket award.", fan: "Fan view: proof that his calm had a conscience.", tag: "verified" },
  { id: "m224", date: "Feb 2013", fmt: "TEST", title: "224 vs Australia", venue: "Chennai", blurb: "The big Test hundred.", detail: "Dhoni's Test-best 224 helped India to a series-opening win — the highest Test score by an Indian wicketkeeper.", fan: "Fan view: his most complete Test innings as captain.", tag: "verified" },
  { id: "m13", date: "23 Jun 2013", fmt: "ODI", title: "Champions Trophy final", venue: "Edgbaston", blurb: "Rain. Nerves. Glory.", detail: "In a 20-over-a-side final shortened by rain, India defend 129 and win by 5 runs against England, making Dhoni the first captain to lift all three ICC white-ball trophies.", fan: "Fan view: a perfect example of his trust in spinners and in the moment.", tag: "verified" },
  { id: "m16", date: "23 Mar 2016", fmt: "T20", title: "The last-ball run-out", venue: "Bengaluru", blurb: "One run. One dive.", detail: "India need a win against Bangladesh in the World T20 and survive by a single run — Dhoni sprints to the stumps to run out Mustafizur Rahman off the final ball.", fan: "Fan view: the iconic picture of a veteran refusing to let the game go.", tag: "verified" },
  { id: "m19", date: "10 Jul 2019", fmt: "ODI", title: "Old Trafford", venue: "Manchester", blurb: "The final innings.", detail: "In the World Cup semi-final against New Zealand, Dhoni's fight takes India to within reach before a direct-hit run-out ends the chase. It was his last international match.", fan: "Fan view: the emotion of the stadium said more than any scorecard could.", tag: "verified" },
  { id: "m20", date: "15 Aug 2020", fmt: "OFF", title: "“Consider me retired”", venue: "Instagram", blurb: "A quiet goodbye.", detail: "Dhoni announces his retirement from international cricket with a short video montage and a one-line post on Instagram.", fan: "Fan view: no press conference, just him — which is exactly how he did everything.", tag: "verified" },
  { id: "m23", date: "29 May 2023", fmt: "IPL", title: "Fifth IPL title", venue: "Ahmedabad", blurb: "Last ball, five stars.", detail: "CSK beat Gujarat Titans in a rain-delayed final to equal Mumbai Indians' tally of five IPL titles, with a boundary off the last ball.", fan: "Fan view: yellow, one more time.", tag: "verified" },
];

/* ───────────── CSK seasons ───────────── */
export interface Season {
  y: string;
  res: "Champions" | "Runners-up" | "Playoffs" | "League" | "Suspended";
  note: string;
}
export const CSK_SEASONS: Season[] = [
  { y: "2008", res: "Runners-up", note: "Lost the final to Rajasthan Royals" },
  { y: "2009", res: "Playoffs", note: "Semi-finalists" },
  { y: "2010", res: "Champions", note: "First title" },
  { y: "2011", res: "Champions", note: "Back-to-back titles" },
  { y: "2012", res: "Runners-up", note: "Lost the final to KKR" },
  { y: "2013", res: "Runners-up", note: "Lost the final to Mumbai Indians" },
  { y: "2014", res: "Playoffs", note: "Reached the playoffs" },
  { y: "2015", res: "Runners-up", note: "Lost the final to Mumbai Indians" },
  { y: "2016", res: "Suspended", note: "CSK suspended from the IPL" },
  { y: "2017", res: "Suspended", note: "CSK suspended from the IPL" },
  { y: "2018", res: "Champions", note: "Third title on return" },
  { y: "2019", res: "Runners-up", note: "Lost the final by 1 run to Mumbai Indians" },
  { y: "2020", res: "League", note: "Did not reach the playoffs" },
  { y: "2021", res: "Champions", note: "Fourth title" },
  { y: "2022", res: "League", note: "Did not reach the playoffs" },
  { y: "2023", res: "Champions", note: "Fifth title" },
  { y: "2024", res: "League", note: "Ruturaj Gaikwad named captain; missed playoffs" },
  { y: "2025", res: "League", note: "Finished near the bottom of the table (approx.)" },
];

export const WC_CAMPAIGNS = [
  { y: "2007", res: "Group stage exit", note: "A tough Caribbean campaign for India", win: false },
  { y: "2011", res: "CHAMPIONS", note: "Beat Sri Lanka by 6 wickets in the final at Wankhede, Mumbai", win: true },
  { y: "2015", res: "Semi-finalists", note: "Unbeaten until a semi-final loss to Australia at the SCG", win: false },
  { y: "2019", res: "Semi-finalists", note: "Lost to New Zealand by 18 runs at Old Trafford", win: false },
];
export const T20_CAMPAIGNS = [
  { y: "2007", res: "CHAMPIONS", note: "Beat Pakistan by 5 runs in Johannesburg", win: true },
  { y: "2009", res: "Super 8", note: "Did not progress from the Super 8 stage", win: false },
  { y: "2010", res: "Super 8", note: "Did not progress from the Super 8 stage", win: false },
  { y: "2012", res: "Super 8", note: "Did not progress from the Super 8 stage", win: false },
  { y: "2014", res: "Runners-up", note: "Lost the final to Sri Lanka in Mirpur", win: false },
  { y: "2016", res: "Semi-finalists", note: "Lost to West Indies in Mumbai", win: false },
];

/* ───────────── Honours ───────────── */
export const HONOURS: { y: string; t: string; tag: Verify }[] = [
  { y: "2007–08", t: "Rajiv Gandhi Khel Ratna", tag: "verified" },
  { y: "2008 & 2009", t: "ICC ODI Player of the Year", tag: "verified" },
  { y: "2009", t: "Padma Shri", tag: "verified" },
  { y: "2011", t: "Honorary Lieutenant Colonel, Territorial Army", tag: "verified" },
  { y: "2011", t: "ICC Spirit of Cricket Award", tag: "verified" },
  { y: "2018", t: "Padma Bhushan", tag: "verified" },
  { y: "2020", t: "ICC Spirit of Cricket Award of the Decade", tag: "verified" },
];

/* ───────────── Photos (Wikimedia Commons, properly attributed) ───────────── */
export interface Photo {
  id: string;
  title: string;
  caption: string;
  src: string;
  author: string;
  license: string;
  licenseUrl: string;
  page: string;
  w: number;
  h: number;
}
const CC = {
  "BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/",
  "BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
};
const W = "https://upload.wikimedia.org/wikipedia/commons/";
const D = "https://commons.wikimedia.org/wiki/File:";
export const PHOTOS: Photo[] = [
  { id: "p-keep", title: "Behind the stumps", caption: "Keeping wicket in a Border–Gavaskar Trophy Test, 2010–11.", src: W + "6/6a/Dhoni_behind_Stumps.jpg", author: "Pulkitsinha", license: "CC BY-SA 2.0", licenseUrl: CC["BY-SA 2.0"], page: D + "Dhoni_behind_Stumps.jpg", w: 761, h: 606 },
  { id: "p-adl1", title: "Adelaide Oval, 2008", caption: "Dhoni at the Adelaide Oval, 14 February 2008.", src: W + "c/c9/MS_Dhoni.jpg", author: "Blnguyen", license: "CC BY-SA 3.0", licenseUrl: CC["BY-SA 3.0"], page: D + "MS_Dhoni.jpg", w: 1023, h: 853 },
  { id: "p-adl2", title: "The captain, 2008", caption: "Another frame from Adelaide Oval, February 2008.", src: W + "3/3b/MS_Dhoni_2.jpg", author: "Blnguyen", license: "CC BY-SA 3.0", licenseUrl: CC["BY-SA 3.0"], page: D + "MS_Dhoni_2.jpg", w: 1085, h: 1306 },
  { id: "p-bowl", title: "Part-time bowler", caption: "Dhoni bowling at the Adelaide Oval, 2008 — a rare sight.", src: W + "0/0e/MS_Dhoni_bowling.jpg", author: "Blnguyen", license: "CC BY-SA 3.0", licenseUrl: CC["BY-SA 3.0"], page: D + "MS_Dhoni_bowling.jpg", w: 574, h: 1286 },
  { id: "p-bat13", title: "Champions Trophy 2013", caption: "Batting against South Africa in the 2013 ICC Champions Trophy group stage.", src: W + "1/16/Mahendra_Singh_Dhoni_batting.JPG", author: "Dee03", license: "CC BY-SA 3.0", licenseUrl: CC["BY-SA 3.0"], page: D + "Mahendra_Singh_Dhoni_batting.JPG", w: 1056, h: 528 },
  { id: "p-2011", title: "The Winning Way, 2011", caption: "At the launch of Harsha Bhogle's book ‘The Winning Way’, 2011.", src: W + "c/ce/MS_Dhoni_in_2011.jpg", author: "Bollywood Hungama", license: "CC BY 3.0", licenseUrl: CC["BY 3.0"], page: D + "MS_Dhoni_in_2011.jpg", w: 585, h: 439 },
  { id: "p-2010s", title: "Late 2010s", caption: "A portrait from the late 2010s.", src: W + "b/bc/MS_Dhoni_%28late_2010s%29.jpg", author: "B A Raju / Times Of India", license: "CC BY 3.0", licenseUrl: CC["BY 3.0"], page: D + "MS_Dhoni_(late_2010s).jpg", w: 335, h: 600 },
];

/* ───────────── Quiz ───────────── */
export type Difficulty = "easy" | "medium" | "hard";
export interface QuizQ {
  q: string;
  o: [string, string, string, string];
  a: number;
  d: Difficulty;
  e: string;
}
export const QUIZ: QuizQ[] = [
  { d: "easy", q: "Which jersey number is Dhoni famous for?", o: ["7", "10", "18", "45"], a: 0, e: "Dhoni wore the number 7 for India and CSK." },
  { d: "easy", q: "Which city is Dhoni from?", o: ["Mumbai", "Ranchi", "Chennai", "Kolkata"], a: 1, e: "Born in Ranchi on 7 July 1981." },
  { d: "easy", q: "Which IPL team did Dhoni captain for most of his career?", o: ["Mumbai Indians", "Delhi Capitals", "Chennai Super Kings", "Punjab Kings"], a: 2, e: "He captained CSK from the inaugural IPL season." },
  { d: "easy", q: "Dhoni's popular nickname is “Captain ___”?", o: ["Fierce", "Cool", "Fast", "Calm-Down"], a: 1, e: "‘Captain Cool’ for his composure under pressure." },
  { d: "easy", q: "Which World Cup did India win under Dhoni in 2011?", o: ["ODI Cricket World Cup", "T20 World Cup", "Asia Cup", "Women's World Cup"], a: 0, e: "India won the 2011 ODI World Cup at home." },
  { d: "easy", q: "What is Dhoni's primary cricketing role?", o: ["Opening bowler", "Spinner", "Wicketkeeper-batter", "Umpire"], a: 2, e: "A wicketkeeper-batter and finisher." },
  { d: "easy", q: "Which signature shot is Dhoni associated with?", o: ["Helicopter shot", "Reverse sweep", "Ramp shot", "Switch hit"], a: 0, e: "The ‘helicopter shot’ is his trademark." },
  { d: "easy", q: "In which year did Dhoni announce his international retirement?", o: ["2017", "2019", "2020", "2022"], a: 2, e: "He announced it on 15 August 2020." },
  { d: "easy", q: "At which stadium was the 2011 World Cup final played?", o: ["Eden Gardens", "Wankhede Stadium", "Chepauk", "Feroz Shah Kotla"], a: 1, e: "Wankhede Stadium, Mumbai." },
  { d: "easy", q: "Whom did India beat in the 2011 World Cup final?", o: ["Pakistan", "Australia", "Sri Lanka", "England"], a: 2, e: "India beat Sri Lanka by 6 wickets." },
  { d: "easy", q: "How many IPL titles did CSK win under Dhoni (through 2023)?", o: ["3", "4", "5", "6"], a: 2, e: "2010, 2011, 2018, 2021 and 2023." },
  { d: "easy", q: "Dhoni's fans at CSK call him…", o: ["Thala", "Chief", "Boss", "Anna"], a: 0, e: "‘Thala’ means leader in Tamil." },
  { d: "medium", q: "Against which team did Dhoni make his ODI debut?", o: ["Pakistan", "Bangladesh", "Sri Lanka", "Zimbabwe"], a: 1, e: "Against Bangladesh at Chittagong on 23 Dec 2004." },
  { d: "medium", q: "What is Dhoni's highest ODI score?", o: ["148", "139*", "183*", "175"], a: 2, e: "183* against Sri Lanka at Jaipur in 2005." },
  { d: "medium", q: "Dhoni made his Test debut against which team?", o: ["Sri Lanka", "Australia", "England", "Pakistan"], a: 0, e: "Against Sri Lanka at Chennai in December 2005." },
  { d: "medium", q: "Who did India beat in the 2007 World T20 final?", o: ["Australia", "South Africa", "Pakistan", "Sri Lanka"], a: 2, e: "India beat Pakistan by 5 runs." },
  { d: "medium", q: "By how many runs did India win the 2013 Champions Trophy final?", o: ["5", "1", "12", "28"], a: 0, e: "India beat England by 5 runs at Edgbaston." },
  { d: "medium", q: "What did Dhoni score in the 2011 World Cup final?", o: ["97", "91*", "74", "100*"], a: 1, e: "91 not out off 79 balls." },
  { d: "medium", q: "Which honour did Dhoni receive in 2018?", o: ["Padma Bhushan", "Bharat Ratna", "Arjuna Award", "Padma Vibhushan"], a: 0, e: "Padma Bhushan, India's third-highest civilian honour." },
  { d: "medium", q: "Before cricket fame, Dhoni worked as a…", o: ["Teacher", "Railway ticket collector", "Bank clerk", "Postman"], a: 1, e: "At Kharagpur railway station." },
  { d: "medium", q: "India first reached No.1 in Test rankings under Dhoni in…", o: ["2007", "2009", "2011", "2013"], a: 1, e: "December 2009." },
  { d: "medium", q: "In which two IPL seasons was CSK suspended?", o: ["2014–15", "2016–17", "2018–19", "2020–21"], a: 1, e: "2016 and 2017." },
  { d: "medium", q: "Who bowled the final over of the 2007 World T20 final for India?", o: ["Joginder Sharma", "Harbhajan Singh", "Irfan Pathan", "RP Singh"], a: 0, e: "Joginder Sharma." },
  { d: "medium", q: "Which team beat CSK to the IPL title in 2008?", o: ["Mumbai Indians", "Rajasthan Royals", "Deccan Chargers", "KKR"], a: 1, e: "Rajasthan Royals won the first IPL final." },
  { d: "hard", q: "What is Dhoni's Test-best score?", o: ["206", "224", "199", "235"], a: 1, e: "224 against Australia, Chennai, 2013." },
  { d: "hard", q: "In how many ODIs did Dhoni captain India?", o: ["150", "175", "200", "230"], a: 2, e: "200 ODIs: 110 wins, 74 losses, 5 ties, 11 no-results." },
  { d: "hard", q: "How many total international dismissals did Dhoni make as wicketkeeper (all formats)?", o: ["729", "829", "929", "629"], a: 1, e: "256+38 (Tests), 321+123 (ODIs), 57+34 (T20Is) = 829." },
  { d: "hard", q: "Where did Dhoni score his first ODI century (148)?", o: ["Jaipur", "Visakhapatnam", "Nagpur", "Kolkata"], a: 1, e: "Against Pakistan at Visakhapatnam in April 2005." },
  { d: "hard", q: "In which year did Dhoni recall Ian Bell at Trent Bridge?", o: ["2009", "2011", "2013", "2014"], a: 1, e: "In the 2011 Test series in England." },
  { d: "hard", q: "Dhoni's ODI batting average is closest to…", o: ["38.1", "44.9", "50.6", "56.2"], a: 2, e: "Approximately 50.57 in ODIs." },
  { d: "hard", q: "Dhoni retired from Test cricket in which month and year?", o: ["Dec 2014", "Jan 2015", "Jun 2016", "Oct 2013"], a: 0, e: "Announced on 30 December 2014 during the series in Australia." },
  { d: "hard", q: "Dhoni stepped down as limited-overs captain in…", o: ["2015", "2016", "2017", "2018"], a: 2, e: "On 4 January 2017." },
  { d: "hard", q: "For which team did Dhoni play in IPL 2016 and 2017?", o: ["Rising Pune Supergiant", "Gujarat Lions", "Kochi Tuskers", "Deccan Chargers"], a: 0, e: "Rising Pune Supergiant." },
  { d: "hard", q: "Which opponent did CSK beat in the 2023 IPL final?", o: ["Gujarat Titans", "Mumbai Indians", "Lucknow Super Giants", "Rajasthan Royals"], a: 0, e: "Gujarat Titans, in a rain-delayed final." },
  { d: "hard", q: "Dhoni was CSK's highest-priced buy at the 2008 auction for roughly…", o: ["US$0.5 million", "US$1.5 million", "US$3 million", "US$5 million"], a: 1, e: "About US$1.5 million." },
  { d: "hard", q: "Where was Dhoni's final international innings (2019)?", o: ["Lord's", "Edgbaston", "Old Trafford", "Headingley"], a: 2, e: "The World Cup semi-final v New Zealand at Old Trafford." },
];

export interface Achievement { id: string; name: string; desc: string; icon: string }
export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-quiz", name: "Debutant", desc: "Finish your first quiz", icon: "🏏" },
  { id: "perfect", name: "Perfect 10", desc: "Score 10/10 in a quiz", icon: "💯" },
  { id: "hard-hero", name: "Hard Mode Hero", desc: "Score 7+ on a hard quiz", icon: "🧠" },
  { id: "speedster", name: "Quick Hands", desc: "Keeper Reflex under 300 ms", icon: "⚡" },
  { id: "finisher", name: "The Finisher", desc: "Win the Last Over Chase", icon: "🎯" },
  { id: "heli", name: "Helicopter Pilot", desc: "Score 30+ in Helicopter Timing", icon: "🚁" },
  { id: "theme-explorer", name: "Theme Explorer", desc: "Try all three themes", icon: "🎨" },
  { id: "trophy-hunter", name: "Trophy Hunter", desc: "Unlock every trophy", icon: "🏆" },
  { id: "archivist", name: "Archivist", desc: "Favourite 3 media items", icon: "🗂️" },
  { id: "backup", name: "Safe Keeper", desc: "Export a data backup", icon: "💾" },
];
