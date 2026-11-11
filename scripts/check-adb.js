const { execSync } = require("child_process")

console.log("🔍 Checking ADB status...\n")

try {
  // Check ADB version
  const version = execSync("adb version", { encoding: "utf8" })
  console.log("✅ ADB is installed and accessible")
  console.log(`Version: ${version.split("\n")[0]}`)

  // Check connected devices
  console.log("\n📱 Checking connected devices...")
  const devices = execSync("adb devices -l", { encoding: "utf8" })
  console.log(devices)

  // Parse device list
  const lines = devices.split("\n").filter((line) => line.trim() && !line.includes("List of devices"))
  const connectedDevices = lines.filter((line) => line.includes("device"))

  if (connectedDevices.length > 0) {
    console.log(`🎉 Found ${connectedDevices.length} connected device(s)!`)

    // Check for GrapheneOS devices
    connectedDevices.forEach((device, index) => {
      const deviceId = device.split("\t")[0]
      try {
        const props = execSync(`adb -s ${deviceId} shell getprop ro.build.version.release`, { encoding: "utf8" })
        const model = execSync(`adb -s ${deviceId} shell getprop ro.product.model`, { encoding: "utf8" })
        console.log(`   Device ${index + 1}: ${model.trim()} (Android ${props.trim()})`)
      } catch (error) {
        console.log(`   Device ${index + 1}: ${deviceId} (Unable to get details)`)
      }
    })

    console.log("\n✅ PhoneSuite is ready to use!")
  } else {
    console.log("⚠️  No devices connected or authorized")
    console.log("\n📋 To connect a device:")
    console.log("   1. Enable Developer Options on your device")
    console.log("   2. Enable USB Debugging")
    console.log("   3. Connect via USB cable")
    console.log("   4. Accept RSA key fingerprint when prompted")
    console.log("   5. Run this check again: npm run check-adb")
  }
} catch (error) {
  console.log("❌ ADB not found or not working")
  console.log("Error:", error.message)
  console.log("\n🔧 Run setup first: npm run setup-android")
}
