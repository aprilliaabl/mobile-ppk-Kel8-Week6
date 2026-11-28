
const { withProjectBuildGradle } = require('expo/config-plugins');

module.exports = function withFirebaseBom(config, { bom }) {
  return withProjectBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    const marker = `// Firebase BoM override: ${bom}`;

    if (contents.includes(marker)) {
      return config;
    }

    const override = `${marker}
project.ext.set('react-native', [
  versions: [
    firebase: [
      bom: '${bom}'
    ]
  ]
])

`;

    const target = 'apply plugin: "expo-root-project"';

    if (!contents.includes(target)) {
      throw new Error(
        'Tidak menemukan apply plugin: "expo-root-project" pada android/build.gradle'
      );
    }

    config.modResults.contents = contents.replace(
      target,
      `${override}${target}`
    );

    return config;
  });
};
