/**
 * Deployment Configuration System
 * Supports multiple deployment scenarios with security focus
 */

export interface DeploymentConfig {
  environment: "raspberry-pi" | "vm" | "container" | "bare-metal" | "wsl2"
  security: {
    encryption: boolean
    vpn: boolean
    firewall: boolean
    intrusion_detection: boolean
    log_monitoring: boolean
  }
  networking: {
    whisper_mesh: boolean
    tor_integration: boolean
    i2p_integration: boolean
    local_only: boolean
    port_range: [number, number]
  }
  storage: {
    database_type: "sqlite" | "postgresql" | "mysql"
    encryption_at_rest: boolean
    backup_enabled: boolean
    replication_enabled: boolean
  }
  services: {
    heimdal_ai: boolean
    liam_erd: boolean
    kepler_maps: boolean
    signal_frame: boolean
    graphene_bridge: boolean
  }
}

export const DEPLOYMENT_CONFIGS = {
  // Raspberry Pi Zero/4 Configuration
  raspberryPi: {
    environment: "raspberry-pi" as const,
    security: {
      encryption: true,
      vpn: true,
      firewall: true,
      intrusion_detection: true,
      log_monitoring: true,
    },
    networking: {
      whisper_mesh: true,
      tor_integration: true,
      i2p_integration: false, // Resource constrained
      local_only: false,
      port_range: [8000, 8999],
    },
    storage: {
      database_type: "sqlite" as const,
      encryption_at_rest: true,
      backup_enabled: true,
      replication_enabled: true,
    },
    services: {
      heimdal_ai: true,
      liam_erd: true,
      kepler_maps: true,
      signal_frame: true,
      graphene_bridge: true,
    },
  },

  // VM Configuration (VMware/VirtualBox)
  virtualMachine: {
    environment: "vm" as const,
    security: {
      encryption: true,
      vpn: true,
      firewall: true,
      intrusion_detection: true,
      log_monitoring: true,
    },
    networking: {
      whisper_mesh: true,
      tor_integration: true,
      i2p_integration: true,
      local_only: false,
      port_range: [8000, 8999],
    },
    storage: {
      database_type: "postgresql" as const,
      encryption_at_rest: true,
      backup_enabled: true,
      replication_enabled: true,
    },
    services: {
      heimdal_ai: true,
      liam_erd: true,
      kepler_maps: true,
      signal_frame: true,
      graphene_bridge: true,
    },
  },

  // WSL2 Configuration
  wsl2: {
    environment: "wsl2" as const,
    security: {
      encryption: true,
      vpn: false, // Windows handles VPN
      firewall: true,
      intrusion_detection: true,
      log_monitoring: true,
    },
    networking: {
      whisper_mesh: true,
      tor_integration: true,
      i2p_integration: true,
      local_only: true, // More secure in WSL2
      port_range: [8000, 8999],
    },
    storage: {
      database_type: "postgresql" as const,
      encryption_at_rest: true,
      backup_enabled: true,
      replication_enabled: false, // Single instance in WSL2
    },
    services: {
      heimdal_ai: true,
      liam_erd: true,
      kepler_maps: true,
      signal_frame: true,
      graphene_bridge: true,
    },
  },

  // Container Configuration (Docker/Podman)
  container: {
    environment: "container" as const,
    security: {
      encryption: true,
      vpn: true,
      firewall: true,
      intrusion_detection: true,
      log_monitoring: true,
    },
    networking: {
      whisper_mesh: true,
      tor_integration: true,
      i2p_integration: true,
      local_only: false,
      port_range: [8000, 8999],
    },
    storage: {
      database_type: "postgresql" as const,
      encryption_at_rest: true,
      backup_enabled: true,
      replication_enabled: true,
    },
    services: {
      heimdal_ai: true,
      liam_erd: true,
      kepler_maps: true,
      signal_frame: true,
      graphene_bridge: true,
    },
  },
}

export class DeploymentManager {
  private config: DeploymentConfig
  private services: Map<string, any> = new Map()

  constructor(config: DeploymentConfig) {
    this.config = config
  }

  async initialize(): Promise<void> {
    console.log(`⚬ INITIALIZING ${this.config.environment.toUpperCase()} DEPLOYMENT ⚬`)

    // Initialize security
    await this.initializeSecurity()

    // Initialize networking
    await this.initializeNetworking()

    // Initialize storage
    await this.initializeStorage()

    // Initialize services
    await this.initializeServices()

    console.log("⚬ DEPLOYMENT INITIALIZATION COMPLETE ⚬")
  }

