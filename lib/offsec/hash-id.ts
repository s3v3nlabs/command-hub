/** Offline hash identification by length + charset + structure. Heuristic, like hashid/name-that-hash. */

export interface HashGuess {
  name: string
  hashcat?: string
  john?: string
  confidence: "high" | "medium" | "low"
}

const HEX = /^[a-f0-9]+$/i
const B64 = /^[A-Za-z0-9+/=]+$/

export function identifyHash(raw: string): HashGuess[] {
  const h = raw.trim()
  if (!h) return []
  const out: HashGuess[] = []
  const len = h.length
  const isHex = HEX.test(h)

  // structured prefixes
  if (/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(h)) out.push({ name: "bcrypt", hashcat: "3200", john: "bcrypt", confidence: "high" })
  if (/^\$1\$[./A-Za-z0-9]{0,8}\$[./A-Za-z0-9]{22}$/.test(h)) out.push({ name: "md5crypt ($1$)", hashcat: "500", john: "md5crypt", confidence: "high" })
  if (/^\$5\$/.test(h)) out.push({ name: "sha256crypt ($5$)", hashcat: "7400", john: "sha256crypt", confidence: "high" })
  if (/^\$6\$/.test(h)) out.push({ name: "sha512crypt ($6$)", hashcat: "1800", john: "sha512crypt", confidence: "high" })
  if (/^\$y\$/.test(h)) out.push({ name: "yescrypt", john: "crypt", confidence: "high" })
  if (/^\$argon2(id|i|d)\$/.test(h)) out.push({ name: "Argon2", confidence: "high" })
  if (/^\$krb5tgs\$23\$/.test(h)) out.push({ name: "Kerberos 5 TGS-REP (RC4)", hashcat: "13100", john: "krb5tgs", confidence: "high" })
  if (/^\$krb5asrep\$23\$/.test(h)) out.push({ name: "Kerberos 5 AS-REP (RC4)", hashcat: "18200", john: "krb5asrep", confidence: "high" })
  if (/^[^:]+:\d+:[a-f0-9]{32}:[a-f0-9]{32}:::$/i.test(h)) out.push({ name: "NetNTLM / SAM (LM:NTLM)", hashcat: "1000", confidence: "high" })
  if (/::/.test(h) && /\$/.test(h)) out.push({ name: "NetNTLMv2", hashcat: "5600", john: "netntlmv2", confidence: "medium" })
  if (/^{SSHA}/.test(h)) out.push({ name: "LDAP SSHA", hashcat: "111", confidence: "high" })
  if (/^sha1\$/.test(h) || /^pbkdf2_sha256\$/.test(h)) out.push({ name: "Django PBKDF2/SHA", hashcat: "10000", confidence: "high" })
  if (/^\$P\$|\$H\$/.test(h)) out.push({ name: "phpass (WordPress/phpBB)", hashcat: "400", john: "phpass", confidence: "high" })

  if (out.length) return out

  if (isHex) {
    switch (len) {
      case 32:
        out.push({ name: "MD5", hashcat: "0", john: "raw-md5", confidence: "medium" })
        out.push({ name: "NTLM", hashcat: "1000", john: "nt", confidence: "medium" })
        out.push({ name: "MD4", hashcat: "900", confidence: "low" })
        break
      case 40:
        out.push({ name: "SHA-1", hashcat: "100", john: "raw-sha1", confidence: "medium" })
        break
      case 56:
        out.push({ name: "SHA-224", hashcat: "1300", confidence: "medium" })
        break
      case 64:
        out.push({ name: "SHA-256", hashcat: "1400", john: "raw-sha256", confidence: "medium" })
        out.push({ name: "SHA3-256 / Keccak", confidence: "low" })
        break
      case 96:
        out.push({ name: "SHA-384", hashcat: "10800", confidence: "medium" })
        break
      case 128:
        out.push({ name: "SHA-512", hashcat: "1700", john: "raw-sha512", confidence: "medium" })
        out.push({ name: "Whirlpool", hashcat: "6100", confidence: "low" })
        break
      case 16:
        out.push({ name: "MySQL323 (pre-4.1)", hashcat: "200", confidence: "low" })
        break
    }
    if (/^\*[A-F0-9]{40}$/i.test(h)) out.push({ name: "MySQL 4.1+ (SHA1(SHA1))", hashcat: "300", confidence: "high" })
  }

  if (!isHex && B64.test(h) && /=$/.test(h)) out.push({ name: "Base64-encoded data (not a hash?)", confidence: "low" })
  if (/^[0-9a-f]{8}$/i.test(h)) out.push({ name: "CRC32 (checksum)", confidence: "low" })

  if (!out.length) out.push({ name: "Unknown format", confidence: "low" })
  return out
}
