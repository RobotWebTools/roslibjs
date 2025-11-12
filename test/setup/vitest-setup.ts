/**
 * Vitest Setup File
 * This file sets up and tears down the ROS backend container for all tests
 */

import { setupBackend, teardownBackend } from "./ros-backend.ts";

// Global setup - runs once before all tests
export async function setup() {
  console.log("Setting up ROS backend for tests...");
  await setupBackend();
  console.log("ROS backend is ready for testing");
}

// Global teardown - runs once after all tests
export async function teardown() {
  console.log("Tearing down ROS backend...");
  await teardownBackend();
}
