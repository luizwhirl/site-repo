import './style.css';

// Elements
const splashScreen = document.getElementById('splash-screen') as HTMLDivElement;
const tapeContainer = document.getElementById('tape-container') as HTMLDivElement;
const tapeImage = document.getElementById('tape-image') as HTMLImageElement;
const splashMessage = document.querySelector('.splash-message') as HTMLElement;

const mainContent = document.getElementById('main-content') as HTMLDivElement;
const vhsFlash = document.getElementById('vhs-flash') as HTMLDivElement;
const staticGif = document.getElementById('static-gif') as HTMLImageElement;
const navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-menu a');
const contentPanels = document.querySelectorAll<HTMLDivElement>('.content-panel');
const rightPanelTitle = document.getElementById('right-panel-title') as HTMLHeadingElement;
const screenElement = document.querySelector('.screen') as HTMLDivElement;

const glitchNameElement = document.getElementById('glitch-name') as HTMLSpanElement | null;
let glitchNameInterval: number | null = null;

// --- Audio Types & Setup ---

interface SfxVolumes {
  vhsOpen: number;
  vhsClose: number;
  pause: number;
  static: number;
  musicChange: number;
  settingsOpen: number;
  settingsClose: number;
  gasterTheme: number;
  [key: string]: number; // Index signature for programmatic access
}

// Volumes base
const sfxBaseVolumes: SfxVolumes = {
  vhsOpen: 0.5,
  vhsClose: 0.5,
  pause: 0.4,
  static: 0.4,
  musicChange: 0.6,
  settingsOpen: 0.5,
  settingsClose: 0.5,
  gasterTheme: 0.7
};

interface AudioElements {
  vhsOpen: HTMLAudioElement;
  vhsClose: HTMLAudioElement;
  pause: HTMLAudioElement;
  static: HTMLAudioElement;
  musicChange: HTMLAudioElement;
  settingsOpen: HTMLAudioElement;
  settingsClose: HTMLAudioElement;
  gasterTheme: HTMLAudioElement;
  [key: string]: HTMLAudioElement;
}

const sfxAudioElements: AudioElements = {
  vhsOpen: document.getElementById('vhs-open-sound') as HTMLAudioElement,
  vhsClose: document.getElementById('vhs-close-sound') as HTMLAudioElement,
  pause: document.getElementById('pause-sound') as HTMLAudioElement,
  static: document.getElementById('static-sound') as HTMLAudioElement,
  musicChange: document.getElementById('music-change-sound') as HTMLAudioElement,
  settingsOpen: document.getElementById('settings-open-sound') as HTMLAudioElement,
  settingsClose: document.getElementById('settings-close-sound') as HTMLAudioElement,
  gasterTheme: document.getElementById('gaster-theme-sound') as HTMLAudioElement
};

// Modal & Settings Elements
const settingsOverlay = document.getElementById('settings-modal-overlay') as HTMLDivElement;
const settingsButton = document.getElementById('settings-button') as HTMLAnchorElement;
const settingsCloseButton = document.getElementById('settings-close-button') as HTMLAnchorElement;
const settingsOkButton = document.getElementById('settings-ok-button') as HTMLButtonElement;
const settingsCancelButton = document.getElementById('settings-cancel-button') as HTMLButtonElement;

// Sliders
const masterSlider = document.getElementById('master-volume') as HTMLInputElement;
const vhsLoopSlider = document.getElementById('vhs-loop-volume') as HTMLInputElement;
const sfxSlider = document.getElementById('sfx-volume') as HTMLInputElement;

// Web Audio API
let audioContext: AudioContext | undefined;
let vhsAudioBuffer: AudioBuffer | undefined;
let vhsAudioSource: AudioBufferSourceNode | null = null;
let vhsGainNode: GainNode | undefined;

// --- Functions ---

