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
  document.body.append(floatingImage)

  let active = null
  let hovering = null
  let desiredCard = null
  let phase = 'idle' // 'idle' | 'entering' | 'shown' | 'leaving'
  let hoverFrame = 0
  let animationTimer = 0
  let cleanupTransition = null

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

  // Вычисляем целевой transform для перемещения изображения в центр экрана
  const getTargetTransform = card => {
    const source = card.querySelector('img')
    const rect = source.getBoundingClientRect()
    const scale = Math.min(innerWidth * .8 / rect.width, innerHeight * .8 / rect.height, 2.8)
    const x = innerWidth / 2 - rect.left - rect.width / 2
    const y = innerHeight / 2 - rect.top - rect.height / 2
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
      if (desiredCard !== card || dialog.open) {
        hovering = null
        phase = 'idle'
        return
      }
      // В одном кадре скрываем оригинал и показываем клон, чтобы не было мерцания
      card.classList.add('is-image-hovered')
      floatingImage.classList.add('is-visible', 'is-expanded')
      floatingImage.style.transform = transform

      waitForTransformEnd(() => {
        if (phase !== 'entering') return
        phase = 'shown'
        reconcileHover()
      })
    })
  }

  // Запуск плавного возврата изображения обратно в карточку
  const returnHover = () => {
    if (!hovering) return
    phase = 'leaving'
    floatingImage.classList.remove('is-expanded')
    floatingImage.style.transform = 'none'

    waitForTransformEnd(() => {
      if (phase !== 'leaving') return
      // В одном кадре возвращаем видимость оригиналу и скрываем клон
      hovering?.classList.remove('is-image-hovered')
      floatingImage.classList.remove('is-visible')
      hovering = null
      phase = 'idle'
      reconcileHover()
    })
  }

  function reconcileHover() {
    if (dialog.open) return

    // Если курсор вернулся на ту же карточку во время возврата — разворачиваем анимацию обратно в центр
    if (phase === 'leaving' && desiredCard && desiredCard === hovering) {
      phase = 'entering'
      const { transform } = getTargetTransform(hovering)
      floatingImage.classList.add('is-expanded')
      floatingImage.style.transform = transform
      waitForTransformEnd(() => {
        if (phase !== 'entering') return
        phase = 'shown'
        reconcileHover()
      })
      return
    }

    if (hovering === desiredCard) return

    if (hovering) {
      if (phase !== 'leaving') returnHover()
      return
    }

    if (desiredCard) showHover(desiredCard)
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
  window.addEventListener('scroll', hideHover, { passive:true })
  window.addEventListener('resize', hideHover, { passive:true })
  hover.addEventListener('change', hideHover)
})()
