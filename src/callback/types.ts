// read-here | assign-to-pending-fact | set-as-default |
// choose-parent-for-new-or-moved-category | choose-category-to-move |
// choose-category-to-edit
export type Purpose = "r" | "a" | "d" | "c" | "m" | "e";

export type EditAction = "n" | "m"; // rename | change-parent

export type Callback =
  | { op: "b"; purpose: Purpose; catId: number; page: number } // browse into catId (0 = root)
  | { op: "s"; purpose: Purpose; token: string; page: number } // search results page
  | { op: "p"; purpose: Purpose; catId: number } // pick/commit a category
  | { op: "u"; purpose: Purpose; catId: number; page: number } // up to parent of catId
  | { op: "n"; catId: number } // next fact (0 = user's default category)
  | { op: "r"; catId: number } // random/surprise-me within catId (0 = any)
  | { op: "e"; action: EditAction; catId: number } // /editcat menu action on catId
  | { op: "x" } // cancel current flow
  | { op: "h" } // noop (e.g. page indicator button)
  | { op: "z" }; // confirm: clear this user's seen-facts history (/reset)
