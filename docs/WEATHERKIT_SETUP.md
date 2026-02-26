# Apple WeatherKit credentials setup

DronePal uses the **WeatherKit REST API** for weather data. You need four values from your Apple Developer account. This guide shows how to get them.

## Requirements

- **Apple Developer Program membership** (paid). WeatherKit is included (500,000 API calls/month).
- **Account Holder or Admin** role to create identifiers and keys.

---

## Step 1: Get your Team ID

1. Go to [Apple Developer](https://developer.apple.com/account) and sign in.
2. Open **Membership** (or **Account** → **Membership details**).
3. Copy your **Team ID** (10 characters, e.g. `AB12CD34EF`).

→ **Use this as `WEATHERKIT_TEAM_ID`** in `.env`.

---

## Step 2: Register a Services ID

1. Open [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources).
2. In the sidebar, click **Identifiers**.
3. Click the **+** button (top left).
4. Select **Services IDs**, then **Continue**.
5. **Description:** e.g. `DronePal WeatherKit`.
6. **Identifier:** reverse-domain style, e.g. `com.yourcompany.dronepal.weather`.
7. Click **Continue**, then **Register**, then **Done**.

→ **Use the Identifier as `WEATHERKIT_SERVICE_ID`** (e.g. `com.yourcompany.dronepal.weather`).

Note: All registered Services IDs can use WeatherKit; you don’t enable WeatherKit per Services ID.

---

## Step 3: Create a private key (with WeatherKit)

1. In [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources), click **Keys** in the sidebar.
2. Click the **+** button.
3. **Key Name:** e.g. `DronePal WeatherKit Key`.
4. Enable **WeatherKit** (checkbox).
5. Click **Continue**, then **Register**.
6. On the confirmation screen, click **Download** to download the `.p8` file.  
   **Important:** Apple lets you download this only once. Store the file securely.
7. Note the **Key ID** shown on the page (e.g. `2AB3CD4E5F`).

→ **Use the Key ID as `WEATHERKIT_KEY_ID`**.  
→ **Use the contents of the `.p8` file as `WEATHERKIT_PRIVATE_KEY`** (see below).

---

## Step 4: Put the private key in `.env`

The `.p8` file looks like:

```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
... (several lines)
-----END PRIVATE KEY-----
```

For `.env` you have two options:

**Option A – Single line with `\n` (recommended)**  
Put the whole key in double quotes and use `\n` for line breaks:

```env
WEATHERKIT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49...\n-----END PRIVATE KEY-----"
```

**Option B – Keep the key in a file**  
Leave `WEATHERKIT_PRIVATE_KEY` empty in `.env` and load the key in `app.config.js` by reading the `.p8` file (e.g. with `fs.readFileSync` and `path.join(__dirname, 'path/to/AuthKey_XXXXX.p8')`). Then set `weatherKitPrivateKey` in `extra` to that string. **Do not commit the `.p8` file** (add it to `.gitignore`).

---

## Step 5: Fill `.env`

Create or edit `.env` in the project root (copy from `.env.example`):

```env
WEATHERKIT_TEAM_ID=AB12CD34EF
WEATHERKIT_SERVICE_ID=com.yourcompany.dronepal.weather
WEATHERKIT_KEY_ID=2AB3CD4E5F
WEATHERKIT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

Restart the dev server (`npx expo start --clear`) so the new env is picked up.

---

## Summary

| Credential   | Where you get it                          | `.env` variable            |
|-------------|--------------------------------------------|----------------------------|
| Team ID     | Membership details                         | `WEATHERKIT_TEAM_ID`       |
| Service ID  | Identifiers → Services ID → Identifier    | `WEATHERKIT_SERVICE_ID`    |
| Key ID      | Keys → your key → Key ID                   | `WEATHERKIT_KEY_ID`        |
| Private key | Keys → Download → `.p8` file contents      | `WEATHERKIT_PRIVATE_KEY`   |

---

## JWT format (Apple’s requirements)

The app signs a JWT with your private key (ES256). The token must match Apple’s spec:

- **Header:** `alg: "ES256"`, `kid`: your Key ID, `id`: `{TEAM_ID}.{SERVICE_ID}` (e.g. `2UNNRK9L5Q.com.shadev.dronepal.weather`).
- **Payload:** `iss`: your **10-character Team ID only**, `sub`: your Service ID, `iat` and `exp`: issued-at and expiration (seconds since epoch).

See [Request authentication for WeatherKit REST API](https://developer.apple.com/documentation/weatherkitrestapi/request_authentication_for_weatherkit_rest_api).

---

## Links

- [WeatherKit – Get started](https://developer.apple.com/weatherkit/get-started/)
- [Create a services identifier and private key for WeatherKit](https://developer.apple.com/help/account/capabilities/create-a-services-identifier-and-private-key-for-weatherkit/)
- [WeatherKit REST API](https://developer.apple.com/documentation/weatherkitrestapi/)
