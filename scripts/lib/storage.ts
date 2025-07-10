import type { IMTNode } from "@zk-kit/imt";
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import type { Note } from "../types";
import { poseidon1, poseidon3 } from "poseidon-lite";

export class Storage {
  private storage: ReturnType<typeof createStorage>;

  constructor(dbPath: string) {
    this.storage = createStorage({ driver: fsDriver({ base: dbPath }) });
  }

  async clear() {
    await this.storage.clear();
  }

  async setLeaves(leaves: IMTNode[]) {
    await this.storage.setItem(
      "tree:leaves",
      leaves.map(leaf => leaf.toString())
    );
  }

  async getLeaves() {
    return (await this.storage.getItem<string[]>("tree:leaves"))?.map(v => {
      return BigInt(v);
    });
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

    const commitment = poseidon3([note.value, note.secret, note.nullifier]);
    const nullifierHash = poseidon1([note.nullifier]);

    return {
      ...note,
      commitment,
      nullifierHash,
    };
  }

  async removeNote() {
    await this.storage.removeItem("note");
  }

  async insertNullifierHash(nullifierHash: bigint) {
    await this.storage.setItem(
      `nulliferHashMap:${nullifierHash.toString()}`,
      true
    );
  }

  async nullifierHashExists(nullifierHash: bigint) {
    return await this.storage.hasItem(
      `nulliferHashMap:${nullifierHash.toString()}`
    );
  }
}
