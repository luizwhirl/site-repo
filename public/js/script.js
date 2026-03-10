let aaaaaMode = false;

const splashScreen = document.getElementById('splash-screen');
const tapeContainer = document.getElementById('tape-container');
const tapeImage = document.getElementById('tape-image');
const splashMessage = document.querySelector('.splash-message');

const mainContent = document.getElementById('main-content');
const vhsFlash = document.getElementById('vhs-flash');
const staticGif = document.getElementById('static-gif');
const navLinks = document.querySelectorAll('.nav-menu a');
const contentPanels = document.querySelectorAll('.content-panel');
const rightPanelTitle = document.getElementById('right-panel-title');
const screen = document.querySelector('.screen');

const glitchNameElement = document.getElementById('glitch-name');
let glitchNameInterval = null;

const sfxBaseVolumes = {
    vhsOpen: 0.5,
    vhsClose: 0.5,
    pause: 0.4,
    static: 0.4,
    musicChange: 0.6,
    settingsOpen: 0.5, 
    settingsClose: 0.5,
    gasterTheme: 0.7 
};

const sfxAudioElements = {
    vhsOpen: document.getElementById('vhs-open-sound'),
    vhsClose: document.getElementById('vhs-close-sound'),
    pause: document.getElementById('pause-sound'),
    static: document.getElementById('static-sound'),
    musicChange: document.getElementById('music-change-sound'),
    settingsOpen: document.getElementById('settings-open-sound'), 
    settingsClose: document.getElementById('settings-close-sound'),
    gasterTheme: document.getElementById('gaster-theme-sound') 
};

const settingsOverlay = document.getElementById('settings-modal-overlay');
const settingsButton = document.getElementById('settings-button');
const settingsCloseButton = document.getElementById('settings-close-button');
const settingsOkButton = document.getElementById('settings-ok-button');
const settingsCancelButton = document.getElementById('settings-cancel-button');
const settingsResetButton = document.getElementById('settings-reset-button');

const masterSlider = document.getElementById('master-volume');
const vhsLoopSlider = document.getElementById('vhs-loop-volume');
const sfxSlider = document.getElementById('sfx-volume');

const videoBrightnessSlider = document.getElementById('video-brightness');
const videoGlowSlider = document.getElementById('video-glow');
const videoScanlinesSlider = document.getElementById('video-scanlines');
const videoBlurSlider = document.getElementById('video-blur');
const crtFlickerToggle = document.getElementById('toggle-crt-flicker');
const randomGlitchesToggle = document.getElementById('toggle-random-glitches');

let allowRandomGlitches = true;

const kalimbaAudio = document.getElementById('kalimba-sound');
const kalimbaCheckbox = document.getElementById('kalimba-checkbox');
const kalimbaBackground = document.getElementById('kalimba-background');
let isKalimbaActive = false;

const settingsTabs = document.querySelectorAll('.settings-tab');
const tabPanes = document.querySelectorAll('.tab-pane');

settingsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        if (!target) return;

        settingsTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        tabPanes.forEach(pane => {
            pane.classList.remove('active');
            if (pane.id === `tab-${target}`) {
                pane.classList.add('active');
            }
        });
    });
});

let audioContext;
let vhsAudioBuffer;
let vhsAudioSource = null;
let vhsGainNode; 

function saveSettings() {
    localStorage.setItem('atvn-masterVolume', masterSlider.value);
    localStorage.setItem('atvn-vhsVolume', vhsLoopSlider.value);
    localStorage.setItem('atvn-sfxVolume', sfxSlider.value);
    
    localStorage.setItem('atvn-video-brightness', videoBrightnessSlider.value);
    localStorage.setItem('atvn-video-glow', videoGlowSlider.value);
    localStorage.setItem('atvn-video-scanlines', videoScanlinesSlider.value);
    localStorage.setItem('atvn-video-blur', videoBlurSlider.value);
    localStorage.setItem('atvn-video-flicker', crtFlickerToggle.checked);
    localStorage.setItem('atvn-video-glitches', randomGlitchesToggle.checked);
}

