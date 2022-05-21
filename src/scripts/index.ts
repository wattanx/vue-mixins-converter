import fs from 'fs';
import path from 'path';
import { convertSrc } from '../lib/converter';
import config from './mixins-converter.json';

if (!config.input) {
  throw new Error('no input file.');
}

if (!config.outputFileName) {
  console.warn(
    'The function name is output based on the file name because outputFileName does not exist.'
  );
}

const fileName = config.outputFileName || `use${path.parse(config.input).name}`;

const input = fs.readFileSync(config.input).toString();

const output = convertSrc({ input, fileName, useNuxt: config.useNuxt });

fs.writeFileSync(`dist/${fileName}.ts`, output);
