import * as vscode from "vscode";

/**
 * This file creates the output channel as a singleton and the logger as a singleton.
 * Only the logger is exposed to the rest of the application.
 */

/**
 * The output channel can be viewed in the Output panel
 */
let outputChannel: undefined | vscode.OutputChannel;

/**
 * Get the output channel used by the extension
 */
function getOutputChannel(): vscode.OutputChannel {
  if (outputChannel === undefined) {
    outputChannel = vscode.window.createOutputChannel("Linked Notes VSCode");
  }
  return outputChannel;
}

const LogLevelStrings = ["info", "warning", "success", "error"] as const;
type LogLevels = typeof LogLevelStrings[number];

class Logger {
  info(message: string): void {
    this.log(message, "info");
  }

  warning(message: string): void {
    this.log(message, "warning");
  }

  success(message: string): void {
    this.log(message, "success");
  }

  error(message: string): void {
    this.log(message, "error");
  }

  private log(message: string, level: LogLevels): void {
    const timeString = this.currentFormattedTimeString();
    const levelString = level.padEnd(10, " ");
    // log the message
    getOutputChannel().appendLine(
      `[${levelString} - ${timeString}] ${message}`
    );
  }

  /**
   * Get current time in format HH:MM:SS.mmm
   */
  private currentFormattedTimeString(): string {
    const currentTime = new Date();
    const timeString =
      `${currentTime.getHours()}`.padStart(2, "0") +
      ":" +
      `${currentTime.getMinutes()}`.padStart(2, "0") +
      ":" +
      `${currentTime.getSeconds()}`.padStart(2, "0") +
      "." +
      `${currentTime.getMilliseconds()}`.padEnd(3, "0");
    return timeString;
  }
}

let logger: Logger | undefined;

export function getLogger(): Logger {
  if (logger === undefined) {
    logger = new Logger();
  }
  return logger;
}
