import * as yaml from 'js-yaml';

const YAML_TRANSLATER: { [key: number]: number } = {
  129: 0x20,
  141: 0x20,
  143: 0x20,
  144: 0x20,
  157: 0x20,
};

export const translateYamlData = (data: number[]): string => {
  const bytes = [...data];

  for (const [from, to] of Object.entries(YAML_TRANSLATER)) {
    const fromByte = parseInt(from, 10);
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] === fromByte) {
        bytes[i] = to;
      }
    }
  }

  const nullIndex = bytes.indexOf(0);
  const trimmed = nullIndex !== -1 ? bytes.slice(0, nullIndex) : bytes;

  // Decode as latin1 (each byte maps directly to its char code)
  return String.fromCharCode(...trimmed);
};

// biome-ignore lint/suspicious/noExplicitAny: YAML data is dynamically typed
export const parseIRSDKYaml = (yamlStr: string): any => {
  let cleanStr = yamlStr.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  cleanStr = cleanStr.replace(
    /((?:DriverSetupName|UserName|TeamName|AbbrevName|Initials): )(.*)/g,
    (_match, prefix, value) => {
      const escaped = value.replace(/["\\\n]/g, (c: string) => `\\${c}`);
      return `${prefix}"${escaped}"`;
    },
  );

  cleanStr = cleanStr.replace(/(\w+: )(,.*)/g, '$1"$2"');

  try {
    // biome-ignore lint/suspicious/noExplicitAny: YAML data is dynamically typed
    return yaml.load(cleanStr) as any;
  } catch (error) {
    console.error('Failed to parse YAML:', error);
    return null;
  }
};

export const extractYamlSection = (
  sharedMem: number[],
  offset: number,
  len: number,
  sectionName: string,
): number[] | null => {
  const start = offset;
  const end = start + len;

  const searchPattern = `\n${sectionName}:\n`;
  const searchBytes: number[] = [];
  for (let i = 0; i < searchPattern.length; i++) {
    searchBytes.push(searchPattern.charCodeAt(i));
  }

  let matchStart = -1;
  for (let i = start; i < end - searchBytes.length; i++) {
    let found = true;
    for (let j = 0; j < searchBytes.length; j++) {
      if (sharedMem[i + j] !== searchBytes[j]) {
        found = false;
        break;
      }
    }
    if (found) {
      matchStart = i + 1;
      break;
    }
  }

  if (matchStart === -1) {
    return null;
  }

  const endBytes = [0x0a, 0x0a]; // '\n\n'

  let matchEnd = end;
  for (let i = matchStart + 1; i < end - endBytes.length; i++) {
    let found = true;
    for (let j = 0; j < endBytes.length; j++) {
      if (sharedMem[i + j] !== endBytes[j]) {
        found = false;
        break;
      }
    }
    if (found) {
      matchEnd = i;
      break;
    }
  }

  return sharedMem.slice(matchStart, matchEnd);
};

export const padCarNumber = (num: string | number): number => {
  const numStr = String(num);
  const numLen = numStr.length;
  let zero = numLen - numStr.replace(/^0+/, '').length;

  if (zero > 0 && numLen === zero) {
    zero -= 1;
  }

  const parsedNum = parseInt(numStr, 10);

  if (zero) {
    const numPlace = parsedNum > 99 ? 3 : parsedNum > 9 ? 2 : 1;
    return parsedNum + 1000 * (numPlace + zero);
  }

  return parsedNum;
};

export const checkSimStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch(
      'http://127.0.0.1:32034/get_sim_status?object=simStatus',
      { signal: AbortSignal.timeout(5000) },
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.text();
    return data.includes('running:1');
  } catch {
    return false;
  }
};
