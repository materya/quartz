import * as carbon from '@materya/carbon'

/**
 * Error raised when a wrong command has been issue for a CLI or is mandatory
 * and is missing.
 *
 * @augments BaseError
 */
export default class CommandError extends carbon.errors.BaseError {
  public readonly setting: string

  public readonly alternative?: string

  /**
   * Instantiate the error with default properties.
   *
   * @param {string} setting - The setting name missing.
   * @param {string} alternative - the command from args, if any.
   */
  constructor (setting: string, alternative?: string) {
    const alternativeMsg = `Alternatively ${alternative} was not found either.`
    super(`Setting ${setting} not found. ${alternative && alternativeMsg}`)

    this.setting = setting
    this.alternative = alternative
  }
}
