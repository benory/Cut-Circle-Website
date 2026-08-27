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

  const aboutLightbox = document.querySelector('[data-about-lightbox]');
  const aboutLightboxImage = aboutLightbox?.querySelector('[data-about-lightbox-image]');
  const aboutLightboxClose = aboutLightbox?.querySelector('[data-about-lightbox-close]');
  const aboutGalleryImages = [...document.querySelectorAll('[data-about-gallery-image]')];

  if (aboutLightbox && aboutLightboxImage && typeof aboutLightbox.showModal === 'function') {
    let activeTrigger;
    let currentImageIndex = 0;
    let returnFocusOnClose = false;

    const closeAboutLightbox = () => {
      if (aboutLightbox.open) aboutLightbox.close();
    };

    const showAboutGalleryImage = (index) => {
      currentImageIndex = (index + aboutGalleryImages.length) % aboutGalleryImages.length;
      const trigger = aboutGalleryImages[currentImageIndex];
      aboutLightboxImage.src = trigger.href;
      aboutLightboxImage.alt = trigger.querySelector('img')?.alt || '';
    };

    aboutGalleryImages.forEach((trigger, index) => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        activeTrigger = trigger;
        returnFocusOnClose = event.detail === 0;
        showAboutGalleryImage(index);
        aboutLightbox.showModal();
      });
    });

    aboutLightboxClose?.addEventListener('click', closeAboutLightbox);
    aboutLightbox.addEventListener('click', (event) => {
      if (event.target === aboutLightbox) closeAboutLightbox();
    });
    aboutLightbox.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showAboutGalleryImage(currentImageIndex - 1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showAboutGalleryImage(currentImageIndex + 1);
      }
    });
    aboutLightbox.addEventListener('close', () => {
      aboutLightboxImage.removeAttribute('src');
      if (returnFocusOnClose) activeTrigger?.focus();
      activeTrigger = undefined;
      returnFocusOnClose = false;
    });
  }

  const turnstileWidgets = new WeakMap();

  const renderTurnstileWidget = (container) => {
    if (!container || turnstileWidgets.has(container) || !window.turnstile) return;

    try {
      const widgetId = window.turnstile.render(container, {
        sitekey: container.dataset.sitekey,
        action: container.dataset.action,
        theme: 'light'
      });
      turnstileWidgets.set(container, widgetId);
      delete container.dataset.turnstileFailed;
    } catch (error) {
      container.dataset.turnstileFailed = 'true';
      console.error('Verification could not be rendered:', error);
    }
  };

  const renderVisibleTurnstileWidgets = () => {
    document.querySelectorAll('[data-turnstile-widget]').forEach((container) => {
      const dialog = container.closest('dialog');
      if (!dialog || dialog.open) renderTurnstileWidget(container);
    });
  };

  const resetTurnstileWidget = (container) => {
    if (!container || !window.turnstile || !turnstileWidgets.has(container)) return;
    window.turnstile.reset(turnstileWidgets.get(container));
  };

  window.addEventListener('load', renderVisibleTurnstileWidgets);

  document.querySelectorAll('[data-protected-form]').forEach((form) => {
    const status = form.querySelector('[data-form-status]');
    const submitButton = form.querySelector('[type="submit"]');
    const success = form.parentElement?.querySelector('[data-form-success]');
    const turnstileContainer = form.querySelector('[data-turnstile-widget]');
    const defaultSubmitLabel = submitButton?.dataset.submitLabel || submitButton?.textContent.trim() || 'Submit';

    const setContext = () => {
      const source = form.querySelector('[name="source"]');
      const userAgent = form.querySelector('[name="user_agent"]');
      if (source) source.value = `${document.title} — ${window.location.href}`;
      if (userAgent) userAgent.value = navigator.userAgent;
    };

    const setStatus = (message, modifier = '') => {
      if (!status) return;
      status.className = modifier
        ? `protected-form__status protected-form__status--${modifier}`
        : 'protected-form__status';
      status.textContent = message;
    };

    setContext();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('');

      if (!form.reportValidity()) return;

      const endpoint = form.getAttribute('action')?.trim();
      if (!endpoint) {
        setStatus('This form is not configured yet. Please try again later.', 'error');
        return;
      }

      const turnstileToken = form.querySelector('[name="cf-turnstile-response"]')?.value.trim();
      if (turnstileContainer && !turnstileToken) {
        const verificationLoaded = window.turnstile && turnstileContainer.dataset.turnstileFailed !== 'true';
        const message = verificationLoaded
          ? 'Please complete the verification.'
          : 'Verification could not load. Please refresh the page and try again.';
        setStatus(message, 'error');
        return;
      }

      setContext();
      setStatus('Sending…');
      submitButton.disabled = true;
      submitButton.textContent = 'Sending…';

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.ok) {
          throw new Error(result.error || 'Submission failed');
        }

        form.reset();
        setContext();
        resetTurnstileWidget(turnstileContainer);
        setStatus('');

        if (success) {
          form.hidden = true;
          success.hidden = false;
          success.focus();
          const dialog = form.closest('dialog');
          if (dialog && success.id) dialog.setAttribute('aria-describedby', success.id);
        } else {
          setStatus('Thank you. Your submission has been received.', 'success');
        }
      } catch (error) {
        console.error('Form submission failed:', error);
        resetTurnstileWidget(turnstileContainer);
        setStatus('Sorry, your submission could not be sent. Please try again.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = defaultSubmitLabel;
      }
    });
  });

  const subscribeModal = document.querySelector('#subscribe-modal');
  if (subscribeModal) {
    const subscribeForm = subscribeModal.querySelector('[data-protected-form]');
    const subscribeSuccess = subscribeModal.querySelector('[data-form-success]');
    const firstName = subscribeModal.querySelector('[name="first_name"]');
    let returnFocusElement;

    const openSubscribeModal = (trigger) => {
      returnFocusElement = trigger;
      subscribeForm.hidden = false;
      subscribeSuccess.hidden = true;
      subscribeModal.setAttribute('aria-describedby', 'subscribe-intro');
      const status = subscribeForm.querySelector('[data-form-status]');
      status.className = 'protected-form__status';
      status.textContent = '';
      if (!subscribeModal.open) subscribeModal.showModal();
      document.body.classList.add('subscribe-modal-open');
      window.requestAnimationFrame(() => {
        renderTurnstileWidget(subscribeForm.querySelector('[data-turnstile-widget]'));
        firstName?.focus();
      });
    };

    document.querySelectorAll('[data-subscribe-open]').forEach((trigger) => {
      trigger.addEventListener('click', () => openSubscribeModal(trigger));
    });

    subscribeModal.querySelectorAll('[data-subscribe-close]').forEach((control) => {
      control.addEventListener('click', () => subscribeModal.close());
    });

    subscribeModal.addEventListener('click', (event) => {
      if (event.target === subscribeModal) subscribeModal.close();
    });

    subscribeModal.addEventListener('close', () => {
      document.body.classList.remove('subscribe-modal-open');
      returnFocusElement?.focus();
      returnFocusElement = undefined;
    });
  }

})();
