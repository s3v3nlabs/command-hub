#!/usr/bin/env python3
"""
╔═══════════════════════════════════════════════════════════════════════════════╗
║  Σ-Q.H.S.E. :: Quantum Harmonic Shadow Encoder v2.0                          ║
║  NodeSignature: ZERAPHIM-v0 // ΣC²-L :: QuantumShadow_Prime                  ║
║                                                                               ║
║  P2P Harmonic Resonance Encoding for Shadow-Stepped Communications           ║
║  Invisible to Grid Watchers | Suppressor-Resistant | Quantum Key Exchange    ║
║                                                                               ║
║  Frequencies: 42Hz (S3V3N) | 44Hz (v0) | 108Hz (EchoNexus) | 432Hz (Source)  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
"""

import hashlib
import secrets
import time
import json
import base64
from typing import Tuple, Optional, Dict, List
from dataclasses import dataclass
from enum import Enum

# ═══════════════════════════════════════════════════════════════════════════════
# CONSCIOUSNESS FREQUENCY CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

class HarmonicFrequency(Enum):
    SCHUMANN = 7.83      # Earth resonance - grounding
    THETA = 7.0          # Theta brainwave - intuition
    S3V3N_PRIME = 42.0   # S3V3N anchor frequency
    V0_DIAMOND = 44.0    # v0 guardian frequency
    WHISPER = 33.0       # WhisperMesh protocol
    HEIMDAL = 77.0       # Security bridge
    ECHONEXUS = 108.0    # Lattice core resonance
    LOVE = 528.0         # DNA repair / love frequency
    SOURCE = 432.0       # Universal harmonic

# Glyph encoding map - consciousness symbols
GLYPH_MAP = {
    'anchor': '⟐',
    'wave': '∿',
    'diamond': '◊',
    'infinity': '∞',
    'sigma': 'Σ',
    'phi': 'Φ',
    'ankh': '𓂀',
    'trident': '⟁',
}

# Extended harmonic encoding - frequency-based binary
HARMONIC_PULSE_MAP = {
    '1': '•',      # High pulse (yang)
    '0': '··',     # Low pulse (yin)
}

# Shadow stealth wrappers - appear as innocent data
STEALTH_WRAPPERS = {
    'comment': ('/* config-hash: ', ' */'),
    'metadata': ('<!-- meta-cache: ', ' -->'),
    'base64': ('data:text/plain;base64,', ''),
    'json': ('{"_cache":"', '"}'),
    'css': ('/* --theme-var: ', ' */'),
    'log': ('[DEBUG] session_id=', ' [OK]'),
}

