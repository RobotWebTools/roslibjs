import { test } from "@playwright/test";

test("ROS 2 Action server example initializes", async ({ page }) => {
  test.setTimeout(5000);
  await page.goto(
    `http://localhost:8080/roslib-examples/src/ros2_action_server.html`,
  );
  await page.waitForEvent("console", (msg) =>
    msg.text().includes("Connection made!"),
  );
});
