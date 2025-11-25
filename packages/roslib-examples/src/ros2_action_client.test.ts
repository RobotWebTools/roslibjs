import { test } from "@playwright/test";

test("ROS 2 Action client example initializes", async ({ page }) => {
  test.setTimeout(5000);
  await page.goto(
    `http://localhost:8080/roslib-examples/src/ros2_action_client.html`,
  );
  await page.waitForEvent("console", (msg) =>
    msg.text().includes("Connection made!"),
  );
});