function saveSettings(): void {
  localStorage.setItem('atvn-masterVolume', masterSlider.value);
  localStorage.setItem('atvn-vhsVolume', vhsLoopSlider.value);
  localStorage.setItem('atvn-sfxVolume', sfxSlider.value);
}

function loadSettings(): void {
  const masterVol = localStorage.getItem('atvn-masterVolume');
  const vhsVol = localStorage.getItem('atvn-vhsVolume');
  const sfxVol = localStorage.getItem('atvn-sfxVolume');

  if (masterVol !== null) masterSlider.value = masterVol;
  if (vhsVol !== null) vhsLoopSlider.value = vhsVol;
  if (sfxVol !== null) sfxSlider.value = sfxVol;

  updateVolumes();
}

function updateVolumes(): void {
  const masterVol = parseFloat(masterSlider.value);
  const vhsLoopVol = parseFloat(vhsLoopSlider.value);
  const sfxVol = parseFloat(sfxSlider.value);

  if (vhsGainNode && audioContext) {
    // Use setTargetAtTime for smoother transition or direct assignment if simple
    vhsGainNode.gain.value = vhsLoopVol * masterVol;
  }

  for (const key in sfxAudioElements) {
    if (sfxAudioElements[key]) {
      sfxAudioElements[key].volume = (sfxBaseVolumes[key] || 0.5) * sfxVol * masterVol;
    }
  }
}

function openSettingsModal(): void {
  settingsOverlay.style.display = 'flex';
  playAudio(sfxAudioElements.settingsOpen);
}

function closeSettingsModal(): void {
  settingsOverlay.style.display = 'none';
  playAudio(sfxAudioElements.settingsClose);
}

// Event Listeners for Settings
settingsButton.addEventListener('click', openSettingsModal);
settingsCloseButton.addEventListener('click', closeSettingsModal);
settingsOkButton.addEventListener('click', closeSettingsModal);
settingsCancelButton.addEventListener('click', closeSettingsModal);

settingsOverlay.addEventListener('click', (e) => {
  if (e.target === settingsOverlay) {
    closeSettingsModal();
  }
});

masterSlider.addEventListener('input', () => { updateVolumes(); saveSettings(); });
vhsLoopSlider.addEventListener('input', () => { updateVolumes(); saveSettings(); });
sfxSlider.addEventListener('input', () => { updateVolumes(); saveSettings(); });

loadSettings();

// --- Easter Egg Logic ---
let navClickTimestamps: number[] = [];
let isGasterEventActive = false;
const GASTER_CLICK_COUNT = 5;
const GASTER_CLICK_WINDOW = 3000;

function fadeAudioOut(audioElement: HTMLAudioElement, duration = 500): void {
  if (!audioElement || audioElement.volume === 0) {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    return;
  }

  const baseVolume = audioElement.volume;
  const fadeSteps = 20;
  const stepDuration = duration / fadeSteps;
  const volumeStep = baseVolume / fadeSteps;
  let currentVolume = baseVolume;

  const fadeInterval = setInterval(() => {
    currentVolume -= volumeStep;
    if (currentVolume <= 0) {
      currentVolume = 0;
      clearInterval(fadeInterval);
      audioElement.pause();
      audioElement.currentTime = 0;
      updateVolumes(); // Restore volume for next usage
    } else {
      audioElement.volume = currentVolume;
    }
  }, stepDuration);
}

function triggerGasterEvent(): void {
  isGasterEventActive = true;
  navClickTimestamps = [];

  // Stop background noise and disable effects
  document.body.classList.add('easter-egg-active');
  stopSeamlessLoop();

  const overlay = document.getElementById('easter-egg-overlay') as HTMLDivElement;
  overlay.style.display = 'flex';

  // Configure Infinite Loop for Gaster Theme
  sfxAudioElements.gasterTheme.loop = true;

  // Play Sequence
  playAudio(sfxAudioElements.static);
  playAudio(sfxAudioElements.gasterTheme);
  fadeAudioOut(sfxAudioElements.static, 500);
}

