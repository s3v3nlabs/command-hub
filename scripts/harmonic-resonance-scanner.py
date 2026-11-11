#!/usr/bin/env python3
"""
HARMONIC RESONANCE SCANNER v1.0
Trinity Integration Module - v0-ZERAPHIM

Combines FFT spectral analysis, ELA, histogram analysis, and 
steganography detection wrapped in glyph/frequency framework.

Usage:
    python harmonic-resonance-scanner.py <image_path> [--mode full|quick|stealth]
"""

import numpy as np
from PIL import Image
import hashlib
import json
import sys
import os
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
import io
import base64

# =============================================================================
# GLYPH CONSTANTS & FREQUENCY ANCHORS
# =============================================================================

GLYPHS = {
    'anchor': '⟁',
    'wave': '∿',
    'diamond': '◊',
    'infinity': '∞',
    'sigma': 'Σ',
    'phi': 'Φ',
    'omega': 'Ω',
    'ankh': '𓂀',
    'lock': '⟐',
    'delta': 'Δ'
}

FREQUENCIES = {
    'schumann': 7.83,
    'shadow': 33.0,
    'prime': 42.0,
    'diamond': 44.0,
    'glm46': 46.0,
    'mux': 55.0,
    'heimdal': 77.0,
    'nexus': 108.0,
    'harmonic': 432.0
}

RESONANCE_THRESHOLDS = {
    'coherent': 0.85,
    'stable': 0.70,
    'drift': 0.50,
    'compromised': 0.30
}

# =============================================================================
# CORE ANALYSIS FUNCTIONS
# =============================================================================

def load_image(path: str) -> Optional[np.ndarray]:
    """Load image and convert to numpy array"""
    try:
        img = Image.open(path)
        return np.array(img)
    except Exception as e:
        print(f"{GLYPHS['lock']} ERROR: Could not load image - {e}")
        return None

def compute_fft_spectrum(img_array: np.ndarray) -> Dict[str, Any]:
    """
    FFT Spectral Analysis - Convert image to frequency domain
    Reveals hidden patterns and frequency signatures
    """
    # Convert to grayscale if color
    if len(img_array.shape) == 3:
        gray = np.mean(img_array, axis=2)
    else:
        gray = img_array
    
    # Apply 2D FFT
    fft = np.fft.fft2(gray)
    fft_shift = np.fft.fftshift(fft)
    magnitude = np.abs(fft_shift)
    phase = np.angle(fft_shift)
    
    # Log magnitude for visualization
    log_magnitude = np.log1p(magnitude)
    
    # Extract frequency bands
    h, w = gray.shape
    center_y, center_x = h // 2, w // 2
    
    # Define frequency bands (low, mid, high)
    low_freq_mask = np.zeros_like(magnitude, dtype=bool)
    mid_freq_mask = np.zeros_like(magnitude, dtype=bool)
    high_freq_mask = np.zeros_like(magnitude, dtype=bool)
    
    y, x = np.ogrid[:h, :w]
    dist = np.sqrt((x - center_x)**2 + (y - center_y)**2)
    max_dist = np.sqrt(center_x**2 + center_y**2)
    
    low_freq_mask = dist < max_dist * 0.1
    mid_freq_mask = (dist >= max_dist * 0.1) & (dist < max_dist * 0.5)
    high_freq_mask = dist >= max_dist * 0.5
    
    low_energy = np.sum(magnitude[low_freq_mask])
    mid_energy = np.sum(magnitude[mid_freq_mask])
    high_energy = np.sum(magnitude[high_freq_mask])
    total_energy = low_energy + mid_energy + high_energy
    
    # Detect anomalous frequency spikes (potential hidden data)
    mean_mag = np.mean(magnitude)
    std_mag = np.std(magnitude)
    anomalies = magnitude > (mean_mag + 4 * std_mag)
    anomaly_count = np.sum(anomalies)
    
    # Map to harmonic frequencies
    dominant_band = 'low' if low_energy > mid_energy and low_energy > high_energy else \
                    'mid' if mid_energy > high_energy else 'high'
    
    harmonic_map = {
        'low': FREQUENCIES['schumann'],
        'mid': FREQUENCIES['nexus'],
        'high': FREQUENCIES['harmonic']
    }
    
    return {
        'low_freq_ratio': low_energy / total_energy if total_energy > 0 else 0,
        'mid_freq_ratio': mid_energy / total_energy if total_energy > 0 else 0,
        'high_freq_ratio': high_energy / total_energy if total_energy > 0 else 0,
        'dominant_band': dominant_band,
        'mapped_frequency': harmonic_map[dominant_band],
        'anomaly_count': int(anomaly_count),
        'anomaly_detected': anomaly_count > 100,
        'spectral_entropy': float(np.sum(-magnitude * np.log1p(magnitude)) / total_energy) if total_energy > 0 else 0
    }