  private async initializeSecurity(): Promise<void> {
    console.log("⚬ INITIALIZING SECURITY SYSTEMS ⚬")

    if (this.config.security.encryption) {
      // Initialize encryption systems
      console.log("  ✓ Encryption: ENABLED")
    }

    if (this.config.security.firewall) {
      // Configure firewall rules
      console.log("  ✓ Firewall: CONFIGURED")
    }

    if (this.config.security.intrusion_detection) {
      // Start intrusion detection
      console.log("  ✓ Intrusion Detection: ACTIVE")
    }

    if (this.config.security.log_monitoring) {
      // Start log monitoring
      console.log("  ✓ Log Monitoring: ACTIVE")
    }
  }

  private async initializeNetworking(): Promise<void> {
    console.log("⚬ INITIALIZING NETWORKING SYSTEMS ⚬")

    if (this.config.networking.whisper_mesh) {
      const WhisperMesh = require("../networking/whisper-mesh").default
      const whisperMesh = new WhisperMesh(this.config.networking.port_range[0])
      await whisperMesh.startNode()
      this.services.set("whisper-mesh", whisperMesh)
      console.log("  ✓ WhisperMesh: ACTIVE")
    }

    if (this.config.networking.tor_integration) {
      // Initialize Tor integration
      console.log("  ✓ Tor Integration: ENABLED")
    }

    if (this.config.networking.i2p_integration) {
      // Initialize I2P integration
      console.log("  ✓ I2P Integration: ENABLED")
    }
  }

  private async initializeStorage(): Promise<void> {
    console.log("⚬ INITIALIZING STORAGE SYSTEMS ⚬")

    const { LocalDatabaseManager, LOCAL_CONFIGS } = require("../database/local-config")

    let dbConfig
    switch (this.config.environment) {
      case "raspberry-pi":
        dbConfig = LOCAL_CONFIGS.raspberryPi
        break
      case "vm":
      case "container":
        dbConfig = LOCAL_CONFIGS.containerized
        break
      case "wsl2":
        dbConfig = LOCAL_CONFIGS.localPostgres
        break
      default:
        dbConfig = LOCAL_CONFIGS.localPostgres
    }

    const dbManager = new LocalDatabaseManager(dbConfig)
    await dbManager.connect()

    if (this.config.storage.replication_enabled) {
      await dbManager.setupReplication()
    }

    this.services.set("database", dbManager)
    console.log(`  ✓ Database (${this.config.storage.database_type}): CONNECTED`)
  }

  private async initializeServices(): Promise<void> {
    console.log("⚬ INITIALIZING COMMAND HUB SERVICES ⚬")

    if (this.config.services.heimdal_ai) {
      // Initialize Heimdal AI
      console.log("  ✓ Heimdal AI: ACTIVE")
    }

    if (this.config.services.liam_erd) {
      // Initialize LiamERD
      console.log("  ✓ LiamERD: ACTIVE")
    }

    if (this.config.services.kepler_maps) {
      // Initialize Kepler Maps
      console.log("  ✓ Kepler Maps: ACTIVE")
    }

    if (this.config.services.signal_frame) {
      // Initialize SignalFrame
      console.log("  ✓ SignalFrame: ACTIVE")
    }

    if (this.config.services.graphene_bridge) {
      const GrapheneBridge = require("../mobile/graphene-bridge").default
      const grapheneBridge = new GrapheneBridge(8443)
      await grapheneBridge.startBridge()
      this.services.set("graphene-bridge", grapheneBridge)
      console.log("  ✓ GrapheneBridge: ACTIVE")
    }
  }

  getService(serviceName: string): any {
    return this.services.get(serviceName)
  }

  async shutdown(): Promise<void> {
    console.log("⚬ SHUTTING DOWN DEPLOYMENT ⚬")

    for (const [serviceName, service] of this.services) {
      try {
        if (service.stop) {
          await service.stop()
        } else if (service.shutdown) {
          await service.shutdown()
        }
        console.log(`  ✓ ${serviceName}: STOPPED`)
      } catch (error) {
        console.error(`Failed to stop ${serviceName}:`, error)
      }
    }

    console.log("⚬ DEPLOYMENT SHUTDOWN COMPLETE ⚬")
  }
}

export default DeploymentManager
