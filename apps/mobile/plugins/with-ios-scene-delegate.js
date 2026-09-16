const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');
const semver = require('semver');

// Vendored from expo/config-plugins PR #326 (merged 2026-09-15), published as
// @config-plugins/expo-uiscene-lifecycle@0.1.0 but not yet on npm as of this
// writing. Once `npx expo install @config-plugins/expo-uiscene-lifecycle`
// resolves, delete this file, run `pnpm remove` on nothing (it was never a
// package dependency), and swap the app.config.ts plugin entry for the
// published package name.
// https://github.com/expo/expo/issues/46664
// https://github.com/expo/expo/pull/50191 (native ExpoAppSceneDelegate /
// ExpoReactNativeFactoryProvider backport, required: expo >=57.0.23 <58.0.0)
// https://github.com/expo/config-plugins/pull/326 (this plugin's source)
//
// This is Expo's own official (if still experimental) fix for the iOS 27
// UIScene lifecycle crash, replacing our earlier hand-rolled SceneDelegate.
// It's much thinner than that version: the scene delegate class itself
// (EXExpoAppSceneDelegate, Objective-C name for ExpoAppSceneDelegate) now
// ships natively in the `expo` package, so this plugin only has to make
// AppDelegate conform to ExpoReactNativeFactoryProvider and stop creating the
// window itself.

const PLUGIN_NAME = 'expo-uiscene-lifecycle';
const MINIMUM_EXPO_VERSION = '57.0.23';
const ORIGINAL_APP_DELEGATE = 'class AppDelegate: ExpoAppDelegate {';
const SCENE_APP_DELEGATE = 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {';
const FACTORY_ASSIGNMENT = '    reactNativeFactory = factory';
const LEGACY_STARTUP = `    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
`;
// Deviation from upstream: LEGACY_STARTUP alone only covers the inner
// window/startReactNative lines, not the `#if os(iOS) || os(tvOS)` /
// `#endif` guard the template wraps them in. Removing only the inner lines
// (as upstream does) leaves `#if os(iOS) || os(tvOS)#endif` glued onto one
// line — invalid Swift. Match and restore the whole guarded block instead.
const LEGACY_STARTUP_BLOCK = `#if os(iOS) || os(tvOS)\n${LEGACY_STARTUP}#endif\n`;

const SCENE_MANIFEST = {
  UIApplicationSupportsMultipleScenes: false,
  UISceneConfigurations: {
    UIWindowSceneSessionRoleApplication: [
      {
        UISceneConfigurationName: 'Default Configuration',
        UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
      },
    ],
  },
};

function assertSdk57(sdkVersion) {
  if (
    !sdkVersion ||
    semver.gt(MINIMUM_EXPO_VERSION, sdkVersion) ||
    semver.gte(sdkVersion, '58.0.0')
  ) {
    throw new Error(
      `${PLUGIN_NAME} supports Expo ${MINIMUM_EXPO_VERSION} through SDK 57 only (received ${JSON.stringify(sdkVersion ?? 'unknown')}).`,
    );
  }
}

function isOwnedManifest(manifest) {
  return JSON.stringify(manifest) === JSON.stringify(SCENE_MANIFEST);
}

function updateAppDelegate(contents, enabled) {
  const isEnabled = contents.includes(SCENE_APP_DELEGATE);

  if (enabled && isEnabled) {
    return contents;
  }
  if (!enabled && !isEnabled) {
    return contents;
  }

  if (enabled) {
    const startup = `\n${LEGACY_STARTUP_BLOCK}`;
    if (!contents.includes(ORIGINAL_APP_DELEGATE) || !contents.includes(startup)) {
      throw new Error(`${PLUGIN_NAME} requires the standard Expo SDK 57 Swift AppDelegate.`);
    }
    return contents.replace(ORIGINAL_APP_DELEGATE, SCENE_APP_DELEGATE).replace(startup, '\n');
  }

  return contents
    .replace(SCENE_APP_DELEGATE, ORIGINAL_APP_DELEGATE)
    .replace(`${FACTORY_ASSIGNMENT}\n\n`, `${FACTORY_ASSIGNMENT}\n\n${LEGACY_STARTUP_BLOCK}\n`);
}

const withExpoUIScene = (config, options) => {
  // Deviation from upstream: the original plugin asserts against
  // `config.sdkVersion`, but that field is always pinned to `<major>.0.0`
  // ("57.0.0") regardless of the installed npm patch, so a minimum version
  // like "57.0.23" can never pass — this makes the check against the
  // installed `expo` package version instead, which is what actually
  // determines whether ExpoAppSceneDelegate / ExpoReactNativeFactoryProvider
  // exist at build time.
  assertSdk57(require('expo/package.json').version);
  const enabled = options?.enabled !== false;

  config = withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      throw new Error(`${PLUGIN_NAME} requires the standard Expo SDK 57 Swift AppDelegate.`);
    }
    config.modResults.contents = updateAppDelegate(config.modResults.contents, enabled);
    return config;
  });

  return withInfoPlist(config, (config) => {
    const manifest = config.modResults.UIApplicationSceneManifest;
    if (enabled) {
      if (manifest !== undefined && !isOwnedManifest(manifest)) {
        throw new Error(
          `${PLUGIN_NAME} cannot enable because UIApplicationSceneManifest is already declared by the app.`,
        );
      }
      config.modResults.UIApplicationSceneManifest = SCENE_MANIFEST;
    } else if (isOwnedManifest(manifest)) {
      delete config.modResults.UIApplicationSceneManifest;
    }
    return config;
  });
};

module.exports = withExpoUIScene;
