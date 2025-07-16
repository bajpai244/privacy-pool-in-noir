import type { IMTNode } from "@zk-kit/imt";
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import type { Note } from "../types";
import { poseidon1, poseidon3 } from "poseidon-lite";
import { calculateCommitment, calculateNullifierHash } from "./utils";

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
      value: note.value.toString(),
      secret: note.secret.toString(),
      nullifier: note.nullifier.toString(),
    });
  }

  async getNote(): Promise<Note | null> {
    const note = await this.storage.getItem<{
      value: string;
      secret: string;
      nullifier: string;
    }>("note");

    if (!note) {
      return null;
    }

    const commitment = calculateCommitment(
      BigInt(note.value),
      BigInt(note.secret),
      BigInt(note.nullifier)
    );
    const nullifierHash = calculateNullifierHash(BigInt(note.nullifier));

    return {
      value: BigInt(note.value),
      secret: BigInt(note.secret),
      nullifier: BigInt(note.nullifier),
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
