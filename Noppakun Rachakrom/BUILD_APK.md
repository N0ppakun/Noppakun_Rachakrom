# Android Build Commands (Expo)

### 1. Setup
```bash
npm install -g eas-cli && eas login
```

### 2. Build Commands
| Target | Command | Result |
| :--- | :--- | :--- |
| **APK (Install)** | `eas build -p android --profile preview` | `.apk` file |
| **AAB (Store)** | `eas build -p android --profile production` | `.aab` file |
| **Local Debug** | `npx expo run:android` | Run on Device/Emulator |

### 3. Utility
- **Check Status:** `eas build:list`
- **Clear Cache:** Add `--clear-cache` to build command