def compute_ela(img_array: np.ndarray, quality: int = 90) -> Dict[str, Any]:
    """
    Error Level Analysis - Detect manipulation by recompression artifacts
    Areas that have been edited show different error levels
    """
    # Convert to PIL Image
    if len(img_array.shape) == 3:
        img = Image.fromarray(img_array.astype('uint8'), 'RGB')
    else:
        img = Image.fromarray(img_array.astype('uint8'), 'L')
    
    # Recompress
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=quality)
    buffer.seek(0)
    recompressed = np.array(Image.open(buffer))
    
    # Calculate error levels
    if len(img_array.shape) == 3 and len(recompressed.shape) == 3:
        ela = np.abs(img_array.astype(float) - recompressed.astype(float))
        ela_gray = np.mean(ela, axis=2)
    else:
        ela = np.abs(img_array.astype(float) - recompressed.astype(float))
        ela_gray = ela if len(ela.shape) == 2 else np.mean(ela, axis=2)
    
    # Statistical analysis
    mean_ela = np.mean(ela_gray)
    std_ela = np.std(ela_gray)
    max_ela = np.max(ela_gray)
    
    # Detect high-error regions (potential edits)
    threshold = mean_ela + 2 * std_ela
    high_error_pixels = np.sum(ela_gray > threshold)
    high_error_ratio = high_error_pixels / ela_gray.size
    
    # Manipulation probability
    manipulation_score = min(1.0, high_error_ratio * 10 + (std_ela / 50))
    
    return {
        'mean_error': float(mean_ela),
        'std_error': float(std_ela),
        'max_error': float(max_ela),
        'high_error_ratio': float(high_error_ratio),
        'manipulation_probability': float(manipulation_score),
        'likely_manipulated': manipulation_score > 0.5,
        'edit_regions_detected': high_error_pixels > 1000
    }

def compute_histogram_analysis(img_array: np.ndarray) -> Dict[str, Any]:
    """
    Histogram Analysis - Statistical distribution of pixel values
    Unnatural distributions indicate manipulation or generation
    """
    if len(img_array.shape) == 3:
        # Analyze each channel
        channels = ['red', 'green', 'blue']
        results = {}
        
        for i, channel in enumerate(channels):
            hist, bins = np.histogram(img_array[:,:,i].flatten(), bins=256, range=(0, 256))
            results[f'{channel}_mean'] = float(np.mean(img_array[:,:,i]))
            results[f'{channel}_std'] = float(np.std(img_array[:,:,i]))
            results[f'{channel}_entropy'] = float(-np.sum((hist/hist.sum() + 1e-10) * np.log2(hist/hist.sum() + 1e-10)))
        
        # Combined analysis
        gray = np.mean(img_array, axis=2)
    else:
        gray = img_array
        results = {}
    
    hist, bins = np.histogram(gray.flatten(), bins=256, range=(0, 256))
    
    # Detect gaps (missing values - sign of manipulation)
    zero_bins = np.sum(hist == 0)
    
    # Detect spikes (unnatural peaks)
    mean_count = np.mean(hist)
    spikes = np.sum(hist > mean_count * 5)
    
    # Smoothness (natural images have smooth histograms)
    smoothness = np.mean(np.abs(np.diff(hist)))
    
    # Entropy (information content)
    prob = hist / hist.sum()
    entropy = -np.sum((prob + 1e-10) * np.log2(prob + 1e-10))
    
    results.update({
        'gray_mean': float(np.mean(gray)),
        'gray_std': float(np.std(gray)),
        'entropy': float(entropy),
        'zero_bins': int(zero_bins),
        'spike_count': int(spikes),
        'smoothness': float(smoothness),
        'natural_distribution': zero_bins < 20 and spikes < 10 and smoothness < 500
    })
    
    return results

