# Visual TOTP Simulator

An interactive visual tool that explains how **TOTP (Time-based One-Time Password)** works internally by animating each step of the algorithm in real time.

🔗 **[Live Demo](https://siddhu123m.github.io/Visual-TOTP-Simulator/)**

![TOTP Simulator](https://img.shields.io/badge/Educational-Tool-blue) ![License](https://img.shields.io/badge/License-MIT-green)

---

## 🎯 What is TOTP?

**TOTP (Time-based One-Time Password)** is the algorithm behind authenticator apps like Google Authenticator, Microsoft Authenticator, and Authy. It generates a short numeric code that changes every 30 seconds, used as a second factor for authentication.

---

## 🔐 How TOTP Works

TOTP generates one-time passwords using these 5 steps:

### Step 1: Shared Secret
Both the client (your authenticator app) and server share a secret key. This secret:
- Is typically 20 bytes (160 bits)
- Is encoded in **Base32** for easy storage/display
- **Never changes** after setup
- Is **never transmitted** after initial setup

```
Secret (Base32): JBSWY3DPEHPK3PXP
Secret (Hex):    48656c6c6f21deadbeef
```

### Step 2: Time → Counter
Current Unix time is converted to a counter value:

```
counter = floor(current_unix_time / time_step)
```

- **time_step** is usually 30 seconds
- This ensures the OTP changes every 30 seconds
- Both client and server calculate the same counter (if clocks are synced)

```
Unix Time:  1736438400
Time Step:  30 seconds
Counter:    57881280
```

### Step 3: HMAC Generation
The counter and secret are combined using **HMAC-SHA1**:

```
HMAC = HMAC-SHA1(secret, counter)
```

- Counter is converted to 8-byte big-endian format
- HMAC produces a 20-byte (160-bit) hash
- SHA-256 and SHA-512 can also be used

```
HMAC Output: 1f8698690e02ca16618550ef7f19da8e945b555a (20 bytes)
```

### Step 4: Dynamic Truncation
The 20-byte HMAC is truncated to a 31-bit integer:

```
1. offset = last_byte & 0x0F           // Get offset (0-15)
2. bytes = hmac[offset : offset+4]     // Select 4 bytes
3. binary = bytes & 0x7FFFFFFF         // Mask sign bit
```

This ensures:
- Deterministic extraction
- Even distribution of values
- 31-bit positive integer output

```
Last Byte:  0x5a → Offset: 10
Selected:   bytes[10..13] = 0x7f19da8e
Masked:     0x7f19da8e & 0x7FFFFFFF = 2132802190
```

### Step 5: OTP Generation
Finally, the integer is converted to a 6-digit code:

```
OTP = binary % 10^6
```

```
Binary:  2132802190
OTP:     2132802190 % 1000000 = 802190
Display: 802190
```

---

## 🔄 Verification Flow

When you enter an OTP:

1. **Server calculates** the expected OTP using the shared secret
2. **Server checks ±1 window** to account for time drift
3. **No OTP is stored** - it's computed fresh each time

```
Time Drift Tolerance:
  Counter-1: 802189 ❌
  Counter  : 802190 ✅ Match!
  Counter+1: 802191 ❌
```

---

## 📊 Algorithm Summary

```
┌─────────────┐
│ Shared      │
│ Secret      │──────────┐
│ (Base32)    │          │
└─────────────┘          │
                         ▼
┌─────────────┐    ┌───────────┐    ┌────────────┐    ┌─────────┐
│ Current     │    │           │    │  Dynamic   │    │  Final  │
│ Time ────────────▶   HMAC    │────▶ Truncation │────▶  OTP    │
│ ÷ 30 = Cnt  │    │  SHA-1    │    │  (31-bit)  │    │ 6 digit │
└─────────────┘    └───────────┘    └────────────┘    └─────────┘
```

---

## ✨ Features of This Simulator

- **⏱️ Real-time visualization** - Watch OTP change every 30 seconds
- **🔧 Interactive controls** - Modify secret, time step, and algorithm
- **📚 Step-by-step breakdown** - See each stage of TOTP generation
- **🎯 Verification demo** - Understand how servers verify OTPs
- **⏸️ Freeze time** - Pause to examine calculations
- **🔀 Time scrubbing** - Move forward/backward in time

---

## 🛠️ Technical Details

| Parameter | Default | Options |
|-----------|---------|---------|
| Time Step | 30s | 30s, 60s |
| Digits | 6 | 6, 8 |
| Algorithm | SHA-1 | SHA-1, SHA-256, SHA-512 |
| Secret Length | 20 bytes | Variable |

---

## 🚀 Getting Started

### View Online
Visit the [Live Demo](https://siddhu123m.github.io/Visual-TOTP-Simulator/)

### Run Locally
```bash
# Clone the repository
git clone https://github.com/siddhu123m/Visual-TOTP-Simulator.git

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📖 Learn More

- [RFC 6238 - TOTP](https://tools.ietf.org/html/rfc6238)
- [RFC 4226 - HOTP](https://tools.ietf.org/html/rfc4226)
- [HMAC Wikipedia](https://en.wikipedia.org/wiki/HMAC)

---

## ⚠️ Disclaimer

This is an **educational simulator**, not a production authenticator. Do not use for actual authentication.

---

## 📄 License

MIT License - feel free to use for learning and education!