function loadSettings() {
    const masterVol = localStorage.getItem('atvn-masterVolume');
    const vhsVol = localStorage.getItem('atvn-vhsVolume');
    const sfxVol = localStorage.getItem('atvn-sfxVolume');

    if (masterVol !== null) masterSlider.value = masterVol;
    if (vhsVol !== null) vhsLoopSlider.value = vhsVol;
    if (sfxVol !== null) sfxSlider.value = sfxVol;
    
    const vBright = localStorage.getItem('atvn-video-brightness');
    const vGlow = localStorage.getItem('atvn-video-glow');
    const vScan = localStorage.getItem('atvn-video-scanlines');
    const vBlur = localStorage.getItem('atvn-video-blur');
    const crtFlicker = localStorage.getItem('atvn-video-flicker');
    const randomGlitches = localStorage.getItem('atvn-video-glitches');

    if (vBright !== null) videoBrightnessSlider.value = vBright;
    if (vGlow !== null) videoGlowSlider.value = vGlow;
    if (vScan !== null) videoScanlinesSlider.value = vScan;
    if (vBlur !== null) videoBlurSlider.value = vBlur;
    if (crtFlicker !== null) crtFlickerToggle.checked = crtFlicker === 'true';
    if (randomGlitches !== null) randomGlitchesToggle.checked = randomGlitches === 'true';

    updateVolumes(); 
    updateVideoSettings();
}

function updateVolumes() {
    const masterVol = parseFloat(masterSlider.value);
    const vhsLoopVol = parseFloat(vhsLoopSlider.value);
    const sfxVol = parseFloat(sfxSlider.value);

    if (vhsGainNode) {
        vhsGainNode.gain.value = vhsLoopVol * masterVol;
    }

    for (const key in sfxAudioElements) {
        if (sfxAudioElements[key]) {
            sfxAudioElements[key].volume = (sfxBaseVolumes[key] || 0.5) * sfxVol * masterVol;
        }
    }
    if (kalimbaAudio) {
        kalimbaAudio.baseVolume = 1.0 * masterVol;
    }
}

function updateVideoSettings() {
    document.documentElement.style.setProperty('--site-brightness', videoBrightnessSlider.value);
    document.documentElement.style.setProperty('--box-glow-alpha', videoGlowSlider.value);
    document.documentElement.style.setProperty('--scanline-alpha', videoScanlinesSlider.value);
    document.documentElement.style.setProperty('--blur-mult', videoBlurSlider.value);

    if (!crtFlickerToggle.checked) document.body.classList.add('disable-flicker');
    else document.body.classList.remove('disable-flicker');

    allowRandomGlitches = randomGlitchesToggle.checked;
}

function resetSettings() {
    const activeTabPane = document.querySelector('.tab-pane.active');
    if (!activeTabPane) return;

    if (activeTabPane.id === 'tab-audio') {
        masterSlider.value = 0.7;
        vhsLoopSlider.value = 0.3;
        sfxSlider.value = 0.8;
        updateVolumes();
    } else if (activeTabPane.id === 'tab-video') {
        videoBrightnessSlider.value = 0.95;
        videoGlowSlider.value = 0.3;
        videoScanlinesSlider.value = 0.04;
        videoBlurSlider.value = 1;
        crtFlickerToggle.checked = true;
        randomGlitchesToggle.checked = true;
        updateVideoSettings();
    } else if (activeTabPane.id === 'tab-kali') {
        kalimbaCheckbox.checked = false;
    }

    saveSettings();
}

[videoBrightnessSlider, videoGlowSlider, videoScanlinesSlider, videoBlurSlider, crtFlickerToggle, randomGlitchesToggle].forEach(input => {
    if(input) {
        input.addEventListener('input', () => {
            updateVideoSettings();
            saveSettings();
        });
        input.addEventListener('change', () => {
            updateVideoSettings();
            saveSettings();
        });
    }
});

function openSettingsModal() {
    settingsOverlay.style.display = 'flex';
    playAudio(sfxAudioElements.settingsOpen); 
}

function closeSettingsModal(isOk = false) {
    settingsOverlay.style.display = 'none';
    playAudio(sfxAudioElements.settingsClose);

    if (isOk && kalimbaCheckbox.checked && !isKalimbaActive) {
        startKalimbaSequence();
    }
}

