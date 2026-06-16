import assert from "node:assert/strict";

const storage = new Map();
const fetchCalls = [];

globalThis.localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, value);
  },
  removeItem(key) {
    storage.delete(key);
  },
};

globalThis.fetch = async (url) => {
  fetchCalls.push(url);
  return {
    ok: true,
    async json() {
      return [{ tag: "legacy_style", name: "Legacy Style" }];
    },
  };
};

const { Data } = await import("../js/data.js");

await Data.all();
assert.deepEqual(fetchCalls, ["/anima/artists"]);

Data.reset();
fetchCalls.length = 0;

await Data.all({ includeAnimadex: true });
assert.deepEqual(fetchCalls, ["/anima/artists?animadex=1"]);

console.log("data loading route tests passed");
