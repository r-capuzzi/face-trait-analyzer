// Automated accessibility checks (axe-core, WCAG 2.1 A and AA rules) on the
// two screens everyone sees - upload and results - in light and dark mode,
// plus the flows a keyboard or screen-reader user depends on.
import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures.js";

async function violations(page) {
  // the cards fade in (opacity 0 to 1); contrast must be judged on the
  // settled page, not mid-animation, or it fails at random on a slow load
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.effect?.getComputedTiming().iterations === Infinity || a.playState !== "running")
  );
  const { violations: found } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  // one line per problem, so a failure says what and where
  return found.flatMap((v) => v.nodes.map((n) => `${v.id} (${v.impact}): ${n.target.join(" ")} - ${v.help}`));
}

for (const scheme of ["light", "dark"]) {
  test(`the upload page passes axe in ${scheme} mode`, async ({ app }) => {
    await app.page.emulateMedia({ colorScheme: scheme });
    expect(await violations(app.page)).toEqual([]);
  });

  test(`the results page passes axe in ${scheme} mode`, async ({ app }) => {
    await app.page.emulateMedia({ colorScheme: scheme });
    await app.analyze("portrait");
    expect(await violations(app.page)).toEqual([]);
  });
}

test("after analysis, focus moves to the results for screen-reader users", async ({ app }) => {
  await app.analyze("business");
  await expect(app.page.locator("#results-heading")).toBeFocused();
});

test("overruling a result changes the explanation and the summary", async ({ app }) => {
  await app.analyze("business");
  const card = app.page.locator("article", { has: app.page.getByRole("heading", { name: "Eye color", exact: true }) });
  const select = card.getByLabel("Not right? Correct it:");
  await select.selectOption({ label: "Blue / gray" });
  // the card now explains the visitor's pick...
  await expect(card).toContainText("If your eye color is Blue / gray");
  const s = await app.summary();
  expect(s.text).toContain("You picked: Blue / gray");
  // ...and going back to the measurement undoes it
  await select.selectOption({ value: "" });
  expect((await app.summary()).text).not.toContain("You picked");
});