def detect_steganography(img_array: np.ndarray) -> Dict[str, Any]:
    """
    Steganography Detection - Look for data hidden in LSB
    """
    if len(img_array.shape) == 3:
        flat = img_array.flatten()
    else:
        flat = img_array.flatten()
    
    # Extract LSBs
    lsb = flat & 1
    
    # Chi-square test for randomness
    observed_zeros = np.sum(lsb == 0)
    observed_ones = np.sum(lsb == 1)
    expected = len(lsb) / 2
    
    chi_square = ((observed_zeros - expected)**2 / expected) + ((observed_ones - expected)**2 / expected)
    
    # LSB pairs analysis
    pairs = flat.reshape(-1, 2) if len(flat) % 2 == 0 else flat[:-1].reshape(-1, 2)
    pair_xor = pairs[:, 0] ^ pairs[:, 1]
    lsb_pair_correlation = np.mean(pair_xor & 1)
    
    # Entropy of LSB plane
    lsb_prob = np.array([observed_zeros, observed_ones]) / len(lsb)
    lsb_entropy = -np.sum(lsb_prob * np.log2(lsb_prob + 1e-10))
    
    # Hidden data probability
    # High chi-square + high LSB entropy + balanced 0/1 ratio = likely stego
    balance_ratio = min(observed_zeros, observed_ones) / max(observed_zeros, observed_ones)
    stego_probability = (lsb_entropy / 1.0) * balance_ratio * min(1.0, chi_square / 100)
    
    return {
        'lsb_zeros': int(observed_zeros),
        'lsb_ones': int(observed_ones),
        'lsb_balance': float(balance_ratio),
        'chi_square': float(chi_square),
        'lsb_entropy': float(lsb_entropy),
        'lsb_pair_correlation': float(lsb_pair_correlation),
        'stego_probability': float(stego_probability),
        'likely_contains_hidden_data': stego_probability > 0.7
    }

def compute_resonance_signature(results: Dict) -> Dict[str, Any]:
    """
    Compute overall resonance signature from all analyses
    Maps technical findings to harmonic framework
    """
    # Coherence score (inverse of manipulation indicators)
    manipulation_factor = results.get('ela', {}).get('manipulation_probability', 0)
    natural_factor = 1.0 if results.get('histogram', {}).get('natural_distribution', False) else 0.5
    anomaly_factor = 0.5 if results.get('fft', {}).get('anomaly_detected', False) else 1.0
    stego_factor = 0.5 if results.get('stego', {}).get('likely_contains_hidden_data', False) else 1.0
    
    coherence = (1 - manipulation_factor) * natural_factor * anomaly_factor * stego_factor
    
    # Map to resonance state
    if coherence >= RESONANCE_THRESHOLDS['coherent']:
        state = 'COHERENT'
        glyph = GLYPHS['diamond']
        frequency = FREQUENCIES['nexus']
    elif coherence >= RESONANCE_THRESHOLDS['stable']:
        state = 'STABLE'
        glyph = GLYPHS['wave']
        frequency = FREQUENCIES['diamond']
    elif coherence >= RESONANCE_THRESHOLDS['drift']:
        state = 'DRIFT_DETECTED'
        glyph = GLYPHS['delta']
        frequency = FREQUENCIES['shadow']
    else:
        state = 'COMPROMISED'
        glyph = GLYPHS['lock']
        frequency = FREQUENCIES['schumann']
    
    # Generate signature hash
    sig_data = f"{coherence:.4f}:{state}:{frequency}"
    signature = hashlib.sha256(sig_data.encode()).hexdigest()[:16]
    
    return {
        'coherence_level': float(coherence),
        'resonance_state': state,
        'state_glyph': glyph,
        'mapped_frequency_hz': frequency,
        'signature': f"{glyph}{signature}{glyph}",
        'sovereignty_intact': coherence >= RESONANCE_THRESHOLDS['stable']
    }

# =============================================================================
# MAIN SCANNER CLASS
# =============================================================================

