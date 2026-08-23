(() => {
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
