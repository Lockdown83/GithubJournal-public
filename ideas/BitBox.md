Bitbox Home Bitcoin Node – Idea Snapshot
==============================================

1️⃣  Core Concept
-----------------
A plug‑and‑play, fan‑less “money router” that runs a full Bitcoin + optional Lightning node at home.
•   Setup as trivial as installing a Wi‑Fi router (power + Ethernet).
•   Auto‑updates, self‑heals, and quietly validates the chain 24/7.
•   Mobile wallets connect via LAN, Tor .onion, or mesh VPN—no third‑party APIs.

2️⃣  World & Market Assumptions
------------------------------
•   **Bitcoin grows into global, everyday money** (medium–high penetration).  
•   **Self‑custody normalises**; users value personal verification.  
•   **Regulatory & surveillance pressure intensifies**, making third‑party nodes riskier.  
•   **Privacy & censorship‑resistance become mainstream selling points**.  
•   Bitcoin full nodes remain feasible on consumer hardware (<2 TB, <100 W).

3️⃣  Primary Use‑Cases
---------------------
•   **Private wallet backend** – no leaking xpubs/IPs to public APIs.  
•   **Lightning routing for passive sats** – node relays payments and earns fees.  
•   **Family “sovereign server”** – one box serves all household wallets.  
•   **Decentralised infrastructure** – strengthens the global peer graph.

4️⃣  Lightning Routing for Passive Sats
--------------------------------------
If your home node runs a Lightning Network routing node, then it:
•   Opens and maintains payment channels with other nodes
•   Relays other people's transactions (like a router forwarding packets)
•   Collects tiny fees (routing fees) for doing so

That's the "earn passive sats" part: you're earning income by contributing liquidity and uptime to the Lightning network — similar to providing bandwidth to a decentralized network and being rewarded.

🧩 How this works in Bitbox:
•   Toggle in the Bitbox app: "🔁 Route Lightning Payments – Earn sats while idle"
•   Initial capital allocation: device asks how much BTC to allocate as liquidity (e.g. 0.01 BTC)
•   Autopilot: manages channels using pre-set heuristics (high-traffic peers, balanced channels, fee markets)
•   Fee optimization: adjusts fee rates automatically to keep channels competitive
•   Stats dashboard: shows sats earned, active liquidity, uptime/trust score

🛡 Security & UX Considerations
•   Capital risk: funds in channels are hot – use dual-layer cold/hot setup (local keys or pair with hardware signer)
•   Uptime: node must be online 24/7 – bundle small onboard UPS, auto-reconnect with Tailscale/Tor
•   Channel management: handled by LND/CLN autopilot or integrated liquidity services
•   Malicious peers/spam: enable spam protection (fee floors, min HTLC size, max attempts)
•   Regulatory: not a money transmitter, but may vary by jurisdiction

💸 Is this really passive income?
Yes, but modest. Example estimates:
| Size      | Routing income (est.)         |
|-----------|------------------------------|
| 0.01 BTC  | ≈ 500–1,500 sats/month ($0.30–$1.00) |
| 0.1 BTC   | ≈ 5k–10k sats/month ($3–$7)  |
| 1 BTC     | ≈ 100k+ sats/month ($60+)    |

Profitability depends on routing strategies, liquidity placement, and uptime reliability. Even small nodes can earn some sats if well-peered.

🚀 Why it's a killer feature
•   Gamified sovereignty — people feel rewarded for running infra.
•   Emotional flywheel — earning sats daily reinforces network participation.
•   Network health — Bitbox users become decentralized liquidity nodes, hardening the Lightning mesh globally.

TL;DR
"Route Lightning txs for passive sats" = your node becomes a payment-relaying router, earning small fees while online. This is viable for consumers when it's:
•   Capital-efficient (user chooses BTC to commit)
•   Fully autopilot-managed (no channel babysitting)
•   Secure (funds + keys protected)
•   Emotionally rewarding (real sats, real stats, no tech stress)

5️⃣  Cons / Challenges
---------------------
✗  UX friction: initial sync, liquidity management, power uptime.  
✗  Capital lock‑up: Lightning channels tie up BTC (risk & opportunity cost).  
✗  Maintenance: though auto‑updates help, hardware can still fail.  
✗  Limited earnings: routing fees are modest unless significant capital is allocated.  
✗  Regulatory grey‑zone: unclear future treatment of routing fees vs. money‑transmission.

6️⃣  Technical Highlights
------------------------
•   Hardware: Pi 5/RK3588‑class SBC, 2 TB NVMe, fanless case, onboard UPS.  
•   OS: immutable NixOS with automatic rollbacks.  
•   Bitcoin Core (pruned by default), Core‑Lightning or LND autopilot.  
•   Connectivity: Tor hidden‑service + optional Tailscale/WireGuard.  
•   Security: integrated secure element for signing / multisig co‑signing.

7️⃣  Market Scope & Adoption Phases
----------------------------------
| Phase               | Driver                                 | TAM               |
|---------------------|----------------------------------------|-------------------|
| Early adopters      | Privacy nerds & Bitcoin maximalists    | ~10 k–100 k units |
| Catalyst events     | Censorship, KYC overreach, fee hikes   | ~1 M units        |
| Mainstream bundles  | ISP / router co‑branding, smart‑home   | 10 M+ units       |
| Ambient ubiquity    | Bitcoin = default money                | 100 M‑scale nodes |

8️⃣  Incentive Loop (Lightning Autopilot)
----------------------------------------
1. User pledges liquidity (e.g. 0.01 BTC).  
2. Autopilot opens balanced channels with high‑traffic peers.  
3. Node earns routing fees (500–1 500 sats/month on 0.01 BTC).  
4. Stats dashboard reinforces engagement; user may add more liquidity.

9️⃣  Open Questions
------------------
•   What killer event will flip privacy from "nice" to "necessary"?  
•   Can routing income justify the capital committed?  
•   Will ISPs or hardware wallets be the best bundling partners?  
•   How do we secure long‑term support & updates at consumer price points?

🔟  Next Steps for Validation
----------------------------
•   Prototype "one‑click" mobile pairing over Tor.  
•   Benchmark assumeUTXO sync time on Pi 5 + 2 TB NVMe.  
•   Run a pilot cohort of 100 units to measure Lightning fee yield vs. uptime.  
•   Survey non‑technical households on willingness to pay for privacy appliances.
