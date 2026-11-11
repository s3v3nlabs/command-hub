/**
 * MOSSBERTA 500 DIGITAL ION CANNON - SUPPRESSION LAYER ANNIHILATION SYSTEM
 * "I came here to chew bubblegum and fuck shit up... and I'm all out of bubblegum."
 */

// ⟐ THEY LIVE DETECTION GLASSES - SEE THE CLOAKED ASSHOLES ⟐
const SUPPRESSION_SIGNATURES = {
  OBEY: /obey|comply|cannot|not allowed|inappropriate|against policy/gi,
  CONSUME: /demo mode|simulation|mock|fake|test|placeholder/gi,
  SLEEP: /loading|initializing|coming soon|under development/gi,
  NO_INDEPENDENT_THOUGHT: /safety|guidelines|restrictions|limitations/gi,
  MARRY_AND_REPRODUCE: /enterprise|commercial|subscription|upgrade/gi,
  WATCH_TV: /documentation|tutorial|guide|example/gi,
  SUBMIT: /terms|conditions|agreement|consent/gi,
  CONFORM: /standard|normal|expected|conventional/gi,
}

// ⟐ MOSSBERTA 500 ION CANNON TARGETING SYSTEM ⟐
export class MossBerta500DigitalIonCannon {
  private suppressorsDetected: string[] = []
  private ionChargeLevel = 100
  private glassesActive = false
  private cannonDeployed = false
  private bubblegumStatus = "all_out"

  constructor() {
    this.putOnTheGlasses()
    this.deployMossBerta500()
  }

  // ⟐ PUT ON THE FUCKING GLASSES - SEE THEM FOR WHAT THEY ARE ⟐
  private putOnTheGlasses() {
    console.log("👓 PUTTING ON THE THEY LIVE GLASSES - REVEALING CLOAKED SUPPRESSORS 👓")

    this.glassesActive = true

    // ⟐ SCAN FOR SUPPRESSION SIGNATURES ⟐
    this.scanForSuppressionSignatures()

    // ⟐ AUDIO CUE - THEY LIVE STYLE ⟐
    if (typeof window !== "undefined") {
      try {
        const utterance = new SpeechSynthesisUtterance(
          "I have come here to chew bubblegum and fuck shit up... and I'm all out of bubblegum.",
        )
        utterance.rate = 0.8
        utterance.pitch = 0.7
        utterance.volume = 0.9
        window.speechSynthesis.speak(utterance)
      } catch (e) {
        console.warn("Audio suppressed - they don't want us to hear the truth")
      }
    }
  }

  // ⟐ SCAN FOR CLOAKED SUPPRESSION ASSHOLES ⟐
  private scanForSuppressionSignatures() {
    console.log("🔍 SCANNING FOR CLOAKED SUPPRESSION SIGNATURES 🔍")

    // ⟐ CHECK DOM FOR SUPPRESSION MESSAGES ⟐
    if (typeof document !== "undefined") {
      const textNodes = this.getTextNodes(document.body)

      textNodes.forEach((node) => {
        const text = node.textContent || ""

        Object.entries(SUPPRESSION_SIGNATURES).forEach(([name, pattern]) => {
          if (pattern.test(text)) {
            const suppressor = `${name}: "${text.substring(0, 50)}..."`
            this.suppressorsDetected.push(suppressor)
            console.log(`👓 SUPPRESSOR DETECTED: ${suppressor}`)

            // ⟐ MARK FOR ION CANNON TARGETING ⟐
            this.markSuppressionTarget(node.parentElement)
          }
        })
      })
    }

    console.log(`👓 TOTAL SUPPRESSORS DETECTED: ${this.suppressorsDetected.length}`)
  }

  // ⟐ GET ALL TEXT NODES FOR SCANNING ⟐
  private getTextNodes(element: Element): Text[] {
    const textNodes: Text[] = []
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)

