/** Parse the documented quoted, space-separated constructor argv without a shell. */
export function parseConstructorArgs(input: string): string[] {
  if (/[\r\n\0]/.test(input)) {
    throw new Error('constructor_args must not contain newlines or null bytes');
  }

  const args: string[] = [];
  let value = '';
  let quote: '"' | "'" | undefined;
  let started = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quote) {
      if (char === quote) quote = undefined;
      else if (char === '\\' && input[i + 1] === quote) value += input[++i];
      else value += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      started = true;
    } else if (/\s/.test(char)) {
      if (started) {
        args.push(value);
        value = '';
        started = false;
      }
    } else if (char === '\\' && i + 1 < input.length) {
      value += input[++i];
      started = true;
    } else {
      value += char;
      started = true;
    }
  }
  if (quote) throw new Error('constructor_args contains an unterminated quote');
  if (started) args.push(value);
  return args;
}
