import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const makeSpecs = (material, category) => [
  { label: 'Format', value: 'glTF 2.0' },
  { label: 'Textures', value: '4K PBR' },
  { label: 'Material', value: material },
  { label: 'Category', value: category },
]

// Полный каталог 3D-моделей для пьедестала
const MODELS = [
  {
    id: 'marble_bust_01',
    name: 'Marble Bust',
    category: 'Sculpture',
    icon: 'bx-user',
    description: 'Классический мраморный бюст с детализированной скульптурной поверхностью и мягким рассеянием света.',
    specs: makeSpecs('Marble PBR', 'Sculpture'),
    tags: ['4K Textures', 'Sculpt', 'PBR'],
    modelUrl: 'assets/models/marble_bust_01/marble_bust_01_4k.gltf',
  },
  {
    id: 'lion_head',
    name: 'Lion Head',
    category: 'Sculpture',
    icon: 'bx-crown',
    description: 'Детализированный рельеф головы льва с выраженной фактурой камня и глубокими тенями.',
    specs: makeSpecs('Stone Relief', 'Sculpture'),
    tags: ['4K Textures', 'Normal Map', 'PBR'],
    modelUrl: 'assets/models/lion_head/lion_head_4k.gltf',
  },
  {
    id: 'bull_head',
    name: 'Bull Head',
    category: 'Sculpture',
    icon: 'bx-shield-quarter',
    description: 'Скульптурная модель головы быка с чёткой геометрией рогов и текстурой поверхности.',
    specs: makeSpecs('Sculpted', 'Sculpture'),
    tags: ['4K Textures', 'High Detail', 'glTF'],
    modelUrl: 'assets/models/bull_head/bull_head_4k.gltf',
  },
  {
    id: 'Camera_01',
    name: 'Classic Camera',
    category: 'Optics',
    icon: 'bx-camera',
    description: 'Фотокамера с металлическим корпусом, объективом и проработанными элементами управления.',
    specs: makeSpecs('Metal & Glass', 'Optics'),
    tags: ['4K PBR', 'Metalness', 'Optics'],
    modelUrl: 'assets/models/Camera_01/Camera_01_4k.gltf',
  },
  {
    id: 'vintage_video_camera',
    name: 'Vintage Video Camera',
    category: 'Optics',
    icon: 'bx-video',
    description: 'Винтажная видеокамера с ретро-механикой, оптическим блоком и потёртостями металла.',
    specs: makeSpecs('Brushed Metal', 'Vintage'),
    tags: ['4K PBR', 'Retro Tech', 'glTF'],
    modelUrl: 'assets/models/vintage_video_camera/vintage_video_camera_4k.gltf',
  },
  {
    id: 'vintage_microscope',
    name: 'Vintage Microscope',
    category: 'Science',
    icon: 'bx-search-alt',
    description: 'Лабораторный микроскоп с латунными и эмалированными элементами, линзами и предметным столиком.',
    specs: makeSpecs('Brass & Enamel', 'Science'),
    tags: ['4K PBR', 'Precision', 'Optics'],
    modelUrl: 'assets/models/vintage_microscope/vintage_microscope_4k.gltf',
  },
  {
    id: 'vintage_binocular',
    name: 'Vintage Binocular',
    category: 'Optics',
    icon: 'bx-glasses',
    description: 'Бинокль с кожаной отделкой корпуса, металлическими кольцами фокусировки и просветлённой оптикой.',
    specs: makeSpecs('Leather & Metal', 'Optics'),
    tags: ['4K PBR', 'Optics', 'Retro'],
    modelUrl: 'assets/models/vintage_binocular/vintage_binocular_4k.gltf',
  },
  {
    id: 'alarm_clock_01',
    name: 'Alarm Clock',
    category: 'Objects',
    icon: 'bx-alarm',
    description: 'Механический будильник с металлическими колокольчиками, циферблатом и стеклянной линзой.',
    specs: makeSpecs('Chrome & Glass', 'Objects'),
    tags: ['4K PBR', 'Mechanical', 'glTF'],
    modelUrl: 'assets/models/alarm_clock_01/alarm_clock_01_4k.gltf',
  },
  {
    id: 'pocket_watch',
    name: 'Pocket Watch',
    category: 'Objects',
    icon: 'bx-time-five',
    description: 'Карманные часы с тонкой гравировкой корпуса, металлическим блеском и детализированным циферблатом.',
    specs: makeSpecs('Gold & Glass', 'Objects'),
    tags: ['4K PBR', 'Luxury', 'Precision'],
    modelUrl: 'assets/models/pocket_watch/pocket_watch_4k.gltf',
  },
  {
    id: 'Drill_01',
    name: 'Power Drill',
    category: 'Tools',
    icon: 'bx-wrench',
    description: 'Аккумуляторная дрель с текстурированной прорезиненной рукояткой, патроном и корпусом из пластика.',
    specs: makeSpecs('Composite PBR', 'Tools'),
    tags: ['4K PBR', 'Industrial', 'Tool'],
    modelUrl: 'assets/models/Drill_01/Drill_01_4k.gltf',
  },
  {
    id: 'BarberShopChair_01',
    name: 'Barber Chair',
    category: 'Furniture',
    icon: 'bx-chair',
    description: 'Классическое барбер-кресло с хромированным основанием, кожаной обивкой и подголовником.',
    specs: makeSpecs('Leather & Chrome', 'Furniture'),
    tags: ['4K PBR', 'Interior', 'glTF'],
    modelUrl: 'assets/models/BarberShopChair_01/BarberShopChair_01_4k.gltf',
  },
  {
    id: 'wheelchair_01',
    name: 'Wheelchair',
    category: 'Equipment',
    icon: 'bx-accessibility',
    description: 'Детализированная модель кресла-коляски со спицами колёс, рамой и тканевым сиденьем.',
    specs: makeSpecs('Steel & Fabric', 'Equipment'),
    tags: ['4K PBR', 'Mechanical', 'glTF'],
    modelUrl: 'assets/models/wheelchair_01/wheelchair_01_4k.gltf',
  },
  {
    id: 'chinese_chandelier',
    name: 'Chinese Chandelier',
    category: 'Decor',
    icon: 'bx-bulb',
    description: 'Декоративный светильник с орнаментом, деревянным каркасом и рассеивающими вставками.',
    specs: makeSpecs('Wood & Silk', 'Decor'),
    tags: ['4K PBR', 'Lighting', 'Decor'],
    modelUrl: 'assets/models/chinese_chandelier/chinese_chandelier_4k.gltf',
  },
  {
    id: 'jug_01',
    name: 'Ceramic Jug',
    category: 'Decor',
    icon: 'bx-coffee',
    description: 'Керамический кувшин с естественными неровностями глазури и мягкими бликами на поверхности.',
    specs: makeSpecs('Glazed Ceramic', 'Decor'),
    tags: ['4K PBR', 'Ceramic', 'glTF'],
    modelUrl: 'assets/models/jug_01/jug_01_4k.gltf',
  },
  {
    id: 'potted_plant_02',
    name: 'Potted Plant',
    category: 'Botanical',
    icon: 'bx-leaf',
    description: 'Комнатное растение в кашпо с проработанной листвой и фактурой почвы.',
    specs: makeSpecs('Foliage & Clay', 'Botanical'),
    tags: ['4K PBR', 'Organic', 'Decor'],
    modelUrl: 'assets/models/potted_plant_02/potted_plant_02_4k.gltf',
  },
  {
    id: 'leather_cleaner_can',
    name: 'Leather Cleaner Can',
    category: 'Props',
    icon: 'bx-spray-can',
    description: 'Металлическая банка средства по уходу за кожей с этикеткой и глянцевыми отражениями.',
    specs: makeSpecs('Printed Tin', 'Props'),
    tags: ['4K PBR', 'Packaging', 'glTF'],
    modelUrl: 'assets/models/leather_cleaner_can/leather_cleaner_can_4k.gltf',
  },
  {
    id: 'lubricant_spray',
    name: 'Lubricant Spray',
    category: 'Props',
    icon: 'bx-droplet',
    description: 'Аэрозольный баллончик с распылителем, металлической крышкой и графикой на корпусе.',
    specs: makeSpecs('Metal & Plastic', 'Props'),
    tags: ['4K PBR', 'Product', 'glTF'],
    modelUrl: 'assets/models/lubricant_spray/lubricant_spray_4k.gltf',
  },
  {
    id: 'medical_tape',
    name: 'Medical Tape',
    category: 'Props',
    icon: 'bx-first-aid',
    description: 'Рулон медицинского пластыря с фактурой ткани и картонной внутренней втулкой.',
    specs: makeSpecs('Woven Fabric', 'Props'),
    tags: ['4K PBR', 'Macro', 'glTF'],
    modelUrl: 'assets/models/medical_tape/medical_tape_4k.gltf',
  },
]