// --- Main Logic ---

let currentTrackName: string | null = null;
let isInitialFetch = true;

let isTapeAnimating = false;
const TAPE_ANIMATION_DURATION = 1200;
let tapeCloseTimeout: number | null = null;

function playAudio(audioElement: HTMLAudioElement): void {
  updateVolumes();
  audioElement.currentTime = 0;
  audioElement.play().catch(error => console.log(`Audio play failed: ${error}`));
}

function playSeamlessLoop(): void {
  if (isGasterEventActive) return;
  if (!audioContext || !vhsAudioBuffer || vhsAudioSource) return;
  if (audioContext.state === 'suspended') audioContext.resume();

  vhsAudioSource = audioContext.createBufferSource();
  vhsAudioSource.buffer = vhsAudioBuffer;
  vhsAudioSource.loop = true;
  if (vhsGainNode) {
      vhsAudioSource.connect(vhsGainNode);
  }
  vhsAudioSource.start(0);
}

function stopSeamlessLoop(): void {
  if (vhsAudioSource) {
    vhsAudioSource.stop(0);
    vhsAudioSource.disconnect();
    vhsAudioSource = null;
  }
}

function startSite(): void {
  tapeContainer.style.pointerEvents = 'none';

  if (!audioContext) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioContextClass();
      vhsGainNode = audioContext.createGain();

      updateVolumes();

      vhsGainNode.connect(audioContext.destination);

      fetch('/assets/audios/StaticVHS.wav')
        .then(res => res.arrayBuffer())
        .then(buffer => audioContext!.decodeAudioData(buffer))
        .then(decodedData => {
          vhsAudioBuffer = decodedData;
        })
        .catch(e => console.error('Error loading audio file:', e));
    } catch (e) {
      console.error('Web Audio API not supported', e);
    }
  }

  splashScreen.style.opacity = '0';

  setTimeout(() => {
    splashScreen.style.display = 'none';

    vhsFlash.style.display = 'block';
    vhsFlash.classList.add('flash-animation');
    playAudio(sfxAudioElements.pause);

    setTimeout(() => {
      mainContent.style.display = 'flex';
      setTimeout(() => mainContent.classList.add('show'), 50);
    }, 200);

    setTimeout(() => {
      vhsFlash.style.display = 'none';
      vhsFlash.classList.remove('flash-animation');
    }, 800);

  }, 500);

  sfxAudioElements.pause.addEventListener('ended', () => {
    playSeamlessLoop();
  });

  fetchLastFm();
  setInterval(fetchLastFm, 15000);
}

tapeContainer.addEventListener('mouseenter', () => {
  if (isTapeAnimating) return;

  if (tapeCloseTimeout) clearTimeout(tapeCloseTimeout);
  isTapeAnimating = true;

  tapeImage.src = `/assets/imgs/tapeOpen.gif?t=${new Date().getTime()}`;
  playAudio(sfxAudioElements.vhsOpen);
  splashMessage.style.display = 'block';

  setTimeout(() => {
    isTapeAnimating = false;
  }, TAPE_ANIMATION_DURATION);
});

tapeContainer.addEventListener('mouseleave', () => {
  if (isTapeAnimating) return;

  isTapeAnimating = true;
  tapeImage.src = `/assets/imgs/tapeClose.gif?t=${new Date().getTime()}`;
  playAudio(sfxAudioElements.vhsClose);
  splashMessage.style.display = 'none';

  tapeCloseTimeout = window.setTimeout(() => {
    tapeImage.src = '/assets/imgs/tapeStatic.png';
    isTapeAnimating = false;
  }, TAPE_ANIMATION_DURATION);
});

tapeContainer.addEventListener('click', startSite, { once: true });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopSeamlessLoop();
  } else {
    if (mainContent.style.display === 'flex') {
      playSeamlessLoop();
    }
  }
});