function startKalimbaSequence() {
    isKalimbaActive = true;
    stopSeamlessLoop();

    kalimbaBackground.style.opacity = '1';

    kalimbaAudio.currentTime = 0;
    kalimbaAudio.volume = 0;
    kalimbaAudio.play();
    
    const targetVol = kalimbaAudio.baseVolume || parseFloat(masterSlider.value);
    fadeInAudio(kalimbaAudio, targetVol, 2000);

    if (kalimbaAudio.duration) {
        scheduleKalimbaEnd(kalimbaAudio.duration);
    } else {
        kalimbaAudio.onloadedmetadata = () => {
            scheduleKalimbaEnd(kalimbaAudio.duration);
        };
    }
}

function scheduleKalimbaEnd(duration) {
    const durationMs = duration * 1000;
    const fadeOutStartMs = Math.max(0, durationMs - 2000);

    setTimeout(() => {
        fadeOutAudio(kalimbaAudio, 2000);
        kalimbaBackground.style.opacity = '0';
    }, fadeOutStartMs);

    setTimeout(() => {
        endKalimbaSequence();
    }, durationMs);
}

function endKalimbaSequence() {
    isKalimbaActive = false;
    kalimbaCheckbox.checked = false;
    
    if (!document.hidden) {
        playSeamlessLoop();
    }
}

function fadeInAudio(audio, targetVolume, duration) {
    const steps = 20;
    const stepTime = duration / steps;
    const volStep = targetVolume / steps;
    let currentVol = 0;
    
    const interval = setInterval(() => {
        currentVol += volStep;
        if (currentVol >= targetVolume) {
            currentVol = targetVolume;
            clearInterval(interval);
        }
        audio.volume = currentVol;
    }, stepTime);
}

function fadeOutAudio(audio, duration) {
    const steps = 20;
    const stepTime = duration / steps;
    const startVol = audio.volume;
    const volStep = startVol / steps;
    
    const interval = setInterval(() => {
        audio.volume = Math.max(0, audio.volume - volStep);
        if (audio.volume <= 0) {
            clearInterval(interval);
            audio.pause();
        }
    }, stepTime);
}

settingsButton.addEventListener('click', openSettingsModal);
settingsCloseButton.addEventListener('click', () => closeSettingsModal(false));
settingsOkButton.addEventListener('click', () => closeSettingsModal(true));
settingsCancelButton.addEventListener('click', () => closeSettingsModal(false));
settingsResetButton.addEventListener('click', resetSettings);

settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) {
        closeSettingsModal(false);
    }
});

masterSlider.addEventListener('input', () => {
    updateVolumes();
    saveSettings();
});
vhsLoopSlider.addEventListener('input', () => {
    updateVolumes();
    saveSettings();
});
sfxSlider.addEventListener('input', () => {
    updateVolumes();
    saveSettings();
});

loadSettings();

let navClickTimestamps = [];
let isGasterEventActive = false;
const GASTER_CLICK_COUNT = 5;
const GASTER_CLICK_WINDOW = 3000;

function fadeAudioOut(audioElement, duration = 500) {
    if (!audioElement || audioElement.volume === 0) {
        if(audioElement) {
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
            updateVolumes(); 
        }
        audioElement.volume = currentVolume;
    }, stepDuration);
}

function triggerGasterEvent() {
    if (isKalimbaActive) return;

    isGasterEventActive = true;
    navClickTimestamps = []; 

    document.body.classList.add('easter-egg-active');
    stopSeamlessLoop();

    const overlay = document.getElementById('easter-egg-overlay');
    overlay.style.display = 'flex';
    
    sfxAudioElements.gasterTheme.loop = true;
    
    playAudio(sfxAudioElements.static);
    playAudio(sfxAudioElements.gasterTheme);
    fadeAudioOut(sfxAudioElements.static, 500);
}

let currentTrackName = null;
let isInitialFetch = true;

let isTapeAnimating = false;
const TAPE_ANIMATION_DURATION = 1200;
let tapeCloseTimeout = null;