const initPedestal = () => {
  const root = document.querySelector('.pedestal-showcase')
  if (!root) return

  const listEl = root.querySelector('.pedestal-list')
  const countEl = root.querySelector('.pedestal-count')
  const stageEl = root.querySelector('.pedestal-stage')
  const canvas = root.querySelector('.pedestal-canvas')
  const loaderEl = root.querySelector('.pedestal-loader')
  const autoRotateBtn = root.querySelector('[data-pedestal-action="autorotate"]')
  const resetBtn = root.querySelector('[data-pedestal-action="reset"]')

  const infoCategory = root.querySelector('.pedestal-info-category')
  const infoTitle = root.querySelector('.pedestal-info-title')
  const infoDesc = root.querySelector('.pedestal-info-desc')
  const infoSpecs = root.querySelector('.pedestal-specs')
  const infoTags = root.querySelector('.pedestal-tags')

  if (!listEl || !stageEl || !canvas) return

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

  // Инициализация сцены, камеры и рендерера (камера и пьедестал остаются неподвижными)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
  const defaultZoom = 4.6
  let targetZoom = defaultZoom
  camera.position.set(0, 1.35, defaultZoom)
  camera.lookAt(0, 0.3, 0)

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  // IBL-окружение для реалистичных отражений металла и стекла на PBR-моделях
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture

  let autoRotate = !reduceMotion
  let isDragging = false
  let lastPointer = { x: 0, y: 0 }
  let velX = 0
  let velY = 0
  const axisX = new THREE.Vector3(1, 0, 0)
  const axisY = new THREE.Vector3(0, 1, 0)
  const qX = new THREE.Quaternion()
  const qY = new THREE.Quaternion()

  // Студийное освещение
  const ambientLight = new THREE.AmbientLight(0xd8d2ff, 0.75)
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0)
  keyLight.position.set(3.2, 5.2, 3.6)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(1024, 1024)
  keyLight.shadow.camera.near = 1
  keyLight.shadow.camera.far = 14
  keyLight.shadow.bias = -0.0005

  const rimLeft = new THREE.PointLight(0xbd88f7, 3.6, 10)
  rimLeft.position.set(-2.8, 2.2, -1.8)

  const rimRight = new THREE.PointLight(0x68ddd9, 3.2, 10)
  rimRight.position.set(2.8, 1.6, -2.0)

  scene.add(ambientLight, keyLight, rimLeft, rimRight)

  // Построение неподвижного 3D-пьедестала
  const pedestalGroup = new THREE.Group()
  const pedestalTopY = -0.82
  const floatBaseY = 0.42

  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a35,
    metalness: 0.65,
    roughness: 0.28,
  })
  const topDisc = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.54, 0.24, 64), baseMaterial)
  topDisc.position.y = pedestalTopY - 0.12
  topDisc.receiveShadow = true

  const lowerPlinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.66, 1.82, 0.22, 64),
    new THREE.MeshStandardMaterial({ color: 0x101228, metalness: 0.55, roughness: 0.4 })
  )
  lowerPlinth.position.y = pedestalTopY - 0.35
  lowerPlinth.receiveShadow = true

  const glowRingMaterial = new THREE.MeshBasicMaterial({
    color: 0x9f7aff,
    transparent: true,
    opacity: 0.78,
  })
  const glowRing = new THREE.Mesh(new THREE.TorusGeometry(1.43, 0.018, 16, 80), glowRingMaterial)
  glowRing.rotation.x = Math.PI / 2
  glowRing.position.y = pedestalTopY - 0.01

  const shadowFloor = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 48),
    new THREE.ShadowMaterial({ opacity: 0.32 })
  )
  shadowFloor.rotation.x = -Math.PI / 2
  shadowFloor.position.y = pedestalTopY + 0.002
  shadowFloor.receiveShadow = true

  pedestalGroup.add(topDisc, lowerPlinth, glowRing, shadowFloor)
  scene.add(pedestalGroup)

  // Адаптация материалов пьедестала под текущую тему сайта
  const syncThemeToScene = () => {
    const isLight = document.documentElement.dataset.theme === 'light'
    baseMaterial.color.setHex(isLight ? 0xe8e3f4 : 0x1a1a35)
    lowerPlinth.material.color.setHex(isLight ? 0xd7d0e8 : 0x101228)
    glowRingMaterial.color.setHex(isLight ? 0x794bc5 : 0x9f7aff)
    ambientLight.intensity = isLight ? 1.1 : 0.75
    shadowFloor.material.opacity = isLight ? 0.16 : 0.32
  }
  syncThemeToScene()

  const themeObserver = new MutationObserver(syncThemeToScene)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  // Контейнер левитации и контейнер вращения самой 3D-модели
  const modelAnchor = new THREE.Group()
  modelAnchor.position.y = floatBaseY
  const modelPivot = new THREE.Group()
  modelAnchor.add(modelPivot)
  scene.add(modelAnchor)

  const gltfLoader = new GLTFLoader()
  const modelCache = new Map()
  let activeModelId = MODELS[0].id
  let loadToken = 0
  let currentObject = null

  // Центрируем и масштабируем модель вокруг её геометрического центра для свободного вращения
  const placeOnPedestal = object => {
    const box = new THREE.Box3().setFromObject(object)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const targetSize = 1.78
    const scale = targetSize / maxDim

    object.scale.multiplyScalar(scale)
    object.position.sub(center.multiplyScalar(scale))

    object.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }

  // Обновление правой информационной панели
  const renderInfo = model => {
    infoCategory.textContent = model.category
    infoTitle.textContent = model.name
    infoDesc.textContent = model.description

    infoSpecs.innerHTML = model.specs
      .map(spec => `<div class="pedestal-spec"><span class="pedestal-spec-label">${spec.label}</span><span class="pedestal-spec-value">${spec.value}</span></div>`)
      .join('')

    infoTags.innerHTML = model.tags
      .map(tag => `<span class="pedestal-tag">${tag}</span>`)
      .join('')
  }

  const mountObject = object => {
    if (currentObject) {
      modelPivot.remove(currentObject)
    }
    modelPivot.quaternion.identity()
    velX = 0
    velY = 0
    modelPivot.add(object)
    currentObject = object
  }

  // Загрузка или подстановка модели из кэша
  const selectModel = modelId => {
    const model = MODELS.find(item => item.id === modelId)
    if (!model) return

    activeModelId = model.id
    loadToken += 1
    const currentToken = loadToken

    listEl.querySelectorAll('.pedestal-item').forEach(btn => {
      const isSelected = btn.dataset.modelId === model.id
      btn.classList.toggle('is-active', isSelected)
      btn.setAttribute('aria-pressed', String(isSelected))
    })

    renderInfo(model)

    if (modelCache.has(model.id)) {
      loaderEl?.classList.remove('is-visible')
      mountObject(modelCache.get(model.id))
      return
    }

    loaderEl?.classList.add('is-visible')
    gltfLoader.load(
      model.modelUrl,
      gltf => {
        if (currentToken !== loadToken) return
        loaderEl?.classList.remove('is-visible')
        const loaded = gltf.scene
        placeOnPedestal(loaded)
        modelCache.set(model.id, loaded)
        mountObject(loaded)
      },
      undefined,
      () => {
        if (currentToken !== loadToken) return
        loaderEl?.classList.remove('is-visible')
      }
    )
  }

  // Рендерим левый список моделей
  if (countEl) countEl.textContent = String(MODELS.length)
  listEl.innerHTML = MODELS.map(model => `
    <li>
      <button class="pedestal-item" type="button" data-model-id="${model.id}" aria-pressed="false">
        <span class="pedestal-item-badge" aria-hidden="true"><i class='bx ${model.icon}'></i></span>
        <span class="pedestal-item-meta">
          <span class="pedestal-item-category">${model.category}</span>
          <span class="pedestal-item-title">${model.name}</span>
        </span>
      </button>
    </li>
  `).join('')

  listEl.addEventListener('click', event => {
    const button = event.target.closest('.pedestal-item')
    if (!button) return
    selectModel(button.dataset.modelId)
  })

  // Вращение только самой модели курсором во все стороны (кватернионы без блокировки осей)
  canvas.addEventListener('pointerdown', event => {
    isDragging = true
    lastPointer = { x: event.clientX, y: event.clientY }
    velX = 0
    velY = 0
    canvas.setPointerCapture(event.pointerId)
  })

  canvas.addEventListener('pointermove', event => {
    if (!isDragging) return
    const dx = event.clientX - lastPointer.x
    const dy = event.clientY - lastPointer.y
    lastPointer = { x: event.clientX, y: event.clientY }

    const sensitivity = 0.009
    velX = dx * sensitivity
    velY = dy * sensitivity

    qY.setFromAxisAngle(axisY, velX)
    qX.setFromAxisAngle(axisX, velY)
    modelPivot.quaternion.premultiply(qY).premultiply(qX).normalize()
  })

  const endDrag = event => {
    if (!isDragging) return
    isDragging = false
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
  }

  canvas.addEventListener('pointerup', endDrag)
  canvas.addEventListener('pointercancel', endDrag)

  canvas.addEventListener('wheel', event => {
    event.preventDefault()
    targetZoom = Math.min(7.2, Math.max(2.6, targetZoom + event.deltaY * 0.0025))
  }, { passive: false })

  // Управление автовращением и сбросом ориентации модели
  const syncAutoRotateBtn = () => {
    if (!autoRotateBtn) return
    autoRotateBtn.classList.toggle('is-active', autoRotate)
    autoRotateBtn.setAttribute('aria-pressed', String(autoRotate))
  }
  syncAutoRotateBtn()

  autoRotateBtn?.addEventListener('click', () => {
    autoRotate = !autoRotate
    syncAutoRotateBtn()
  })

  resetBtn?.addEventListener('click', () => {
    modelPivot.quaternion.identity()
    velX = 0
    velY = 0
    targetZoom = defaultZoom
  })

  // Адаптивный ресайз WebGL-сцены
  const updateSize = () => {
    const rect = stageEl.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    camera.aspect = rect.width / rect.height
    camera.updateProjectionMatrix()
    renderer.setSize(rect.width, rect.height, false)
  }

  const resizeObserver = new ResizeObserver(updateSize)
  resizeObserver.observe(stageEl)
  updateSize()

  // Останавливаем рендер-цикл, когда секция вне экрана (экономия ресурсов)
  let isVisible = true
  const visibilityObserver = new IntersectionObserver(entries => {
    isVisible = entries[0]?.isIntersecting ?? true
  })
  visibilityObserver.observe(stageEl)

  const clock = new THREE.Clock()
  const animate = () => {
    requestAnimationFrame(animate)
    if (!isVisible) return

    const elapsed = clock.getElapsedTime()

    // Плавная левитация модели над пьедесталом
    if (!reduceMotion) {
      modelAnchor.position.y = floatBaseY + Math.sin(elapsed * 1.5) * 0.055
    }

    // Инерция после отпускания или плавное автовращение
    if (!isDragging) {
      if (Math.abs(velX) > 0.0001 || Math.abs(velY) > 0.0001) {
        qY.setFromAxisAngle(axisY, velX)
        qX.setFromAxisAngle(axisX, velY)
        modelPivot.quaternion.premultiply(qY).premultiply(qX).normalize()
        velX *= 0.92
        velY *= 0.92
      } else if (autoRotate) {
        qY.setFromAxisAngle(axisY, 0.006)
        modelPivot.quaternion.premultiply(qY).normalize()
      }
    }

    // Плавный зум камеры без смещения пьедестала
    camera.position.z += (targetZoom - camera.position.z) * 0.1
    camera.lookAt(0, 0.3, 0)

    renderer.render(scene, camera)
  }

  selectModel(activeModelId)
  animate()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPedestal)
} else {
  initPedestal()
}
