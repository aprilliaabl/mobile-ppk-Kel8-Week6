const { withProjectBuildGradle } = require('expo/config-plugins');

module.exports = function withKotlinGradlePluginVersion(config) {
  return withProjectBuildGradle(config, (config) => {
    const kotlinVersion = '2.2.20';
    // Tambahkan classpath plugin Kotlin secara paksa ke build.gradle di root
    if (!config.modResults.contents.includes('kotlin-gradle-plugin')) {
      config.modResults.contents = config.modResults.contents.replace(
        /classpath\("com\.facebook\.react-native:react-native-gradle-plugin"\)/,
        `classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:${kotlinVersion}")`
      );
    }
    return config;
  });
};