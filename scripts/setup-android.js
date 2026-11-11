const fs = require("fs")
const path = require("path")
const os = require("os")
const { execSync } = require("child_process")

// Common Android SDK paths by platform
const commonPaths = {
  win32: [
    path.join(os.homedir(), "AppData", "Local", "Android", "Sdk"),
    "C:\\Android\\Sdk",
    "C:\\Program Files\\Android\\Sdk",
    "C:\\Program Files (x86)\\Android\\Sdk",
  ],
  darwin: [
    path.join(os.homedir(), "Library", "Android", "sdk"),
    path.join(os.homedir(), "Android", "Sdk"),
    "/usr/local/android-sdk",
    "/opt/android-sdk",
  ],
  linux: [
    path.join(os.homedir(), "Android", "Sdk"),
    path.join(os.homedir(), ".android", "sdk"),
    "/usr/local/android-sdk",
    "/opt/android-sdk",
    "/usr/lib/android-sdk",
  ],
}

function findAndroidSdk() {
  const platform = os.platform()
  const paths = commonPaths[platform] || commonPaths.linux

  console.log(`🔍 Searching for Android SDK on ${platform}...`)

  for (const sdkPath of paths) {
    console.log(`   Checking: ${sdkPath}`)

    if (fs.existsSync(sdkPath)) {
      const adbPath = path.join(sdkPath, "platform-tools", platform === "win32" ? "adb.exe" : "adb")

      if (fs.existsSync(adbPath)) {
        console.log(`✅ Found Android SDK at: ${sdkPath}`)
        return sdkPath
      }
    }
  }

  return null
}

function checkAdbInPath() {
  try {
    const adbVersion = execSync("adb version", { encoding: "utf8" })
    console.log("✅ ADB found in system PATH")
    console.log(`   Version: ${adbVersion.split("\n")[0]}`)
    return true
  } catch (error) {
    return false
  }
}

function updateEnvFile(androidHome) {
  const envPath = ".env.local"
  let envContent = ""

  // Read existing .env.local if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8")
  }

  // Remove existing ANDROID_HOME if present
  envContent = envContent.replace(/^ANDROID_HOME=.*$/m, "")

  // Add new ANDROID_HOME
  envContent += `\nANDROID_HOME=${androidHome}\n`

  // Clean up extra newlines
  envContent = envContent.replace(/\n+/g, "\n").trim() + "\n"

  fs.writeFileSync(envPath, envContent)
  console.log(`📝 Updated ${envPath} with ANDROID_HOME=${androidHome}`)
}

function testAdbConnection() {
  try {
    console.log("\n🧪 Testing ADB connection...")
    const devices = execSync("adb devices", { encoding: "utf8" })
    console.log("✅ ADB is working!")
    console.log("Connected devices:")
    console.log(devices)

    if (devices.includes("device")) {
      console.log("🎉 Android devices detected and ready!")
    } else {
      console.log("⚠️  No devices connected. Connect your GrapheneOS device with USB debugging enabled.")
    }

    return true
  } catch (error) {
    console.log("❌ ADB test failed:", error.message)
    return false
  }
}

function installInstructions() {
  const platform = os.platform()

  console.log("\n📋 Android SDK Installation Instructions:")
  console.log("==========================================")

  if (platform === "darwin") {
    console.log("🍎 macOS:")
    console.log("   Option 1: Install Android Studio from https://developer.android.com/studio")
    console.log("   Option 2: Use Homebrew: brew install android-platform-tools")
  } else if (platform === "win32") {
    console.log("🪟 Windows:")
    console.log("   Option 1: Install Android Studio from https://developer.android.com/studio")
    console.log("   Option 2: Use Chocolatey: choco install adb")
    console.log("   Option 3: Download SDK Tools from https://developer.android.com/studio#command-tools")
  } else {
    console.log("🐧 Linux:")
    console.log("   Option 1: Install Android Studio from https://developer.android.com/studio")
    console.log("   Option 2: Package manager:")
    console.log("     Ubuntu/Debian: sudo apt install android-tools-adb android-tools-fastboot")
    console.log("     Fedora: sudo dnf install android-tools")
    console.log("     Arch: sudo pacman -S android-tools")
  }

  console.log("\n📱 Device Setup:")
  console.log("   1. Enable Developer Options on your GrapheneOS device")
  console.log("   2. Enable USB Debugging in Developer Options")
  console.log("   3. Connect device via USB")
  console.log("   4. Accept RSA key fingerprint when prompted")
  console.log("   5. Run: npm run dev")
}

// Main execution
async function main() {
  // Check if ADB is already in PATH
  if (checkAdbInPath()) {
    console.log("✅ ADB is already available in system PATH")
    testAdbConnection()
    return
  }

  // Try to find Android SDK
  const androidHome = findAndroidSdk()

  if (androidHome) {
    updateEnvFile(androidHome)

    // Add to PATH for this session
    const platform = os.platform()
    const platformTools = path.join(androidHome, "platform-tools")
    process.env.PATH = `${platformTools}${path.delimiter}${process.env.PATH}`

    console.log(`🔧 Added ${platformTools} to PATH for this session`)

    if (testAdbConnection()) {
      console.log("\n🎉 Setup complete! PhoneSuite is ready to use.")
      console.log("\n📋 Next steps:")
      console.log("   1. Connect your GrapheneOS device via USB")
      console.log("   2. Enable USB debugging")
      console.log("   3. Run: npm run dev")
      console.log("   4. Navigate to /phone-suite")
    }
  } else {
    console.log("❌ Android SDK not found in common locations")
    installInstructions()
  }
}

main().catch(console.error)