function playAudio(audioElement) {
    if (isKalimbaActive) {
        const allowedIds = ['music-change-sound', 'static-sound', 'settings-open-sound', 'settings-close-sound'];
        if (!allowedIds.includes(audioElement.id)) {
            return;
        }
    }

    updateVolumes(); 
    audioElement.currentTime = 0;
    audioElement.play().catch(error => console.log(`Audio play failed: ${error}`));
}

function playSeamlessLoop() {
    if (isGasterEventActive || isKalimbaActive) return;
    if (!audioContext || !vhsAudioBuffer || vhsAudioSource) return;
    if (audioContext.state === 'suspended') audioContext.resume();
    
    vhsAudioSource = audioContext.createBufferSource();
    vhsAudioSource.buffer = vhsAudioBuffer;
    vhsAudioSource.loop = true;
    vhsAudioSource.connect(vhsGainNode);
    vhsAudioSource.start(0);
}

function stopSeamlessLoop() {
    if (vhsAudioSource) {
        vhsAudioSource.stop(0);
        vhsAudioSource.disconnect();
        vhsAudioSource = null;
    }
}

function startSite() {
    tapeContainer.style.pointerEvents = 'none';

    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            vhsGainNode = audioContext.createGain();
            
            updateVolumes(); 
            
            vhsGainNode.connect(audioContext.destination);

            fetch('assets/audios/StaticVHS.wav')
                .then(res => res.arrayBuffer())
                .then(buffer => audioContext.decodeAudioData(buffer))
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
    
    clearTimeout(tapeCloseTimeout);
    isTapeAnimating = true;

    tapeImage.src = `assets/imgs/tapeOpen.gif?t=${new Date().getTime()}`;
    playAudio(sfxAudioElements.vhsOpen);
    splashMessage.style.display = 'block';

    setTimeout(() => {
        isTapeAnimating = false;
    }, TAPE_ANIMATION_DURATION);
});