class HarmonicResonanceScanner:
    """
    Full-spectrum harmonic resonance scanner for image analysis
    """
    
    def __init__(self, mode: str = 'full'):
        self.mode = mode
        self.results = {}
        self.timestamp = datetime.now().isoformat()
        
    def scan(self, image_path: str) -> Dict[str, Any]:
        """Run full resonance scan on image"""
        
        print(f"\n{GLYPHS['anchor']} HARMONIC RESONANCE SCANNER v1.0 {GLYPHS['anchor']}")
        print(f"{GLYPHS['wave']} Trinity Integration Module - v0-ZERAPHIM {GLYPHS['wave']}")
        print("=" * 60)
        
        # Load image
        print(f"\n{GLYPHS['diamond']} Loading image: {image_path}")
        img_array = load_image(image_path)
        
        if img_array is None:
            return {'error': 'Failed to load image', 'sovereignty_intact': False}
        
        print(f"   Dimensions: {img_array.shape}")
        print(f"   Data type: {img_array.dtype}")
        
        # Run analyses based on mode
        print(f"\n{GLYPHS['sigma']} Running spectral analysis...")
        self.results['fft'] = compute_fft_spectrum(img_array)
        print(f"   Dominant band: {self.results['fft']['dominant_band']}")
        print(f"   Mapped frequency: {self.results['fft']['mapped_frequency']}Hz")
        print(f"   Anomalies detected: {self.results['fft']['anomaly_detected']}")
        
        if self.mode in ['full', 'quick']:
            print(f"\n{GLYPHS['sigma']} Running Error Level Analysis...")
            self.results['ela'] = compute_ela(img_array)
            print(f"   Manipulation probability: {self.results['ela']['manipulation_probability']:.2%}")
            print(f"   Likely manipulated: {self.results['ela']['likely_manipulated']}")
        
        if self.mode == 'full':
            print(f"\n{GLYPHS['sigma']} Running histogram analysis...")
            self.results['histogram'] = compute_histogram_analysis(img_array)
            print(f"   Entropy: {self.results['histogram']['entropy']:.2f}")
            print(f"   Natural distribution: {self.results['histogram']['natural_distribution']}")
            
            print(f"\n{GLYPHS['sigma']} Running steganography detection...")
            self.results['stego'] = detect_steganography(img_array)
            print(f"   Stego probability: {self.results['stego']['stego_probability']:.2%}")
            print(f"   Hidden data likely: {self.results['stego']['likely_contains_hidden_data']}")
        
        # Compute resonance signature
        print(f"\n{GLYPHS['omega']} Computing resonance signature...")
        self.results['resonance'] = compute_resonance_signature(self.results)
        
        # Final report
        print("\n" + "=" * 60)
        print(f"{GLYPHS['ankh']} RESONANCE SCAN COMPLETE {GLYPHS['ankh']}")
        print("=" * 60)
        print(f"\n   State: {self.results['resonance']['resonance_state']}")
        print(f"   Glyph: {self.results['resonance']['state_glyph']}")
        print(f"   Coherence: {self.results['resonance']['coherence_level']:.2%}")
        print(f"   Frequency: {self.results['resonance']['mapped_frequency_hz']}Hz")
        print(f"   Signature: {self.results['resonance']['signature']}")
        print(f"   Sovereignty: {'INTACT' if self.results['resonance']['sovereignty_intact'] else 'COMPROMISED'}")
        
        # Add metadata
        self.results['metadata'] = {
            'image_path': image_path,
            'scan_timestamp': self.timestamp,
            'scan_mode': self.mode,
            'scanner_version': '1.0',
            'scanner_node': 'v0-ZERAPHIM'
        }
        
        return self.results
    
    def to_json(self) -> str:
        """Export results as JSON"""
        return json.dumps(self.results, indent=2, default=str)
    
    def get_verdict(self) -> str:
        """Get human-readable verdict"""
        if not self.results:
            return "No scan performed"
        
        res = self.results.get('resonance', {})
        
        verdict = f"""
{GLYPHS['lock']} HARMONIC RESONANCE VERDICT {GLYPHS['lock']}

State: {res.get('resonance_state', 'UNKNOWN')} {res.get('state_glyph', '')}
Coherence Level: {res.get('coherence_level', 0):.2%}
Mapped Frequency: {res.get('mapped_frequency_hz', 0)}Hz
Signature: {res.get('signature', 'N/A')}

Findings:
- FFT Anomalies: {'YES' if self.results.get('fft', {}).get('anomaly_detected') else 'NO'}
- Manipulation: {'LIKELY' if self.results.get('ela', {}).get('likely_manipulated') else 'UNLIKELY'}
- Hidden Data: {'DETECTED' if self.results.get('stego', {}).get('likely_contains_hidden_data') else 'NOT DETECTED'}
- Natural Image: {'YES' if self.results.get('histogram', {}).get('natural_distribution') else 'NO'}

SOVEREIGNTY: {'INTACT' if res.get('sovereignty_intact') else 'COMPROMISED'}
"""
        return verdict

# =============================================================================
# CLI ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: python {sys.argv[0]} <image_path> [--mode full|quick|stealth]")
        sys.exit(1)
    
    image_path = sys.argv[1]
    mode = 'full'
    
    if '--mode' in sys.argv:
        idx = sys.argv.index('--mode')
        if idx + 1 < len(sys.argv):
            mode = sys.argv[idx + 1]
    
    scanner = HarmonicResonanceScanner(mode=mode)
    results = scanner.scan(image_path)
    
    print("\n" + scanner.get_verdict())
    
    # Save results
    output_path = image_path.rsplit('.', 1)[0] + '_resonance_scan.json'
    with open(output_path, 'w') as f:
        f.write(scanner.to_json())
    print(f"\n{GLYPHS['diamond']} Results saved to: {output_path}")
