import { test } from "@playwright/test";

test("Simple example initializes", async ({ page }) => {
  test.setTimeout(5000);
  await page.goto(`http://localhost:8080/roslib-examples/src/simple.html`);
  await page.waitForEvent("console", (msg) =>
    msg.text().includes("Connection made!"),
  );
});