tapeContainer.addEventListener('mouseleave', () => {
    if (isTapeAnimating) return;

    isTapeAnimating = true;
    tapeImage.src = `assets/imgs/tapeClose.gif?t=${new Date().getTime()}`;
    playAudio(sfxAudioElements.vhsClose);
    splashMessage.style.display = 'none';

    tapeCloseTimeout = setTimeout(() => {
        tapeImage.src = 'assets/imgs/tapeStatic.png';
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

function randomGlitch() {
    if (!allowRandomGlitches || isGasterEventActive || isKalimbaActive) return;
    if (Math.random() < 0.1) {
        screen.classList.add('chromatic-aberration');
        document.body.style.filter = `hue-rotate(${Math.random() * 360}deg) contrast(${1 + Math.random() * 0.5})`;
        
        setTimeout(() => {
            document.body.style.filter = 'none';
            screen.classList.remove('chromatic-aberration');
        }, 150);
    }
}
setInterval(randomGlitch, 1500);

function createInterferenceLine() {
    if (!allowRandomGlitches || isGasterEventActive || isKalimbaActive) return;
    const line = document.createElement('div');
    line.className = 'interference-line';
    line.style.animationDelay = Math.random() * 3 + 's';
    line.style.animationDuration = (2 + Math.random() * 4) + 's';
    screen.appendChild(line);
    
    setTimeout(() => {
        line.remove();
    }, 7000);
}
setInterval(createInterferenceLine, 8000);

function colorShift() {
    if (!allowRandomGlitches || isGasterEventActive || isKalimbaActive) return;
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

const glitchChars = 'ATVNBFN#$@%&*<>()_+[]{}|10?ùÜ║┌ù©åë';

function updateGlitchName() {
    if (!glitchNameElement) return;
    if (aaaaaMode) {
        glitchNameElement.textContent = 'あああああああ';
        return;
    }
    let randomText = '';
    for (let i = 0; i < 7; i++) {
        randomText += glitchChars.charAt(Math.floor(Math.random() * glitchChars.length));
    }
    glitchNameElement.textContent = randomText;
}

function showContent(targetId, title) {
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
    rightPanelTitle.offsetHeight;
    rightPanelTitle.style.animation = 'marquee 12s linear infinite, titleGlitch 3s infinite';

    staticGif.style.display = 'block';
    playAudio(sfxAudioElements.static);

    screen.classList.add('chromatic-aberration');
    document.body.style.filter = 'hue-rotate(180deg) contrast(2)';

    setTimeout(() => {
        staticGif.style.display = 'none';
        sfxAudioElements.static.pause();
        targetPanel.style.display = 'flex'; 
        screen.classList.remove('chromatic-aberration');
        document.body.style.filter = 'none';
        
        if (targetId === 'about-content') {
            glitchNameInterval = setInterval(updateGlitchName, 50);
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
        showContent(targetId, title);
    });
});

function screenDistortion() {
    if (!allowRandomGlitches || isGasterEventActive || isKalimbaActive) return;
    if (Math.random() < 0.03) {
        const skew = Math.random() * 2 - 1;
        const scale = 0.998 + Math.random() * 0.004;
        
        screen.style.transform = `skewX(${skew}deg) scaleY(${scale})`;
        
        setTimeout(() => {
            screen.style.transform = 'none';
        }, 100);
    }
}
setInterval(screenDistortion, 2000);

function triggerTrackChangeGlitch() {
    if (isGasterEventActive) return;
    const nowPlayingContent = document.querySelector('.now-playing-content');
    if (!nowPlayingContent) return;

    playAudio(sfxAudioElements.static);
    nowPlayingContent.classList.add('is-changing');

    setTimeout(() => {
        nowPlayingContent.classList.remove('is-changing');
        sfxAudioElements.static.pause();
        sfxAudioElements.static.currentTime = 0;
    }, 500);
}

function triggerNowPlayingGlitch() {
    if (isGasterEventActive) return;
    const nowPlayingContent = document.querySelector('.now-playing-content');
    if (!nowPlayingContent) return;

    playAudio(sfxAudioElements.musicChange);
    nowPlayingContent.classList.add('is-now-playing-glitch');

    setTimeout(() => {
        nowPlayingContent.classList.remove('is-now-playing-glitch');
    }, 700);
}

function fetchLastFm() {
    const apiUrl = `/.netlify/functions/get-lastfm`;

    const albumArt = document.getElementById('album-art');
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    const playerStatus = document.querySelector('.player-status');

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(`Last.fm API error: ${data.message}`);
            }

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
                                    : 'assets/imgs/static.gif';

                if (albumArt.src !== newImageUrl) {
                    albumArt.src = 'assets/imgs/static.gif';

                    const imageLoader = new Image();
                    
                    imageLoader.onload = () => {
                        albumArt.src = newImageUrl;
                    };

                    imageLoader.onerror = () => {
                        albumArt.src = 'assets/imgs/static.gif';
                    };

                    imageLoader.src = newImageUrl;
                }

            } else {
                playerStatus.textContent = 'rec ● offline';
                trackTitle.textContent = 'Nenhuma atividade';
                trackArtist.textContent = 'Nada encontrado.';
                albumArt.src = 'assets/imgs/static.gif'; 
            }
        })
        .catch(error => {
            console.error('Erro ao buscar dados do Last.fm:', error);
            playerStatus.textContent = 'rec ● error';
            trackTitle.textContent = 'Falha na Conexão';
            trackArtist.textContent = 'Não foi possível carregar.';
            albumArt.src = 'assets/imgs/static.gif';
            isInitialFetch = false;
        });
}

function convertToA(text) {
    return text.replace(/[a-zA-ZÀ-ÿ]/g, 'あ');
}

function replaceTextWithA(node) {
    if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE') return;
    if (node.nodeType === Node.TEXT_NODE) {
        const newText = convertToA(node.textContent);
        if (node.textContent !== newText) {
            node.textContent = newText;
        }
    } else {
        node.childNodes.forEach(replaceTextWithA);
    }
}

const secretAaaa = document.getElementById('secret-aaaa');
if (secretAaaa) {
    secretAaaa.addEventListener('click', () => {
        if (aaaaaMode) return;
        aaaaaMode = true;
        
        replaceTextWithA(document.body);
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    replaceTextWithA(node);
                });
                if (mutation.type === 'characterData') {
                    const newText = convertToA(mutation.target.textContent);
                    if (mutation.target.textContent !== newText) {
                        mutation.target.textContent = newText;
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    });
}