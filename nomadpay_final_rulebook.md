nomadpayrule
---
description: NomadPay architecture, compliance, cleanup tasks, and iOS-extension rules for the existing React-Native + Laravel code-base
---
# NomadPay Rulebook

## 1 · Goal

- Re-use the current **React-Native Android** app and **Laravel** API to create **NomadPay**  
  – Foreigners scan any PromptPay / Thai QR and pay with an overseas card  
  – App adds a **2 % service fee** and instantly pays the merchant in THB  
- Keep Android build, **add iOS** (CocoaPods + Xcode workspace, no Expo).  
- Remove superfluous modules (chat, PayPal, Firebase Auth, etc.) to shrink APK / IPA size.

## 2 · Third-party Requirements

| Domain            | Interim (launch)                                            | Future (post-licence)                                  |
|-------------------|-------------------------------------------------------------|--------------------------------------------------------|
| **KYC / AML**     | Sumsub RN SDK + webhooks (global coverage)                  | Same provider, scales across ASEAN                     |
| **Card rails**    | Stripe PaymentIntents + 3-DS                                | Same                                                   |
| **Payout rails**  | **PayFacAdapter** → licensed PSP (Opn / 2C2P / TrueMoney)   | **DirectKBankAdapter** → K-Bank QR API after BOT lic.  |

```ts
interface PayoutAdapter {
  pay(cmd: PayoutCommand): Promise<PayoutResult>;
  inquiry(ref: string): Promise<PayoutStatus>;
}
```

Runtime flag `PAYOUT_MODE=payfac|direct` chooses the adapter.

## 3 · Mobile App — Target Screens & Flows

| # | Screen         | Key components                              | Notes                        |
|---|----------------|----------------------------------------------|------------------------------|
| 1 | Welcome        | Locale picker, GDPR/PDPA consent             | Light & dark themes          |
| 2 | KYC            | Passport MRZ scan + selfie (Sumsub RN bridge)| Blocks until approved        |
| 3 | Card Vault     | Stripe RN Element, saved-card list           | No in-app top-ups            |
| 4 | Home / Scan    | RN Vision Camera, torch toggle               | ZXing → EMV-co decode        |
| 5 | Review         | Merchant alias, THB amount, 2 % fee line     | “Pay” triggers PaymentIntent |
| 6 | Processing     | Animated progress                            | Back navigation disabled     |
| 7 | Success / Error| Receipt, share PDF, retry                    |                              |
| 8 | History        | Infinite scroll, filters, CSV export         |                              |
| 9 | Settings       | Cards, limits, language, support link        |                              |

*Remove*: chat, wallet top-up, PayPal, crypto lists, unused UI kits.

## 4 · Back-end (Laravel) — Service Topology

```
api-gateway → auth-svc   (JWT)
               kyc-svc    (Sumsub webhooks)
               pay-svc    (Stripe charge + fee calc)
               payout-svc {PayFacAdapter | DirectKBankAdapter}
               ledger-svc (double-entry)
               notify-svc (FCM / APNs)
```

### Migration tasks
- Move controller logic into the services above.
- Shift business logic out of route files into Service classes.
- Add Redis queue for webhook retries.

## 5 · Compliance

- PCI-DSS SAQ-A (Stripe tokenisation).
- PDPA: PII stored in AWS Bangkok (RDS + S3, AES-256).
- Audit trail: CloudTrail + S3 Object-Lock (5 yrs).
- AML rules: flag any txn ≥ THB 50 000 or 5 rapid repeats to the same merchant.

## 6 · Build & Deploy Pipeline

| Front-end                              | Back-end                              |
|----------------------------------------|----------------------------------------|
| `npm run android` / `npm run ios`      | GitHub Actions → Docker → EKS / Forge |
| Detox e2e (Android + iOS Sim)          | PHPUnit + Pest + PHPStan              |
| App Center / TestFlight / Play Internal| Argo CD Helm chart                    |

## 7 · Cleanup Sprint Checklist