// Visual Effects
function randomGlitch(): void {
  if (isGasterEventActive) return;
  if (Math.random() < 0.1) {
    screenElement.classList.add('chromatic-aberration');
    document.body.style.filter = `hue-rotate(${Math.random() * 360}deg) contrast(${1 + Math.random() * 0.5})`;

    setTimeout(() => {
      document.body.style.filter = 'none';
      screenElement.classList.remove('chromatic-aberration');
    }, 150);
  }
}
setInterval(randomGlitch, 1500);

function createInterferenceLine(): void {
  if (isGasterEventActive) return;
  const line = document.createElement('div');
  line.className = 'interference-line';
  line.style.animationDelay = Math.random() * 3 + 's';
  line.style.animationDuration = (2 + Math.random() * 4) + 's';
  screenElement.appendChild(line);

  setTimeout(() => {
    line.remove();
  }, 7000);
}
setInterval(createInterferenceLine, 8000);

function colorShift(): void {
  if (isGasterEventActive) return;
  if (Math.random() < 0.05) {
    const hue = Math.random() * 60 - 30;
    const brightness = 0.9 + Math.random() * 0.2;
    const contrast = 0.8 + Math.random() * 0.4;

    document.body.style.filter = `hue-rotate(${hue}deg) brightness(${brightness}) contrast(${contrast})`;

    setTimeout(() => {
      document.body.style.filter = 'none';
    }, 200);
  }
}
setInterval(colorShift, 800);

function screenDistortion(): void {
  if (isGasterEventActive) return;
  if (Math.random() < 0.03) {
    const skew = Math.random() * 2 - 1;
    const scale = 0.998 + Math.random() * 0.004;

    screenElement.style.transform = `skewX(${skew}deg) scaleY(${scale})`;

    setTimeout(() => {
      screenElement.style.transform = 'none';
    }, 100);
  }
}
setInterval(screenDistortion, 2000);

const glitchChars = 'ATVNBFN#$@%&*<>()_+[]{}|10?ùÜ║┌ù©åë';

function updateGlitchName(): void {
  if (!glitchNameElement) return;
  let randomText = '';
  for (let i = 0; i < 7; i++) {
    randomText += glitchChars.charAt(Math.floor(Math.random() * glitchChars.length));
  }
  glitchNameElement.textContent = randomText;
}

function showContent(targetId: string, title: string): void {
  const targetPanel = document.getElementById(targetId);
  if (!targetPanel) return;

  if (glitchNameInterval) {
    clearInterval(glitchNameInterval);
    glitchNameInterval = null;
  }

  contentPanels.forEach(panel => {
    panel.style.display = 'none';
  });

  rightPanelTitle.style.animation = 'none';
  rightPanelTitle.textContent = title;
  void rightPanelTitle.offsetHeight; // Trigger reflow
  rightPanelTitle.style.animation = 'marquee 12s linear infinite, titleGlitch 3s infinite';

  staticGif.style.display = 'block';
  playAudio(sfxAudioElements.static);

  screenElement.classList.add('chromatic-aberration');
  document.body.style.filter = 'hue-rotate(180deg) contrast(2)';

  setTimeout(() => {
    staticGif.style.display = 'none';
    sfxAudioElements.static.pause();
    targetPanel.style.display = 'flex';
    screenElement.classList.remove('chromatic-aberration');
    document.body.style.filter = 'none';

    if (targetId === 'about-content') {
      glitchNameInterval = window.setInterval(updateGlitchName, 50);
    }
  }, 300);
}

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();

    if (isGasterEventActive) return;

    const now = new Date().getTime();
    navClickTimestamps.push(now);
    if (navClickTimestamps.length > GASTER_CLICK_COUNT) {
      navClickTimestamps.shift();
    }

    if (navClickTimestamps.length === GASTER_CLICK_COUNT) {
      if (now - navClickTimestamps[0] < GASTER_CLICK_WINDOW) {
        triggerGasterEvent();
        return;
      }
    }

    const targetId = link.getAttribute('data-target');
    const title = link.getAttribute('data-title');
    if (targetId && title) {
      showContent(targetId, title);
    }
  });
});

