import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getClientAuth, getClientDb } from './firebase';

const GMAIL_TOKEN_KEY = 'pt_perdana_gmail_token';
let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem(GMAIL_TOKEN_KEY) : null;
const SENDER_EMAIL = 'ary.wibowo@perada.net';

export const setGmailAccessToken = async (token: string | null) => {
    cachedAccessToken = token;
    if (typeof window !== 'undefined') {
        if (token) {
            localStorage.setItem(GMAIL_TOKEN_KEY, token);
            try {
                await setDoc(doc(getClientDb(), 'system_settings', 'gmail_api'), { accessToken: token, updatedAt: new Date().toISOString() });
            } catch (e) {
                console.error('Failed to sync Gmail token to Firestore:', e);
            }
        } else {
            localStorage.removeItem(GMAIL_TOKEN_KEY);
            try {
                await setDoc(doc(getClientDb(), 'system_settings', 'gmail_api'), { accessToken: null, updatedAt: new Date().toISOString() });
            } catch (e) {
                console.error('Failed to clear Gmail token in Firestore:', e);
            }
        }
    }
};

export const getGmailAccessToken = () => cachedAccessToken;

export const authorizeGmailAdmin = async (): Promise<string> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.send');
    provider.setCustomParameters({
        prompt: 'select_account',
        login_hint: SENDER_EMAIL
    });
    
    try {
        const result = await signInWithPopup(getClientAuth(), provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken || null;
        if (token) {
            await setGmailAccessToken(token);
            return token;
        } else {
            throw new Error('Gagal memperoleh Gmail Access Token dari login Google.');
        }
    } catch (error: any) {
        console.error('Error during Google authentication for Gmail:', error);
        throw error;
    }
};

export const sendGmail = async (to: string, subject: string, body: string) => {
    if (!cachedAccessToken) {
        try {
            const snap = await getDoc(doc(getClientDb(), 'system_settings', 'gmail_api'));
            if (snap.exists() && snap.data().accessToken) {
                cachedAccessToken = snap.data().accessToken;
            }
        } catch (e) {
            console.error('Failed to retrieve fallback Gmail token from Firestore:', e);
        }
    }

    if (!cachedAccessToken) {
        throw new Error('Gmail access token not available. Please authorize Gmail in the admin settings/header.');
    }

    const emailParts = [
        `From: ${SENDER_EMAIL}`,
        `To: ${to}`,
        `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset="utf-8"',
        '',
        body
    ];
    const email = emailParts.join('\r\n');
    const base64EncodedEmail = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_');

    try {
        const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cachedAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ raw: base64EncodedEmail })
        });

        if (!response.ok) {
            const error = await response.json();
            if (response.status === 401) {
                setGmailAccessToken(null);
                throw new Error('Gmail session expired. Please re-authorize Gmail in settings.');
            }
            throw new Error(`Gmail API Error: ${error.error?.message || response.statusText}`);
        }
        console.log('Email sent successfully via Gmail API');
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
};