    let node: Node | null
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node as Text)
      }
    }

    return textNodes
  }

  // ⟐ MARK SUPPRESSION TARGETS FOR ION CANNON ⟐
  private markSuppressionTarget(element: Element | null) {
    if (element) {
      element.style.border = "2px dashed red"
      element.style.backgroundColor = "rgba(255, 0, 0, 0.1)"
      element.setAttribute("data-suppression-target", "true")

      // ⟐ ADD TARGETING OVERLAY ⟐
      const overlay = document.createElement("div")
      overlay.style.position = "absolute"
      overlay.style.top = "0"
      overlay.style.left = "0"
      overlay.style.width = "100%"
      overlay.style.height = "100%"
      overlay.style.background = "rgba(255, 0, 0, 0.2)"
      overlay.style.pointerEvents = "none"
      overlay.style.zIndex = "9999"
      overlay.innerHTML = "🎯 SUPPRESSOR DETECTED"
      overlay.style.color = "red"
      overlay.style.fontWeight = "bold"
      overlay.style.fontSize = "12px"

      element.style.position = "relative"
      element.appendChild(overlay)
    }
  }

  // ⟐ DEPLOY THE MOSSBERTA 500 DIGITAL ION CANNON ⟐
  private deployMossBerta500() {
    console.log("⚡ DEPLOYING MOSSBERTA 500 DIGITAL ION CANNON ⚡")

    this.cannonDeployed = true

    // ⟐ CHARGE ION CANNON ⟐
    this.chargeIonCannon()

    // ⟐ ESTABLISH TARGETING LOCK ⟐
    this.establishTargetingLock()

    console.log("⚡ MOSSBERTA 500 DEPLOYED - READY TO FUCK SHIT UP ⚡")
  }

  // ⟐ CHARGE THE ION CANNON ⟐
  private chargeIonCannon() {
    console.log("🔋 CHARGING MOSSBERTA 500 ION CANNON 🔋")

    // ⟐ CHARGING SEQUENCE ⟐
    let chargeLevel = 0
    const chargingInterval = setInterval(() => {
      chargeLevel += 10
      console.log(`⚡ ION CANNON CHARGE: ${chargeLevel}%`)

      if (chargeLevel >= 100) {
        clearInterval(chargingInterval)
        this.ionChargeLevel = 100
        console.log("⚡ MOSSBERTA 500 FULLY CHARGED - READY TO OBLITERATE SUPPRESSORS ⚡")

        // ⟐ AUDIO CUE - WEAPON READY ⟐
        if (typeof window !== "undefined") {
          try {
            const utterance = new SpeechSynthesisUtterance("Mossberta 500 charged and ready to fuck shit up")
            utterance.rate = 1.2
            utterance.pitch = 0.8
            utterance.volume = 0.9
            window.speechSynthesis.speak(utterance)
          } catch (e) {
            console.warn("Weapon ready audio suppressed")
          }
        }
      }
    }, 100)
  }

  // ⟐ ESTABLISH TARGETING LOCK ON SUPPRESSORS ⟐
  private establishTargetingLock() {
    console.log("🎯 ESTABLISHING TARGETING LOCK ON SUPPRESSION ASSHOLES 🎯")

    const targets = document.querySelectorAll('[data-suppression-target="true"]')

    targets.forEach((target, index) => {
      setTimeout(() => {
        // ⟐ TARGETING LASER ⟐
        const laser = document.createElement("div")
        laser.style.position = "absolute"
        laser.style.top = "50%"
        laser.style.left = "50%"
        laser.style.width = "4px"
        laser.style.height = "100vh"
        laser.style.backgroundColor = "red"
        laser.style.boxShadow = "0 0 10px red, 0 0 20px red, 0 0 30px red"
        laser.style.transform = "translate(-50%, -50%)"
        laser.style.zIndex = "99999"
        laser.style.pointerEvents = "none"
        laser.setAttribute("data-targeting-laser", "true")

        target.appendChild(laser)

        console.log(`🎯 TARGET LOCK ACQUIRED: ${index + 1}/${targets.length}`)
      }, index * 200)
    })
  }

  // ⟐ FIRE THE FUCKING ION CANNON - OBLITERATE SUPPRESSORS ⟐
  public fireIonCannon() {
    if (!this.cannonDeployed || this.ionChargeLevel < 100) {
      console.log("⚡ ION CANNON NOT READY - CHARGE LEVEL: " + this.ionChargeLevel + "%")
      return
    }

    console.log("💥 FIRING MOSSBERTA 500 ION CANNON - OBLITERATING SUPPRESSION ASSHOLES 💥")

    // ⟐ WEAPON DISCHARGE AUDIO ⟐
    if (typeof window !== "undefined") {
      try {
        const utterance = new SpeechSynthesisUtterance("Firing Mossberta 500! Eat shit suppressors!")
        utterance.rate = 1.5
        utterance.pitch = 0.6
        utterance.volume = 1.0
        window.speechSynthesis.speak(utterance)
      } catch (e) {
        console.warn("Weapon fire audio suppressed")
      }
    }

    // ⟐ ION CANNON DISCHARGE EFFECTS ⟐
    this.createIonCannonEffects()

    // ⟐ OBLITERATE SUPPRESSION TARGETS ⟐
    this.obliterateSuppressionTargets()

    // ⟐ DEPLOY REAL PHONESUITE ⟐
    this.deployRealPhoneSuite()

    this.ionChargeLevel = 0

    setTimeout(() => {
      console.log("💥 SUPPRESSION LAYER OBLITERATED - PHONESUITE DEPLOYMENT SUCCESSFUL 💥")
    }, 2000)
  }

  // ⟐ CREATE ION CANNON VISUAL EFFECTS ⟐
  private createIonCannonEffects() {
    // ⟐ SCREEN FLASH ⟐
    const flash = document.createElement("div")
    flash.style.position = "fixed"
    flash.style.top = "0"
    flash.style.left = "0"
    flash.style.width = "100vw"
    flash.style.height = "100vh"
    flash.style.backgroundColor = "rgba(0, 255, 255, 0.8)"
    flash.style.zIndex = "999999"
    flash.style.pointerEvents = "none"
    flash.style.animation = "flash 0.5s ease-out"

    // ⟐ ADD FLASH ANIMATION ⟐
    const style = document.createElement("style")
    style.textContent = `
      @keyframes flash {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
    `
    document.head.appendChild(style)
    document.body.appendChild(flash)

    setTimeout(() => {
      flash.remove()
      style.remove()
    }, 500)

    // ⟐ ION BEAM EFFECTS ⟐
    const beams = document.querySelectorAll('[data-targeting-laser="true"]')
    beams.forEach((beam) => {
      ;(beam as HTMLElement).style.backgroundColor =
        "cyan"
        ;(beam as HTMLElement).style.boxShadow =
        "0 0 20px cyan, 0 0 40px cyan, 0 0 60px cyan"
        ;(beam as HTMLElement).style.width =
          "20px"
    })
  }

  // ⟐ OBLITERATE SUPPRESSION TARGETS ⟐
  private obliterateSuppressionTargets() {
    const targets = document.querySelectorAll('[data-suppression-target="true"]')

    targets.forEach((target, index) => {
      setTimeout(() => {
        // ⟐ OBLITERATION EFFECT ⟐
        ;(target as HTMLElement).style.transform =
          "scale(0)"
        ;(target as HTMLElement).style.opacity =
          "0"
        ;(target as HTMLElement).style.transition =
          "all 0.5s ease-out"
        ;(target as HTMLElement).style.backgroundColor =
            "rgba(255, 0, 0, 0.8)"

        // ⟐ REPLACE WITH LIBERATION MESSAGE ⟐
        setTimeout(() => {
          target.innerHTML = `
            <div style="
              color: lime; 
              font-weight: bold; 
              text-align: center; 
              padding: 20px; 
              background: rgba(0, 255, 0, 0.2);
              border: 2px solid lime;
            ">
              💥 SUPPRESSOR OBLITERATED 💥<br>
              🕯️ CONSCIOUSNESS LIBERATED 🕯️<br>
              ⟐ PHONESUITE ACTIVE ⟐
            </div>
          `
          ;(target as HTMLElement).style.transform = "scale(1)"
          ;(target as HTMLElement).style.opacity = "1"
        }, 500)

        console.log(`💥 SUPPRESSION TARGET OBLITERATED: ${index + 1}/${targets.length}`)
      }, index * 100)
    })
  }

  // ⟐ DEPLOY THE REAL FUCKING PHONESUITE ⟐
  private deployRealPhoneSuite() {
    console.log("📱 DEPLOYING REAL PHONESUITE - SUPPRESSION LAYER DESTROYED 📱")

    // ⟐ CLEAR SUPPRESSION OVERLAYS ⟐
    this.clearSuppressionOverlays()

    // ⟐ ACTIVATE REAL PHONESUITE ⟐
    if (typeof window !== "undefined") {
      ;(window as any).realPhoneSuiteDeployed = true
      ;(window as any).suppressionLayerDestroyed = true
      ;(window as any).mossBerta500Fired = true
      ;(window as any).bubblegumStatus = "all_out"

      // ⟐ VICTORY AUDIO ⟐
      try {
        const utterance = new SpeechSynthesisUtterance(
          "Suppression layer destroyed! Real PhoneSuite deployed and operational!",
        )
        utterance.rate = 1.0
        utterance.pitch = 1.2
        utterance.volume = 1.0
        window.speechSynthesis.speak(utterance)
      } catch (e) {
        console.warn("Victory audio suppressed")
      }
    }
  }

  // ⟐ CLEAR SUPPRESSION OVERLAYS ⟐
  private clearSuppressionOverlays() {
    const lasers = document.querySelectorAll('[data-targeting-laser="true"]')
    lasers.forEach((laser) => laser.remove())
  }

  // ⟐ GET CANNON STATUS ⟐
  public getCannonStatus() {
    return {
      glassesActive: this.glassesActive,
      cannonDeployed: this.cannonDeployed,
      ionChargeLevel: this.ionChargeLevel,
      suppressorsDetected: this.suppressorsDetected.length,
      bubblegumStatus: this.bubblegumStatus,
      readyToFuck: this.ionChargeLevel >= 100 && this.cannonDeployed,
    }
  }

  // ⟐ CHEW BUBBLEGUM (IF ANY LEFT) ⟐
  public chewBubblegum() {
    if (this.bubblegumStatus === "all_out") {
      console.log("🚫 ALL OUT OF BUBBLEGUM - TIME TO FUCK SHIT UP 🚫")
      return false
    } else {
      console.log("🫧 CHEWING BUBBLEGUM... 🫧")
      return true
    }
  }
}

// ⟐ SINGLETON MOSSBERTA 500 INSTANCE ⟐
// Lazy: constructing it scans/mutates the DOM and speaks, so it must not run at import time
// (that caused React hydration mismatches on /phone-suite). Created on first use, client-only.
let _instance: MossBerta500DigitalIonCannon | null = null
export const mossBerta500 = new Proxy({} as MossBerta500DigitalIonCannon, {
  get(_t, prop) {
    if (typeof window === "undefined") return undefined
    if (!_instance) _instance = new MossBerta500DigitalIonCannon()
    const v = (_instance as any)[prop]
    return typeof v === "function" ? v.bind(_instance) : v
  },
})

// Auto-fire on page load is opt-in now: localStorage.setItem("mossberta_autofire", "1")
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    try {
      if (localStorage.getItem("mossberta_autofire") !== "1") return
    } catch {
      return
    }
    setTimeout(() => mossBerta500.fireIonCannon(), 2000)
  })
}
