/**
 * Utility functions for iRacing SDK
 */

import * as yaml from 'js-yaml';
import { YAML_TRANSLATER } from './constants.js';

/**
 * Translate and clean YAML data from iRacing shared memory
 */
export function translateYamlData(data: Buffer): string {
  // Replace non-printable characters
  let buffer = Buffer.from(data);

  // Apply YAML_TRANSLATER
  for (const [from, to] of Object.entries(YAML_TRANSLATER)) {
    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i] === parseInt(from)) {
        buffer[i] = to;
      }
    }
  }

  // Remove trailing nulls and decode
  const nullIndex = buffer.indexOf(0);
  if (nullIndex !== -1) {
    buffer = buffer.slice(0, nullIndex);
  }

  // Use latin1 encoding which is compatible with cp1252 for most characters
  return buffer.toString('latin1');
}

/**
 * Parse YAML and handle iRacing-specific formatting
 */
export function parseIRSDKYaml(yamlStr: string): any {
  // Remove non-printable characters
  let cleanStr = yamlStr.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Handle driver info names with special characters
  cleanStr = cleanStr.replace(
    /((?:DriverSetupName|UserName|TeamName|AbbrevName|Initials): )(.*)/g,
    (match, prefix, value) => {
      const escaped = value.replace(/["\\\n]/g, (c: string) => '\\' + c);
      return prefix + '"' + escaped + '"';
    }
  );

  // Handle values starting with comma
  cleanStr = cleanStr.replace(/(\w+: )(,.*)/g, '$1"$2"');

  try {
    return yaml.load(cleanStr) as any;
  } catch (error) {
    console.error('Failed to parse YAML:', error);
    return null;
  }
}

/**
 * Extract a section from YAML binary data
 */
export function extractYamlSection(sharedMem: Buffer, offset: number, len: number, sectionName: string): Buffer | null {
  const start = offset;
  const end = start + len;

  // Search for section header
  const searchPattern = `\n${sectionName}:\n`;
  const searchBuffer = Buffer.from(searchPattern, 'utf-8');

  let matchStart = -1;
  for (let i = start; i < end - searchBuffer.length; i++) {
    let found = true;
    for (let j = 0; j < searchBuffer.length; j++) {
      if (sharedMem[i + j] !== searchBuffer[j]) {
        found = false;
        break;
      }
    }
    if (found) {
      matchStart = i + 1; // Skip the leading newline
      break;
    }
  }

  if (matchStart === -1) {
    return null;
  }

  // Search for end (double newline)
  const endPattern = '\n\n';
  const endBuffer = Buffer.from(endPattern, 'utf-8');

  let matchEnd = end;
  for (let i = matchStart + 1; i < end - endBuffer.length; i++) {
    let found = true;
    for (let j = 0; j < endBuffer.length; j++) {
      if (sharedMem[i + j] !== endBuffer[j]) {
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
}

/**
 * Pad car number for broadcast message
 */
export function padCarNumber(num: string | number): number {
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
}

/**
 * Check if iRacing is running via HTTP status check
 */
export async function checkSimStatus(): Promise<boolean> {
  try {
    const http = require('http');
    return new Promise((resolve) => {
      const req = http.get('http://127.0.0.1:32034/get_sim_status?object=simStatus', (res: any) => {
        let data = '';
        res.on('data', (chunk: string) => (data += chunk));
        res.on('end', () => {
          resolve(data.includes('running:1'));
        });
      });

      req.on('error', () => {
        resolve(false);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}

