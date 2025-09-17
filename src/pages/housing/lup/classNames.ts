// src/pages/housing/lup/classNames.ts
export const classNames = (...arr: Array<string | false | null | undefined>) => arr.filter(Boolean).join(" ");