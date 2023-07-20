// Import Node.js Dependencies
import assert from "node:assert";
import { describe, it } from "node:test";

// Import Internal Dependencies
import * as utils from "../src/utils";
import dayjs from "dayjs";

describe("Utils", () => {
  describe("durationToDate()", () => {
    it("should add one year", () => {
      const date = utils.durationToDate("1y", "add");

      assert.equal(date.get("y"), dayjs().add(1, "y").get("y"));
    });

    it("should subtract one year", () => {
      const date = utils.durationToDate("1y", "subtract");

      assert.equal(date.get("y"), dayjs().subtract(1, "y").get("y"));
    });
  });
});
