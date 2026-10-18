# Pocket Guitar Tuner

A small, native iOS guitar tuner built with Expo SDK 57, React Native, and TypeScript. Standard and Drop D tuning, automatic string matching or manual string lock, a cents meter, and adjustable A4 reference (430–450 Hz). No account, advertising, analytics, audio storage, or backend.

## Develop

Use Node 22.13+ (Node 22 LTS recommended).

```sh
npm ci
npm test
npm run typecheck
npm run ios
```

`npm run web` starts a browser preview with Web Audio microphone capture. iOS uses Expo Audio's real-time PCM stream. EAS profiles mirror BrickBuilder's Expo workflow. The app runs locally and does not embed BrickBuilder or depend on its services.

## Audio

The microphone is requested only after Start tuning. YIN detects the fundamental from 4,096-sample frames and rejects quiet or nonperiodic input. Hardware sample rates and interleaved channels are respected. Readings expire after silence. Audio capture stops when backgrounded, paused, or unmounted. A guitar must be played one string at a time; this is not a polyphonic tuner.

## Release

```sh
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production
```

The App Store Connect record and EAS project belong to Jake's existing accounts. App Store review and approval are separate from the TestFlight upload. See `app-store/` for listing text and release status. Never commit signing keys, credentials, environment files, or exported IPAs.

## Validation

`tests/` covers all standard/Drop D strings at four sample rates, harmonics, sharp/flat readings, silence, DC, weak input, noise, invalid input, PCM chunk accumulation, calibration, and cancellation of pending capture work. A physical iPhone and real guitar smoke test is still required before treating pitch behavior as device-verified.

Support and privacy: https://jjohnson5253.github.io/pocket-guitar-tuner/
