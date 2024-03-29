/* eslint-disable import/no-default-export, @typescript-eslint/no-var-requires */
import { writeFile } from 'fs';
import { getPackages } from './utils';

export async function setMetadata(dev = false) {
  const rootJson = require('../../package.json');
  const keysToCopy = [
    'version',
    'repository',
    'keywords',
    'author',
    'contributors',
    'license',
    'bugs',
    'homepage',
    // 'funding',
  ];

  const packages = getPackages();
  for (const pack of packages) {
    const packPath = `${pack.buildPath}/package.json`;
    const packPackage = require(packPath);

    // copy all meta data from the root package.json into all packages
    for (const key of keysToCopy) {
      packPackage[key] = rootJson[key];
    }

    if (dev) {
      packPackage.version = `${rootJson.version}-dev`;
    }

    // set all the packages peerDependencies to be the same as root package.json version
    for (const packageInfo of packages) {
      if (packPackage.peerDependencies[packageInfo.packageName]) {
        packPackage.peerDependencies[
          packageInfo.packageName
        ] = `^${rootJson.version} || ^${rootJson.version}-dev`;
      }
    }

    // save the package file after we have updated the keys and peerDependencies
    await writeFile(packPath, JSON.stringify(packPackage, null, 2), err => {
      if (err) {
        console.error('Write failed!');
      }
    });
  }

  console.log(`package version set to ${rootJson.version}`);
}
