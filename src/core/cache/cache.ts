import * as vscode from "vscode";
import { LinkedFile } from "../common/types";
import { textDocumentFsPath } from "../fsPath/textDocumentFsPath";
import { getLogger } from "../logger/getLogger";

// TODO(lukemurray): there is still a memory leak if a document is deleted while the application is closed

const hashKey = `754F0FA6-C9D6-4419-A863-2269F73D089A` as const;

class Cache {
  private readonly memento: vscode.Memento;
  constructor(memento: vscode.Memento) {
    this.memento = memento;
  }

  public deleteCachedLinkedFileForFsPath(fsPath: string): Thenable<void> {
    const cachedLinkedFileKey = this.getCachedLinkedFileKey(fsPath);
    if (cachedLinkedFileKey === undefined) {
      return Promise.resolve();
    }
    return this.memento.update(cachedLinkedFileKey, undefined);
  }

  /**
   * Return the linked file associated with the document if the linked file exists
   * @param document the document to get the linked file for
   */
  public getCachedLinkedFileFromDocument(
    document: vscode.TextDocument
  ): LinkedFile | undefined {
    // get the key to the linked file
    const cachedLinkedFileKey = this.getCachedLinkedFileKey(document);
    if (cachedLinkedFileKey === undefined) {
      return undefined;
    }

    // get the cached linked file
    const cachedLinkedFile = this.memento.get<
      LinkedFile & { [hashKey]: string }
    >(cachedLinkedFileKey);

    // check that all cache values match
    const linkedFileHash = this.documentHash(document);

    // if the linkedFile is stored and has the correct hashKey
    // and the hashKey has the correct hash
    // return the file
    if (
      cachedLinkedFile !== undefined &&
      hashKey in cachedLinkedFile &&
      cachedLinkedFile[hashKey] === linkedFileHash
    ) {
      return cachedLinkedFile;
    }
    return undefined;
  }

  /**
   * Set the linked file associated with the document
   * @param document the document to set the linked file for
   */
  public async setCachedLinkedFileFromDocument(
    document: vscode.TextDocument,
    linkedFile: LinkedFile
  ): Promise<Thenable<void>> {
    // if the file was previously saved then remove it
    const cachedLinkedFileKey = this.getCachedLinkedFileKey(document);
    if (
      cachedLinkedFileKey !== undefined &&
      this.memento.get(cachedLinkedFileKey) !== undefined
    ) {
      await this.memento.update(cachedLinkedFileKey, undefined);
    }

    // hash the document
    const linkedFileHash = this.documentHash(document);
    // set the key for the linked file associated with the document
    await this.setCachedLinkedFileKey(document, linkedFileHash);
    // set the linked file at the proper location
    return await this.memento.update(linkedFileHash, {
      ...linkedFile,
      [hashKey]: linkedFileHash,
    });
  }

  /**
   * get the key for the linked file associated with the text document
   */
  private getCachedLinkedFileKey(
    key: vscode.TextDocument | string
  ): string | undefined {
    let fsPathHash;
    if (typeof key === "string") {
      fsPathHash = this.hash(key);
    } else {
      fsPathHash = this.getFsPathHash(key);
    }
    const cachedLinkedFileKey = this.memento.get<string>(fsPathHash);
    return cachedLinkedFileKey;
  }

  /**
   * Set the key for the linked file associated with the text document
   */
  private setCachedLinkedFileKey(
    document: vscode.TextDocument,
    value: string
  ): Thenable<void> {
    const fsPathHash = this.getFsPathHash(document);
    return this.memento.update(fsPathHash, value);
  }

  private getFsPathHash(document: vscode.TextDocument): string {
    return this.hash(textDocumentFsPath(document));
  }

  private documentHash(document: vscode.TextDocument): string {
    return this.hash(
      textDocumentFsPath(document) + document.getText() + hashKey
    );
  }

  /**
   * hash function copied from https://stackoverflow.com/a/52171480
   * @param str the string to hash
   * @param seed the seed of the hash
   */
  private hash(str: string, seed = 0): string {
    let h1 = 0xdeadbeef ^ seed;
    let h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 =
      Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
      Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 =
      Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
      Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return `${4294967296 * (2097151 & h2) + (h1 >>> 0)}`;
  }
}

let _cache: Cache | undefined;

function createCache(memento: vscode.Memento): void {
  _cache = new Cache(memento);
}

function getCache(): Cache {
  if (_cache === undefined) {
    const message = "cache requested before the cache is defined.";
    void getLogger().error(message);
    throw new Error(message);
  }
  return _cache;
}

export { getCache, createCache };
