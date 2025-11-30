"use strict";

const test = require("node:test");
const assert = require("assert/strict");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const Module = require("module");

// --- Module stubs (must be in place before requiring EXIFReader) ---
const exifrCalls = [];
const exifrStub = {
  async parse(input, opts) {
    exifrCalls.push({ input, opts });
    if (input === "fail") {
      throw new Error("parse failed");
    }
    return {
      DateTimeOriginal: new Date("2024-01-02T03:04:05Z"),
      CreateDate: new Date("2024-01-02T03:04:05Z"),
      Model: "StubCam",
      gps: { latitude: 10.1234, longitude: 20.5678 },
      parsedInput: input,
      label: opts?.label,
    };
  },
};

function buildMongooseStub(documents = []) {
  let connectCalled = 0;
  const collection = {
    find() {
      async function* iterator() {
        for (const doc of documents) {
          yield doc;
        }
      }
      return { [Symbol.asyncIterator]: iterator };
    },
  };

  const connection = {
    readyState: 1,
    db: {
      collection: () => collection,
    },
  };

  return {
    connection,
    connect: async () => {
      connectCalled += 1;
      connection.readyState = 1;
    },
    __connectCalled: () => connectCalled,
  };
}

const mongooseStub = buildMongooseStub([
  { _id: "1", filename: "atlas-one.jpg", data: Buffer.from([1, 2, 3]) },
  {
    _id: "2",
    filename: "atlas-two.heic",
    data: { buffer: Uint8Array.from([4, 5, 6]) },
  },
  { _id: "3", filename: "atlas-three.png", data: [7, 8, 9] },
  { _id: "skip", filename: "atlas-skip.png", data: "not-a-buffer" },
]);

const originalLoad = Module._load;
Module._load = function patched(request, parent, isMain) {
  if (request === "exifr") return exifrStub;
  if (request === "mongoose") return mongooseStub;
  return originalLoad.apply(this, [request, parent, isMain]);
};

const exifReader = require("../geospatial/EXIFReader");

test.after(() => {
  Module._load = originalLoad;
});

// --- Tests ---

test("extractExifMetadata returns parsed data from exifr", async () => {
  const buffer = Buffer.from([9, 9, 9]);
  const result = await exifReader.extractExifMetadata(buffer, {
    label: "buffer-test",
  });

  assert.equal(result.Model, "StubCam");
  assert.deepEqual(result.gps, { latitude: 10.1234, longitude: 20.5678 });
  assert.equal(result.label, "buffer-test");
  assert.equal(exifrCalls.at(-1).input, buffer);
});

test("extractExifMetadata swallows parse failures and returns null", async () => {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(" "));

  const result = await exifReader.extractExifMetadata("fail", {
    label: "fail-case",
  });

  console.warn = originalWarn;

  assert.equal(result, null);
  assert.ok(
    warnings.some((msg) => msg.includes("fail-case")),
    "should log warning with label",
  );
});

test("loadScrapbookEntries reads only image files and attaches EXIF fields", async () => {
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "exif-test-"));
  const imgA = path.join(tmpDir, "one.JPG");
  const imgB = path.join(tmpDir, "two.png");
  const txt = path.join(tmpDir, "notes.txt");
  const nestedDir = path.join(tmpDir, "nested");
  const imgC = path.join(nestedDir, "three.heic");

  fs.writeFileSync(imgA, "fake");
  fs.writeFileSync(imgB, "fake");
  fs.writeFileSync(txt, "text");
  await fsp.mkdir(nestedDir);
  fs.writeFileSync(imgC, "fake");

  process.env.SCRAPBOOK_IMAGE_DIR = tmpDir;

  const entries = await exifReader.loadScrapbookEntries();

  delete process.env.SCRAPBOOK_IMAGE_DIR;
  await fsp.rm(tmpDir, { recursive: true, force: true });

  const imagePaths = entries.map((e) => e.imagePath);
  assert.equal(entries.length, 3);
  assert.ok(imagePaths.includes(imgA));
  assert.ok(imagePaths.includes(imgB));
  assert.ok(imagePaths.includes(imgC));
  entries.forEach((entry) => {
    assert.equal(entry.cameraModel, "StubCam");
    assert.ok(entry.capturedAt instanceof Date);
    assert.deepEqual(entry.gps, { latitude: 10.1234, longitude: 20.5678 });
  });
});

test("fetchImagesFromDb converts binary shapes and skips invalid docs", async () => {
  const images = await exifReader.fetchImagesFromDb("photos");

  assert.equal(images.length, 3);
  assert.equal(images[0].filename, "atlas-one.jpg");
  assert.ok(Buffer.isBuffer(images[0].buffer));

  assert.equal(images[1].filename, "atlas-two.heic");
  assert.ok(Buffer.isBuffer(images[1].buffer));
  assert.deepEqual([...images[1].buffer], [4, 5, 6]);

  assert.equal(images[2].filename, "atlas-three.png");
  assert.deepEqual([...images[2].buffer], [7, 8, 9]);
});

test("loadScrapbookEntriesFromDb parses EXIF for Atlas documents", async () => {
  const entries = await exifReader.loadScrapbookEntriesFromDb("photos");

  assert.equal(entries.length, 3);
  entries.forEach((entry) => {
    assert.ok(entry.filename.startsWith("atlas-"));
    assert.equal(entry.cameraModel, "StubCam");
    assert.ok(entry.capturedAt instanceof Date);
  });
});
