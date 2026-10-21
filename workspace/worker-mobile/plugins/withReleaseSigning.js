/**
 * Signs release builds with the Play upload key instead of the debug key.
 *
 * android/ is regenerated from app.json, so the signing block is written here
 * rather than by hand. The key and its passwords never enter the repo: they
 * come from Gradle properties (~/.gradle/gradle.properties) named
 * LOCALWORK_<APP>_UPLOAD_STORE_FILE / _STORE_PASSWORD / _KEY_ALIAS / _KEY_PASSWORD.
 * Without them a release build still falls back to the debug key, so local
 * `npm run apk` keeps working on any machine.
 */
const { withAppBuildGradle } = require('@expo/config-plugins')

module.exports = function withReleaseSigning(config, { prefix }) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents
    if (gradle.includes('// localwork-release-signing')) return cfg
    const p = (k) => `${prefix}_UPLOAD_${k}`
    gradle = gradle.replace(
      /signingConfigs \{\n(\s*)debug \{/,
      (m, indent) => `signingConfigs {\n${indent}// localwork-release-signing\n${indent}release {\n`
        + `${indent}    if (project.hasProperty('${p('STORE_FILE')}')) {\n`
        + `${indent}        storeFile file(project.property('${p('STORE_FILE')}'))\n`
        + `${indent}        storePassword project.property('${p('STORE_PASSWORD')}')\n`
        + `${indent}        keyAlias project.property('${p('KEY_ALIAS')}')\n`
        + `${indent}        keyPassword project.property('${p('KEY_PASSWORD')}')\n`
        + `${indent}    }\n${indent}}\n${indent}debug {`,
    )
    // In the release build type only: use the upload key when it is configured.
    gradle = gradle.replace(
      /(release \{[^{}]*?)signingConfig signingConfigs\.debug/,
      `$1signingConfig project.hasProperty('${p('STORE_FILE')}') ? signingConfigs.release : signingConfigs.debug`,
    )
    cfg.modResults.contents = gradle
    return cfg
  })
}
