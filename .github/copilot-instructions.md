PRD: Visual TOTP (Time-based One-Time Password) Simulator
1. Objective

Build an interactive visual tool that explains how TOTP works internally by animating each step of the algorithm in real time.

The user should be able to see how:

time becomes a counter

the secret is used

HMAC is generated

truncation happens

the final OTP changes every time window

This is an educational simulator, not a production authenticator.

2. Target Users

Developers learning authentication

Security learners

Students studying cryptography

Anyone confused about “how authenticator apps work”

3. Core Concepts to Visualize

The tool must clearly show these steps as separate visual stages:

Shared secret

Time → counter

HMAC generation

Dynamic truncation

OTP output

Verification window (time drift)

4. High-Level UI Layout

Split the screen into 5 panels (left → right or top → bottom):

Time Panel

Secret Panel

HMAC Panel

Truncation Panel

OTP Output Panel

Each panel updates live and is visually linked to the next.

5. Time Panel (Input)
Behavior

Show current Unix timestamp

Convert time into a TOTP counter

Formula displayed:

counter = floor(current_time / time_step)

Controls

Time step selector (30s, 60s)

Manual time slider (scrub backward/forward)

Freeze time toggle

Visuals

Countdown timer ring (30s loop)

Counter increments when timer resets

Highlight when counter changes

6. Secret Panel
Behavior

Display shared secret in Base32

Decode secret to raw bytes

Controls

Random secret generator

Manual secret input

Toggle Base32 / hex view

Visuals

Secret shown as blocks of bytes

Same secret labeled as “Client” and “Server”

Important: emphasize secret never changes.

7. HMAC Panel
Behavior

Generate HMAC using:

Secret key

Counter

Hash algorithm (default SHA-1)

Formula displayed:

HMAC = HMAC-SHA1(secret, counter)

Controls

Hash selector: SHA-1 / SHA-256 / SHA-512

Visuals

Animate counter + secret entering HMAC box

Output shown as 20-byte hex string

Highlight byte positions

8. Truncation Panel
Behavior

Extract offset from last nibble

Select 4 bytes starting at offset

Mask sign bit

Convert to integer

Formula displayed:

offset = last_byte & 0x0F
binary = (bytes[offset..offset+3]) & 0x7FFFFFFF

Visuals

Highlight selected bytes

Show offset calculation

Animate bit masking

This is the most important learning step.

9. OTP Output Panel
Behavior

Generate final OTP

Formula displayed:

OTP = binary % 10^digits

Controls

Digits selector (6 or 8)

Visuals

Large OTP display

Auto-refresh on counter change

Previous OTP fades out

10. Verification Simulation (Server Side)
Behavior

Server recomputes OTP

Accepts ±1 time window drift

Visuals

Show multiple counters being checked

Highlight match window

Show success or failure

Text note:
“OTP is never sent or stored. Only verified.”

11. Interaction Features
User Can:

Pause and step through each phase

Change time manually to see OTP changes

Modify secret and instantly see impact

Compare two devices with time drift

Learning Aids:

Tooltips on every formula

Clear labels: “This runs on both client and server”

Warning banner: “This is a demo, not secure storage”

12. Non-Goals

No QR scanning

No real authentication

No networking

No user accounts

No SMS or push OTP

13. Technical Suggestions (Optional)

Frontend only

Deterministic calculations

Separate logic from visualization:

totp.ts

hmac.ts

time.ts

visualizer.ts

14. Success Criteria

The project is successful if:

A user can explain TOTP without memorization

The OTP change feels predictable, not magical

Each step is visually traceable

Time dependency is obvious