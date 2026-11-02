const { generateImageAsync } = require('@expo/image-utils');
const {
  AndroidConfig,
  withAndroidColors,
  withAndroidManifest,
  withDangerousMod,
} = require('expo/config-plugins');

const {
  addMetaDataItemToMainApplication,
  getMainApplicationOrThrow,
} = AndroidConfig.Manifest;

const META_DATA_FCM_NOTIFICATION_ICON = 'com.google.firebase.messaging.default_notification_icon';
const META_DATA_FCM_NOTIFICATION_ICON_COLOR =
  'com.google.firebase.messaging.default_notification_color';
const fs = require('fs');
const path = require('path');

const ANDROID_RES_PATH = 'android/app/src/main/res/';
const NOTIFICATION_ICON = 'notification_icon';
const NOTIFICATION_ICON_COLOR = 'notification_icon_color';
const BASELINE_PIXEL_SIZE = 24;
const DPI_VALUES = {
  mdpi: { folderName: 'drawable-mdpi', scale: 1 },
  hdpi: { folderName: 'drawable-hdpi', scale: 1.5 },
  xhdpi: { folderName: 'drawable-xhdpi', scale: 2 },
  xxhdpi: { folderName: 'drawable-xxhdpi', scale: 3 },
  xxxhdpi: { folderName: 'drawable-xxxhdpi', scale: 4 },
};

function withNotificationIconColor(config, color) {
  return withAndroidColors(config, (config) => {
    config.modResults = AndroidConfig.Colors.assignColorValue(config.modResults, {
      name: NOTIFICATION_ICON_COLOR,
      value: color,
    });
    return config;
  });
}

async function writeNotificationIconImageFilesAsync(icon, projectRoot) {
  await Promise.all(
    Object.values(DPI_VALUES).map(async ({ folderName, scale }) => {
      const dpiFolderPath = path.resolve(projectRoot, ANDROID_RES_PATH, folderName);

      if (!fs.existsSync(dpiFolderPath)) {
        fs.mkdirSync(dpiFolderPath, { recursive: true });
      }

      const iconSizePx = BASELINE_PIXEL_SIZE * scale;
      const resizedIcon = (
        await generateImageAsync({ projectRoot, cacheType: 'android-notification' }, {
          src: icon,
          width: iconSizePx,
          height: iconSizePx,
          resizeMode: 'cover',
          backgroundColor: 'transparent',
        })
      ).source;

      fs.writeFileSync(
        path.resolve(dpiFolderPath, `${NOTIFICATION_ICON}.png`),
        resizedIcon,
      );
    }),
  );
}

function withNotificationIcons(config, icon) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      if (icon) {
        await writeNotificationIconImageFilesAsync(icon, config.modRequest.projectRoot);
      }
      return config;
    },
  ]);
}

function withNotificationManifest(config, { icon, color }) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    manifest.manifest.$ = {
      ...manifest.manifest.$,
      'xmlns:tools': 'http://schemas.android.com/tools',
    };

    const mainApplication = getMainApplicationOrThrow(manifest);

    if (icon) {
      addMetaDataItemToMainApplication(
        mainApplication,
        META_DATA_FCM_NOTIFICATION_ICON,
        `@drawable/${NOTIFICATION_ICON}`,
        'resource',
      );
    }

    if (color) {
      addMetaDataItemToMainApplication(
        mainApplication,
        META_DATA_FCM_NOTIFICATION_ICON_COLOR,
        `@color/${NOTIFICATION_ICON_COLOR}`,
        'resource',
      );

      const colorMetaData = mainApplication['meta-data']?.find(
        (item) => item.$['android:name'] === META_DATA_FCM_NOTIFICATION_ICON_COLOR,
      );
      if (colorMetaData) {
        colorMetaData.$['tools:replace'] = 'android:resource';
      }
    }

    return config;
  });
}

function withAndroidFcmNotifications(config, props = {}) {
  const icon = props.icon ?? null;
  const color = props.color ?? null;

  if (color) {
    config = withNotificationIconColor(config, color);
  }

  if (icon) {
    config = withNotificationIcons(config, icon);
  }

  if (icon || color) {
    config = withNotificationManifest(config, { icon, color });
  }

  return config;
}

module.exports = withAndroidFcmNotifications;
