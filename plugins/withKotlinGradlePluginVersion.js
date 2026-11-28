const { withProjectBuildGradle } = require('expo/config-plugins');

module.exports = function withKotlinGradlePluginVersion(config) {
  return withProjectBuildGradle(config, (config) => {
    const kotlinVersion = '2.3.0'; // Sesuaikan dengan versi di app.json

    let contents = config.modResults.contents;

    // Hapus deklarasi classpath Kotlin yang lama (jika ada)
    contents = contents.replace(
      /classpath\(["']org\.jetbrains\.kotlin:kotlin-gradle-plugin:[^"']+["']\)/g,
      ''
    );
    
    // Tambahkan classpath Kotlin baru di dalam blok buildscript
    // Cari baris classpath react-native-gradle-plugin sebagai jangkar
    const anchor = 'classpath("com.facebook.react:react-native-gradle-plugin")';
    if (contents.includes(anchor)) {
      contents = contents.replace(
        anchor,
        `${anchor}\n        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:${kotlinVersion}")`
      );
    } else {
      // Fallback: tambahkan di akhir blok dependencies buildscript
      contents = contents.replace(
        /dependencies\s*{/,
        `dependencies {\n        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:${kotlinVersion}")`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};