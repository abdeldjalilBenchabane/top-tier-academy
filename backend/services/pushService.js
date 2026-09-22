import jwt from 'jsonwebtoken';
import { getRows, query } from '../db.js';
import { debugLog } from '../utils/logger.js';

/**
 * Firebase Cloud Messaging, HTTP v1.
 *
 * WHAT THIS NEEDS AND WHY THE WEB CONFIG IS NOT ENOUGH
 * The snippet Firebase shows under "Add Firebase to your web app" — apiKey,
 * authDomain, appId — identifies a CLIENT. It cannot send messages, and it is
 * meant to be public. Sending requires a service account, which is a private
 * key:
 *
 *   Firebase Console -> Project settings -> Service accounts
 *   -> Generate new private key  (downloads a JSON file)
 *
 * Put that file on the server, outside the repo, and point at it:
 *
 *   FIREBASE_SERVICE_ACCOUNT=/root/firebase-service-account.json
 *
 * Until that exists this module does nothing and says so once. Notifications
 * are still written to the database and still appear in the app's notification
 * centre — only the push is skipped. A missing key must never cost a
 * notification.
 *
 * The legacy FCM server key and the legacy /fcm/send endpoint were both shut
 * down in 2024, so v1 with a service account is the only route left.
 */

const KEY_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || '';
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

let serviceAccount = null;
let loadAttempted = false;
let warned = false;

/** Read the service account once. Missing or malformed is a warning, not a throw. */
async function loadServiceAccount() {
  if (loadAttempted) return serviceAccount;
  loadAttempted = true;

  if (!KEY_PATH) return null;
  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile(KEY_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.client_email || !parsed.private_key || !parsed.project_id) {
      console.error('[push] service account file is missing client_email, private_key or project_id');
      return null;
    }
    serviceAccount = parsed;
    console.log(`[push] Firebase ready for project ${parsed.project_id}`);
    return serviceAccount;
  } catch (error) {
    console.error(`[push] cannot read ${KEY_PATH}: ${error.message}`);
    return null;
  }
}

// Google's access tokens last an hour. Cached with a minute of headroom so a
// token is never used in the second it expires.
let accessToken = null;
let accessTokenExpiry = 0;

async function getAccessToken() {
  const account = await loadServiceAccount();
  if (!account) return null;

  const now = Math.floor(Date.now() / 1000);
  if (accessToken && now < accessTokenExpiry - 60) return accessToken;

  const assertion = jwt.sign(
    {
      iss: account.client_email,
      scope: FCM_SCOPE,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    account.private_key,
    { algorithm: 'RS256' }
  );

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!res.ok) {
    console.error('[push] token exchange failed:', (await res.text()).slice(0, 200));
    return null;
  }

  const body = await res.json();
  accessToken = body.access_token;
  accessTokenExpiry = now + (body.expires_in || 3600);
  return accessToken;
}

export function isPushConfigured() {
  return !!KEY_PATH;
}

/** A dead token should stop costing a request on every future notification. */
async function retireToken(token, reason) {
  await query(
    `UPDATE device_tokens
        SET is_active = FALSE, failure_count = failure_count + 1
      WHERE token = $1`, [token]).catch(() => {});
  debugLog(`[push] retired a token (${reason})`);
}

async function countFailure(token) {
  // Three strikes: a token that keeps failing for reasons Firebase does not
  // name is not worth a request on every notification forever.
  const row = await query(
    `UPDATE device_tokens SET failure_count = failure_count + 1
      WHERE token = $1 RETURNING failure_count`, [token]).catch(() => null);
  const count = row?.rows?.[0]?.failure_count ?? 0;
  if (count >= 3) await retireToken(token, 'three consecutive failures');
}

/**
 * Push one notification to every device a user has signed in on.
 *
 * Returns { sent, failed, skipped }. Never throws: the caller has already
 * written the notification to the database and must not be rolled back because
 * a phone was unreachable.
 */
export async function pushToUser(userId, { title, body, route, imageUrl, data = {} }) {
  try {
    if (!KEY_PATH) {
      if (!warned) {
        console.log('[push] FIREBASE_SERVICE_ACCOUNT is not set — notifications are saved but not pushed');
        warned = true;
      }
      return { sent: 0, failed: 0, skipped: 'not_configured' };
    }

    const account = await loadServiceAccount();
    const token = await getAccessToken();
    if (!account || !token) return { sent: 0, failed: 0, skipped: 'no_credentials' };

    const devices = await getRows(
      'SELECT token FROM device_tokens WHERE user_id = $1 AND is_active = TRUE', [userId]);
    if (devices.length === 0) return { sent: 0, failed: 0, skipped: 'no_devices' };

    const url = `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`;
    let sent = 0, failed = 0;

    for (const { token: deviceToken } of devices) {
      // FCM data values must all be strings, so everything is stringified here
      // rather than trusting callers to remember.
      const payload = {
        message: {
          token: deviceToken,
          notification: {
            title: String(title || ''),
            body: String(body || ''),
            ...(imageUrl ? { image: String(imageUrl) } : {}),
          },
          data: Object.fromEntries(
            Object.entries({ route: route || '', ...data })
              .filter(([, v]) => v !== null && v !== undefined)
              .map(([k, v]) => [k, String(v)])
          ),
          android: {
            priority: 'high',
            notification: { sound: 'default', click_action: 'FLUTTER_NOTIFICATION_CLICK' },
          },
          apns: {
            payload: { aps: { sound: 'default', badge: 1 } },
          },
        },
      };

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) { sent += 1; continue; }

        failed += 1;
        const text = await res.text();
        // 404 UNREGISTERED and 400 INVALID_ARGUMENT mean the token is gone for
        // good — the app was uninstalled, or Firebase rotated it.
        if (res.status === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(text)) {
          await retireToken(deviceToken, `HTTP ${res.status}`);
        } else {
          await countFailure(deviceToken);
          debugLog(`[push] HTTP ${res.status}: ${text.slice(0, 160)}`);
        }
      } catch (error) {
        failed += 1;
        await countFailure(deviceToken);
        debugLog(`[push] request failed: ${error.message}`);
      }
    }

    debugLog(`[push] user ${userId}: sent ${sent}, failed ${failed}`);
    return { sent, failed, skipped: null };
  } catch (error) {
    // Anything unexpected stays here. The notification is already saved.
    console.error('[push] unexpected error:', error.message);
    return { sent: 0, failed: 0, skipped: 'error' };
  }
}

export default { pushToUser, isPushConfigured };
