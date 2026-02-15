# Meditationsgong App

En mobilanpassad meditationstimer med vacker design och gongljud.

## Funktioner

- ⏱️ Anpassningsbar timer (minuter och sekunder)
- ▶️ Start, Paus och Återställ-knappar
- 🎨 Varm, organisk design med jordtoner
- 🔔 Gongljud vid slutet och 10 sekunder före slut
- 📱 Optimerad för mobil
- ⭕ Pulserad progress-ring som visar återstående tid

## Användning

1. Öppna `index.html` i din mobila webbläsare
2. Ställ in önskad tid (minuter och sekunder)
3. Tryck på **Start** för att starta meditationen
4. Använd **Paus** för att pausa/fortsätta
5. Tryck **Återställ** för att börja om

## Ljud

Appen använder Web Audio API för att generera ett syntetiskt gongljud. Ljudet spelas:
- Vid tidens slut
- 10 sekunder innan tiden är slut (som varning)

### Ersätta med egen ljudfil (valfritt)

Om du vill använda en egen ljudfil istället:

1. Lägg en MP3- eller WAV-fil som heter `gong.mp3` eller `gong.wav` i samma mapp
2. Ändra `playGong()`-funktionen i `script.js`:

```javascript
// Ersätt playGong()-funktionen med:
function playGong() {
    const audio = new Audio('gong.mp3'); // eller 'gong.wav'
    audio.play();
    
    soundIndicator.classList.add('active');
    setTimeout(() => {
        soundIndicator.classList.remove('active');
    }, 4000);
}
```

## Design

Appen har en distinktiv design med:
- **Färgpalett**: Terrakotta, sandbeige, mossa och jordfärger
- **Typsnitt**: Cormorant Garamond (siffror) och Montserrat (UI)
- **Animationer**: Pulserade ringar, mjuka övergångar
- **Responsiv**: Anpassar sig automatiskt till mobilskärmar

## Teknisk stack

- HTML5
- CSS3 (med custom properties och animationer)
- Vanilla JavaScript
- Web Audio API

## Kompatibilitet

Fungerar i alla moderna webbläsare:
- Chrome/Edge 60+
- Safari 11+
- Firefox 55+

---

Njut av din meditation! 🧘‍♀️
