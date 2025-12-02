module.exports = {
  appId: 'com.wetdreamboy.simplemusic',
  productName: 'Simple Music',
  directories: {
    output: 'release'
  },
  files: [
    'dist/**/*',
    'dist-electron/**/*',
    'package.json'
  ],
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'arm64']
      },
      {
        target: '7z',
        arch: ['x64', 'arm64']
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'public/icon.ico',
    artifactName: '${name}-${version}-${arch}.${ext}'
  },
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'public/icon.icns',
    category: 'public.app-category.music',
    artifactName: '${name}-${version}-${arch}.${ext}'
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64', 'arm64', 'armv7l']
      },
      {
        target: 'rpm',
        arch: ['x64']
      },
      {
        target: 'pacman',
        arch: ['x64']
      },
      {
        target: 'tar.gz',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'public/icon.png',
    category: 'Audio',
    artifactName: '${name}_${version}_${arch}.${ext}'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    artifactName: '${name}-${version}-${arch}-Setup.${ext}'
  },
  publish: null
}

