/**
 * Tiny className joiner (clsx-style, no dependency).
 * Filters out falsy values so variant maps can use `condition && "class"`.
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
