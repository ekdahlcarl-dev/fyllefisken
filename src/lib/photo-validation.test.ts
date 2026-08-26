import test from "node:test";
import assert from "node:assert/strict";
import { PHOTO_MAX_BYTES, validatePhotoInput } from "./photo-validation.ts";

test("accepts supported catch photo", () => {
  assert.equal(validatePhotoInput({ mimeType: "image/jpeg", size: 1024, catchId: "catch-1" }), null);
});

test("rejects invalid file type", () => {
  assert.equal(validatePhotoInput({ mimeType: "image/gif", size: 1024, catchId: "catch-1" }), "invalid_type");
});

test("rejects excessive file size", () => {
  assert.equal(validatePhotoInput({ mimeType: "image/jpeg", size: PHOTO_MAX_BYTES + 1, catchId: "catch-1" }), "invalid_size");
});

test("rejects missing or ambiguous record target", () => {
  assert.equal(validatePhotoInput({ mimeType: "image/jpeg", size: 1024 }), "invalid_target");
  assert.equal(validatePhotoInput({ mimeType: "image/jpeg", size: 1024, catchId: "catch-1", year: 2026 }), "invalid_target");
});

test("rejects invalid historical year", () => {
  assert.equal(validatePhotoInput({ mimeType: "image/webp", size: 1024, year: 2010 }), "invalid_year");
});
