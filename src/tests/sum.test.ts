import { describe, expect, it } from "vitest";

function sum(a: number, b: number): number {
	return a + b;
}

describe("sum", () => {
	it("adds two numbers correctly", () => {
		expect(sum(2, 3)).toBe(5);
	});
});
