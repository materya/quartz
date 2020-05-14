import * as c from '@materya/carbon'

/**
 * Error raised when a wrong command has been issue for a CLI or is mandatory
 * and is missing.
 *
 * @augments BaseError
 */
export default class CommandError extends c.errors.BaseError {
  public readonly commands: Array<string>

  public readonly command: string | undefined

  /**
   * Instantiate the error with default properties.
   *
   * @param {Array<string>} commands - List of authorized commands.
   * @param {string} command - the command from args, if any.
   */
  constructor (commands: Array<string>, command?: string) {
    const message = command ? `Unknown command ${command}` : 'Missing command'
    super(`${message}. Allowed commands are: ${commands.join(', ')}.`)

    this.commands = commands
    this.command = command
  }
}
