import assert from "node:assert/strict";
import test from "node:test";
import { formatFaNumber } from "../lib/format";

test("formatFaNumber preserves every decimal digit without Number conversion", () => {
  assert.equal(formatFaNumber("123456789012345678.123400"), "۱۲۳٬۴۵۶٬۷۸۹٬۰۱۲٬۳۴۵٬۶۷۸٫۱۲۳۴");
  assert.equal(formatFaNumber("-1200.5"), "−۱٬۲۰۰٫۵");
  assert.equal(formatFaNumber("0"), "۰");
});
