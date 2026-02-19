import { soundManager } from '../../audio/SoundManager.js';

export function showSettingsModal(): void {
  const backdrop = document.createElement('div');
  backdrop.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 300;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.style.cssText = `
    min-width: 320px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
  `;

  const header = document.createElement('div');
  header.className = 'panel-header';
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
  header.innerHTML = `<h3 style="margin: 0;">⚙️ Settings</h3>`;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn-subtle';
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'padding: 4px 10px; font-size: 1rem;';
  closeBtn.addEventListener('click', () => close());

  header.appendChild(closeBtn);
  panel.appendChild(header);

  const content = document.createElement('div');
  content.style.cssText = 'display: flex; flex-direction: column; gap: 20px;';

  // Master Volume
  const masterRow = document.createElement('div');
  masterRow.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';
  masterRow.innerHTML = `
    <label style="color: var(--ink); font-size: 0.9rem;">Master Volume</label>
    <input type="range" min="0" max="100" value="${Math.round(soundManager.getMasterVolume() * 100)}"
      style="accent-color: var(--gold); width: 100%;" data-setting="masterVolume" />
  `;
  const masterInput = masterRow.querySelector('input')!;
  masterInput.addEventListener('input', () => {
    const v = Number(masterInput.value) / 100;
    soundManager.setMasterVolume(v);
    soundManager.saveSettings();
    soundManager.playSliderPreview();
  });
  content.appendChild(masterRow);

  // Music Volume
  const musicRow = document.createElement('div');
  musicRow.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';
  musicRow.innerHTML = `
    <label style="color: var(--ink); font-size: 0.9rem;">Music Volume</label>
    <input type="range" min="0" max="100" value="${Math.round(soundManager.getMusicVolume() * 100)}"
      style="accent-color: var(--gold); width: 100%;" data-setting="musicVolume" />
  `;
  const musicInput = musicRow.querySelector('input')!;
  musicInput.addEventListener('input', () => {
    const v = Number(musicInput.value) / 100;
    soundManager.setMusicVolume(v);
    soundManager.saveSettings();
    soundManager.playSliderPreview();
  });
  content.appendChild(musicRow);

  // Mute
  const muteRow = document.createElement('div');
  muteRow.style.cssText = 'display: flex; align-items: center; gap: 8px;';
  muteRow.innerHTML = `
    <input type="checkbox" id="settings-mute" ${soundManager.getMuted() ? 'checked' : ''}
      style="accent-color: var(--gold); width: 18px; height: 18px;" />
    <label for="settings-mute" style="color: var(--ink); font-size: 0.9rem; cursor: pointer;">Mute all sound</label>
  `;
  const muteCheck = muteRow.querySelector('input')!;
  muteCheck.addEventListener('change', () => {
    soundManager.setMuted(muteCheck.checked);
    soundManager.saveSettings();
  });
  content.appendChild(muteRow);

  // Music track selector
  const trackRow = document.createElement('div');
  trackRow.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
  trackRow.innerHTML = `
    <label style="color: var(--ink); font-size: 0.9rem;">Background Music</label>
    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
      <button type="button" class="btn btn-subtle" data-action="prev" style="padding: 6px 12px;">◀ Prev</button>
      <select data-setting="track" style="
        flex: 1;
        min-width: 140px;
        padding: 8px 12px;
        background: var(--parchment-light);
        border: 1px solid var(--parchment-lighter);
        border-radius: var(--radius-sm);
        color: var(--ink);
        font-family: var(--font-body);
        font-size: 0.9rem;
      "></select>
      <button type="button" class="btn btn-subtle" data-action="next" style="padding: 6px 12px;">Next ▶</button>
    </div>
  `;

  const trackSelect = trackRow.querySelector('select')!;
  const prevBtn = trackRow.querySelector('[data-action="prev"]')!;
  const nextBtn = trackRow.querySelector('[data-action="next"]')!;

  async function populateTracks(): Promise<void> {
    const tracks = await soundManager.fetchMusicTracks();
    trackSelect.innerHTML = '';
    tracks.forEach((filename, i) => {
      const opt = document.createElement('option');
      opt.value = filename;
      opt.textContent = filename;
      opt.selected = i === soundManager.getSelectedTrackIndex();
      trackSelect.appendChild(opt);
    });
    if (tracks.length === 0) {
      const opt = document.createElement('option');
      opt.textContent = 'No tracks';
      opt.disabled = true;
      trackSelect.appendChild(opt);
    }
  }

  prevBtn.addEventListener('click', async () => {
    await soundManager.playPrevTrack();
    await populateTracks();
  });
  nextBtn.addEventListener('click', async () => {
    await soundManager.playNextTrack();
    await populateTracks();
  });
  trackSelect.addEventListener('change', async () => {
    await soundManager.playMusicByFilename(trackSelect.value);
    soundManager.saveSettings();
  });

  populateTracks();
  content.appendChild(trackRow);

  panel.appendChild(content);
  backdrop.appendChild(panel);

  function close(): void {
    backdrop.remove();
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  soundManager.play('settings_open');
  document.body.appendChild(backdrop);
}
