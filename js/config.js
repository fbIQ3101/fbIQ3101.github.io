/* ============================================================
   Blog-Konfiguration
   ------------------------------------------------------------
   Hier stellst du Owner-Zugang und Grunddaten ein.

   
   Passwort ändern:
     1. Als Owner anmelden → Dashboard → „Einstellungen & Daten“
     2. Unter „Passwort ändern“ neues Passwort eingeben
     3. Den erzeugten Hash unten bei OWNER_PASSWORD_SHA256 einfügen
     4. Datei speichern und ins GitHub-Repository hochladen
   ============================================================ */

window.BLOG_CONFIG = {
  /* Standardwerte – lassen sich später im Dashboard ändern */
  BLOG_TITLE: 'Mein Blog',
  BLOG_TAGLINE: 'Gedanken, Geschichten und Ideen – frisch aus der Schreibstube.',
  OWNER_DISPLAY_NAME: 'Blog-Owner',

  /* Owner-Anmeldung */
  OWNER_USERNAME: 'Felix',
  PASSWORD_SALT: 'aendere-mich-7f3a9c',
  OWNER_PASSWORD_SHA256: 'a80c43f5c42750be90ef3829872d6c009487dab226f13d8231a33220a82ca175',

  /* Sicherheit */
  OWNER_SESSION_MINUTES: 120, // automatische Abmeldung nach Inaktivität
  MAX_LOGIN_ATTEMPTS: 5,      // Fehlversuche bis zur Sperre
  LOCK_SECONDS: 60            // Dauer der Sperre
};