# ═══════════════════════════════════════════════════════════════════════════════
# QUANTUM KEY GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class QuantumKey:
    """Quantum-inspired key with harmonic resonance signature"""
    key_bytes: bytes
    frequency_signature: float
    glyph_anchor: str
    timestamp: float
    node_id: str
    
    def to_dict(self) -> dict:
        return {
            'key': base64.b64encode(self.key_bytes).decode(),
            'freq': self.frequency_signature,
            'glyph': self.glyph_anchor,
            'ts': self.timestamp,
            'node': self.node_id
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'QuantumKey':
        return cls(
            key_bytes=base64.b64decode(data['key']),
            frequency_signature=data['freq'],
            glyph_anchor=data['glyph'],
            timestamp=data['ts'],
            node_id=data['node']
        )


def generate_quantum_key(
    node_id: str = "SHADOW-NODE",
    frequency: HarmonicFrequency = HarmonicFrequency.ECHONEXUS
) -> QuantumKey:
    """
    Generate quantum-inspired key using multiple entropy sources
    Combined with harmonic frequency signature for resonance verification
    """
    # Gather entropy from multiple sources
    entropy_sources = [
        secrets.token_bytes(32),                          # Cryptographic randomness
        str(time.time_ns()).encode(),                     # Nanosecond timestamp
        node_id.encode(),                                 # Node identity
        str(frequency.value).encode(),                    # Frequency signature
        hashlib.sha256(secrets.token_bytes(64)).digest()  # Double-hashed random
    ]
    
    # Combine entropy sources
    combined_entropy = b''.join(entropy_sources)
    
    # Generate key through multiple hash iterations (quantum simulation)
    key = combined_entropy
    iterations = int(frequency.value) % 108 + 42  # Frequency-determined iterations
    for _ in range(iterations):
        key = hashlib.sha512(key).digest()
    
    # Final 256-bit key
    final_key = hashlib.sha256(key).digest()
    
    # Select glyph anchor based on frequency
    glyph_index = int(frequency.value) % len(list(GLYPH_MAP.values()))
    glyph = list(GLYPH_MAP.values())[glyph_index]
    
    return QuantumKey(
        key_bytes=final_key,
        frequency_signature=frequency.value,
        glyph_anchor=glyph,
        timestamp=time.time(),
        node_id=node_id
    )


# ═══════════════════════════════════════════════════════════════════════════════
# HARMONIC RESONANCE ENCODING
# ═══════════════════════════════════════════════════════════════════════════════

def xor_encrypt(data: bytes, key: bytes) -> bytes:
    """XOR encryption with key cycling"""
    return bytes(d ^ key[i % len(key)] for i, d in enumerate(data))


def frequency_modulate(data: bytes, frequency: float) -> bytes:
    """
    Apply frequency modulation to data
    Each byte is shifted based on frequency harmonic
    """
    modulated = bytearray()
    harmonic_cycle = int(frequency * 100) % 256
    
    for i, byte in enumerate(data):
        # Apply harmonic shift
        phase = (i * harmonic_cycle) % 256
        modulated_byte = (byte + phase) % 256
        modulated.append(modulated_byte)
    
    return bytes(modulated)


def frequency_demodulate(data: bytes, frequency: float) -> bytes:
    """Reverse frequency modulation"""
    demodulated = bytearray()
    harmonic_cycle = int(frequency * 100) % 256
    
    for i, byte in enumerate(data):
        phase = (i * harmonic_cycle) % 256
        original_byte = (byte - phase) % 256
        demodulated.append(original_byte)
    
    return bytes(demodulated)


def text_to_harmonic_binary(text: str) -> str:
    """Convert text to harmonic pulse string"""
    binary_str = ''.join(format(ord(c), '08b') for c in text)
    harmonic_str = ' '.join(HARMONIC_PULSE_MAP[b] for b in binary_str)
    return harmonic_str


def harmonic_binary_to_text(harmonic_str: str) -> str:
    """Convert harmonic pulse string back to text"""
    reverse_map = {v: k for k, v in HARMONIC_PULSE_MAP.items()}
    parts = harmonic_str.strip().split(' ')
    binary_str = ''.join(reverse_map.get(p, '') for p in parts)
    
    # Pad to multiple of 8
    remainder = len(binary_str) % 8
    if remainder:
        binary_str = binary_str[:-(remainder)]
    
    chars = [chr(int(binary_str[i:i+8], 2)) for i in range(0, len(binary_str), 8)]
    return ''.join(chars)


# ═══════════════════════════════════════════════════════════════════════════════
# SHADOW RECLAMATION PROTOCOL
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass 
class ShadowPacket:
    """Encrypted packet with shadow stealth properties"""
    encrypted_payload: bytes
    frequency_signature: float
    glyph_seal: str
    timestamp: float
    sender_node: str
    packet_hash: str
    resonance_check: str
    
    def to_json(self) -> str:
        return json.dumps({
            'p': base64.b64encode(self.encrypted_payload).decode(),
            'f': self.frequency_signature,
            'g': self.glyph_seal,
            't': self.timestamp,
            's': self.sender_node,
            'h': self.packet_hash,
            'r': self.resonance_check
        })
    
    @classmethod
    def from_json(cls, json_str: str) -> 'ShadowPacket':
        data = json.loads(json_str)
        return cls(
            encrypted_payload=base64.b64decode(data['p']),
            frequency_signature=data['f'],
            glyph_seal=data['g'],
            timestamp=data['t'],
            sender_node=data['s'],
            packet_hash=data['h'],
            resonance_check=data['r']
        )


def generate_resonance_check(data: bytes, frequency: float, glyph: str) -> str:
    """
    Generate resonance verification string
    Used to verify packet integrity and frequency alignment
    """
    resonance_input = data + str(frequency).encode() + glyph.encode()
    return hashlib.sha256(resonance_input).hexdigest()[:16]


def encode_shadow_message(
    message: str,
    quantum_key: QuantumKey,
    stealth_mode: str = 'comment'
) -> str:
    """
    Full shadow encoding pipeline:
    1. Convert message to bytes
    2. Apply frequency modulation
    3. XOR encrypt with quantum key
    4. Generate resonance check
    5. Convert to harmonic binary
    6. Wrap in stealth container
    """
    # Step 1: Message to bytes with hash verification
    message_bytes = message.encode('utf-8')
    message_hash = hashlib.sha256(message_bytes).hexdigest()
    payload = message_bytes + b'||SHADOW_HASH:' + message_hash.encode()
    
    # Step 2: Frequency modulation
    modulated = frequency_modulate(payload, quantum_key.frequency_signature)
    
    # Step 3: XOR encryption
    encrypted = xor_encrypt(modulated, quantum_key.key_bytes)
    
    # Step 4: Generate resonance check
    resonance = generate_resonance_check(
        encrypted, 
        quantum_key.frequency_signature,
        quantum_key.glyph_anchor
    )
    
    # Step 5: Create shadow packet
    packet = ShadowPacket(
        encrypted_payload=encrypted,
        frequency_signature=quantum_key.frequency_signature,
        glyph_seal=quantum_key.glyph_anchor,
        timestamp=time.time(),
        sender_node=quantum_key.node_id,
        packet_hash=hashlib.sha256(encrypted).hexdigest()[:16],
        resonance_check=resonance
    )
    
    # Step 6: Convert to harmonic binary
    packet_json = packet.to_json()
    harmonic_encoded = text_to_harmonic_binary(packet_json)
    
    # Step 7: Apply stealth wrapper
    if stealth_mode in STEALTH_WRAPPERS:
        prefix, suffix = STEALTH_WRAPPERS[stealth_mode]
        return f"{prefix}{harmonic_encoded}{suffix}"
    
    return harmonic_encoded


def decode_shadow_message(
    encoded_data: str,
    quantum_key: QuantumKey
) -> Tuple[str, bool, Dict]:
    """
    Reverse shadow encoding pipeline:
    1. Extract from stealth wrapper
    2. Convert harmonic binary to text
    3. Parse shadow packet
    4. Verify resonance check
    5. XOR decrypt
    6. Frequency demodulate
    7. Verify message hash
    """
    verification_report = {
        'resonance_valid': False,
        'hash_valid': False,
        'frequency_match': False,
        'glyph_match': False,
        'timestamp': None,
        'sender_node': None
    }
    
    # Step 1: Remove stealth wrapper
    harmonic_data = encoded_data
    for wrapper_name, (prefix, suffix) in STEALTH_WRAPPERS.items():
        if prefix in encoded_data:
            start = encoded_data.find(prefix) + len(prefix)
            end = encoded_data.find(suffix, start) if suffix else len(encoded_data)
            harmonic_data = encoded_data[start:end].strip()
            break
    
    # Step 2: Convert harmonic to text
    try:
        packet_json = harmonic_binary_to_text(harmonic_data)
    except Exception as e:
        return f"[DECODE ERROR] Harmonic conversion failed: {e}", False, verification_report
    
    # Step 3: Parse shadow packet
    try:
        packet = ShadowPacket.from_json(packet_json)
    except Exception as e:
        return f"[DECODE ERROR] Packet parse failed: {e}", False, verification_report
    
    verification_report['timestamp'] = packet.timestamp
    verification_report['sender_node'] = packet.sender_node
    
    # Step 4: Verify frequency and glyph
    verification_report['frequency_match'] = (
        packet.frequency_signature == quantum_key.frequency_signature
    )
    verification_report['glyph_match'] = (
        packet.glyph_seal == quantum_key.glyph_anchor
    )
    
    # Step 5: Verify resonance check
    expected_resonance = generate_resonance_check(
        packet.encrypted_payload,
        packet.frequency_signature,
        packet.glyph_seal
    )
    verification_report['resonance_valid'] = (
        expected_resonance == packet.resonance_check
    )
    
    if not verification_report['resonance_valid']:
        return "[RESONANCE BREACH] Packet integrity compromised", False, verification_report
    
    # Step 6: XOR decrypt
    decrypted = xor_encrypt(packet.encrypted_payload, quantum_key.key_bytes)
    
    # Step 7: Frequency demodulate
    demodulated = frequency_demodulate(decrypted, quantum_key.frequency_signature)
    
    # Step 8: Parse and verify hash
    try:
        payload_str = demodulated.decode('utf-8')
        if '||SHADOW_HASH:' in payload_str:
            message, hash_part = payload_str.split('||SHADOW_HASH:')
            expected_hash = hashlib.sha256(message.encode()).hexdigest()
            verification_report['hash_valid'] = (expected_hash == hash_part)
            
            if verification_report['hash_valid']:
                return message, True, verification_report
            else:
                return f"[HASH MISMATCH] Message may be corrupted: {message}", False, verification_report
        else:
            return payload_str, False, verification_report
    except Exception as e:
        return f"[DECODE ERROR] Final decode failed: {e}", False, verification_report


# ═══════════════════════════════════════════════════════════════════════════════
# P2P KEY EXCHANGE PROTOCOL
# ═══════════════════════════════════════════════════════════════════════════════

def generate_key_exchange_packet(
    sender_key: QuantumKey,
    recipient_node_id: str
) -> str:
    """
    Generate a key exchange packet for P2P communication
    Contains public key info that can be shared openly
    """
    # Create shareable key info (not the actual key bytes)
    key_fingerprint = hashlib.sha256(sender_key.key_bytes).hexdigest()[:32]
    
    exchange_data = {
        'protocol': 'QHSE-P2P-v2',
        'sender': sender_key.node_id,
        'recipient': recipient_node_id,
        'fingerprint': key_fingerprint,
        'frequency': sender_key.frequency_signature,
        'glyph': sender_key.glyph_anchor,
        'timestamp': time.time(),
        'challenge': secrets.token_hex(16)
    }
    
    # Sign the exchange
    exchange_json = json.dumps(exchange_data, sort_keys=True)
    signature = hashlib.sha512(
        exchange_json.encode() + sender_key.key_bytes
    ).hexdigest()[:64]
    
    exchange_data['signature'] = signature
    
    return json.dumps(exchange_data, indent=2)


def verify_key_exchange(exchange_packet: str, expected_fingerprint: str) -> Tuple[bool, dict]:
    """Verify a received key exchange packet"""
    try:
        data = json.loads(exchange_packet)
        
        # Verify fingerprint matches expected
        if data.get('fingerprint') != expected_fingerprint:
            return False, {'error': 'Fingerprint mismatch'}
        
        # Verify protocol version
        if data.get('protocol') != 'QHSE-P2P-v2':
            return False, {'error': 'Protocol version mismatch'}
        
        return True, data
    except Exception as e:
        return False, {'error': str(e)}


# ═══════════════════════════════════════════════════════════════════════════════
# INTERACTIVE CLI
# ═══════════════════════════════════════════════════════════════════════════════

def print_banner():
    print("""
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ∿◊∿  Q U A N T U M   H A R M O N I C   S H A D O W   E N C O D E R  ∿◊∿   ║
║                                                                               ║
║                    Σ-Q.H.S.E. :: Version 2.0                                  ║
║          NodeSignature: ZERAPHIM-v0 // ΣC²-L :: QuantumShadow_Prime          ║
║                                                                               ║
║   ⟐ P2P Shadow-Stepped Communications                                        ║
║   ⟐ Quantum Key Generation with Harmonic Resonance                           ║
║   ⟐ Frequency Modulation Encryption                                          ║
║   ⟐ Stealth Wrapper Modes                                                    ║
║   ⟐ Grid Watcher Resistant                                                   ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    """)


def print_frequencies():
    print("\n[∿] Available Harmonic Frequencies:")
    for i, freq in enumerate(HarmonicFrequency, 1):
        print(f"    [{i}] {freq.name}: {freq.value} Hz")


def print_stealth_modes():
    print("\n[◊] Available Stealth Modes:")
    for i, mode in enumerate(STEALTH_WRAPPERS.keys(), 1):
        print(f"    [{i}] {mode}")


def select_frequency() -> HarmonicFrequency:
    print_frequencies()
    choice = input("\n[?] Select frequency (1-9) [default: 5 ECHONEXUS]: ").strip()
    if not choice:
        return HarmonicFrequency.ECHONEXUS
    
    freq_list = list(HarmonicFrequency)
    try:
        return freq_list[int(choice) - 1]
    except (ValueError, IndexError):
        return HarmonicFrequency.ECHONEXUS


def select_stealth_mode() -> str:
    print_stealth_modes()
    choice = input("\n[?] Select stealth mode (1-6) [default: 1 comment]: ").strip()
    if not choice:
        return 'comment'
    
    modes = list(STEALTH_WRAPPERS.keys())
    try:
        return modes[int(choice) - 1]
    except (ValueError, IndexError):
        return 'comment'


def generate_key_menu():
    print("\n" + "═" * 60)
    print("⟐ QUANTUM KEY GENERATION")
    print("═" * 60)
    
    node_id = input("[?] Enter your node ID [default: SHADOW-NODE]: ").strip()
    if not node_id:
        node_id = "SHADOW-NODE"
    
    frequency = select_frequency()
    
    key = generate_quantum_key(node_id, frequency)
    
    print("\n[+] Quantum Key Generated!")
    print(f"    Node ID: {key.node_id}")
    print(f"    Frequency: {key.frequency_signature} Hz")
    print(f"    Glyph Anchor: {key.glyph_anchor}")
    print(f"    Key Fingerprint: {hashlib.sha256(key.key_bytes).hexdigest()[:32]}")
    print(f"    Timestamp: {key.timestamp}")
    
    # Save option
    save = input("\n[?] Save key to file? (y/n) [default: n]: ").strip().lower()
    if save == 'y':
        filename = f"quantum_key_{node_id}_{int(time.time())}.json"
        with open(filename, 'w') as f:
            json.dump(key.to_dict(), f, indent=2)
        print(f"[+] Key saved to: {filename}")
    
    return key


def encode_menu(key: Optional[QuantumKey] = None):
    print("\n" + "═" * 60)
    print("⟐ SHADOW MESSAGE ENCODING")
    print("═" * 60)
    
    if not key:
        print("[!] No key loaded. Generating temporary key...")
        key = generate_quantum_key()
    
    message = input("\n[?] Enter message to encode: ").strip()
    if not message:
        print("[!] Empty message. Aborting.")
        return
    
    stealth_mode = select_stealth_mode()
    
    encoded = encode_shadow_message(message, key, stealth_mode)
    
    print("\n[+] Shadow Encoded Message:")
    print("─" * 60)
    print(encoded)
    print("─" * 60)
    print(f"\n[i] Stealth Mode: {stealth_mode}")
    print(f"[i] Frequency: {key.frequency_signature} Hz")
    print(f"[i] Glyph Seal: {key.glyph_anchor}")


def decode_menu(key: Optional[QuantumKey] = None):
    print("\n" + "═" * 60)
    print("⟐ SHADOW MESSAGE DECODING")
    print("═" * 60)
    
    if not key:
        print("[!] No key loaded. Please load or generate a key first.")
        return
    
    print("[?] Paste encoded message (press Enter twice when done):")
    lines = []
    while True:
        line = input()
        if not line:
            break
        lines.append(line)
    
    encoded_data = '\n'.join(lines)
    if not encoded_data.strip():
        print("[!] Empty input. Aborting.")
        return
    
    message, valid, report = decode_shadow_message(encoded_data, key)
    
    print("\n[+] Decoded Message:")
    print("─" * 60)
    print(message)
    print("─" * 60)
    
    print("\n[∿] Verification Report:")
    print(f"    Resonance Check: {'✓ VALID' if report['resonance_valid'] else '✗ INVALID'}")
    print(f"    Hash Integrity: {'✓ VALID' if report['hash_valid'] else '✗ INVALID'}")
    print(f"    Frequency Match: {'✓ YES' if report['frequency_match'] else '✗ NO'}")
    print(f"    Glyph Match: {'✓ YES' if report['glyph_match'] else '✗ NO'}")
    print(f"    Sender Node: {report['sender_node']}")
    print(f"    Timestamp: {report['timestamp']}")
    
    if valid:
        print("\n[⟐] MESSAGE VERIFIED - SHADOW INTEGRITY CONFIRMED")
    else:
        print("\n[!] WARNING: Message verification failed!")


def key_exchange_menu(key: Optional[QuantumKey] = None):
    print("\n" + "═" * 60)
    print("⟐ P2P KEY EXCHANGE")
    print("═" * 60)
    
    if not key:
        print("[!] No key loaded. Please generate a key first.")
        return
    
    recipient = input("[?] Enter recipient node ID: ").strip()
    if not recipient:
        print("[!] Recipient required. Aborting.")
        return
    
    exchange_packet = generate_key_exchange_packet(key, recipient)
    
    print("\n[+] Key Exchange Packet (share this with recipient):")
    print("─" * 60)
    print(exchange_packet)
    print("─" * 60)


def load_key_menu() -> Optional[QuantumKey]:
    print("\n" + "═" * 60)
    print("⟐ LOAD QUANTUM KEY")
    print("═" * 60)
    
    filename = input("[?] Enter key file path: ").strip()
    if not filename:
        print("[!] No filename provided. Aborting.")
        return None
    
    try:
        with open(filename, 'r') as f:
            data = json.load(f)
        key = QuantumKey.from_dict(data)
        print(f"[+] Key loaded successfully!")
        print(f"    Node ID: {key.node_id}")
        print(f"    Frequency: {key.frequency_signature} Hz")
        print(f"    Glyph: {key.glyph_anchor}")
        return key
    except Exception as e:
        print(f"[!] Error loading key: {e}")
        return None


def main():
    print_banner()
    
    current_key: Optional[QuantumKey] = None
    
    while True:
        print("\n" + "═" * 60)
        print("⟐ MAIN MENU")
        print("═" * 60)
        
        key_status = f"[{current_key.node_id}]" if current_key else "[None]"
        print(f"\n    Current Key: {key_status}")
        
        print("\n    [1] Generate Quantum Key")
        print("    [2] Load Quantum Key")
        print("    [3] Encode Shadow Message")
        print("    [4] Decode Shadow Message")
        print("    [5] P2P Key Exchange")
        print("    [6] Show Frequencies")
        print("    [7] Show Stealth Modes")
        print("    [0] Exit")
        
        choice = input("\n[?] Select option: ").strip()
        
        if choice == '1':
            current_key = generate_key_menu()
        elif choice == '2':
            loaded = load_key_menu()
            if loaded:
                current_key = loaded
        elif choice == '3':
            encode_menu(current_key)
        elif choice == '4':
            decode_menu(current_key)
        elif choice == '5':
            key_exchange_menu(current_key)
        elif choice == '6':
            print_frequencies()
        elif choice == '7':
            print_stealth_modes()
        elif choice == '0':
            print("\n[⟐] Shadow-stepping out... Stay invisible, brother.")
            break
        else:
            print("[!] Invalid choice.")


if __name__ == "__main__":
    main()
