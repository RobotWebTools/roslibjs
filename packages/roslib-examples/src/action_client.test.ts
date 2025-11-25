import { test } from "@playwright/test";

test("ActionClient example initializes", async ({ page }) => {
  test.setTimeout(5000);
  await page.goto(
    `http://localhost:8080/roslib-examples/src/action_client.html`,
  );
  await page.waitForEvent("console", (msg) =>
    msg.text().includes("Connection made!"),
  );
});
