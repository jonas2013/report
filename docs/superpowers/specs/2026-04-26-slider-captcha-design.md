# Login Slider Captcha Design

## Overview

Add a puzzle slider captcha to the login page to prevent brute-force attacks. Backend generates a background image with a puzzle piece cutout; user drags the slider to match the position.

## Architecture

```
Frontend                          Backend
  GET /captcha/puzzle  ──────>   Generate bg + slider images, store correct x in memory
  { bgImage, sliderImage,      Return base64 images + captchaId + slider y
    captchaId, y }
  POST /captcha/verify  ──────>  Compare x position (tolerance 5px)
  { captchaId, x }              Issue one-time captchaToken (JWT, 30s TTL)
  POST /auth/login     ──────>   Validate captchaToken, then authenticate
  { email, password, captchaToken }
```

## Backend Changes

### New dependency: `canvas` (node-canvas)
- Generate random background (gradient + noise shapes)
- Cut puzzle piece at random position
- Return base64 encoded images

### New routes: `/api/v1/captcha`

**GET /puzzle**
- Generate 300x150 background with gradient + random shapes
- Cut a 44x44 puzzle piece (with protrusion) at random (x, y)
- Store `{ captchaId: correctX }` in in-memory Map with 5-min auto-cleanup
- Response: `{ bgImage, sliderImage, captchaId, sliderY }`

**POST /verify**
- Body: `{ captchaId, x }`
- Compare |submittedX - correctX| <= 5
- On pass: sign a one-time JWT captchaToken (30s expiry, single-use via deletion from Map)
- On fail: increment fail count, delete after 5 failures (force refresh)
- Response: `{ token }` or error

### Modified: POST /auth/login
- Add `captchaToken` to loginSchema (required)
- Verify captchaToken JWT signature and expiry before authentication
- Token is single-use (stateless via short TTL)

## Frontend Changes

### New component: `SliderCaptcha.tsx`
- Props: `onSuccess(token: string)`
- Displays: background image with cutout, draggable slider piece, slider track
- Drag mechanics: mouse/touch events, piece follows slider position
- On drag end: call POST /captcha/verify with captchaId + x
- Success: green border flash, call onSuccess(token)
- Failure: red shake animation, auto-refresh puzzle after 3 failures
- Refresh button to get new puzzle

### Modified: `LoginPage.tsx`
- After email/password inputs, render SliderCaptcha
- Captcha success stores captchaToken in state
- Login submit includes captchaToken
- Show/hide captcha flow: captcha appears when user focuses password field (progressive disclosure)

## Data Storage

In-memory Map (no Redis needed for single-instance):
```
captchaStore: Map<string, { correctX: number, fails: number, expiresAt: number }>
```
Cleanup: setInterval every 60s, delete entries older than 5 minutes.

## Tolerance & Security

- Position tolerance: 5px (adjustable)
- captchaToken: JWT signed with server secret, 30s TTL
- One captchaId per puzzle, deleted after successful verify
- Max 5 verify attempts per puzzle, then must refresh
- Rate limit on /captcha/puzzle: 10 requests/minute per IP
