# VS-Code-Test

Dieses Projekt demonstriert eine einfache Firmenverwaltungs-Anwendung mit Node.js und Express.

## Benötigte Abhängigkeiten

Die wichtigsten Pakete sind in der `package.json` definiert:
- express
- dotenv
- bcrypt
- jsonwebtoken
- joi
- helmet
- express-rate-limit
- cors
- body-parser
- uuid

Installiere alle Abhängigkeiten mit:

```bash
npm install
```

## Starten der Anwendung

Nach der Installation der Pakete kann der Server mit folgendem Befehl gestartet werden:

```bash
npm start
```

Der Startskript ruft `node backend/server.js` auf und startet damit den Express-Server.

## Umgebungsvariablen

Für den Betrieb werden einige Umgebungsvariablen genutzt:

- `SECRET_KEY` – geheimer Schlüssel zur Signierung von JSON Web Tokens.
- `PORT` – (optional) Port, auf dem der Server lauscht. Standardmäßig `3000`.
- `NODE_ENV` – steuert u.a. die Sicherheitseinstellungen bei Cookies.

Die Variablen können in einer `.env`-Datei im Projektverzeichnis definiert werden. Beispiel:

```env
SECRET_KEY=my_super_secret
PORT=4000
NODE_ENV=production
```

