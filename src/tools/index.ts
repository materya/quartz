import { CommandError } from '../errors'

// https:// stackoverflow.com/questions/50642020/typescript-how-to-write-a-function-with-conditional-return-type

type ArgsParserParams = { commands?: Array<string> }
type ArgsParserReturnType = {
  command: string | undefined
  flags: Array<string>
}

const argsParserDefaults = {}

export const argsParser = (
  params: ArgsParserParams = argsParserDefaults,
): ArgsParserReturnType => {
  const args = process.argv.slice(2)
  const command = args.shift()

  if (params.commands && command && !params.commands.includes(command)) {
    throw new CommandError(params.commands, command)
  }

  return {
    command,
    flags: args,
  }
}

export default { argsParser }
