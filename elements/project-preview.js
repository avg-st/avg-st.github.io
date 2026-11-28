(() => {
  const cards = [...document.querySelectorAll('.project-filter-card')]
  if (!cards.length) return

  const dialog = document.createElement('dialog')
  dialog.className = 'project-preview'
  dialog.setAttribute('aria-labelledby', 'project-preview-title')
  dialog.innerHTML = '<header class="project-preview-header"><h2 id="project-preview-title"></h2><button class="project-preview-close" type="button" aria-label="Close project preview" autofocus>×</button></header><img class="project-preview-image" alt="">'
  document.body.append(dialog)

  const image = dialog.querySelector('img')
  const heading = dialog.querySelector('h2')
  const close = dialog.querySelector('button')
  const hover = matchMedia('(hover:hover) and (pointer:fine)')

  const floatingImage = document.createElement('img')
  floatingImage.className = 'project-hover-image'
  floatingImage.alt = ''
  floatingImage.setAttribute('aria-hidden', 'true')
  // Помещаем в тот же контекст наложения, что и .l-header (z-index: 100), чтобы картинка (z-index: 90) всегда была под шапкой
  ;(document.getElementById('large-header') || document.body).append(floatingImage)

  let active = null
  let hovering = null
  let desiredCard = null
  let phase = 'idle' // 'idle' | 'entering' | 'shown' | 'leaving'
  let hoverFrame = 0
  let animationTimer = 0
  let cleanupTransition = null
  let lastPointer = null

  // Отменяем активное ожидание завершения CSS-перехода
  const clearTransitionWait = () => {
    cancelAnimationFrame(hoverFrame)
    hoverFrame = 0
    clearTimeout(animationTimer)
    animationTimer = 0
    if (cleanupTransition) {
      cleanupTransition()
      cleanupTransition = null
    }
  }

  // Вычисляем длительность CSS-перехода transform в миллисекундах
  const getTransformDurationMs = () => {
    const styles = getComputedStyle(floatingImage)
    const properties = styles.transitionProperty.split(',').map(item => item.trim())
    const durations = styles.transitionDuration.split(',').map(value => {
      const trimmed = value.trim()
      return parseFloat(trimmed) * (trimmed.endsWith('ms') ? 1 : 1000)
    })
    const transformIndex = properties.indexOf('transform')
    const duration = transformIndex >= 0 ? durations[transformIndex] : durations[0]
    return Number.isFinite(duration) ? duration : 0
  }

  // Ждём фактического завершения анимации transform (transitionend + страхующий таймер)
  const waitForTransformEnd = callback => {
    clearTransitionWait()
    const durationMs = getTransformDurationMs()
    const currentTransform = getComputedStyle(floatingImage).transform
    const isIdentity = currentTransform === 'none' || currentTransform === 'matrix(1, 0, 0, 1, 0, 0)'

    if (durationMs <= 0 || (phase === 'leaving' && isIdentity)) {
      callback()
      return
    }

    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      clearTransitionWait()
      callback()
    }

    const handleTransitionEnd = event => {
      if (event.target !== floatingImage || event.propertyName !== 'transform') return
      finish()
    }

    floatingImage.addEventListener('transitionend', handleTransitionEnd)
    cleanupTransition = () => {
      floatingImage.removeEventListener('transitionend', handleTransitionEnd)
    }
    animationTimer = setTimeout(finish, durationMs + 50)
  }

  // Вычисляем целевой transform для перемещения изображения в центр свободной области под шапкой
  const getTargetTransform = card => {
    const source = card.querySelector('img')
    const rect = source.getBoundingClientRect()
    const header = document.querySelector('.l-header')
    const safeTop = header ? Math.max(0, header.getBoundingClientRect().bottom + 16) : 0
    const availableHeight = Math.max(120, innerHeight - safeTop - 24)
    const scale = Math.min(innerWidth * .8 / rect.width, availableHeight * .88 / rect.height, 2.8)
    const targetCenterY = safeTop + availableHeight / 2
    const x = innerWidth / 2 - rect.left - rect.width / 2
    const y = targetCenterY - rect.top - rect.height / 2
    return { rect, source, transform: `translate(${x}px, ${y}px) scale(${scale})` }
  }

  // Мгновенный сброс при скролле, ресайзе или открытии модального окна
  const hideHover = () => {
    desiredCard = null
    clearTransitionWait()
    phase = 'idle'
    floatingImage.classList.remove('is-visible', 'is-expanded')
    floatingImage.style.transform = 'none'
    hovering?.classList.remove('is-image-hovered')
    hovering = null
  }

  // Запуск анимации вылета изображения из карточки в центр экрана
  const showHover = card => {
    clearTransitionWait()
    hovering = card
    phase = 'entering'

    const { rect, source, transform } = getTargetTransform(card)

    // Позиционируем клон поверх исходной картинки без перехода
    floatingImage.style.transition = 'none'
    floatingImage.src = source.src
    Object.assign(floatingImage.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      transform: 'none'
    })
    // Фиксируем начальное положение до включения transition
    void floatingImage.offsetWidth
    floatingImage.style.transition = ''

    hoverFrame = requestAnimationFrame(() => {
      hoverFrame = 0
      // Прерываем только при принудительном сбросе (скролл, ресайз, открытие диалога)
      if (phase !== 'entering' || hovering !== card || dialog.open) return
      // В одном кадре скрываем оригинал и показываем клон, чтобы не было мерцания
      card.classList.add('is-image-hovered')
      floatingImage.classList.add('is-visible', 'is-expanded')
      floatingImage.style.transform = transform

      waitForTransformEnd(() => {
        if (phase !== 'entering' || hovering !== card) return
        phase = 'shown'
        reconcileHover()
      })
    })
  }

  // Синхронизируем позицию клона с карточкой при скролле без прерывания анимации
  const syncFloatingPosition = () => {
    if (!hovering || phase === 'idle') return
    const { rect, transform } = getTargetTransform(hovering)
    floatingImage.style.left = `${rect.left}px`
    floatingImage.style.top = `${rect.top}px`

    if (phase === 'shown') {
      floatingImage.style.transition = 'none'
      floatingImage.style.transform = transform
      void floatingImage.offsetWidth
      floatingImage.style.transition = ''
    }
  }

  // Запуск плавного возврата изображения обратно в карточку
  const returnHover = () => {
    if (!hovering || phase !== 'shown') return
    const card = hovering
    const { rect } = getTargetTransform(card)
    floatingImage.style.left = `${rect.left}px`
    floatingImage.style.top = `${rect.top}px`
    phase = 'leaving'
    floatingImage.classList.remove('is-expanded')
    floatingImage.style.transform = 'none'

    waitForTransformEnd(() => {
      if (phase !== 'leaving' || hovering !== card) return
      // В одном кадре возвращаем видимость оригиналу и скрываем клон
      card.classList.remove('is-image-hovered')
      floatingImage.classList.remove('is-visible')
      hovering = null
      phase = 'idle'
      reconcileHover()
    })
  }

  function reconcileHover() {
    if (dialog.open) return

    // Пока идёт анимация раскрытия или возврата — не перебиваем её, ждём завершения
    if (phase === 'entering' || phase === 'leaving') return

    if (phase === 'shown') {
      if (desiredCard !== hovering) returnHover()
      return
    }

    if (phase === 'idle' && desiredCard) {
      showHover(desiredCard)
    }
  }

  const open = card => {
    hideHover()
    if (dialog.open) return
    active = card
    heading.textContent = card.querySelector('h3').textContent
    image.src = card.querySelector('img').src
    image.alt = heading.textContent + ' — application design screens'
    dialog.showModal()
    document.documentElement.classList.add('project-preview-open')
  }

  const dismiss = () => dialog.close()

  cards.forEach(card => {
    card.addEventListener('click', () => open(card))
    card.addEventListener('pointerenter', event => {
      if (!hover.matches || event.pointerType !== 'mouse') return
      desiredCard = card
      reconcileHover()
    })
    card.addEventListener('pointerleave', () => {
      if (desiredCard === card) desiredCard = null
      reconcileHover()
    })
  })

  close.addEventListener('click', dismiss)
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect()
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dismiss()
  })
  dialog.addEventListener('close', () => {
    hideHover()
    document.documentElement.classList.remove('project-preview-open')
    active?.focus({ preventScroll:true })
  })
  const handleScroll = () => {
    syncFloatingPosition()
    if (!lastPointer) return
    const underPointer = document.elementFromPoint(lastPointer.x, lastPointer.y)?.closest('.project-filter-card') || null
    if (underPointer !== desiredCard) {
      desiredCard = underPointer
      reconcileHover()
    }
  }

  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse') {
      lastPointer = { x: event.clientX, y: event.clientY }
    }
  }, { passive: true })
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', hideHover, { passive: true })
  window.addEventListener('blur', () => {
    lastPointer = null
    desiredCard = null
    reconcileHover()
  })
  document.addEventListener('pointerleave', () => {
    lastPointer = null
    desiredCard = null
    reconcileHover()
  })
  hover.addEventListener('change', hideHover)
})()
