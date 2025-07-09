import type { IMTNode } from "@zk-kit/imt";
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import type { Note } from "../types";
import { poseidon2 } from "poseidon-lite";

export class Storage {
  private storage: ReturnType<typeof createStorage>;

  constructor(dbPath: string) {
    this.storage = createStorage({ driver: fsDriver({ base: dbPath }) });
  }

  async clear() {
    await this.storage.clear();
  }

  async setLeaves(leaves: IMTNode[]) {
    await this.storage.setItem("tree:leaves", leaves);
  }

  async getLeaves() {
    return await this.storage.getItem<IMTNode[]>("tree:leaves");
  }

  async setNote(note: Note) {
    await this.storage.setItem("note", {
      value: note.value,
      secret: note.secret,
      nullifier: note.nullifier,
    });
  }

  async getNote(): Promise<Note | null> {
    const note = await this.storage.getItem<{
      value: number;
      secret: number;
      nullifier: number;
    }>("note");

    if (!note) {
      return null;
    }

    const commitment = poseidon2([note.value, note.secret]);
    const nullifierHash = poseidon2([commitment, note.nullifier]);

    return {
      ...note,
      commitment,
      nullifierHash,
    };
  }
}
