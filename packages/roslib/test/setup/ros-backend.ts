/**
 * ROS Backend Container Management Utility
 * This utility manages the ROS backend Docker container for testing using dockerode
 */

import Docker from "dockerode";
import Ros from "../../src/core/Ros.ts";

const CONTAINER_NAME = "roslibjs-test-backend";
const CONTAINER_PORT = 9090;
const MAX_WAIT_TIME = 30000; // 30 seconds
const POLL_INTERVAL = 1000; // 1 second

const docker = new Docker();

/**
 * Get ROS distro from environment or default to noetic
 */
function getRosDistro() {
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- this might be an empty string, not undefined.
  return (process.env["ROS_DISTRO"] ||= "noetic");
}

async function waitForRosConnection(ros: Ros, timeout = 5000) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Timeout waiting for ROS connection"));
    }, timeout);

    ros.on("connection", () => {
      clearTimeout(timeoutId);
      resolve();
    });

    ros.on("error", (event) => {
      clearTimeout(timeoutId);
      if (event && typeof event === "object" && "error" in event) {
        reject(new Error(String(event.error)));
      } else {
        reject(new Error("Unknown error"));
      }
    });

    // If already connected
    if (ros.isConnected) {
      clearTimeout(timeoutId);
      resolve();
    }
  });
}

/**
 * Build the ROS test container
 */
async function buildContainer(rosDistro: string) {
  console.log(`Building ROS test container for ${rosDistro}...`);

  const stream = await docker.buildImage(
    {
      context: ".",
      src: ["Dockerfile", "package.xml", "test/"],
    },
    {
      t: `roslibjs-test:${rosDistro}`,
      buildargs: { ROS_DISTRO: rosDistro },
      version: "2",
    },
  );

  await new Promise((resolve, reject) => {
    docker.modem.followProgress(
      stream,
      (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      },
      (event: { stream?: Uint8Array; errorDetail?: { message: string } }) => {
        if (event.stream) {
          process.stdout.write(event.stream);
        } else if (event.errorDetail) {
          process.stderr.write(event.errorDetail.message);
        }
      },
    );
  });

  console.log("Container built successfully");
}

/**
 * Start the ROS backend container
 */
async function startContainer(rosDistro: string) {
  console.log("Starting ROS backend container...");

  // Stop and remove existing container if it exists
  try {
    const existingContainer = docker.getContainer(CONTAINER_NAME);
    await existingContainer.stop();
    await existingContainer.remove();
  } catch {
    // Container doesn't exist, that's fine
  }

  // Create and start new container
  const container = await docker.createContainer({
    Image: `roslibjs-test:${rosDistro}`,
    name: CONTAINER_NAME,
    ExposedPorts: { "9090/tcp": {} },
    HostConfig: {
      PortBindings: { "9090/tcp": [{ HostPort: CONTAINER_PORT.toString() }] },
    },
  });

  await container.start();
  console.log(`Container started on port ${CONTAINER_PORT.toString()}`);
}

/**
 * Wait for the ROS backend to be ready
 */
async function waitForBackend() {
  console.log("Waiting for ROS backend to be ready...");

  const startTime = Date.now();

  while (Date.now() - startTime < MAX_WAIT_TIME) {
    try {
      await waitForRosConnection(
        new Ros({ url: `ws://localhost:${CONTAINER_PORT.toString()}` }),
      );
      console.log("ROS backend is ready");
      return true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }
  }

  console.error("Timeout waiting for ROS backend");
  return false;
}

/**
 * Stop the ROS backend container
 */
async function stopContainer() {
  console.log("Stopping ROS backend container...");
  try {
    const container = docker.getContainer(CONTAINER_NAME);
    await container.stop();
    await container.remove();
    console.log("Container stopped");
  } catch (error) {
    console.error("Error stopping container:", String(error));
  }
}

/**
 * Get container logs
 */
async function getLogs() {
  try {
    const container = docker.getContainer(CONTAINER_NAME);
    const logs = await container.logs({ stdout: true, stderr: true });
    return logs.toString();
  } catch (error) {
    return `Error getting logs: ${String(error)}`;
  }
}

/**
 * Main setup function
 */
export async function setupBackend() {
  const rosDistro = getRosDistro();
  console.log(`Using ROS distro: ${rosDistro}`);

  // Build container
  await buildContainer(rosDistro);

  // Start container
  await startContainer(rosDistro);

  // Wait for backend to be ready
  const isReady = await waitForBackend();
  if (!isReady) {
    console.error("ROS backend failed to start. Container logs:");
    console.error(await getLogs());
    await stopContainer();
    throw new Error("ROS backend failed to start");
  }

  console.log("ROS backend setup complete");
}

/**
 * Main teardown function
 */
export async function teardownBackend() {
  await stopContainer();
}