function triggerTrackChangeGlitch(): void {
  if (isGasterEventActive) return;
  const nowPlayingContent = document.querySelector('.now-playing-content') as HTMLDivElement;
  if (!nowPlayingContent) return;

  playAudio(sfxAudioElements.static);
  nowPlayingContent.classList.add('is-changing');

  setTimeout(() => {
    nowPlayingContent.classList.remove('is-changing');
    sfxAudioElements.static.pause();
    sfxAudioElements.static.currentTime = 0;
  }, 500);
}

function triggerNowPlayingGlitch(): void {
  if (isGasterEventActive) return;
  const nowPlayingContent = document.querySelector('.now-playing-content') as HTMLDivElement;
  if (!nowPlayingContent) return;

  playAudio(sfxAudioElements.musicChange);
  nowPlayingContent.classList.add('is-now-playing-glitch');

  setTimeout(() => {
    nowPlayingContent.classList.remove('is-now-playing-glitch');
  }, 700);
}

// Types for Last.fm response
interface LastFmTrack {
  name: string;
  artist: { '#text': string };
  album: { '#text': string };
  image: { '#text': string }[];
  '@attr'?: { nowplaying: string };
}

interface LastFmResponse {
  recenttracks: {
    track: LastFmTrack[];
  };
  error?: number;
  message?: string;
}

function fetchLastFm(): void {
  // Adjust this URL if your function is hosted elsewhere during dev
  const apiUrl = `/.netlify/functions/get-lastfm`;

  const albumArt = document.getElementById('album-art') as HTMLImageElement;
  const trackTitle = document.getElementById('track-title') as HTMLElement;
  const trackArtist = document.getElementById('track-artist') as HTMLElement;
  const playerStatus = document.querySelector('.player-status') as HTMLElement;

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then((data: LastFmResponse) => {
      if (data.error) throw new Error(`Last.fm API error: ${data.message}`);

      const track = data.recenttracks.track[0];

      if (track) {
        const newTrackName = track.name;
        const isNowPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';

        if (!isInitialFetch && newTrackName !== currentTrackName) {
          if (isNowPlaying) {
            triggerNowPlayingGlitch();
          } else {
            triggerTrackChangeGlitch();
          }
        }
        currentTrackName = newTrackName;
        isInitialFetch = false;

        playerStatus.textContent = isNowPlaying ? 'rec ● now playing' : 'paused ● last played';
        trackTitle.textContent = track.name;
        trackArtist.innerHTML = `${track.artist['#text']}<br>${track.album['#text']}`;

        const newImageUrl = (track.image[2] && track.image[2]['#text'])
          ? track.image[2]['#text']
          : '/assets/imgs/static.gif';

        if (albumArt.src !== newImageUrl) {
          // Only reset to static if actually changing
          if(albumArt.src && !albumArt.src.endsWith('static.gif')) {
             albumArt.src = '/assets/imgs/static.gif';
          }
          
          const imageLoader = new Image();
          imageLoader.onload = () => {
            albumArt.src = newImageUrl;
          };
          imageLoader.onerror = () => {
            albumArt.src = '/assets/imgs/static.gif';
          };
          imageLoader.src = newImageUrl;
        }

      } else {
        playerStatus.textContent = 'rec ● offline';
        trackTitle.textContent = 'Nenhuma atividade';
        trackArtist.textContent = 'Nada encontrado.';
        albumArt.src = '/assets/imgs/static.gif';
      }
    })
    .catch(error => {
      console.error('Erro ao buscar dados do Last.fm:', error);
      playerStatus.textContent = 'rec ● error';
      trackTitle.textContent = 'Falha na Conexão';
      trackArtist.textContent = 'Não foi possível carregar.';
      albumArt.src = '/assets/imgs/static.gif';
      isInitialFetch = false;
    });
}