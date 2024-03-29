/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-non-null-assertion */
import { parse, SemVer } from 'semver';
import { setMetadata } from './set-metadata';
import { execute, publishAllPackagesToNpm } from './utils';

export async function main() {
  const json = require('../../package.json');

  // determine commit from either circle ci or last git commit
  let commit = process.env.CIRCLE_SHA1;
  if (!commit) {
    const lastCommit = await execute('git rev-parse HEAD');
    commit = lastCommit.toString().trim();
  }

  // shorten commit
  commit = commit!.slice(0, 7);

  // construct new version from base version 2.0.0 to become 2.0.0+dev.shortsha
  const version: SemVer = parse(json.version)!;
  const newVersion = `${version.major}.${version.minor}.${version.patch}-dev`; // .master-${commit}`;

  console.log('setting metada for all packages');

  setMetadata(true);

  console.log('publishing new version', newVersion);

  // run through all our packages and push them to npm
  await publishAllPackagesToNpm(newVersion, 'dev');
}

main();
