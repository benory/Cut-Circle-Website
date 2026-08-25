(() => {
  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;

    let url;
    try {
      url = new URL(href, window.location.href);
    } catch (_error) {
      return;
    }

    if (!['http:', 'https:'].includes(url.protocol) || url.origin === window.location.origin) return;

    link.target = '_blank';
    const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    rel.add('noopener');
    link.setAttribute('rel', [...rel].join(' '));
  });

  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.primary-nav');

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
      document.body.classList.toggle('nav-open', !open);
    });
  }

  document.querySelectorAll('.submenu-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.closest('.has-submenu')?.classList.toggle('submenu-open', !open);
    });
  });

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const players = [...document.querySelectorAll('[data-audio-player]')];
  players.forEach((player) => {
    const audio = player.querySelector('audio');
    const play = player.querySelector('.audio-play');
    const mute = player.querySelector('.audio-mute');
    const progress = player.querySelector('.audio-progress');
    const volume = player.querySelector('.audio-volume');
    const current = player.querySelector('.audio-current');
    const duration = player.querySelector('.audio-duration');

    const setPlaying = (playing) => {
      player.classList.toggle('is-playing', playing);
      play.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${player.querySelector('.audio-title').textContent.trim()}`);
    };

    play.addEventListener('click', () => {
      if (audio.paused) {
        players.forEach((other) => {
          const otherAudio = other.querySelector('audio');
          if (otherAudio !== audio) otherAudio.pause();
        });
        audio.play();
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('play', () => setPlaying(true));
    audio.addEventListener('pause', () => setPlaying(false));
    audio.addEventListener('loadedmetadata', () => {
      duration.textContent = formatTime(audio.duration);
      duration.dateTime = `PT${Math.round(audio.duration)}S`;
    });
    audio.addEventListener('timeupdate', () => {
      current.textContent = formatTime(audio.currentTime);
      current.dateTime = `PT${Math.round(audio.currentTime)}S`;
      progress.value = audio.duration ? String((audio.currentTime / audio.duration) * 100) : '0';
    });
    audio.addEventListener('ended', () => setPlaying(false));

    progress.addEventListener('input', () => {
      if (audio.duration) audio.currentTime = (Number(progress.value) / 100) * audio.duration;
    });
    volume.addEventListener('input', () => {
      audio.volume = Number(volume.value);
      audio.muted = audio.volume === 0;
      player.classList.toggle('is-muted', audio.muted);
    });
    mute.addEventListener('click', () => {
      audio.muted = !audio.muted;
      player.classList.toggle('is-muted', audio.muted);
      mute.setAttribute('aria-label', audio.muted ? 'Unmute' : 'Mute');
    });
  });

  document.querySelectorAll('[data-recording-playlist]').forEach((playlist) => {
    const playback = playlist.querySelector('[data-recording-playback]');
    if (!playback) return;

    const audio = playback.querySelector('audio');
    const trackButtons = [...playlist.querySelectorAll('[data-play-excerpt]')];
    const toggle = playback.querySelector('[data-recording-toggle]');
    const previous = playback.querySelector('[data-recording-previous]');
    const next = playback.querySelector('[data-recording-next]');
    const title = playback.querySelector('[data-recording-title]');
    const current = playback.querySelector('[data-recording-current]');
    const duration = playback.querySelector('[data-recording-duration]');
    const progress = playback.querySelector('[data-recording-progress]');
    let activeIndex = -1;

    const activeButton = () => trackButtons[activeIndex];

    const setPlaying = (playing) => {
      playback.classList.toggle('is-playing', playing);
      playlist.querySelectorAll('.recording-track').forEach((row) => row.classList.remove('is-playing'));
      const button = activeButton();
      if (!button) return;
      button.closest('.recording-track')?.classList.toggle('is-playing', playing);
      button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} excerpt from ${button.dataset.title}`);
      toggle.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${button.dataset.title}`);
    };

    const selectTrack = (index, autoplay = true) => {
      if (!trackButtons.length) return;
      activeIndex = (index + trackButtons.length) % trackButtons.length;
      const button = activeButton();
      playlist.querySelectorAll('.recording-track').forEach((row) => row.classList.remove('is-current', 'is-playing'));
      button.closest('.recording-track')?.classList.add('is-current');
      trackButtons.forEach((item) => item.setAttribute('aria-label', `Play excerpt from ${item.dataset.title}`));
      title.textContent = button.dataset.title;
      current.textContent = '00:00';
      duration.textContent = '00:00';
      progress.value = '0';
      audio.src = button.dataset.src;
      playback.hidden = false;
      audio.load();
      if (autoplay) audio.play();
    };

    trackButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        if (activeIndex === index) {
          audio.paused ? audio.play() : audio.pause();
        } else {
          selectTrack(index);
        }
      });
    });

    toggle.addEventListener('click', () => {
      if (activeIndex < 0) selectTrack(0);
      else audio.paused ? audio.play() : audio.pause();
    });
    previous.addEventListener('click', () => selectTrack(activeIndex < 0 ? 0 : activeIndex - 1));
    next.addEventListener('click', () => selectTrack(activeIndex < 0 ? 0 : activeIndex + 1));
    progress.addEventListener('input', () => {
      if (audio.duration) audio.currentTime = (Number(progress.value) / 100) * audio.duration;
    });

    audio.addEventListener('play', () => {
      players.forEach((player) => player.querySelector('audio')?.pause());
      document.querySelectorAll('[data-recording-playback] audio').forEach((other) => {
        if (other !== audio) other.pause();
      });
      setPlaying(true);
    });
    audio.addEventListener('pause', () => setPlaying(false));
    audio.addEventListener('loadedmetadata', () => {
      duration.textContent = formatTime(audio.duration);
      duration.dateTime = `PT${Math.round(audio.duration)}S`;
    });
    audio.addEventListener('timeupdate', () => {
      current.textContent = formatTime(audio.currentTime);
      current.dateTime = `PT${Math.round(audio.currentTime)}S`;
      progress.value = audio.duration ? String((audio.currentTime / audio.duration) * 100) : '0';
    });
    audio.addEventListener('ended', () => selectTrack(activeIndex + 1));
  });

  const searchForm = document.querySelector('[data-site-search]');
  const searchResults = document.querySelector('[data-search-results]');

  if (searchForm && searchResults) {
    const input = searchForm.querySelector('input[type="search"]');
    let searchIndex;

    const getIndex = async () => {
      if (!searchIndex) {
        const response = await fetch('/search.json');
        if (!response.ok) throw new Error('Search index unavailable');
        searchIndex = await response.json();
      }
      return searchIndex;
    };

    const renderResults = (query, results) => {
      searchResults.replaceChildren();
      const summary = document.createElement('p');
      summary.className = 'search-results__summary';
      summary.textContent = results.length
        ? `${results.length} result${results.length === 1 ? '' : 's'} for “${query}”`
        : `No results for “${query}”`;
      searchResults.append(summary);

      results.forEach((result) => {
        const article = document.createElement('article');
        article.className = 'search-result';
        const meta = document.createElement('p');
        meta.className = 'search-result__meta';
        meta.textContent = result.section;
        const heading = document.createElement('h2');
        const link = document.createElement('a');
        link.href = result.url;
        link.textContent = result.title;
        heading.append(link);
        const excerpt = document.createElement('p');
        excerpt.textContent = result.excerpt;
        article.append(meta, heading, excerpt);
        searchResults.append(article);
      });
    };

    const search = async (query) => {
      const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
      if (!terms.length) {
        searchResults.replaceChildren();
        return;
      }

      try {
        const index = await getIndex();
        const matches = index.map((item) => {
          const title = item.title.toLocaleLowerCase();
          const excerpt = item.excerpt.toLocaleLowerCase();
          const content = item.content.toLocaleLowerCase();
          const matchesAll = terms.every((term) => title.includes(term) || excerpt.includes(term) || content.includes(term));
          const score = terms.reduce((total, term) => total + (title.includes(term) ? 5 : 0) + (excerpt.includes(term) ? 2 : 0) + (content.includes(term) ? 1 : 0), 0);
          return matchesAll ? { ...item, score } : null;
        }).filter(Boolean).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
        renderResults(query, matches);
      } catch (_error) {
        searchResults.innerHTML = '<p>Search is temporarily unavailable.</p>';
      }
    };

    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = input.value.trim();
      const url = new URL(window.location.href);
      query ? url.searchParams.set('q', query) : url.searchParams.delete('q');
      window.history.replaceState({}, '', url);
      search(query);
    });

    const initialQuery = new URLSearchParams(window.location.search).get('q');
    if (initialQuery) {
      input.value = initialQuery;
      search(initialQuery);
    }
  }

  const contactForm = document.querySelector('[data-contact-form]');
  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(contactForm);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const message = String(data.get('message') || '').trim();
      const subject = `Website message from ${name}`;
      const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
      window.location.href = `mailto:info@cutcircle.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  const givingForm = document.querySelector('[data-giving-form]');
  if (givingForm) {
    const amountOptions = [...givingForm.querySelectorAll('input[name="amount"]')];
    const customAmount = givingForm.querySelector('[name="custom_amount"]');

    customAmount.addEventListener('input', () => {
      if (customAmount.value) amountOptions.forEach((option) => { option.checked = false; });
    });
    amountOptions.forEach((option) => option.addEventListener('change', () => { customAmount.value = ''; }));

    givingForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const selected = amountOptions.find((option) => option.checked)?.value;
      const amount = customAmount.value ? `$${customAmount.value}` : selected || 'an amount to be determined';
      const subject = `Supporting Cut Circle — ${amount}`;
      const body = `I would like to arrange a gift of ${amount} to Cut Circle. Please send me secure payment instructions.`;
      window.location.href = `mailto:info@cutcircle.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();
