/**
 * @fileOverview
 * Test for Action.sendGoal status code handling
 * Tests that sendGoal properly handles STATUS_CANCELED and other status codes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Action from "../src/core/Action.ts";
import { GoalStatus } from "../src/core/GoalStatus.ts";
import type Ros from "../src/core/Ros.ts";

// Strict types matching the real protocol
interface ActionResultMessageBase {
  op: "action_result";
  id: string;
  action: string;
  status: number;
}

interface FailedActionResultMessage extends ActionResultMessageBase {
  result: false;
  values?: string;
}

interface SuccessfulActionResultMessage extends ActionResultMessageBase {
  result: true;
  values: { result: number };
}

type ActionResultMessage =
  | FailedActionResultMessage
  | SuccessfulActionResultMessage;

interface ActionFeedbackMessage {
  op: "action_feedback";
  id: string;
  action: string;
  values: { current: number };
}

type ActionMessage = ActionResultMessage | ActionFeedbackMessage;

describe("Action.sendGoal", () => {
  let action: Action<
    { target: number },
    { current: number },
    { result: number }
  >;
  let mockRos: Ros;
  let messageHandler: ((msg: ActionMessage) => void) | null = null;

  beforeEach(() => {
    messageHandler = null;
    mockRos = {
      on: vi.fn((_id: string, callback: (msg: ActionMessage) => void) => {
        messageHandler = callback;
      }),
      callOnConnection: vi.fn(),
    } as unknown as Ros;

    action = new Action({
      ros: mockRos,
      name: "/test_action",
      actionType: "test_msgs/TestAction",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("status code handling", () => {
    it("should call resultCallback when action succeeds (STATUS_SUCCEEDED)", () => {
      const resultCallback = vi.fn();
      const failedCallback = vi.fn();

      action.sendGoal(
        { target: 10 },
        resultCallback,
        undefined,
        failedCallback,
      );

      const successMessage: SuccessfulActionResultMessage = {
        op: "action_result",
        id: "test-id",
        action: "/test_action",
        values: { result: 42 },
        status: GoalStatus.STATUS_SUCCEEDED,
        result: true,
      };

      messageHandler?.(successMessage);

      expect(resultCallback).toHaveBeenCalledWith({ result: 42 });
      expect(failedCallback).not.toHaveBeenCalled();
    });

    it("should call failedCallback when action is cancelled (STATUS_CANCELED)", () => {
      const resultCallback = vi.fn();
      const failedCallback = vi.fn();

      action.sendGoal(
        { target: 10 },
        resultCallback,
        undefined,
        failedCallback,
      );

      const cancelledMessage: FailedActionResultMessage = {
        op: "action_result",
        id: "test-id",
        action: "/test_action",
        values: "Action was cancelled by user",
        status: GoalStatus.STATUS_CANCELED,
        result: false,
      };

      messageHandler?.(cancelledMessage);

      expect(failedCallback).toHaveBeenCalled();
      expect(resultCallback).not.toHaveBeenCalled();
    });

    it("should call failedCallback when action is aborted (STATUS_ABORTED)", () => {
      const resultCallback = vi.fn();
      const failedCallback = vi.fn();

      action.sendGoal(
        { target: 10 },
        resultCallback,
        undefined,
        failedCallback,
      );

      const abortedMessage: FailedActionResultMessage = {
        op: "action_result",
        id: "test-id",
        action: "/test_action",
        values: "Action aborted due to error",
        status: GoalStatus.STATUS_ABORTED,
        result: false,
      };

      messageHandler?.(abortedMessage);

      expect(failedCallback).toHaveBeenCalled();
      expect(resultCallback).not.toHaveBeenCalled();
    });

    it("should call failedCallback when action is canceling (STATUS_CANCELING)", () => {
      const resultCallback = vi.fn();
      const failedCallback = vi.fn();

      action.sendGoal(
        { target: 10 },
        resultCallback,
        undefined,
        failedCallback,
      );

      const cancelingMessage: FailedActionResultMessage = {
        op: "action_result",
        id: "test-id",
        action: "/test_action",
        values: "Action is being cancelled",
        status: GoalStatus.STATUS_CANCELING,
        result: false,
      };

      messageHandler?.(cancelingMessage);

      expect(failedCallback).toHaveBeenCalled();
      expect(resultCallback).not.toHaveBeenCalled();
    });

    it("should handle unknown status gracefully (STATUS_UNKNOWN)", () => {
      const resultCallback = vi.fn();
      const failedCallback = vi.fn();

      action.sendGoal(
        { target: 10 },
        resultCallback,
        undefined,
        failedCallback,
      );

      const unknownMessage: FailedActionResultMessage = {
        op: "action_result",
        id: "test-id",
        action: "/test_action",
        values: "Unknown status",
        status: GoalStatus.STATUS_UNKNOWN,
        result: false,
      };

      messageHandler?.(unknownMessage);

      expect(failedCallback).toHaveBeenCalled();
      expect(resultCallback).not.toHaveBeenCalled();
    });
  });

  describe("feedback handling", () => {
    it("should handle feedback messages correctly", () => {
      const resultCallback = vi.fn();
      const feedbackCallback = vi.fn();
      const failedCallback = vi.fn();

      action.sendGoal(
        { target: 10 },
        resultCallback,
        feedbackCallback,
        failedCallback,
      );

      const feedbackMessage: ActionFeedbackMessage = {
        op: "action_feedback",
        id: "test-id",
        action: "/test_action",
        values: { current: 5 },
      };

      messageHandler?.(feedbackMessage);

      expect(feedbackCallback).toHaveBeenCalledWith({ current: 5 });
      expect(resultCallback).not.toHaveBeenCalled();
      expect(failedCallback).not.toHaveBeenCalled();
    });

    it("should handle multiple feedback messages", () => {
      const resultCallback = vi.fn();
      const feedbackCallback = vi.fn();
      const failedCallback = vi.fn();

      action.sendGoal(
        { target: 10 },
        resultCallback,
        feedbackCallback,
        failedCallback,
      );

      const feedbackMessage1: ActionFeedbackMessage = {
        op: "action_feedback",
        id: "test-id",
        action: "/test_action",
        values: { current: 3 },
      };

      const feedbackMessage2: ActionFeedbackMessage = {
        op: "action_feedback",
        id: "test-id",
        action: "/test_action",
        values: { current: 7 },
      };

      messageHandler?.(feedbackMessage1);
      messageHandler?.(feedbackMessage2);

      expect(feedbackCallback).toHaveBeenCalledTimes(2);
      expect(feedbackCallback).toHaveBeenNthCalledWith(1, { current: 3 });
      expect(feedbackCallback).toHaveBeenNthCalledWith(2, { current: 7 });
    });
  });

  describe("edge cases", () => {
    it("should prioritize status code over result field", () => {
      const resultCallback = vi.fn();
      const failedCallback = vi.fn();

      action.sendGoal(
        { target: 10 },
        resultCallback,
        undefined,
        failedCallback,
      );

      // This is the problematic case: result=true but status=CANCELED
      // According to protocol, this shouldn't happen, but we test it anyway
      // We have to cast to test this edge case since TypeScript prevents it
      const confusingMessage = {
        op: "action_result",
        id: "test-id",
        action: "/test_action",
        values: { result: 0 },
        status: GoalStatus.STATUS_CANCELED,
        result: true, // This violates the type but could happen at runtime
      } as ActionMessage;

      messageHandler?.(confusingMessage);

      // Should call failedCallback because status is CANCELED
      expect(failedCallback).toHaveBeenCalled();
      expect(resultCallback).not.toHaveBeenCalled();
    });

    it("should handle missing feedback callback gracefully", () => {
      const resultCallback = vi.fn();
      const failedCallback = vi.fn();

      action.sendGoal(
        { target: 10 },
        resultCallback,
        undefined,
        failedCallback,
      );

      const feedbackMessage: ActionFeedbackMessage = {
        op: "action_feedback",
        id: "test-id",
        action: "/test_action",
        values: { current: 5 },
      };

      expect(() => messageHandler?.(feedbackMessage)).not.toThrow();
    });
  });
});
