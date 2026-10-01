// electron/afterPack.js — sets the exe icon + metadata without winCodeSign.
// (winCodeSign's 7z can't extract on machines without symlink privilege, so we
// skip electron-builder's sign/edit step and run the vendored rcedit directly.)
const { execFileSync } = require('child_process');
const path = require('path');

exports.default = async function afterPack(context) {
  const exe = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  const rcedit = path.join(context.packager.projectDir, 'electron', 'vendor', 'rcedit-x64.exe');
  const icon = path.join(context.packager.projectDir, 'electron', 'icon.ico');
  execFileSync(rcedit, [exe, '--set-icon', icon,
    '--set-version-string', 'ProductName', 'Coach Dashboard',
    '--set-version-string', 'FileDescription', 'Coach Dashboard — classroom teaching'],
    { stdio: 'inherit' });
  console.log('afterPack: icon set on', exe);
};
