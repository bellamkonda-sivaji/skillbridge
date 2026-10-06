const { withMainApplication } = require('@expo/config-plugins')

/**
 * Gives every HTTP request the app makes a User-Agent that names the app.
 *
 * OpenStreetMap's tile policy requires one, and answers anything it does not
 * recognise with a "blocked" image served as a normal 200. React Native's
 * `<Image source={{ headers }}>` does not reach the wire on Android - the
 * request still goes out as `okhttp/4.x` - so the header has to be set on the
 * OkHttp client itself, which is what this does.
 *
 * Image loading goes through the same OkHttp client as `fetch`, so overriding
 * the provider's factory covers the map tiles as well as the API.
 *
 * This lives as a config plugin because `android/` is generated and gitignored.
 * Editing the file directly would work until the next prebuild wiped it.
 */

const IMPORTS = `import com.facebook.react.modules.network.OkHttpClientProvider
import com.facebook.react.modules.network.OkHttpClientFactory
import okhttp3.OkHttpClient`

const factory = (userAgent) => `
/** Names this app on every outbound request. See withTileUserAgent.js. */
class UserAgentClientFactory : OkHttpClientFactory {
  override fun createNewNetworkModuleClient(): OkHttpClient =
    OkHttpClientProvider.createClientBuilder()
      .addInterceptor { chain ->
        chain.proceed(
          chain.request().newBuilder()
            .header("User-Agent", "${userAgent}")
            .build()
        )
      }
      .build()
}
`

module.exports = function withTileUserAgent(config, { userAgent } = {}) {
  if (!userAgent) throw new Error('withTileUserAgent needs a userAgent string')

  return withMainApplication(config, (cfg) => {
    let src = cfg.modResults.contents

    if (src.includes('UserAgentClientFactory')) return cfg

    src = src.replace(
      'import expo.modules.ApplicationLifecycleDispatcher',
      `${IMPORTS}\n\nimport expo.modules.ApplicationLifecycleDispatcher`,
    )

    // The factory has to be registered before anything can make a request, and
    // super.onCreate() is the first point where that is true.
    src = src.replace(
      '    super.onCreate()',
      '    super.onCreate()\n    OkHttpClientProvider.setOkHttpClientFactory(UserAgentClientFactory())',
    )

    src = src.replace(
      'class MainApplication : Application(), ReactApplication {',
      `${factory(userAgent)}\nclass MainApplication : Application(), ReactApplication {`,
    )

    cfg.modResults.contents = src
    return cfg
  })
}
