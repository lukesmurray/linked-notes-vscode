export function sluggifyDocumentReference(documentReference: string): string {
  return documentReference
    .replace(/[^\w\s-]/g, "") // Remove non-ASCII characters
    .trim()
    .replace(/[-\s]+/g, "-") // Convert whitespace to hyphens
    .toLocaleLowerCase();
}