- Delete /chat, /paypal, /firebase dirs + routes.
- Replace hard-coded keys with .env look-ups.
- `npx react-native-clean-project-auto`, then re-install pods.
- Generate ios/ folder, copy App.tsx.
- Update Info.plist & AndroidManifest.xml (only needed perms).
- Strip unused NPM modules, lock with pnpm.
- Add Stripe RN SDK v12 & Sumsub RN bridge.
- Write adapter unit tests (Jest + supertest).
- Prefix all new mobile routes with /v1/mobile/*.

## 8 · Acceptance Criteria (Base)

- Android and iOS release builds succeed (--variant=release).
- PAYOUT_MODE switchable at runtime (config cache reload).
- Scan-to-pay P95 latency ≤ 15 s.
- Unit coverage ≥ 80 %; Detox e2e ≥ 60 %.
- Lighthouse ≥ 85 on any remaining web views.

---
# NomadPay — Mobile Delta Rules

(Overrides any conflicting details above)

## A · Remove Completely

| Module / Screen        | Rationale                           |
|------------------------|-------------------------------------|
| Deposit Money          | No prefunding — link card only      |
| Exchange Money         | Not required                        |
| Withdraw Money & Settings | Wallets removed                 |
| Crypto Receive         | Only one-way crypto → THB off-ramp  |
| Wallet balance view    | Replaced by saved card list         |

## B · Keep Unchanged

Login • Registration • Forgot-password (OTP) • Profile • Dashboard  
Transaction History / Details / Step • Email & SMS alerts  
Role & Permission • User status flags • Settings • Themes • i18n

## C · Modify / Repurpose

| Feature        | New Behaviour & Notes                                                 |
|----------------|-----------------------------------------------------------------------|
| Request Money  | Renamed to Request Refund → Stripe.refunds.create                    |
| Exchange Rate  | Show THB + user’s currency via Redis-cached rates from exchangerate.host |
| Wallets        | Rename to Payment Methods (saved Stripe cards + “Add card”)           |
| Crypto Send    | Tatum SDK used, +5 % fee, confirm 1 block → THB payout via adapter     |
| QR-Pay variants| Merge into single Scan & Pay — peer vs merchant based on EMV tags     |

## D · Updated User Flow (Mermaid)

```mermaid
flowchart TD
  A[Scan QR] --> B{Payload type?}
  B --> |Peer| C[Show peer alias & amount]
  B --> |Merchant| D[Show merchant name & amount]
  C & D --> E[Choose Payment Method (Card or Crypto)]
  E --> |Card| F[Stripe PaymentIntent +2%]
  E --> |Crypto| G[Tatum send +5%]
  F --> H{Card OK?}
  G --> I{Block confirm?}
  H --> |Yes| J[PayoutAdapter → THB]
  I --> |Yes| J
  H & I --> |No| K[Error]
  J --> L[Receipt + push]
```

## E · Back-end Additions

1. POST /refund/:txnId → Stripe refund logic  
2. POST /crypto/pay → accept txHash, wait 1–2 confirms via Tatum webhook → payout  
3. FxRateService hourly cron → Redis fx:THB:{ISO}  
4. DB tidy-up: drop wallets, deposit, withdraw; add payment_methods FK to stripe_customer_id

## F · Mobile Code Tasks

- Delete Deposit / Exchange / Withdraw stacks from navigator
- Refactor WalletScreen → PaymentMethodsScreen
- Add PaymentMethodPicker modal (Card | Crypto)
- Replace Redux wallet.balance with user.defaultCurrency
- Create reusable FxLabel component
- Remove PayPal & Firebase, run pnpm prune
- Add Tatum SDK wrapper; update Detox tests (card, crypto, refund)

## G · Acceptance Criteria (Delta)

- Deposit / Withdraw / Exchange are never visible
- Card path (+2 %) and Crypto path (+5 %) both succeed
- Refund reverses Stripe charge and updates ledger
- FX label shows on every amount, respecting default currency
- CI passes on Android and iOS after cleanup

---
# Folder Context Rule

- `/web` contains all Laravel PHP backend source code and APIs.
- `/android` is the React Native mobile app (Android only currently).
- `/ios` will be generated using CocoaPods for iOS support.
- Any new platform-specific assets should be placed in their respective folders.
- Common shared logic should be kept inside `/shared` if added later.