export type BibleCanon =
  "protestant" | "catholic" | "eastern_orthodox" | "ethiopian_orthodox";

export interface BibleCanonConfig {
  id: BibleCanon;
  name: string;
  shortName: string;
  badge: string;
  description: string;
  totalBooks: number;
  totalChapters: number;
  otBooks: number;
  ntBooks: number;
}

export type BibleCategory =
  | "Law"
  | "History"
  | "Poetry & Wisdom"
  | "Major Prophets"
  | "Minor Prophets"
  | "Deuterocanon"
  | "Gospels"
  | "Church History"
  | "Pauline Epistles"
  | "General Epistles"
  | "Apocalyptic"
  | "Orthodox Canon";

export type BookColorTheme =
  "yellow" | "blue" | "purple" | "green" | "rose" | "amber";

export interface BibleBook {
  id: string;
  name: string;
  testament: "OT" | "NT";
  category: BibleCategory;
  chapters: number;
  order: number;
  colorTheme: BookColorTheme;
}
