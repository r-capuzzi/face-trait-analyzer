import { classifyBands } from "./bands";

const BANDS = [{ key: "low", max: 0 }, { key: "mid", max: 10 }, { key: "high" }];

test("picks the band containing the value; boundaries belong to the upper band", () => {
  expect(classifyBands(-5, BANDS, { span: 5 }).category).toBe("low");
  expect(classifyBands(0, BANDS, { span: 5 }).category).toBe("mid");
  expect(classifyBands(10, BANDS, { span: 5 }).category).toBe("high");
});

test("margin is 0 on a boundary and 1 at an interior band's midpoint", () => {
  expect(classifyBands(0, BANDS, { span: 5 }).margin).toBe(0);
  expect(classifyBands(5, BANDS, { span: 5 }).margin).toBe(1);
  expect(classifyBands(2.5, BANDS, { span: 5 }).margin).toBe(0.5);
});

test("end bands use `span` as their depth and cap at 1", () => {
  expect(classifyBands(-2.5, BANDS, { span: 5 }).margin).toBe(0.5);
  expect(classifyBands(-50, BANDS, { span: 5 }).margin).toBe(1);
  expect(classifyBands(12, BANDS, { span: 4 }).margin).toBe(0.5);
});

test("runnerUp is the neighbor across the nearer boundary", () => {
  expect(classifyBands(1, BANDS, { span: 5 }).runnerUp).toBe("low");
  expect(classifyBands(9, BANDS, { span: 5 }).runnerUp).toBe("high");
  expect(classifyBands(-1, BANDS, { span: 5 }).runnerUp).toBe("mid");
  expect(classifyBands(11, BANDS, { span: 5 }).runnerUp).toBe("mid");
});
