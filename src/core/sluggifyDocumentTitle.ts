export function sluggifyDocumentTitle(title: string): string {
  return title
    .replace(/[^\w\s-]/g, "") // Remove non-ASCII characters
    .trim()
    .replace(/[-\s]+/g, "-") // Convert whitespace to hyphens
    .toLocaleLowerCase();
}
