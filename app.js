const DAY_MS = 24 * 60 * 60 * 1000;
const YEAR_MS = 365.25 * DAY_MS;
const MIN_HISTORY_YEAR = 1949;
const CURRENT_YEAR = new Date().getFullYear();
const PROJECT_MIN_MAGNITUDE = 3.0;
const USGS_QUERY_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";
const LOCAL_QUERY_URL = "./api/earthquakes";
const LOCAL_BOOTSTRAP_URL = "./api/catalog/bootstrap";
const LOCAL_BOOTSTRAP_BATCH_URL = "./api/catalog/bootstrap-batch";
const LOCAL_SYNC_STATUS_URL = "./api/storage/catalog-sync";
const LOCAL_SYNC_TRIGGER_URL = "./api/storage/sync";
const LOCAL_INGEST_URL = "./api/storage/ingest";
const STATIC_BOOTSTRAP_MANIFEST_URL = "./data/catalog/manifest.json";
const STATIC_BOOTSTRAP_BASE_URL = "./data/catalog/";
const BOOTSTRAP_BATCH_SIZE = 5000;
const QUERY_PAGE_SIZE = 20000;
const QUERY_CHUNK_CONCURRENCY = 4;
const STATIC_LIVE_SUPPLEMENT_FRESHNESS_MS = 30 * 60 * 1000;
const STATIC_LIVE_SUPPLEMENT_CHUNK_DAYS = 7;
const SYNC_STATUS_POLL_MS = 20000;
const POINT_CLOUD_THRESHOLD = 12000;
const MAGNITUDE_ALTITUDE_BASE = 18000;
const MAGNITUDE_ALTITUDE_RANGE = 1450000;
const DEPTH_ALTITUDE_BASE = 14000;
const DEPTH_ALTITUDE_RANGE = 1850000;
const EVENT_VISUAL_PRIORITY_OVERLAY_TIER = 2;
const MAX_ENTITY_GUIDES = 420;
const MAX_POINT_CLOUD_GUIDES = 96;
const GUIDE_SURFACE_ALTITUDE = 3500;
const STATUS_HISTORY_LIMIT = 240;
const STATUS_HISTORY_STORAGE_KEY = "quake-operation-history-v1";
const HEIGHT_PERSPECTIVE_MAX_HEIGHT = 32000000;
const HEIGHT_PERSPECTIVE_AUTO_TILT_MAX_HEIGHT = 18000000;
const EARTH_RADIUS = Cesium.Ellipsoid.WGS84.maximumRadius;
const CENTER_LOCK_MIN_DISTANCE = EARTH_RADIUS + 850000;
const CENTER_LOCK_MAX_DISTANCE = EARTH_RADIUS + 40000000;
const CENTER_LOCK_MIN_LATITUDE = Cesium.Math.toRadians(-88);
const CENTER_LOCK_MAX_LATITUDE = Cesium.Math.toRadians(88);
const CENTER_LOCK_DRAG_ROTATION_SPEED = 1.85;
const CENTER_LOCK_WHEEL_ZOOM_FACTOR = 0.0011;
const CENTER_LOCK_TOUCH_ZOOM_FACTOR = 1.08;
const CENTER_LOCK_CLICK_THRESHOLD_PX = 6;
const CENTER_LOCK_FIT_VIEW_RATIO = 0.86;
const CENTER_LOCK_MIN_FOCUS_DISTANCE = EARTH_RADIUS + 1100000;
const CENTER_LOCK_DEFAULT_FOCUS_DISTANCE = EARTH_RADIUS + 32000000;

const TIME_PRESETS = {
  "24h": {
    label: "最近 24 小时",
    getRange() {
      return {
        start: Date.now() - DAY_MS,
        end: Date.now(),
      };
    },
  },
  "30d": {
    label: "最近 30 天",
    getRange() {
      return {
        start: Date.now() - 30 * DAY_MS,
        end: Date.now(),
      };
    },
  },
  "1y": {
    label: "最近 1 年",
    getRange() {
      return {
        start: Date.now() - YEAR_MS,
        end: Date.now(),
      };
    },
  },
  "10y": {
    label: "最近 10 年",
    getRange() {
      return {
        start: Date.now() - 10 * YEAR_MS,
        end: Date.now(),
      };
    },
  },
  historic: {
    label: "1949 年至今",
    getRange() {
      return {
        start: Date.UTC(MIN_HISTORY_YEAR, 0, 1),
        end: Date.now(),
      };
    },
  },
};

const LEGENDS = {
  magnitude: [
    { label: "M3.0 - M3.9", color: "#67e8f9" },
    { label: "M4.0 - M4.9", color: "#34d399" },
    { label: "M5.0 - M5.9", color: "#fbbf24" },
    { label: "M6.0+", color: "#ef4444" },
  ],
  depth: [
    { label: "0 - 69km 浅源", color: "#67e8f9" },
    { label: "70 - 299km 中源", color: "#34d399" },
    { label: "300 - 499km 深源", color: "#fbbf24" },
    { label: "500km+ 超深源", color: "#ef4444" },
  ],
};

const HOTSPOT_COMPARE_METRICS = {
  count: {
    label: "事件总数",
    axisLabel: "事件数 / 条",
    unitLabel: "条",
    value(item) {
      return item.count;
    },
    formatValue(value) {
      return formatNumber(Math.round(value || 0));
    },
  },
  avgMag: {
    label: "平均震级",
    axisLabel: "平均震级 / Mw",
    unitLabel: "Mw",
    value(item) {
      return item.avgMag;
    },
    formatValue(value) {
      return `M${(value || 0).toFixed(2)}`;
    },
  },
  maxMag: {
    label: "最大震级",
    axisLabel: "最大震级 / Mw",
    unitLabel: "Mw",
    value(item) {
      return item.maxMag;
    },
    formatValue(value) {
      return `M${(value || 0).toFixed(1)}`;
    },
  },
  avgDepth: {
    label: "平均深度",
    axisLabel: "平均深度 / km",
    unitLabel: "km",
    value(item) {
      return item.avgDepth;
    },
    formatValue(value) {
      return `${(value || 0).toFixed(1)} km`;
    },
  },
};

const COMPARE_MODAL_REGION_LIMITS = {
  temporal: 8,
  magnitude: 8,
  depth: 10,
  energy: 8,
  hotspot: 14,
};

const COMPARE_SURFACE_REGION_STRATEGY = {
  temporal: {
    previewLimit: 4,
    modalPanelSize: 6,
    exportPanelSize: 6,
  },
  magnitude: {
    previewLimit: 4,
    modalPanelSize: 5,
    exportPanelSize: 5,
  },
  depth: {
    previewLimit: 5,
    modalPanelSize: 10,
    exportPanelSize: 12,
  },
  energy: {
    previewLimit: 4,
    modalPanelSize: 6,
    exportPanelSize: 6,
  },
  hotspot: {
    previewLimit: 6,
    modalPanelSize: 12,
    exportPanelSize: 16,
  },
};

const ACADEMIC_FIGURE_FONT_STACK =
  "'Segoe UI Variable Text', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";
const SUPPORTED_COMPARE_TIME_GRANULARITIES = new Set(["auto", "month", "year"]);

const COMPARE_REGION_PALETTE = [
  "#1f77b4",
  "#d95f02",
  "#2ca02c",
  "#9467bd",
  "#8c564b",
  "#17becf",
  "#bcbd22",
  "#e15759",
  "#4e79a7",
  "#59a14f",
  "#edc948",
  "#b07aa1",
];

const COMPARE_REGION_DASHES = [
  "",
  "10 4",
  "4 4",
  "14 4 4 4",
  "2 4",
  "16 6",
];

const DEPTH_COMPARE_LAYERS = [
  { key: "shallow", label: "浅源 0-69 km", min: 0, max: 70, color: "#2f7ed8" },
  { key: "intermediate", label: "中源 70-299 km", min: 70, max: 300, color: "#f59e0b" },
  { key: "deep", label: "深源 300+ km", min: 300, max: Number.POSITIVE_INFINITY, color: "#dc2626" },
];

const COMPARE_MODULE_META = {
  temporal: {
    label: "多地区时间序列对比",
    fileLabel: "temporal-compare",
    kicker: "TEMPORAL COMPARISON",
  },
  magnitude: {
    label: "多地区震级分布对比",
    fileLabel: "magnitude-compare",
    kicker: "MAGNITUDE COMPARISON",
  },
  depth: {
    label: "多地区深度结构对比",
    fileLabel: "depth-compare",
    kicker: "DEPTH COMPARISON",
  },
  energy: {
    label: "多地区能量释放对比",
    fileLabel: "energy-compare",
    kicker: "ENERGY COMPARISON",
  },
  hotspot: {
    label: "多地区区域热点对比",
    fileLabel: "hotspot-compare",
    kicker: "REGIONAL COMPARISON",
  },
};

const ANALYSIS_MODULES = {
  count: { label: "事件总数" },
  avgMag: { label: "平均震级" },
  maxMag: { label: "最大震级" },
  avgDepth: { label: "平均深度" },
  temporal: { label: "时间趋势分析" },
  magnitude: { label: "震级分布分析" },
  depth: { label: "深度结构分析" },
  energy: { label: "能量释放分析" },
};

const ANALYSIS_MODULE_STORAGE_KEY = "quake-active-analysis-module";

const FOCUS_PRESETS = {
  global: {
    label: "全球视野",
    destination: Cesium.Cartesian3.fromDegrees(108, 16, 32000000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-88),
      roll: 0,
    },
  },
  pacific: {
    label: "环太平洋火环",
    destination: Cesium.Cartesian3.fromDegrees(-152, 12, 25000000),
    orientation: {
      heading: Cesium.Math.toRadians(4),
      pitch: Cesium.Math.toRadians(-86),
      roll: 0,
    },
  },
  eurasia: {
    label: "地中海-喜马拉雅带",
    destination: Cesium.Cartesian3.fromDegrees(70, 28, 21000000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-85),
      roll: 0,
    },
  },
  atlantic: {
    label: "大西洋中脊",
    destination: Cesium.Cartesian3.fromDegrees(-28, 10, 24000000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-86),
      roll: 0,
    },
  },
};

const PALETTE = {
  aqua: Cesium.Color.fromCssColorString("#67e8f9"),
  green: Cesium.Color.fromCssColorString("#34d399"),
  amber: Cesium.Color.fromCssColorString("#fbbf24"),
  red: Cesium.Color.fromCssColorString("#ef4444"),
  white: Cesium.Color.fromCssColorString("#f8fafc"),
};

const ROTATE_RATE = 0.045;
const PULSE_MS = 2200;
const DEFAULT_RESOLUTION_SCALE = getPreferredResolutionScale();
const BASE_IMAGERY_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const NATURAL_EARTH_TEXTURES_URL = Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII");
const BOUNDARY_ALTITUDE = 14000;
const BOUNDARY_POINT_PRECISION = 4;
const BOUNDARY_DATELINE_THRESHOLD = 170;
const BOUNDARY_LAYER_URL = "./data/geoboundaries/adm0.geojson";
const SUBDIVISION_MANIFEST_URL = "./data/geoboundaries/adm1-manifest.json";
const SUBDIVISION_BASE_URL = "./data/geoboundaries/";
const COUNTRY_INDEX_CELL_SIZE = 6;
const SUBDIVISION_INDEX_CELL_SIZE = 3;
const SUBDIVISION_FALLBACK_REGION_ZH = "离岸/未落入行政区";
const UNCLASSIFIED_COUNTRY_KEY = "__unclassified__";
const UNCLASSIFIED_COUNTRY_NAME = "International Waters / Offshore";
const UNCLASSIFIED_COUNTRY_NAME_ZH = "国际海域/离岸区域";
const REGION_DISPLAY_NAMES_ZH =
  typeof Intl?.DisplayNames === "function"
    ? new Intl.DisplayNames(["zh-CN"], { type: "region" })
    : null;
const COUNTRY_NAME_ZH_BY_NORMALIZED_NAME = {
  antarctica: "南极洲",
  bolivia: "玻利维亚",
  "bosnia and herzegovina": "波黑",
  brunei: "文莱",
  "cape verde": "佛得角",
  congo: "刚果",
  "cote d'ivoire": "科特迪瓦",
  curacao: "库拉索",
  czechia: "捷克",
  dominican: "多米尼加",
  eswatini: "斯威士兰",
  "falkland islands": "福克兰群岛",
  "guinea-bissau": "几内亚比绍",
  "ivory coast": "科特迪瓦",
  kosovo: "科索沃",
  laos: "老挝",
  macedonia: "北马其顿",
  micronesia: "密克罗尼西亚",
  moldova: "摩尔多瓦",
  myanmar: "缅甸",
  "north korea": "朝鲜",
  palestine: "巴勒斯坦",
  "papua new guinea": "巴布亚新几内亚",
  "puerto rico": "波多黎各",
  "republic of korea": "韩国",
  reunion: "留尼汪",
  russia: "俄罗斯",
  "saint barthelemy": "圣巴泰勒米",
  "saint helena": "圣赫勒拿",
  "saint martin": "法属圣马丁",
  "south korea": "韩国",
  slovakia: "斯洛伐克",
  slovenia: "斯洛文尼亚",
  "solomon islands": "所罗门群岛",
  syria: "叙利亚",
  taiwan: "中国台湾",
  tanzania: "坦桑尼亚",
  "democratic peoples republic of korea": "朝鲜",
  "democratic people's republic of korea": "朝鲜",
  timor: "东帝汶",
  turkey: "土耳其",
  venezuela: "委内瑞拉",
  vietnam: "越南",
  "western sahara": "西撒哈拉",
  "north macedonia": "北马其顿",
  "svalbard and jan mayen": "斯瓦尔巴和扬马延",
};
const COUNTRY_NAME_ZH_BY_CODE = {
  AFG: "阿富汗",
  AGO: "安哥拉",
  ALB: "阿尔巴尼亚",
  ARE: "阿联酋",
  ARG: "阿根廷",
  ARM: "亚美尼亚",
  ATA: "南极洲",
  ATF: "法属南方和南极领地",
  AUS: "澳大利亚",
  AUT: "奥地利",
  AZE: "阿塞拜疆",
  BDI: "布隆迪",
  BEL: "比利时",
  BEN: "贝宁",
  BFA: "布基纳法索",
  BGD: "孟加拉国",
  BGR: "保加利亚",
  BHS: "巴哈马",
  BIH: "波黑",
  BLR: "白俄罗斯",
  BLZ: "伯利兹",
  BMU: "百慕大",
  BOL: "玻利维亚",
  BRA: "巴西",
  BRN: "文莱",
  BTN: "不丹",
  BWA: "博茨瓦纳",
  CAF: "中非共和国",
  CAN: "加拿大",
  CHE: "瑞士",
  CHL: "智利",
  CHN: "中国",
  CIV: "科特迪瓦",
  CMR: "喀麦隆",
  COD: "刚果（金）",
  COG: "刚果（布）",
  COL: "哥伦比亚",
  CRI: "哥斯达黎加",
  "CS-KM": "塞尔维亚和黑山",
  CUB: "古巴",
  CYP: "塞浦路斯",
  CZE: "捷克",
  DEU: "德国",
  DJI: "吉布提",
  DNK: "丹麦",
  DOM: "多米尼加",
  DZA: "阿尔及利亚",
  ECU: "厄瓜多尔",
  EGY: "埃及",
  ERI: "厄立特里亚",
  ESH: "西撒哈拉",
  ESP: "西班牙",
  EST: "爱沙尼亚",
  ETH: "埃塞俄比亚",
  FIN: "芬兰",
  FJI: "斐济",
  FLK: "福克兰群岛",
  FRA: "法国",
  GAB: "加蓬",
  GBR: "英国",
  GEO: "格鲁吉亚",
  GHA: "加纳",
  GIN: "几内亚",
  GMB: "冈比亚",
  GNB: "几内亚比绍",
  GNQ: "赤道几内亚",
  GRC: "希腊",
  GRL: "格陵兰",
  GTM: "危地马拉",
  GUF: "法属圭亚那",
  GUY: "圭亚那",
  HND: "洪都拉斯",
  HRV: "克罗地亚",
  HTI: "海地",
  HUN: "匈牙利",
  IDN: "印度尼西亚",
  IND: "印度",
  IRL: "爱尔兰",
  IRN: "伊朗",
  IRQ: "伊拉克",
  ISL: "冰岛",
  ISR: "以色列",
  ITA: "意大利",
  JAM: "牙买加",
  JOR: "约旦",
  JPN: "日本",
  KAZ: "哈萨克斯坦",
  KEN: "肯尼亚",
  KGZ: "吉尔吉斯斯坦",
  KHM: "柬埔寨",
  KOR: "韩国",
  KWT: "科威特",
  LAO: "老挝",
  LBN: "黎巴嫩",
  LBR: "利比里亚",
  LBY: "利比亚",
  LKA: "斯里兰卡",
  LSO: "莱索托",
  LTU: "立陶宛",
  LUX: "卢森堡",
  LVA: "拉脱维亚",
  MAR: "摩洛哥",
  MDA: "摩尔多瓦",
  MDG: "马达加斯加",
  MEX: "墨西哥",
  MKD: "北马其顿",
  MLI: "马里",
  MLT: "马耳他",
  MMR: "缅甸",
  MNE: "黑山",
  MNG: "蒙古",
  MOZ: "莫桑比克",
  MRT: "毛里塔尼亚",
  MWI: "马拉维",
  MYS: "马来西亚",
  NAM: "纳米比亚",
  NCL: "新喀里多尼亚",
  NER: "尼日尔",
  NGA: "尼日利亚",
  NIC: "尼加拉瓜",
  NLD: "荷兰",
  NOR: "挪威",
  NPL: "尼泊尔",
  NZL: "新西兰",
  OMN: "阿曼",
  PAK: "巴基斯坦",
  PAN: "巴拿马",
  PER: "秘鲁",
  PHL: "菲律宾",
  PNG: "巴布亚新几内亚",
  POL: "波兰",
  PRI: "波多黎各",
  PRK: "朝鲜",
  PRT: "葡萄牙",
  PRY: "巴拉圭",
  PSE: "巴勒斯坦",
  QAT: "卡塔尔",
  ROU: "罗马尼亚",
  RUS: "俄罗斯",
  RWA: "卢旺达",
  SAU: "沙特阿拉伯",
  SDN: "苏丹",
  SEN: "塞内加尔",
  SLB: "所罗门群岛",
  SLE: "塞拉利昂",
  SLV: "萨尔瓦多",
  SOM: "索马里",
  SRB: "塞尔维亚",
  SSD: "南苏丹",
  SUR: "苏里南",
  SVK: "斯洛伐克",
  SVN: "斯洛文尼亚",
  SWE: "瑞典",
  SWZ: "斯威士兰",
  SYR: "叙利亚",
  TCD: "乍得",
  TGO: "多哥",
  THA: "泰国",
  TJK: "塔吉克斯坦",
  TKM: "土库曼斯坦",
  TLS: "东帝汶",
  TTO: "特立尼达和多巴哥",
  TUN: "突尼斯",
  TUR: "土耳其",
  TWN: "中国台湾",
  TZA: "坦桑尼亚",
  UGA: "乌干达",
  UKR: "乌克兰",
  URY: "乌拉圭",
  USA: "美国",
  UZB: "乌兹别克斯坦",
  VEN: "委内瑞拉",
  VNM: "越南",
  VUT: "瓦努阿图",
  YEM: "也门",
  ZAF: "南非",
  ZMB: "赞比亚",
  ZWE: "津巴布韦",
};
const COUNTRY_PLACE_ALIASES = {
  "United States of America": ["United States", "USA", "U.S.", "US", "Alaska", "Hawaii"],
  "United Kingdom": ["UK", "U.K.", "Britain", "Great Britain", "England", "Scotland", "Wales"],
  Russia: ["Russian Federation"],
  Turkey: ["Turkiye"],
  "Czech Republic": ["Czechia"],
  Myanmar: ["Burma"],
  "North Korea": ["Democratic People's Republic of Korea"],
  "South Korea": ["Republic of Korea", "S. Korea"],
  "Democratic Republic of the Congo": ["DR Congo", "Congo-Kinshasa"],
  "Republic of the Congo": ["Congo-Brazzaville"],
  "Timor Leste": ["East Timor"],
  "United Arab Emirates": ["UAE"],
  "Bosnia and Herzegovina": ["Bosnia"],
  "Trinidad and Tobago": ["Trinidad", "Tobago"],
};
const CONTINENT_OPTIONS = [
  { key: "all", label: "全部" },
  { key: "asia", label: "亚洲" },
  { key: "europe", label: "欧洲" },
  { key: "africa", label: "非洲" },
  { key: "north-america", label: "北美洲" },
  { key: "south-america", label: "南美洲" },
  { key: "oceania", label: "大洋洲" },
  { key: "antarctica", label: "南极洲" },
];
const CONTINENT_LABELS = Object.fromEntries(
  CONTINENT_OPTIONS.map((option) => [option.key, option.label])
);
const COUNTRY_CONTINENT_OVERRIDES = {
  Antarctica: "antarctica",
  Greenland: "north-america",
  Iceland: "europe",
  Russia: "asia",
  Turkey: "asia",
  Cyprus: "asia",
  Georgia: "asia",
  Armenia: "asia",
  Azerbaijan: "asia",
  Kazakhstan: "asia",
  Egypt: "africa",
  Spain: "europe",
  Portugal: "europe",
  France: "europe",
  Norway: "europe",
  Denmark: "europe",
  "Papua New Guinea": "oceania",
  "Solomon Islands": "oceania",
  Fiji: "oceania",
  Vanuatu: "oceania",
  "New Zealand": "oceania",
  Australia: "oceania",
  Japan: "asia",
  Indonesia: "asia",
  Philippines: "asia",
};
const COUNTRY_LABEL_GLOBAL_AREA = 220;
const COUNTRY_LABEL_CONTINENT_AREA = 48;
const COUNTRY_LABEL_LOCAL_AREA = 8;
const COUNTRY_LABEL_COLLISION_PADDING = 18;
const COUNTRY_LABEL_FRONT_HEMISPHERE_THRESHOLD = 0.08;

const state = {
  viewer: null,
  dataSource: null,
  gridSource: null,
  guideSource: null,
  highlightSource: null,
  countryOverlaySource: null,
  pointCollection: null,
  priorityPointCollection: null,
  labelCollection: null,
  eventById: new Map(),
  rawEvents: [],
  filteredEvents: [],
  hotspots: [],
  hotspotSearchQuery: "",
  hotspotCompareMetric: "count",
  hotspotSelectedKeys: [],
  countryBoundaries: [],
  countryByKey: new Map(),
  countryEntries: new Map(),
  countrySearchIndex: [],
  countrySpatialIndex: new Map(),
  countrySearchQuery: "",
  subdivisionManifest: new Map(),
  subdivisionManifestPromise: null,
  subdivisionDatasets: new Map(),
  subdivisionLoadPromises: new Map(),
  subdivisionAssignedCountries: new Set(),
  activeContinentKey: "all",
  hoveredCountryKey: null,
  hoveredCountryCursor: null,
  pendingHoverPosition: null,
  hoverFrameHandle: 0,
  countryLabelFrameHandle: 0,
  cameraRigInitialized: false,
  cameraOrbitLon: 0,
  cameraOrbitLat: Cesium.Math.toRadians(16),
  cameraOrbitDistance: CENTER_LOCK_DEFAULT_FOCUS_DISTANCE,
  cameraOrbitPointers: new Map(),
  cameraOrbitLastScreen: null,
  cameraOrbitGestureCenter: null,
  cameraOrbitPinchDistance: 0,
  cameraOrbitDragging: false,
  cameraOrbitMoved: false,
  cameraOrbitClickEligible: false,
  cameraOrbitActiveButton: 0,
  cameraOrbitAnimation: null,
  activeCountryKey: "all",
  activeWindow: "historic",
  encodingMode: "magnitude",
  minMagnitude: PROJECT_MIN_MAGNITUDE,
  effectiveMinMagnitude: PROJECT_MIN_MAGNITUDE,
  catalogLoaded: false,
  catalogLoadComplete: false,
  catalogCoverageComplete: false,
  catalogDatasetMode: "auto",
  catalogStart: Date.UTC(MIN_HISTORY_YEAR, 0, 1),
  catalogEnd: Date.now(),
  catalogExpectedCount: 0,
  catalogLoadedCount: 0,
  catalogBatchSize: BOOTSTRAP_BATCH_SIZE,
  catalogBatchIndex: 0,
  catalogBatchError: null,
  catalogSyncStatus: null,
  catalogSyncPollHandle: 0,
  catalogSyncPollInFlight: false,
  catalogSyncLastCompletionKey: "",
  liveSupplementPhase: "idle",
  liveSupplementStart: 0,
  liveSupplementEnd: 0,
  liveSupplementFetchedCount: 0,
  liveSupplementInsertedCount: 0,
  liveSupplementUpdatedCount: 0,
  liveSupplementCompletedAt: 0,
  liveSupplementLastError: "",
  liveSupplementDbSyncPhase: "idle",
  liveSupplementDbFetchedCount: 0,
  liveSupplementDbInsertedCount: 0,
  liveSupplementDbUpdatedCount: 0,
  liveSupplementDbStoredCount: 0,
  liveSupplementDbCompletedAt: 0,
  liveSupplementDbLastError: "",
  colorMode: "magnitude",
  heightMode: "magnitude",
  focusPreset: "global",
  gridEnabled: true,
  boundariesEnabled: true,
  autoRotate: true,
  loading: false,
  dataOrigin: "local",
  selectedEventId: null,
  feedGeneratedAt: null,
  lastFetchedAt: null,
  lastRotateFrame: performance.now(),
  pauseRotationUntil: 0,
  highlightStartedAt: Date.now(),
  rangeStart: Date.UTC(MIN_HISTORY_YEAR, 0, 1),
  rangeEnd: Date.now(),
  rangeLabel: "1949 年至今",
  queryNote: "",
  matchedCount: 0,
  statusHistory: [],
  requestSerial: 0,
  renderMode: "entities",
  boundaryLayer: null,
  boundaryReady: false,
  analysisTargets: new Map(),
  analysisTargetSerial: 0,
  analysisHoverKey: null,
  analysisFocusKey: null,
  activeAnalysisModule: "count",
  regionColorMap: new Map(),
  compareModalOpen: false,
  compareModalModule: "hotspot",
  compareTemporalGranularity: "auto",
  compareTemporalShowAverage: true,
  compareMagnitudeMode: "count",
  compareDepthMode: "count",
  compareEnergyGranularity: "auto",
  compareEnergyScale: "log",
  compareModalRender: null,
  compareAnalysisTargetKeys: [],
};

const dom = {
  magnitudeRange: document.querySelector("#magnitude-range"),
  magnitudeValue: document.querySelector("#magnitude-value"),
  startYear: document.querySelector("#start-year"),
  endYear: document.querySelector("#end-year"),
  applyYearsButton: document.querySelector("#apply-years-button"),
  dataSourceLabel: document.querySelector("#data-source-label"),
  activeWindowLabel: document.querySelector("#active-window-label"),
  feedUpdatedLabel: document.querySelector("#feed-updated-label"),
  rangeQueryNote: document.querySelector("#range-query-note"),
  refreshButton: document.querySelector("#refresh-button"),
  autoRotateButton: document.querySelector("#auto-rotate-button"),
  gridToggle: document.querySelector("#grid-toggle"),
  boundaryToggle: document.querySelector("#boundary-toggle"),
  countryResetButton: document.querySelector("#country-reset-button"),
  countryRefocusButton: document.querySelector("#country-refocus-button"),
  countrySearchInput: document.querySelector("#country-search-input"),
  countrySearchClear: document.querySelector("#country-search-clear"),
  selectedCountryChipbar: document.querySelector("#selected-country-chipbar"),
  continentFilterRow: document.querySelector("#continent-filter-row"),
  countryListMeta: document.querySelector("#country-list-meta"),
  countryList: document.querySelector("#country-list"),
  countryFilter: document.querySelector("#country-filter"),
  countryFilterNote: document.querySelector("#country-filter-note"),
  countryHoverTooltip: document.querySelector("#country-hover-tooltip"),
  legend: document.querySelector("#legend"),
  insightsPanel: document.querySelector(".insights-panel"),
  analysisScope: document.querySelector("#analysis-scope"),
  analysisDbSyncCard: document.querySelector("#analysis-db-sync"),
  analysisDbSyncTitle: document.querySelector("#analysis-db-sync-title"),
  analysisDbSyncBody: document.querySelector("#analysis-db-sync-body"),
  analysisResetButton: document.querySelector("#analysis-reset-button"),
  analysisExportButton: document.querySelector("#analysis-export-button"),
  analysisTooltip: document.querySelector("#analysis-tooltip"),
  analysisModuleToggle: document.querySelector("#analysis-module-toggle"),
  analysisModulePanels: document.querySelectorAll("[data-analysis-panel]"),
  visibleCount: document.querySelector("#visible-count"),
  strongestMag: document.querySelector("#strongest-mag"),
  avgMag: document.querySelector("#avg-mag"),
  avgDepth: document.querySelector("#avg-depth"),
  latestEventTime: document.querySelector("#latest-event-time"),
  strongestRegion: document.querySelector("#strongest-region"),
  deepShare: document.querySelector("#deep-share"),
  selectedEvent: document.querySelector("#selected-event"),
  trendChart: document.querySelector("#trend-chart"),
  magnitudeChart: document.querySelector("#magnitude-chart"),
  depthChart: document.querySelector("#depth-chart"),
  magnitudeDepthChart: document.querySelector("#magnitude-depth-chart"),
  energyChart: document.querySelector("#energy-chart"),
  energyBudget: document.querySelector("#energy-budget"),
  depthRegime: document.querySelector("#depth-regime"),
  hotspotSearchInput: document.querySelector("#hotspot-search-input"),
  hotspotSearchClear: document.querySelector("#hotspot-search-clear"),
  hotspotSelectVisible: document.querySelector("#hotspot-select-visible"),
  hotspotClearSelection: document.querySelector("#hotspot-clear-selection"),
  hotspotScopeChip: document.querySelector("#hotspot-scope-chip"),
  hotspotSelectionChip: document.querySelector("#hotspot-selection-chip"),
  hotspotSelectionSummary: document.querySelector("#hotspot-selection-summary"),
  hotspotRankingMeta: document.querySelector("#hotspot-ranking-meta"),
  hotspotMetricToggle: document.querySelector("#hotspot-metric-toggle"),
  hotspotSelectionChipbar: document.querySelector("#hotspot-selection-chipbar"),
  hotspotsList: document.querySelector("#hotspots-list"),
  eventList: document.querySelector("#event-list"),
  statusLine: document.querySelector("#status-line"),
  statusHistory: document.querySelector("#status-history"),
  resultPill: document.querySelector("#result-pill"),
  analysisCompareTargets: document.querySelector("#analysis-compare-targets"),
  analysisCompareContext: document.querySelector("#analysis-compare-context"),
  compareCountChart: document.querySelector("#compare-count-chart"),
  compareAvgMagChart: document.querySelector("#compare-avg-mag-chart"),
  compareMaxMagChart: document.querySelector("#compare-max-mag-chart"),
  compareAvgDepthChart: document.querySelector("#compare-avg-depth-chart"),
  compareModal: document.querySelector("#compare-analysis-modal"),
  compareModalWindow: document.querySelector(".compare-modal-window"),
  compareModalKicker: document.querySelector("#compare-modal-kicker"),
  compareModalTitle: document.querySelector("#compare-modal-title"),
  compareModalSubtitle: document.querySelector("#compare-modal-subtitle"),
  compareModalSummary: document.querySelector("#compare-modal-summary"),
  compareModalControls: document.querySelector("#compare-modal-controls"),
  compareModalChart: document.querySelector("#compare-modal-chart"),
  compareModalNotes: document.querySelector("#compare-modal-notes"),
  compareModalClose: document.querySelector("#compare-modal-close"),
  compareExportSvg: document.querySelector("#compare-export-svg"),
  compareExportPng: document.querySelector("#compare-export-png"),
  compareExportCsv: document.querySelector("#compare-export-csv"),
  compareExportJson: document.querySelector("#compare-export-json"),
};

document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  state.compareTemporalGranularity = normalizeCompareTimeGranularity(state.compareTemporalGranularity);
  state.compareEnergyGranularity = normalizeCompareTimeGranularity(state.compareEnergyGranularity);
  applyTimePreset(state.activeWindow, { silent: true });
  restoreStatusHistory();
  renderStatusHistory();
  initViewer();
  configureUnifiedEncodingPanel();
  configureResearchPanels();
  restoreAnalysisModulePreference();
  initializeCountryFilterUI();
  bindEvents();
  renderLegend();
  purgeLegacyFeedCache();
  syncControls();
  setStatus("正在加载本地目录摘要...");
  await loadFeed({ initial: true });
}

function initViewer() {
  state.viewer = new Cesium.Viewer("cesiumContainer", {
    baseLayer: createBaseImageryLayer(),
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    shouldAnimate: true,
    creditContainer: document.querySelector("#cesium-credits"),
  });

  state.dataSource = new Cesium.CustomDataSource("earthquakes");
  state.gridSource = new Cesium.CustomDataSource("graticule");
  state.guideSource = new Cesium.CustomDataSource("height-guides");
  state.highlightSource = new Cesium.CustomDataSource("highlight");
  state.countryOverlaySource = new Cesium.CustomDataSource("country-overlay");

  state.viewer.dataSources.add(state.gridSource);
  state.viewer.dataSources.add(state.guideSource);
  state.viewer.dataSources.add(state.dataSource);
  state.viewer.dataSources.add(state.countryOverlaySource);
  state.viewer.dataSources.add(state.highlightSource);

  const scene = state.viewer.scene;
  state.pointCollection = scene.primitives.add(new Cesium.PointPrimitiveCollection());
  state.priorityPointCollection = scene.primitives.add(new Cesium.PointPrimitiveCollection());
  state.labelCollection = scene.primitives.add(new Cesium.LabelCollection());
  state.viewer.resolutionScale = DEFAULT_RESOLUTION_SCALE;
  scene.postProcessStages.fxaa.enabled = false;
  scene.globe.maximumScreenSpaceError = 0.72;
  scene.globe.preloadAncestors = true;
  scene.globe.preloadSiblings = true;
  scene.backgroundColor = Cesium.Color.fromCssColorString("#020617");
  scene.globe.baseColor = Cesium.Color.fromCssColorString("#06111d");
  scene.globe.enableLighting = false;
  scene.globe.showGroundAtmosphere = false;
  scene.skyAtmosphere.hueShift = -0.03;
  scene.skyAtmosphere.saturationShift = 0.02;
  scene.skyAtmosphere.brightnessShift = -0.04;
  scene.postProcessStages.bloom.enabled = false;
  scene.highDynamicRange = false;
  scene.fog.enabled = false;
  configureCenteredCameraController();
  initializeCenteredCameraRig(FOCUS_PRESETS[state.focusPreset]?.destination || null);

  if ("msaaSamples" in scene) {
    scene.msaaSamples = 4;
  }

  createGraticule();
  installRenderRecovery();
  loadBoundaryOverlay();
  initSceneInteractions();
  window.addEventListener("resize", syncViewerResolution);
}

function configureCenteredCameraController() {
  const controller = state.viewer.scene.screenSpaceCameraController;
  controller.enableInputs = false;
  controller.enableRotate = false;
  controller.enableTranslate = false;
  controller.enableZoom = false;
  controller.enableTilt = false;
  controller.enableLook = false;
  controller.inertiaSpin = 0;
  controller.inertiaTranslate = 0;
  controller.inertiaZoom = 0;
  controller.minimumZoomDistance = CENTER_LOCK_MIN_DISTANCE - EARTH_RADIUS;
  controller.maximumZoomDistance = CENTER_LOCK_MAX_DISTANCE - EARTH_RADIUS;
}

function initializeCenteredCameraRig(destination) {
  const fallbackDestination =
    destination ||
    Cesium.Cartesian3.fromDegrees(108, 16, CENTER_LOCK_DEFAULT_FOCUS_DISTANCE - EARTH_RADIUS);

  syncCenteredOrbitStateFromDestination(fallbackDestination);
  state.cameraRigInitialized = true;
  applyCenteredCameraState(true);
}

function createBaseImageryLayerLegacyRemote() {
  const primaryProvider = new Cesium.UrlTemplateImageryProvider({
    url: BASE_IMAGERY_URL,
    maximumLevel: 18,
    enablePickFeatures: false,
    credit:
      'Tiles 漏 Esri, Maxar, Earthstar Geographics, and the GIS User Community',
  });

  return new Cesium.ImageryLayer(primaryProvider, {
    brightness: 1.03,
    contrast: 1.16,
    saturation: 0.94,
    gamma: 0.96,
  });
}

function syncViewerResolution() {
  if (!state.viewer) {
    return;
  }

  state.viewer.resolutionScale = getPreferredResolutionScale();
}

function getPreferredResolutionScale() {
  const dpr = window.devicePixelRatio || 1;
  const viewportPixels = window.innerWidth * window.innerHeight;
  const supersampleFloor = dpr < 1.5 ? 1.25 : dpr;
  const cap = viewportPixels >= 3800000 ? 2 : 2.35;

  return Math.max(1, Math.min(supersampleFloor, cap));
}

function createBaseImageryLayer() {
  return Cesium.ImageryLayer.fromProviderAsync(
    Cesium.TileMapServiceImageryProvider.fromUrl(NATURAL_EARTH_TEXTURES_URL),
    {
      brightness: 1.06,
      contrast: 1.08,
      saturation: 1.02,
      gamma: 0.98,
    }
  );
}

function attachOnlineImageryOverlayDeprecated() {
  const provider = new Cesium.UrlTemplateImageryProvider({
    url: BASE_IMAGERY_URL,
    maximumLevel: 18,
    enablePickFeatures: false,
  });
  const overlay = new Cesium.ImageryLayer(provider, {
    alpha: 0.98,
    brightness: 1.01,
    contrast: 1.06,
    saturation: 1,
    gamma: 1,
  });

  provider.errorEvent.addEventListener(() => {
    console.warn("Online imagery provider failed.");
  });

  state.viewer.imageryLayers.add(overlay);
}

function initSceneInteractions() {
  const canvas = state.viewer.scene.canvas;
  canvas.style.touchAction = "none";
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  canvas.addEventListener("pointerdown", () => pauseRotation());
  canvas.addEventListener("pointerleave", clearHoveredCountry);
  canvas.addEventListener(
    "wheel",
    (event) => {
      pauseRotation();
      const factor = Math.exp(event.deltaY * CENTER_LOCK_WHEEL_ZOOM_FACTOR);
      zoomCenteredCameraByFactor(factor);
      event.preventDefault();
    },
    { passive: false }
  );

  state.viewer.clock.onTick.addEventListener(() => {
    const now = performance.now();
    const delta = Math.min(0.2, (now - state.lastRotateFrame) / 1000);
    state.lastRotateFrame = now;
    updateCenteredCameraRig(delta);
  });

  state.viewer.scene.preRender.addEventListener(() => {
    applyCenteredCameraState();
  });

  canvas.addEventListener("pointerdown", (event) => {
    pauseRotation();
    updateOrbitPointer(event.pointerId, event.clientX, event.clientY);
    canvas.setPointerCapture?.(event.pointerId);

    if (state.cameraOrbitPointers.size === 1) {
      state.cameraOrbitDragging = true;
      state.cameraOrbitMoved = false;
      state.cameraOrbitClickEligible = event.button === 0;
      state.cameraOrbitActiveButton = event.button;
      state.cameraOrbitLastScreen = getCanvasRelativePosition(canvas, event.clientX, event.clientY);
      state.cameraOrbitGestureCenter = state.cameraOrbitLastScreen;
      state.cameraOrbitPinchDistance = 0;
      return;
    }

    if (state.cameraOrbitPointers.size >= 2) {
      state.cameraOrbitDragging = true;
      state.cameraOrbitMoved = true;
      state.cameraOrbitClickEligible = false;
      state.cameraOrbitActiveButton = 0;
      state.cameraOrbitGestureCenter = getOrbitPointerCentroid(canvas);
      state.cameraOrbitLastScreen = state.cameraOrbitGestureCenter;
      state.cameraOrbitPinchDistance = getOrbitPointerDistance();
    }

    clearHoveredCountry();
    event.preventDefault();
  });

  canvas.addEventListener("pointermove", (event) => {
    const hasPointer = state.cameraOrbitPointers.has(event.pointerId);
    const screenPosition = getCanvasRelativePosition(canvas, event.clientX, event.clientY);

    if (!hasPointer) {
      if (event.pointerType === "mouse") {
        scheduleCountryHoverProbe(screenPosition);
      }
      return;
    }

    updateOrbitPointer(event.pointerId, event.clientX, event.clientY);

    if (state.cameraOrbitPointers.size >= 2) {
      const center = getOrbitPointerCentroid(canvas);
      if (center && state.cameraOrbitGestureCenter) {
        orbitCameraByScreenDelta(
          center.x - state.cameraOrbitGestureCenter.x,
          center.y - state.cameraOrbitGestureCenter.y,
          canvas,
          0.78
        );
      }

      const pinchDistance = getOrbitPointerDistance();
      if (state.cameraOrbitPinchDistance > 0 && pinchDistance > 0) {
        const factor = Math.pow(
          state.cameraOrbitPinchDistance / pinchDistance,
          CENTER_LOCK_TOUCH_ZOOM_FACTOR
        );
        zoomCenteredCameraByFactor(factor);
      }

      state.cameraOrbitGestureCenter = center;
      state.cameraOrbitPinchDistance = pinchDistance;
      state.cameraOrbitMoved = true;
      clearHoveredCountry();
      event.preventDefault();
      return;
    }

    if (state.cameraOrbitDragging && state.cameraOrbitLastScreen) {
      const deltaX = screenPosition.x - state.cameraOrbitLastScreen.x;
      const deltaY = screenPosition.y - state.cameraOrbitLastScreen.y;
      if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
        orbitCameraByScreenDelta(deltaX, deltaY, canvas);
        if (Math.hypot(deltaX, deltaY) >= CENTER_LOCK_CLICK_THRESHOLD_PX * 0.35) {
          state.cameraOrbitMoved = true;
        }
      }
      state.cameraOrbitLastScreen = screenPosition;
      clearHoveredCountry();
      event.preventDefault();
      return;
    }

    if (event.pointerType === "mouse") {
      scheduleCountryHoverProbe(screenPosition);
    }
  });

  const finishPointerInteraction = (event) => {
    const screenPosition = getCanvasRelativePosition(canvas, event.clientX, event.clientY);
    const shouldClick =
      state.cameraOrbitPointers.size === 1 &&
      state.cameraOrbitClickEligible &&
      !state.cameraOrbitMoved &&
      state.cameraOrbitActiveButton === 0;

    state.cameraOrbitPointers.delete(event.pointerId);
    canvas.releasePointerCapture?.(event.pointerId);

    if (state.cameraOrbitPointers.size === 0) {
      clearOrbitGestureState();
    } else {
      syncOrbitFromRemainingPointer(canvas);
      state.cameraOrbitDragging = true;
      state.cameraOrbitClickEligible = false;
    }

    if (shouldClick) {
      handleSceneClick(screenPosition);
    }
  };

  canvas.addEventListener("pointerup", finishPointerInteraction);
  canvas.addEventListener("pointercancel", finishPointerInteraction);

  state.viewer.camera.changed.addEventListener(() => {
    scheduleCountryLabelVisibilityUpdate();
  });
  state.viewer.camera.moveEnd.addEventListener(() => {
    scheduleCountryLabelVisibilityUpdate();
  });
}

function scheduleCountryLabelVisibilityUpdate() {
  if (!state.viewer || state.countryLabelFrameHandle) {
    return;
  }

  state.countryLabelFrameHandle = window.requestAnimationFrame(() => {
    state.countryLabelFrameHandle = 0;
    updateCountryLabelVisibility();
  });
}

function initializeCountryFilterUI() {
  renderCountryFilterPanel();
}

function renderCountryFilterPanel() {
  renderContinentFilterChips();
  renderSelectedCountryChip();

  if (!dom.countryList || !dom.countryListMeta) {
    return;
  }

  const options = getVisibleCountryOptions();
  const activeContinentLabel = CONTINENT_LABELS[state.activeContinentKey] || "全部";
  const queryLabel = state.countrySearchQuery.trim();

  if (!options.length) {
    dom.countryListMeta.textContent = queryLabel
      ? `未找到与“${queryLabel}”匹配的国家/地区。`
      : `当前分组“${activeContinentLabel}”暂无可显示结果。`;
    dom.countryList.innerHTML =
      '<div class="country-empty-state">没有匹配条目。可尝试中文、英文、ISO 或切换洲分组。</div>';
    syncCountryToolbarButtons();
    return;
  }

  const grouped = groupCountryOptionsByContinent(options);
  dom.countryListMeta.textContent = queryLabel
    ? `检索到 ${formatNumber(options.length)} 个匹配国家/地区，支持中文、英文与 ISO 模糊匹配。`
    : `当前分组：${activeContinentLabel}，共 ${formatNumber(options.length)} 个国家/地区。`;

  dom.countryList.innerHTML = grouped
    .map(
      ([continentKey, entries]) => `
        <section class="country-group">
          <header class="country-group-title">
            <span>${escapeHtml(CONTINENT_LABELS[continentKey] || "其他区域")}</span>
            <small>${formatNumber(entries.length)} 个</small>
          </header>
          ${entries.map((entry) => renderCountryOption(entry)).join("")}
        </section>
      `
    )
    .join("");

  syncCountryToolbarButtons();
}

function renderContinentFilterChips() {
  if (!dom.continentFilterRow) {
    return;
  }

  dom.continentFilterRow.replaceChildren(
    ...CONTINENT_OPTIONS.map((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className =
        option.key === state.activeContinentKey ? "continent-chip active" : "continent-chip";
      button.dataset.continentKey = option.key;
      button.textContent = option.label;
      return button;
    })
  );
}

function syncCenteredOrbitStateFromDestination(destination) {
  if (!destination) {
    return;
  }

  const cartographic = Cesium.Cartographic.fromCartesian(destination);
  if (!cartographic) {
    return;
  }

  state.cameraOrbitLon = normalizeOrbitLongitude(cartographic.longitude);
  state.cameraOrbitLat = clampOrbitLatitude(cartographic.latitude);
  state.cameraOrbitDistance = clampOrbitDistance(Cesium.Cartesian3.magnitude(destination));
}

function normalizeOrbitLongitude(longitude) {
  return Cesium.Math.negativePiToPi(longitude || 0);
}

function clampOrbitLatitude(latitude) {
  return Cesium.Math.clamp(latitude || 0, CENTER_LOCK_MIN_LATITUDE, CENTER_LOCK_MAX_LATITUDE);
}

function clampOrbitDistance(distance) {
  return Cesium.Math.clamp(
    Number.isFinite(distance) ? distance : CENTER_LOCK_DEFAULT_FOCUS_DISTANCE,
    CENTER_LOCK_MIN_DISTANCE,
    CENTER_LOCK_MAX_DISTANCE
  );
}

function buildOrbitDestination(longitude, latitude, distance) {
  return Cesium.Cartesian3.fromRadians(
    normalizeOrbitLongitude(longitude),
    clampOrbitLatitude(latitude),
    Math.max(0, clampOrbitDistance(distance) - EARTH_RADIUS)
  );
}

function buildCenteredCameraOrientation(destination) {
  const direction = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.negate(destination, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  );
  const surface =
    Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(destination, new Cesium.Cartesian3()) ||
    Cesium.Cartesian3.normalize(destination, new Cesium.Cartesian3());
  const enuFrame = Cesium.Transforms.eastNorthUpToFixedFrame(surface);
  const north4 = Cesium.Matrix4.getColumn(enuFrame, 1, new Cesium.Cartesian4());
  const north = Cesium.Cartesian3.normalize(
    new Cesium.Cartesian3(north4.x, north4.y, north4.z),
    new Cesium.Cartesian3()
  );

  let right = Cesium.Cartesian3.cross(direction, north, new Cesium.Cartesian3());
  if (Cesium.Cartesian3.magnitudeSquared(right) < 1e-8) {
    const fallbackAxis =
      Math.abs(direction.z) > 0.92 ? Cesium.Cartesian3.UNIT_X : Cesium.Cartesian3.UNIT_Z;
    right = Cesium.Cartesian3.cross(direction, fallbackAxis, right);
  }
  right = Cesium.Cartesian3.normalize(right, right);

  const up = Cesium.Cartesian3.normalize(
    Cesium.Cartesian3.cross(right, direction, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  );

  return { direction, up };
}

function applyCenteredCameraState(forceRender = false) {
  if (!state.viewer || !state.cameraRigInitialized) {
    return;
  }

  const destination = buildOrbitDestination(
    state.cameraOrbitLon,
    state.cameraOrbitLat,
    state.cameraOrbitDistance
  );
  const orientation = buildCenteredCameraOrientation(destination);

  state.viewer.camera.setView({
    destination,
    orientation,
  });

  if (forceRender) {
    state.viewer.scene.requestRender();
  }
}

function updateCenteredCameraAnimation(now) {
  const animation = state.cameraOrbitAnimation;
  if (!animation) {
    return false;
  }

  const duration = Math.max(1, animation.durationMs);
  const progress = Math.min(1, (now - animation.startedAt) / duration);
  const eased = progress * progress * (3 - 2 * progress);

  state.cameraOrbitLon = normalizeOrbitLongitude(
    animation.startLon + animation.deltaLon * eased
  );
  state.cameraOrbitLat = clampOrbitLatitude(
    animation.startLat + (animation.endLat - animation.startLat) * eased
  );
  state.cameraOrbitDistance = clampOrbitDistance(
    animation.startDistance + (animation.endDistance - animation.startDistance) * eased
  );

  if (progress >= 1) {
    state.cameraOrbitAnimation = null;
  }

  return true;
}

function animateCenteredCameraToState(targetState, options = {}) {
  if (!state.viewer) {
    return;
  }

  const nextLon = normalizeOrbitLongitude(targetState.longitude);
  const nextLat = clampOrbitLatitude(targetState.latitude);
  const nextDistance = clampOrbitDistance(targetState.distance);
  const durationMs = Math.max(0, Math.round((options.duration ?? 1.4) * 1000));

  if (options.pauseRotation !== false) {
    pauseRotation(options.pauseDurationMs ?? 4500);
  }

  if (durationMs === 0 || !state.cameraRigInitialized) {
    state.cameraOrbitAnimation = null;
    state.cameraOrbitLon = nextLon;
    state.cameraOrbitLat = nextLat;
    state.cameraOrbitDistance = nextDistance;
    state.cameraRigInitialized = true;
    applyCenteredCameraState(true);
    return;
  }

  state.cameraOrbitAnimation = {
    startedAt: performance.now(),
    durationMs,
    startLon: state.cameraOrbitLon,
    startLat: state.cameraOrbitLat,
    startDistance: state.cameraOrbitDistance,
    deltaLon: Cesium.Math.negativePiToPi(nextLon - state.cameraOrbitLon),
    endLat: nextLat,
    endDistance: nextDistance,
  };
  state.cameraOrbitAnimation.endLon = normalizeOrbitLongitude(
    state.cameraOrbitAnimation.startLon + state.cameraOrbitAnimation.deltaLon
  );
}

function updateCenteredCameraRig(deltaSeconds) {
  if (!state.viewer || !state.cameraRigInitialized) {
    return;
  }

  const animated = updateCenteredCameraAnimation(performance.now());
  if (
    !state.cameraOrbitAnimation &&
    !state.cameraOrbitDragging &&
    !state.cameraOrbitPointers.size &&
    state.autoRotate &&
    Date.now() >= state.pauseRotationUntil
  ) {
    state.cameraOrbitLon = normalizeOrbitLongitude(
      state.cameraOrbitLon - ROTATE_RATE * deltaSeconds
    );
  }

  applyCenteredCameraState(animated || state.autoRotate);
}

function screenDeltaToOrbitDelta(deltaX, deltaY, canvas) {
  const width = Math.max(1, canvas?.clientWidth || 1);
  const height = Math.max(1, canvas?.clientHeight || 1);
  return {
    lon: (-deltaX / width) * Math.PI * CENTER_LOCK_DRAG_ROTATION_SPEED,
    lat: (deltaY / height) * Math.PI * CENTER_LOCK_DRAG_ROTATION_SPEED * 0.68,
  };
}

function orbitCameraByScreenDelta(deltaX, deltaY, canvas, weight = 1) {
  const delta = screenDeltaToOrbitDelta(deltaX * weight, deltaY * weight, canvas);
  state.cameraOrbitLon = normalizeOrbitLongitude(state.cameraOrbitLon + delta.lon);
  state.cameraOrbitLat = clampOrbitLatitude(state.cameraOrbitLat + delta.lat);
  state.cameraOrbitAnimation = null;
  applyCenteredCameraState(true);
}

function zoomCenteredCameraByFactor(factor) {
  if (!Number.isFinite(factor) || factor <= 0) {
    return;
  }

  state.cameraOrbitDistance = clampOrbitDistance(state.cameraOrbitDistance * factor);
  state.cameraOrbitAnimation = null;
  applyCenteredCameraState(true);
}

function getCanvasRelativePosition(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return new Cesium.Cartesian2(clientX - rect.left, clientY - rect.top);
}

function updateOrbitPointer(pointerId, clientX, clientY) {
  state.cameraOrbitPointers.set(pointerId, { clientX, clientY });
}

function getOrbitPointerCentroid(canvas) {
  const pointers = [...state.cameraOrbitPointers.values()];
  if (!pointers.length) {
    return null;
  }

  const centroidX = pointers.reduce((sum, pointer) => sum + pointer.clientX, 0) / pointers.length;
  const centroidY = pointers.reduce((sum, pointer) => sum + pointer.clientY, 0) / pointers.length;
  return getCanvasRelativePosition(canvas, centroidX, centroidY);
}

function getOrbitPointerDistance() {
  const pointers = [...state.cameraOrbitPointers.values()];
  if (pointers.length < 2) {
    return 0;
  }

  const [first, second] = pointers;
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}

function clearOrbitGestureState() {
  state.cameraOrbitLastScreen = null;
  state.cameraOrbitGestureCenter = null;
  state.cameraOrbitPinchDistance = 0;
  state.cameraOrbitDragging = false;
  state.cameraOrbitMoved = false;
  state.cameraOrbitClickEligible = false;
  state.cameraOrbitActiveButton = 0;
}

function syncOrbitFromRemainingPointer(canvas) {
  if (state.cameraOrbitPointers.size !== 1) {
    state.cameraOrbitLastScreen = null;
    state.cameraOrbitGestureCenter = null;
    state.cameraOrbitPinchDistance = 0;
    return;
  }

  const [pointer] = state.cameraOrbitPointers.values();
  state.cameraOrbitLastScreen = getCanvasRelativePosition(canvas, pointer.clientX, pointer.clientY);
  state.cameraOrbitGestureCenter = state.cameraOrbitLastScreen;
  state.cameraOrbitPinchDistance = 0;
  state.cameraOrbitMoved = false;
}

function computeAngularDistance(lonA, latA, lonB, latB) {
  const a = Cesium.Cartesian3.fromRadians(lonA, latA, 0);
  const b = Cesium.Cartesian3.fromRadians(lonB, latB, 0);
  return Math.acos(
    Cesium.Math.clamp(
      Cesium.Cartesian3.dot(
        Cesium.Cartesian3.normalize(a, new Cesium.Cartesian3()),
        Cesium.Cartesian3.normalize(b, new Cesium.Cartesian3())
      ),
      -1,
      1
    )
  );
}

function computeOrbitDistanceForAngularRadius(angularRadius, extraDistance = 0) {
  const camera = state.viewer?.camera;
  const canvas = state.viewer?.scene?.canvas;
  const verticalHalf = (camera?.frustum?.fovy || Cesium.Math.toRadians(60)) * 0.5;
  const aspect = Math.max(1, (canvas?.clientWidth || 1) / Math.max(1, canvas?.clientHeight || 1));
  const horizontalHalf = Math.atan(Math.tan(verticalHalf) * aspect);
  const fitHalfAngle = Math.max(
    Cesium.Math.toRadians(5),
    Math.min(verticalHalf, horizontalHalf) * CENTER_LOCK_FIT_VIEW_RATIO
  );
  const alpha = Cesium.Math.clamp(
    angularRadius,
    0,
    Cesium.Math.PI_OVER_TWO - Cesium.Math.toRadians(0.75)
  );
  const distance =
    EARTH_RADIUS *
      (Math.cos(alpha) + Math.sin(alpha) / Math.max(1e-3, Math.tan(fitHalfAngle))) +
    extraDistance;
  return clampOrbitDistance(Math.max(CENTER_LOCK_MIN_FOCUS_DISTANCE, distance));
}

function computeAverageGeoPoint(points) {
  let x = 0;
  let y = 0;
  let z = 0;

  for (const point of points) {
    const vector = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.fromRadians(point.lon, point.lat, 0),
      new Cesium.Cartesian3()
    );
    x += vector.x;
    y += vector.y;
    z += vector.z;
  }

  const centroid = new Cesium.Cartesian3(x, y, z);
  if (Cesium.Cartesian3.magnitudeSquared(centroid) < 1e-8) {
    return {
      lon: state.cameraOrbitLon,
      lat: state.cameraOrbitLat,
    };
  }

  const cartographic = Cesium.Cartographic.fromCartesian(centroid);
  return {
    lon: normalizeOrbitLongitude(cartographic.longitude),
    lat: clampOrbitLatitude(cartographic.latitude),
  };
}

function animateCenteredCameraToGeoFrame(points, options = {}) {
  if (!points?.length) {
    return;
  }

  const center = computeAverageGeoPoint(points);
  let maxAngularRadius = 0;
  for (const point of points) {
    maxAngularRadius = Math.max(
      maxAngularRadius,
      computeAngularDistance(center.lon, center.lat, point.lon, point.lat)
    );
  }

  animateCenteredCameraToState(
    {
      longitude: center.lon,
      latitude: center.lat,
      distance: computeOrbitDistanceForAngularRadius(
        maxAngularRadius * (options.paddingScale || 1.08),
        options.extraDistance || 0
      ),
    },
    options
  );
}

function renderSelectedCountryChip() {
  if (!dom.selectedCountryChipbar) {
    return;
  }

  if (state.activeCountryKey === "all") {
    dom.selectedCountryChipbar.innerHTML = `
      <span class="country-metric-chip">全球视图</span>
      <span class="country-metric-chip">${
        CONTINENT_LABELS[state.activeContinentKey] || "全部"
      }</span>
    `;
    return;
  }

  const country = state.countryByKey.get(state.activeCountryKey);
  if (!country) {
    dom.selectedCountryChipbar.innerHTML = "";
    return;
  }

  dom.selectedCountryChipbar.innerHTML = `
    <span class="country-selection-chip">
      <strong>${escapeHtml(country.nameZh || country.nameEn)}</strong>
      <span>${escapeHtml(country.nameEn)}</span>
      <button class="chip-dismiss" type="button" data-country-clear="true" aria-label="清除国家筛选">×</button>
    </span>
  `;
  dom.selectedCountryChipbar
    .querySelector("[data-country-clear='true']")
    ?.addEventListener("click", () => {
      clearCountryFilter({
        source: "chip",
        flyToGlobal: true,
      });
    });
}

function syncCountryToolbarButtons() {
  if (dom.countryResetButton) {
    dom.countryResetButton.classList.toggle("active", state.activeCountryKey === "all");
  }
  if (dom.countryRefocusButton) {
    dom.countryRefocusButton.disabled = state.activeCountryKey === "all";
  }
}

function getVisibleCountryOptions() {
  const query = normalizeCountryLookupKey(state.countrySearchQuery);

  return state.countrySearchIndex
    .filter((entry) => {
      if (
        state.activeContinentKey !== "all" &&
        entry.continentKey !== state.activeContinentKey
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return entry.searchTokens.some((token) => matchesCountrySearchToken(token, query));
    })
    .sort((left, right) => compareCountrySearchEntries(left, right, query));
}

function matchesCountrySearchToken(token, query) {
  if (!token || !query) {
    return true;
  }

  return token.includes(query) || isFuzzySubsequence(token, query);
}

function isFuzzySubsequence(token, query) {
  if (query.length < 2 || query.length > token.length) {
    return false;
  }

  let index = 0;
  for (const char of token) {
    if (char === query[index]) {
      index += 1;
      if (index === query.length) {
        return true;
      }
    }
  }

  return false;
}

function compareCountrySearchEntries(left, right, query) {
  const leftScore = computeCountrySearchScore(left, query);
  const rightScore = computeCountrySearchScore(right, query);
  if (leftScore !== rightScore) {
    return rightScore - leftScore;
  }

  if ((right.count || 0) !== (left.count || 0)) {
    return (right.count || 0) - (left.count || 0);
  }

  return (left.nameZh || left.nameEn).localeCompare(right.nameZh || right.nameEn, "zh-CN");
}

function computeCountrySearchScore(entry, query) {
  if (!query) {
    return entry.key === state.activeCountryKey ? 10 : 0;
  }

  let score = entry.key === state.activeCountryKey ? 20 : 0;
  for (const token of entry.searchTokens) {
    if (token === query) {
      score = Math.max(score, 120);
    } else if (token.startsWith(query)) {
      score = Math.max(score, 90);
    } else if (token.includes(query)) {
      score = Math.max(score, 70);
    } else if (isFuzzySubsequence(token, query)) {
      score = Math.max(score, 45);
    }
  }
  return score;
}

function groupCountryOptionsByContinent(entries) {
  const groups = new Map();

  for (const entry of entries) {
    const continentKey = entry.continentKey || "all";
    if (!groups.has(continentKey)) {
      groups.set(continentKey, []);
    }
    groups.get(continentKey).push(entry);
  }

  return [...groups.entries()].sort((left, right) => {
    const leftIndex = CONTINENT_OPTIONS.findIndex((option) => option.key === left[0]);
    const rightIndex = CONTINENT_OPTIONS.findIndex((option) => option.key === right[0]);
    return leftIndex - rightIndex;
  });
}

function renderCountryOption(entry) {
  const activeClass = entry.key === state.activeCountryKey ? " is-selected" : "";
  const continentLabel = CONTINENT_LABELS[entry.continentKey] || "其他区域";
  return `
    <button
      class="country-option${activeClass}"
      type="button"
      data-country-key="${entry.key}"
      role="option"
      aria-selected="${entry.key === state.activeCountryKey ? "true" : "false"}"
    >
      <span class="country-option-main">
        <span class="country-option-title">
          <span class="country-option-zh">${escapeHtml(entry.nameZh || entry.nameEn)}</span>
          <span class="country-option-en">${escapeHtml(entry.nameEn)}</span>
        </span>
        <span class="country-option-meta">
          <span>${escapeHtml(continentLabel)}</span>
          ${entry.code ? `<span>ISO ${escapeHtml(entry.code)}</span>` : ""}
        </span>
      </span>
      <span class="country-count-pill">${formatNumber(entry.count || 0)} 条</span>
    </button>
  `;
}

function clearCountryFilter(options = {}) {
  setActiveCountryFilter("all", {
    ...options,
    resetCameraOnClear: options.flyToGlobal ?? options.resetCameraOnClear ?? false,
  });
}

function setActiveCountryFilter(countryKey, options = {}) {
  const nextKey =
    countryKey === "all" || state.countryByKey.has(countryKey) || countryKey === UNCLASSIFIED_COUNTRY_KEY
      ? countryKey
      : "all";
  const selectedCountry = state.countryByKey.get(nextKey) || null;

  state.activeCountryKey = nextKey;
  state.activeContinentKey =
    nextKey === "all" ? "all" : selectedCountry?.continentKey || state.activeContinentKey;

  if (dom.countryFilter) {
    dom.countryFilter.value = nextKey;
  }

  if (dom.countrySearchInput) {
    if (nextKey === "all" && options.clearSearch) {
      dom.countrySearchInput.value = "";
      state.countrySearchQuery = "";
    } else if (selectedCountry && !options.preserveSearch) {
      dom.countrySearchInput.value = selectedCountry.nameZh || selectedCountry.nameEn;
      state.countrySearchQuery = dom.countrySearchInput.value;
    }
  }

  state.hotspotSearchQuery = "";
  state.hotspotSelectedKeys = [];
  if (dom.hotspotSearchInput) {
    dom.hotspotSearchInput.value = "";
  }

  applyFiltersAndRender();
  refreshCountryOverlay();
  updateCountryLabelVisibility();
  renderCountryFilterPanel();
  syncControls();

  if (nextKey === "all") {
    if (options.resetCameraOnClear) {
      state.focusPreset = "global";
      syncControls();
      flyToPreset("global");
    }
    setStatus(buildCountryFilterStatusMessage());
    return;
  }

  if (options.flyTo !== false) {
    flyToCountry(nextKey);
  }
  ensureSubdivisionDatasetForCountry(nextKey);
  setStatus(buildCountryFilterStatusMessage());
}

function bindEvents() {
  document.querySelectorAll("[data-window]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextWindow = button.dataset.window;
      if (!nextWindow || nextWindow === state.activeWindow || state.loading) {
        return;
      }
      applyTimePreset(nextWindow);
    });
  });

  dom.applyYearsButton?.addEventListener("click", () => {
    if (state.loading) {
      return;
    }
    applyCustomYearRange();
  });

  [dom.startYear, dom.endYear].forEach((input) => {
    input?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || state.loading) {
        return;
      }
      applyCustomYearRange();
    });
  });

  dom.magnitudeRange.addEventListener("input", () => {
    const nextMagnitude = clampProjectMagnitude(dom.magnitudeRange.value);
    state.minMagnitude = nextMagnitude;
    dom.magnitudeRange.value = nextMagnitude.toFixed(1);
    applyFiltersAndRender();
  });

  dom.magnitudeRange.addEventListener("change", () => {
    const nextMagnitude = clampProjectMagnitude(dom.magnitudeRange.value);
    const wasClamped = Number(dom.magnitudeRange.value) < PROJECT_MIN_MAGNITUDE;
    state.minMagnitude = nextMagnitude;
    dom.magnitudeRange.value = nextMagnitude.toFixed(1);
    if (wasClamped) {
      setStatus("本项目仅分析 M3.0 及以上地震事件。", "warning");
    }
    if (!state.loading) {
      applyFiltersAndRender();
    }
  });

  dom.countryFilter?.addEventListener("change", () => {
    setActiveCountryFilter(dom.countryFilter.value || "all", {
      source: "selector",
      flyTo: true,
      resetCameraOnClear: true,
    });
  });

  dom.countryResetButton?.addEventListener("click", () => {
    clearCountryFilter({
      source: "toolbar",
      flyToGlobal: true,
      clearSearch: true,
    });
  });

  dom.countryRefocusButton?.addEventListener("click", () => {
    if (state.activeCountryKey !== "all") {
      flyToCountry(state.activeCountryKey);
    }
  });

  dom.countrySearchInput?.addEventListener("input", () => {
    state.countrySearchQuery = dom.countrySearchInput.value.trim();
    renderCountryFilterPanel();
  });

  dom.countrySearchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      dom.countrySearchInput.value = "";
      state.countrySearchQuery = "";
      renderCountryFilterPanel();
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    const [firstMatch] = getVisibleCountryOptions();
    if (!firstMatch) {
      return;
    }

    event.preventDefault();
    setActiveCountryFilter(firstMatch.key, {
      source: "search",
      flyTo: true,
      preserveSearch: true,
    });
  });

  dom.countrySearchClear?.addEventListener("click", () => {
    dom.countrySearchInput.value = "";
    state.countrySearchQuery = "";
    renderCountryFilterPanel();
    dom.countrySearchInput?.focus();
  });

  dom.continentFilterRow?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-continent-key]");
    if (!button) {
      return;
    }
    state.activeContinentKey = button.getAttribute("data-continent-key") || "all";
    renderCountryFilterPanel();
  });

  dom.countryList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-country-key]");
    if (!button) {
      return;
    }
    const countryKey = button.getAttribute("data-country-key");
    if (!countryKey) {
      return;
    }
    setActiveCountryFilter(countryKey, {
      source: "panel",
      flyTo: true,
      preserveSearch: true,
    });
  });

  document.querySelectorAll("[data-color-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextMode = button.dataset.colorMode;
      if (!nextMode || nextMode === state.encodingMode) {
        return;
      }
      setEncodingMode(nextMode);
    });
  });

  document.querySelectorAll("[data-focus]").forEach((button) => {
    button.addEventListener("click", () => {
      const focusKey = button.dataset.focus;
      if (!focusKey) {
        return;
      }
      state.focusPreset = focusKey;
      syncControls();
      flyToPreset(focusKey);
      setStatus(`镜头已切换到“${FOCUS_PRESETS[focusKey].label}”。`);
    });
  });

  dom.gridToggle.addEventListener("change", () => {
    state.gridEnabled = dom.gridToggle.checked;
    state.gridSource.show = state.gridEnabled;
    setStatus(state.gridEnabled ? "已显示经纬网格。" : "已隐藏经纬网格。");
  });

  dom.boundaryToggle?.addEventListener("change", () => {
    state.boundariesEnabled = dom.boundaryToggle.checked;
    if (state.boundaryLayer) {
      state.boundaryLayer.show = state.boundariesEnabled;
      state.viewer?.scene.requestRender();
    }
    updateCountryLabelVisibility();
    refreshCountryOverlay();
    setStatus(
      state.boundariesEnabled
        ? "已显示国家/地区边界。"
        : "已隐藏国家/地区边界。"
    );
  });

  dom.refreshButton.addEventListener("click", () => {
    if (state.loading) {
      return;
    }
    loadFeed({ force: true });
  });

  dom.autoRotateButton.addEventListener("click", () => {
    state.autoRotate = !state.autoRotate;
    syncControls();
    setStatus(state.autoRotate ? "自动旋转已开启。" : "自动旋转已关闭。");
  });

  dom.eventList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-event-id]");
    if (!button) {
      return;
    }
    const eventId = button.getAttribute("data-event-id");
    if (eventId) {
      selectEventById(eventId, { flyTo: true });
    }
  });

  dom.hotspotSearchInput?.addEventListener("input", () => {
    state.hotspotSearchQuery = dom.hotspotSearchInput.value.trim();
    renderHotspots();
  });

  dom.hotspotSearchInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }
    dom.hotspotSearchInput.value = "";
    state.hotspotSearchQuery = "";
    renderHotspots();
  });

  dom.hotspotSearchClear?.addEventListener("click", () => {
    state.hotspotSearchQuery = "";
    if (dom.hotspotSearchInput) {
      dom.hotspotSearchInput.value = "";
      dom.hotspotSearchInput.focus();
    }
    renderHotspots();
  });

  dom.hotspotSelectVisible?.addEventListener("click", () => {
    selectVisibleHotspots();
  });

  dom.hotspotClearSelection?.addEventListener("click", () => {
    clearHotspotSelection();
  });

  dom.insightsPanel?.addEventListener("click", (event) => {
    const removeChip = event.target.closest("[data-remove-compare-region]");
    if (removeChip) {
      const hotspotKey = removeChip.getAttribute("data-remove-compare-region");
      if (hotspotKey) {
        event.preventDefault();
        event.stopPropagation();
        state.hotspotSelectedKeys = state.hotspotSelectedKeys.filter((key) => key !== hotspotKey);
        refreshAnalysisViews();
        setStatus("已从多地区对比集合中移除该地区。");
      }
      return;
    }

    if (event.target.closest("[data-clear-compare-regions]")) {
      event.preventDefault();
      event.stopPropagation();
      clearHotspotSelection();
    }
  });

  dom.hotspotMetricToggle?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-hotspot-metric]");
    if (!button) {
      return;
    }
    const nextMetric = button.getAttribute("data-hotspot-metric");
    if (!nextMetric || nextMetric === state.hotspotCompareMetric) {
      return;
    }
    state.hotspotCompareMetric = nextMetric;
    refreshAnalysisViews();
  });

  dom.hotspotsList?.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-hotspot-toggle]");
    if (toggle) {
      const hotspotKey = toggle.getAttribute("data-hotspot-key");
      if (hotspotKey) {
        event.preventDefault();
        event.stopPropagation();
        toggleHotspotSelection(hotspotKey);
      }
      return;
    }

    const row = event.target.closest("[data-hotspot-row]");
    if (!row) {
      return;
    }

    const hotspotKey = row.getAttribute("data-hotspot-key");
    const analysisKey = row.getAttribute("data-analysis-key");
    if (!hotspotKey || !analysisKey) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    ensureHotspotSelected(hotspotKey);
    handleAnalysisInteractionClick(analysisKey);
    refreshAnalysisViews();
  });

  dom.analysisResetButton?.addEventListener("click", () => {
    resetAnalysisView();
  });

  dom.analysisExportButton?.addEventListener("click", () => {
    exportAnalysisSnapshot();
  });

  dom.analysisModuleToggle?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-analysis-module]");
    if (!button) {
      return;
    }
    const nextModule = button.getAttribute("data-analysis-module");
    if (!nextModule || nextModule === state.activeAnalysisModule) {
      return;
    }
    setActiveAnalysisModule(nextModule);
  });

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open-compare]");
    if (!trigger) {
      return;
    }
    if (trigger.disabled) {
      return;
    }
    event.preventDefault();
    handleOpenCompareTrigger(trigger);
  });

  dom.compareModal?.addEventListener("click", (event) => {
    const closer = event.target.closest("[data-close-compare]");
    if (closer) {
      closeCompareAnalysisModal();
      return;
    }

    const control = event.target.closest("[data-compare-control]");
    if (!control) {
      return;
    }

    const controlName = control.getAttribute("data-compare-control");
    const nextValue = control.getAttribute("data-value");
    if (!controlName || nextValue == null) {
      return;
    }

    applyCompareControlValue(controlName, nextValue);
  });

  dom.compareExportSvg?.addEventListener("click", () => {
    exportCompareFigure("svg");
  });

  dom.compareExportPng?.addEventListener("click", () => {
    exportCompareFigure("png");
  });

  dom.compareExportCsv?.addEventListener("click", () => {
    exportCompareDataset("csv");
  });

  dom.compareExportJson?.addEventListener("click", () => {
    exportCompareDataset("json");
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.compareModalOpen) {
      closeCompareAnalysisModal();
    }
  });

  bindAnalysisInteractions();
  bindCompareModalInteractions();
}

function bindAnalysisInteractions() {
  if (!dom.insightsPanel) {
    return;
  }

  dom.insightsPanel.addEventListener("pointerover", (event) => {
    const target = event.target.closest("[data-analysis-key]");
    if (!target) {
      return;
    }
    const analysisKey = target.getAttribute("data-analysis-key");
    if (!analysisKey) {
      return;
    }
    setAnalysisHoverKey(analysisKey);
    positionAnalysisTooltip(analysisKey, event);
  });

  dom.insightsPanel.addEventListener("pointermove", (event) => {
    const target = event.target.closest("[data-analysis-key]");
    if (!target) {
      return;
    }
    const analysisKey = target.getAttribute("data-analysis-key");
    if (!analysisKey) {
      return;
    }
    positionAnalysisTooltip(analysisKey, event);
  });

  dom.insightsPanel.addEventListener("pointerout", (event) => {
    const current = event.target.closest("[data-analysis-key]");
    const next = event.relatedTarget?.closest?.("[data-analysis-key]") || null;
    if (current && current !== next) {
      setAnalysisHoverKey(null);
      hideAnalysisTooltip();
    }
  });

  dom.insightsPanel.addEventListener("click", (event) => {
    const hotspotBar = event.target.closest("[data-hotspot-bar]");
    if (hotspotBar) {
      const hotspotKey = hotspotBar.getAttribute("data-hotspot-key");
      const analysisKey = hotspotBar.getAttribute("data-analysis-key");
      if (hotspotKey && analysisKey) {
        event.preventDefault();
        ensureHotspotSelected(hotspotKey);
        handleAnalysisInteractionClick(analysisKey);
        refreshAnalysisViews();
      }
      return;
    }

    const target = event.target.closest("[data-analysis-key]");
    if (!target) {
      return;
    }
    const analysisKey = target.getAttribute("data-analysis-key");
    if (!analysisKey) {
      return;
    }
    event.preventDefault();
    handleAnalysisInteractionClick(analysisKey);
  });
}

function bindCompareModalInteractions() {
  if (!dom.compareModalChart) {
    return;
  }

  dom.compareModalChart.addEventListener("pointerover", (event) => {
    const target = event.target.closest("[data-analysis-key]");
    if (!target) {
      return;
    }
    const analysisKey = target.getAttribute("data-analysis-key");
    if (!analysisKey) {
      return;
    }
    setAnalysisHoverKey(analysisKey);
    positionAnalysisTooltip(analysisKey, event);
  });

  dom.compareModalChart.addEventListener("pointermove", (event) => {
    const target = event.target.closest("[data-analysis-key]");
    if (!target) {
      return;
    }
    const analysisKey = target.getAttribute("data-analysis-key");
    if (!analysisKey) {
      return;
    }
    positionAnalysisTooltip(analysisKey, event);
  });

  dom.compareModalChart.addEventListener("pointerout", (event) => {
    const current = event.target.closest("[data-analysis-key]");
    const next = event.relatedTarget?.closest?.("[data-analysis-key]") || null;
    if (current && current !== next) {
      setAnalysisHoverKey(null);
      hideAnalysisTooltip();
    }
  });

  dom.compareModalChart.addEventListener("click", (event) => {
    const target = event.target.closest("[data-analysis-key]");
    if (!target) {
      return;
    }
    const analysisKey = target.getAttribute("data-analysis-key");
    if (!analysisKey) {
      return;
    }
    event.preventDefault();
    handleAnalysisInteractionClick(analysisKey);
  });
}

function restoreAnalysisModulePreference() {
  try {
    const storedModule = localStorage.getItem(ANALYSIS_MODULE_STORAGE_KEY);
    if (storedModule && ANALYSIS_MODULES[storedModule]) {
      state.activeAnalysisModule = storedModule;
    }
  } catch (error) {
    console.warn("Failed to restore analysis module preference", error);
  }

  syncAnalysisModulePanels();
}

function syncAnalysisModulePanels() {
  dom.analysisModulePanels?.forEach((panel) => {
    const panelKey = panel.getAttribute("data-analysis-panel");
    const isActive = panelKey === state.activeAnalysisModule;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });
}

function setActiveAnalysisModule(nextModule, options = {}) {
  if (!ANALYSIS_MODULES[nextModule]) {
    return;
  }

  state.activeAnalysisModule = nextModule;

  try {
    localStorage.setItem(ANALYSIS_MODULE_STORAGE_KEY, nextModule);
  } catch (error) {
    console.warn("Failed to persist analysis module preference", error);
  }

  syncAnalysisModulePanels();
  syncControls();
  renderActiveAnalysisModule();
  renderCompareAnalysisModal();

  if (!options.silent) {
    setStatus(`已切换到${ANALYSIS_MODULES[nextModule].label}。`);
  }
}

function refreshAnalysisViews() {
  renderHotspotWorkbench();
  renderAnalysisCompareHeader();
  renderActiveAnalysisModule();
  renderHotspots();
  renderCompareAnalysisModal();
  syncControls();
}

function syncCompareModalState() {
  if (!dom.compareModal || !dom.compareModalWindow) {
    return;
  }

  dom.compareModal.hidden = !state.compareModalOpen;
  const hasFigure = Boolean(state.compareModalRender?.figureSvg);
  const hasData = Boolean(state.compareModalRender?.dataRows?.length);
  dom.compareExportSvg && (dom.compareExportSvg.disabled = !hasFigure);
  dom.compareExportPng && (dom.compareExportPng.disabled = !hasFigure);
  dom.compareExportCsv && (dom.compareExportCsv.disabled = !hasData);
  dom.compareExportJson && (dom.compareExportJson.disabled = !hasData);
  document.body.classList.toggle("compare-modal-open", state.compareModalOpen);
}

function resetAnalysisTargets() {
  state.analysisTargets = new Map();
  state.analysisTargetSerial = 0;
  state.analysisHoverKey = null;
  state.analysisFocusKey = null;
  hideAnalysisTooltip();
}

function registerAnalysisTarget(payload) {
  state.analysisTargetSerial += 1;
  const key = `analysis-${state.analysisTargetSerial}`;
  state.analysisTargets.set(key, payload);
  return key;
}

function getAnalysisTarget(key) {
  return key ? state.analysisTargets.get(key) || null : null;
}

function setAnalysisHoverKey(key) {
  if (state.analysisHoverKey === key) {
    return;
  }
  state.analysisHoverKey = key;
  updateHighlight(getSelectedEvent());
}

function handleAnalysisInteractionClick(analysisKey) {
  const target = getAnalysisTarget(analysisKey);
  if (!target) {
    return;
  }

  if (target.type === "event" && target.eventId) {
    selectEventById(target.eventId, { flyTo: true });
    return;
  }

  if (state.analysisFocusKey === analysisKey) {
    state.analysisFocusKey = null;
    updateHighlight(getSelectedEvent());
    setStatus("已重置分析高亮视图。");
    return;
  }

  state.analysisFocusKey = analysisKey;
  updateHighlight(getSelectedEvent());

  const highlightedEvents = resolveAnalysisHighlightEvents(target);
  if (highlightedEvents.length > 1) {
    zoomToEventSubset(highlightedEvents);
  } else if (highlightedEvents.length === 1) {
    flyToEvent(highlightedEvents[0]);
  }

  setStatus(
    target.statusMessage ||
      `已在地图中高亮 ${target.label || "分析分组"}，共 ${formatNumber(
        target.totalCount || highlightedEvents.length
      )} 条事件。`
  );
}

function resetAnalysisView() {
  state.analysisHoverKey = null;
  state.analysisFocusKey = null;
  state.hotspotSelectedKeys = [];
  closeCompareAnalysisModal({ silent: true });
  hideAnalysisTooltip();
  updateHighlight(getSelectedEvent());
  refreshAnalysisViews();
  setStatus("已重置分析视图。");
}

function exportAnalysisSnapshot() {
  const strongest = pickFeaturedEvent(state.filteredEvents);
  const latestEvent = getLatestEvent(state.filteredEvents);
  const diagnostics = computeCatalogDiagnostics(state.filteredEvents);
  const depthRegime = computeDepthRegime(state.filteredEvents);
  const energyBudget = computeEnergyBudget(state.filteredEvents);
  const payload = {
    exportedAt: new Date().toISOString(),
    filters: {
      rangeLabel: state.rangeLabel,
      rangeStart: new Date(state.rangeStart).toISOString(),
      rangeEnd: new Date(state.rangeEnd).toISOString(),
      minMagnitude: state.minMagnitude,
      effectiveMinMagnitude: state.effectiveMinMagnitude,
      activeCountry: getCountryDisplayNameByKey(state.activeCountryKey),
      activeAnalysisModule: state.activeAnalysisModule,
      encodingMode: state.encodingMode,
    },
    summary: {
      eventCount: state.filteredEvents.length,
      strongestMagnitude: strongest?.mag || null,
      strongestPlace: strongest?.place || null,
      averageMagnitude: computeMeanMagnitude(state.filteredEvents),
      averageDepthKm: computeMeanDepth(state.filteredEvents),
      latestEventTime: latestEvent?.time ? new Date(latestEvent.time).toISOString() : null,
    },
    diagnostics,
    depthRegime,
    energyBudget,
    hotspots: state.hotspots.slice(0, 10).map((item) => ({
      name: item.displayName || item.name,
      shortName: item.shortName,
      scopeLabel: item.scopeLabel,
      count: item.count,
      maxMagnitude: item.maxMag,
      averageMagnitude: item.avgMag,
    })),
    hotspotComparison: {
      metric: state.hotspotCompareMetric,
      selectedRegions: state.hotspotSelectedKeys
        .map((key) => findHotspotByKey(key))
        .filter(Boolean)
        .map((item) => ({
          name: item.displayName || item.name,
          count: item.count,
          averageMagnitude: item.avgMag,
          maximumMagnitude: item.maxMag,
          averageDepthKm: item.avgDepth,
        })),
    },
    focusedEvent: getSelectedEvent(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
  anchor.href = url;
  anchor.download = `earthquake-analysis-${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus("已导出当前分析快照。");
}

function positionAnalysisTooltip(analysisKey, event) {
  const target = getAnalysisTarget(analysisKey);
  if (!target || !dom.analysisTooltip) {
    return;
  }

  const lines = Array.isArray(target.tooltipLines) ? target.tooltipLines : [];
  dom.analysisTooltip.innerHTML = `
    <strong>${escapeHtml(target.tooltipTitle || target.label || "分析详情")}</strong>
    ${lines.map((line) => `<span>${escapeHtml(line)}</span>`).join("")}
  `;
  dom.analysisTooltip.hidden = false;

  const margin = 18;
  const rect = dom.analysisTooltip.getBoundingClientRect();
  const left = Math.min(window.innerWidth - rect.width - margin, event.clientX + 16);
  const top = Math.min(window.innerHeight - rect.height - margin, event.clientY + 16);
  dom.analysisTooltip.style.left = `${Math.max(margin, left)}px`;
  dom.analysisTooltip.style.top = `${Math.max(margin, top)}px`;
}

function hideAnalysisTooltip() {
  if (!dom.analysisTooltip) {
    return;
  }
  dom.analysisTooltip.hidden = true;
}

function applyTimePreset(windowKey, options = {}) {
  const preset = TIME_PRESETS[windowKey];
  if (!preset) {
    return;
  }

  const range = preset.getRange();
  state.activeWindow = windowKey;
  setActiveRange(range.start, range.end, preset.label);

  if (!options.silent) {
    syncControls();
    if (state.catalogLoaded) {
      applyFiltersAndRender();
      setStatus(`已切换到 ${preset.label}，当前分析基于${getCatalogSourceLabel()}。`);
    }
  }
}

function applyCustomYearRange() {
  const startYear = clampYear(dom.startYear?.value, MIN_HISTORY_YEAR);
  const endYear = clampYear(dom.endYear?.value, CURRENT_YEAR);
  const normalizedStart = Math.min(startYear, endYear);
  const normalizedEnd = Math.max(startYear, endYear);
  const endTimestamp =
    normalizedEnd >= CURRENT_YEAR
      ? Date.now()
      : Date.UTC(normalizedEnd + 1, 0, 1) - 1;

  state.activeWindow = "custom";
  setActiveRange(
    Date.UTC(normalizedStart, 0, 1),
    endTimestamp,
    `${normalizedStart} 年 - ${normalizedEnd} 年`
  );
  syncControls();
  if (state.catalogLoaded) {
    applyFiltersAndRender();
    setStatus(`已应用 ${normalizedStart} 年至 ${normalizedEnd} 年区间，当前分析基于${getCatalogSourceLabel()}。`);
  }
}

function setActiveRange(start, end, label) {
  state.rangeStart = start;
  state.rangeEnd = end;
  state.rangeLabel = label;
  state.queryNote = `当前区间覆盖 ${formatDateRange(start, end)}。`;

  if (dom.startYear) {
    dom.startYear.value = String(new Date(start).getUTCFullYear());
  }

  if (dom.endYear) {
    dom.endYear.value = String(new Date(end).getUTCFullYear());
  }
}

async function loadFeed(options = {}) {
  if (state.catalogLoaded && state.catalogLoadComplete && state.rawEvents.length && !options.force) {
    syncCatalogSyncPolling();
    applyFiltersAndRender();
  if (!options.silent) {
      setStatus(`当前分批目录已加载完成；后续筛选与分析均基于${getCatalogSourceLabel()}完成。`);
    }
    return;
  }

  const requestId = ++state.requestSerial;
  let queryPlan = null;
  state.loading = true;
  syncControls();
  if (!state.rawEvents.length) {
    renderAnalysisLoadingState();
  }
  setStatus("正在加载本地目录摘要...");

  try {
    queryPlan = await resolveQueryPlan(requestId);
    if (requestId !== state.requestSerial) {
      return;
    }

    await fetchCatalogSummaryPayload(queryPlan, requestId);

    if (requestId !== state.requestSerial) {
      return;
    }

    prepareCatalogStreamState(queryPlan);

    if (!queryPlan.matchedCount) {
      state.catalogLoaded = true;
      state.catalogLoadComplete = true;
      state.queryNote = buildLocalAnalysisNote(state.filteredEvents);
      renderAll();
      setStatus(`${getCatalogSourceLabel()}当前没有可显示的 M3.0+ 事件。`, "warning");
      return;
    }

    await streamCatalogBatches(queryPlan, requestId, options);

    if (requestId !== state.requestSerial) {
      return;
    }

    await fetchStaticLiveSupplement(queryPlan, requestId);

    if (requestId !== state.requestSerial) {
      return;
    }

    state.catalogLoadComplete = true;
    state.catalogBatchError = null;
    state.queryNote = buildLocalAnalysisNote(state.filteredEvents);
    renderAll();
    setStatus(buildLoadSuccessMessage(queryPlan));
  } catch (error) {
    if (error.message === "REQUEST_CANCELLED") {
      return;
    }

    if (state.rawEvents.length) {
      state.catalogBatchError = error.message;
      state.catalogLoaded = true;
      state.catalogLoadComplete = false;
      state.queryNote = buildLocalAnalysisNote(state.filteredEvents);
      renderAll();
      setStatus(
        `第 ${Math.max(1, state.catalogBatchIndex)} 批加载失败，已保留当前已加载的 ${formatNumber(
          state.catalogLoadedCount
        )} 条数据；刷新后可重试。`,
        "warning"
      );
    } else {
      state.rawEvents = [];
      state.filteredEvents = [];
      state.hotspots = [];
      state.selectedEventId = null;
      state.matchedCount = 0;
      state.effectiveMinMagnitude = clampProjectMagnitude(state.minMagnitude);
      state.catalogLoaded = false;
      state.catalogLoadComplete = false;
      state.catalogExpectedCount = 0;
      state.catalogLoadedCount = 0;
      state.catalogBatchError = error.message;
      state.queryNote = `无法完成${getCatalogSourceLabel()}载入：${error.message}`;
      renderAll();
      setStatus(`无法从${getCatalogSourceLabel()}加载历史目录：${error.message}`, "error");
    }
  } finally {
    if (requestId === state.requestSerial) {
      state.loading = false;
      syncControls();
    }
  }
}

async function resolveQueryPlan(requestId) {
  if (requestId !== state.requestSerial) {
    throw new Error("REQUEST_CANCELLED");
  }

  return {
    mode: "catalog",
    start: Date.UTC(MIN_HISTORY_YEAR, 0, 1),
    end: Date.now(),
    label: "1949 年至今 M3.0+ 历史目录",
    requestedMinMagnitude: PROJECT_MIN_MAGNITUDE,
    queryMinMagnitude: PROJECT_MIN_MAGNITUDE,
    matchedCount: 0,
    storedCount: 0,
    isCovered: false,
    batchSize: BOOTSTRAP_BATCH_SIZE,
    chunks: [],
  };
}

async function fetchCatalogSummaryPayload(queryPlan, requestId) {
  if (requestId !== state.requestSerial) {
    throw new Error("REQUEST_CANCELLED");
  }

  state.effectiveMinMagnitude = PROJECT_MIN_MAGNITUDE;
  state.queryNote = "正在加载本地目录摘要。";
  const payload = await fetchCatalogSummarySourcePayload();
  const metadata = payload?.metadata || {};
  const storedCount = Number(payload?.metadata?.storedCount || 0);
  const isCovered = Boolean(payload?.metadata?.isCovered);
  const batchSize = Number(payload?.metadata?.batchSizeSuggested || BOOTSTRAP_BATCH_SIZE);
  queryPlan.matchedCount = Number(metadata.count || 0);
  queryPlan.storedCount = storedCount;
  queryPlan.isCovered = isCovered;
  queryPlan.batchSize = Math.max(1000, Math.min(20000, batchSize || BOOTSTRAP_BATCH_SIZE));
  queryPlan.end = Number(metadata.endTime || queryPlan.end || Date.now());
  queryPlan.batches = Array.isArray(payload?.batches) ? payload.batches : [];
  state.feedGeneratedAt = Number(metadata.generated || Date.now());
  state.lastFetchedAt = Date.now();
  state.catalogExpectedCount = queryPlan.matchedCount;
  state.catalogBatchSize = queryPlan.batchSize;
  state.catalogEnd = queryPlan.end;
  state.catalogCoverageComplete = isCovered;
  state.catalogDatasetMode =
    String(metadata.sourceMode || "").toLowerCase() === "static" || queryPlan.batches.length
      ? "static"
      : "local";
  state.catalogSyncStatus =
    state.catalogDatasetMode === "static"
      ? null
      : normalizeCatalogSyncStatus(metadata.sync || null);
  state.queryNote = buildLocalQueryNote(queryPlan, storedCount);
  syncCatalogSyncPolling();

  if (!storedCount && !queryPlan.matchedCount) {
    throw new Error("LOCAL_DB_EMPTY");
  }

  return payload;
}

async function fetchCatalogSummarySourcePayload() {
  const staticResponse = await fetch(STATIC_BOOTSTRAP_MANIFEST_URL, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  }).catch(() => null);

  if (staticResponse?.ok) {
    return staticResponse.json();
  }

  const response = await fetch(LOCAL_BOOTSTRAP_URL, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`LOCAL_HTTP ${response.status}`);
  }

  return response.json();
}

function prepareCatalogStreamState(queryPlan) {
  state.dataOrigin = state.catalogDatasetMode === "static" ? "static" : "local";
  state.rawEvents = [];
  state.filteredEvents = [];
  state.hotspots = [];
  state.selectedEventId = null;
  state.eventById = new Map();
  state.matchedCount = 0;
  state.catalogLoaded = false;
  state.catalogLoadComplete = false;
  state.catalogLoadedCount = 0;
  state.catalogExpectedCount = queryPlan.matchedCount;
  state.catalogBatchIndex = 0;
  state.catalogBatchError = null;
  state.catalogStart = queryPlan.start;
  state.catalogEnd = state.catalogDatasetMode === "static" ? 0 : queryPlan.end;
  state.liveSupplementPhase = "idle";
  state.liveSupplementStart = 0;
  state.liveSupplementEnd = 0;
  state.liveSupplementFetchedCount = 0;
  state.liveSupplementInsertedCount = 0;
  state.liveSupplementUpdatedCount = 0;
  state.liveSupplementCompletedAt = 0;
  state.liveSupplementLastError = "";
  state.liveSupplementDbSyncPhase = "idle";
  state.liveSupplementDbFetchedCount = 0;
  state.liveSupplementDbInsertedCount = 0;
  state.liveSupplementDbUpdatedCount = 0;
  state.liveSupplementDbStoredCount = 0;
  state.liveSupplementDbCompletedAt = 0;
  state.liveSupplementDbLastError = "";
  clearEarthquakeRenderLayers();
  renderAll();
}

async function streamCatalogBatches(queryPlan, requestId, options = {}) {
  let offset = 0;
  let batchIndex = 0;
  let isFirstBatch = true;

  while (offset < queryPlan.matchedCount) {
    if (requestId !== state.requestSerial) {
      throw new Error("REQUEST_CANCELLED");
    }

    batchIndex += 1;
    state.catalogBatchIndex = batchIndex;
    state.queryNote = buildBatchLoadingQueryNote(queryPlan, batchIndex, offset);
    setStatus(buildBatchLoadingStatusLine(queryPlan, batchIndex, offset));

    const payload = await fetchCatalogBatchPayload(queryPlan, offset, requestId);
    if (requestId !== state.requestSerial) {
      throw new Error("REQUEST_CANCELLED");
    }

    const appendedCount = appendCatalogBatch(payload, options, isFirstBatch);
    const nextOffset = Number(payload?.metadata?.nextOffset || offset + appendedCount);
    const hasMore = Boolean(payload?.metadata?.hasMore);

    if (!appendedCount && hasMore) {
      throw new Error("LOCAL_BATCH_EMPTY");
    }

    offset = nextOffset;
    isFirstBatch = false;

    if (!hasMore || appendedCount <= 0) {
      break;
    }
  }
}

async function fetchStaticLiveSupplement(queryPlan, requestId) {
  if (!shouldFetchStaticLiveSupplement(queryPlan)) {
    return;
  }

  const supplementPlan = buildStaticLiveSupplementPlan(queryPlan);
  if (!supplementPlan) {
    return;
  }

  state.liveSupplementPhase = "running";
  state.liveSupplementStart = supplementPlan.start;
  state.liveSupplementEnd = supplementPlan.end;
  state.liveSupplementFetchedCount = 0;
  state.liveSupplementInsertedCount = 0;
  state.liveSupplementUpdatedCount = 0;
  state.liveSupplementCompletedAt = 0;
  state.liveSupplementLastError = "";

  const normalizedEvents = [];

  try {
    for (let chunkIndex = 0; chunkIndex < supplementPlan.chunks.length; chunkIndex += 1) {
      const chunk = supplementPlan.chunks[chunkIndex];
      let pageIndex = 0;

      while (true) {
        if (requestId !== state.requestSerial) {
          throw new Error("REQUEST_CANCELLED");
        }

        state.queryNote = buildLiveSupplementQueryNote(supplementPlan, chunkIndex, pageIndex);
        setStatus(buildLiveSupplementStatusLine(supplementPlan, chunkIndex, pageIndex));

        const offset = pageIndex * QUERY_PAGE_SIZE + 1;
        const url = buildUsgsUrl(USGS_QUERY_URL, {
          format: "geojson",
          eventtype: "earthquake",
          orderby: "time",
          starttime: formatQueryDate(chunk.start),
          endtime: formatQueryDate(chunk.end),
          minmagnitude: PROJECT_MIN_MAGNITUDE.toFixed(1),
          limit: QUERY_PAGE_SIZE,
          offset,
        });

        const response = await fetch(url, {
          cache: "no-store",
          headers: { Accept: "application/geo+json, application/json" },
        });

        if (!response.ok) {
          throw new Error(`LIVE_SUPPLEMENT_HTTP ${response.status}`);
        }

        const payload = await response.json();
        const batch = Array.isArray(payload?.features) ? payload.features : [];
        state.liveSupplementFetchedCount += batch.length;
        normalizedEvents.push(...batch.map(normalizeFeature).filter(Boolean));

        if (batch.length < QUERY_PAGE_SIZE) {
          break;
        }

        pageIndex += 1;
      }
    }

    const mergeResult = mergeCatalogEvents(normalizedEvents);
    state.liveSupplementInsertedCount = mergeResult.insertedCount;
    state.liveSupplementUpdatedCount = mergeResult.updatedCount;
    state.liveSupplementCompletedAt = Date.now();
    state.liveSupplementPhase = "completed";
    state.feedGeneratedAt = Date.now();
    state.catalogEnd = Math.max(
      state.catalogEnd,
      supplementPlan.end,
      getLatestEventTimestamp(state.rawEvents)
    );
    state.catalogExpectedCount = Math.max(state.catalogExpectedCount, state.rawEvents.length);
    applyFiltersAndRender();
    setStatus(buildLiveSupplementCompletedLine());
    void persistLiveSupplementToDatabase(normalizedEvents, requestId);
  } catch (error) {
    if (error.message === "REQUEST_CANCELLED") {
      throw error;
    }

    state.liveSupplementPhase = "failed";
    state.liveSupplementLastError = error.message;
    state.queryNote = buildLocalAnalysisNote(state.filteredEvents);
    renderAll();
    setStatus(
      `静态历史目录已载入，但最新事件补充失败：${error.message}。当前仍可基于已加载目录继续分析。`,
      "warning"
    );
  }
}

function canPersistLiveSupplementToLocalDatabase() {
  const hostname = String(window.location.hostname || "").toLowerCase();
  return hostname === "127.0.0.1" || hostname === "localhost";
}

function buildLiveSupplementIngestPayload(events) {
  return {
    events: events.map((event) => ({
      id: event.id,
      lon: event.lon,
      lat: event.lat,
      depth: event.depth,
      mag: event.mag,
      time: event.time,
      updated: event.updated,
      place: event.place,
      url: event.url,
      alert: event.alert,
      tsunami: event.tsunami,
      significance: event.significance,
    })),
  };
}

async function persistLiveSupplementToDatabase(events, requestId) {
  if (!canPersistLiveSupplementToLocalDatabase()) {
    return;
  }

  if (!Array.isArray(events) || !events.length) {
    return;
  }

  if (requestId !== state.requestSerial) {
    return;
  }

  state.liveSupplementDbSyncPhase = "running";
  state.liveSupplementDbFetchedCount = events.length;
  state.liveSupplementDbInsertedCount = 0;
  state.liveSupplementDbUpdatedCount = 0;
  state.liveSupplementDbStoredCount = 0;
  state.liveSupplementDbCompletedAt = 0;
  state.liveSupplementDbLastError = "";
  state.queryNote = buildLocalAnalysisNote(state.filteredEvents);
  renderAll();
  setStatus(buildLiveSupplementDatabaseSyncStatusLine());

  try {
    const response = await fetch(LOCAL_INGEST_URL, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildLiveSupplementIngestPayload(events)),
    });

    if (!response.ok) {
      const outdatedServerHint =
        response.status === 404
          ? "；本地服务未暴露 /api/storage/ingest，通常是启动了旧版 StaticServer，请重启本地服务。"
          : "";
      throw new Error(`LOCAL_INGEST_HTTP ${response.status}${outdatedServerHint}`);
    }

    const payload = await response.json();

    if (requestId !== state.requestSerial) {
      return;
    }

    state.liveSupplementDbSyncPhase = "completed";
    state.liveSupplementDbFetchedCount = Number(payload?.fetchedCount || events.length);
    state.liveSupplementDbInsertedCount = Number(payload?.insertedCount || 0);
    state.liveSupplementDbUpdatedCount = Number(payload?.updatedCount || 0);
    state.liveSupplementDbStoredCount = Number(payload?.storedCount || 0);
    state.liveSupplementDbCompletedAt = Date.now();
    state.liveSupplementDbLastError = "";
    if (state.catalogSyncStatus) {
      state.catalogSyncStatus = {
        ...state.catalogSyncStatus,
        fetchedCount: state.liveSupplementDbFetchedCount,
        insertedCount: state.liveSupplementDbInsertedCount,
        updatedCount: state.liveSupplementDbUpdatedCount,
        skippedCount: Number(payload?.skippedCount || 0),
        storedCount: state.liveSupplementDbStoredCount || state.catalogSyncStatus.storedCount,
      };
    }
    state.queryNote = buildLocalAnalysisNote(state.filteredEvents);
    renderAll();
    setStatus(buildLiveSupplementDatabaseSyncCompletedLine());
  } catch (error) {
    if (requestId !== state.requestSerial) {
      return;
    }

    state.liveSupplementDbSyncPhase = "failed";
    state.liveSupplementDbLastError = error.message;
    state.queryNote = buildLocalAnalysisNote(state.filteredEvents);
    renderAll();
    setStatus(
      `最新事件已显示，但写入本地 SQLite 数据仓失败：${error.message || "未知错误"}。`,
      "warning"
    );
  }
}

function shouldFetchStaticLiveSupplement(queryPlan) {
  if (state.catalogDatasetMode !== "static") {
    return false;
  }

  const catalogEnd = Number(getLatestEventTimestamp(state.rawEvents) || state.catalogEnd || queryPlan?.end || 0);
  if (!catalogEnd) {
    return false;
  }

  return Date.now() - catalogEnd > STATIC_LIVE_SUPPLEMENT_FRESHNESS_MS;
}

function buildStaticLiveSupplementPlan(queryPlan) {
  const start = Number(getLatestEventTimestamp(state.rawEvents) || state.catalogEnd || queryPlan?.end || 0) + 1;
  const end = Date.now();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }

  return {
    start,
    end,
    chunks: buildDateChunksByDays(start, end, STATIC_LIVE_SUPPLEMENT_CHUNK_DAYS),
  };
}

function buildDateChunksByDays(start, end, chunkDays = 7) {
  const chunks = [];
  let cursor = start;
  const step = Math.max(1, chunkDays) * DAY_MS;

  while (cursor <= end) {
    const chunkEnd = Math.min(end, cursor + step - 1);
    chunks.push({
      start: cursor,
      end: chunkEnd,
    });
    cursor = chunkEnd + 1;
  }

  return chunks;
}

function mergeCatalogEvents(events) {
  let insertedCount = 0;
  let updatedCount = 0;
  const touchedEvents = [];

  for (const event of events) {
    if (!event) {
      continue;
    }

    const existing = state.eventById.get(event.id);
    if (!existing) {
      state.eventById.set(event.id, event);
      state.rawEvents.push(event);
      touchedEvents.push(event);
      insertedCount += 1;
      continue;
    }

    if (
      event.updated > existing.updated ||
      event.time !== existing.time ||
      event.mag !== existing.mag ||
      event.depth !== existing.depth ||
      event.lon !== existing.lon ||
      event.lat !== existing.lat ||
      event.place !== existing.place ||
      event.significance !== existing.significance
    ) {
      Object.assign(existing, event);
      touchedEvents.push(existing);
      updatedCount += 1;
    }
  }

  if (touchedEvents.length) {
    assignCountriesToEvents(touchedEvents);
    const touchedCountryKeys = [
      ...new Set(
        touchedEvents
          .map((event) => event.countryKey)
          .filter((countryKey) => countryKey && countryKey !== UNCLASSIFIED_COUNTRY_KEY)
      ),
    ];
    for (const countryKey of touchedCountryKeys) {
      if (hasLoadedSubdivisionDatasetForCountry(countryKey)) {
        assignSubdivisionsToCountryEvents(countryKey, touchedEvents);
      }
    }
  }

  state.catalogLoaded = state.rawEvents.length > 0;
  state.catalogLoadedCount = state.rawEvents.length;

  return {
    insertedCount,
    updatedCount,
    touchedEvents,
  };
}

async function fetchCatalogBatchPayload(queryPlan, offset, requestId) {
  if (requestId !== state.requestSerial) {
    throw new Error("REQUEST_CANCELLED");
  }

  if (state.catalogDatasetMode === "static") {
    const batchIndex = Math.max(
      0,
      Math.floor(offset / (queryPlan.batchSize || state.catalogBatchSize || BOOTSTRAP_BATCH_SIZE))
    );
    const batchManifest = Array.isArray(queryPlan.batches) ? queryPlan.batches[batchIndex] : null;
    const batchFile = batchManifest?.file || `batch-${String(batchIndex + 1).padStart(4, "0")}.json`;
    const response = await fetch(`${STATIC_BOOTSTRAP_BASE_URL}${batchFile}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`STATIC_BATCH_HTTP ${response.status}`);
    }

    const payload = await response.json();
    const totalCount = Number(payload?.metadata?.totalCount || queryPlan.matchedCount || 0);
    if (totalCount > 0) {
      queryPlan.matchedCount = totalCount;
      state.catalogExpectedCount = totalCount;
    }
    return payload;
  }

  const response = await fetch(
    buildUsgsUrl(LOCAL_BOOTSTRAP_BATCH_URL, {
      offset,
      limit: queryPlan.batchSize || BOOTSTRAP_BATCH_SIZE,
      endTime: queryPlan.end,
    }),
    {
      cache: "no-store",
      headers: { Accept: "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error(`LOCAL_BATCH_HTTP ${response.status}`);
  }

  const payload = await response.json();
  const totalCount = Number(payload?.metadata?.totalCount || queryPlan.matchedCount || 0);
  if (totalCount > 0) {
    queryPlan.matchedCount = totalCount;
    state.catalogExpectedCount = totalCount;
  }
  state.catalogSyncStatus = normalizeCatalogSyncStatus(payload?.metadata?.sync || state.catalogSyncStatus);
  return payload;
}

function appendCatalogBatch(payload, options = {}, isFirstBatch = false) {
  const payloadEvents = Array.isArray(payload?.events) ? payload.events : payload?.features || [];
  const batchEvents = payloadEvents.map(normalizeFeature).filter(Boolean);

  if (!batchEvents.length) {
    return 0;
  }

  const newEvents = [];
  for (const event of batchEvents) {
    if (state.eventById.has(event.id)) {
      continue;
    }
    state.eventById.set(event.id, event);
    state.rawEvents.push(event);
    newEvents.push(event);
  }

  if (!newEvents.length) {
    return 0;
  }

  state.catalogLoaded = true;
  state.catalogLoadedCount = state.rawEvents.length;
  state.catalogEnd = Math.max(state.catalogEnd || 0, getLatestEventTimestamp(newEvents));
  assignCountriesToEvents(newEvents);
  const newCountryKeys = [
    ...new Set(
      newEvents
        .map((event) => event.countryKey)
        .filter((countryKey) => countryKey && countryKey !== UNCLASSIFIED_COUNTRY_KEY)
    ),
  ];
  for (const countryKey of newCountryKeys) {
    if (hasLoadedSubdivisionDatasetForCountry(countryKey)) {
      assignSubdivisionsToCountryEvents(countryKey, newEvents);
    }
  }
  populateCountryFilterOptions(state.rawEvents);

  const previousFilteredCount = state.filteredEvents.length;
  const scopedBatchEvents = newEvents.filter(
    (event) =>
      event.time >= state.rangeStart &&
      event.time <= state.rangeEnd &&
      event.mag >= state.minMagnitude
  );
  const visibleBatchEvents = scopedBatchEvents.filter((event) => matchesCountryFilter(event));
  state.matchedCount += scopedBatchEvents.length;

  if (visibleBatchEvents.length) {
    state.filteredEvents.push(...visibleBatchEvents);
  }

  state.hotspots = computeHotspots(state.filteredEvents);
  syncHotspotSelectionState();

  if (!state.filteredEvents.some((event) => event.id === state.selectedEventId)) {
    state.selectedEventId = pickFeaturedEvent(state.filteredEvents)?.id || null;
  }

  renderIncrementalCatalogState(visibleBatchEvents, previousFilteredCount);
  state.queryNote = buildLocalAnalysisNote(state.filteredEvents);

  if (isFirstBatch) {
    setStatus(
      `首批目录数据已显示：已加载 ${formatNumber(state.catalogLoadedCount)} / ${formatNumber(
        state.catalogExpectedCount
      )} 条，后续批次正在继续追加。`
    );
    if (options.initial) {
      flyToPreset(state.focusPreset, 0);
    }
  }

  return newEvents.length;
}

async function fetchEarthquakePayloadSerialDeprecated(queryPlan, requestId) {
  state.effectiveMinMagnitude = queryPlan.queryMinMagnitude;
  state.queryNote = `当前跨度覆盖 ${formatDateRange(
    queryPlan.start,
    queryPlan.end
  )}；正在按年份分段抓取全部匹配事件。`;

  const features = [];
  let loadedCount = 0;

  for (let chunkIndex = 0; chunkIndex < queryPlan.chunks.length; chunkIndex += 1) {
    const chunk = queryPlan.chunks[chunkIndex];
    let pageIndex = 0;

    while (true) {
      if (requestId !== state.requestSerial) {
        throw new Error("REQUEST_CANCELLED");
      }

      const offset = pageIndex * QUERY_PAGE_SIZE + 1;
      const url = buildUsgsUrl(USGS_QUERY_URL, {
        format: "geojson",
        eventtype: "earthquake",
        orderby: "time",
        starttime: formatQueryDate(chunk.start),
        endtime: formatQueryDate(chunk.end),
        minmagnitude: queryPlan.queryMinMagnitude.toFixed(1),
        limit: QUERY_PAGE_SIZE,
        offset,
      });

      setStatus(
        `正在加载 ${queryPlan.label} 的历史目录：第 ${chunkIndex + 1}/${queryPlan.chunks.length} 段，第 ${pageIndex + 1} 批，已累计 ${formatNumber(
          loadedCount
        )} 条。`
      );

      const response = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/geo+json, application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const page = await response.json();
      const batch = page?.features || [];
      features.push(...batch);
      loadedCount += batch.length;
      if (batch.length < QUERY_PAGE_SIZE) {
        break;
      }
      pageIndex += 1;
    }
  }

  queryPlan.matchedCount = loadedCount;
  state.matchedCount = loadedCount;
  state.queryNote = buildQueryNote(queryPlan);

  return {
    metadata: {
      generated: Date.now(),
      count: loadedCount,
    },
    features,
  };
}

function normalizeCatalogSyncStatus(sync) {
  if (!sync || typeof sync !== "object") {
    return null;
  }

  const normalized = {
    isRunning: Boolean(sync.isRunning),
    isCovered: Boolean(sync.isCovered),
    phase: String(sync.phase || "idle"),
    message: String(sync.message || ""),
    startedAt: Number(sync.startedAt || 0) || null,
    completedAt: Number(sync.completedAt || 0) || null,
    requestedStartTime: Number(sync.requestedStartTime || 0),
    requestedEndTime: Number(sync.requestedEndTime || 0),
    coveredStartTime: Number(sync.coveredStartTime || 0),
    coveredEndTime: Number(sync.coveredEndTime || 0),
    targetEndTime: Number(sync.targetEndTime || 0),
    minMagnitude: Number(sync.minMagnitude || PROJECT_MIN_MAGNITUDE),
    totalChunks: Number(sync.totalChunks || 0),
    completedChunks: Number(sync.completedChunks || 0),
    currentChunkIndex: Number(sync.currentChunkIndex || 0),
    currentPageIndex: Number(sync.currentPageIndex || 0),
    fetchedCount: Number(sync.fetchedCount || 0),
    insertedCount: Number(sync.insertedCount || 0),
    updatedCount: Number(sync.updatedCount || 0),
    skippedCount: Number(sync.skippedCount || 0),
    storedCount: Number(sync.storedCount || 0),
    isFullSync: Boolean(sync.isFullSync),
    isIncremental: Boolean(sync.isIncremental),
    syncMode: String(sync.syncMode || (sync.isIncremental ? "incremental" : sync.isFullSync ? "full" : "idle")),
    lastError: sync.lastError ? String(sync.lastError) : null,
  };

  if (normalized.completedAt) {
    state.catalogCoverageComplete = Boolean(normalized.isCovered);
  }

  return normalized;
}

function syncCatalogSyncPolling() {
  stopCatalogSyncPolling();

  if (state.catalogDatasetMode === "static") {
    return;
  }

  if (!state.catalogSyncStatus?.isRunning) {
    return;
  }

  state.catalogSyncPollHandle = window.setInterval(() => {
    refreshCatalogSyncStatus().catch((error) => {
      console.warn("Failed to refresh catalog sync status", error);
    });
  }, SYNC_STATUS_POLL_MS);
}

function stopCatalogSyncPolling() {
  if (state.catalogSyncPollHandle) {
    window.clearInterval(state.catalogSyncPollHandle);
    state.catalogSyncPollHandle = 0;
  }
}

async function refreshCatalogSyncStatus(options = {}) {
  if (state.catalogSyncPollInFlight) {
    return;
  }

  state.catalogSyncPollInFlight = true;

  try {
    const response = await fetch(LOCAL_SYNC_STATUS_URL, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`SYNC_STATUS_HTTP ${response.status}`);
    }

    const payload = await response.json();
    const previousStatus = state.catalogSyncStatus;
    const nextStatus = normalizeCatalogSyncStatus(payload);
    state.catalogSyncStatus = nextStatus;
    syncCatalogSyncPolling();

    if (shouldAutoRefreshCatalogAfterSync(previousStatus, nextStatus)) {
      const completionKey = `${nextStatus.completedAt || 0}-${nextStatus.storedCount || 0}`;
      if (state.catalogSyncLastCompletionKey !== completionKey) {
        state.catalogSyncLastCompletionKey = completionKey;
        await refreshCatalogSummaryAfterSync();
        setStatus("后台补库已完成，已自动刷新本地目录摘要；如需载入最新事件，请点击“刷新数据”。");
      }
    } else if (
      nextStatus?.isRunning &&
      !options.silent &&
      previousStatus &&
      buildSyncProgressSummary(nextStatus) !== buildSyncProgressSummary(previousStatus)
    ) {
      setStatus(buildSyncProgressStatusLine(nextStatus));
    }

    if (!state.loading) {
      state.queryNote = buildLocalAnalysisNote(state.filteredEvents);
      renderAll();
    }
  } finally {
    state.catalogSyncPollInFlight = false;
  }
}

function shouldAutoRefreshCatalogAfterSync(previousStatus, nextStatus) {
  if (!nextStatus || nextStatus.isRunning || !nextStatus.completedAt) {
    return false;
  }

  const wasRunning = Boolean(previousStatus?.isRunning);
  const completionKey = `${nextStatus.completedAt || 0}-${nextStatus.storedCount || 0}`;

  return (
    wasRunning &&
    nextStatus.storedCount > state.rawEvents.length &&
    state.catalogSyncLastCompletionKey !== completionKey
  );
}

async function refreshCatalogSummaryAfterSync() {
  if (state.catalogDatasetMode === "static") {
    return;
  }

  const payload = await fetchCatalogSummarySourcePayload();
  const metadata = payload?.metadata || {};
  state.catalogExpectedCount = Number(metadata.count || state.catalogExpectedCount || 0);
  state.catalogBatchSize = Number(metadata.batchSizeSuggested || state.catalogBatchSize || BOOTSTRAP_BATCH_SIZE);
  state.feedGeneratedAt = Number(metadata.generated || state.feedGeneratedAt || Date.now());
  state.catalogEnd = Number(metadata.endTime || state.catalogEnd || Date.now());
  state.catalogCoverageComplete = Boolean(metadata.isCovered);
  state.catalogSyncStatus = normalizeCatalogSyncStatus(metadata.sync || state.catalogSyncStatus);

  if (!state.loading) {
    state.queryNote = buildLocalAnalysisNote(state.filteredEvents);
    renderAll();
  }
}

function buildSyncProgressSummary(syncStatus) {
  if (!syncStatus) {
    return "";
  }

  return [
    syncStatus.phase,
    syncStatus.completedChunks,
    syncStatus.totalChunks,
    syncStatus.fetchedCount,
    syncStatus.insertedCount,
    syncStatus.updatedCount,
    syncStatus.skippedCount,
    syncStatus.storedCount,
  ].join("|");
}

function buildSyncProgressStatusLine(syncStatus) {
  if (!syncStatus?.isRunning) {
    return "后台地震目录补库已结束。";
  }

  const modeLabel = syncStatus.isIncremental ? "增量同步" : "首次全量同步";
  return `正在执行${modeLabel}：已抓取 ${formatNumber(syncStatus.fetchedCount)} 条，新增 ${formatNumber(
    syncStatus.insertedCount
  )} 条，更新 ${formatNumber(syncStatus.updatedCount)} 条。`;
}

async function fetchEarthquakePayload(queryPlan, requestId) {
  state.effectiveMinMagnitude = queryPlan.queryMinMagnitude;
  state.queryNote = `当前跨度覆盖 ${formatDateRange(
    queryPlan.start,
    queryPlan.end
  )}，正在并行抓取全部匹配事件。`;

  let loadedCount = 0;
  let completedChunks = 0;
  let nextChunkIndex = 0;
  const featuresByChunk = new Array(queryPlan.chunks.length);
  const workerCount = Math.max(
    1,
    Math.min(QUERY_CHUNK_CONCURRENCY, queryPlan.chunks.length)
  );

  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const chunkIndex = nextChunkIndex;
      nextChunkIndex += 1;

      if (chunkIndex >= queryPlan.chunks.length) {
        return;
      }

      const chunk = queryPlan.chunks[chunkIndex];
      featuresByChunk[chunkIndex] = await fetchChunkPages(
        queryPlan,
        chunk,
        chunkIndex,
        workerCount,
        requestId,
        () => loadedCount,
        (delta) => {
          loadedCount += delta;
        }
      );

      completedChunks += 1;
    setStatus(
        `正在并行加载 ${queryPlan.label}：已完成 ${completedChunks}/${queryPlan.chunks.length} 段，累计 ${formatNumber(
          loadedCount
        )} 条。`
      );
    }
  });

  await Promise.all(workers);

  const features = featuresByChunk.flat();
  queryPlan.matchedCount = loadedCount;
  state.matchedCount = loadedCount;
  state.queryNote = buildQueryNote(queryPlan);

  return {
    metadata: {
      generated: Date.now(),
      count: loadedCount,
    },
    features,
  };
}

async function fetchChunkPages(
  queryPlan,
  chunk,
  chunkIndex,
  workerCount,
  requestId,
  getLoadedCount,
  applyLoadedDelta
) {
  const features = [];
  let pageIndex = 0;

  while (true) {
    if (requestId !== state.requestSerial) {
      throw new Error("REQUEST_CANCELLED");
    }

    const offset = pageIndex * QUERY_PAGE_SIZE + 1;
    const url = buildUsgsUrl(USGS_QUERY_URL, {
      format: "geojson",
      eventtype: "earthquake",
      orderby: "time",
      starttime: formatQueryDate(chunk.start),
      endtime: formatQueryDate(chunk.end),
      minmagnitude: queryPlan.queryMinMagnitude.toFixed(1),
      limit: QUERY_PAGE_SIZE,
      offset,
    });

    setStatus(
      `正在并行加载 ${queryPlan.label}：第 ${chunkIndex + 1}/${queryPlan.chunks.length} 段，第 ${pageIndex + 1} 批，并发 ${workerCount} 路，累计 ${formatNumber(
        getLoadedCount()
      )} 条。`
    );

    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/geo+json, application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const page = await response.json();
    const batch = page?.features || [];
    features.push(...batch);
    applyLoadedDelta(batch.length);

    if (batch.length < QUERY_PAGE_SIZE) {
      break;
    }

    pageIndex += 1;
  }

  return features;
}

function applyFiltersAndRender() {
  state.minMagnitude = clampProjectMagnitude(state.minMagnitude);
  state.effectiveMinMagnitude = state.minMagnitude;
  if (
    state.activeCountryKey !== "all" &&
    state.activeCountryKey !== UNCLASSIFIED_COUNTRY_KEY &&
    state.countryByKey.has(state.activeCountryKey) &&
    hasLoadedSubdivisionDatasetForCountry(state.activeCountryKey) &&
    !state.subdivisionAssignedCountries.has(state.activeCountryKey)
  ) {
    assignSubdivisionsToCountryEvents(state.activeCountryKey);
  }
  const scopedEvents = state.rawEvents.filter(
    (event) =>
      event.time >= state.rangeStart &&
      event.time <= state.rangeEnd &&
      event.mag >= state.minMagnitude
  );
  state.matchedCount = scopedEvents.length;
  populateCountryFilterOptions(scopedEvents);
  state.filteredEvents = scopedEvents.filter((event) => matchesCountryFilter(event));
  state.queryNote = buildLocalAnalysisNote(scopedEvents);
  state.hotspots = computeHotspots(state.filteredEvents);
  syncHotspotSelectionState();

  if (!state.filteredEvents.some((event) => event.id === state.selectedEventId)) {
    state.selectedEventId = pickFeaturedEvent(state.filteredEvents)?.id || null;
  }

  renderAll();
}

function renderAll() {
  renderEntities();
  renderLegend();
  renderAnalysisScope();
  renderDatabaseSyncStatus();
  renderStats();
  renderHotspotWorkbench();
  renderSelectedEvent();
  renderEventList();
  renderAnalysisCompareHeader();
  syncAnalysisModulePanels();
  renderActiveAnalysisModule();
  renderHotspots();
  renderCompareAnalysisModal();
  syncControls();
  refreshCountryOverlay();
  updateCountryLabelVisibility();

  if (!state.filteredEvents.length && state.rawEvents.length) {
    setStatus(
      `当前时间跨度内没有满足 M${state.minMagnitude.toFixed(1)}+ 条件的事件。`,
      "warning"
    );
  }
}

function clearEarthquakeRenderLayers() {
  state.dataSource.entities.removeAll();
  state.guideSource.entities.removeAll();
  state.pointCollection.removeAll();
  state.priorityPointCollection?.removeAll();
  state.labelCollection.removeAll();
  updateHighlight(getSelectedEvent());
}

function renderIncrementalCatalogState(visibleBatchEvents, previousFilteredCount) {
  const nextRenderMode =
    state.filteredEvents.length > POINT_CLOUD_THRESHOLD ? "point-cloud" : "entities";
  const needsFullRender = nextRenderMode !== state.renderMode;

  state.renderMode = nextRenderMode;
  state.dataSource.show = state.renderMode === "entities";

  if (needsFullRender) {
    renderAll();
    return;
  }

  if (state.renderMode === "entities") {
    renderAll();
    return;
  }

  if (visibleBatchEvents.length) {
    if (state.renderMode === "point-cloud") {
      appendPointCloudEvents(visibleBatchEvents);
    } else {
      appendEntityCloudEvents(visibleBatchEvents);
    }
  }

  state.guideSource.entities.removeAll();
  updateHighlight(getSelectedEvent());
  renderLegend();
  renderAnalysisScope();
  renderDatabaseSyncStatus();
  renderStats();
  renderHotspotWorkbench();
  renderSelectedEvent();
  renderEventList();
  renderAnalysisCompareHeader();
  syncAnalysisModulePanels();
  renderActiveAnalysisModule();
  renderHotspots();
  renderCompareAnalysisModal();
  syncControls();
  refreshCountryOverlay();
  updateCountryLabelVisibility();

  if (!state.filteredEvents.length && state.rawEvents.length) {
    setStatus(
      `当前时间跨度内没有满足 M${state.minMagnitude.toFixed(1)}+ 条件的事件。`,
      "warning"
    );
  } else if (!visibleBatchEvents.length && previousFilteredCount === state.filteredEvents.length) {
    state.viewer.scene.requestRender();
  }
}

function renderEntities() {
  clearEarthquakeRenderLayers();

  state.renderMode =
    state.filteredEvents.length > POINT_CLOUD_THRESHOLD ? "point-cloud" : "entities";
  state.dataSource.show = state.renderMode === "entities";

  if (state.renderMode === "point-cloud") {
    renderPointCloud();
  } else {
    renderEntityCloud();
  }

  renderHeightGuides();
  updateHighlight(getSelectedEvent());
}

function renderEntityCloud() {
  appendEntityCloudEvents(state.filteredEvents);
}

function appendEntityCloudEvents(events) {
  const entities = state.dataSource.entities;
  const renderableEvents = sortEventsForRendering(events);

  for (const quake of renderableEvents) {
    const tier = getEventVisualTier(quake);
    const color = getEventColor(quake);
    const position = Cesium.Cartesian3.fromDegrees(
      quake.lon,
      quake.lat,
      computeAltitude(quake)
    );

    entities.add({
      id: quake.id,
      position,
      point: {
        pixelSize: computePixelSize(quake.mag, quake),
        color: color.withAlpha(computeEventAlpha(quake)),
        outlineColor: PALETTE.white.withAlpha(0.92),
        outlineWidth: tier >= EVENT_VISUAL_PRIORITY_OVERLAY_TIER ? 2.4 : tier >= 1 ? 1.3 : 0.8,
        scaleByDistance: new Cesium.NearFarScalar(7.5e5, 1.35, 2.5e7, 0.45),
        translucencyByDistance: new Cesium.NearFarScalar(7.5e5, 1.0, 3.5e7, 0.22),
      },
      label:
        quake.mag >= 6.0
          ? {
              text: `M${quake.mag.toFixed(1)}`,
              font: '700 12px "Bahnschrift", "Segoe UI"',
              fillColor: color,
              outlineColor: Cesium.Color.BLACK.withAlpha(0.55),
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new Cesium.Cartesian2(0, -10),
              scaleByDistance: new Cesium.NearFarScalar(1.2e6, 1.0, 2.8e7, 0.45),
              translucencyByDistance: new Cesium.NearFarScalar(1.2e6, 1.0, 3.4e7, 0.0),
            }
          : undefined,
    });

    if (tier >= EVENT_VISUAL_PRIORITY_OVERLAY_TIER) {
      state.guideSource.entities.add({
        id: quake.id,
        position,
        point: {
          pixelSize: computePixelSize(quake.mag, quake, { overlay: true }),
          color: color.withAlpha(
            state.encodingMode === "depth"
              ? tier >= 3
                ? 0.38
                : 0.28
              : tier >= 3
                ? 0.32
                : 0.22
          ),
          outlineColor: color.withAlpha(tier >= 3 ? 0.95 : 0.82),
          outlineWidth:
            state.encodingMode === "depth"
              ? tier >= 3
                ? 3.8
                : 2.8
              : tier >= 3
                ? 3.2
                : 2.3,
          scaleByDistance: new Cesium.NearFarScalar(7.5e5, 1.18, 2.5e7, 0.36),
          translucencyByDistance: new Cesium.NearFarScalar(7.5e5, 0.92, 3.5e7, 0.08),
        },
      });
    }
  }
}

function renderPointCloud() {
  appendPointCloudEvents(state.filteredEvents);
}

function appendPointCloudEvents(events) {
  const renderableEvents = sortEventsForRendering(events);

  for (const quake of renderableEvents) {
    const tier = getEventVisualTier(quake);
    const color = getEventColor(quake);
    const position = Cesium.Cartesian3.fromDegrees(
      quake.lon,
      quake.lat,
      computeAltitude(quake)
    );

    const point = state.pointCollection.add({
      position,
      pixelSize: Math.max(2.8, computePixelSize(quake.mag, quake, { pointCloud: true }) - 1.8),
      color: color.withAlpha(computeEventAlpha(quake, { pointCloud: true })),
      outlineColor: PALETTE.white.withAlpha(0.72),
      outlineWidth: tier >= 1 ? 0.8 : 0,
      scaleByDistance: new Cesium.NearFarScalar(7.5e5, 1.2, 2.5e7, 0.28),
      translucencyByDistance: new Cesium.NearFarScalar(7.5e5, 1.0, 3.5e7, 0.18),
      disableDepthTestDistance: 0,
    });
    point.id = quake.id;

    if (tier >= EVENT_VISUAL_PRIORITY_OVERLAY_TIER) {
      const priorityPoint = state.priorityPointCollection.add({
        position,
        pixelSize: computePixelSize(quake.mag, quake, { pointCloud: true, overlay: true }),
        color: color.withAlpha(tier >= 3 ? 0.96 : 0.84),
        outlineColor: PALETTE.white.withAlpha(tier >= 3 ? 0.98 : 0.86),
        outlineWidth: tier >= 3 ? 2.6 : 1.9,
        scaleByDistance: new Cesium.NearFarScalar(7.5e5, 1.24, 2.5e7, 0.38),
        translucencyByDistance: new Cesium.NearFarScalar(7.5e5, 1.0, 3.5e7, 0.12),
        disableDepthTestDistance: 0,
      });
      priorityPoint.id = quake.id;
    }

    if (quake.mag >= 7.0) {
      const label = state.labelCollection.add({
        position,
        text: `M${quake.mag.toFixed(1)}`,
        font: '700 11px "Bahnschrift", "Segoe UI"',
        fillColor: color,
        outlineColor: Cesium.Color.BLACK.withAlpha(0.55),
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -9),
        scaleByDistance: new Cesium.NearFarScalar(1.2e6, 0.95, 2.8e7, 0.3),
        translucencyByDistance: new Cesium.NearFarScalar(1.2e6, 1.0, 3.4e7, 0.0),
        disableDepthTestDistance: 0,
      });
      label.id = quake.id;
    }
  }
}

function renderHeightGuides() {
  const entities = state.guideSource.entities;
  const guideLimit = getEffectiveGuideLimit();

  if (!state.filteredEvents.length || guideLimit <= 0) {
    return;
  }

  const stride = Math.max(1, Math.ceil(state.filteredEvents.length / guideLimit));

  for (let index = 0; index < state.filteredEvents.length; index += 1) {
    const quake = state.filteredEvents[index];
    if (!shouldRenderHeightGuide(quake, index, stride)) {
      continue;
    }

    const altitude = computeAltitude(quake);
    const color = getEventColor(quake);
    const surfacePosition = Cesium.Cartesian3.fromDegrees(
      quake.lon,
      quake.lat,
      GUIDE_SURFACE_ALTITUDE
    );
    const elevatedPosition = Cesium.Cartesian3.fromDegrees(
      quake.lon,
      quake.lat,
      altitude
    );

    entities.add({
      polyline: {
        positions: [surfacePosition, elevatedPosition],
        width: computeGuideWidth(quake),
        arcType: Cesium.ArcType.NONE,
        material: new Cesium.PolylineGlowMaterialProperty({
          color: color.withAlpha(state.heightMode === "depth" ? 0.2 : 0.14),
          glowPower: state.heightMode === "depth" ? 0.08 : 0.05,
        }),
      },
    });

    entities.add({
      position: surfacePosition,
      point: {
        pixelSize: quake.id === state.selectedEventId ? 6 : 3.2,
        color: color.withAlpha(0.14),
        outlineColor: color.withAlpha(0.45),
        outlineWidth: 1,
        scaleByDistance: new Cesium.NearFarScalar(8e5, 1.0, 2.8e7, 0.3),
        translucencyByDistance: new Cesium.NearFarScalar(8e5, 0.95, 2.8e7, 0.18),
        disableDepthTestDistance: 0,
      },
    });
  }
}

function shouldRenderHeightGuide(quake, index, stride) {
  if (index % stride === 0) {
    return true;
  }

  if (state.focusPreset === "global" && state.filteredEvents.length > 6000) {
    if (state.heightMode === "depth") {
      return quake.depth >= 450;
    }

    return quake.mag >= 6.6;
  }

  if (state.heightMode === "depth") {
    return quake.depth >= 300;
  }

  return quake.mag >= 6;
}

function computeGuideWidth(quake) {
  if (state.heightMode === "depth") {
    return quake.depth >= 300 ? 1.55 : 0.8;
  }

  return quake.mag >= 6 ? 1.55 : 0.8;
}

function getEffectiveGuideLimit() {
  const baseLimit =
    state.renderMode === "point-cloud" ? MAX_POINT_CLOUD_GUIDES : MAX_ENTITY_GUIDES;

  if (state.focusPreset === "global") {
    return Math.max(42, Math.round(baseLimit * 0.38));
  }

  if (state.filteredEvents.length > POINT_CLOUD_THRESHOLD) {
    return Math.max(56, Math.round(baseLimit * 0.6));
  }

  return baseLimit;
}

function createGraticule() {
  const entities = state.gridSource.entities;
  entities.removeAll();

  const mainColor = PALETTE.aqua.withAlpha(0.14);
  const equatorColor = PALETTE.aqua.withAlpha(0.28);

  for (let lat = -60; lat <= 60; lat += 30) {
    entities.add({
      polyline: {
        positions: buildParallel(lat),
        width: lat === 0 ? 1.8 : 1.1,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: lat === 0 ? 0.2 : 0.1,
          color: lat === 0 ? equatorColor : mainColor,
        }),
        arcType: Cesium.ArcType.GEODESIC,
      },
    });
  }

  for (let lon = -180; lon < 180; lon += 30) {
    entities.add({
      polyline: {
        positions: buildMeridian(lon),
        width: 1.1,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.1,
          color: mainColor,
        }),
        arcType: Cesium.ArcType.GEODESIC,
      },
    });
  }

  state.gridSource.show = state.gridEnabled;
}

function buildSpatialIndexCellKey(lonIndex, latIndex) {
  return `${lonIndex}:${latIndex}`;
}

function clampSpatialLongitude(lon) {
  return Math.max(-180, Math.min(180, normalizeBoundaryLongitude(lon)));
}

function clampSpatialLatitude(lat) {
  return Math.max(-90, Math.min(90, lat));
}

function getSpatialIndexRange(bbox, cellSize) {
  const minLon = clampSpatialLongitude(bbox.minLon);
  const maxLon = clampSpatialLongitude(bbox.maxLon);
  const minLat = clampSpatialLatitude(bbox.minLat);
  const maxLat = clampSpatialLatitude(bbox.maxLat);

  return {
    minLonIndex: Math.floor((minLon + 180) / cellSize),
    maxLonIndex: Math.floor((maxLon + 180) / cellSize),
    minLatIndex: Math.floor((minLat + 90) / cellSize),
    maxLatIndex: Math.floor((maxLat + 90) / cellSize),
  };
}

function buildSpatialIndex(items, cellSize) {
  const index = new Map();
  for (const item of items) {
    if (!item?.bbox) {
      continue;
    }
    const range = getSpatialIndexRange(item.bbox, cellSize);
    for (let lonIndex = range.minLonIndex; lonIndex <= range.maxLonIndex; lonIndex += 1) {
      for (let latIndex = range.minLatIndex; latIndex <= range.maxLatIndex; latIndex += 1) {
        const key = buildSpatialIndexCellKey(lonIndex, latIndex);
        if (!index.has(key)) {
          index.set(key, []);
        }
        index.get(key).push(item);
      }
    }
  }
  return index;
}

function getSpatialIndexCandidates(index, lon, lat, fallbackItems = []) {
  const cellKey = buildSpatialIndexCellKey(
    Math.floor((clampSpatialLongitude(lon) + 180) / COUNTRY_INDEX_CELL_SIZE),
    Math.floor((clampSpatialLatitude(lat) + 90) / COUNTRY_INDEX_CELL_SIZE)
  );
  return index.get(cellKey) || fallbackItems;
}

function getSubdivisionSpatialCandidates(index, lon, lat, fallbackItems = []) {
  const cellKey = buildSpatialIndexCellKey(
    Math.floor((clampSpatialLongitude(lon) + 180) / SUBDIVISION_INDEX_CELL_SIZE),
    Math.floor((clampSpatialLatitude(lat) + 90) / SUBDIVISION_INDEX_CELL_SIZE)
  );
  return index.get(cellKey) || fallbackItems;
}

function sortBoundaryCandidatesBySpecificity(items = []) {
  return [...items].sort((left, right) => {
    const leftArea = computeBoundingBoxArea(left?.bbox || { minLon: 0, maxLon: 0, minLat: 0, maxLat: 0 });
    const rightArea = computeBoundingBoxArea(right?.bbox || { minLon: 0, maxLon: 0, minLat: 0, maxLat: 0 });
    return leftArea - rightArea;
  });
}

function buildSubdivisionDataUrl(relativePath) {
  const normalizedPath = String(relativePath || "").replace(/^[./]+/, "");
  return `${SUBDIVISION_BASE_URL}${normalizedPath}`;
}

async function loadSubdivisionManifest() {
  if (state.subdivisionManifest.size) {
    return state.subdivisionManifest;
  }
  if (state.subdivisionManifestPromise) {
    return state.subdivisionManifestPromise;
  }

  state.subdivisionManifestPromise = fetch(SUBDIVISION_MANIFEST_URL, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((payload) => {
      const countries = Array.isArray(payload?.countries) ? payload.countries : [];
      state.subdivisionManifest = new Map(
        countries.map((entry) => [String(entry.countryIso || "").trim().toUpperCase(), entry])
      );
      return state.subdivisionManifest;
    })
    .catch((error) => {
      console.warn("Failed to load geoBoundaries ADM1 manifest", error);
      state.subdivisionManifest = new Map();
      return state.subdivisionManifest;
    })
    .finally(() => {
      state.subdivisionManifestPromise = null;
    });

  return state.subdivisionManifestPromise;
}

function buildSubdivisionBoundaryFeature(feature) {
  const props = feature?.properties || {};
  const polygons = extractCountryPolygons(feature?.geometry);
  const isoCode = String(props.shapeISO || props.shapeGroup || "").trim().toUpperCase();
  const nameEn = String(props.shapeName || props.name || "").trim();
  const nameZh = String(props.shapeNameZh || props.nameZh || nameEn).trim();
  const sourceId = String(props.shapeID || feature?.id || nameEn).trim();

  if (!isoCode || !nameEn || !polygons.length) {
    return null;
  }

  return {
    key: `${isoCode}:${normalizeCountryLookupKey(sourceId || nameEn)}`,
    isoCode,
    sourceId,
    nameEn,
    nameZh,
    polygons,
    bbox: computeCountryBoundingBox(polygons),
  };
}

async function loadSubdivisionDatasetByIso(isoCode) {
  const normalizedIso = String(isoCode || "").trim().toUpperCase();
  if (!normalizedIso) {
    return null;
  }
  if (state.subdivisionDatasets.has(normalizedIso)) {
    return state.subdivisionDatasets.get(normalizedIso);
  }
  if (state.subdivisionLoadPromises.has(normalizedIso)) {
    return state.subdivisionLoadPromises.get(normalizedIso);
  }

  const loadPromise = loadSubdivisionManifest()
    .then(async (manifest) => {
      const entry = manifest.get(normalizedIso);
      if (!entry?.path) {
        return null;
      }

      const response = await fetch(buildSubdivisionDataUrl(entry.path), {
        cache: "no-store",
        headers: { Accept: "application/geo+json, application/json" },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const features = (Array.isArray(payload?.features) ? payload.features : [])
        .map((feature) => buildSubdivisionBoundaryFeature(feature))
        .filter(Boolean);
      const dataset = {
        isoCode: normalizedIso,
        countryName: entry.countryName || normalizedIso,
        countryNameZh: entry.countryNameZh || entry.countryName || normalizedIso,
        features,
        spatialIndex: buildSpatialIndex(features, SUBDIVISION_INDEX_CELL_SIZE),
      };
      state.subdivisionDatasets.set(normalizedIso, dataset);
      return dataset;
    })
    .catch((error) => {
      console.warn(`Failed to load geoBoundaries ADM1 dataset for ${normalizedIso}`, error);
      return null;
    })
    .finally(() => {
      state.subdivisionLoadPromises.delete(normalizedIso);
    });

  state.subdivisionLoadPromises.set(normalizedIso, loadPromise);
  return loadPromise;
}

function clearSubdivisionOnEvent(event) {
  event.subdivisionKey = "";
  event.subdivisionName = "";
  event.subdivisionNameZh = "";
}

function applySubdivisionToEvent(event, subdivision) {
  if (!subdivision) {
    clearSubdivisionOnEvent(event);
    return;
  }

  event.subdivisionKey = subdivision.key;
  event.subdivisionName = subdivision.nameEn;
  event.subdivisionNameZh = subdivision.nameZh || subdivision.nameEn;
}

function findSubdivisionInDataset(dataset, lon, lat) {
  const candidates = sortBoundaryCandidatesBySpecificity(
    getSubdivisionSpatialCandidates(dataset?.spatialIndex || new Map(), lon, lat, dataset?.features || [])
  );

  for (const subdivision of candidates) {
    if (!pointWithinBoundingBox(lon, lat, subdivision.bbox)) {
      continue;
    }
    if (pointInCountryPolygons(lon, lat, subdivision.polygons)) {
      return subdivision;
    }
  }

  return null;
}

function getCountrySubdivisionSourceCodes(country) {
  return [...new Set((country?.sourceIsoCodes || []).filter(Boolean))];
}

function hasLoadedSubdivisionDatasetForCountry(countryKey) {
  const country = state.countryByKey.get(countryKey);
  if (!country) {
    return false;
  }
  return getCountrySubdivisionSourceCodes(country).some((isoCode) => state.subdivisionDatasets.has(isoCode));
}

function assignSubdivisionsToCountryEvents(countryKey, events = null) {
  const country = state.countryByKey.get(countryKey);
  if (!country) {
    return false;
  }

  const datasets = getCountrySubdivisionSourceCodes(country)
    .map((isoCode) => state.subdivisionDatasets.get(isoCode))
    .filter(Boolean);
  if (!datasets.length) {
    return false;
  }

  const targetEvents = Array.isArray(events) ? events : state.rawEvents;
  let assignedCount = 0;
  for (const event of targetEvents) {
    if (event.countryKey !== countryKey) {
      continue;
    }

    clearSubdivisionOnEvent(event);
    for (const dataset of datasets) {
      const subdivision = findSubdivisionInDataset(dataset, event.lon, event.lat);
      if (subdivision) {
        applySubdivisionToEvent(event, subdivision);
        assignedCount += 1;
        break;
      }
    }
  }

  if (!Array.isArray(events)) {
    state.subdivisionAssignedCountries.add(countryKey);
  }

  return assignedCount > 0;
}

async function ensureSubdivisionDatasetForCountry(countryKey) {
  if (
    !countryKey ||
    countryKey === "all" ||
    countryKey === UNCLASSIFIED_COUNTRY_KEY ||
    !state.countryByKey.has(countryKey)
  ) {
    return false;
  }

  const country = state.countryByKey.get(countryKey);
  const sourceIsoCodes = getCountrySubdivisionSourceCodes(country);
  if (!sourceIsoCodes.length) {
    return false;
  }

  await loadSubdivisionManifest();
  const loadTargets = sourceIsoCodes.filter((isoCode) => state.subdivisionManifest.has(isoCode));
  if (!loadTargets.length) {
    return false;
  }

  await Promise.all(loadTargets.map((isoCode) => loadSubdivisionDatasetByIso(isoCode)));
  const hasAssignments = assignSubdivisionsToCountryEvents(countryKey);

  if (state.activeCountryKey === countryKey) {
    applyFiltersAndRender();
    syncControls();
  }

  return hasAssignments;
}

async function loadBoundaryOverlay() {
  try {
    const response = await fetch(BOUNDARY_LAYER_URL, {
      cache: "no-store",
      headers: { Accept: "application/geo+json, application/json" },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const geojson = await response.json();
    const dataSource = new Cesium.CustomDataSource("boundaries");
    const features = Array.isArray(geojson?.features) ? geojson.features : [];
    const edgeRegistry = new Set();
    const countryRegistry = new Map();
    const countries = [];

    for (const feature of features) {
      const country = buildCountryBoundaryFeature(feature);
      if (country) {
        const existing = countryRegistry.get(country.key);
        if (existing) {
          mergeCountryBoundaryFeature(existing, country);
        } else {
          countries.push(country);
          countryRegistry.set(country.key, country);
        }
      }
      appendBoundaryGeometry(dataSource.entities, feature?.geometry, edgeRegistry);
    }

    if (!dataSource.entities.values.length) {
      throw new Error("No boundary segments created");
    }

    for (const country of countries) {
      country.labelEntity = appendCountryLabel(dataSource.entities, country);
    }

    state.countryBoundaries = countries;
    state.countryByKey = new Map(countries.map((country) => [country.key, country]));
    state.countryEntries = new Map(countries.map((country) => [country.key, country]));
    state.countrySearchIndex = countries.map((country) => buildCountrySearchEntry(country));
    state.countrySpatialIndex = buildSpatialIndex(countries, COUNTRY_INDEX_CELL_SIZE);
    state.boundaryReady = countries.length > 0;
    if (dom.boundaryToggle) {
      dom.boundaryToggle.disabled = false;
      dom.boundaryToggle.checked = state.boundariesEnabled;
    }

    state.viewer.dataSources.add(dataSource);
    state.boundaryLayer = dataSource;
    state.boundaryLayer.show = state.boundariesEnabled;
    state.viewer.scene.requestRender();
    assignCountriesToEvents(state.rawEvents);
    populateCountryFilterOptions();
    refreshCountryOverlay();
    updateCountryLabelVisibility();
    loadSubdivisionManifest();
    if (state.rawEvents.length) {
      applyFiltersAndRender();
    } else {
      syncControls();
    }
  } catch (error) {
    console.warn("Failed to load world boundaries overlay", error);
    state.boundariesEnabled = false;
    state.boundaryReady = false;
    state.countryBoundaries = [];
    state.countryByKey = new Map();
    state.countryEntries = new Map();
    state.countrySearchIndex = [];
    state.countrySpatialIndex = new Map();
    populateCountryFilterOptions();
    if (dom.boundaryToggle) {
      dom.boundaryToggle.checked = false;
      dom.boundaryToggle.disabled = true;
    }
    setStatus("国家/地区边界图层加载失败，已自动关闭。", "warning");
  }
}

function renderActiveAnalysisModule() {
  resetAnalysisTargets();
  syncAnalysisModulePanels();

  switch (state.activeAnalysisModule) {
    case "count":
      renderHotspotMetricWorkbench("count", dom.compareCountChart);
      break;
    case "avgMag":
      renderHotspotMetricWorkbench("avgMag", dom.compareAvgMagChart);
      break;
    case "maxMag":
      renderHotspotMetricWorkbench("maxMag", dom.compareMaxMagChart);
      break;
    case "avgDepth":
      renderHotspotMetricWorkbench("avgDepth", dom.compareAvgDepthChart);
      break;
    case "temporal":
      renderCompareWorkbenchChart("temporal", dom.trendChart);
      break;
    case "magnitude":
      renderCompareWorkbenchChart("magnitude", dom.magnitudeChart);
      break;
    case "depth":
      renderCompareWorkbenchChart("depth", dom.depthChart);
      renderMagnitudeDepthStructureSupplement();
      break;
    case "energy":
      renderCompareWorkbenchChart("energy", dom.energyChart);
      renderEnergyWorkbenchNotes();
      break;
    default:
      renderHotspotMetricWorkbench("count", dom.compareCountChart);
      break;
  }

  updateHighlight(getSelectedEvent());
}

function renderAnalysisLoadingState() {
  const loadingCopy = '<div class="empty-copy">正在根据当前筛选条件重建分析面板，请稍候...</div>';
  dom.analysisDbSyncBody && (dom.analysisDbSyncBody.innerHTML = loadingCopy);
  dom.selectedEvent && (dom.selectedEvent.innerHTML = loadingCopy);
  dom.eventList && (dom.eventList.innerHTML = loadingCopy);
  dom.compareCountChart && (dom.compareCountChart.innerHTML = loadingCopy);
  dom.compareAvgMagChart && (dom.compareAvgMagChart.innerHTML = loadingCopy);
  dom.compareMaxMagChart && (dom.compareMaxMagChart.innerHTML = loadingCopy);
  dom.compareAvgDepthChart && (dom.compareAvgDepthChart.innerHTML = loadingCopy);
  dom.trendChart && (dom.trendChart.innerHTML = loadingCopy);
  dom.magnitudeChart && (dom.magnitudeChart.innerHTML = loadingCopy);
  dom.depthChart && (dom.depthChart.innerHTML = loadingCopy);
  dom.magnitudeDepthChart && (dom.magnitudeDepthChart.innerHTML = loadingCopy);
  dom.energyChart && (dom.energyChart.innerHTML = loadingCopy);
  dom.energyBudget && (dom.energyBudget.innerHTML = loadingCopy);
  dom.hotspotRankingMeta && (dom.hotspotRankingMeta.innerHTML = loadingCopy);
  dom.hotspotsList && (dom.hotspotsList.innerHTML = loadingCopy);
  dom.hotspotSelectionSummary && (dom.hotspotSelectionSummary.innerHTML = loadingCopy);
  dom.analysisCompareTargets && (dom.analysisCompareTargets.innerHTML = loadingCopy);
  dom.analysisCompareContext && (dom.analysisCompareContext.innerHTML = loadingCopy);
  if (state.compareModalOpen && dom.compareModalChart) {
    dom.compareModalChart.innerHTML = '<div class="compare-modal-empty"><div><strong>分析窗口正在重建</strong>请稍候，系统正在基于当前筛选条件重新聚合多地区对比数据。</div></div>';
  }
}

function renderHotspotWorkbench() {
  const visibleHotspots = getVisibleHotspots();
  const selectedHotspots = state.hotspotSelectedKeys
    .map((hotspotKey) => findHotspotByKey(hotspotKey))
    .filter(Boolean);

  renderHotspotSelectionSummary(selectedHotspots);

  if (dom.hotspotSearchClear) {
    dom.hotspotSearchClear.disabled = !state.hotspotSearchQuery.trim();
  }
  if (dom.hotspotSelectVisible) {
    dom.hotspotSelectVisible.disabled = !visibleHotspots.length;
  }
  if (dom.hotspotClearSelection) {
    dom.hotspotClearSelection.disabled = !selectedHotspots.length;
  }

  toggleActive("[data-hotspot-metric]", "hotspotMetric", state.hotspotCompareMetric);
}

function renderAnalysisCompareHeader() {
  const selectedRegions = getSelectedCompareRegions();

  if (dom.analysisCompareTargets) {
    if (!selectedRegions.length) {
      dom.analysisCompareTargets.innerHTML =
        '<div class="analysis-compare-empty">未选择分析地区。请先在上方地区控制中心选择 1 个或多个地区。</div>';
    } else {
      dom.analysisCompareTargets.innerHTML = `
        <div class="analysis-compare-chip-row">
          ${selectedRegions
            .map(
              (region) => `
                <button
                  class="analysis-compare-chip"
                  type="button"
                  data-remove-compare-region="${escapeAttribute(region.key)}"
                  title="${escapeAttribute(region.displayName || region.name)}"
                >
                  <span>${escapeHtml(truncate(region.displayName || region.name, 20))}</span>
                  <i>×</i>
                </button>
              `
            )
            .join("")}
          <button class="analysis-compare-chip clear-all" type="button" data-clear-compare-regions="true">
            清空对比
          </button>
        </div>
      `;
    }
  }

  if (dom.analysisCompareContext) {
    const selectedNames = selectedRegions.map((region) => region.displayName || region.name);
    const mode = getSelectedRegionMode(selectedRegions.length);
    const selectedCopy = selectedNames.length
      ? `${selectedNames.slice(0, 4).join("、")}${selectedNames.length > 4 ? ` 等 ${formatNumber(selectedNames.length)} 个地区` : ""}`
      : "未选择地区";
    let summaryCopy = "";
    if (mode === "multi") {
      summaryCopy = `当前分析维度：${ANALYSIS_MODULES[state.activeAnalysisModule]?.label || "多地区对比"} · 当前对比地区：${selectedCopy} · 时间范围：${formatDateRange(
        state.rangeStart,
        state.rangeEnd
      )} · 样本总数：${formatNumber(state.filteredEvents.length)} 条`;
    } else if (mode === "single") {
      summaryCopy = `当前分析维度：${ANALYSIS_MODULES[state.activeAnalysisModule]?.label || "地区分析"} · 当前地区：${selectedCopy} · 单地区分析模式 · 时间范围：${formatDateRange(
        state.rangeStart,
        state.rangeEnd
      )} · 样本总数：${formatNumber(state.filteredEvents.length)} 条`;
    } else {
      summaryCopy = `当前分析维度：${ANALYSIS_MODULES[state.activeAnalysisModule]?.label || "地区分析"} · 尚未选择地区，请先在上方地区控制中心选择 1 个或多个地区后生成分析图。`;
    }
    dom.analysisCompareContext.textContent = summaryCopy;
  }
}

function buildWorkbenchSummaryItems(summaryItems, limit = getFigureSurfaceMeta("preview").summaryLimit) {
  const items = Array.isArray(summaryItems) ? summaryItems : [];
  if (items.length <= limit) {
    return items;
  }
  return [
    ...items.slice(0, Math.max(1, limit - 1)),
    { label: "更多口径", value: "中央窗口查看" },
  ];
}

function buildWorkbenchNotes(notes, limit = getFigureSurfaceMeta("preview").noteLimit) {
  const items = Array.isArray(notes) ? notes.filter(Boolean) : [];
  if (items.length <= limit) {
    return items.slice(0, limit);
  }
  if (limit <= 1) {
    return ["页面预览仅保留摘要说明；中央分析窗口与导出图保留完整统计说明。"];
  }
  return [
    ...items.slice(0, Math.max(1, limit - 1)),
    "页面预览仅保留摘要说明；中央分析窗口与导出图保留完整统计说明。",
  ];
}

function renderAnalysisWorkbenchPayload(targetElement, payload, emptyTitle) {
  if (!targetElement) {
    return;
  }

  if (payload.emptyState) {
    targetElement.innerHTML = `
      <div class="compare-workbench-empty">
        <strong>${escapeHtml(emptyTitle)}</strong>
        <span>${payload.emptyState.replace(/<[^>]+>/g, "")}</span>
      </div>
    `;
    return;
  }

  const previewSurfaceMeta = getFigureSurfaceMeta("preview");
  const workbenchSummaryItems = buildWorkbenchSummaryItems(
    payload.summaryItems || [],
    payload.previewSummaryLimit || previewSurfaceMeta.summaryLimit
  );
  const workbenchNotes = buildWorkbenchNotes(
    payload.notes || [],
    payload.previewNoteLimit || previewSurfaceMeta.noteLimit
  );

  targetElement.innerHTML = `
    <div class="compare-workbench-shell">
      <div class="compare-workbench-summary">
        ${renderCompareSummaryChips(workbenchSummaryItems)}
      </div>
      <div class="compare-workbench-figure-shell">
        ${payload.previewSvg || payload.figureSvg || ""}
      </div>
      <div class="compare-workbench-notes">
        ${renderCompareNotes(workbenchNotes)}
      </div>
    </div>
  `;
}

function renderHotspotMetricWorkbench(metricKey, targetElement) {
  if (!getSelectedCompareRegions().length) {
    renderAnalysisWorkbenchPayload(
      targetElement,
      {
        emptyState: "<strong>请先选择地区</strong>请先在上方地区控制中心选择 1 个或多个地区，再生成当前地区分析图或多地区对比图。",
      },
      `${HOTSPOT_COMPARE_METRICS[metricKey]?.label || "地区指标"}分析暂不可用`
    );
    return;
  }
  const previousMetric = state.hotspotCompareMetric;
  state.hotspotCompareMetric = metricKey;
  const context = buildCompareRegionContext("hotspot", { surface: "preview" });
  const payload = buildHotspotCompareModal(context, { surface: "preview" });
  renderAnalysisWorkbenchPayload(
    targetElement,
    payload,
    `${HOTSPOT_COMPARE_METRICS[metricKey]?.label || "地区指标"}分析暂不可用`
  );
  state.hotspotCompareMetric = previousMetric;
}

function renderCompareWorkbenchChart(moduleKey, targetElement) {
  if (!getSelectedCompareRegions().length) {
    renderAnalysisWorkbenchPayload(
      targetElement,
      {
        emptyState: "<strong>请先选择地区</strong>请先在上方地区控制中心选择 1 个或多个地区，再生成当前地区分析图或多地区对比图。",
      },
      `${COMPARE_MODULE_META[moduleKey]?.label || "地区分析"}暂不可用`
    );
    return;
  }
  const context = buildCompareRegionContext(moduleKey, { surface: "preview" });
  const payload = buildCompareModalPayload(moduleKey, context, { surface: "preview" });
  renderAnalysisWorkbenchPayload(
    targetElement,
    payload,
    `${COMPARE_MODULE_META[moduleKey]?.label || "地区分析"}暂不可用`
  );
}

function renderMagnitudeDepthStructureSupplement() {
  if (!dom.magnitudeDepthChart) {
    return;
  }

  const selectedRegions = getSelectedCompareRegions();
  if (!selectedRegions.length) {
    dom.magnitudeDepthChart.innerHTML =
      '<div class="compare-workbench-empty"><strong>震级-深度关系预览</strong><span>请先选择地区后再查看当前地区或多地区的深度结构补充说明。</span></div>';
    return;
  }

  const tags = selectedRegions
    .map((region) => `<span class="analysis-chip">${escapeHtml(truncate(region.displayName || region.name, 16))}</span>`)
    .join("");
  dom.magnitudeDepthChart.innerHTML = `
    <div class="analysis-summary-row">${tags}</div>
    <div class="analysis-note">
      震级-深度关系作为深度结构模块的补充说明；${
        selectedRegions.length > 1 ? "完整的多地区分层对比图" : "完整的单地区结构分析图"
      }与导出能力请通过上方按钮进入中央学术分析窗口。
    </div>
  `;
}

function renderEnergyWorkbenchNotes() {
  if (!dom.energyBudget) {
    return;
  }

  const selectedRegions = getSelectedCompareRegions();
  if (!selectedRegions.length) {
    dom.energyBudget.innerHTML =
      '<div class="compare-workbench-empty"><strong>能量预算说明</strong><span>请先选择地区后再查看当前地区或多地区的能量释放说明。</span></div>';
    return;
  }

  const labels = selectedRegions
    .map((region) => `<span class="analysis-chip">${escapeHtml(truncate(region.displayName || region.name, 16))}</span>`)
    .join("");
  dom.energyBudget.innerHTML = `
    <div class="analysis-summary-row">${labels}</div>
    <div class="analysis-note">
      当前能量释放对比基于经验关系 <code>log10E = 1.5M + 4.8</code> 估算，仅用于不同地区之间的相对比较，不应理解为严格物理实测值。
    </div>
  `;
}

function buildCountryBoundaryFeature(feature) {
  const rawNameEn = resolveBoundaryCountryEnglishName(feature);
  const polygons = extractCountryPolygons(feature?.geometry);
  if (!rawNameEn || !polygons.length) {
    return null;
  }

  const rawCode = String(
    feature?.properties?.iso_a3 ||
      feature?.properties?.ISO_A3 ||
      feature?.properties?.adm0_a3 ||
      feature?.id ||
      ""
  )
    .trim()
    .toUpperCase();
  const grouping = resolveCountryBoundaryGrouping(rawCode, rawNameEn);
  const code = grouping.code;
  const nameEn = grouping.nameEn;
  const key = buildCountryBoundaryKey(code, nameEn);
  const continentKey =
    String(feature?.properties?.gbContinentKey || "").trim() || inferCountryContinent(nameEn, polygons);
  const labelAnchor = computeCountryLabelAnchor(polygons);

  return {
    key,
    code,
    nameEn,
    nameZh: grouping.nameZh || resolveCountryDisplayNameZh(feature, nameEn),
    continentKey,
    continentLabel: CONTINENT_LABELS[continentKey] || "其他区域",
    polygons,
    bbox: computeCountryBoundingBox(polygons),
    labelAnchor,
    labelPriorityArea: computeCountryLabelPriorityArea(polygons),
    aliases: buildCountryAliases(nameEn, grouping.extraAliases),
    searchTokens: buildCountrySearchTokens(nameEn, code, grouping.extraSearchTokens),
    sourceIsoCodes: rawCode ? [rawCode] : [],
    labelEntity: null,
  };
}

function resolveCountryBoundaryGrouping(code, nameEn) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  const normalizedName = normalizeCountryLookupKey(nameEn);

  if (
    normalizedCode === "TWN" ||
    normalizedName === "taiwan" ||
    normalizedName === "china taiwan"
  ) {
    return {
      code: "CHN",
      nameEn: "China",
      nameZh: "中国",
      extraAliases: ["Taiwan", "China Taiwan", "Chinese Taipei", "台湾", "中国台湾"],
      extraSearchTokens: ["TWN", "台湾", "中国台湾", "Taiwan", "Chinese Taipei"],
    };
  }

  return {
    code: normalizedCode,
    nameEn,
    nameZh: null,
    extraAliases: [],
    extraSearchTokens: [],
  };
}

function mergeCountryBoundaryFeature(target, source) {
  target.polygons.push(...source.polygons);
  target.bbox = computeCountryBoundingBox(target.polygons);
  target.labelAnchor = computeCountryLabelAnchor(target.polygons);
  target.labelPriorityArea = computeCountryLabelPriorityArea(target.polygons);
  target.aliases = [...new Set([...(target.aliases || []), ...(source.aliases || [])])];
  target.searchTokens = [
    ...new Set([...(target.searchTokens || []), ...(source.searchTokens || [])]),
  ];
  target.sourceIsoCodes = [
    ...new Set([...(target.sourceIsoCodes || []), ...(source.sourceIsoCodes || [])]),
  ];
}

function buildCountryBoundaryKey(code, nameEn) {
  const safeCode = /^[A-Z0-9]{3}$/.test(code) && code !== "-99" ? code : "";
  const safeName =
    normalizeCountryLookupKey(nameEn)
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "") || "unknown";
  return safeCode ? `${safeCode}-${safeName}` : `name-${safeName}`;
}

function inferCountryContinent(nameEn, polygons) {
  if (COUNTRY_CONTINENT_OVERRIDES[nameEn]) {
    return COUNTRY_CONTINENT_OVERRIDES[nameEn];
  }

  const anchor = computeCountryLabelAnchor(polygons);
  const lon = anchor?.lon ?? 0;
  const lat = anchor?.lat ?? 0;

  if (lat <= -60) {
    return "antarctica";
  }
  if (lat >= 35 && lon >= -25 && lon <= 60) {
    return "europe";
  }
  if (lat >= -38 && lat <= 38 && lon >= -20 && lon <= 55) {
    return "africa";
  }
  if (lon >= 110 || lon <= -140) {
    return lat <= 28 && lat >= -52 ? "oceania" : "asia";
  }
  if (lon >= 20 && lon <= 180 && lat >= -12 && lat <= 82) {
    return "asia";
  }
  if (lon >= -170 && lon <= -20 && lat >= 5) {
    return "north-america";
  }
  if (lon >= -100 && lon <= -25 && lat < 15) {
    return "south-america";
  }

  return lat >= 12 ? "europe" : "oceania";
}

function buildCountrySearchTokens(nameEn, code, extraTokens = []) {
  const tokens = new Set();
  const normalizedZh =
    COUNTRY_NAME_ZH_BY_NORMALIZED_NAME[normalizeCountryLookupKey(nameEn)] || "";

  tokens.add(normalizeCountryLookupKey(nameEn));
  tokens.add(normalizeCountryLookupKey(normalizedZh));

  if (code && code !== "-99") {
    tokens.add(normalizeCountryLookupKey(code));
  }

  for (const alias of buildCountryAliases(nameEn)) {
    tokens.add(alias);
  }

  for (const token of extraTokens) {
    tokens.add(normalizeCountryLookupKey(token));
  }

  return [...tokens].filter(Boolean);
}

function buildCountrySearchEntry(country) {
  return {
    key: country.key,
    code: country.code,
    nameEn: country.nameEn,
    nameZh: country.nameZh,
    continentKey: country.continentKey,
    count: 0,
    searchTokens: [
      ...country.searchTokens,
      normalizeCountryLookupKey(country.nameZh),
      normalizeCountryLookupKey(country.nameEn),
    ].filter(Boolean),
  };
}

function resolveBoundaryCountryEnglishName(feature) {
  const props = feature?.properties || {};
  return String(
    props.name ||
      props.shapeName ||
      props.NAME ||
      props.admin ||
      props.ADMIN ||
      props.name_long ||
      props.NAME_LONG ||
      feature?.id ||
      ""
  ).trim();
}

function resolveCountryDisplayNameZh(feature, nameEn) {
  const props = feature?.properties || {};
  if (props.nameZh || props.shapeNameZh) {
    return String(props.nameZh || props.shapeNameZh).trim();
  }
  const regionCode3Candidates = [
    props.iso_a3,
    props.ISO_A3,
    props.adm0_a3,
    props.shapeGroup,
    typeof feature?.id === "string" && feature.id.length === 3 ? feature.id : "",
  ];
  for (const candidate of regionCode3Candidates) {
    const code = String(candidate || "").trim().toUpperCase();
    if (!code || code === "-99") {
      continue;
    }
    const label = COUNTRY_NAME_ZH_BY_CODE[code];
    if (label) {
      return label;
    }
  }

  const regionCodeCandidates = [
    props.iso_a2,
    props.ISO_A2,
    props.iso2,
    props.alpha2,
    typeof feature?.id === "string" && feature.id.length === 2 ? feature.id : "",
  ];

  for (const candidate of regionCodeCandidates) {
    const code = String(candidate || "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code) || !REGION_DISPLAY_NAMES_ZH) {
      continue;
    }

    const label = REGION_DISPLAY_NAMES_ZH.of(code);
    if (label) {
      return label;
    }
  }

  return (
    COUNTRY_NAME_ZH_BY_NORMALIZED_NAME[normalizeCountryLookupKey(nameEn)] || nameEn
  );
}

function extractCountryPolygons(geometry) {
  const type = geometry?.type;
  const coordinates = geometry?.coordinates;
  if (!type || !coordinates) {
    return [];
  }

  if (type === "Polygon") {
    const polygon = buildCountryPolygon(coordinates);
    return polygon ? [polygon] : [];
  }

  if (type === "MultiPolygon") {
    return coordinates
      .map((polygonCoordinates) => buildCountryPolygon(polygonCoordinates))
      .filter(Boolean);
  }

  return [];
}

function buildCountryPolygon(rings) {
  if (!Array.isArray(rings) || !rings.length) {
    return null;
  }

  const normalizedRings = rings
    .map((ring) => sampleBoundaryCoordinates(ring, true))
    .filter((ring) => ring.length >= 4);
  if (!normalizedRings.length) {
    return null;
  }

  return {
    outer: normalizedRings[0],
    holes: normalizedRings.slice(1),
    bbox: computeRingBoundingBox(normalizedRings[0]),
  };
}

function computeRingBoundingBox(ring) {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const point of ring) {
    minLon = Math.min(minLon, point[0]);
    minLat = Math.min(minLat, point[1]);
    maxLon = Math.max(maxLon, point[0]);
    maxLat = Math.max(maxLat, point[1]);
  }

  return {
    minLon,
    minLat,
    maxLon,
    maxLat,
  };
}

function computeCountryBoundingBox(polygons) {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const polygon of polygons) {
    minLon = Math.min(minLon, polygon.bbox.minLon);
    minLat = Math.min(minLat, polygon.bbox.minLat);
    maxLon = Math.max(maxLon, polygon.bbox.maxLon);
    maxLat = Math.max(maxLat, polygon.bbox.maxLat);
  }

  return {
    minLon,
    minLat,
    maxLon,
    maxLat,
  };
}

function computeCountryLabelAnchor(polygons) {
  const largestPolygon =
    [...polygons].sort(
      (left, right) =>
        computeBoundingBoxArea(right.bbox) - computeBoundingBoxArea(left.bbox)
    )[0] || null;
  if (!largestPolygon) {
    return null;
  }

  const centroid = computeBoundaryCentroid(largestPolygon.outer);
  if (centroid && pointInRing(centroid.lon, centroid.lat, largestPolygon.outer)) {
    return centroid;
  }

  const interiorPoint = computeInteriorLabelPoint(largestPolygon);
  if (interiorPoint) {
    return interiorPoint;
  }

  return {
    lon: (largestPolygon.bbox.minLon + largestPolygon.bbox.maxLon) / 2,
    lat: (largestPolygon.bbox.minLat + largestPolygon.bbox.maxLat) / 2,
  };
}

function computeCountryLabelPriorityArea(polygons) {
  return polygons.reduce((maxArea, polygon) => {
    return Math.max(maxArea, computeBoundingBoxArea(polygon.bbox));
  }, 0);
}

function computeBoundingBoxArea(bbox) {
  return Math.max(0, bbox.maxLon - bbox.minLon) * Math.max(0, bbox.maxLat - bbox.minLat);
}

function computeBoundaryCentroid(ring) {
  const points = ring.slice(0, -1);
  if (!points.length) {
    return null;
  }

  let lonSum = 0;
  let latSum = 0;
  for (const point of points) {
    lonSum += point[0];
    latSum += point[1];
  }

  return {
    lon: lonSum / points.length,
    lat: latSum / points.length,
  };
}

function computeInteriorLabelPoint(polygon) {
  const bounds = polygon?.bbox;
  if (!bounds) {
    return null;
  }

  const samples = 8;
  let bestPoint = null;
  let bestScore = -Infinity;
  const lonSpan = Math.max(bounds.maxLon - bounds.minLon, 0.8);
  const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.8);

  for (let xIndex = 1; xIndex < samples; xIndex += 1) {
    for (let yIndex = 1; yIndex < samples; yIndex += 1) {
      const lon = bounds.minLon + (lonSpan * xIndex) / samples;
      const lat = bounds.minLat + (latSpan * yIndex) / samples;
      if (!pointInRing(lon, lat, polygon.outer)) {
        continue;
      }

      let insideHole = false;
      for (const hole of polygon.holes) {
        if (pointInRing(lon, lat, hole)) {
          insideHole = true;
          break;
        }
      }
      if (insideHole) {
        continue;
      }

      const edgeDistance = estimateRingEdgeDistance(lon, lat, polygon.outer);
      if (edgeDistance > bestScore) {
        bestScore = edgeDistance;
        bestPoint = { lon, lat };
      }
    }
  }

  return bestPoint;
}

function estimateRingEdgeDistance(lon, lat, ring) {
  let minDistance = Infinity;

  for (let index = 1; index < ring.length; index += 1) {
    const previous = ring[index - 1];
    const point = ring[index];
    minDistance = Math.min(
      minDistance,
      distancePointToSegment(lon, lat, previous[0], previous[1], point[0], point[1])
    );
  }

  return minDistance;
}

function distancePointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy || 1e-9;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function appendCountryLabel(entities, country) {
  if (!country?.labelAnchor) {
    return null;
  }

  return entities.add({
    id: `country-label-${country.key}`,
    position: Cesium.Cartesian3.fromDegrees(
      country.labelAnchor.lon,
      country.labelAnchor.lat,
      BOUNDARY_ALTITUDE + 32000
    ),
    label: {
      text: country.nameZh,
      font: '800 15px "Bahnschrift", "Segoe UI"',
      fillColor: PALETTE.white.withAlpha(0.98),
      outlineColor: Cesium.Color.BLACK.withAlpha(0.88),
      outlineWidth: 5,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      showBackground: true,
      backgroundColor: Cesium.Color.fromCssColorString("#04101d").withAlpha(0.34),
      backgroundPadding: new Cesium.Cartesian2(10, 5),
      scaleByDistance: new Cesium.NearFarScalar(1.2e6, 1.08, 1.8e7, 0.3),
      translucencyByDistance: new Cesium.NearFarScalar(1.2e6, 0.98, 1.8e7, 0.06),
      disableDepthTestDistance: 0,
    },
  });
}

function buildCountryAliases(nameEn, extraAliases = []) {
  const variants = new Set();
  const extras = COUNTRY_PLACE_ALIASES[nameEn] || [];

  variants.add(nameEn);
  variants.add(nameEn.replace(/^the\s+/i, ""));
  variants.add(nameEn.replace(/^Republic of\s+/i, ""));
  variants.add(nameEn.replace(/^State of\s+/i, ""));
  variants.add(nameEn.replace(/^Kingdom of\s+/i, ""));

  for (const alias of extras) {
    variants.add(alias);
  }

  for (const alias of extraAliases) {
    variants.add(alias);
  }

  return [...variants]
    .map((alias) => normalizeCountryLookupKey(alias))
    .filter(Boolean);
}

function normalizeCountryLookupKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function assignCountriesToEvents(events) {
  if (!Array.isArray(events) || !events.length) {
    return;
  }

  for (const event of events) {
    const country = state.boundaryReady ? findCountryByCoordinates(event.lon, event.lat) : null;
    applyCountryToEvent(event, country);
  }
}

function applyCountryToEvent(event, country) {
  clearSubdivisionOnEvent(event);
  if (!country) {
    event.countryKey = UNCLASSIFIED_COUNTRY_KEY;
    event.countryName = UNCLASSIFIED_COUNTRY_NAME;
    event.countryNameZh = UNCLASSIFIED_COUNTRY_NAME_ZH;
    event.countryMatchMode = "boundary-unmatched";
    return;
  }

  event.countryKey = country.key;
  event.countryName = country.nameEn;
  event.countryNameZh = country.nameZh;
  event.countryMatchMode = "boundary";
}

function findCountryByCoordinates(lon, lat) {
  const candidates = sortBoundaryCandidatesBySpecificity(
    getSpatialIndexCandidates(state.countrySpatialIndex, lon, lat, state.countryBoundaries)
  );

  for (const country of candidates) {
    if (!pointWithinBoundingBox(lon, lat, country.bbox)) {
      continue;
    }
    if (pointInCountryPolygons(lon, lat, country.polygons)) {
      return country;
    }
  }

  return null;
}

function pointWithinBoundingBox(lon, lat, bbox) {
  return (
    lon >= bbox.minLon &&
    lon <= bbox.maxLon &&
    lat >= bbox.minLat &&
    lat <= bbox.maxLat
  );
}

function pointInCountryPolygons(lon, lat, polygons) {
  for (const polygon of polygons) {
    if (!pointWithinBoundingBox(lon, lat, polygon.bbox)) {
      continue;
    }

    if (!pointInRing(lon, lat, polygon.outer)) {
      continue;
    }

    let insideHole = false;
    for (const hole of polygon.holes) {
      if (pointInRing(lon, lat, hole)) {
        insideHole = true;
        break;
      }
    }

    if (!insideHole) {
      return true;
    }
  }

  return false;
}

function pointInRing(lon, lat, ring) {
  let inside = false;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const left = ring[index];
    const right = ring[previous];
    const intersects =
      left[1] > lat !== right[1] > lat &&
      lon < ((right[0] - left[0]) * (lat - left[1])) / (right[1] - left[1] || 1e-9) + left[0];

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function matchesCountryFilter(event) {
  return state.activeCountryKey === "all" || event.countryKey === state.activeCountryKey;
}

function getEventDisplayRegionLabel(event) {
  if (!event) {
    return "";
  }

  return (
    event.subdivisionNameZh ||
    event.subdivisionName ||
    event.countryNameZh ||
    event.countryName ||
    UNCLASSIFIED_COUNTRY_NAME_ZH
  );
}

function getEventDetailRegionBadgeLabel(event) {
  if (!event) {
    return "";
  }

  if (event.subdivisionNameZh || event.subdivisionName) {
    return event.subdivisionNameZh || event.subdivisionName;
  }

  if ((event.countryKey || UNCLASSIFIED_COUNTRY_KEY) === UNCLASSIFIED_COUNTRY_KEY) {
    return event.countryNameZh || event.countryName || UNCLASSIFIED_COUNTRY_NAME_ZH;
  }

  return "";
}

function getEventSpatialScopeLabel(event) {
  return getEventDisplayRegionLabel(event) || "未标注区域";
}

function isSameEventSpatialScope(left, right) {
  if (!left || !right) {
    return false;
  }

  if (left.subdivisionKey) {
    return (
      (right.countryKey || UNCLASSIFIED_COUNTRY_KEY) === (left.countryKey || UNCLASSIFIED_COUNTRY_KEY) &&
      right.subdivisionKey === left.subdivisionKey
    );
  }

  return (right.countryKey || UNCLASSIFIED_COUNTRY_KEY) === (left.countryKey || UNCLASSIFIED_COUNTRY_KEY);
}

function populateCountryFilterOptions(events = state.rawEvents) {
  if (!dom.countryFilter) {
    return;
  }

  const counts = new Map();
  for (const event of events) {
    const key = event.countryKey || UNCLASSIFIED_COUNTRY_KEY;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const options = [
    { key: "all", label: "全部国家/地区" },
    ...[...state.countryByKey.values()]
      .map((country) => {
        const count = counts.get(country.key) || 0;
        return {
          key: country.key,
          label:
            count > 0
              ? `${country.nameZh || country.nameEn || country.key} (${formatNumber(count)})`
              : `${country.nameZh || country.nameEn || country.key}`,
        };
      })
      .sort((left, right) => left.label.localeCompare(right.label, "zh-CN")),
  ];

  if (counts.get(UNCLASSIFIED_COUNTRY_KEY)) {
    options.push({
      key: UNCLASSIFIED_COUNTRY_KEY,
      label: `${UNCLASSIFIED_COUNTRY_NAME_ZH} (${formatNumber(counts.get(UNCLASSIFIED_COUNTRY_KEY))})`,
    });
  }

  if (!options.some((option) => option.key === state.activeCountryKey)) {
    state.activeCountryKey = "all";
  }

  state.countrySearchIndex = state.countrySearchIndex
    .map((entry) => ({
      ...entry,
      count: counts.get(entry.key) || 0,
    }))
    .sort((left, right) => {
      if (left.continentKey !== right.continentKey) {
        return (
          CONTINENT_OPTIONS.findIndex((option) => option.key === left.continentKey) -
          CONTINENT_OPTIONS.findIndex((option) => option.key === right.continentKey)
        );
      }
      return (left.nameZh || left.nameEn).localeCompare(right.nameZh || right.nameEn, "zh-CN");
    });

  dom.countryFilter.replaceChildren(
    ...options.map((option) => {
      const node = document.createElement("option");
      node.value = option.key;
      node.textContent = option.label;
      return node;
    })
  );

  dom.countryFilter.value = state.activeCountryKey;
  dom.countryFilter.disabled = options.length <= 1 && !state.countryByKey.size;
  renderCountryFilterPanel();
  syncControls();
}

function buildCountryFilterNote() {
  if (!state.boundaryReady) {
    return "正在加载 geoBoundaries 国家边界与中文标注，稍后即可按国家/地区筛选。";
  }

  if (state.loading && !state.rawEvents.length) {
    return `已载入 ${formatNumber(
      state.countryByKey.size
    )} 个国家/地区标签，正在等待当前地震目录完成加载。`;
  }

  if (state.loading && state.rawEvents.length && !state.catalogLoadComplete) {
    return `国家/地区列表当前基于已加载样本统计：${formatNumber(
      state.catalogLoadedCount
    )} / ${formatNumber(state.catalogExpectedCount)} 条。后续批次会继续追加更新。`;
  }

  if (state.activeCountryKey === "all") {
    return `当前为全球视图，全部地震均按 geoBoundaries ADM0 边界坐标归属；未落入任何国家边界的事件归入“国际海域/离岸区域”。进入单个国家后，会继续按 ADM1 行政区划分热点地区。`;
  }

  const country = state.countryByKey.get(state.activeCountryKey);
  return `当前筛选：${getCountryDisplayNameByKey(state.activeCountryKey)} · ${
    country?.continentLabel || "区域未分组"
  } · 可见 ${formatNumber(state.filteredEvents.length)} 条事件。`;
}

function buildCountryFilterStatusMessage() {
  if (state.activeCountryKey === "all") {
    return "已切换为全部国家/地区。";
  }

  return `已切换到 ${getCountryDisplayNameByKey(state.activeCountryKey)}。`;
}

function getCountryDisplayNameByKey(countryKey) {
  if (countryKey === UNCLASSIFIED_COUNTRY_KEY) {
    return UNCLASSIFIED_COUNTRY_NAME_ZH;
  }

  const country = state.countryByKey.get(countryKey);
  return country?.nameZh || country?.nameEn || "全部国家/地区";
}

function installRenderRecovery() {
  const scene = state.viewer.scene;
  scene.rethrowRenderErrors = false;
  scene.renderError.addEventListener((_scene, error) => {
    const message = String(error?.message || error || "");
    console.warn("Cesium render error", error);

    if (!/Too many properties to enumerate/i.test(message)) {
      return;
    }

    if (state.boundaryLayer) {
      state.boundaryLayer.show = false;
    }

    state.boundariesEnabled = false;
    if (dom.boundaryToggle) {
      dom.boundaryToggle.checked = false;
      dom.boundaryToggle.disabled = !state.boundaryReady;
    }

    state.viewer.useDefaultRenderLoop = true;
    scene.requestRender();
    setStatus("国家/地区边界图层已自动关闭，以恢复渲染。", "warning");
  });
}

function appendBoundaryGeometry(entities, geometry, edgeRegistry) {
  const type = geometry?.type;
  const coordinates = geometry?.coordinates;
  if (!type || !coordinates) {
    return;
  }

  if (type === "Polygon") {
    for (const ring of coordinates) {
      addBoundarySegments(entities, ring, true, edgeRegistry);
    }
    return;
  }

  if (type === "MultiPolygon") {
    for (const polygon of coordinates) {
      for (const ring of polygon) {
        addBoundarySegments(entities, ring, true, edgeRegistry);
      }
    }
    return;
  }

  if (type === "LineString") {
    addBoundarySegments(entities, coordinates, false, edgeRegistry);
    return;
  }

  if (type === "MultiLineString") {
    for (const line of coordinates) {
      addBoundarySegments(entities, line, false, edgeRegistry);
    }
  }
}

function addBoundarySegments(entities, coordinates, closed, edgeRegistry = new Set()) {
  const segments = buildBoundarySegments(coordinates, closed);
  for (const segment of segments) {
    if (segment.length < 2) {
      continue;
    }

    let pending = [];

    for (let index = 1; index < segment.length; index += 1) {
      const previous = segment[index - 1];
      const point = segment[index];
      const edgeKey = buildBoundaryEdgeKey(previous, point);

      if (edgeRegistry.has(edgeKey)) {
        emitBoundaryPolyline(entities, pending);
        pending = [];
        continue;
      }

      edgeRegistry.add(edgeKey);
      if (!pending.length) {
        pending.push(previous);
      }
      pending.push(point);
    }

    emitBoundaryPolyline(entities, pending);
  }
}

function emitBoundaryPolyline(entities, segment) {
  if (!segment || segment.length < 2) {
    return;
  }

  entities.add({
    polyline: {
      positions: segment.map(([lon, lat]) =>
        Cesium.Cartesian3.fromDegrees(lon, lat, BOUNDARY_ALTITUDE)
      ),
      width: 1.2,
      arcType: Cesium.ArcType.NONE,
      material: new Cesium.PolylineGlowMaterialProperty({
        color: PALETTE.aqua.withAlpha(0.52),
        glowPower: 0.08,
        taperPower: 0.9,
      }),
    },
  });
}

function buildBoundaryEdgeKey(left, right) {
  const first = `${left[0].toFixed(BOUNDARY_POINT_PRECISION)},${left[1].toFixed(BOUNDARY_POINT_PRECISION)}`;
  const second = `${right[0].toFixed(BOUNDARY_POINT_PRECISION)},${right[1].toFixed(BOUNDARY_POINT_PRECISION)}`;
  return first < second ? `${first}|${second}` : `${second}|${first}`;
}

function buildBoundarySegments(coordinates, closed) {
  const sampled = sampleBoundaryCoordinates(coordinates, closed);
  if (sampled.length < 2) {
    return [];
  }

  const segments = [];
  let current = [sampled[0]];

  for (let index = 1; index < sampled.length; index += 1) {
    const point = sampled[index];
    const previous = current[current.length - 1];
    if (Math.abs(point[0] - previous[0]) > BOUNDARY_DATELINE_THRESHOLD) {
      if (current.length > 1) {
        segments.push(current);
      }
      current = [point];
      continue;
    }

    current.push(point);
  }

  if (current.length > 1) {
    segments.push(current);
  }

  return segments;
}

function sampleBoundaryCoordinates(coordinates, closed) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return [];
  }

  const cleaned = [];

  for (const coordinate of coordinates) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) {
      continue;
    }

    const lon = normalizeBoundaryLongitude(Number(coordinate[0]));
    const lat = clampBoundaryLatitude(Number(coordinate[1]));
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      continue;
    }

    const point = [
      snapBoundaryCoordinate(lon),
      snapBoundaryCoordinate(lat),
    ];
    if (!cleaned.length || !isSameBoundaryPoint(cleaned[cleaned.length - 1], point)) {
      cleaned.push(point);
    }
  }

  if (cleaned.length < 2) {
    return [];
  }

  if (closed && !isSameBoundaryPoint(cleaned[0], cleaned[cleaned.length - 1])) {
    cleaned.push(cleaned[0]);
  }

  return cleaned;
}

function normalizeBoundaryLongitude(lon) {
  if (!Number.isFinite(lon)) {
    return Number.NaN;
  }

  const normalized = ((lon + 180) % 360 + 360) % 360 - 180;
  return normalized === -180 && lon > 0 ? 180 : normalized;
}

function clampBoundaryLatitude(lat) {
  if (!Number.isFinite(lat)) {
    return Number.NaN;
  }

  return Math.max(-89.5, Math.min(89.5, lat));
}

function isSameBoundaryPoint(left, right) {
  return (
    Math.abs(left[0] - right[0]) < 1e-6 &&
    Math.abs(left[1] - right[1]) < 1e-6
  );
}

function snapBoundaryCoordinate(value) {
  const factor = 10 ** BOUNDARY_POINT_PRECISION;
  return Math.round(value * factor) / factor;
}

function buildParallel(lat) {
  const positions = [];
  for (let lon = -180; lon <= 180; lon += 4) {
    positions.push(Cesium.Cartesian3.fromDegrees(lon, lat, 18000));
  }
  return positions;
}

function buildMeridian(lon) {
  const positions = [];
  for (let lat = -80; lat <= 80; lat += 4) {
    positions.push(Cesium.Cartesian3.fromDegrees(lon, lat, 18000));
  }
  return positions;
}

function handleSceneClick(position) {
  pauseRotation(5000);
  const picked = state.viewer.scene.pick(position);

  const eventId = resolvePickedEventId(picked);
  if (eventId) {
    selectEventById(eventId, { flyTo: true });
    return;
  }

  const countryKey = resolvePickedCountryKey(picked) || resolveCountryKeyFromScreenPosition(position);
  if (countryKey) {
    setActiveCountryFilter(countryKey, {
      source: "map",
      flyTo: true,
    });
  }
}

function resolvePickedEventId(picked) {
  if (typeof picked?.id === "string") {
    return normalizePickedEventId(picked.id);
  }

  if (typeof picked?.id?.id === "string") {
    return normalizePickedEventId(picked.id.id);
  }

  return null;
}

function normalizePickedEventId(rawId) {
  if (typeof rawId !== "string") {
    return null;
  }

  if (rawId.endsWith("-priority")) {
    return rawId.slice(0, -"-priority".length);
  }

  return rawId;
}

function resolvePickedCountryKey(picked) {
  const rawId =
    typeof picked?.id === "string"
      ? picked.id
      : typeof picked?.id?.id === "string"
        ? picked.id.id
        : "";

  if (!rawId.startsWith("country-label-")) {
    return null;
  }

  const countryKey = rawId.slice("country-label-".length);
  return state.countryByKey.has(countryKey) ? countryKey : null;
}

function scheduleCountryHoverProbe(screenPosition) {
  state.pendingHoverPosition = screenPosition;
  if (state.hoverFrameHandle) {
    return;
  }

  state.hoverFrameHandle = window.requestAnimationFrame(() => {
    state.hoverFrameHandle = 0;
    const nextPosition = state.pendingHoverPosition;
    state.pendingHoverPosition = null;
    if (nextPosition) {
      handleSceneHover(nextPosition);
    }
  });
}

function handleSceneHover(screenPosition) {
  const picked = state.viewer.scene.pick(screenPosition);
  const eventId = resolvePickedEventId(picked);
  if (eventId) {
    clearHoveredCountry();
    return;
  }

  const countryKey =
    resolvePickedCountryKey(picked) || resolveCountryKeyFromScreenPosition(screenPosition);
  if (!countryKey) {
    clearHoveredCountry();
    return;
  }

  if (state.hoveredCountryKey === countryKey) {
    positionCountryHoverTooltip(screenPosition, countryKey);
    return;
  }

  state.hoveredCountryKey = countryKey;
  refreshCountryOverlay();
  updateCountryLabelVisibility();
  positionCountryHoverTooltip(screenPosition, countryKey);
}

function clearHoveredCountry() {
  if (state.hoverFrameHandle) {
    window.cancelAnimationFrame(state.hoverFrameHandle);
    state.hoverFrameHandle = 0;
  }
  state.pendingHoverPosition = null;
  if (!state.hoveredCountryKey && dom.countryHoverTooltip?.hidden !== false) {
    return;
  }
  state.hoveredCountryKey = null;
  refreshCountryOverlay();
  updateCountryLabelVisibility();
  hideCountryHoverTooltip();
}

function resolveCountryKeyFromScreenPosition(screenPosition) {
  if (!screenPosition || !state.boundaryReady) {
    return null;
  }

  const cartesian = state.viewer.camera.pickEllipsoid(
    screenPosition,
    state.viewer.scene.globe.ellipsoid
  );
  if (!cartesian) {
    return null;
  }

  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  const lon = Cesium.Math.toDegrees(cartographic.longitude);
  const lat = Cesium.Math.toDegrees(cartographic.latitude);
  return findCountryByCoordinates(lon, lat)?.key || null;
}

function positionCountryHoverTooltip(screenPosition, countryKey) {
  if (!dom.countryHoverTooltip || !screenPosition) {
    return;
  }

  const country = state.countryByKey.get(countryKey);
  if (!country) {
    hideCountryHoverTooltip();
    return;
  }

  dom.countryHoverTooltip.innerHTML = `
    <strong>${escapeHtml(country.nameZh || country.nameEn)}</strong>
    <span>${escapeHtml(country.nameEn)} · ${escapeHtml(country.continentLabel || "区域未分组")}</span>
  `;
  dom.countryHoverTooltip.hidden = false;

  const offset = 18;
  const rect = dom.countryHoverTooltip.getBoundingClientRect();
  const left = Math.min(
    window.innerWidth - rect.width - 12,
    Math.max(12, screenPosition.x + offset)
  );
  const top = Math.min(
    window.innerHeight - rect.height - 12,
    Math.max(12, screenPosition.y + offset)
  );
  dom.countryHoverTooltip.style.left = `${left}px`;
  dom.countryHoverTooltip.style.top = `${top}px`;
}

function hideCountryHoverTooltip() {
  if (dom.countryHoverTooltip) {
    dom.countryHoverTooltip.hidden = true;
  }
}

function refreshCountryOverlay() {
  const entities = state.countryOverlaySource?.entities;
  entities?.removeAll();

  const hoverCountry =
    state.hoveredCountryKey && state.hoveredCountryKey !== state.activeCountryKey
      ? state.countryByKey.get(state.hoveredCountryKey)
      : null;
  const activeCountry =
    state.activeCountryKey !== "all" ? state.countryByKey.get(state.activeCountryKey) : null;

  if (hoverCountry) {
    appendCountryOverlay(entities, hoverCountry, {
      fillAlpha: 0.1,
      lineAlpha: 0.62,
      glowPower: 0.08,
      width: 2.2,
    });
  }

  if (activeCountry) {
    appendCountryOverlay(entities, activeCountry, {
      fillAlpha: 0.18,
      lineAlpha: 0.9,
      glowPower: 0.14,
      width: 2.8,
    });
  }

  state.viewer?.scene.requestRender();
}

function appendCountryOverlay(entities, country, style) {
  if (!entities || !country) {
    return;
  }

  for (const polygon of country.polygons) {
    const hierarchy = buildCountryPolygonHierarchy(polygon);
    if (hierarchy) {
      entities.add({
        polygon: {
          hierarchy,
          material: PALETTE.aqua.withAlpha(style.fillAlpha),
          perPositionHeight: false,
          height: 1200,
        },
      });
    }

    appendCountryOverlayPolyline(entities, polygon.outer, style);
    for (const hole of polygon.holes) {
      appendCountryOverlayPolyline(entities, hole, style);
    }
  }
}

function buildCountryPolygonHierarchy(polygon) {
  if (!polygon || isDatelineSpanningPolygon(polygon.outer)) {
    return null;
  }

  const outer = polygon.outer.map(([lon, lat]) => Cesium.Cartesian3.fromDegrees(lon, lat, 800));
  const holes = polygon.holes
    .filter((hole) => !isDatelineSpanningPolygon(hole))
    .map(
      (hole) =>
        new Cesium.PolygonHierarchy(
          hole.map(([lon, lat]) => Cesium.Cartesian3.fromDegrees(lon, lat, 800))
        )
    );
  return new Cesium.PolygonHierarchy(outer, holes);
}

function isDatelineSpanningPolygon(ring) {
  for (let index = 1; index < ring.length; index += 1) {
    if (Math.abs(ring[index][0] - ring[index - 1][0]) > BOUNDARY_DATELINE_THRESHOLD) {
      return true;
    }
  }
  return false;
}

function appendCountryOverlayPolyline(entities, ring, style) {
  const segments = buildBoundarySegments(ring, true);
  for (const segment of segments) {
    if (segment.length < 2) {
      continue;
    }

    entities.add({
      polyline: {
        positions: segment.map(([lon, lat]) => Cesium.Cartesian3.fromDegrees(lon, lat, BOUNDARY_ALTITUDE + 600)),
        width: style.width,
        arcType: Cesium.ArcType.NONE,
        material: new Cesium.PolylineGlowMaterialProperty({
          color: PALETTE.aqua.withAlpha(style.lineAlpha),
          glowPower: style.glowPower,
          taperPower: 0.86,
        }),
      },
    });
  }
}

function flyToCountry(countryKey) {
  const country = state.countryByKey.get(countryKey);
  if (!country) {
    return;
  }

  const points = buildCountryCameraFramePoints(country);
  if (!points.length) {
    return;
  }

  animateCenteredCameraToGeoFrame(points, {
    duration: 1.55,
    paddingScale: 1.18,
    extraDistance: 420000,
    pauseDurationMs: 5000,
  });
}

function buildCountryCameraFramePoints(country) {
  if (!country) {
    return [];
  }

  const points = [];
  const appendPoint = (lon, lat) => {
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      return;
    }

    points.push({
      lon: Cesium.Math.toRadians(lon),
      lat: Cesium.Math.toRadians(lat),
    });
  };

  if (country.labelAnchor?.length >= 2) {
    appendPoint(country.labelAnchor[0], country.labelAnchor[1]);
  }

  if (country.bbox) {
    const centerLon = (country.bbox.minLon + country.bbox.maxLon) * 0.5;
    const centerLat = (country.bbox.minLat + country.bbox.maxLat) * 0.5;
    appendPoint(country.bbox.minLon, country.bbox.minLat);
    appendPoint(country.bbox.minLon, country.bbox.maxLat);
    appendPoint(country.bbox.maxLon, country.bbox.minLat);
    appendPoint(country.bbox.maxLon, country.bbox.maxLat);
    appendPoint(centerLon, country.bbox.minLat);
    appendPoint(centerLon, country.bbox.maxLat);
    appendPoint(country.bbox.minLon, centerLat);
    appendPoint(country.bbox.maxLon, centerLat);
  }

  for (const polygon of country.polygons || []) {
    const ring = polygon?.outer || [];
    if (!ring.length) {
      continue;
    }

    const stride = Math.max(1, Math.ceil(ring.length / 18));
    for (let index = 0; index < ring.length; index += stride) {
      appendPoint(ring[index][0], ring[index][1]);
    }
  }

  return points;
}

function updateCountryLabelVisibility() {
  if (!state.boundaryReady || !state.viewer) {
    return;
  }

  const scene = state.viewer.scene;
  const ellipsoid = scene.globe?.ellipsoid || Cesium.Ellipsoid.WGS84;
  const occluder = new Cesium.EllipsoidalOccluder(ellipsoid, state.viewer.camera.positionWC);
  const cameraDirectionFromCenter = Cesium.Cartesian3.normalize(
    state.viewer.camera.positionWC,
    new Cesium.Cartesian3()
  );
  const cameraHeight = state.viewer.camera.positionCartographic?.height || 0;
  const canvas = scene.canvas;
  const now = Cesium.JulianDate.now();
  const occupied = [];
  const candidates = [];

  for (const country of state.countryBoundaries) {
    const labelEntity = country.labelEntity;
    const label = labelEntity?.label;
    if (!labelEntity || !label) {
      continue;
    }

    const isSelected = country.key === state.activeCountryKey;
    const isHovered = country.key === state.hoveredCountryKey;
    const shouldConsider =
      isSelected || isHovered || shouldDisplayCountryLabel(country, cameraHeight);
    if (!shouldConsider) {
      labelEntity.show = false;
      continue;
    }

    const cartesian = labelEntity.position?.getValue(now);
    if (!isCountryLabelFacingCamera(cartesian, ellipsoid, occluder, cameraDirectionFromCenter)) {
      labelEntity.show = false;
      continue;
    }

    const windowPosition =
      cartesian && Cesium.SceneTransforms.worldToWindowCoordinates(scene, cartesian);
    if (!windowPosition) {
      labelEntity.show = false;
      continue;
    }

    const rect = estimateCountryLabelRect(country, windowPosition, isSelected || isHovered);
    if (
      rect.right < 0 ||
      rect.bottom < 0 ||
      rect.left > canvas.clientWidth ||
      rect.top > canvas.clientHeight
    ) {
      labelEntity.show = false;
      continue;
    }

    candidates.push({
      country,
      labelEntity,
      rect,
      priority: (isSelected ? 1000 : 0) + (isHovered ? 500 : 0) + country.labelPriorityArea,
      highlighted: isSelected || isHovered,
    });
  }

  candidates.sort((left, right) => right.priority - left.priority);

  for (const candidate of candidates) {
    const isVisible =
      candidate.highlighted || !occupied.some((rect) => rectanglesOverlap(rect, candidate.rect));
    candidate.labelEntity.show = (state.boundariesEnabled || candidate.highlighted) && isVisible;
    styleCountryLabel(candidate.country, candidate.labelEntity.label, candidate.highlighted, cameraHeight);

    if (candidate.labelEntity.show) {
      occupied.push(candidate.rect);
    }
  }
}

function isCountryLabelFacingCamera(
  cartesian,
  ellipsoid,
  occluder,
  cameraDirectionFromCenter
) {
  if (!cartesian || !ellipsoid || !occluder || !cameraDirectionFromCenter) {
    return false;
  }

  if (!occluder.isPointVisible(cartesian)) {
    return false;
  }

  const surfaceNormal = ellipsoid.geodeticSurfaceNormal(cartesian, new Cesium.Cartesian3());
  return (
    Cesium.Cartesian3.dot(surfaceNormal, cameraDirectionFromCenter) >
    COUNTRY_LABEL_FRONT_HEMISPHERE_THRESHOLD
  );
}

function shouldDisplayCountryLabel(country, cameraHeight) {
  if (cameraHeight >= 22000000) {
    return country.labelPriorityArea >= COUNTRY_LABEL_GLOBAL_AREA;
  }
  if (cameraHeight >= 9000000) {
    return country.labelPriorityArea >= COUNTRY_LABEL_CONTINENT_AREA;
  }
  return country.labelPriorityArea >= COUNTRY_LABEL_LOCAL_AREA;
}

function estimateCountryLabelRect(country, windowPosition, highlighted) {
  const text = country.nameZh || country.nameEn || "";
  const profile = getCountryLabelProfile(
    country,
    highlighted,
    state.viewer?.camera?.positionCartographic?.height || 0
  );
  const width = Math.max(56, text.length * profile.fontSize * 0.66) + COUNTRY_LABEL_COLLISION_PADDING;
  const height = profile.fontSize + COUNTRY_LABEL_COLLISION_PADDING;
  return {
    left: windowPosition.x - width / 2,
    right: windowPosition.x + width / 2,
    top: windowPosition.y - height / 2,
    bottom: windowPosition.y + height / 2,
  };
}

function rectanglesOverlap(left, right) {
  return !(
    left.right < right.left ||
    left.left > right.right ||
    left.bottom < right.top ||
    left.top > right.bottom
  );
}

function styleCountryLabel(country, label, highlighted, cameraHeight) {
  if (!label) {
    return;
  }

  const profile = getCountryLabelProfile(country, highlighted, cameraHeight);

  label.font = `${profile.fontWeight} ${profile.fontSize}px "Bahnschrift", "Segoe UI"`;
  label.fillColor = profile.fillColor;
  label.outlineColor = profile.outlineColor;
  label.outlineWidth = profile.outlineWidth;
  label.showBackground = true;
  label.backgroundColor = profile.backgroundColor;
  label.backgroundPadding = profile.backgroundPadding;
  label.scaleByDistance = profile.scaleByDistance;
  label.translucencyByDistance = new Cesium.NearFarScalar(
    1.2e6,
    profile.nearAlpha,
    2.6e7,
    profile.farAlpha
  );
}

function getCountryLabelProfile(country, highlighted, cameraHeight) {
  const isSelected = country.key === state.activeCountryKey;
  const isMajor =
    country.labelPriorityArea >=
    (cameraHeight >= 22000000 ? 520 : cameraHeight >= 9000000 ? 180 : 48);

  let fontSize = 15;
  let fontWeight = 800;

  if (isSelected) {
    fontSize = cameraHeight >= 18000000 ? 20 : 19;
  } else if (highlighted) {
    fontSize = cameraHeight >= 18000000 ? 18 : 17;
  } else if (cameraHeight >= 22000000) {
    fontSize = isMajor ? 17 : 15;
    fontWeight = isMajor ? 800 : 700;
  } else if (cameraHeight >= 9000000) {
    fontSize = isMajor ? 17 : 16;
  } else {
    fontSize = isMajor ? 16 : 15;
    fontWeight = isMajor ? 800 : 700;
  }

  const fillColor = isSelected
    ? PALETTE.white.withAlpha(0.99)
    : highlighted
      ? PALETTE.white.withAlpha(0.98)
      : isMajor
        ? PALETTE.white.withAlpha(0.96)
        : PALETTE.white.withAlpha(0.92);

  const outlineColor = isSelected
    ? Cesium.Color.BLACK.withAlpha(0.96)
    : Cesium.Color.BLACK.withAlpha(0.9);

  const backgroundColor = Cesium.Color.fromCssColorString("#04101d").withAlpha(
    isSelected ? 0.58 : highlighted ? 0.5 : isMajor ? 0.4 : 0.3
  );

  const scaleByDistance =
    cameraHeight >= 18000000
      ? new Cesium.NearFarScalar(
          1.2e6,
          isSelected ? 1.18 : highlighted ? 1.12 : 1.04,
          2.8e7,
          isSelected ? 0.54 : highlighted ? 0.48 : isMajor ? 0.4 : 0.34
        )
      : new Cesium.NearFarScalar(
          8e5,
          isSelected ? 1.24 : highlighted ? 1.16 : 1.06,
          2.4e7,
          isSelected ? 0.62 : highlighted ? 0.54 : isMajor ? 0.44 : 0.36
        );

  return {
    fontSize,
    fontWeight,
    fillColor,
    outlineColor,
    outlineWidth: isSelected ? 5.6 : highlighted ? 5.1 : isMajor ? 4.7 : 4.2,
    backgroundColor,
    backgroundPadding: new Cesium.Cartesian2(isSelected ? 11 : 10, isSelected ? 6 : 5),
    scaleByDistance,
    nearAlpha: highlighted || isSelected ? 1 : 0.98,
    farAlpha: highlighted || isSelected ? 0.32 : 0.16,
  };
}

function selectEventById(eventId, options = {}) {
  const quake =
    state.eventById.get(eventId) ||
    state.filteredEvents.find((event) => event.id === eventId) ||
    state.rawEvents.find((event) => event.id === eventId);

  if (!quake) {
    return;
  }

  state.selectedEventId = quake.id;
  updateHighlight(quake);
  renderSelectedEvent();
  renderEventList();

  if (options.flyTo) {
    flyToEvent(quake);
  }
}

function updateHighlight(quake) {
  const entities = state.highlightSource.entities;
  entities.removeAll();

  const analysisTarget =
    getAnalysisTarget(state.analysisHoverKey) || getAnalysisTarget(state.analysisFocusKey);
  if (analysisTarget) {
    renderAnalysisSubsetHighlight(entities, resolveAnalysisHighlightEvents(analysisTarget));
  }

  if (!quake) {
    return;
  }

  state.highlightStartedAt = Date.now();

  const surfacePosition = Cesium.Cartesian3.fromDegrees(quake.lon, quake.lat, 0);
  const elevatedPosition = Cesium.Cartesian3.fromDegrees(
    quake.lon,
    quake.lat,
    computeAltitude(quake)
  );
  const color = getEventColor(quake);

  entities.add({
    polyline: {
      positions: [surfacePosition, elevatedPosition],
      width: 3,
      arcType: Cesium.ArcType.NONE,
      material: new Cesium.PolylineGlowMaterialProperty({
        color,
        glowPower: 0.18,
      }),
    },
  });

  entities.add({
    position: surfacePosition,
    ellipse: {
      semiMajorAxis: new Cesium.CallbackProperty(() => {
        return 60000 + getPulseRatio() * 240000;
      }, false),
      semiMinorAxis: new Cesium.CallbackProperty(() => {
        return 60000 + getPulseRatio() * 240000;
      }, false),
      material: new Cesium.ColorMaterialProperty(
        new Cesium.CallbackProperty(() => {
          return color.withAlpha(0.22 * (1 - getPulseRatio()));
        }, false)
      ),
      outline: true,
      outlineColor: color.withAlpha(0.62),
      outlineWidth: 2,
    },
  });

    entities.add({
      position: elevatedPosition,
      point: {
        pixelSize: computePixelSize(quake.mag, quake, { overlay: true }) + 4,
        color: color.withAlpha(0.2),
        outlineColor: color,
        outlineWidth: 3,
    },
  });
}

function resolveAnalysisHighlightEvents(target) {
  if (!target) {
    return [];
  }

  const ids = Array.isArray(target.highlightEventIds)
    ? target.highlightEventIds
    : Array.isArray(target.eventIds)
      ? target.eventIds
      : [];

  return ids
    .map((eventId) => state.eventById.get(eventId))
    .filter(Boolean);
}

function renderAnalysisSubsetHighlight(entities, events) {
  if (!events.length) {
    return;
  }

  const limitedEvents = events.slice(0, 96);
  for (const quake of limitedEvents) {
    const color = getEventColor(quake).withAlpha(0.9);
    entities.add({
      position: Cesium.Cartesian3.fromDegrees(quake.lon, quake.lat, computeAltitude(quake)),
      point: {
        pixelSize: Math.max(6, computePixelSize(quake.mag, quake, { overlay: true })),
        color,
        outlineColor: PALETTE.white.withAlpha(0.52),
        outlineWidth: 1.5,
        disableDepthTestDistance: 0,
      },
    });
  }
}

function zoomToEventSubset(events) {
  if (!events.length) {
    return;
  }

  animateCenteredCameraToGeoFrame(
    events.slice(0, 240).map((quake) => ({
      lon: Cesium.Math.toRadians(quake.lon),
      lat: Cesium.Math.toRadians(quake.lat),
    })),
    {
      duration: 1.35,
      paddingScale: 1.14,
      extraDistance: 320000,
      pauseDurationMs: 5000,
    }
  );
}

function getPulseRatio() {
  return ((Date.now() - state.highlightStartedAt) % PULSE_MS) / PULSE_MS;
}

function renderAnalysisScope() {
  if (!dom.analysisScope) {
    return;
  }

  const sourceLabel = getCatalogSourceLabel();
  const rangeCopy = `${formatShortDate(state.rangeStart)} - ${formatShortDate(state.rangeEnd)}`;
  const countryCopy = getCountryDisplayNameByKey(state.activeCountryKey);
  const density = computeSampleDensity(state.filteredEvents, state.rangeStart, state.rangeEnd);
  const compareCopy = state.hotspotSelectedKeys.length
    ? `；当前对比集合 ${formatNumber(state.hotspotSelectedKeys.length)} 个地区`
    : "";
  dom.analysisScope.textContent =
    `当前分析范围：${rangeCopy}；统计口径：M${state.minMagnitude.toFixed(1)}+；区域范围：${countryCopy}；` +
    `当前样本量：${formatNumber(state.filteredEvents.length)} 条；数据源：${sourceLabel}；` +
    `显示模式：${state.encodingMode === "depth" ? "深度" : "震级"}；样本密度：${density.toFixed(
      2
    )} 条/天${compareCopy}。`;
}

function renderDatabaseSyncStatus() {
  if (!dom.analysisDbSyncCard || !dom.analysisDbSyncTitle || !dom.analysisDbSyncBody) {
    return;
  }

  let title = "最近一次数据库同步";
  let body = "当前页面尚未触发本地数据库同步。";
  let tone = "idle";

  if (!canPersistLiveSupplementToLocalDatabase()) {
    title = "数据库同步状态";
    body = "当前为静态站点访问模式，不连接本地 SQLite 数据库。";
    tone = "static";
  } else if (state.liveSupplementDbSyncPhase === "running") {
    title = "正在同步到 SQLite";
    body = `正在把最新补充事件写入本地数据库：待写入 ${formatNumber(
      state.liveSupplementDbFetchedCount
    )} 条。页面中的新数据已可见，数据库会在后台完成更新。`;
    tone = "running";
  } else if (state.liveSupplementDbSyncPhase === "completed") {
    title = `最近一次数据库同步 · ${formatDateTime(state.liveSupplementDbCompletedAt)}`;
    body = `已写入 ${formatNumber(state.liveSupplementDbFetchedCount)} 条，新增 ${formatNumber(
      state.liveSupplementDbInsertedCount
    )} 条，更新 ${formatNumber(state.liveSupplementDbUpdatedCount)} 条${
      state.liveSupplementDbStoredCount > 0
        ? `；当前库内总数 ${formatNumber(state.liveSupplementDbStoredCount)} 条。`
        : "。"
    }`;
    tone = "completed";
  } else if (state.liveSupplementDbSyncPhase === "failed") {
    title = "数据库同步失败";
    body = `最新事件已显示，但写入 SQLite 失败：${
      state.liveSupplementDbLastError || "未知错误"
    }。`;
    tone = "failed";
  } else if (state.catalogSyncStatus?.isRunning) {
    title = state.catalogSyncStatus.isIncremental ? "增量同步进行中" : "全量同步进行中";
    body = `${buildSyncDetailCopy(state.catalogSyncStatus)} 当前服务正在更新本地 SQLite 数据仓。`;
    tone = "running";
  } else if (state.catalogSyncStatus?.completedAt) {
    title = `最近一次数据库同步 · ${formatDateTime(state.catalogSyncStatus.completedAt)}`;
    body = buildSyncDetailCopy(state.catalogSyncStatus) || "最近一次数据库同步已完成。";
    tone = "completed";
  }

  dom.analysisDbSyncCard.dataset.tone = tone;
  dom.analysisDbSyncTitle.textContent = title;
  dom.analysisDbSyncBody.textContent = body;
}

function renderStats() {
  const strongest = pickFeaturedEvent(state.filteredEvents);
  const avgDepth = computeMeanDepth(state.filteredEvents);
  const avgMagnitude = computeMeanMagnitude(state.filteredEvents);
  const latestEvent = getLatestEvent(state.filteredEvents);
  const strongestRegion = strongest ? getEventDisplayRegionLabel(strongest) : "--";

  dom.visibleCount.textContent = formatNumber(state.filteredEvents.length);
  dom.strongestMag.textContent = strongest ? `M${strongest.mag.toFixed(1)}` : "--";
  if (dom.avgMag) {
    dom.avgMag.textContent = state.filteredEvents.length ? avgMagnitude.toFixed(2) : "--";
  }
  dom.avgDepth.textContent = state.filteredEvents.length ? `${avgDepth.toFixed(1)} km` : "--";
  if (dom.latestEventTime) {
    dom.latestEventTime.textContent = latestEvent ? formatDateTime(latestEvent.time) : "--";
  }
  if (dom.strongestRegion) {
    dom.strongestRegion.textContent = strongestRegion || "--";
  }
  if (dom.deepShare) {
    const deepCount = state.filteredEvents.filter((event) => event.depth >= 300).length;
    const deepShare = state.filteredEvents.length
      ? (deepCount / state.filteredEvents.length) * 100
      : 0;
    dom.deepShare.textContent = state.filteredEvents.length ? `${deepShare.toFixed(1)}%` : "--";
  }

  dom.dataSourceLabel.textContent = getCatalogSourceLabel();
  dom.activeWindowLabel.textContent = state.rangeLabel;
  dom.feedUpdatedLabel.textContent = state.feedGeneratedAt
    ? formatDateTime(state.feedGeneratedAt)
    : "--";
  if (dom.resultPill) {
    dom.resultPill.textContent = `显示 ${formatNumber(state.filteredEvents.length)} 条 · 筛选 M${state.effectiveMinMagnitude.toFixed(
      1
    )}+`;
  }
  if (dom.rangeQueryNote) {
    dom.rangeQueryNote.textContent = state.queryNote;
  }
}

function renderSelectedEvent() {
  const quake = getSelectedEvent();
  if (!quake) {
    dom.selectedEvent.classList.add("is-empty");
    dom.selectedEvent.innerHTML =
      '<div class="empty-copy">当前筛选结果为空，请降低震级阈值或缩短时间跨度。</div>';
    return;
  }

  const context = computeFocusedEventContext(quake, state.filteredEvents);
  const sourceLabel = getCatalogSourceLabel();

  const alertBadge = quake.alert
    ? `<span class="detail-badge">警报级别 ${escapeHtml(quake.alert.toUpperCase())}</span>`
    : "";
  const tsunamiBadge = quake.tsunami
    ? '<span class="detail-badge">触发海啸标记</span>'
    : "";
  const detailRegionBadge = getEventDetailRegionBadgeLabel(quake);
  const countryBadge = quake.countryNameZh
    ? `<span class="detail-badge">${escapeHtml(quake.countryNameZh)}</span>`
    : "";
  const marineBadge = `<span class="detail-badge">${
    context.isMarine ? "海域 / 近海事件" : "陆域 / 近岸事件"
  }</span>`;

  dom.selectedEvent.classList.remove("is-empty");
  dom.selectedEvent.innerHTML = `
    <div class="detail-badge-row">
      <span class="detail-mag">M${quake.mag.toFixed(1)}</span>
      <span class="detail-badge">深度 ${quake.depth.toFixed(1)} km</span>
      ${
        detailRegionBadge
          ? `<span class="detail-badge">${escapeHtml(detailRegionBadge)}</span>`
          : ""
      }
      ${countryBadge}
      ${marineBadge}
      ${alertBadge}
      ${tsunamiBadge}
    </div>
    <h3>${escapeHtml(quake.place)}</h3>
    <p class="detail-meta">
      发生时间：${formatDateTime(quake.time)} · ${formatRelativeTime(quake.time)}<br />
      最近更新：${formatDateTime(quake.updated)}
    </p>
    <p class="detail-submeta">
      数据源：${escapeHtml(sourceLabel)} · 与当前样本最近事件间隔 ${escapeHtml(
        context.nearestGapLabel
      )} · 当前样本时间排序第 ${formatNumber(context.timeRank)} / ${formatNumber(
        state.filteredEvents.length
      )} 位
    </p>
    <div class="detail-metrics">
      <div>
        <span>经度</span>
        <strong>${quake.lon.toFixed(2)}°</strong>
      </div>
      <div>
        <span>纬度</span>
        <strong>${quake.lat.toFixed(2)}°</strong>
      </div>
      <div>
        <span>显著性</span>
        <strong>${formatNumber(quake.significance)}</strong>
      </div>
    </div>
    <div class="detail-insight-grid">
      <div class="detail-insight">
        <span>震级相对位置</span>
        <strong>前 ${context.magnitudeTopPercent.toFixed(1)}%</strong>
      </div>
      <div class="detail-insight">
        <span>深度类别</span>
        <strong>${escapeHtml(context.depthClassLabel)}</strong>
      </div>
      <div class="detail-insight">
        <span>区域近 30 天活跃度</span>
        <strong>${formatNumber(context.regionRecentCount)} 条</strong>
      </div>
      <div class="detail-insight">
        <span>区域震级位次</span>
        <strong>${escapeHtml(context.regionRankLabel)}</strong>
      </div>
    </div>
    <div class="detail-observation-list">
      <div class="detail-observation">${escapeHtml(context.observationA)}</div>
      <div class="detail-observation">${escapeHtml(context.observationB)}</div>
      <div class="detail-observation">${escapeHtml(context.observationC)}</div>
    </div>
    <div class="detail-links">
      <a class="detail-link" href="${escapeAttribute(quake.url)}" target="_blank" rel="noreferrer">
        打开 USGS 详情
      </a>
      <button class="detail-link" type="button" data-event-id="${escapeAttribute(quake.id)}">
        飞到事件
      </button>
    </div>
  `;

  dom.selectedEvent
    .querySelector("[data-event-id]")
    ?.addEventListener("click", () => selectEventById(quake.id, { flyTo: true }));
}

function renderTrendChart() {
  if (!dom.trendChart) {
    return;
  }

  const analysis = buildTemporalAnalysis(state.filteredEvents, state.rangeStart, state.rangeEnd);
  if (!analysis.buckets.length) {
    dom.trendChart.innerHTML = '<div class="empty-copy">暂无可绘制的时间序列样本。</div>';
    return;
  }

  const frame = getChartFrame();
  const chartWidth = frame.width - frame.left - frame.right;
  const chartHeight = frame.height - frame.top - frame.bottom;
  const yTicks = buildValueTicks(analysis.peakCount, 4);
  const barWidth = chartWidth / Math.max(analysis.buckets.length, 1);
  const baselineY = frame.top + chartHeight;

  const areaPoints = [];
  const countPoints = [];
  const movingAveragePoints = [];
  const bars = analysis.buckets
    .map((bucket, index) => {
      const centerX = frame.left + barWidth * index + barWidth / 2;
      const barHeight = scaleLinear(bucket.count, 0, analysis.peakCount, 0, chartHeight);
      const y = baselineY - barHeight;
      const barX = frame.left + barWidth * index + Math.max(2, barWidth * 0.16);
      const width = Math.max(4, barWidth * 0.68);
      const targetKey = registerAnalysisTarget({
        label: `${bucket.shortLabel} 时间箱`,
        eventIds: bucket.eventIds,
        highlightEventIds: sampleEventIds(bucket.eventIds),
        totalCount: bucket.count,
        tooltipTitle: bucket.label,
        tooltipLines: [
          `时间范围：${bucket.label}`,
          `事件数量：${formatNumber(bucket.count)} 条`,
          `平均震级：${bucket.count ? bucket.meanMagnitude.toFixed(2) : "--"}`,
          `最大震级：${bucket.maxMagnitude ? `M${bucket.maxMagnitude.toFixed(1)}` : "--"}`,
          `估算能量：${formatEnergyValue(bucket.energy)}`,
        ],
        statusMessage: `已高亮 ${bucket.label} 时间箱内的 ${formatNumber(bucket.count)} 条事件。`,
      });

      areaPoints.push([centerX, y]);
      countPoints.push([centerX, y]);
      movingAveragePoints.push([
        centerX,
        baselineY - scaleLinear(bucket.movingAverage, 0, analysis.peakCount, 0, chartHeight),
      ]);

      return `
        <g data-analysis-key="${targetKey}">
          <rect
            class="chart-bar"
            x="${barX.toFixed(2)}"
            y="${y.toFixed(2)}"
            width="${width.toFixed(2)}"
            height="${Math.max(2, barHeight).toFixed(2)}"
            rx="6"
          ></rect>
          <rect
            class="chart-hitbox"
            x="${(frame.left + barWidth * index).toFixed(2)}"
            y="${frame.top.toFixed(2)}"
            width="${Math.max(12, barWidth).toFixed(2)}"
            height="${chartHeight.toFixed(2)}"
          ></rect>
        </g>
      `;
    })
    .join("");

  const gridLines = yTicks
    .map((tick) => {
      const y = baselineY - scaleLinear(tick, 0, analysis.peakCount, 0, chartHeight);
      return `
        <line class="chart-grid-line" x1="${frame.left}" y1="${y}" x2="${frame.width - frame.right}" y2="${y}"></line>
        <text class="chart-axis-text" x="${frame.left - 10}" y="${y + 4}" text-anchor="end">${formatNumber(
          tick
        )}</text>
      `;
    })
    .join("");

  const xLabels = buildTemporalAxisLabels(analysis.buckets, frame, chartWidth);
  const areaPath = buildAreaPath(areaPoints, baselineY);
  const countPath = buildLinePath(countPoints);
  const movingAveragePath = buildLinePath(movingAveragePoints);

  dom.trendChart.innerHTML = `
    <div class="chart-meta">
      <span>统计粒度：${analysis.granularityLabel}</span>
      <span>峰值 ${formatNumber(analysis.peakCount)} 条 / 箱 · 平均 ${analysis.meanCount.toFixed(
        1
      )} 条 / 箱</span>
    </div>
    <div class="chart-legend">
      <span class="chart-legend-item"><i class="chart-swatch" style="--swatch: rgba(103,232,249,0.92)"></i>事件频次</span>
      <span class="chart-legend-item"><i class="chart-swatch" style="--swatch: rgba(251,191,36,0.92)"></i>${analysis.movingAverageWindow} 箱移动平均</span>
    </div>
    <div class="analysis-svg-wrap">
      <svg class="analysis-svg" viewBox="0 0 ${frame.width} ${frame.height}" role="img" aria-label="时间序列分析图">
        <defs>
          <linearGradient id="temporalAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#67e8f9" stop-opacity="0.36"></stop>
            <stop offset="100%" stop-color="#67e8f9" stop-opacity="0.03"></stop>
          </linearGradient>
        </defs>
        ${gridLines}
        <path d="${areaPath}" fill="url(#temporalAreaFill)"></path>
        ${bars}
        <path class="chart-line" d="${countPath}"></path>
        <path class="chart-line is-secondary" d="${movingAveragePath}"></path>
        <line class="chart-axis-line" x1="${frame.left}" y1="${baselineY}" x2="${frame.width - frame.right}" y2="${baselineY}"></line>
        <line class="chart-axis-line" x1="${frame.left}" y1="${frame.top}" x2="${frame.left}" y2="${baselineY}"></line>
        ${xLabels}
        <text class="chart-axis-caption" x="${frame.left}" y="${frame.top - 6}">事件数 / 箱</text>
      </svg>
    </div>
    <div class="chart-footnote">
      <span>悬停可高亮对应时间箱内事件，点击可将地图聚焦至该时段样本。</span>
      <span>窗口内累计事件 ${formatNumber(state.filteredEvents.length)} 条</span>
    </div>
  `;
}

function renderMagnitudeDistribution() {
  if (!dom.magnitudeChart) {
    return;
  }

  const distribution = buildMagnitudeDistribution(state.filteredEvents);
  if (!distribution.bins.length) {
    dom.magnitudeChart.innerHTML = '<div class="empty-copy">暂无可绘制的震级分布样本。</div>';
    return;
  }

  const frame = getChartFrame();
  const chartWidth = frame.width - frame.left - frame.right;
  const chartHeight = frame.height - frame.top - frame.bottom;
  const baselineY = frame.top + chartHeight;
  const barWidth = chartWidth / Math.max(distribution.bins.length, 1);
  const yTicks = buildValueTicks(distribution.peakCount, 4);
  const cumulativePoints = [];

  const bars = distribution.bins
    .map((bin, index) => {
      const x = frame.left + index * barWidth + Math.max(2, barWidth * 0.12);
      const width = Math.max(5, barWidth * 0.76);
      const height = scaleLinear(bin.count, 0, distribution.peakCount, 0, chartHeight);
      const y = baselineY - height;
      const centerX = frame.left + index * barWidth + barWidth / 2;
      cumulativePoints.push([
        centerX,
        baselineY - scaleLinear(bin.cumulativeRatio, 0, 1, 0, chartHeight),
      ]);

      const targetKey = registerAnalysisTarget({
        label: `${bin.label} 震级箱`,
        eventIds: bin.eventIds,
        highlightEventIds: sampleEventIds(bin.eventIds),
        totalCount: bin.count,
        tooltipTitle: bin.label,
        tooltipLines: [
          `事件数量：${formatNumber(bin.count)} 条`,
          `样本占比：${bin.share.toFixed(1)}%`,
          `累计占比：${(bin.cumulativeRatio * 100).toFixed(1)}%`,
          `代表震级中心：M${bin.midpoint.toFixed(1)}`,
        ],
      });

      const severityClass =
        bin.midpoint >= 6 ? "is-hot" : bin.midpoint >= 4.5 ? "is-warm" : "";
      return `
        <g data-analysis-key="${targetKey}">
          <rect
            class="chart-bar ${severityClass}"
            x="${x.toFixed(2)}"
            y="${y.toFixed(2)}"
            width="${width.toFixed(2)}"
            height="${Math.max(2, height).toFixed(2)}"
            rx="6"
          ></rect>
          <rect
            class="chart-hitbox"
            x="${(frame.left + index * barWidth).toFixed(2)}"
            y="${frame.top.toFixed(2)}"
            width="${Math.max(12, barWidth).toFixed(2)}"
            height="${chartHeight.toFixed(2)}"
          ></rect>
        </g>
      `;
    })
    .join("");

  const gridLines = yTicks
    .map((tick) => {
      const y = baselineY - scaleLinear(tick, 0, distribution.peakCount, 0, chartHeight);
      return `
        <line class="chart-grid-line" x1="${frame.left}" y1="${y}" x2="${frame.width - frame.right}" y2="${y}"></line>
        <text class="chart-axis-text" x="${frame.left - 10}" y="${y + 4}" text-anchor="end">${formatNumber(
          tick
        )}</text>
      `;
    })
    .join("");

  const xLabels = distribution.bins
    .filter((bin, index) => index === 0 || index === distribution.bins.length - 1 || index % 2 === 0)
    .map((bin, index) => {
      const globalIndex = distribution.bins.findIndex((entry) => entry.label === bin.label);
      const x = frame.left + globalIndex * barWidth + barWidth / 2;
      return `<text class="chart-axis-text" x="${x}" y="${baselineY + 18}" text-anchor="middle">${escapeHtml(
        bin.tickLabel
      )}</text>`;
    })
    .join("");

  dom.magnitudeChart.innerHTML = `
    <div class="chart-meta">
      <span>分箱宽度：ΔM = ${distribution.binSize.toFixed(1)}</span>
      <span>主导震级带：${escapeHtml(distribution.dominantLabel)} · ${distribution.dominantShare.toFixed(
        1
      )}%</span>
    </div>
    <div class="chart-legend">
      <span class="chart-legend-item"><i class="chart-swatch" style="--swatch: rgba(103,232,249,0.92)"></i>频次直方图</span>
      <span class="chart-legend-item"><i class="chart-swatch" style="--swatch: rgba(251,191,36,0.92)"></i>累计分布曲线</span>
    </div>
    <div class="analysis-svg-wrap">
      <svg class="analysis-svg" viewBox="0 0 ${frame.width} ${frame.height}" role="img" aria-label="震级分布图">
        ${gridLines}
        ${bars}
        <path class="chart-line is-secondary" d="${buildLinePath(cumulativePoints)}"></path>
        <line class="chart-axis-line" x1="${frame.left}" y1="${baselineY}" x2="${frame.width - frame.right}" y2="${baselineY}"></line>
        <line class="chart-axis-line" x1="${frame.left}" y1="${frame.top}" x2="${frame.left}" y2="${baselineY}"></line>
        ${xLabels}
        <text class="chart-axis-caption" x="${frame.left}" y="${frame.top - 6}">频次 / 箱</text>
        <text class="chart-axis-caption" x="${frame.width - frame.right}" y="${frame.top - 6}" text-anchor="end">累计占比</text>
      </svg>
    </div>
    <div class="chart-footnote">
      <span>点击某一震级箱可反向高亮地图中对应震级段事件。</span>
      <span>样本震级范围：M${distribution.minMagnitude.toFixed(1)} - M${distribution.maxMagnitude.toFixed(
        1
      )}</span>
    </div>
  `;
}

function renderDepthAnalysisChart() {
  if (!dom.depthChart) {
    return;
  }

  const analysis = buildDepthDistribution(state.filteredEvents);
  if (!analysis.bins.length) {
    dom.depthChart.innerHTML = '<div class="empty-copy">暂无可绘制的深度结构样本。</div>';
    return;
  }

  const frame = getChartFrame();
  const chartWidth = frame.width - frame.left - frame.right;
  const chartHeight = frame.height - frame.top - frame.bottom;
  const baselineY = frame.top + chartHeight;
  const barWidth = chartWidth / Math.max(analysis.bins.length, 1);
  const yTicks = buildValueTicks(analysis.peakCount, 4);

  const gridLines = yTicks
    .map((tick) => {
      const y = baselineY - scaleLinear(tick, 0, analysis.peakCount, 0, chartHeight);
      return `
        <line class="chart-grid-line" x1="${frame.left}" y1="${y}" x2="${frame.width - frame.right}" y2="${y}"></line>
        <text class="chart-axis-text" x="${frame.left - 10}" y="${y + 4}" text-anchor="end">${formatNumber(
          tick
        )}</text>
      `;
    })
    .join("");

  const bars = analysis.bins
    .map((bin, index) => {
      const x = frame.left + index * barWidth + Math.max(2, barWidth * 0.12);
      const width = Math.max(6, barWidth * 0.74);
      const height = scaleLinear(bin.count, 0, analysis.peakCount, 0, chartHeight);
      const y = baselineY - height;
      const targetKey = registerAnalysisTarget({
        label: `${bin.label} 深度带`,
        eventIds: bin.eventIds,
        highlightEventIds: sampleEventIds(bin.eventIds),
        totalCount: bin.count,
        tooltipTitle: bin.label,
        tooltipLines: [
          `深度范围：${bin.label}`,
          `事件数量：${formatNumber(bin.count)} 条`,
          `样本占比：${bin.share.toFixed(1)}%`,
          `平均震级：${bin.count ? bin.meanMagnitude.toFixed(2) : "--"}`,
        ],
      });

      return `
        <g data-analysis-key="${targetKey}">
          <rect
            class="chart-bar ${bin.depthClass}"
            x="${x.toFixed(2)}"
            y="${y.toFixed(2)}"
            width="${width.toFixed(2)}"
            height="${Math.max(2, height).toFixed(2)}"
            rx="6"
          ></rect>
          <rect
            class="chart-hitbox"
            x="${(frame.left + index * barWidth).toFixed(2)}"
            y="${frame.top.toFixed(2)}"
            width="${Math.max(12, barWidth).toFixed(2)}"
            height="${chartHeight.toFixed(2)}"
          ></rect>
          <text class="chart-axis-text" x="${(frame.left + index * barWidth + barWidth / 2).toFixed(
            2
          )}" y="${baselineY + 18}" text-anchor="middle">${escapeHtml(bin.tickLabel)}</text>
        </g>
      `;
    })
    .join("");

  dom.depthChart.innerHTML = `
    <div class="chart-meta">
      <span>深度单位：km</span>
      <span>中位深度 ${analysis.medianDepth.toFixed(1)} km · P90 ${analysis.p90Depth.toFixed(
        1
      )} km</span>
    </div>
    <div class="analysis-summary-row">
      ${analysis.summaryBands
        .map(
          (band) =>
            `<span class="analysis-chip">${escapeHtml(band.label)} ${band.share.toFixed(1)}%</span>`
        )
        .join("")}
    </div>
    <div class="analysis-svg-wrap">
      <svg class="analysis-svg" viewBox="0 0 ${frame.width} ${frame.height}" role="img" aria-label="深度分布图">
        ${gridLines}
        ${bars}
        <line class="chart-axis-line" x1="${frame.left}" y1="${baselineY}" x2="${frame.width - frame.right}" y2="${baselineY}"></line>
        <line class="chart-axis-line" x1="${frame.left}" y1="${frame.top}" x2="${frame.left}" y2="${baselineY}"></line>
        <text class="chart-axis-caption" x="${frame.left}" y="${frame.top - 6}">频次 / 深度带</text>
      </svg>
    </div>
    <div class="chart-footnote">
      <span>点击某一深度带可高亮对应深度层事件。</span>
      <span>主导深度结构：${escapeHtml(analysis.dominantLabel)}</span>
    </div>
  `;
}

function renderMagnitudeDepthRelation() {
  if (!dom.magnitudeDepthChart) {
    return;
  }

  const scatter = buildMagnitudeDepthScatter(state.filteredEvents);
  if (!scatter.points.length) {
    dom.magnitudeDepthChart.innerHTML =
      '<div class="empty-copy">暂无可绘制的震级-深度关系样本。</div>';
    return;
  }

  const frame = getChartFrame(640, 236, 46, 18, 18, 38);
  const chartWidth = frame.width - frame.left - frame.right;
  const chartHeight = frame.height - frame.top - frame.bottom;
  const xTicks = buildValueTicks(scatter.maxMagnitude, 4, scatter.minMagnitude);
  const yTicks = buildValueTicks(scatter.maxDepth, 4, 0);

  const gridLines = yTicks
    .map((tick) => {
      const y = frame.top + scaleLinear(tick, 0, scatter.maxDepth, 0, chartHeight);
      return `
        <line class="chart-grid-line" x1="${frame.left}" y1="${y}" x2="${frame.width - frame.right}" y2="${y}"></line>
        <text class="chart-axis-text" x="${frame.left - 10}" y="${y + 4}" text-anchor="end">${formatNumber(
          tick
        )}</text>
      `;
    })
    .join("");

  const xLabels = xTicks
    .map((tick) => {
      const x = frame.left + scaleLinear(tick, scatter.minMagnitude, scatter.maxMagnitude, 0, chartWidth);
      return `<text class="chart-axis-text" x="${x}" y="${frame.height - 10}" text-anchor="middle">${tick.toFixed(
        1
      )}</text>`;
    })
    .join("");

  const points = scatter.points
    .map((point) => {
      const x = frame.left + scaleLinear(point.mag, scatter.minMagnitude, scatter.maxMagnitude, 0, chartWidth);
      const y = frame.top + scaleLinear(point.depth, 0, scatter.maxDepth, 0, chartHeight);
      const analysisKey = registerAnalysisTarget({
        type: "event",
        label: point.place,
        eventId: point.id,
        highlightEventIds: [point.id],
        tooltipTitle: point.place,
        tooltipLines: [
          `震级：M${point.mag.toFixed(1)}`,
          `深度：${point.depth.toFixed(1)} km`,
          `时间：${formatDateTime(point.time)}`,
          `显著性：${formatNumber(point.significance)}`,
        ],
      });
      return `
        <circle
          data-analysis-key="${analysisKey}"
          class="chart-scatter-point"
          cx="${x.toFixed(2)}"
          cy="${y.toFixed(2)}"
          r="${point.radius.toFixed(2)}"
          fill="${point.color}"
          opacity="${point.opacity.toFixed(2)}"
        ></circle>
      `;
    })
    .join("");

  dom.magnitudeDepthChart.innerHTML = `
    <div class="chart-meta">
      <span>抽样绘制 ${formatNumber(scatter.points.length)} / ${formatNumber(
        state.filteredEvents.length
      )} 条样本</span>
      <span>点大小：显著性 · 透明度：时间新旧</span>
    </div>
    <div class="analysis-svg-wrap">
      <svg class="analysis-svg" viewBox="0 0 ${frame.width} ${frame.height}" role="img" aria-label="震级与深度关系散点图">
        ${gridLines}
        <line class="chart-axis-line" x1="${frame.left}" y1="${frame.top}" x2="${frame.left}" y2="${frame.height - frame.bottom}"></line>
        <line class="chart-axis-line" x1="${frame.left}" y1="${frame.height - frame.bottom}" x2="${frame.width - frame.right}" y2="${frame.height - frame.bottom}"></line>
        ${xLabels}
        ${points}
        <text class="chart-axis-caption" x="${frame.left}" y="${frame.top - 6}">深度 / km</text>
        <text class="chart-axis-caption" x="${frame.width - frame.right}" y="${frame.height - 10}" text-anchor="end">震级 / Mw</text>
      </svg>
    </div>
    <div class="chart-footnote">
      <span>点击散点可在地图与右侧详情卡中同步聚焦该事件。</span>
      <span>深度轴向下递增，更接近剖面式表达。</span>
    </div>
  `;
}

function renderEnergyTrendChart() {
  if (!dom.energyChart) {
    return;
  }

  const analysis = buildEnergyTrendAnalysis(state.filteredEvents, state.rangeStart, state.rangeEnd);
  if (!analysis.points.length) {
    dom.energyChart.innerHTML = '<div class="empty-copy">暂无足够样本用于绘制累计能量曲线。</div>';
    return;
  }

  const frame = getChartFrame();
  const chartWidth = frame.width - frame.left - frame.right;
  const chartHeight = frame.height - frame.top - frame.bottom;
  const baselineY = frame.top + chartHeight;
  const yTicks = buildValueTicks(analysis.maxLogEnergy, 4, analysis.minLogEnergy);
  const linePoints = [];

  const overlays = analysis.points
    .map((point, index) => {
      const x = frame.left + scaleLinear(index, 0, analysis.points.length - 1 || 1, 0, chartWidth);
      const y =
        baselineY -
        scaleLinear(point.logEnergy, analysis.minLogEnergy, analysis.maxLogEnergy, 0, chartHeight);
      linePoints.push([x, y]);

      const targetKey = registerAnalysisTarget({
        label: `${point.shortLabel} 能量节点`,
        eventIds: point.eventIds,
        highlightEventIds: sampleEventIds(point.eventIds),
        totalCount: point.count,
        tooltipTitle: point.shortLabel,
        tooltipLines: [
          `累计事件：${formatNumber(point.cumulativeCount)} 条`,
          `累计能量：${formatEnergyValue(point.cumulativeEnergy)}`,
          `估算对数能量：log10E = ${point.logEnergy.toFixed(2)}`,
          `区间事件数：${formatNumber(point.count)} 条`,
        ],
      });

      return `
        <rect
          data-analysis-key="${targetKey}"
          class="chart-hitbox"
          x="${(x - Math.max(5, chartWidth / analysis.points.length / 2)).toFixed(2)}"
          y="${frame.top.toFixed(2)}"
          width="${Math.max(10, chartWidth / analysis.points.length).toFixed(2)}"
          height="${chartHeight.toFixed(2)}"
        ></rect>
      `;
    })
    .join("");

  const gridLines = yTicks
    .map((tick) => {
      const y =
        baselineY - scaleLinear(tick, analysis.minLogEnergy, analysis.maxLogEnergy, 0, chartHeight);
      return `
        <line class="chart-grid-line" x1="${frame.left}" y1="${y}" x2="${frame.width - frame.right}" y2="${y}"></line>
        <text class="chart-axis-text" x="${frame.left - 10}" y="${y + 4}" text-anchor="end">${tick.toFixed(
          1
        )}</text>
      `;
    })
    .join("");

  dom.energyChart.innerHTML = `
    <div class="chart-meta">
      <span>能量换算：log10E = 1.5M + 4.8</span>
      <span>累计能量 ${formatEnergyValue(analysis.totalEnergy)} · 等效 M${analysis.equivalentMagnitude.toFixed(
        2
      )}</span>
    </div>
    <div class="analysis-svg-wrap">
      <svg class="analysis-svg" viewBox="0 0 ${frame.width} ${frame.height}" role="img" aria-label="累计能量释放曲线">
        ${gridLines}
        <path class="chart-line" d="${buildLinePath(linePoints)}"></path>
        ${overlays}
        <line class="chart-axis-line" x1="${frame.left}" y1="${baselineY}" x2="${frame.width - frame.right}" y2="${baselineY}"></line>
        <line class="chart-axis-line" x1="${frame.left}" y1="${frame.top}" x2="${frame.left}" y2="${baselineY}"></line>
        <text class="chart-axis-caption" x="${frame.left}" y="${frame.top - 6}">log10(E/J)</text>
        <text class="chart-axis-text" x="${frame.left}" y="${frame.height - 10}">${escapeHtml(
          analysis.startLabel
        )}</text>
        <text class="chart-axis-text" x="${frame.width - frame.right}" y="${frame.height - 10}" text-anchor="end">${escapeHtml(
          analysis.endLabel
        )}</text>
      </svg>
    </div>
    <div class="chart-footnote">
      <span>悬停节点可查看该时间段累计能量与事件数，点击可高亮对应时段事件。</span>
      <span>该图反映相对能量演化，不替代严格震源机制分析。</span>
    </div>
  `;
}

function configureResearchPanels() {
  dom.energyBudget = document.querySelector("#energy-budget");
  dom.depthChart = document.querySelector("#depth-chart");
  dom.magnitudeDepthChart = document.querySelector("#magnitude-depth-chart");
  dom.energyChart = document.querySelector("#energy-chart");
  dom.depthRegime = document.querySelector("#depth-regime");
}

function renderEnergyBudget() {
  if (!dom.energyBudget) {
    return;
  }

  const budget = computeEnergyBudget(state.filteredEvents);
  if (!budget) {
    dom.energyBudget.innerHTML =
      '<div class="empty-copy">暂无足够样本用于估计辐射能量预算。</div>';
    return;
  }

  dom.energyBudget.innerHTML = `
    <div class="analysis-grid">
      <article class="analysis-card">
        <span class="analysis-label">累计能量</span>
        <strong>${formatEnergyValue(budget.totalEnergy)}</strong>
        <p>按 log10E = 1.5M + 4.8 的经验关系折算。</p>
      </article>
      <article class="analysis-card">
        <span class="analysis-label">等效震级</span>
        <strong>M${budget.equivalentMagnitude.toFixed(2)}</strong>
        <p>若将当前样本总能量合并为一次事件，其等效震级。</p>
      </article>
      <article class="analysis-card">
        <span class="analysis-label">主导占比</span>
        <strong>${budget.dominantShare.toFixed(1)}%</strong>
        <p>最高能量事件对总能量预算的贡献份额。</p>
      </article>
    </div>
    <div class="analysis-summary-row">
      <span class="analysis-chip">Top 1 占比 ${budget.dominantShare.toFixed(1)}%</span>
      <span class="analysis-chip">Top ${budget.topEvents.length} 能量贡献 ${budget.topEvents
        .reduce((sum, item) => sum + item.share, 0)
        .toFixed(1)}%</span>
    </div>
    <div class="energy-share-list">
      ${budget.topEvents
        .map(
          (item, index) => `
            <div class="energy-share-row">
              <div class="energy-share-head">
                <span>#${index + 1} M${item.mag.toFixed(1)}</span>
                <strong>${item.share.toFixed(1)}%</strong>
              </div>
              <div class="distribution-track">
                <span class="distribution-fill" style="--fill: ${item.share}%"></span>
              </div>
            </div>
          `
        )
        .join("")}
    </div>
    <div class="analysis-note">
      能量值为经验关系估算结果，适合用于样本间相对比较，不应视为严格物理反演结果。
    </div>
  `;
}

function buildHotspotKey(scopeLevel, countryKey, regionName) {
  return `${scopeLevel}:${countryKey || "scope"}:${normalizeCountryLookupKey(regionName) || "unknown"}`;
}

function syncHotspotSelectionState() {
  const availableKeys = new Set(state.hotspots.map((item) => item.key));
  state.hotspotSelectedKeys = state.hotspotSelectedKeys.filter((key) => availableKeys.has(key));
}

function findHotspotByKey(hotspotKey) {
  return state.hotspots.find((item) => item.key === hotspotKey) || null;
}

function getVisibleHotspots() {
  const query = normalizeCountryLookupKey(state.hotspotSearchQuery);
  const filtered = !query
    ? [...state.hotspots]
    : state.hotspots.filter((item) => item.searchTokens.some((token) => token.includes(query)));
  const metric = HOTSPOT_COMPARE_METRICS[state.hotspotCompareMetric] || HOTSPOT_COMPARE_METRICS.count;
  return filtered
    .sort((left, right) => {
      const metricDelta = metric.value(right) - metric.value(left);
      if (Math.abs(metricDelta) > 1e-9) {
        return metricDelta;
      }
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return right.maxMag - left.maxMag;
    })
    .map((item, index) => ({
      ...item,
      displayRank: index + 1,
    }));
}

function getHotspotScopeChipLabel() {
  if (state.activeCountryKey !== "all" && state.activeCountryKey !== UNCLASSIFIED_COUNTRY_KEY) {
    const currentScope = state.hotspots[0]?.scopeLabel || "国内子区域";
    return `${getCountryDisplayNameByKey(state.activeCountryKey)} · ${currentScope}`;
  }
  return "全球国家/地区排行";
}

function ensureHotspotSelected(hotspotKey) {
  if (!hotspotKey || state.hotspotSelectedKeys.includes(hotspotKey)) {
    return;
  }
  state.hotspotSelectedKeys = [...state.hotspotSelectedKeys, hotspotKey];
}

function toggleHotspotSelection(hotspotKey) {
  if (!hotspotKey) {
    return;
  }

  if (state.hotspotSelectedKeys.includes(hotspotKey)) {
    state.hotspotSelectedKeys = state.hotspotSelectedKeys.filter((key) => key !== hotspotKey);
    refreshAnalysisViews();
    setStatus("已从多地区对比中移除该地区。");
    return;
  }

  ensureHotspotSelected(hotspotKey);
  refreshAnalysisViews();
  const hotspot = findHotspotByKey(hotspotKey);
  setStatus(`已加入多地区对比：${hotspot?.displayName || hotspot?.name || "目标地区"}。`);
}

function clearHotspotSelection() {
  if (!state.hotspotSelectedKeys.length) {
    return;
  }
  state.hotspotSelectedKeys = [];
  refreshAnalysisViews();
  setStatus("已清空多地区对比选择。");
}

function selectVisibleHotspots() {
  const visibleHotspots = getVisibleHotspots();
  if (!visibleHotspots.length) {
    setStatus("当前热点列表为空，无法批量选择。", "warning");
    return;
  }

  state.hotspotSelectedKeys = visibleHotspots.map((item) => item.key);
  refreshAnalysisViews();
  setStatus(`已将当前列表中的 ${formatNumber(visibleHotspots.length)} 个地区加入对比。`);
}

function buildHotspotAnalysisTarget(hotspot) {
  return {
    label: hotspot.displayName || hotspot.name,
    eventIds: hotspot.eventIds,
    highlightEventIds: sampleEventIds(hotspot.eventIds, 112),
    totalCount: hotspot.count,
    tooltipTitle: hotspot.displayName || hotspot.name,
    tooltipLines: [
      `排名：#${hotspot.displayRank || hotspot.rank}`,
      `层级：${hotspot.scopeLabel}`,
      `事件数量：${formatNumber(hotspot.count)} 条`,
      `平均震级：M${hotspot.avgMag.toFixed(2)}`,
      `最大震级：M${hotspot.maxMag.toFixed(1)}`,
      `平均深度：${hotspot.avgDepth.toFixed(1)} km`,
      `中心坐标：${hotspot.coordinateLabel}`,
    ],
    statusMessage: `已高亮 ${hotspot.displayName || hotspot.name} 的 ${formatNumber(hotspot.count)} 条事件。`,
  };
}

function renderHotspotMetricCells(hotspot) {
  return `
    <div class="hotspot-metric-cell">
      <span>事件数</span>
      <strong><b>${formatNumber(hotspot.count)}</b><small>条</small></strong>
    </div>
    <div class="hotspot-metric-cell">
      <span>均震级</span>
      <strong><b>${hotspot.avgMag.toFixed(2)}</b><small>Mw</small></strong>
    </div>
    <div class="hotspot-metric-cell">
      <span>最大震级</span>
      <strong><b>${hotspot.maxMag.toFixed(1)}</b><small>Mw</small></strong>
    </div>
    <div class="hotspot-metric-cell">
      <span>均深度</span>
      <strong><b>${hotspot.avgDepth.toFixed(1)}</b><small>km</small></strong>
    </div>
    <div class="hotspot-metric-cell">
      <span>样本占比</span>
      <strong><b>${(hotspot.share * 100).toFixed(2)}</b><small>%</small></strong>
    </div>
  `;
}

function renderHotspotRankingMeta(visibleHotspots) {
  if (!dom.hotspotRankingMeta) {
    return;
  }

  const scopeCopy =
    state.activeCountryKey !== "all" && state.activeCountryKey !== UNCLASSIFIED_COUNTRY_KEY
      ? `${getCountryDisplayNameByKey(state.activeCountryKey)} / ${state.hotspots[0]?.scopeLabel || "国内子区域"}`
      : "全球国家/地区";
  const searchCopy = state.hotspotSearchQuery.trim()
    ? `检索词：${state.hotspotSearchQuery.trim()}`
    : `当前列表按${HOTSPOT_COMPARE_METRICS[state.hotspotCompareMetric]?.label || "事件总数"}降序排列`;

  dom.hotspotRankingMeta.innerHTML = `
    <span>完整排名 ${formatNumber(visibleHotspots.length)} 项</span>
    <span>${escapeHtml(scopeCopy)}</span>
    <span>${escapeHtml(searchCopy)}</span>
  `;
}

function renderHotspotSelectionSummary(selectedHotspots) {
  if (!dom.hotspotSelectionSummary || !dom.hotspotSelectionChip || !dom.hotspotScopeChip) {
    return;
  }

  dom.hotspotScopeChip.textContent = getHotspotScopeChipLabel();
  dom.hotspotSelectionChip.textContent = `已选 ${formatNumber(selectedHotspots.length)} 个地区`;

  if (!selectedHotspots.length) {
    dom.hotspotSelectionSummary.classList.add("empty");
    dom.hotspotSelectionSummary.textContent =
      state.activeCountryKey !== "all" && state.activeCountryKey !== UNCLASSIFIED_COUNTRY_KEY
        ? `当前正在浏览 ${getCountryDisplayNameByKey(state.activeCountryKey)}。可在下方榜单中继续勾选多个子区域加入横向对比；若样本缺少子区域字段，系统将自动回退为国家整体统计。`
        : "当前为全球国家/地区完整排行。可从下方榜单中勾选多个地区构建横向对比集合；若需查看国内子区域，请先选择国家或地区。";
    if (dom.hotspotSelectionChipbar) {
      dom.hotspotSelectionChipbar.innerHTML = "";
    }
    return;
  }

  dom.hotspotSelectionSummary.classList.remove("empty");
  const names = selectedHotspots.map((item) => item.displayName || item.name);
  dom.hotspotSelectionSummary.innerHTML = `
    <strong>当前对比地区：</strong>${escapeHtml(names.slice(0, 8).join("、"))}${
      names.length > 8 ? ` 等 ${formatNumber(names.length)} 个地区` : ""
    }
  `;
  if (dom.hotspotSelectionChipbar) {
    dom.hotspotSelectionChipbar.innerHTML = selectedHotspots
      .map(
        (item) => `
          <button
            class="selection-chip"
            type="button"
            data-remove-compare-region="${escapeAttribute(item.key)}"
            title="${escapeAttribute(item.displayName || item.name)}"
          >
            <span>${escapeHtml(truncate(item.displayName || item.name, 16))}</span>
            <i>×</i>
          </button>
        `
      )
      .join("");
  }
}

function renderHotspots() {
  if (!dom.hotspotsList) {
    return;
  }

  const visibleHotspots = getVisibleHotspots();

  renderHotspotWorkbench();

  if (!state.hotspots.length) {
    renderHotspotRankingMeta([]);
    dom.hotspotsList.innerHTML =
      state.activeCountryKey !== "all" && state.activeCountryKey !== UNCLASSIFIED_COUNTRY_KEY
        ? `<div class="empty-copy">已选择 ${escapeHtml(
            getCountryDisplayNameByKey(state.activeCountryKey)
          )}，但当前筛选结果为空，暂无可统计的区域热点。</div>`
        : '<div class="empty-copy">当前筛选结果为空，暂无可统计的热点区域。</div>';
    return;
  }

  if (!visibleHotspots.length) {
    renderHotspotRankingMeta([]);
    dom.hotspotsList.innerHTML =
      '<div class="empty-copy">没有匹配当前检索词的地区。可尝试搜索中文名、英文名或子区域名称。</div>';
    return;
  }

  renderHotspotRankingMeta(visibleHotspots);

  const peak = getMaxNumber(
    visibleHotspots.map((item) => item.count),
    1
  );

  dom.hotspotsList.innerHTML = visibleHotspots
    .map((hotspot) => {
      const analysisKey = registerAnalysisTarget(buildHotspotAnalysisTarget(hotspot));
      const selectedClass = state.hotspotSelectedKeys.includes(hotspot.key) ? " is-selected" : "";
      const displayRank = hotspot.displayRank || hotspot.rank;
      const topClass = displayRank <= 3 ? " is-top" : "";
      const topBadge = displayRank <= 3 ? `<span class="top-badge">TOP ${displayRank}</span>` : "";
      const countryContext =
        hotspot.scopeLabel === "国家级"
          ? "全球国家/地区聚合"
          : `所属国家：${hotspot.countryName}`;

      return `
        <article class="hotspot-rank-item${selectedClass}${topClass}">
          <button
            class="hotspot-rank-main"
            type="button"
            data-hotspot-row="true"
            data-hotspot-key="${escapeAttribute(hotspot.key)}"
            data-analysis-key="${analysisKey}"
          >
            <div class="hotspot-card-header">
              <div class="hotspot-rank-copy">
                <span class="hotspot-rank-index ${displayRank <= 3 ? "top" : ""}">#${displayRank}</span>
                <div class="hotspot-rank-titles">
                  <div class="hotspot-rank-title-row">
                    <strong title="${escapeAttribute(hotspot.displayName)}">${escapeHtml(
                      hotspot.displayName
                    )}</strong>
                  </div>
                  <span class="hotspot-rank-subtitle">${escapeHtml(countryContext)}</span>
                </div>
              </div>
              <div class="hotspot-card-badges">
                ${topBadge}
                <span class="hotspot-scope-badge">${escapeHtml(hotspot.scopeLabel)}</span>
              </div>
            </div>
            <div class="hotspot-card-body">
              <div class="hotspot-metric-grid">
                ${renderHotspotMetricCells(hotspot)}
              </div>
              <div class="hotspot-coordinate-row">
                <span>中心坐标</span>
                <strong>${escapeHtml(hotspot.coordinateLabel)}</strong>
              </div>
            </div>
          </button>
          <div class="hotspot-card-footer">
            <div class="hotspot-rank-track">
              <span class="rank-fill" style="--fill: ${(hotspot.count / peak) * 100}%"></span>
            </div>
            <button
              class="hotspot-select-toggle ${state.hotspotSelectedKeys.includes(hotspot.key) ? "is-active" : ""}"
              type="button"
              data-hotspot-toggle="true"
              data-hotspot-key="${escapeAttribute(hotspot.key)}"
              aria-pressed="${state.hotspotSelectedKeys.includes(hotspot.key) ? "true" : "false"}"
            >
              ${state.hotspotSelectedKeys.includes(hotspot.key) ? "已加入对比" : "加入对比"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function openCompareAnalysisModal(moduleKey) {
  if (!COMPARE_MODULE_META[moduleKey]) {
    return;
  }

  const selectedRegions = getSelectedCompareRegions();
  if (!selectedRegions.length) {
    setStatus("请先在上方地区控制中心选择 1 个或多个地区，再打开中央分析窗口。", "warning");
    return;
  }

  state.compareModalModule = moduleKey;
  state.compareModalOpen = true;
  syncCompareModalState();
  renderCompareAnalysisModal();
  setStatus(
    `已打开${
      selectedRegions.length > 1 ? COMPARE_MODULE_META[moduleKey].label : "当前地区分析窗口"
    }。`
  );
}

function handleOpenCompareTrigger(trigger) {
  const moduleKey = trigger.getAttribute("data-open-compare");
  const metricKey = trigger.getAttribute("data-compare-metric");
  if (metricKey && HOTSPOT_COMPARE_METRICS[metricKey]) {
    state.hotspotCompareMetric = metricKey;
  }
  if (moduleKey) {
    openCompareAnalysisModal(moduleKey);
  }
}

function closeCompareAnalysisModal(options = {}) {
  if (!state.compareModalOpen && dom.compareModal?.hidden !== false) {
    return;
  }

  state.compareModalOpen = false;
  state.compareModalRender = null;
  clearCompareAnalysisTargets();
  syncCompareModalState();
  hideAnalysisTooltip();

  if (!options.silent) {
    setStatus("已关闭中央对比分析窗口。");
  }
}

function clearCompareAnalysisTargets() {
  if (!state.compareAnalysisTargetKeys.length) {
    return;
  }

  state.compareAnalysisTargetKeys.forEach((key) => {
    state.analysisTargets.delete(key);
  });
  state.compareAnalysisTargetKeys = [];
}

function registerCompareAnalysisTarget(payload) {
  const key = registerAnalysisTarget(payload);
  state.compareAnalysisTargetKeys.push(key);
  return key;
}

function getSelectedCompareRegions() {
  return state.hotspotSelectedKeys.map((key) => findHotspotByKey(key)).filter(Boolean);
}

function applyCompareControlValue(controlName, rawValue) {
  let nextValue = rawValue;
  if (rawValue === "true") {
    nextValue = true;
  } else if (rawValue === "false") {
    nextValue = false;
  }

  switch (controlName) {
    case "compareTemporalGranularity":
      state.compareTemporalGranularity = normalizeCompareTimeGranularity(nextValue);
      break;
    case "compareTemporalShowAverage":
      state.compareTemporalShowAverage = Boolean(nextValue);
      break;
    case "compareMagnitudeMode":
      state.compareMagnitudeMode = String(nextValue);
      break;
    case "compareDepthMode":
      state.compareDepthMode = String(nextValue);
      break;
    case "compareEnergyGranularity":
      state.compareEnergyGranularity = normalizeCompareTimeGranularity(nextValue);
      break;
    case "compareEnergyScale":
      state.compareEnergyScale = String(nextValue);
      break;
    case "hotspotCompareMetric":
      state.hotspotCompareMetric = String(nextValue);
      renderHotspots();
      renderHotspotWorkbench();
      break;
    default:
      return;
  }

  renderCompareAnalysisModal();
}

function renderCompareAnalysisModal() {
  syncCompareModalState();
  if (!state.compareModalOpen || !dom.compareModalChart || !dom.compareModalNotes) {
    return;
  }

  clearCompareAnalysisTargets();
  const context = buildCompareRegionContext(state.compareModalModule, { surface: "modal" });
  if (context.allRegions.length < 1) {
    state.compareModalRender = null;
    renderCompareModalShell({
      title: "地区分析窗口",
      subtitle: "当前尚未选择地区，无法生成分析图。",
      summaryItems: [
        { label: "已选地区", value: `${formatNumber(context.allRegions.length)} 个` },
        { label: "所需最小数量", value: "1 个" },
      ],
      controlGroups: buildCompareControlGroups(state.compareModalModule),
      emptyState:
        "<strong>请先选择地区</strong>请先回到上方“地区筛选与多地区对比”模块选择 1 个或多个国家、地区或国内子区域，再打开中央分析窗口。",
      notes: [
        "当前中央分析窗口不会重新请求后端数据，所有比较都严格基于已缓存的本地目录。",
        "若筛选切换导致已选地区失效，窗口会自动回退到空状态，并保持页面其他筛选与地图状态不变。",
      ],
    });
    return;
  }

  const payload = buildCompareModalPayload(state.compareModalModule, context, { surface: "modal" });
  state.compareModalRender = {
    ...payload,
    surface: "modal",
    regionCount: context.allRegions.length,
    panelCount: context.regionPanels.length,
    previewLimited: false,
  };
  renderCompareModalShell(payload);
}

function renderCompareModalShell(payload) {
  const compareMeta = COMPARE_MODULE_META[state.compareModalModule] || null;
  if (dom.compareModalKicker) {
    dom.compareModalKicker.textContent = payload.kicker || compareMeta?.kicker || "ACADEMIC COMPARISON";
  }
  if (dom.compareModalTitle) {
    dom.compareModalTitle.textContent = payload.title || "地区分析窗口";
  }
  if (dom.compareModalSubtitle) {
    dom.compareModalSubtitle.textContent = payload.subtitle || "";
  }
  if (dom.compareModalSummary) {
    dom.compareModalSummary.innerHTML = renderCompareSummaryChips(payload.summaryItems || []);
  }
  if (dom.compareModalControls) {
    dom.compareModalControls.innerHTML = renderCompareControlGroups(payload.controlGroups || []);
  }
  if (dom.compareModalChart) {
    dom.compareModalChart.innerHTML = payload.emptyState
      ? `<div class="compare-modal-empty"><div>${payload.emptyState}</div></div>`
      : `<div class="compare-modal-figure-shell">${payload.figureSvg || ""}</div>`;
  }
  if (dom.compareModalNotes) {
    dom.compareModalNotes.innerHTML = renderCompareNotes(payload.notes || []);
  }
  syncCompareModalState();
}

function renderCompareSummaryChips(summaryItems) {
  if (!summaryItems.length) {
    return "";
  }

  return summaryItems
    .map(
      (item) =>
        `<span class="compare-summary-chip"><span>${escapeHtml(item.label)}</span><b>${escapeHtml(
          item.value
        )}</b></span>`
    )
    .join("");
}

function renderCompareControlGroups(controlGroups) {
  if (!controlGroups.length) {
    return "";
  }

  return controlGroups
    .map((group) => {
      const buttons = (group.options || [])
        .map(
          (option) => `
            <button
              class="metric-toggle ${option.active ? "active" : ""}"
              type="button"
              data-compare-control="${escapeAttribute(group.control)}"
              data-value="${escapeAttribute(String(option.value))}"
            >
              ${escapeHtml(option.label)}
            </button>
          `
        )
        .join("");

      return `
        <div class="compare-control-group">
          <span class="compare-control-label">${escapeHtml(group.label)}</span>
          <div class="compare-control-buttons">${buttons}</div>
        </div>
      `;
    })
    .join("");
}

function renderCompareNotes(notes) {
  return `
    <div class="compare-notes-heading">
      <span>Methods & Notes</span>
      <strong>统计口径与导出说明</strong>
    </div>
    <div class="compare-note-list">
      ${(notes || [])
        .map((note) => `<div class="compare-note-item">${escapeHtml(note)}</div>`)
        .join("")}
    </div>
  `;
}

function getSelectedRegionMode(regionCount) {
  if (regionCount <= 0) {
    return "empty";
  }
  return regionCount === 1 ? "single" : "multi";
}

function buildAnalysisModeMeta(context) {
  const regionCount = context?.allRegions?.length || 0;
  const mode = getSelectedRegionMode(regionCount);
  const primaryRegion =
    context?.visibleRegions?.[0]?.displayName ||
    context?.allRegions?.[0]?.displayName ||
    "当前地区";

  return {
    mode,
    regionCount,
    primaryRegion,
    isEmpty: mode === "empty",
    isSingle: mode === "single",
    isMulti: mode === "multi",
    modeLabel:
      mode === "single" ? "单地区分析模式" : mode === "multi" ? "多地区横向对比模式" : "未选择地区",
    regionSummaryLabel: mode === "single" ? "分析地区" : "参与地区",
    triggerLabel: mode === "multi" ? "在中央窗口查看对比图" : "在中央窗口查看大图",
  };
}

function getFigureSurfaceMeta(surface = "modal") {
  if (surface === "preview") {
    return {
      surface,
      variant: "previewDark",
      compact: true,
      interactive: true,
      noteLimit: 2,
      summaryLimit: 4,
      paddingX: 28,
      paddingTop: 26,
      sectionGap: 14,
      titleGap: 8,
      kickerGap: 8,
      panelGap: 22,
      panelTitleGap: 20,
      bottomPadding: 24,
      legendSideThreshold: 2,
      legendSideWidth: 220,
      legendMinItemWidth: 122,
      legendRowGap: 10,
      legendItemGap: 10,
      summaryMinWidth: 112,
      summaryMaxWidth: 220,
      summaryGap: 10,
      summaryRowGap: 10,
    };
  }
  if (surface === "export") {
    return {
      surface,
      variant: "exportLight",
      compact: false,
      interactive: false,
      noteLimit: 6,
      summaryLimit: 12,
      paddingX: 64,
      paddingTop: 42,
      sectionGap: 24,
      titleGap: 10,
      kickerGap: 10,
      panelGap: 34,
      panelTitleGap: 28,
      bottomPadding: 48,
      legendSideThreshold: 5,
      legendSideWidth: 320,
      legendMinItemWidth: 176,
      legendRowGap: 12,
      legendItemGap: 16,
      summaryMinWidth: 148,
      summaryMaxWidth: 296,
      summaryGap: 14,
      summaryRowGap: 12,
    };
  }
  return {
    surface,
    variant: "modalDark",
    compact: false,
    interactive: true,
    noteLimit: 4,
    summaryLimit: 8,
    paddingX: 56,
    paddingTop: 34,
    sectionGap: 20,
    titleGap: 10,
    kickerGap: 10,
    panelGap: 30,
    panelTitleGap: 24,
    bottomPadding: 38,
    legendSideThreshold: 4,
    legendSideWidth: 300,
    legendMinItemWidth: 164,
    legendRowGap: 12,
    legendItemGap: 14,
    summaryMinWidth: 138,
    summaryMaxWidth: 280,
    summaryGap: 12,
    summaryRowGap: 12,
  };
}

function buildCompareModalPayload(moduleKey, context, options = {}) {
  switch (moduleKey) {
    case "temporal":
      return buildTemporalCompareModal(context, options);
    case "magnitude":
      return buildMagnitudeCompareModal(context, options);
    case "depth":
      return buildDepthCompareModal(context, options);
    case "energy":
      return buildEnergyCompareModal(context, options);
    case "hotspot":
    default:
      return buildHotspotCompareModal(context, options);
  }
}

function buildCompareRegionContext(moduleKey, options = {}) {
  const surface = options.surface || "modal";
  const selectedRegions = getSelectedCompareRegions();
  const allRegions = selectedRegions.map((region, index) => {
    const style = getRegionComparisonStyle(region.key, index);
    const events = region.eventIds.map((eventId) => state.eventById.get(eventId)).filter(Boolean);
    return {
      ...region,
      events,
      compareColor: style.color,
      compareDash: style.dash,
      shortAxisLabel: truncate(region.shortName || region.displayName || region.name, 18),
      sampleWarning: events.length > 0 && events.length < 20,
    };
  });
  const strategy = COMPARE_SURFACE_REGION_STRATEGY[moduleKey] || {};
  let visibleRegions = allRegions;
  let hiddenCount = 0;
  let regionPanels = [];

  if (surface === "preview") {
    const previewLimit = strategy.previewLimit || COMPARE_MODAL_REGION_LIMITS[moduleKey] || 8;
    visibleRegions = allRegions.slice(0, previewLimit);
    hiddenCount = Math.max(0, allRegions.length - visibleRegions.length);
    regionPanels = visibleRegions.length ? [visibleRegions] : [];
  } else {
    const panelSize =
      surface === "export"
        ? strategy.exportPanelSize || strategy.modalPanelSize || allRegions.length || 1
        : strategy.modalPanelSize || allRegions.length || 1;
    regionPanels = chunkCompareRegions(allRegions, panelSize);
  }

  return {
    surface,
    allRegions,
    visibleRegions,
    hiddenCount,
    totalEvents: allRegions.reduce((sum, region) => sum + region.events.length, 0),
    lowSampleRegions: allRegions.filter((region) => region.sampleWarning),
    regionPanels: regionPanels.length ? regionPanels : visibleRegions.length ? [visibleRegions] : [],
    panelCount: regionPanels.length || (visibleRegions.length ? 1 : 0),
    previewLimited: surface === "preview" && hiddenCount > 0,
  };
}

function chunkCompareRegions(regions, panelSize) {
  if (!regions.length) {
    return [];
  }
  const safePanelSize = Math.max(1, panelSize || regions.length);
  const panels = [];
  for (let index = 0; index < regions.length; index += safePanelSize) {
    panels.push(regions.slice(index, index + safePanelSize));
  }
  return panels;
}

function getRegionComparisonStyle(regionKey, index = 0) {
  if (!state.regionColorMap.has(regionKey)) {
    const paletteIndex = state.regionColorMap.size % COMPARE_REGION_PALETTE.length;
    state.regionColorMap.set(regionKey, {
      color: COMPARE_REGION_PALETTE[paletteIndex],
      dash: COMPARE_REGION_DASHES[paletteIndex % COMPARE_REGION_DASHES.length],
    });
  }

  const style = state.regionColorMap.get(regionKey);
  return {
    color: style?.color || COMPARE_REGION_PALETTE[index % COMPARE_REGION_PALETTE.length],
    dash: style?.dash ?? COMPARE_REGION_DASHES[index % COMPARE_REGION_DASHES.length],
  };
}

function buildCompareControlGroups(moduleKey) {
  const temporalGranularity = normalizeCompareTimeGranularity(state.compareTemporalGranularity);
  const energyGranularity = normalizeCompareTimeGranularity(state.compareEnergyGranularity);
  switch (moduleKey) {
    case "temporal":
      return [
        {
          label: "时间粒度",
          control: "compareTemporalGranularity",
          options: buildCompareOptions(temporalGranularity, [
            ["auto", "自动"],
            ["month", "月"],
            ["year", "年"],
          ]),
        },
        {
          label: "移动平均",
          control: "compareTemporalShowAverage",
          options: buildCompareOptions(String(state.compareTemporalShowAverage), [
            ["true", "开启"],
            ["false", "关闭"],
          ]),
        },
      ];
    case "magnitude":
      return [
        {
          label: "比较口径",
          control: "compareMagnitudeMode",
          options: buildCompareOptions(state.compareMagnitudeMode, [
            ["count", "频数"],
            ["share", "频率"],
            ["cumulative", "累计占比"],
          ]),
        },
      ];
    case "depth":
      return [
        {
          label: "统计模式",
          control: "compareDepthMode",
          options: buildCompareOptions(state.compareDepthMode, [
            ["count", "数量堆叠"],
            ["share", "百分比堆叠"],
          ]),
        },
      ];
    case "energy":
      return [
        {
          label: "时间粒度",
          control: "compareEnergyGranularity",
          options: buildCompareOptions(energyGranularity, [
            ["auto", "自动"],
            ["month", "月"],
            ["year", "年"],
          ]),
        },
        {
          label: "能量尺度",
          control: "compareEnergyScale",
          options: buildCompareOptions(state.compareEnergyScale, [
            ["log", "对数"],
            ["linear", "线性"],
          ]),
        },
      ];
    case "hotspot":
      return [
        {
          label: "比较指标",
          control: "hotspotCompareMetric",
          options: buildCompareOptions(state.hotspotCompareMetric, [
            ["count", "事件总数"],
            ["avgMag", "平均震级"],
            ["maxMag", "最大震级"],
            ["avgDepth", "平均深度"],
          ]),
        },
      ];
    default:
      return [];
  }
}

function buildCompareOptions(activeValue, tuples) {
  return tuples.map(([value, label]) => ({
    value,
    label,
    active: String(activeValue) === String(value),
  }));
}

function normalizeCompareTimeGranularity(value, fallback = "auto") {
  const normalized = String(value || fallback).toLowerCase();
  if (normalized === "day" || normalized === "week") {
    return "month";
  }
  return SUPPORTED_COMPARE_TIME_GRANULARITIES.has(normalized) ? normalized : fallback;
}

function buildCompareEmptyPayload(title, context, controlGroups, message) {
  return {
    title,
    subtitle: buildCompareSubtitle(context, "当前筛选范围无法生成有效的多地区横向比较结果。"),
    summaryItems: buildCompareSummaryItems(context, [
      { label: "已选地区", value: `${formatNumber(context.allRegions.length)} 个` },
    ]),
    controlGroups,
    emptyState: `<strong>暂无可比较样本</strong>${escapeHtml(message)}`,
    notes: [
      "中央比较窗口仅复用当前已缓存的数据，不会重新请求后端接口。",
      "请调整左侧时间范围、震级阈值或地区选择后重试。",
    ],
  };
}

function buildCompareSummaryItems(context, extraItems = [], options = {}) {
  const modeMeta = buildAnalysisModeMeta(context);
  const coverageItems =
    options.includeCoverage === false
      ? []
      : [
          {
            label: "图幅策略",
            value: context.previewLimited
              ? `预览 ${formatNumber(context.visibleRegions.length)} / ${formatNumber(context.allRegions.length)}`
              : context.regionPanels.length > 1
                ? `${formatNumber(context.regionPanels.length)} 个 panel / ${formatNumber(context.allRegions.length)} 个地区`
                : `完整显示 ${formatNumber(context.allRegions.length)} 个地区`,
          },
        ];
  return [
    { label: "时间范围", value: state.rangeLabel },
    {
      label: modeMeta.regionSummaryLabel,
      value: modeMeta.isSingle
        ? modeMeta.primaryRegion
        : `${formatNumber(context.allRegions.length)} 个`,
    },
    { label: "当前国家范围", value: getCountryDisplayNameByKey(state.activeCountryKey) },
    ...coverageItems,
    ...extraItems,
  ];
}

function buildCompareSubtitle(context, suffix) {
  const regionCopy = buildCompareFigureRegionCaption(context);
  return `${regionCopy}；${suffix}`;
}

function buildCompareFigureRegionCaption(context) {
  const names = context.allRegions.map((region) => region.displayName);
  if (!names.length) {
    return "未选中地区";
  }
  if (context.regionPanels?.length > 1) {
    return `地区：已选 ${formatNumber(context.allRegions.length)} 个地区，按 ${formatNumber(
      context.regionPanels.length
    )} 个 panel 完整展开`;
  }
  if (names.length <= 4) {
    return `地区：${names.join("、")}`;
  }
  return `地区：${names.slice(0, 4).join("、")} 等，共 ${formatNumber(context.allRegions.length)} 个地区`;
}

function createFigureFrame(width, height, left, right, top, bottom) {
  return {
    left,
    top,
    width: width - left - right,
    height: height - top - bottom,
  };
}

function getAcademicTextMeasurer() {
  if (typeof document === "undefined") {
    return null;
  }
  if (!getAcademicTextMeasurer.canvas) {
    getAcademicTextMeasurer.canvas = document.createElement("canvas");
    getAcademicTextMeasurer.context = getAcademicTextMeasurer.canvas.getContext("2d");
  }
  return getAcademicTextMeasurer.context || null;
}

function measureAcademicText(value, options = {}) {
  const text = String(value || "");
  if (!text) {
    return 0;
  }
  const fontSize = Number(options.fontSize) || 12;
  const fontWeight = options.fontWeight || 400;
  const fontFamily = options.fontFamily || ACADEMIC_FIGURE_FONT_STACK;
  const context2d = getAcademicTextMeasurer();
  if (!context2d) {
    return text.length * fontSize * 0.58;
  }
  context2d.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  return context2d.measureText(text).width;
}

function tokenizeAcademicText(value) {
  return String(value || "").match(/[\u4e00-\u9fff]|[^\s\u4e00-\u9fff]+|\s+/g) || [];
}

function wrapAcademicText(value, maxWidth, options = {}) {
  const text = String(value || "").trim();
  if (!text) {
    return [];
  }
  if (!Number.isFinite(maxWidth) || maxWidth <= 0) {
    return [text];
  }

  const tokens = tokenizeAcademicText(text);
  const lines = [];
  let currentLine = "";

  const pushLine = () => {
    const safeLine = currentLine.trim();
    if (safeLine) {
      lines.push(safeLine);
    }
    currentLine = "";
  };

  const appendToken = (token) => {
    const candidate = `${currentLine}${token}`;
    if (!currentLine || measureAcademicText(candidate, options) <= maxWidth) {
      currentLine = candidate;
      return;
    }

    if (token.trim() && measureAcademicText(token, options) > maxWidth) {
      [...token].forEach((character) => {
        const charCandidate = `${currentLine}${character}`;
        if (currentLine && measureAcademicText(charCandidate, options) > maxWidth) {
          pushLine();
          currentLine = character;
        } else {
          currentLine = charCandidate;
        }
      });
      return;
    }

    pushLine();
    currentLine = token.trim() ? token : "";
  };

  tokens.forEach(appendToken);
  pushLine();
  return lines.length ? lines : [text];
}

function truncateAcademicText(value, maxWidth, options = {}) {
  const text = String(value || "");
  if (!text || !Number.isFinite(maxWidth) || maxWidth <= 0) {
    return text;
  }
  if (measureAcademicText(text, options) <= maxWidth) {
    return text;
  }
  const ellipsis = "...";
  let truncated = text;
  while (truncated.length > 1 && measureAcademicText(`${truncated}${ellipsis}`, options) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}${ellipsis}`;
}

function buildSvgStyle(properties = {}) {
  return Object.entries(properties)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => `${key}:${String(value).replaceAll("\n", " ").trim()}`)
    .join(";");
}

function buildSvgFontStyle(options = {}) {
  return buildSvgStyle({
    fill: options.fill,
    "font-family": options.fontFamily || ACADEMIC_FIGURE_FONT_STACK,
    "font-size": options.fontSize ? `${options.fontSize}px` : null,
    "font-weight": options.fontWeight || null,
    "letter-spacing": options.letterSpacing != null ? `${options.letterSpacing}em` : null,
    "text-transform": options.textTransform || null,
    opacity: options.opacity != null ? options.opacity : null,
  });
}

function measureTextLines(lines, options = {}) {
  const safeLines = Array.isArray(lines) ? lines.filter(Boolean) : [];
  const fontSize = Number(options.fontSize) || 12;
  const lineHeight = options.lineHeight || fontSize * 1.34;
  return {
    width: safeLines.reduce((maxWidth, line) => Math.max(maxWidth, measureAcademicText(line, options)), 0),
    height: safeLines.length ? lineHeight * (safeLines.length - 1) + fontSize : 0,
    lineHeight,
  };
}

function buildSvgTextMarkup(lines, x, y, options = {}) {
  const safeLines = Array.isArray(lines) ? lines.filter(Boolean) : [];
  if (!safeLines.length) {
    return "";
  }
  const fontSize = Number(options.fontSize) || 12;
  const lineHeight = options.lineHeight || fontSize * 1.34;
  const anchor = options.textAnchor || "start";
  const dominantBaseline = options.dominantBaseline || "alphabetic";
  const style = escapeAttribute(buildSvgFontStyle(options));
  const transform = options.transform ? ` transform="${escapeAttribute(options.transform)}"` : "";
  const extraAttributes = options.extraAttributes ? ` ${options.extraAttributes}` : "";
  return `
    <text
      x="${x.toFixed(2)}"
      y="${y.toFixed(2)}"
      text-anchor="${anchor}"
      dominant-baseline="${dominantBaseline}"
      style="${style}"${transform}${extraAttributes}
    >
      ${safeLines
        .map((line, index) => {
          const dy = index === 0 ? 0 : lineHeight;
          return `<tspan x="${x.toFixed(2)}" dy="${dy.toFixed(2)}">${escapeHtml(line)}</tspan>`;
        })
        .join("")}
    </text>
  `;
}

function buildEvenlySpacedIndices(length, maxLabels = 6) {
  if (!length) {
    return [];
  }
  if (length <= maxLabels) {
    return Array.from({ length }, (_, index) => index);
  }

  const indices = new Set([0, length - 1]);
  const step = (length - 1) / (maxLabels - 1);
  for (let index = 1; index < maxLabels - 1; index += 1) {
    indices.add(Math.round(index * step));
  }
  return [...indices].sort((left, right) => left - right);
}

function buildAdaptiveEvenlySpacedIndices(labels, plotWidth, textOptions = {}, maxLabels = 8, minGap = 18) {
  if (!labels?.length) {
    return [];
  }
  const maxLabelWidth = labels.reduce(
    (maxWidth, label) => Math.max(maxWidth, measureAcademicText(label, textOptions)),
    0
  );
  const capacity = Math.max(2, Math.min(maxLabels, Math.floor(plotWidth / Math.max(24, maxLabelWidth + minGap))));
  return buildEvenlySpacedIndices(labels.length, capacity);
}

function buildAcademicGridLines(plotFrame, ticks, minValue, maxValue, options = {}) {
  const formatter = options.tickFormatter || ((tick) => String(tick));
  const theme = options.theme || getAcademicFigureTheme(options.variant || "modalDark");
  const fontOptions = options.fontOptions || {
    fill: theme.subtle,
    fontSize: options.compact ? 10.5 : 12,
    fontWeight: 500,
  };
  return ticks
    .map((tick) => {
      const y = plotFrame.top + plotFrame.height - scaleLinear(tick, minValue, maxValue, 0, plotFrame.height);
      return `
        <line
          x1="${plotFrame.left}"
          y1="${y.toFixed(2)}"
          x2="${(plotFrame.left + plotFrame.width).toFixed(2)}"
          y2="${y.toFixed(2)}"
          stroke="${theme.grid}"
          stroke-width="${options.gridWidth || 1}"
          stroke-dasharray="${options.gridDash || (options.compact ? "3 5" : "4 6")}"
        ></line>
        ${buildSvgTextMarkup([formatter(tick)], plotFrame.left - (options.labelOffset || 12), y + 4, {
          ...fontOptions,
          textAnchor: "end",
        })}
      `;
    })
    .join("");
}

function buildAcademicGridLinesHorizontal(plotFrame, ticks, minValue, maxValue, options = {}) {
  const formatter = options.tickFormatter || ((tick) => String(tick));
  const theme = options.theme || getAcademicFigureTheme(options.variant || "modalDark");
  const fontOptions = options.fontOptions || {
    fill: theme.subtle,
    fontSize: options.compact ? 10.5 : 12,
    fontWeight: 500,
  };
  return ticks
    .map((tick) => {
      const x = plotFrame.left + scaleLinear(tick, minValue, maxValue, 0, plotFrame.width);
      return `
        <line
          x1="${x.toFixed(2)}"
          y1="${plotFrame.top}"
          x2="${x.toFixed(2)}"
          y2="${(plotFrame.top + plotFrame.height).toFixed(2)}"
          stroke="${theme.grid}"
          stroke-width="${options.gridWidth || 1}"
          stroke-dasharray="${options.gridDash || (options.compact ? "3 5" : "4 6")}"
        ></line>
        ${buildSvgTextMarkup([formatter(tick)], x, plotFrame.top + plotFrame.height + (options.labelOffsetY || 28), {
          ...fontOptions,
          textAnchor: "middle",
        })}
      `;
    })
    .join("");
}

function buildAcademicXAxisLine(plotFrame, theme = getAcademicFigureTheme("modalDark")) {
  return `<line x1="${plotFrame.left}" y1="${(plotFrame.top + plotFrame.height).toFixed(2)}" x2="${(
    plotFrame.left + plotFrame.width
  ).toFixed(2)}" y2="${(plotFrame.top + plotFrame.height).toFixed(2)}" stroke="${theme.axis}" stroke-width="1.2"></line>`;
}

function buildAcademicYAxisLine(plotFrame, theme = getAcademicFigureTheme("modalDark")) {
  return `<line x1="${plotFrame.left}" y1="${plotFrame.top}" x2="${plotFrame.left}" y2="${(
    plotFrame.top + plotFrame.height
  ).toFixed(2)}" stroke="${theme.axis}" stroke-width="1.2"></line>`;
}

function renderAcademicFigure({
  layout,
  width,
  height,
  title,
  subtitle,
  summaryItems,
  legendItems,
  notes,
  plotFrame,
  plotMarkup,
  xAxisTitle,
  yAxisTitle,
  panels,
  variant = "modalDark",
  compact = false,
  kicker = "Academic Regional Comparison",
  noteLimit,
  surface = "modal",
}) {
  const panelSpecs =
    panels && panels.length
      ? panels
      : plotFrame
        ? [{ plotFrame, plotMarkup, xAxisTitle, yAxisTitle }]
        : [];
  const resolvedSurface = surface || (variant === "exportLight" ? "export" : compact ? "preview" : "modal");
  const safeLayout =
    layout ||
    createAcademicFigureLayout({
      width,
      surface: resolvedSurface,
      title,
      subtitle,
      summaryItems,
      legendItems,
      notes,
      panelHeights: panelSpecs.map((panel) => Math.max(260, (panel.plotFrame?.height || 240) + 96)),
      kicker,
      noteLimit,
    });
  const theme = safeLayout.theme || getAcademicFigureTheme(variant);
  const surfaceMeta = safeLayout.surfaceMeta || getFigureSurfaceMeta(resolvedSurface);
  const figureWidth = width || safeLayout.width;
  const figureHeight = height || safeLayout.height;
  const axisTitleStyle = {
    fill: theme.text,
    fontSize: surfaceMeta.compact ? 11.5 : 13,
    fontWeight: 600,
  };
  const panelMarkup = panelSpecs
    .map((panel) => {
      const localPlotFrame = panel.plotFrame;
      if (!localPlotFrame) {
        return "";
      }
      const localMarkup = surfaceMeta.interactive
        ? panel.plotMarkup || ""
        : stripAcademicFigureInteractionMarkup(panel.plotMarkup || "");
      const xAxisCaptionY =
        panel.xAxisTitleY || localPlotFrame.top + localPlotFrame.height + (surfaceMeta.compact ? 50 : 74);
      const yAxisCaptionX =
        panel.yAxisTitleX ||
        Math.max(surfaceMeta.compact ? 22 : 30, localPlotFrame.left - (surfaceMeta.compact ? 50 : 72));
      const yAxisCaptionY = panel.yAxisTitleY || localPlotFrame.top + localPlotFrame.height / 2;
      return `
        ${
          panel.panelLabel
            ? buildSvgTextMarkup(
                [panel.panelLabel],
                localPlotFrame.left,
                panel.panelLabelY || localPlotFrame.top - (surfaceMeta.compact ? 14 : 18),
                {
                  fill: theme.muted,
                  fontSize: surfaceMeta.compact ? 10.5 : 12,
                  fontWeight: 600,
                  letterSpacing: 0.04,
                }
              )
            : ""
        }
        <rect
          x="${(panel.panelBackgroundX ?? localPlotFrame.left).toFixed(2)}"
          y="${(panel.panelBackgroundY ?? localPlotFrame.top).toFixed(2)}"
          width="${(panel.panelBackgroundWidth ?? localPlotFrame.width).toFixed(2)}"
          height="${(panel.panelBackgroundHeight ?? localPlotFrame.height).toFixed(2)}"
          rx="${panel.panelRadius || 18}"
          fill="${theme.panel}"
          stroke="${theme.panelStroke}"
          stroke-width="1"
        ></rect>
        ${localMarkup}
        ${
          panel.xAxisTitle
            ? buildSvgTextMarkup(
                [panel.xAxisTitle],
                localPlotFrame.left + localPlotFrame.width / 2,
                xAxisCaptionY,
                {
                  ...axisTitleStyle,
                  textAnchor: "middle",
                }
              )
            : ""
        }
        ${
          panel.yAxisTitle
            ? buildSvgTextMarkup([panel.yAxisTitle], yAxisCaptionX, yAxisCaptionY, {
                ...axisTitleStyle,
                textAnchor: "middle",
                transform: `rotate(-90 ${yAxisCaptionX.toFixed(2)} ${yAxisCaptionY.toFixed(2)})`,
              })
            : ""
        }
      `;
    })
    .join("");

  return `
    <svg
      class="compare-figure-svg"
      xmlns="http://www.w3.org/2000/svg"
      width="${figureWidth}"
      height="${figureHeight}"
      viewBox="0 0 ${figureWidth} ${figureHeight}"
      role="img"
      aria-label="${escapeAttribute(title)}"
      shape-rendering="geometricPrecision"
    >
      <rect x="0" y="0" width="${figureWidth}" height="${figureHeight}" rx="${surfaceMeta.compact ? 20 : 24}" fill="${
        theme.background
      }"></rect>
      ${
        safeLayout.header?.kicker
          ? buildSvgTextMarkup(
              safeLayout.header.kicker.lines,
              safeLayout.header.kicker.x,
              safeLayout.header.kicker.y,
              safeLayout.header.kicker.style
            )
          : ""
      }
      ${
        safeLayout.header?.title
          ? buildSvgTextMarkup(
              safeLayout.header.title.lines,
              safeLayout.header.title.x,
              safeLayout.header.title.y,
              safeLayout.header.title.style
            )
          : ""
      }
      ${
        safeLayout.header?.subtitle
          ? buildSvgTextMarkup(
              safeLayout.header.subtitle.lines,
              safeLayout.header.subtitle.x,
              safeLayout.header.subtitle.y,
              safeLayout.header.subtitle.style
            )
          : ""
      }
      ${safeLayout.summaryBlock?.markup || ""}
      ${safeLayout.legendBlock?.markup || ""}
      ${panelMarkup}
      ${safeLayout.notesBlock?.markup || ""}
    </svg>
  `;
}

function getAcademicFigureTheme(variant = "modalDark") {
  if (variant === "exportLight") {
    return {
      background: "#ffffff",
      panel: "#f8fafc",
      panelStroke: "#d5dfeb",
      summaryFill: "#ffffff",
      summaryStroke: "#d5dfeb",
      text: "#0f172a",
      subtle: "#405062",
      muted: "#64748b",
      axis: "#8ca0b6",
      grid: "#d8e2ec",
      note: "#556678",
    };
  }

  if (variant === "previewDark") {
    return {
      background: "#07111c",
      panel: "#0b1623",
      panelStroke: "#173246",
      summaryFill: "#0d1c2b",
      summaryStroke: "#214661",
      text: "#edf6ff",
      subtle: "#b7c8d9",
      muted: "#79a4bf",
      axis: "#3b556b",
      grid: "#173246",
      note: "#9ab0c4",
    };
  }

  return {
    background: "#07111c",
    panel: "#0b1724",
    panelStroke: "#1b3448",
    summaryFill: "#102032",
    summaryStroke: "#244764",
    text: "#edf6ff",
    subtle: "#b9c8d8",
    muted: "#7ea3ba",
    axis: "#47637c",
    grid: "#173246",
    note: "#9ab0c4",
  };
}

function buildAcademicSummaryMarkup(summaryItems, bounds, options = {}) {
  const items = (summaryItems || []).slice(0, options.limit || summaryItems?.length || 0);
  if (!items.length) {
    return { markup: "", height: 0, items: [] };
  }

  const safeBounds =
    typeof bounds === "number"
      ? { x: 56, y: options.compact ? 92 : 126, width: Math.max(120, bounds - 112) }
      : bounds;
  const theme = options.theme || getAcademicFigureTheme(options.variant || "modalDark");
  const surfaceMeta = options.surfaceMeta || getFigureSurfaceMeta(options.surface || "modal");
  const labelOptions = {
    fill: theme.muted,
    fontSize: options.compact ? 10.5 : 11.5,
    fontWeight: 600,
    letterSpacing: 0.04,
  };
  const valueOptions = {
    fill: theme.text,
    fontSize: options.compact ? 11.5 : 13.5,
    fontWeight: 700,
  };
  const paddingX = options.compact ? 12 : 14;
  const paddingY = options.compact ? 10 : 12;
  const maxPillWidth = Math.max(
    surfaceMeta.summaryMinWidth,
    Math.min(surfaceMeta.summaryMaxWidth, Math.max(surfaceMeta.summaryMinWidth, safeBounds.width * 0.46))
  );
  const labelLineHeight = labelOptions.fontSize * 1.22;
  const valueLineHeight = valueOptions.fontSize * 1.22;
  let cursorX = safeBounds.x;
  let cursorY = safeBounds.y;
  let rowHeight = 0;
  const rowMaxX = safeBounds.x + safeBounds.width;
  const rendered = [];

  items.forEach((item) => {
    const labelLines = wrapAcademicText(item.label, maxPillWidth - paddingX * 2, labelOptions).slice(0, 2);
    const valueLines = wrapAcademicText(item.value, maxPillWidth - paddingX * 2, valueOptions).slice(
      0,
      options.compact ? 2 : 3
    );
    const labelMetrics = measureTextLines(labelLines, { ...labelOptions, lineHeight: labelLineHeight });
    const valueMetrics = measureTextLines(valueLines, { ...valueOptions, lineHeight: valueLineHeight });
    const pillWidth = Math.max(
      surfaceMeta.summaryMinWidth,
      Math.min(maxPillWidth, Math.ceil(Math.max(labelMetrics.width, valueMetrics.width) + paddingX * 2))
    );
    const pillHeight = Math.ceil(paddingY * 2 + labelMetrics.height + valueMetrics.height + 4);

    if (cursorX !== safeBounds.x && cursorX + pillWidth > rowMaxX) {
      cursorX = safeBounds.x;
      cursorY += rowHeight + surfaceMeta.summaryRowGap;
      rowHeight = 0;
    }

    rendered.push(`
      <g transform="translate(${cursorX.toFixed(2)}, ${cursorY.toFixed(2)})">
        <rect
          x="0"
          y="0"
          width="${pillWidth}"
          height="${pillHeight}"
          rx="${options.compact ? 14 : 16}"
          fill="${theme.summaryFill}"
          stroke="${theme.summaryStroke || theme.panelStroke}"
          stroke-width="1"
        ></rect>
        ${buildSvgTextMarkup(labelLines, paddingX, paddingY + labelOptions.fontSize, labelOptions)}
        ${buildSvgTextMarkup(valueLines, paddingX, paddingY + labelMetrics.height + 4 + valueOptions.fontSize, valueOptions)}
      </g>
    `);
    cursorX += pillWidth + surfaceMeta.summaryGap;
    rowHeight = Math.max(rowHeight, pillHeight);
  });

  return {
    markup: rendered.join(""),
    height: rowHeight ? cursorY - safeBounds.y + rowHeight : 0,
    items,
  };
}

function buildAcademicLegendMarkup(legendItems, bounds, options = {}) {
  const items = legendItems || [];
  if (!items.length) {
    return { markup: "", height: 0, items: [] };
  }

  const safeBounds =
    typeof bounds === "number"
      ? { x: 56, y: options.compact ? 92 : 126, width: Math.max(180, bounds - 112) }
      : bounds;
  const theme = options.theme || getAcademicFigureTheme(options.variant || "modalDark");
  const surfaceMeta = options.surfaceMeta || getFigureSurfaceMeta(options.surface || "modal");
  const labelOptions = {
    fill: theme.subtle,
    fontSize: options.compact ? 10.5 : 12,
    fontWeight: 500,
  };
  const swatchWidth = options.compact ? 28 : 30;
  const labelGap = 10;
  const itemMinWidth = options.itemMinWidth || surfaceMeta.legendMinItemWidth;
  const maxColumns = Math.max(1, Math.min(items.length, Math.floor(safeBounds.width / itemMinWidth)));
  let columns = maxColumns;
  let rows = Math.ceil(items.length / columns);
  const maxRows = options.maxRows || Math.max(2, Math.ceil(items.length / maxColumns));
  while (rows > maxRows && columns < items.length) {
    columns += 1;
    rows = Math.ceil(items.length / columns);
  }
  const itemWidth = safeBounds.width / Math.max(1, columns);
  const lineHeight = labelOptions.fontSize * 1.3;
  const rowHeights = [];
  const measurements = items.map((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = safeBounds.x + column * itemWidth;
    const labelWidth = Math.max(80, itemWidth - swatchWidth - labelGap - 10);
    const labelLines = wrapAcademicText(item.label, labelWidth, labelOptions).slice(0, options.compact ? 1 : 2);
    const labelMetrics = measureTextLines(labelLines, { ...labelOptions, lineHeight });
    rowHeights[row] = Math.max(rowHeights[row] || 0, Math.max(options.compact ? 20 : 24, labelMetrics.height));
    return {
      item,
      column,
      row,
      x,
      labelLines,
      labelMetrics,
    };
  });
  const rowOffsets = [];
  let rowCursor = safeBounds.y;
  rowHeights.forEach((rowHeight, rowIndex) => {
    rowOffsets[rowIndex] = rowCursor;
    rowCursor += rowHeight + (rowIndex < rowHeights.length - 1 ? surfaceMeta.legendRowGap : 0);
  });
  const rendered = measurements.map(({ item, x, row, labelLines }) => {
    const y = rowOffsets[row];
    const swatchY = y + Math.max(10, labelOptions.fontSize * 0.6);
    const swatch =
      item.type === "line"
        ? `<line
            x1="${x.toFixed(2)}"
            y1="${swatchY.toFixed(2)}"
            x2="${(x + swatchWidth).toFixed(2)}"
            y2="${swatchY.toFixed(2)}"
            stroke="${escapeAttribute(item.color)}"
            stroke-width="${options.compact ? 2.6 : 3}"
            stroke-linecap="round"
            stroke-dasharray="${escapeAttribute(item.dash || "")}"
          ></line>`
        : item.type === "point"
          ? `<circle cx="${(x + swatchWidth / 2).toFixed(2)}" cy="${swatchY.toFixed(2)}" r="${
              options.compact ? "4" : "4.5"
            }" fill="${escapeAttribute(item.color)}"></circle>`
          : `<rect
              x="${x.toFixed(2)}"
              y="${(swatchY - 6).toFixed(2)}"
              width="${swatchWidth}"
              height="${options.compact ? 10 : 12}"
              rx="4"
              fill="${escapeAttribute(item.color)}"
            ></rect>`;
    return `
      <g>
        ${swatch}
        ${buildSvgTextMarkup(labelLines, x + swatchWidth + labelGap, y + labelOptions.fontSize, labelOptions)}
      </g>
    `;
  });

  const totalHeight =
    rowHeights.reduce((sum, itemHeight) => sum + itemHeight, 0) +
    Math.max(0, rowHeights.length - 1) * surfaceMeta.legendRowGap;
  return {
    markup: rendered.join(""),
    height: totalHeight,
    items,
  };
}

function buildAcademicNotesMarkup(notes, bounds, options = {}) {
  const visibleNotes = (notes || []).slice(0, options.limit || notes?.length || 0);
  if (!visibleNotes.length) {
    return { markup: "", height: 0, notes: [] };
  }

  const safeBounds =
    typeof bounds === "number"
      ? { x: 56, y: 0, width: Math.max(240, bounds - 112) }
      : bounds;
  const theme = options.theme || getAcademicFigureTheme(options.variant || "modalDark");
  const noteOptions = {
    fill: theme.note,
    fontSize: options.compact ? 10.5 : 12,
    fontWeight: 400,
  };
  const lineHeight = noteOptions.fontSize * 1.42;
  let cursorY = safeBounds.y;
  const rendered = [];

  visibleNotes.forEach((note) => {
    const lines = wrapAcademicText(note, safeBounds.width, noteOptions);
    const metrics = measureTextLines(lines, { ...noteOptions, lineHeight });
    rendered.push(buildSvgTextMarkup(lines, safeBounds.x, cursorY + noteOptions.fontSize, { ...noteOptions, lineHeight }));
    cursorY += metrics.height + (options.compact ? 8 : 12);
  });

  return {
    markup: rendered.join(""),
    height: cursorY - safeBounds.y - (options.compact ? 8 : 12),
    notes: visibleNotes,
  };
}

function createAcademicFigureLayout({
  width,
  surface = "modal",
  title,
  subtitle,
  summaryItems,
  legendItems,
  notes,
  panelHeights = [],
  kicker = "Academic Regional Comparison",
  noteLimit,
}) {
  const surfaceMeta = getFigureSurfaceMeta(surface);
  const theme = getAcademicFigureTheme(surfaceMeta.variant);
  const contentX = surfaceMeta.paddingX;
  const contentWidth = width - surfaceMeta.paddingX * 2;
  const kickerStyle = {
    fill: theme.muted,
    fontSize: surfaceMeta.compact ? 10 : 11.5,
    fontWeight: 700,
    letterSpacing: 0.16,
    textTransform: "uppercase",
  };
  const titleStyle = {
    fill: theme.text,
    fontSize: surfaceMeta.compact ? 20 : 32,
    fontWeight: 700,
    lineHeight: surfaceMeta.compact ? 24 : 36,
  };
  const subtitleStyle = {
    fill: theme.subtle,
    fontSize: surfaceMeta.compact ? 12 : 15,
    fontWeight: 400,
    lineHeight: surfaceMeta.compact ? 15 : 20,
  };
  const legendSideEligible =
    !surfaceMeta.compact &&
    (legendItems?.length || 0) > 0 &&
    (legendItems?.length || 0) <= surfaceMeta.legendSideThreshold;
  const legendSideWidth = legendSideEligible
    ? Math.min(surfaceMeta.legendSideWidth, Math.max(220, contentWidth * 0.28))
    : 0;
  const titleWidth = contentWidth - (legendSideEligible ? legendSideWidth + surfaceMeta.sectionGap : 0);
  const titleLines = wrapAcademicText(title, titleWidth, titleStyle);
  const subtitleLines = wrapAcademicText(subtitle, titleWidth, subtitleStyle);
  const header = {};
  let cursorY = surfaceMeta.paddingTop;

  if (kicker) {
    header.kicker = {
      x: contentX,
      y: cursorY + kickerStyle.fontSize,
      lines: [kicker],
      style: kickerStyle,
    };
    cursorY += kickerStyle.fontSize + surfaceMeta.kickerGap;
  }

  header.title = {
    x: contentX,
    y: cursorY + titleStyle.fontSize,
    lines: titleLines,
    style: titleStyle,
  };
  cursorY += measureTextLines(titleLines, titleStyle).height;

  if (subtitleLines.length) {
    cursorY += surfaceMeta.titleGap;
    header.subtitle = {
      x: contentX,
      y: cursorY + subtitleStyle.fontSize,
      lines: subtitleLines,
      style: subtitleStyle,
    };
    cursorY += measureTextLines(subtitleLines, subtitleStyle).height;
  }

  let topCursor = cursorY;
  let summaryBlock = { markup: "", height: 0 };
  let legendBlock = { markup: "", height: 0 };

  if (legendSideEligible) {
    legendBlock = buildAcademicLegendMarkup(
      legendItems,
      {
        x: width - contentX - legendSideWidth,
        y: surfaceMeta.paddingTop + 2,
        width: legendSideWidth,
      },
      {
        surface,
        surfaceMeta,
        compact: surfaceMeta.compact,
        theme,
        maxRows: Math.max(3, legendItems.length),
      }
    );
    topCursor = Math.max(topCursor, surfaceMeta.paddingTop + 2 + legendBlock.height);
  }

  if (summaryItems?.length) {
    summaryBlock = buildAcademicSummaryMarkup(
      summaryItems,
      {
        x: contentX,
        y: topCursor + surfaceMeta.sectionGap,
        width: contentWidth,
      },
      {
        surface,
        surfaceMeta,
        compact: surfaceMeta.compact,
        theme,
        limit: surfaceMeta.summaryLimit,
      }
    );
    topCursor = topCursor + surfaceMeta.sectionGap + summaryBlock.height;
  }

  if (legendItems?.length && !legendSideEligible) {
    legendBlock = buildAcademicLegendMarkup(
      legendItems,
      {
        x: contentX,
        y: topCursor + surfaceMeta.sectionGap,
        width: contentWidth,
      },
      {
        surface,
        surfaceMeta,
        compact: surfaceMeta.compact,
        theme,
        maxRows: surfaceMeta.compact ? 2 : 3,
      }
    );
    topCursor = topCursor + surfaceMeta.sectionGap + legendBlock.height;
  }

  const panelSlots = [];
  let panelCursor = topCursor + surfaceMeta.sectionGap;
  panelHeights.forEach((panelHeight) => {
    panelSlots.push({
      top: panelCursor,
      height: panelHeight,
      plotTop: panelCursor + (panelHeights.length > 1 ? surfaceMeta.panelTitleGap : 0),
      plotHeight: panelHeight - (panelHeights.length > 1 ? surfaceMeta.panelTitleGap : 0),
    });
    panelCursor += panelHeight + surfaceMeta.panelGap;
  });

  const notesMeasured = buildAcademicNotesMarkup(
    notes,
    { x: contentX, y: 0, width: contentWidth },
    {
      surface,
      surfaceMeta,
      compact: surfaceMeta.compact,
      theme,
      limit: noteLimit ?? surfaceMeta.noteLimit,
    }
  );
  const figureHeight = Math.ceil(
    panelCursor -
      (panelSlots.length ? surfaceMeta.panelGap : 0) +
      (notesMeasured.height ? surfaceMeta.sectionGap : 0) +
      notesMeasured.height +
      surfaceMeta.bottomPadding
  );
  const notesBlock = buildAcademicNotesMarkup(
    notes,
    {
      x: contentX,
      y: figureHeight - surfaceMeta.bottomPadding - notesMeasured.height,
      width: contentWidth,
    },
    {
      surface,
      surfaceMeta,
      compact: surfaceMeta.compact,
      theme,
      limit: noteLimit ?? surfaceMeta.noteLimit,
    }
  );

  return {
    width,
    height: figureHeight,
    surface,
    surfaceMeta,
    theme,
    header,
    summaryBlock,
    legendBlock,
    notesBlock,
    panelSlots,
    contentX,
    contentWidth,
  };
}

function stripAcademicFigureInteractionMarkup(markup) {
  return String(markup || "")
    .replace(/<rect\b[^>]*class="chart-hitbox"[^>]*>\s*<\/rect>/g, "")
    .replace(/\sdata-analysis-key="[^"]*"/g, "");
}

function buildCompareCoverageNotes(context, surface) {
  if (surface === "preview" && context.previewLimited) {
    return [
      `当前页面预览为交互优化，仅展示 ${formatNumber(context.visibleRegions.length)} / ${formatNumber(
        context.allRegions.length
      )} 个地区；中央弹窗与导出图将保留全部已选地区。`,
    ];
  }
  if (context.regionPanels.length > 1) {
    return [
      `为保证标题、图例与坐标标签可读，当前图已按完整选区拆分为 ${formatNumber(
        context.regionPanels.length
      )} 个 panel，未静默删减任何已选地区。`,
    ];
  }
  return ["当前所有已选地区均已纳入本图与导出结果。"];
}

function buildRegionPanelLabel(regions, panelIndex, panelCount) {
  if (panelCount <= 1) {
    return "";
  }
  const names = regions.map((region) => region.displayName);
  const nameCopy =
    names.length <= 3
      ? names.join("、")
      : `${names.slice(0, 3).join("、")} 等 ${formatNumber(names.length)} 个地区`;
  return `分面 ${panelIndex + 1} / ${panelCount} · ${nameCopy}`;
}

function measureWrappedLabelWidth(labels, maxWidth, textOptions, maxLines = 2) {
  return labels.reduce((maxWidthValue, label) => {
    const lines = wrapAcademicText(label, maxWidth, textOptions).slice(0, maxLines);
    return Math.max(maxWidthValue, measureTextLines(lines, textOptions).width);
  }, 0);
}

function buildWrappedAxisLabelMarkup(label, x, y, maxWidth, textOptions, options = {}) {
  const lines = wrapAcademicText(label, maxWidth, textOptions).slice(0, options.maxLines || 2);
  return buildSvgTextMarkup(lines, x, y, {
    ...textOptions,
    textAnchor: options.textAnchor || "middle",
  });
}

function createPanelPlotFrame(width, slot, left, right, topInset, bottomInset) {
  return {
    left,
    top: slot.plotTop + topInset,
    width: width - left - right,
    height: slot.plotHeight - topInset - bottomInset,
  };
}

function buildTemporalCompareModal(context, options = {}) {
  const surface = options.surface || "modal";
  const modeMeta = buildAnalysisModeMeta(context);
  const granularity = normalizeCompareTimeGranularity(state.compareTemporalGranularity);
  const buckets = buildTemporalAnalysis(
    context.allRegions[0]?.events || [],
    state.rangeStart,
    state.rangeEnd,
    { granularity }
  ).buckets;
  if (!buckets.length) {
    return buildCompareEmptyPayload(
      modeMeta.isSingle ? "地区时间趋势分析" : "多地区时间序列对比",
      context,
      buildCompareControlGroups("temporal"),
      "当前筛选范围内没有可用于构建时间序列对比的样本。"
    );
  }

  const renderSurfaceFigure = (surfaceContext, targetSurface) => {
    const surfaceMeta = getFigureSurfaceMeta(targetSurface);
    const width = targetSurface === "preview" ? 640 : targetSurface === "export" ? 1480 : 1320;
    const legendItems =
      modeMeta.isSingle && targetSurface === "preview"
        ? []
        : surfaceContext.allRegions.map((region) => ({
            label: region.displayName,
            color: region.compareColor,
            dash: region.compareDash,
            type: "line",
          }));
    const panelHeights = surfaceContext.regionPanels.map(() => (targetSurface === "preview" ? 250 : 318));
    const summaryItems = buildCompareSummaryItems(surfaceContext, [
      {
        label: "时间粒度",
        value: buildTemporalGranularityLabel(granularity, state.rangeEnd - state.rangeStart),
      },
      { label: "总样本量", value: `${formatNumber(surfaceContext.totalEvents)} 条` },
      { label: "移动平均", value: state.compareTemporalShowAverage ? "已开启" : "未开启" },
    ]);
    const notes = [
      `横轴表示时间，纵轴表示事件数量；当前分析时间范围为 ${formatDateRange(state.rangeStart, state.rangeEnd)}。`,
      ...buildCompareCoverageNotes(surfaceContext, targetSurface),
      state.compareTemporalShowAverage
        ? `已叠加 ${buildTemporalAnalysis(
            surfaceContext.allRegions[0]?.events || [],
            state.rangeStart,
            state.rangeEnd,
            { granularity }
          ).movingAverageWindow} 箱移动平均曲线；虚线仅用于平滑波动，不改变原始计数口径。`
        : "当前图仅显示原始时间序列频次，不叠加平滑曲线。",
      surfaceContext.lowSampleRegions.length
        ? `以下地区样本较少（<20 条）：${surfaceContext.lowSampleRegions.map((region) => region.displayName).join("、")}。短期波动应谨慎解读。`
        : "当前各地区样本量足以支撑基本的时序比较。",
    ];
    const chartTitle = modeMeta.isSingle ? `${modeMeta.primaryRegion} 时间趋势分析` : "多地区地震活动时间序列对比";
    const chartSubtitle = modeMeta.isSingle
      ? `${modeMeta.primaryRegion} · 时间范围 ${formatDateRange(state.rangeStart, state.rangeEnd)}`
      : `${buildCompareFigureRegionCaption(surfaceContext)} · 时间范围 ${formatDateRange(state.rangeStart, state.rangeEnd)}`;
    const layout = createAcademicFigureLayout({
      width,
      surface: targetSurface,
      title: chartTitle,
      subtitle: chartSubtitle,
      summaryItems,
      legendItems,
      notes,
      panelHeights,
      kicker: modeMeta.isSingle ? "Regional Analysis" : "Academic Regional Comparison",
      noteLimit: surfaceMeta.noteLimit,
    });
    const theme = layout.theme;
    const axisLabelOptions = {
      fill: theme.subtle,
      fontSize: surfaceMeta.compact ? 10.5 : 12,
      fontWeight: 500,
    };
    const panels = [];
    const dataRows = [];

    surfaceContext.regionPanels.forEach((regionGroup, panelIndex) => {
      const analyses = regionGroup.map((region) => ({
        region,
        analysis: buildTemporalAnalysis(region.events, state.rangeStart, state.rangeEnd, {
          granularity,
        }),
      }));
      const panelBuckets = analyses[0]?.analysis?.buckets || [];
      const slot = layout.panelSlots[panelIndex];
      const yMax = Math.max(
        1,
        ...analyses.flatMap(({ analysis }) =>
          state.compareTemporalShowAverage
            ? analysis.buckets.map((bucket) => Math.max(bucket.count, bucket.movingAverage))
            : analysis.buckets.map((bucket) => bucket.count)
        )
      );
      const yTicks = buildValueTicks(yMax, 5, 0);
      const yTickLabels = yTicks.map((tick) => formatNumber(Math.round(tick)));
      const leftInset = Math.max(
        targetSurface === "preview" ? 66 : 92,
        28 + Math.ceil(Math.max(...yTickLabels.map((label) => measureAcademicText(label, axisLabelOptions))))
      );
      const rightInset = targetSurface === "preview" ? 20 : 30;
      const bottomInset = targetSurface === "preview" ? 56 : 78;
      const plotFrame = createPanelPlotFrame(width, slot, leftInset, rightInset, 12, bottomInset);
      const xLabels = panelBuckets.map((bucket) => bucket.shortLabel);
      const xIndices = buildAdaptiveEvenlySpacedIndices(
        xLabels,
        plotFrame.width,
        axisLabelOptions,
        targetSurface === "preview" ? 4 : 7,
        18
      );
      const plotPieces = [
        buildAcademicGridLines(plotFrame, yTicks, 0, yMax, {
          theme,
          compact: surfaceMeta.compact,
          tickFormatter: (tick) => formatNumber(Math.round(tick)),
          fontOptions: axisLabelOptions,
        }),
        buildAcademicXAxisLine(plotFrame, theme),
        buildAcademicYAxisLine(plotFrame, theme),
      ];

      analyses.forEach(({ region, analysis }) => {
        const countPoints = [];
        const averagePoints = [];
        analysis.buckets.forEach((bucket, index) => {
          const x = plotFrame.left + scaleLinear(index, 0, Math.max(1, analysis.buckets.length - 1), 0, plotFrame.width);
          const countY = plotFrame.top + plotFrame.height - scaleLinear(bucket.count, 0, yMax, 0, plotFrame.height);
          const averageY =
            plotFrame.top + plotFrame.height - scaleLinear(bucket.movingAverage, 0, yMax, 0, plotFrame.height);
          countPoints.push([x, countY]);
          averagePoints.push([x, averageY]);

          const analysisKey = registerCompareAnalysisTarget({
            label: `${region.displayName} · ${bucket.shortLabel}`,
            eventIds: bucket.eventIds,
            highlightEventIds: sampleEventIds(bucket.eventIds),
            totalCount: bucket.count,
            tooltipTitle: `${region.displayName} · ${bucket.label}`,
            tooltipLines: [
              `事件数量：${formatNumber(bucket.count)} 条`,
              `移动平均：${bucket.movingAverage.toFixed(1)} 条 / 箱`,
              `平均震级：${bucket.count ? bucket.meanMagnitude.toFixed(2) : "--"}`,
              `估算能量：${formatEnergyValue(bucket.energy)}`,
            ],
            statusMessage: `已高亮 ${region.displayName} 在 ${bucket.label} 内的 ${formatNumber(bucket.count)} 条事件。`,
          });

          dataRows.push({
            region: region.displayName,
            time_bucket: bucket.label,
            granularity: analysis.granularityLabel,
            event_count: bucket.count,
            moving_average: Number(bucket.movingAverage.toFixed(4)),
            mean_magnitude: Number(bucket.meanMagnitude.toFixed(4)),
            max_magnitude: Number(bucket.maxMagnitude.toFixed(4)),
            estimated_energy_j: Number(bucket.energy.toFixed(2)),
          });

          if (
            index % Math.max(1, Math.ceil(analysis.buckets.length / (targetSurface === "preview" ? 10 : 16))) === 0 ||
            index === analysis.buckets.length - 1
          ) {
            plotPieces.push(`
              <circle
                data-analysis-key="${analysisKey}"
                cx="${x.toFixed(2)}"
                cy="${countY.toFixed(2)}"
                r="${targetSurface === "preview" ? "3.2" : "4.2"}"
                fill="${escapeAttribute(region.compareColor)}"
                stroke="${targetSurface === "export" ? "#ffffff" : "#e2efff"}"
                stroke-width="1.2"
              ></circle>
            `);
          }
        });

        plotPieces.push(
          `<path d="${buildLinePath(countPoints)}" fill="none" stroke="${escapeAttribute(
            region.compareColor
          )}" stroke-width="${targetSurface === "preview" ? "2.4" : "3.1"}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${escapeAttribute(
            region.compareDash || ""
          )}"></path>`
        );
        if (state.compareTemporalShowAverage) {
          plotPieces.push(
            `<path d="${buildLinePath(averagePoints)}" fill="none" stroke="${escapeAttribute(
              region.compareColor
            )}" stroke-width="${targetSurface === "preview" ? "1.4" : "1.9"}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 4" opacity="0.48"></path>`
          );
        }
      });

      xIndices.forEach((index) => {
        const x = plotFrame.left + scaleLinear(index, 0, Math.max(1, panelBuckets.length - 1), 0, plotFrame.width);
        plotPieces.push(
          buildSvgTextMarkup([panelBuckets[index].shortLabel], x, plotFrame.top + plotFrame.height + 28, {
            ...axisLabelOptions,
            textAnchor: "middle",
          })
        );
      });

      panels.push({
        panelLabel: buildRegionPanelLabel(regionGroup, panelIndex, surfaceContext.regionPanels.length),
        plotFrame,
        plotMarkup: plotPieces.join(""),
        xAxisTitle: "时间",
        yAxisTitle: "事件数量",
      });
    });

    return {
      chartTitle,
      chartSubtitle,
      summaryItems,
      notes,
      figureWidth: width,
      figureHeight: layout.height,
      figureSvg: renderAcademicFigure({
        layout,
        width,
        height: layout.height,
        title: chartTitle,
        subtitle: chartSubtitle,
        summaryItems,
        legendItems,
        notes,
        panels,
        surface: targetSurface,
        kicker: modeMeta.isSingle ? "Regional Analysis" : "Academic Regional Comparison",
        noteLimit: surfaceMeta.noteLimit,
      }),
      dataRows,
    };
  };

  const chartTitle = modeMeta.isSingle ? `${modeMeta.primaryRegion} 时间趋势分析` : "多地区地震活动时间序列对比";
  const currentSurfaceFigure = renderSurfaceFigure(context, surface);
  const exportSurfaceFigure =
    surface === "modal" ? renderSurfaceFigure(buildCompareRegionContext("temporal", { surface: "export" }), "export") : null;

  return {
    title: chartTitle,
    subtitle: modeMeta.isSingle
      ? `${modeMeta.primaryRegion} 当前地区分析，展示其在统一时间轴下的事件频次变化。`
      : buildCompareSubtitle(context, "比较当前已选地区在统一时间轴下的事件频次变化。"),
    summaryItems: currentSurfaceFigure.summaryItems,
    controlGroups: buildCompareControlGroups("temporal"),
    notes: currentSurfaceFigure.notes,
    previewNoteLimit: getFigureSurfaceMeta(surface).noteLimit,
    figureWidth: currentSurfaceFigure.figureWidth,
    figureHeight: currentSurfaceFigure.figureHeight,
    figureSvg: currentSurfaceFigure.figureSvg,
    exportFigureSvg: exportSurfaceFigure?.figureSvg || null,
    exportFigureWidth: exportSurfaceFigure?.figureWidth || null,
    exportFigureHeight: exportSurfaceFigure?.figureHeight || null,
    dataRows: currentSurfaceFigure.dataRows,
    exportSuffix: `${granularity}-${state.compareTemporalShowAverage ? "moving-average" : "raw"}`,
  };
}

function buildMagnitudeCompareModal(context, options = {}) {
  const surface = options.surface || "modal";
  const modeMeta = buildAnalysisModeMeta(context);
  const binSize = 0.5;
  const allMagnitudes = context.allRegions.flatMap((region) => region.events.map((event) => event.mag));
  const minMagnitude = Math.max(
    PROJECT_MIN_MAGNITUDE,
    Math.floor(getMinNumber(allMagnitudes, PROJECT_MIN_MAGNITUDE) * 2) / 2
  );
  const maxMagnitude = Math.max(
    minMagnitude + 1.5,
    Math.ceil(getMaxNumber(allMagnitudes, PROJECT_MIN_MAGNITUDE) * 2) / 2
  );
  const distributions = context.allRegions.map((region) => ({
    region,
    distribution: buildMagnitudeDistribution(region.events, {
      minMagnitude,
      maxMagnitude,
      binSize,
    }),
  }));
  const bins = distributions[0]?.distribution?.bins || [];
  if (!bins.length) {
    return buildCompareEmptyPayload(
      modeMeta.isSingle ? "地区震级分布分析" : "多地区震级分布对比",
      context,
      buildCompareControlGroups("magnitude"),
      "当前已选地区没有足够样本用于构建震级分布对比。"
    );
  }

  const mode = state.compareMagnitudeMode;
  const renderSurfaceFigure = (surfaceContext, targetSurface) => {
    const surfaceMeta = getFigureSurfaceMeta(targetSurface);
    const maxPanelRegionCount = Math.max(...surfaceContext.regionPanels.map((group) => group.length), 1);
    const width =
      targetSurface === "preview"
        ? 660
        : Math.max(1280, 260 + bins.length * Math.max(96, maxPanelRegionCount * 34 + 28));
    const legendItems =
      modeMeta.isSingle && targetSurface === "preview"
        ? []
        : surfaceContext.allRegions.map((region) => ({
            label: region.displayName,
            color: region.compareColor,
            dash: region.compareDash,
            type: mode === "cumulative" ? "line" : "bar",
          }));
    const summaryItems = buildCompareSummaryItems(surfaceContext, [
      { label: "分箱宽度", value: `ΔM = ${binSize.toFixed(1)}` },
      { label: "统计模式", value: mode === "count" ? "频数" : mode === "share" ? "频率" : "累计占比" },
      { label: "震级范围", value: `M${minMagnitude.toFixed(1)} - M${maxMagnitude.toFixed(1)}` },
    ]);
    const notes = [
      `横轴为震级分箱，分箱宽度固定为 ΔM = ${binSize.toFixed(1)}；纵轴当前显示${
        mode === "count" ? "频数" : mode === "share" ? "频率" : "累计占比"
      }。`,
      ...buildCompareCoverageNotes(surfaceContext, targetSurface),
      mode === "cumulative"
        ? "累计曲线表示从低震级到高震级的累积占比，用于比较不同地区目录的震级结构差异。"
        : "当前采用分组柱状图，以地区为颜色和线型双编码，比较同一震级带内的区域差异。",
      surfaceContext.lowSampleRegions.length
        ? `以下地区样本较少（<20 条）：${surfaceContext.lowSampleRegions.map((region) => region.displayName).join("、")}。尾部震级带应谨慎解读。`
        : "当前各地区样本量足以支撑基本的震级结构比较。",
    ];
    const chartTitle = modeMeta.isSingle ? `${modeMeta.primaryRegion} 震级分布分析` : "多地区震级分布对比";
    const chartSubtitle = modeMeta.isSingle
      ? `${modeMeta.primaryRegion} · 分箱宽度 ΔM = ${binSize.toFixed(1)}`
      : `${buildCompareFigureRegionCaption(surfaceContext)} · 分箱宽度 ΔM = ${binSize.toFixed(1)}`;
    const layout = createAcademicFigureLayout({
      width,
      surface: targetSurface,
      title: chartTitle,
      subtitle: chartSubtitle,
      summaryItems,
      legendItems,
      notes,
      panelHeights: surfaceContext.regionPanels.map(() => (targetSurface === "preview" ? 256 : 326)),
      kicker: modeMeta.isSingle ? "Regional Analysis" : "Academic Regional Comparison",
      noteLimit: surfaceMeta.noteLimit,
    });
    const theme = layout.theme;
    const axisLabelOptions = {
      fill: theme.subtle,
      fontSize: surfaceMeta.compact ? 10.5 : 12,
      fontWeight: 500,
    };
    const panels = [];
    const dataRows = [];

    surfaceContext.regionPanels.forEach((regionGroup, panelIndex) => {
      const panelDistributions = regionGroup.map((region) => ({
        region,
        distribution: buildMagnitudeDistribution(region.events, {
          minMagnitude,
          maxMagnitude,
          binSize,
        }),
      }));
      const slot = layout.panelSlots[panelIndex];
      const yMax =
        mode === "cumulative"
          ? 100
          : Math.max(
              1,
              ...panelDistributions.flatMap(({ distribution }) =>
                distribution.bins.map((bin) => (mode === "share" ? bin.share : bin.count))
              )
            );
      const yTicks = buildValueTicks(yMax, 5, 0);
      const yTickLabels = yTicks.map((tick) =>
        mode === "cumulative" || mode === "share" ? `${Math.round(tick)}%` : formatNumber(Math.round(tick))
      );
      const leftInset = Math.max(
        targetSurface === "preview" ? 64 : 92,
        28 + Math.ceil(Math.max(...yTickLabels.map((label) => measureAcademicText(label, axisLabelOptions))))
      );
      const rightInset = targetSurface === "preview" ? 20 : 28;
      const bottomInset = targetSurface === "preview" ? 60 : 84;
      const plotFrame = createPanelPlotFrame(width, slot, leftInset, rightInset, 12, bottomInset);
      const plotPieces = [
        buildAcademicGridLines(plotFrame, yTicks, 0, yMax, {
          theme,
          compact: surfaceMeta.compact,
          tickFormatter: (tick) =>
            mode === "cumulative" || mode === "share" ? `${Math.round(tick)}%` : formatNumber(Math.round(tick)),
          fontOptions: axisLabelOptions,
        }),
        buildAcademicXAxisLine(plotFrame, theme),
        buildAcademicYAxisLine(plotFrame, theme),
      ];

      if (mode === "cumulative") {
        panelDistributions.forEach(({ region, distribution }) => {
          const points = [];
          distribution.bins.forEach((bin, index) => {
            const x = plotFrame.left + scaleLinear(index, 0, Math.max(1, distribution.bins.length - 1), 0, plotFrame.width);
            const y = plotFrame.top + plotFrame.height - scaleLinear(bin.cumulativeRatio * 100, 0, 100, 0, plotFrame.height);
            points.push([x, y]);
            const analysisKey = registerCompareAnalysisTarget({
              label: `${region.displayName} · ${bin.label}`,
              eventIds: bin.eventIds,
              highlightEventIds: sampleEventIds(bin.eventIds),
              totalCount: bin.count,
              tooltipTitle: `${region.displayName} · ${bin.label}`,
              tooltipLines: [
                `频数：${formatNumber(bin.count)} 条`,
                `频率：${bin.share.toFixed(2)}%`,
                `累计占比：${(bin.cumulativeRatio * 100).toFixed(2)}%`,
              ],
            });
            dataRows.push({
              region: region.displayName,
              magnitude_bin: bin.label,
              bin_midpoint: Number(bin.midpoint.toFixed(2)),
              count: bin.count,
              share_percent: Number(bin.share.toFixed(4)),
              cumulative_percent: Number((bin.cumulativeRatio * 100).toFixed(4)),
            });
            if (
              index % Math.max(1, Math.ceil(distribution.bins.length / (targetSurface === "preview" ? 10 : 16))) === 0 ||
              index === distribution.bins.length - 1
            ) {
              plotPieces.push(`
                <circle
                  data-analysis-key="${analysisKey}"
                  cx="${x.toFixed(2)}"
                  cy="${y.toFixed(2)}"
                  r="${targetSurface === "preview" ? "3.2" : "4"}"
                  fill="${escapeAttribute(region.compareColor)}"
                  stroke="#ffffff"
                  stroke-width="1.2"
                ></circle>
              `);
            }
          });
          plotPieces.push(
            `<path d="${buildLinePath(points)}" fill="none" stroke="${escapeAttribute(
              region.compareColor
            )}" stroke-width="${targetSurface === "preview" ? "2.4" : "3"}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${escapeAttribute(
              region.compareDash || ""
            )}"></path>`
          );
        });
      } else {
        const groupWidth = plotFrame.width / bins.length;
        const slotWidth = Math.max(12, (groupWidth * 0.82) / Math.max(1, regionGroup.length));
        panelDistributions.forEach(({ region, distribution }, regionIndex) => {
          distribution.bins.forEach((bin, binIndex) => {
            const value = mode === "share" ? bin.share : bin.count;
            const heightValue = scaleLinear(value, 0, yMax, 0, plotFrame.height);
            const x = plotFrame.left + groupWidth * binIndex + groupWidth * 0.09 + regionIndex * slotWidth;
            const y = plotFrame.top + plotFrame.height - heightValue;
            const analysisKey = registerCompareAnalysisTarget({
              label: `${region.displayName} · ${bin.label}`,
              eventIds: bin.eventIds,
              highlightEventIds: sampleEventIds(bin.eventIds),
              totalCount: bin.count,
              tooltipTitle: `${region.displayName} · ${bin.label}`,
              tooltipLines: [
                `频数：${formatNumber(bin.count)} 条`,
                `频率：${bin.share.toFixed(2)}%`,
                `累计占比：${(bin.cumulativeRatio * 100).toFixed(2)}%`,
              ],
            });
            plotPieces.push(`
              <g data-analysis-key="${analysisKey}">
                <rect
                  x="${x.toFixed(2)}"
                  y="${y.toFixed(2)}"
                  width="${Math.max(8, slotWidth - 2).toFixed(2)}"
                  height="${Math.max(2, heightValue).toFixed(2)}"
                  rx="6"
                  fill="${escapeAttribute(region.compareColor)}"
                  opacity="${targetSurface === "preview" ? "0.88" : "0.92"}"
                ></rect>
                <rect
                  class="chart-hitbox"
                  x="${x.toFixed(2)}"
                  y="${plotFrame.top.toFixed(2)}"
                  width="${Math.max(8, slotWidth - 2).toFixed(2)}"
                  height="${plotFrame.height.toFixed(2)}"
                ></rect>
              </g>
            `);
            dataRows.push({
              region: region.displayName,
              magnitude_bin: bin.label,
              bin_midpoint: Number(bin.midpoint.toFixed(2)),
              count: bin.count,
              share_percent: Number(bin.share.toFixed(4)),
              cumulative_percent: Number((bin.cumulativeRatio * 100).toFixed(4)),
            });
          });
        });
      }

      const labelIndices = buildAdaptiveEvenlySpacedIndices(
        bins.map((bin) => bin.tickLabel),
        plotFrame.width,
        axisLabelOptions,
        targetSurface === "preview" ? 4 : 8,
        20
      );
      labelIndices.forEach((index) => {
        const x = plotFrame.left + scaleLinear(index, 0, Math.max(1, bins.length - 1), 0, plotFrame.width);
        plotPieces.push(
          buildSvgTextMarkup([bins[index].tickLabel], x, plotFrame.top + plotFrame.height + 30, {
            ...axisLabelOptions,
            textAnchor: "middle",
          })
        );
      });

      panels.push({
        panelLabel: buildRegionPanelLabel(regionGroup, panelIndex, surfaceContext.regionPanels.length),
        plotFrame,
        plotMarkup: plotPieces.join(""),
        xAxisTitle: "震级 (Mw)",
        yAxisTitle:
          mode === "count" ? "事件数量" : mode === "share" ? "比例 (%)" : "累计比例 (%)",
      });
    });

    return {
      chartTitle: modeMeta.isSingle ? `${modeMeta.primaryRegion} 震级分布分析` : "多地区震级分布对比",
      chartSubtitle:
        modeMeta.isSingle
          ? `${modeMeta.primaryRegion} · 分箱宽度 ΔM = ${binSize.toFixed(1)}`
          : `${buildCompareFigureRegionCaption(surfaceContext)} · 分箱宽度 ΔM = ${binSize.toFixed(1)}`,
      summaryItems,
      notes,
      figureWidth: width,
      figureHeight: layout.height,
      figureSvg: renderAcademicFigure({
        layout,
        width,
        height: layout.height,
        title: modeMeta.isSingle ? `${modeMeta.primaryRegion} 震级分布分析` : "多地区震级分布对比",
        subtitle:
          modeMeta.isSingle
            ? `${modeMeta.primaryRegion} · 分箱宽度 ΔM = ${binSize.toFixed(1)}`
            : `${buildCompareFigureRegionCaption(surfaceContext)} · 分箱宽度 ΔM = ${binSize.toFixed(1)}`,
        summaryItems,
        legendItems,
        notes,
        panels,
        surface: targetSurface,
        kicker: modeMeta.isSingle ? "Regional Analysis" : "Academic Regional Comparison",
        noteLimit: surfaceMeta.noteLimit,
      }),
      dataRows,
    };
  };

  const chartTitle = modeMeta.isSingle ? `${modeMeta.primaryRegion} 震级分布分析` : "多地区震级分布对比";
  const currentSurfaceFigure = renderSurfaceFigure(context, surface);
  const exportSurfaceFigure =
    surface === "modal" ? renderSurfaceFigure(buildCompareRegionContext("magnitude", { surface: "export" }), "export") : null;

  return {
    title: chartTitle,
    subtitle: modeMeta.isSingle
      ? `${modeMeta.primaryRegion} 当前地区分析，展示其震级结构、频数分箱与累计分布特征。`
      : buildCompareSubtitle(context, "比较不同地区的震级结构、频数分箱与累计分布特征。"),
    summaryItems: currentSurfaceFigure.summaryItems,
    controlGroups: buildCompareControlGroups("magnitude"),
    notes: currentSurfaceFigure.notes,
    previewNoteLimit: getFigureSurfaceMeta(surface).noteLimit,
    figureWidth: currentSurfaceFigure.figureWidth,
    figureHeight: currentSurfaceFigure.figureHeight,
    figureSvg: currentSurfaceFigure.figureSvg,
    exportFigureSvg: exportSurfaceFigure?.figureSvg || null,
    exportFigureWidth: exportSurfaceFigure?.figureWidth || null,
    exportFigureHeight: exportSurfaceFigure?.figureHeight || null,
    dataRows: currentSurfaceFigure.dataRows,
    exportSuffix: mode,
  };
}

function buildDepthCompareModal(context, options = {}) {
  const surface = options.surface || "modal";
  const modeMeta = buildAnalysisModeMeta(context);
  const mode = state.compareDepthMode;
  const regionLayers = context.allRegions.map((region) => ({
    region,
    layers: DEPTH_COMPARE_LAYERS.map((layer) => {
      const events = region.events.filter((event) => event.depth >= layer.min && event.depth < layer.max);
      return {
        ...layer,
        count: events.length,
        share: region.events.length ? (events.length / region.events.length) * 100 : 0,
        eventIds: events.map((event) => event.id),
      };
    }),
  }));
  if (!regionLayers.length) {
    return buildCompareEmptyPayload(
      modeMeta.isSingle ? "地区深度结构分析" : "多地区深度结构对比",
      context,
      buildCompareControlGroups("depth"),
      "当前已选地区没有可用于构建深度结构对比的样本。"
    );
  }

  const renderSurfaceFigure = (surfaceContext, targetSurface) => {
    const surfaceMeta = getFigureSurfaceMeta(targetSurface);
    const maxPanelRegionCount = Math.max(...surfaceContext.regionPanels.map((group) => group.length), 1);
    const width = targetSurface === "preview" ? 640 : Math.max(1280, 320 + maxPanelRegionCount * 120);
    const legendItems = DEPTH_COMPARE_LAYERS.map((layer) => ({
      label: layer.label,
      color: layer.color,
      type: "bar",
    }));
    const summaryItems = buildCompareSummaryItems(surfaceContext, [
      { label: "深度层级", value: "浅源 / 中源 / 深源" },
      { label: "统计模式", value: mode === "share" ? "百分比堆叠" : "数量堆叠" },
      { label: "样本量", value: `${formatNumber(surfaceContext.totalEvents)} 条` },
    ]);
    const notes = [
      "深度层级采用地震学常用分层：浅源 0-69 km、中源 70-299 km、深源 300 km 及以上。",
      ...buildCompareCoverageNotes(surfaceContext, targetSurface),
      mode === "share"
        ? "当前显示 100% 堆叠结构，占比差异更适合比较不同地区的深度构成。"
        : "当前显示数量堆叠结构，更适合比较不同地区的绝对事件规模与层级贡献。",
      "深度层级颜色采用稳定语义映射：浅源蓝色、中源橙色、深源红色。",
      surfaceContext.lowSampleRegions.length
        ? `以下地区样本较少（<20 条）：${surfaceContext.lowSampleRegions.map((region) => region.displayName).join("、")}。`
        : "当前各地区样本量足以支撑深度层级对比。",
    ];
    const chartTitle = modeMeta.isSingle ? `${modeMeta.primaryRegion} 深度结构分析` : "多地区深度结构对比";
    const chartSubtitle = modeMeta.isSingle
      ? `${modeMeta.primaryRegion} · 深度层级 0-69 / 70-299 / 300+ km`
      : `${buildCompareFigureRegionCaption(surfaceContext)} · 深度层级 0-69 / 70-299 / 300+ km`;
    const layout = createAcademicFigureLayout({
      width,
      surface: targetSurface,
      title: chartTitle,
      subtitle: chartSubtitle,
      summaryItems,
      legendItems,
      notes,
      panelHeights: surfaceContext.regionPanels.map(() => (targetSurface === "preview" ? 260 : 322)),
      kicker: modeMeta.isSingle ? "Regional Analysis" : "Academic Regional Comparison",
      noteLimit: surfaceMeta.noteLimit,
    });
    const theme = layout.theme;
    const axisLabelOptions = {
      fill: theme.subtle,
      fontSize: surfaceMeta.compact ? 10.5 : 12,
      fontWeight: 500,
      lineHeight: surfaceMeta.compact ? 13 : 16,
    };
    const panels = [];
    const dataRows = [];

    surfaceContext.regionPanels.forEach((regionGroup, panelIndex) => {
      const groupRegionLayers = regionGroup.map((region) => ({
        region,
        layers: DEPTH_COMPARE_LAYERS.map((layer) => {
          const events = region.events.filter((event) => event.depth >= layer.min && event.depth < layer.max);
          return {
            ...layer,
            count: events.length,
            share: region.events.length ? (events.length / region.events.length) * 100 : 0,
            eventIds: events.map((event) => event.id),
          };
        }),
      }));
      const yMax =
        mode === "share"
          ? 100
          : Math.max(1, ...groupRegionLayers.map(({ layers }) => layers.reduce((sum, layer) => sum + layer.count, 0)));
      const yTicks = buildValueTicks(yMax, 5, 0);
      const yTickLabels = yTicks.map((tick) =>
        mode === "share" ? `${Math.round(tick)}%` : formatNumber(Math.round(tick))
      );
      const leftInset = Math.max(
        targetSurface === "preview" ? 70 : 96,
        28 + Math.ceil(Math.max(...yTickLabels.map((label) => measureAcademicText(label, axisLabelOptions))))
      );
      const rightInset = targetSurface === "preview" ? 22 : 30;
      const bottomInset = targetSurface === "preview" ? 78 : 112;
      const plotFrame = createPanelPlotFrame(width, layout.panelSlots[panelIndex], leftInset, rightInset, 12, bottomInset);
      const plotPieces = [
        buildAcademicGridLines(plotFrame, yTicks, 0, yMax, {
          theme,
          compact: surfaceMeta.compact,
          tickFormatter: (tick) =>
            mode === "share" ? `${Math.round(tick)}%` : formatNumber(Math.round(tick)),
          fontOptions: axisLabelOptions,
        }),
        buildAcademicXAxisLine(plotFrame, theme),
        buildAcademicYAxisLine(plotFrame, theme),
      ];
      const groupWidth = plotFrame.width / Math.max(1, groupRegionLayers.length);
      const barWidth = Math.min(
        targetSurface === "preview" ? 40 : 54,
        Math.max(targetSurface === "preview" ? 18 : 28, groupWidth * 0.48)
      );

      groupRegionLayers.forEach(({ region, layers }, index) => {
        const x = plotFrame.left + groupWidth * index + (groupWidth - barWidth) / 2;
        let cumulativeHeight = 0;
        layers.forEach((layer) => {
          const value = mode === "share" ? layer.share : layer.count;
          const segmentHeight = scaleLinear(value, 0, yMax, 0, plotFrame.height);
          const y = plotFrame.top + plotFrame.height - cumulativeHeight - segmentHeight;
          const analysisKey = registerCompareAnalysisTarget({
            label: `${region.displayName} · ${layer.label}`,
            eventIds: layer.eventIds,
            highlightEventIds: sampleEventIds(layer.eventIds),
            totalCount: layer.count,
            tooltipTitle: `${region.displayName} · ${layer.label}`,
            tooltipLines: [
              `事件数量：${formatNumber(layer.count)} 条`,
              `样本占比：${layer.share.toFixed(2)}%`,
              `统计模式：${mode === "share" ? "百分比堆叠" : "数量堆叠"}`,
            ],
          });

          plotPieces.push(`
            <g data-analysis-key="${analysisKey}">
              <rect
                x="${x.toFixed(2)}"
                y="${y.toFixed(2)}"
                width="${barWidth.toFixed(2)}"
                height="${Math.max(2, segmentHeight).toFixed(2)}"
                rx="6"
                fill="${escapeAttribute(layer.color)}"
                opacity="0.92"
              ></rect>
              <rect
                class="chart-hitbox"
                x="${x.toFixed(2)}"
                y="${y.toFixed(2)}"
                width="${barWidth.toFixed(2)}"
                height="${Math.max(2, segmentHeight).toFixed(2)}"
              ></rect>
            </g>
          `);

          dataRows.push({
            region: region.displayName,
            depth_layer: layer.label,
            count: layer.count,
            share_percent: Number(layer.share.toFixed(4)),
          });
          cumulativeHeight += segmentHeight;
        });

        const labelMaxWidth = Math.min(targetSurface === "preview" ? 84 : 118, groupWidth * 0.9);
        plotPieces.push(
          buildWrappedAxisLabelMarkup(
            targetSurface === "preview"
              ? truncateAcademicText(region.displayName, labelMaxWidth, axisLabelOptions)
              : region.displayName,
            x + barWidth / 2,
            plotFrame.top + plotFrame.height + 26,
            labelMaxWidth,
            axisLabelOptions,
            { maxLines: targetSurface === "preview" ? 1 : 2, textAnchor: "middle" }
          )
        );
      });

      panels.push({
        panelLabel: buildRegionPanelLabel(regionGroup, panelIndex, surfaceContext.regionPanels.length),
        plotFrame,
        plotMarkup: plotPieces.join(""),
        xAxisTitle: "地区",
        yAxisTitle: mode === "share" ? "比例 (%)" : "事件数量",
      });
    });

    return {
      chartTitle,
      chartSubtitle,
      summaryItems,
      notes,
      figureWidth: width,
      figureHeight: layout.height,
      figureSvg: renderAcademicFigure({
        layout,
        width,
        height: layout.height,
        title: chartTitle,
        subtitle: chartSubtitle,
        summaryItems,
        legendItems,
        notes,
        panels,
        surface: targetSurface,
        kicker: modeMeta.isSingle ? "Regional Analysis" : "Academic Regional Comparison",
        noteLimit: surfaceMeta.noteLimit,
      }),
      dataRows,
    };
  };

  const chartTitle = modeMeta.isSingle ? `${modeMeta.primaryRegion} 深度结构分析` : "多地区深度结构对比";
  const currentSurfaceFigure = renderSurfaceFigure(context, surface);
  const exportSurfaceFigure =
    surface === "modal" ? renderSurfaceFigure(buildCompareRegionContext("depth", { surface: "export" }), "export") : null;

  return {
    title: chartTitle,
    subtitle: modeMeta.isSingle
      ? `${modeMeta.primaryRegion} 当前地区分析，展示浅源、中源与深源地震的层次构成。`
      : buildCompareSubtitle(context, "比较不同地区浅源、中源与深源地震的层次构成差异。"),
    summaryItems: currentSurfaceFigure.summaryItems,
    controlGroups: buildCompareControlGroups("depth"),
    notes: currentSurfaceFigure.notes,
    previewNoteLimit: getFigureSurfaceMeta(surface).noteLimit,
    figureWidth: currentSurfaceFigure.figureWidth,
    figureHeight: currentSurfaceFigure.figureHeight,
    figureSvg: currentSurfaceFigure.figureSvg,
    exportFigureSvg: exportSurfaceFigure?.figureSvg || null,
    exportFigureWidth: exportSurfaceFigure?.figureWidth || null,
    exportFigureHeight: exportSurfaceFigure?.figureHeight || null,
    dataRows: currentSurfaceFigure.dataRows,
    exportSuffix: mode,
  };
}

function buildEnergyCompareModal(context, options = {}) {
  const surface = options.surface || "modal";
  const modeMeta = buildAnalysisModeMeta(context);
  const granularity = normalizeCompareTimeGranularity(state.compareEnergyGranularity);
  const scaleMode = state.compareEnergyScale;
  const points = buildEnergyTrendAnalysis(context.allRegions[0]?.events || [], state.rangeStart, state.rangeEnd, {
    granularity,
  }).points;
  if (!points.length) {
    return buildCompareEmptyPayload(
      modeMeta.isSingle ? "地区能量释放分析" : "多地区能量释放对比",
      context,
      buildCompareControlGroups("energy"),
      "当前已选地区没有足够样本用于估计累计能量释放趋势。"
    );
  }

  const renderSurfaceFigure = (surfaceContext, targetSurface) => {
    const surfaceMeta = getFigureSurfaceMeta(targetSurface);
    const width = targetSurface === "preview" ? 640 : targetSurface === "export" ? 1480 : 1320;
    const legendItems =
      modeMeta.isSingle && targetSurface === "preview"
        ? []
        : surfaceContext.allRegions.map((region) => ({
            label: region.displayName,
            color: region.compareColor,
            dash: region.compareDash,
            type: "line",
          }));
    const summaryItems = buildCompareSummaryItems(surfaceContext, [
      { label: "能量尺度", value: scaleMode === "log" ? "log10(E/J)" : "累计能量 (J)" },
      { label: "时间粒度", value: buildTemporalGranularityLabel(granularity, state.rangeEnd - state.rangeStart) },
      { label: "总样本量", value: `${formatNumber(surfaceContext.totalEvents)} 条` },
    ]);
    const notes = [
      "能量值按经验关系 log10E = 1.5M + 4.8 估算，适合比较相对强弱，不等同于严格物理实测。",
      ...buildCompareCoverageNotes(surfaceContext, targetSurface),
      scaleMode === "log"
        ? "当前主图采用对数坐标，便于在多数量级差异下比较不同地区的能量释放过程。"
        : "当前主图采用线性坐标，更适合观察累计能量的绝对增长幅度。",
      surfaceContext.lowSampleRegions.length
        ? `以下地区样本较少（<20 条）：${surfaceContext.lowSampleRegions.map((region) => region.displayName).join("、")}。`
        : "当前各地区样本量足以支撑基本的能量过程比较。",
    ];
    const chartTitle = modeMeta.isSingle ? `${modeMeta.primaryRegion} 能量释放分析` : "多地区能量释放对比";
    const chartSubtitle = modeMeta.isSingle
      ? `${modeMeta.primaryRegion} · 估算公式 log10E = 1.5M + 4.8`
      : `${buildCompareFigureRegionCaption(surfaceContext)} · 估算公式 log10E = 1.5M + 4.8`;
    const layout = createAcademicFigureLayout({
      width,
      surface: targetSurface,
      title: chartTitle,
      subtitle: chartSubtitle,
      summaryItems,
      legendItems,
      notes,
      panelHeights: surfaceContext.regionPanels.map(() => (targetSurface === "preview" ? 250 : 318)),
      kicker: modeMeta.isSingle ? "Regional Analysis" : "Academic Regional Comparison",
      noteLimit: surfaceMeta.noteLimit,
    });
    const theme = layout.theme;
    const axisLabelOptions = {
      fill: theme.subtle,
      fontSize: surfaceMeta.compact ? 10.5 : 12,
      fontWeight: 500,
    };
    const panels = [];
    const dataRows = [];

    surfaceContext.regionPanels.forEach((regionGroup, panelIndex) => {
      const analyses = regionGroup.map((region) => ({
        region,
        analysis: buildEnergyTrendAnalysis(region.events, state.rangeStart, state.rangeEnd, {
          granularity,
        }),
      }));
      const ySeriesValues = analyses.flatMap(({ analysis }) =>
        analysis.points.map((point) => (scaleMode === "log" ? point.logEnergy : point.cumulativeEnergy))
      );
      const yMin = scaleMode === "log" ? getMinNumber(ySeriesValues, 0) : 0;
      const yMax = Math.max(1, getMaxNumber(ySeriesValues, 1));
      const yTicks = buildValueTicks(yMax, 5, yMin);
      const yTickLabels = yTicks.map((tick) => (scaleMode === "log" ? tick.toFixed(1) : formatEnergyValue(tick)));
      const leftInset = Math.max(
        targetSurface === "preview" ? 72 : 102,
        28 + Math.ceil(Math.max(...yTickLabels.map((label) => measureAcademicText(label, axisLabelOptions))))
      );
      const rightInset = targetSurface === "preview" ? 22 : 30;
      const bottomInset = targetSurface === "preview" ? 58 : 78;
      const plotFrame = createPanelPlotFrame(width, layout.panelSlots[panelIndex], leftInset, rightInset, 12, bottomInset);
      const xIndices = buildAdaptiveEvenlySpacedIndices(
        analyses[0]?.analysis?.points.map((point) => point.shortLabel) || [],
        plotFrame.width,
        axisLabelOptions,
        targetSurface === "preview" ? 4 : 6,
        18
      );
      const plotPieces = [
        buildAcademicGridLines(plotFrame, yTicks, yMin, yMax, {
          theme,
          compact: surfaceMeta.compact,
          tickFormatter: (tick) => (scaleMode === "log" ? tick.toFixed(1) : formatEnergyValue(tick)),
          fontOptions: axisLabelOptions,
        }),
        buildAcademicXAxisLine(plotFrame, theme),
        buildAcademicYAxisLine(plotFrame, theme),
      ];

      analyses.forEach(({ region, analysis }) => {
        const linePoints = [];
        analysis.points.forEach((point, index) => {
          const x = plotFrame.left + scaleLinear(index, 0, Math.max(1, analysis.points.length - 1), 0, plotFrame.width);
          const metricValue = scaleMode === "log" ? point.logEnergy : point.cumulativeEnergy;
          const y = plotFrame.top + plotFrame.height - scaleLinear(metricValue, yMin, yMax, 0, plotFrame.height);
          linePoints.push([x, y]);
          const analysisKey = registerCompareAnalysisTarget({
            label: `${region.displayName} · ${point.shortLabel}`,
            eventIds: point.eventIds,
            highlightEventIds: sampleEventIds(point.eventIds),
            totalCount: point.count,
            tooltipTitle: `${region.displayName} · ${point.label}`,
            tooltipLines: [
              `累计事件：${formatNumber(point.cumulativeCount)} 条`,
              `累计能量：${formatEnergyValue(point.cumulativeEnergy)}`,
              `log10(E/J)：${point.logEnergy.toFixed(2)}`,
            ],
          });

          dataRows.push({
            region: region.displayName,
            time_bucket: point.label,
            cumulative_event_count: point.cumulativeCount,
            cumulative_energy_j: Number(point.cumulativeEnergy.toFixed(2)),
            log10_energy_j: Number(point.logEnergy.toFixed(4)),
          });

          if (
            index % Math.max(1, Math.ceil(analysis.points.length / (targetSurface === "preview" ? 10 : 16))) === 0 ||
            index === analysis.points.length - 1
          ) {
            plotPieces.push(`
              <circle
                data-analysis-key="${analysisKey}"
                cx="${x.toFixed(2)}"
                cy="${y.toFixed(2)}"
                r="${targetSurface === "preview" ? "3.2" : "4"}"
                fill="${escapeAttribute(region.compareColor)}"
                stroke="#ffffff"
                stroke-width="1.2"
              ></circle>
            `);
          }
        });

        plotPieces.push(
          `<path d="${buildLinePath(linePoints)}" fill="none" stroke="${escapeAttribute(
            region.compareColor
          )}" stroke-width="${targetSurface === "preview" ? "2.4" : "3.1"}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${escapeAttribute(
            region.compareDash || ""
          )}"></path>`
        );
      });

      xIndices.forEach((index) => {
        const x = plotFrame.left + scaleLinear(index, 0, Math.max(1, points.length - 1), 0, plotFrame.width);
        plotPieces.push(
          buildSvgTextMarkup([points[index].shortLabel], x, plotFrame.top + plotFrame.height + 30, {
            ...axisLabelOptions,
            textAnchor: "middle",
          })
        );
      });

      panels.push({
        panelLabel: buildRegionPanelLabel(regionGroup, panelIndex, surfaceContext.regionPanels.length),
        plotFrame,
        plotMarkup: plotPieces.join(""),
        xAxisTitle: "时间",
        yAxisTitle: scaleMode === "log" ? "log10(E/J)" : "累计能量 (J)",
      });
    });

    return {
      chartTitle: modeMeta.isSingle ? `${modeMeta.primaryRegion} 能量释放分析` : "多地区能量释放对比",
      chartSubtitle:
        modeMeta.isSingle
          ? `${modeMeta.primaryRegion} · 估算公式 log10E = 1.5M + 4.8`
          : `${buildCompareFigureRegionCaption(surfaceContext)} · 估算公式 log10E = 1.5M + 4.8`,
      summaryItems,
      notes,
      figureWidth: width,
      figureHeight: layout.height,
      figureSvg: renderAcademicFigure({
        layout,
        width,
        height: layout.height,
        title: modeMeta.isSingle ? `${modeMeta.primaryRegion} 能量释放分析` : "多地区能量释放对比",
        subtitle:
          modeMeta.isSingle
            ? `${modeMeta.primaryRegion} · 估算公式 log10E = 1.5M + 4.8`
            : `${buildCompareFigureRegionCaption(surfaceContext)} · 估算公式 log10E = 1.5M + 4.8`,
        summaryItems,
        legendItems,
        notes,
        panels,
        surface: targetSurface,
        kicker: modeMeta.isSingle ? "Regional Analysis" : "Academic Regional Comparison",
        noteLimit: surfaceMeta.noteLimit,
      }),
      dataRows,
    };
  };

  const chartTitle = modeMeta.isSingle ? `${modeMeta.primaryRegion} 能量释放分析` : "多地区能量释放对比";
  const currentSurfaceFigure = renderSurfaceFigure(context, surface);
  const exportSurfaceFigure =
    surface === "modal" ? renderSurfaceFigure(buildCompareRegionContext("energy", { surface: "export" }), "export") : null;

  return {
    title: chartTitle,
    subtitle: modeMeta.isSingle
      ? `${modeMeta.primaryRegion} 当前地区分析，展示其在当前时间范围内的累计能量释放过程。`
      : buildCompareSubtitle(context, "比较不同地区在统一时间范围内的累计能量释放过程。"),
    summaryItems: currentSurfaceFigure.summaryItems,
    controlGroups: buildCompareControlGroups("energy"),
    notes: currentSurfaceFigure.notes,
    previewNoteLimit: getFigureSurfaceMeta(surface).noteLimit,
    figureWidth: currentSurfaceFigure.figureWidth,
    figureHeight: currentSurfaceFigure.figureHeight,
    figureSvg: currentSurfaceFigure.figureSvg,
    exportFigureSvg: exportSurfaceFigure?.figureSvg || null,
    exportFigureWidth: exportSurfaceFigure?.figureWidth || null,
    exportFigureHeight: exportSurfaceFigure?.figureHeight || null,
    dataRows: currentSurfaceFigure.dataRows,
    exportSuffix: `${granularity}-${scaleMode}`,
  };
}

function buildHotspotCompareModal(context, options = {}) {
  const surface = options.surface || "modal";
  const modeMeta = buildAnalysisModeMeta(context);
  const metric = HOTSPOT_COMPARE_METRICS[state.hotspotCompareMetric] || HOTSPOT_COMPARE_METRICS.count;
  const rows = [...context.allRegions].sort((left, right) => metric.value(right) - metric.value(left));
  if (!rows.length) {
    return buildCompareEmptyPayload(
      modeMeta.isSingle ? "地区核心指标分析" : "多地区区域热点对比",
      context,
      buildCompareControlGroups("hotspot"),
      "当前没有可用于构建区域热点对比的地区。"
    );
  }

  const renderSurfaceFigure = (surfaceContext, targetSurface) => {
    const surfaceMeta = getFigureSurfaceMeta(targetSurface);
    const sortedPanels = surfaceContext.regionPanels.map((regionGroup) =>
      [...regionGroup].sort((left, right) => metric.value(right) - metric.value(left))
    );
    const maxPanelRowCount = Math.max(...sortedPanels.map((panel) => panel.length), 1);
    const width = targetSurface === "preview" ? 640 : 1360;
    const summaryItems = buildCompareSummaryItems(surfaceContext, [
      { label: "比较指标", value: metric.label },
      { label: "排序方式", value: `${metric.label} 降序` },
      { label: "样本量", value: `${formatNumber(surfaceContext.totalEvents)} 条` },
    ]);
    const notes = [
      "当前主图采用横向条形图，以提升地区名称与数值的同时可读性，适合课程汇报与论文附图导出。",
      ...buildCompareCoverageNotes(surfaceContext, targetSurface),
      "排序严格基于当前筛选后的地震目录实时计算；点击条形可反向高亮地图中的对应地区事件。",
      state.activeCountryKey !== "all" && state.activeCountryKey !== UNCLASSIFIED_COUNTRY_KEY
        ? `当前处于 ${getCountryDisplayNameByKey(state.activeCountryKey)} 视图，图中条目优先表示国内子区域；若缺少子区域字段，则自动回退为国家整体。`
        : "当前处于全球视图，条目表示国家/地区级聚合结果。",
    ];
    const chartTitle = modeMeta.isSingle
      ? `${modeMeta.primaryRegion} ${metric.label}分析`
      : `多地区区域热点对比 · ${metric.label}`;
    const chartSubtitle = modeMeta.isSingle
      ? `${modeMeta.primaryRegion} · 当前筛选目录实时聚合`
      : `${buildCompareFigureRegionCaption(surfaceContext)} · 排名基于当前筛选目录实时聚合`;
    const panelHeights = sortedPanels.map((panelRows) =>
      targetSurface === "preview"
        ? Math.max(240, 152 + panelRows.length * 34)
        : Math.max(308, 174 + panelRows.length * 42)
    );
    const layout = createAcademicFigureLayout({
      width,
      surface: targetSurface,
      title: chartTitle,
      subtitle: chartSubtitle,
      summaryItems,
      legendItems: [],
      notes,
      panelHeights,
      kicker: modeMeta.isSingle ? "Regional Analysis" : "Academic Regional Comparison",
      noteLimit: surfaceMeta.noteLimit,
    });
    const theme = layout.theme;
    const axisLabelOptions = {
      fill: theme.subtle,
      fontSize: surfaceMeta.compact ? 10.5 : 12,
      fontWeight: 500,
      lineHeight: surfaceMeta.compact ? 13 : 16,
    };
    const valueLabelOptions = {
      fill: theme.subtle,
      fontSize: surfaceMeta.compact ? 10.5 : 12,
      fontWeight: 600,
    };
    const panels = [];
    const dataRows = [];

    sortedPanels.forEach((panelRows, panelIndex) => {
      const labelMaxWidth = targetSurface === "preview" ? 118 : 170;
      const valueSamples = panelRows.map((row) => metric.formatValue(metric.value(row)));
      const leftInset = Math.max(
        targetSurface === "preview" ? 140 : 220,
        32 + Math.ceil(measureWrappedLabelWidth(panelRows.map((row) => row.displayName), labelMaxWidth, axisLabelOptions, 2))
      );
      const rightInset = Math.max(
        targetSurface === "preview" ? 72 : 96,
        30 + Math.ceil(Math.max(...valueSamples.map((value) => measureAcademicText(value, valueLabelOptions))))
      );
      const bottomInset = targetSurface === "preview" ? 54 : 74;
      const plotFrame = createPanelPlotFrame(width, layout.panelSlots[panelIndex], leftInset, rightInset, 10, bottomInset);
      const maxValue = Math.max(1, getMaxNumber(panelRows.map((row) => metric.value(row)), 1));
      const xTicks = buildValueTicks(maxValue, 5, 0);
      const plotPieces = [
        buildAcademicGridLinesHorizontal(plotFrame, xTicks, 0, maxValue, {
          theme,
          compact: surfaceMeta.compact,
          tickFormatter: (tick) =>
            state.hotspotCompareMetric === "count"
              ? formatNumber(Math.round(tick))
              : metric.unitLabel === "km"
                ? tick.toFixed(0)
                : tick.toFixed(1),
          fontOptions: axisLabelOptions,
        }),
        buildAcademicXAxisLine(plotFrame, theme),
        buildAcademicYAxisLine(plotFrame, theme),
      ];
      const slotHeight = plotFrame.height / Math.max(1, panelRows.length);
      const barHeight = Math.min(targetSurface === "preview" ? 20 : 26, Math.max(14, slotHeight * 0.54));

      panelRows.forEach((region, index) => {
        const y = plotFrame.top + slotHeight * index + (slotHeight - barHeight) / 2;
        const widthValue = scaleLinear(metric.value(region), 0, maxValue, 0, plotFrame.width);
        const analysisKey = registerCompareAnalysisTarget(buildHotspotAnalysisTarget(region));
        const labelLines = wrapAcademicText(region.displayName, labelMaxWidth, axisLabelOptions).slice(
          0,
          targetSurface === "preview" ? 1 : 2
        );
        const labelMetrics = measureTextLines(labelLines, axisLabelOptions);
        const labelY = y + barHeight / 2 - labelMetrics.height / 2 + axisLabelOptions.fontSize;
        const valueText = metric.formatValue(metric.value(region));
        const valueWidth = measureAcademicText(valueText, valueLabelOptions);
        const valueFitsInside = widthValue > valueWidth + 18;
        const valueX = valueFitsInside ? plotFrame.left + widthValue - 8 : plotFrame.left + widthValue + 10;
        const valueFill = valueFitsInside ? "#ffffff" : theme.subtle;

        plotPieces.push(`
          <g data-analysis-key="${analysisKey}">
            <rect
              x="${plotFrame.left.toFixed(2)}"
              y="${y.toFixed(2)}"
              width="${Math.max(4, widthValue).toFixed(2)}"
              height="${barHeight.toFixed(2)}"
              rx="8"
              fill="${escapeAttribute(region.compareColor)}"
              opacity="0.92"
            ></rect>
            <rect
              class="chart-hitbox"
              x="${plotFrame.left.toFixed(2)}"
              y="${y.toFixed(2)}"
              width="${plotFrame.width.toFixed(2)}"
              height="${barHeight.toFixed(2)}"
            ></rect>
          </g>
        `);
        plotPieces.push(
          buildSvgTextMarkup(labelLines, plotFrame.left - 14, labelY, {
            ...axisLabelOptions,
            textAnchor: "end",
          })
        );
        plotPieces.push(
          buildSvgTextMarkup([valueText], valueX, y + barHeight / 2 + 4, {
            ...valueLabelOptions,
            fill: valueFill,
            textAnchor: valueFitsInside ? "end" : "start",
          })
        );

        dataRows.push({
          region: region.displayName,
          count: region.count,
          avg_magnitude: Number(region.avgMag.toFixed(4)),
          max_magnitude: Number(region.maxMag.toFixed(4)),
          avg_depth_km: Number(region.avgDepth.toFixed(4)),
          share_percent: Number((region.share * 100).toFixed(4)),
        });
      });

      panels.push({
        panelLabel: buildRegionPanelLabel(panelRows, panelIndex, sortedPanels.length),
        plotFrame,
        plotMarkup: plotPieces.join(""),
        xAxisTitle: metric.axisLabel,
        yAxisTitle: "地区",
      });
    });

    return {
      chartTitle,
      chartSubtitle,
      summaryItems,
      notes,
      figureWidth: width,
      figureHeight: layout.height,
      figureSvg: renderAcademicFigure({
        layout,
        width,
        height: layout.height,
        title: chartTitle,
        subtitle: chartSubtitle,
        summaryItems,
        legendItems: [],
        notes,
        panels,
        surface: targetSurface,
        kicker: modeMeta.isSingle ? "Regional Analysis" : "Academic Regional Comparison",
        noteLimit: surfaceMeta.noteLimit,
      }),
      dataRows,
    };
  };

  const chartTitle = modeMeta.isSingle
    ? `${modeMeta.primaryRegion} ${metric.label}分析`
    : `多地区区域热点对比 · ${metric.label}`;
  const currentSurfaceFigure = renderSurfaceFigure(context, surface);
  const exportSurfaceFigure =
    surface === "modal" ? renderSurfaceFigure(buildCompareRegionContext("hotspot", { surface: "export" }), "export") : null;

  return {
    title: chartTitle,
    subtitle: modeMeta.isSingle
      ? `${modeMeta.primaryRegion} 当前地区分析，展示其在 ${metric.label} 指标上的整体水平。`
      : buildCompareSubtitle(context, "比较当前已选地区在核心统计指标上的整体差异。"),
    summaryItems: currentSurfaceFigure.summaryItems,
    controlGroups: buildCompareControlGroups("hotspot"),
    notes: currentSurfaceFigure.notes,
    previewNoteLimit: getFigureSurfaceMeta(surface).noteLimit,
    figureWidth: currentSurfaceFigure.figureWidth,
    figureHeight: currentSurfaceFigure.figureHeight,
    figureSvg: currentSurfaceFigure.figureSvg,
    exportFigureSvg: exportSurfaceFigure?.figureSvg || null,
    exportFigureWidth: exportSurfaceFigure?.figureWidth || null,
    exportFigureHeight: exportSurfaceFigure?.figureHeight || null,
    dataRows: currentSurfaceFigure.dataRows,
    exportSuffix: state.hotspotCompareMetric,
  };
}

function buildTemporalGranularityLabel(value, spanMs) {
  const normalized = normalizeCompareTimeGranularity(value, "auto");
  if (normalized && normalized !== "auto") {
    return { month: "月", year: "年" }[normalized] || "自动";
  }
  if (spanMs > 6 * YEAR_MS) {
    return "年";
  }
  return "月";
}

function exportCompareFigure(format) {
  const payload = state.compareModalRender;
  if (!payload?.figureSvg) {
    setStatus("当前没有可导出的对比图。", "warning");
    return;
  }

  const exportSvg = payload.exportFigureSvg || payload.figureSvg;
  const exportWidth = payload.exportFigureWidth || payload.figureWidth;
  const exportHeight = payload.exportFigureHeight || payload.figureHeight;
  const filename = buildCompareExportFilename(payload, format);
  if (format === "svg") {
    try {
      const preparedSvg = prepareSvgMarkupForExport(exportSvg, exportWidth, exportHeight);
      downloadBlob(filename, new Blob([preparedSvg], { type: "image/svg+xml;charset=utf-8" }));
      setStatus("已导出 SVG 图表。");
    } catch (error) {
      console.warn("Failed to export SVG figure", error);
      setStatus(`SVG 图表导出失败：${formatSvgExportError(error)}`, "error");
    }
    return;
  }

  exportSvgMarkupAsPng(exportSvg, exportWidth, exportHeight, filename)
    .then(() => {
      setStatus("已导出 PNG 图表。");
    })
    .catch((error) => {
      console.warn("Failed to export PNG figure", error);
      setStatus(`PNG 图表导出失败：${formatSvgExportError(error)}`, "error");
    });
}

function exportCompareDataset(format) {
  const payload = state.compareModalRender;
  if (!payload?.dataRows?.length) {
    setStatus("当前没有可导出的对比数据。", "warning");
    return;
  }

  const filename = buildCompareExportFilename(payload, format);
  if (format === "csv") {
    downloadBlob(
      filename,
      new Blob([buildCsvContent(payload.dataRows)], { type: "text/csv;charset=utf-8" })
    );
    setStatus("已导出 CSV 数据。");
    return;
  }

  const jsonPayload = {
    module: state.compareModalModule,
    moduleLabel: payload.title,
    exportedAt: new Date().toISOString(),
    rangeLabel: state.rangeLabel,
    rangeStart: new Date(state.rangeStart).toISOString(),
    rangeEnd: new Date(state.rangeEnd).toISOString(),
    activeCountry: getCountryDisplayNameByKey(state.activeCountryKey),
    selectedRegions: getSelectedCompareRegions().map((region) => ({
      key: region.key,
      name: region.displayName,
      count: region.count,
    })),
    summary: payload.summaryItems,
    notes: payload.notes,
    data: payload.dataRows,
  };
  downloadBlob(
    filename,
    new Blob([JSON.stringify(jsonPayload, null, 2)], { type: "application/json;charset=utf-8" })
  );
  setStatus("已导出 JSON 数据。");
}

function buildCompareExportFilename(payload, format) {
  const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
  const regions = getSelectedCompareRegions()
    .slice(0, 3)
    .map((region) => normalizeCountryLookupKey(region.shortName || region.displayName || region.name))
    .filter(Boolean)
    .join("-");
  const regionSummary = regions || "regions";
  const moduleLabel = COMPARE_MODULE_META[state.compareModalModule]?.fileLabel || "compare";
  const suffix = payload.exportSuffix ? `-${payload.exportSuffix}` : "";
  return `${moduleLabel}${suffix}-${regionSummary}-${stamp}.${format}`;
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function buildCsvContent(rows) {
  if (!rows.length) {
    return "";
  }
  const headers = Object.keys(rows[0]);
  const escapeCsvValue = (value) => {
    const text = value == null ? "" : String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(","))].join(
    "\n"
  );
}

function stabilizeSvgMarkupForExport(svgMarkup, width, height) {
  const safeMarkup = String(svgMarkup || "").trim();
  if (!safeMarkup) {
    return safeMarkup;
  }
  return safeMarkup.replace(/<svg\b([^>]*)>/i, (match, attributes) => {
    const nextAttributes = attributes
      .replace(/\swidth="[^"]*"/i, "")
      .replace(/\sheight="[^"]*"/i, "")
      .replace(/\sviewBox="[^"]*"/i, "")
      .replace(/\sxmlns=(["'])[^"']*\1/i, "");
    return `<svg${nextAttributes} width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  });
}

function extractSvgParserError(parsedDocument) {
  const parserError = parsedDocument?.querySelector?.("parsererror");
  if (!parserError) {
    return null;
  }
  return parserError.textContent?.replace(/\s+/g, " ").trim() || "Invalid SVG markup";
}

function formatSvgExportError(error) {
  const message = error instanceof Error ? error.message : String(error || "未知错误");
  return message
    .replace(/^SVG_EXPORT_INVALID:\s*/i, "")
    .replace(/^SVG_EXPORT_EMPTY$/i, "导出 SVG 为空。")
    .trim();
}

function prepareSvgMarkupForExport(svgMarkup, width, height) {
  const stabilizedSvg = stabilizeSvgMarkupForExport(svgMarkup, width, height)
    .replace(/\uFEFF/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  if (!stabilizedSvg) {
    throw new Error("SVG_EXPORT_EMPTY");
  }
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
    return stabilizedSvg;
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(stabilizedSvg, "image/svg+xml");
  const parserError = extractSvgParserError(parsed);
  if (parserError) {
    throw new Error(`SVG_EXPORT_INVALID: ${parserError}`);
  }
  const root = parsed.documentElement;
  if (!root || root.nodeName.toLowerCase() !== "svg") {
    throw new Error("SVG_EXPORT_INVALID: Missing root <svg> element.");
  }
  return new XMLSerializer().serializeToString(root);
}

function exportSvgMarkupAsPng(svgMarkup, width, height, filename) {
  return new Promise((resolve, reject) => {
    let preparedSvg = "";
    try {
      preparedSvg = prepareSvgMarkupForExport(svgMarkup, width, height);
    } catch (error) {
      reject(error);
      return;
    }
    const blob = new Blob([preparedSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const scale = 3;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const context2d = canvas.getContext("2d");
      if (!context2d) {
        URL.revokeObjectURL(url);
        reject(new Error("2D context unavailable"));
        return;
      }
      context2d.imageSmoothingEnabled = true;
      context2d.imageSmoothingQuality = "high";
      context2d.fillStyle = "#ffffff";
      context2d.fillRect(0, 0, canvas.width, canvas.height);
      context2d.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(url);
        if (!pngBlob) {
          reject(new Error("PNG blob unavailable"));
          return;
        }
        downloadBlob(filename, pngBlob);
        resolve();
      }, "image/png");
    };
    image.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    image.decoding = "sync";
    image.src = url;
  });
}

function computeCatalogDiagnostics(events) {
  if (!events || events.length < 8) {
    return null;
  }

  const binWidth = 0.1;
  const magnitudes = events
    .map((event) => Number(event.mag))
    .filter(Number.isFinite)
    .sort((left, right) => left - right);

  if (magnitudes.length < 8) {
    return null;
  }

  const minMagnitude = Math.floor(magnitudes[0] * 10) / 10;
  const meanMagnitude =
    magnitudes.reduce((sum, magnitude) => sum + magnitude, 0) / magnitudes.length;
  const denominator = meanMagnitude - (minMagnitude - binWidth / 2);
  if (denominator <= 0) {
    return null;
  }

  const bValue = Math.LOG10E / denominator;
  const aValue = Math.log10(magnitudes.length) + bValue * minMagnitude;
  const rSquared = computeMagnitudeFitRSquared(magnitudes, minMagnitude, binWidth);

  return {
    minMagnitude,
    meanMagnitude,
    bValue,
    aValue,
    rSquared,
  };
}

function computeMagnitudeFitRSquared(magnitudes, minMagnitude, binWidth) {
  const maxMagnitude = Math.ceil(getMaxNumber(magnitudes, 0) * 10) / 10;
  const points = [];
  let cursor = 0;
  const totalCount = magnitudes.length;

  for (let threshold = minMagnitude; threshold <= maxMagnitude; threshold += binWidth) {
    while (cursor < totalCount && magnitudes[cursor] < threshold - 1e-9) {
      cursor += 1;
    }

    const count = totalCount - cursor;
    if (count < 2) {
      continue;
    }
    points.push({
      x: Number(threshold.toFixed(1)),
      y: Math.log10(count),
    });
  }

  if (points.length < 2) {
    return 0;
  }

  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;

  for (const point of points) {
    const dx = point.x - meanX;
    const dy = point.y - meanY;
    covariance += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }

  if (!varianceX || !varianceY) {
    return 0;
  }

  const correlation = covariance / Math.sqrt(varianceX * varianceY);
  return Math.max(0, Math.min(1, correlation * correlation));
}

function computeEnergyBudget(events) {
  if (!events || !events.length) {
    return null;
  }

  let totalEnergy = 0;
  const topEvents = [];

  for (const event of events) {
    const energy = Math.pow(10, 1.5 * event.mag + 4.8);
    totalEnergy += energy;

    if (topEvents.length < 4) {
      topEvents.push({ mag: event.mag, energy });
      topEvents.sort((left, right) => right.energy - left.energy);
      continue;
    }

    if (energy <= topEvents[topEvents.length - 1].energy) {
      continue;
    }

    topEvents[topEvents.length - 1] = { mag: event.mag, energy };
    topEvents.sort((left, right) => right.energy - left.energy);
  }

  if (!Number.isFinite(totalEnergy) || totalEnergy <= 0) {
    return null;
  }

  return {
    totalEnergy,
    equivalentMagnitude: (Math.log10(totalEnergy) - 4.8) / 1.5,
    dominantShare: ((topEvents[0]?.energy || 0) / totalEnergy) * 100,
    topEvents: topEvents.map((event) => ({
      mag: event.mag,
      share: (event.energy / totalEnergy) * 100,
    })),
  };
}

function computeDepthRegime(events) {
  if (!events || !events.length) {
    return null;
  }

  const depths = events
    .map((event) => Number(event.depth))
    .filter(Number.isFinite)
    .sort((left, right) => left - right);

  if (!depths.length) {
    return null;
  }

  const bands = [
    { label: "浅源 0-69 km", min: 0, max: 70 },
    { label: "中源 70-299 km", min: 70, max: 300 },
    { label: "深源 300+ km", min: 300, max: Infinity },
  ].map((band) => {
    const count = events.filter(
      (event) => event.depth >= band.min && event.depth < band.max
    ).length;
    return {
      ...band,
      count,
      share: (count / events.length) * 100,
    };
  });

  const dominantBand = [...bands].sort((left, right) => right.count - left.count)[0];

  return {
    medianDepth: computePercentile(depths, 0.5),
    p90Depth: computePercentile(depths, 0.9),
    bands,
    dominantBand,
  };
}

function computePercentile(sortedValues, percentile) {
  if (!sortedValues.length) {
    return 0;
  }

  const index = (sortedValues.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sortedValues[lower];
  }

  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function getMaxNumber(values, fallback = 0) {
  let maxValue = fallback;

  for (const value of values) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue) && numericValue > maxValue) {
      maxValue = numericValue;
    }
  }

  return maxValue;
}

function getMinNumber(values, fallback = 0) {
  let minValue = fallback;
  let hasValue = false;

  for (const value of values) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      continue;
    }
    if (!hasValue || numericValue < minValue) {
      minValue = numericValue;
      hasValue = true;
    }
  }

  return hasValue ? minValue : fallback;
}

function formatEnergyValue(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "--";
  }

  if (value >= 1e18) {
    return `${(value / 1e18).toFixed(2)} EJ`;
  }
  if (value >= 1e15) {
    return `${(value / 1e15).toFixed(2)} PJ`;
  }
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)} TJ`;
  }
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)} GJ`;
  }

  return `${(value / 1e6).toFixed(2)} MJ`;
}

function renderEventList() {
  if (!state.filteredEvents.length) {
    dom.eventList.innerHTML = '<div class="empty-copy">暂无事件列表。</div>';
    return;
  }

  dom.eventList.innerHTML = getRecentEvents(state.filteredEvents, 10)
    .map((quake) => {
      const activeClass = quake.id === state.selectedEventId ? "active" : "";
      return `
        <button class="event-item ${activeClass}" type="button" data-event-id="${escapeAttribute(
          quake.id
        )}">
          <span class="event-mag">M${quake.mag.toFixed(1)}</span>
          <span class="event-copy">
            <strong>${escapeHtml(quake.shortPlace)}</strong>
            <small>${escapeHtml(quake.countryNameZh || UNCLASSIFIED_COUNTRY_NAME_ZH)}</small>
            <small>${formatRelativeTime(quake.time)} · 深度 ${quake.depth.toFixed(1)} km</small>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderLegend() {
  const items = LEGENDS[state.colorMode];
  dom.legend.innerHTML = items
    .map(
      (item, index) => `
        <div class="legend-item ${index >= EVENT_VISUAL_PRIORITY_OVERLAY_TIER ? "is-priority" : ""}">
          <span class="legend-swatch" style="--swatch: ${item.color}"></span>
          <span class="legend-label">${escapeHtml(item.label)}</span>
          ${
            index >= EVENT_VISUAL_PRIORITY_OVERLAY_TIER
              ? '<span class="legend-emphasis">优先层</span>'
              : ""
          }
        </div>
      `
    )
    .join("");
}

function configureUnifiedEncodingPanel() {
  mountSceneModeConsole();

  const colorSection = document
    .querySelector("[data-color-mode]")
    ?.closest(".panel-section");
  const heightSection = document
    .querySelector("[data-height-mode]")
    ?.closest(".panel-section");
  if (!document.querySelector("[data-color-mode]")) {
    return;
  }

  const magnitudeButton = document.querySelector('[data-color-mode="magnitude"]');
  const depthButton = document.querySelector('[data-color-mode="depth"]');
  magnitudeButton?.replaceChildren("震级模式");
  depthButton?.replaceChildren("深度模式");

  colorSection?.remove();
  heightSection?.remove();
}

function mountSceneModeConsole() {
  if (document.querySelector(".scene-mode-console")) {
    return;
  }

  const sceneStage = document.querySelector(".scene-stage");
  const colorSection = document.querySelector("[data-color-mode]")?.closest(".panel-section");
  const heightSection = document.querySelector("[data-height-mode]")?.closest(".panel-section");
  const layerSection = dom.gridToggle?.closest(".panel-section");
  const presetSection = document.querySelector("[data-focus]")?.closest(".panel-section");
  if (!sceneStage || !colorSection || !layerSection || !presetSection) {
    return;
  }

  const segmentedGrid = colorSection.querySelector(".segmented-grid");
  const toggleStack = layerSection.querySelector(".toggle-stack");
  const legendList = layerSection.querySelector("#legend");
  const presetStack = presetSection.querySelector(".preset-stack");
  const consolePanel = document.createElement("section");
  consolePanel.className = "scene-mode-console panel";
  consolePanel.setAttribute("aria-label", "视图控制");
  consolePanel.innerHTML = `
    <div class="scene-mode-console-head">
      <h2 class="scene-mode-title">视图控制</h2>
    </div>
    <div class="scene-control-group scene-control-group-mode">
      <div class="scene-control-group-head compact">
        <strong>模式</strong>
      </div>
      <div class="scene-mode-slot"></div>
    </div>
    <div class="scene-control-group scene-control-group-presets">
      <div class="scene-control-group-head compact">
        <strong>预设</strong>
      </div>
      <div class="scene-preset-slot"></div>
    </div>
    <div class="scene-control-group scene-control-group-toggles">
      <div class="scene-control-group-head compact">
        <strong>图层</strong>
      </div>
      <div class="scene-toggle-slot"></div>
    </div>
    <div class="scene-control-group legend-group">
      <div class="scene-control-group-head compact">
        <strong>图例</strong>
      </div>
      <div class="scene-legend-slot"></div>
    </div>
  `;

  if (segmentedGrid) {
    segmentedGrid.classList.add("scene-segmented-grid");
    consolePanel.querySelector(".scene-mode-slot")?.append(segmentedGrid);
  }

  if (toggleStack) {
    toggleStack.classList.remove("toggle-stack");
    toggleStack.classList.add("scene-toggle-stack");
    toggleStack.querySelectorAll(".switch-row").forEach((row) => row.classList.add("compact"));
    consolePanel.querySelector(".scene-toggle-slot")?.append(toggleStack);
  }

  if (presetStack) {
    presetStack.classList.add("scene-preset-stack");
    consolePanel.querySelector(".scene-preset-slot")?.append(presetStack);
  }

  if (legendList) {
    legendList.classList.add("compact");
    consolePanel.querySelector(".scene-legend-slot")?.append(legendList);
  }

  const bottomBar = sceneStage.querySelector(".bottom-bar");
  if (bottomBar) {
    bottomBar.before(consolePanel);
  } else {
    sceneStage.append(consolePanel);
  }
  colorSection.remove();
  heightSection?.remove();
  layerSection.remove();
  presetSection.remove();
}

function setEncodingMode(nextMode) {
  state.encodingMode = nextMode;
  state.colorMode = nextMode;
  state.heightMode = nextMode;
  applyFiltersAndRender();
  emphasizeHeightPerspective();
  setStatus(buildEncodingModeMessage());
}

function syncControls() {
  state.minMagnitude = clampProjectMagnitude(state.minMagnitude);
  dom.magnitudeRange.min = PROJECT_MIN_MAGNITUDE.toFixed(1);
  dom.magnitudeRange.value = state.minMagnitude.toFixed(1);
  dom.magnitudeValue.textContent = `M${state.minMagnitude.toFixed(1)}+`;
  dom.refreshButton.disabled = state.loading;
  dom.refreshButton.textContent = state.loading ? "加载中..." : "刷新数据";
  if (dom.applyYearsButton) {
    dom.applyYearsButton.disabled = state.loading;
  }
  dom.autoRotateButton.classList.toggle("active", state.autoRotate);
  dom.autoRotateButton.textContent = state.autoRotate ? "自动旋转" : "手动浏览";
  dom.gridToggle.checked = state.gridEnabled;
  if (dom.boundaryToggle) {
    dom.boundaryToggle.checked = state.boundariesEnabled;
    dom.boundaryToggle.disabled = !state.boundaryReady;
  }
  if (dom.countryFilter) {
    dom.countryFilter.value = state.activeCountryKey;
    dom.countryFilter.disabled = !state.countryByKey.size;
  }
  if (dom.countrySearchInput) {
    dom.countrySearchInput.disabled = !state.boundaryReady;
  }
  if (dom.countrySearchClear) {
    dom.countrySearchClear.disabled = !state.countrySearchQuery.trim();
  }
  if (dom.hotspotSearchInput) {
    dom.hotspotSearchInput.value = state.hotspotSearchQuery;
  }
  if (dom.countryFilterNote) {
    dom.countryFilterNote.textContent = buildCountryFilterNote();
  }
  syncCountryToolbarButtons();
  if (dom.startYear) {
    dom.startYear.value = String(new Date(state.rangeStart).getUTCFullYear());
  }
  if (dom.endYear) {
    dom.endYear.value = String(new Date(state.rangeEnd).getUTCFullYear());
  }

  toggleActive("[data-window]", "window", state.activeWindow);
  toggleActive("[data-color-mode]", "colorMode", state.encodingMode);
  toggleActive("[data-height-mode]", "heightMode", state.heightMode);
  toggleActive("[data-focus]", "focus", state.focusPreset);
  toggleActive("[data-analysis-module]", "analysisModule", state.activeAnalysisModule);
  const compareSelectionCount = state.hotspotSelectedKeys.length;
  document.querySelectorAll("[data-open-compare]").forEach((button) => {
    button.disabled = state.loading || compareSelectionCount < 1;
    button.textContent = compareSelectionCount >= 2 ? "在中央窗口查看对比图" : "在中央窗口查看大图";
  });
  document.querySelectorAll("[data-compare-selection-copy]").forEach((node) => {
    if (compareSelectionCount >= 2) {
      node.textContent = `已选 ${formatNumber(compareSelectionCount)} 个地区，可打开中央分析窗口`;
    } else if (compareSelectionCount === 1) {
      node.textContent = "已选 1 个地区，可打开中央分析窗口查看当前地区分析图";
    } else {
      node.textContent = "请先在上方地区控制中心至少选择 1 个地区";
    }
  });
  syncCompareModalState();
}

function toggleActive(selector, key, activeValue) {
  document.querySelectorAll(selector).forEach((button) => {
    const buttonValue =
      button.dataset[key] ??
      button.getAttribute(`data-${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`);
    button.classList.toggle("active", buttonValue === activeValue);
  });
}

function buildTrendBuckets(events, start, end) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return [];
  }

  const spanMs = end - start;
  const bucketCount =
    spanMs <= 2 * DAY_MS ? 12 : spanMs <= 120 * DAY_MS ? 14 : spanMs <= 12 * YEAR_MS ? 12 : 10;
  const bucketMs = Math.max(1, Math.ceil(spanMs / bucketCount));
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = start + index * bucketMs;
    const bucketEnd = Math.min(end, bucketStart + bucketMs);
    return {
      count: 0,
      label: `${formatDateTime(bucketStart)} - ${formatDateTime(bucketEnd)}`,
      shortLabel: formatBucketLabel(bucketStart, spanMs),
      start: bucketStart,
      end: bucketEnd,
    };
  });

  for (const quake of events) {
    if (quake.time < start || quake.time > end) {
      continue;
    }
    const bucketIndex = Math.min(
      buckets.length - 1,
      Math.max(0, Math.floor((quake.time - start) / bucketMs))
    );
    buckets[bucketIndex].count += 1;
  }

  return buckets;
}

function deriveHotspotSubregionName(quake) {
  if (quake?.subdivisionNameZh || quake?.subdivisionName) {
    return quake.subdivisionNameZh || quake.subdivisionName;
  }

  if (
    quake?.countryKey &&
    quake.countryKey === state.activeCountryKey &&
    hasLoadedSubdivisionDatasetForCountry(quake.countryKey)
  ) {
    return SUBDIVISION_FALLBACK_REGION_ZH;
  }

  return null;
}

function formatCoordinate(value, positiveSuffix, negativeSuffix) {
  if (!Number.isFinite(value)) {
    return "--";
  }
  const suffix = value >= 0 ? positiveSuffix : negativeSuffix;
  return `${Math.abs(value).toFixed(1)}°${suffix}`;
}

function formatHotspotCoordinateLabel(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return "坐标待定";
  }
  return `${formatCoordinate(lat, "N", "S")} / ${formatCoordinate(lon, "E", "W")}`;
}

function buildHotspotDisplayName(scopeLevel, countryName, regionName) {
  if (scopeLevel === "subregion") {
    return `${countryName} - ${regionName}`;
  }
  return countryName;
}

function computeHotspots(events) {
  const regionMap = new Map();
  const useSubregions =
    state.activeCountryKey !== "all" && state.activeCountryKey !== UNCLASSIFIED_COUNTRY_KEY;
  const selectedCountryName = useSubregions
    ? getCountryDisplayNameByKey(state.activeCountryKey)
    : "";
  const selectedCountryEntry = useSubregions ? state.countryByKey.get(state.activeCountryKey) || null : null;
  const subregionCandidates = useSubregions ? events.map((quake) => deriveHotspotSubregionName(quake)) : [];
  const uniqueSubregions = new Set(
    subregionCandidates.map((value) => normalizeCountryLookupKey(value)).filter(Boolean)
  );
  const canUseSubregions = useSubregions && uniqueSubregions.size > 0;

  events.forEach((quake, index) => {
    const countryKey = useSubregions
      ? state.activeCountryKey
      : quake.countryKey || UNCLASSIFIED_COUNTRY_KEY;
    const countryEntry =
      state.countryByKey.get(countryKey) || (useSubregions ? selectedCountryEntry : null);
    const countryName = useSubregions
      ? selectedCountryName
      : quake.countryNameZh || quake.countryName || UNCLASSIFIED_COUNTRY_NAME_ZH;
    const regionName = canUseSubregions
      ? subregionCandidates[index] || "未标注子区域"
      : countryName;
    const scopeLevel = canUseSubregions ? "subregion" : "country";
    const typeLabel = canUseSubregions
      ? "国内子区域"
      : useSubregions
        ? "国家整体"
        : "国家级";
    const displayName = buildHotspotDisplayName(scopeLevel, countryName, regionName);
    const hotspotKey = buildHotspotKey(
      scopeLevel,
      countryKey,
      regionName
    );

    if (!regionMap.has(hotspotKey)) {
      const searchTokens = new Set([
        normalizeCountryLookupKey(regionName),
        normalizeCountryLookupKey(displayName),
        normalizeCountryLookupKey(countryName),
      ]);
      if (countryEntry) {
        searchTokens.add(normalizeCountryLookupKey(countryEntry.nameZh || ""));
        searchTokens.add(normalizeCountryLookupKey(countryEntry.nameEn || ""));
        for (const alias of countryEntry.aliases || []) {
          searchTokens.add(normalizeCountryLookupKey(alias));
        }
      }

      regionMap.set(hotspotKey, {
        key: hotspotKey,
        name: displayName,
        displayName,
        shortName: regionName,
        countryName,
        regionName,
        count: 0,
        maxMag: 0,
        avgMag: 0,
        avgDepth: 0,
        lon: 0,
        lat: 0,
        eventIds: [],
        scopeLabel: typeLabel,
        scopeLevel,
        countryKey,
        searchTokens: [...searchTokens].filter(Boolean),
      });
    }

    const region = regionMap.get(hotspotKey);
    region.count += 1;
    region.maxMag = Math.max(region.maxMag, quake.mag);
    region.avgMag += quake.mag;
    region.avgDepth += quake.depth;
    region.lon += quake.lon;
    region.lat += quake.lat;
    region.eventIds.push(quake.id);
  });

  return [...regionMap.values()]
    .map((item) => ({
      ...item,
      avgMag: item.count ? item.avgMag / item.count : 0,
      avgDepth: item.count ? item.avgDepth / item.count : 0,
      lon: item.count ? item.lon / item.count : 0,
      lat: item.count ? item.lat / item.count : 0,
      share: events.length ? item.count / events.length : 0,
      coordinateLabel: formatHotspotCoordinateLabel(
        item.count ? item.lat / item.count : NaN,
        item.count ? item.lon / item.count : NaN
      ),
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return right.maxMag - left.maxMag;
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}

function computeMeanMagnitude(events) {
  if (!events.length) {
    return 0;
  }
  return events.reduce((sum, event) => sum + event.mag, 0) / events.length;
}

function computeMeanDepth(events) {
  if (!events.length) {
    return 0;
  }
  return events.reduce((sum, event) => sum + event.depth, 0) / events.length;
}

function computeSampleDensity(events, start, end) {
  if (!events.length) {
    return 0;
  }
  return events.length / Math.max((end - start) / DAY_MS, 1);
}

function buildTemporalAnalysis(events, start, end, options = {}) {
  if (!events.length || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return {
      buckets: [],
      peakCount: 0,
      meanCount: 0,
      granularityLabel: "--",
      movingAverageWindow: 0,
    };
  }

  const spanMs = end - start;
  const requestedGranularity = normalizeCompareTimeGranularity(options.granularity, "auto");
  let bucketMs = 30 * DAY_MS;
  let granularityLabel = "月";

  if (requestedGranularity === "month") {
    bucketMs = 30 * DAY_MS;
    granularityLabel = "月";
  } else if (requestedGranularity === "year") {
    bucketMs = YEAR_MS;
    granularityLabel = "年";
  } else if (spanMs > 6 * YEAR_MS) {
    bucketMs = YEAR_MS;
    granularityLabel = "年";
  }

  const bucketCount = Math.max(1, Math.ceil(spanMs / bucketMs));
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = start + index * bucketMs;
    const bucketEnd = Math.min(end, bucketStart + bucketMs);
    return {
      start: bucketStart,
      end: bucketEnd,
      label: `${formatShortDate(bucketStart)} - ${formatShortDate(bucketEnd)}`,
      shortLabel: formatBucketLabel(bucketStart, Math.max(spanMs, bucketMs)),
      count: 0,
      maxMagnitude: 0,
      meanMagnitude: 0,
      movingAverage: 0,
      energy: 0,
      eventIds: [],
    };
  });

  for (const quake of events) {
    if (quake.time < start || quake.time > end) {
      continue;
    }
    const bucketIndex = Math.min(
      buckets.length - 1,
      Math.max(0, Math.floor((quake.time - start) / bucketMs))
    );
    const bucket = buckets[bucketIndex];
    bucket.count += 1;
    bucket.maxMagnitude = Math.max(bucket.maxMagnitude, quake.mag);
    bucket.meanMagnitude += quake.mag;
    bucket.energy += computeEventEnergy(quake.mag);
    bucket.eventIds.push(quake.id);
  }

  for (const bucket of buckets) {
    bucket.meanMagnitude = bucket.count ? bucket.meanMagnitude / bucket.count : 0;
  }

  const movingAverageWindow = buckets.length > 24 ? 5 : 3;
  for (let index = 0; index < buckets.length; index += 1) {
    const startIndex = Math.max(0, index - movingAverageWindow + 1);
    const windowBuckets = buckets.slice(startIndex, index + 1);
    const count = windowBuckets.reduce((sum, bucket) => sum + bucket.count, 0);
    buckets[index].movingAverage = count / windowBuckets.length;
  }

  return {
    buckets,
    peakCount: getMaxNumber(
      buckets.map((bucket) => bucket.count),
      1
    ),
    meanCount: buckets.reduce((sum, bucket) => sum + bucket.count, 0) / buckets.length,
    granularityLabel,
    movingAverageWindow,
  };
}

function buildMagnitudeDistribution(events, options = {}) {
  if (!events.length) {
    return {
      bins: [],
      peakCount: 0,
      binSize: 0.5,
      minMagnitude: PROJECT_MIN_MAGNITUDE,
      maxMagnitude: PROJECT_MIN_MAGNITUDE,
      dominantLabel: "--",
      dominantShare: 0,
    };
  }

  const binSize = Number.isFinite(options.binSize) ? Number(options.binSize) : 0.5;
  const minMagnitude = Number.isFinite(options.minMagnitude)
    ? Math.max(PROJECT_MIN_MAGNITUDE, Number(options.minMagnitude))
    : Math.max(
        PROJECT_MIN_MAGNITUDE,
        Math.floor(getMinNumber(events.map((event) => event.mag), PROJECT_MIN_MAGNITUDE) * 2) / 2
      );
  const maxMagnitude = Number.isFinite(options.maxMagnitude)
    ? Math.max(minMagnitude + binSize, Number(options.maxMagnitude))
    : Math.max(
        minMagnitude + 1.5,
        Math.ceil(getMaxNumber(events.map((event) => event.mag), 0) * 2) / 2
      );
  const binCount = Math.max(4, Math.ceil((maxMagnitude - minMagnitude) / binSize));
  const bins = Array.from({ length: binCount }, (_, index) => {
    const start = minMagnitude + index * binSize;
    const end = start + binSize;
    return {
      start,
      end,
      midpoint: start + binSize / 2,
      label: `M${start.toFixed(1)} - M${end.toFixed(1)}`,
      tickLabel: start.toFixed(1),
      count: 0,
      share: 0,
      cumulativeRatio: 0,
      eventIds: [],
    };
  });

  for (const quake of events) {
    const index = Math.min(
      bins.length - 1,
      Math.max(0, Math.floor((quake.mag - minMagnitude) / binSize))
    );
    bins[index].count += 1;
    bins[index].eventIds.push(quake.id);
  }

  let cumulative = 0;
  for (const bin of bins) {
    cumulative += bin.count;
    bin.share = (bin.count / events.length) * 100;
    bin.cumulativeRatio = cumulative / events.length;
  }

  const dominant = [...bins].sort((left, right) => right.count - left.count)[0];
  return {
    bins,
    peakCount: getMaxNumber(
      bins.map((bin) => bin.count),
      1
    ),
    binSize,
    minMagnitude,
    maxMagnitude,
    dominantLabel: dominant.label,
    dominantShare: dominant.share,
  };
}

function buildDepthDistribution(events) {
  if (!events.length) {
    return {
      bins: [],
      peakCount: 0,
      medianDepth: 0,
      p90Depth: 0,
      summaryBands: [],
      dominantLabel: "--",
    };
  }

  const bins = [
    { label: "0-30 km", tickLabel: "0-30", min: 0, max: 30, depthClass: "" },
    { label: "30-70 km", tickLabel: "30-70", min: 30, max: 70, depthClass: "" },
    { label: "70-150 km", tickLabel: "70-150", min: 70, max: 150, depthClass: "" },
    { label: "150-300 km", tickLabel: "150-300", min: 150, max: 300, depthClass: "is-warm" },
    { label: "300-500 km", tickLabel: "300-500", min: 300, max: 500, depthClass: "is-hot" },
    { label: "500+ km", tickLabel: "500+", min: 500, max: Infinity, depthClass: "is-hot" },
  ].map((bin) => ({
    ...bin,
    count: 0,
    share: 0,
    meanMagnitude: 0,
    eventIds: [],
  }));

  for (const quake of events) {
    const bin = bins.find((entry) => quake.depth >= entry.min && quake.depth < entry.max);
    if (!bin) {
      continue;
    }
    bin.count += 1;
    bin.meanMagnitude += quake.mag;
    bin.eventIds.push(quake.id);
  }

  for (const bin of bins) {
    bin.meanMagnitude = bin.count ? bin.meanMagnitude / bin.count : 0;
    bin.share = events.length ? (bin.count / events.length) * 100 : 0;
  }

  const regime = computeDepthRegime(events);
  return {
    bins,
    peakCount: getMaxNumber(
      bins.map((bin) => bin.count),
      1
    ),
    medianDepth: regime?.medianDepth || 0,
    p90Depth: regime?.p90Depth || 0,
    summaryBands: regime?.bands || [],
    dominantLabel: regime?.dominantBand?.label || "--",
  };
}

function buildMagnitudeDepthScatter(events) {
  if (!events.length) {
    return {
      points: [],
      minMagnitude: PROJECT_MIN_MAGNITUDE,
      maxMagnitude: PROJECT_MIN_MAGNITUDE,
      maxDepth: 0,
    };
  }

  const sampledEvents = sampleScatterEvents(events, { limit: 360, purpose: "interaction" });
  const minMagnitude = Math.max(
    PROJECT_MIN_MAGNITUDE,
    Math.floor(getMinNumber(sampledEvents.map((event) => event.mag), PROJECT_MIN_MAGNITUDE) * 2) / 2
  );
  const maxMagnitude = Math.max(
    minMagnitude + 1.5,
    Math.ceil(getMaxNumber(sampledEvents.map((event) => event.mag), 0) * 2) / 2
  );
  const maxDepth = Math.max(
    120,
    Math.ceil(getMaxNumber(sampledEvents.map((event) => event.depth), 0) / 50) * 50
  );
  const latestTime = getMaxNumber(sampledEvents.map((event) => event.time), Date.now());
  const earliestTime = getMinNumber(sampledEvents.map((event) => event.time), latestTime);
  const span = Math.max(1, latestTime - earliestTime);
  const maxSignificance = getMaxNumber(
    sampledEvents.map((event) => event.significance),
    1
  );

  return {
    points: sampledEvents.map((event) => {
      const recencyRatio = 1 - (latestTime - event.time) / span;
      return {
        ...event,
        radius: 2 + (Math.max(0, event.significance) / maxSignificance) * 4,
        opacity: 0.28 + recencyRatio * 0.62,
        color: getEventColor(event).toCssColorString(),
      };
    }),
    minMagnitude,
    maxMagnitude,
    maxDepth,
  };
}

function buildEnergyTrendAnalysis(events, start, end, options = {}) {
  const temporal = buildTemporalAnalysis(events, start, end, options);
  if (!temporal.buckets.length) {
    return {
      points: [],
      totalEnergy: 0,
      equivalentMagnitude: 0,
      maxLogEnergy: 1,
      minLogEnergy: 0,
      startLabel: "--",
      endLabel: "--",
    };
  }

  let cumulativeEnergy = 0;
  let cumulativeCount = 0;
  const points = temporal.buckets.map((bucket) => {
    cumulativeEnergy += bucket.energy;
    cumulativeCount += bucket.count;
    return {
      ...bucket,
      cumulativeEnergy,
      cumulativeCount,
      logEnergy: Math.log10(Math.max(cumulativeEnergy, 1)),
    };
  });

  const budget = computeEnergyBudget(events);
  return {
    points,
    totalEnergy: budget?.totalEnergy || 0,
    equivalentMagnitude: budget?.equivalentMagnitude || 0,
    maxLogEnergy: getMaxNumber(
      points.map((point) => point.logEnergy),
      1
    ),
    minLogEnergy: getMinNumber(
      points.map((point) => point.logEnergy),
      0
    ),
    startLabel: points[0]?.shortLabel || "--",
    endLabel: points[points.length - 1]?.shortLabel || "--",
  };
}

function computeCatalogOverview(events, start, end) {
  if (!events.length) {
    return null;
  }

  const magnitudes = events.map((event) => event.mag);
  const depths = events.map((event) => event.depth);
  const meanMagnitude = computeMeanMagnitude(events);
  const stdMagnitude = computeStandardDeviation(magnitudes, meanMagnitude);

  return {
    spanDays: Math.max((end - start) / DAY_MS, 0),
    sampleDensity: computeSampleDensity(events, start, end),
    minMagnitude: getMinNumber(magnitudes, PROJECT_MIN_MAGNITUDE),
    maxMagnitude: getMaxNumber(magnitudes, 0),
    minDepth: getMinNumber(depths, 0),
    maxDepth: getMaxNumber(depths, 0),
    completenessMagnitude: estimateCompletenessMagnitude(events),
    outlierCount: events.filter(
      (event) => event.depth >= 500 || event.mag >= meanMagnitude + 2 * stdMagnitude
    ).length,
  };
}

function computeFocusedEventContext(quake, events) {
  const magnitudeRank = 1 + events.filter((event) => event.mag > quake.mag).length;
  const magnitudeTopPercent = (magnitudeRank / Math.max(events.length, 1)) * 100;
  const timeRank = Math.max(
    1,
    events.findIndex((event) => event.id === quake.id) + 1
  );
  const depthClassLabel = classifyDepthBand(quake.depth);
  const isMarine = detectMarineEvent(quake.place);
  const regionScopeLabel = getEventSpatialScopeLabel(quake);
  const regionScopeEvents = events.filter((event) => isSameEventSpatialScope(quake, event));
  const regionRecentCount = regionScopeEvents.filter(
    (event) => event.time >= quake.time - 30 * DAY_MS && event.time <= quake.time
  ).length;
  const regionMagRank =
    1 + regionScopeEvents.filter((event) => event.mag > quake.mag).length;
  const nearestGapMs = getNearestEventGap(events, quake.id);
  const activityPhrase =
    regionRecentCount >= 10
      ? "处于相对活跃期"
      : regionRecentCount >= 4
        ? "处于中等活跃期"
        : "短期活动相对平缓";

  return {
    magnitudeTopPercent,
    depthClassLabel,
    regionRecentCount,
    regionRankLabel: `第 ${formatNumber(regionMagRank)} / ${formatNumber(regionScopeEvents.length)} 强`,
    nearestGapLabel: nearestGapMs == null ? "无可比样本" : formatDurationShort(nearestGapMs),
    timeRank,
    isMarine,
    observationA: `该事件震级位于当前筛选样本前 ${magnitudeTopPercent.toFixed(
      1
    )}% ，属于当前目录中的高显著度事件。`,
    observationB: `${depthClassLabel}；在 ${regionScopeLabel} 近 30 天内记录到 ${formatNumber(
      regionRecentCount
    )} 条事件，${activityPhrase}。`,
    observationC: `与当前样本最近事件的时间间隔为 ${
      nearestGapMs == null ? "无可比样本" : formatDurationShort(nearestGapMs)
    }，可用于判断其时序孤立性与短期聚集程度。`,
  };
}

function sampleScatterEvents(events, limitOrOptions) {
  const config =
    typeof limitOrOptions === "object"
      ? { limit: limitOrOptions.limit, purpose: limitOrOptions.purpose || "interaction", allowSampling: limitOrOptions.allowSampling }
      : { limit: limitOrOptions, purpose: "interaction", allowSampling: true };
  const limit = Math.max(1, Number(config.limit) || events.length);
  const shouldSample = config.purpose !== "export" && config.allowSampling !== false;

  if (!shouldSample || events.length <= limit) {
    return [...events].sort((left, right) => left.time - right.time);
  }

  const featuredCount = Math.min(Math.floor(limit * 0.35), 140);
  const featured = [...events]
    .sort((left, right) => {
      if (right.mag !== left.mag) {
        return right.mag - left.mag;
      }
      if (right.significance !== left.significance) {
        return right.significance - left.significance;
      }
      return right.time - left.time;
    })
    .slice(0, featuredCount);

  const featuredIds = new Set(featured.map((event) => event.id));
  const remainder = events.filter((event) => !featuredIds.has(event.id));
  const needed = Math.max(0, limit - featured.length);
  const stride = Math.max(1, Math.floor(remainder.length / Math.max(needed, 1)));
  const sampled = [];
  for (let index = 0; index < remainder.length && sampled.length < needed; index += stride) {
    sampled.push(remainder[index]);
  }

  return [...featured, ...sampled].sort((left, right) => left.time - right.time);
}

function sampleEventIds(eventIds, limitOrOptions = 80) {
  const config =
    typeof limitOrOptions === "object"
      ? {
          limit: limitOrOptions.limit,
          purpose: limitOrOptions.purpose || "interaction",
          allowSampling: limitOrOptions.allowSampling,
        }
      : { limit: limitOrOptions, purpose: "interaction", allowSampling: true };
  if (!Array.isArray(eventIds) || !eventIds.length) {
    return [];
  }
  const limit = Math.max(1, Number(config.limit) || 80);
  const shouldSample = config.purpose !== "export" && config.allowSampling !== false;
  if (!shouldSample || eventIds.length <= limit) {
    return [...eventIds];
  }

  const direct = eventIds.slice(0, Math.ceil(limit / 2));
  const strongest = eventIds
    .map((eventId) => state.eventById.get(eventId))
    .filter(Boolean)
    .sort((left, right) => {
      if (right.mag !== left.mag) {
        return right.mag - left.mag;
      }
      if (right.significance !== left.significance) {
        return right.significance - left.significance;
      }
      return right.time - left.time;
    })
    .slice(0, Math.floor(limit / 2))
    .map((event) => event.id);

  return [...new Set([...direct, ...strongest])].slice(0, limit);
}

function getChartFrame(width = 640, height = 228, left = 42, right = 18, top = 18, bottom = 32) {
  return { width, height, left, right, top, bottom };
}

function scaleLinear(value, domainMin, domainMax, rangeMin, rangeMax) {
  if (!Number.isFinite(value)) {
    return rangeMin;
  }
  if (Math.abs(domainMax - domainMin) < 1e-9) {
    return rangeMin;
  }
  return rangeMin + ((value - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin);
}

function buildValueTicks(maxValue, count = 4, minValue = 0) {
  if (!Number.isFinite(maxValue) || !Number.isFinite(minValue)) {
    return [0];
  }
  if (Math.abs(maxValue - minValue) < 1e-9) {
    return [minValue, maxValue + 1];
  }
  return Array.from({ length: count + 1 }, (_, index) =>
    minValue + ((maxValue - minValue) / count) * index
  );
}

function buildLinePath(points) {
  if (!points.length) {
    return "";
  }
  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
}

function buildAreaPath(points, baselineY) {
  if (!points.length) {
    return "";
  }
  const line = buildLinePath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L ${last[0].toFixed(2)} ${baselineY.toFixed(2)} L ${first[0].toFixed(
    2
  )} ${baselineY.toFixed(2)} Z`;
}

function buildTemporalAxisLabels(buckets, frame, chartWidth) {
  const indices = [...new Set([0, Math.floor((buckets.length - 1) / 2), buckets.length - 1])];
  return indices
    .map((index) => {
      const x = frame.left + scaleLinear(index, 0, Math.max(1, buckets.length - 1), 0, chartWidth);
      return `<text class="chart-axis-text" x="${x}" y="${frame.height - 10}" text-anchor="middle">${escapeHtml(
        buckets[index].shortLabel
      )}</text>`;
    })
    .join("");
}

function estimateCompletenessMagnitude(events) {
  const distribution = buildMagnitudeDistribution(events);
  const peakBin = [...distribution.bins].sort((left, right) => right.count - left.count)[0];
  return peakBin ? peakBin.start : 0;
}

function computeStandardDeviation(values, mean) {
  if (!values.length) {
    return 0;
  }
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function computeEventEnergy(magnitude) {
  return Math.pow(10, 1.5 * magnitude + 4.8);
}

function classifyDepthBand(depth) {
  if (depth >= 300) {
    return "深源地震";
  }
  if (depth >= 70) {
    return "中源地震";
  }
  return "浅源地震";
}

function detectMarineEvent(place) {
  return /\b(ocean|sea|offshore|coast|ridge|trench|bay|channel|island region)\b/i.test(place);
}

function getNearestEventGap(events, eventId) {
  const index = events.findIndex((event) => event.id === eventId);
  if (index === -1) {
    return null;
  }

  const candidates = [];
  if (index > 0) {
    candidates.push(Math.abs(events[index].time - events[index - 1].time));
  }
  if (index < events.length - 1) {
    candidates.push(Math.abs(events[index].time - events[index + 1].time));
  }
  if (!candidates.length) {
    return null;
  }
  return Math.min(...candidates);
}

function formatDurationShort(durationMs) {
  const minutes = Math.round(durationMs / 60000);
  if (minutes < 60) {
    return `${minutes} 分钟`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 48) {
    return `${hours} 小时`;
  }
  const days = Math.round(hours / 24);
  if (days < 60) {
    return `${days} 天`;
  }
  const months = Math.round(days / 30);
  if (months < 24) {
    return `${months} 个月`;
  }
  return `${Math.round(days / 365)} 年`;
}

function normalizeFeature(feature) {
  if (Array.isArray(feature)) {
    const [
      rawId,
      rawLon,
      rawLat,
      rawDepth,
      rawMag,
      rawTime,
      rawUpdated,
      rawPlace,
      rawUrl,
      rawAlert,
      rawTsunami,
      rawSignificance,
    ] = feature;

    return normalizeFeature({
      id: rawId,
      geometry: {
        coordinates: [rawLon, rawLat, rawDepth],
      },
      properties: {
        mag: rawMag,
        time: rawTime,
        updated: rawUpdated,
        place: rawPlace,
        url: rawUrl,
        alert: rawAlert,
        tsunami: rawTsunami,
        sig: rawSignificance,
      },
    });
  }

  const coords = feature?.geometry?.coordinates;
  const props = feature?.properties;

  if (
    !Array.isArray(coords) ||
    coords.length < 3 ||
    !props ||
    props.mag == null ||
    props.time == null
  ) {
    return null;
  }

  const lon = Number(coords[0]);
  const lat = Number(coords[1]);
  const depth = Math.max(0, Number(coords[2] ?? 0));
  const mag = Number(props.mag);
  const time = Number(props.time);
  const updated = Number(props.updated || props.time);

  if (![lon, lat, depth, mag, time, updated].every(Number.isFinite)) {
    return null;
  }

  const place = String(props.place || "未标注位置");
  const cleanedPlace = place.replace(/^\s*\d+\s+(km|mi)\s+[NSEW]{1,3}\s+of\s+/i, "");

  return {
    id: String(feature.id || `${time}-${lon}-${lat}`),
    lon,
    lat,
    depth,
    mag,
    time,
    updated,
    place,
    shortPlace: truncate(cleanedPlace, 44),
    region: deriveRegionLabel(cleanedPlace),
    url: String(props.url || ""),
    alert: String(props.alert || ""),
    tsunami: Number(props.tsunami || 0),
    significance: Number(props.sig || 0),
    countryKey: UNCLASSIFIED_COUNTRY_KEY,
    countryName: UNCLASSIFIED_COUNTRY_NAME,
    countryNameZh: UNCLASSIFIED_COUNTRY_NAME_ZH,
    countryMatchMode: "unclassified",
    subdivisionKey: "",
    subdivisionName: "",
    subdivisionNameZh: "",
  };
}

function deriveRegionLabel(place) {
  if (place.includes(",")) {
    return truncate(place.split(",").slice(-1)[0].trim(), 28);
  }

  const lower = place.toLowerCase();
  const ofIndex = lower.lastIndexOf(" of ");
  if (ofIndex > -1) {
    return truncate(place.slice(ofIndex + 4).trim(), 28);
  }

  return truncate(place.trim(), 28);
}

function getLatestEvent(events) {
  let latestEvent = null;
  for (const event of events) {
    if (!event) {
      continue;
    }
    if (
      !latestEvent ||
      event.time > latestEvent.time ||
      (event.time === latestEvent.time && event.updated > latestEvent.updated)
    ) {
      latestEvent = event;
    }
  }
  return latestEvent;
}

function getLatestEventTimestamp(events) {
  return getLatestEvent(events)?.time || 0;
}

function getRecentEvents(events, limit = 10) {
  return [...events]
    .sort((left, right) => {
      if (right.time !== left.time) {
        return right.time - left.time;
      }
      if (right.updated !== left.updated) {
        return right.updated - left.updated;
      }
      return right.mag - left.mag;
    })
    .slice(0, limit);
}

function pickFeaturedEvent(events) {
  return (
    [...events].sort((left, right) => {
      if (right.mag !== left.mag) {
        return right.mag - left.mag;
      }
      return right.time - left.time;
    })[0] || null
  );
}

function getSelectedEvent() {
  return (
    state.filteredEvents.find((event) => event.id === state.selectedEventId) ||
    pickFeaturedEvent(state.filteredEvents)
  );
}

function computeAltitude(quake) {
  const compression = getAltitudeCompressionFactor();
  const tier = getEventVisualTier(quake);

  if (state.heightMode === "depth") {
    const normalizedDepth = Math.min(1, Math.max(0, quake.depth / 700));
    return (
      DEPTH_ALTITUDE_BASE +
      Math.pow(normalizedDepth, 1.3) * DEPTH_ALTITUDE_RANGE * compression +
      [0, 95000, 190000, 320000][tier] * compression
    );
  }

  const normalizedMagnitude = Math.min(1, Math.max(0, quake.mag / 8));
  return (
    MAGNITUDE_ALTITUDE_BASE +
    Math.pow(normalizedMagnitude, 2.08) * MAGNITUDE_ALTITUDE_RANGE * compression +
    [0, 90000, 185000, 320000][tier] * compression
  );
}

function getAltitudeCompressionFactor() {
  const eventCount = state.filteredEvents.length || state.rawEvents.length;

  if (state.focusPreset === "global") {
    if (eventCount > 20000) {
      return 0.3;
    }
    if (eventCount > 8000) {
      return 0.38;
    }
    return 0.52;
  }

  if (eventCount > 20000) {
    return 0.46;
  }
  if (eventCount > 8000) {
    return 0.62;
  }

  return 0.82;
}

function emphasizeHeightPerspective() {
  if (!state.viewer || !state.cameraRigInitialized) {
    return;
  }

  if (state.loading || !state.filteredEvents.length || state.focusPreset === "global") {
    return;
  }

  const currentHeight = state.cameraOrbitDistance - EARTH_RADIUS;
  if (currentHeight >= HEIGHT_PERSPECTIVE_AUTO_TILT_MAX_HEIGHT) {
    return;
  }

  const targetDistance = clampOrbitDistance(
    Math.min(
      EARTH_RADIUS + HEIGHT_PERSPECTIVE_MAX_HEIGHT,
      Math.max(state.cameraOrbitDistance * 1.14, state.cameraOrbitDistance + 1400000)
    )
  );

  if (Math.abs(targetDistance - state.cameraOrbitDistance) < 100000) {
    return;
  }

  animateCenteredCameraToState({
    longitude: state.cameraOrbitLon,
    latitude: state.cameraOrbitLat,
    distance: targetDistance,
  }, {
    duration: 1.1,
    pauseDurationMs: 5000,
  });
}

function buildEncodingModeMessage() {
  if (state.encodingMode === "depth") {
    return "已切换为深度模式：按深度着色，并按深度做 3D 抬升。";
  }

  return "已切换为震级模式：按震级着色，并按震级做 3D 抬升。";
}

function getEventVisualTier(quake) {
  if (state.colorMode === "depth") {
    if (quake.depth >= 500) {
      return 3;
    }
    if (quake.depth >= 300) {
      return 2;
    }
    if (quake.depth >= 70) {
      return 1;
    }
    return 0;
  }

  if (quake.mag >= 6) {
    return 3;
  }
  if (quake.mag >= 5) {
    return 2;
  }
  if (quake.mag >= 4) {
    return 1;
  }
  return 0;
}

function sortEventsForRendering(events) {
  return [...events].sort((left, right) => {
    const tierDelta = getEventVisualTier(left) - getEventVisualTier(right);
    if (tierDelta !== 0) {
      return tierDelta;
    }
    if (Math.abs(left.mag - right.mag) > 0.01) {
      return left.mag - right.mag;
    }
    if (Math.abs(left.depth - right.depth) > 0.5) {
      return left.depth - right.depth;
    }
    return left.time - right.time;
  });
}

function computePixelSize(magnitude, quake = null, options = {}) {
  const tier = quake ? getEventVisualTier(quake) : 0;
  let size = Math.max(4.4, Math.min(18.5, 3.7 + magnitude * 1.45));
  const tierBoosts =
    state.encodingMode === "depth"
      ? [0, 1.15, 2.35, 4.3]
      : [0, 0.9, 1.8, 3.2];
  const overlayBoosts =
    state.encodingMode === "depth"
      ? [0, 1.1, 3.1, 5.1]
      : [0, 0.8, 2.6, 4.2];

  size += tierBoosts[tier];

  if (options.pointCloud) {
    size -= state.encodingMode === "depth" ? 0.9 : 0.5;
  }

  if (options.overlay) {
    size += overlayBoosts[tier];
  }

  return Math.max(options.pointCloud ? 2.6 : 4.6, Math.min(options.overlay ? 27 : 21.5, size));
}

function computeEventAlpha(quake, options = {}) {
  const tier = getEventVisualTier(quake);
  const denseScene = (state.filteredEvents.length || state.rawEvents.length) > POINT_CLOUD_THRESHOLD;
  const profile =
    state.encodingMode === "depth"
      ? {
          pointDense: [0.14, 0.28, 0.74, 0.98],
          pointSparse: [0.22, 0.38, 0.8, 1],
          dense: [0.2, 0.42, 0.82, 1],
          sparse: [0.28, 0.54, 0.88, 1],
        }
      : {
          pointDense: [0.26, 0.42, 0.72, 0.96],
          pointSparse: [0.34, 0.52, 0.78, 0.98],
          dense: [0.38, 0.58, 0.84, 0.98],
          sparse: [0.46, 0.68, 0.88, 1],
        };

  if (options.pointCloud) {
    return denseScene ? profile.pointDense[tier] : profile.pointSparse[tier];
  }

  return denseScene ? profile.dense[tier] : profile.sparse[tier];
}

function getEventColor(quake) {
  if (state.colorMode === "depth") {
    if (quake.depth >= 500) {
      return PALETTE.red;
    }
    if (quake.depth >= 300) {
      return PALETTE.amber;
    }
    if (quake.depth >= 70) {
      return PALETTE.green;
    }
    return PALETTE.aqua;
  }

  if (quake.mag >= 6) {
    return PALETTE.red;
  }
  if (quake.mag >= 5) {
    return PALETTE.amber;
  }
  if (quake.mag >= 4) {
    return PALETTE.green;
  }
  return PALETTE.aqua;
}

function flyToPreset(presetKey, duration = 1.8) {
  const preset = FOCUS_PRESETS[presetKey];
  if (!preset) {
    return;
  }

  const cartographic = Cesium.Cartographic.fromCartesian(preset.destination);
  if (!cartographic) {
    return;
  }

  animateCenteredCameraToState(
    {
      longitude: cartographic.longitude,
      latitude: cartographic.latitude,
      distance: Cesium.Cartesian3.magnitude(preset.destination),
    },
    {
      duration,
      pauseDurationMs: 4500,
    }
  );
}

function flyToEvent(quake) {
  animateCenteredCameraToState(
    {
      longitude: Cesium.Math.toRadians(quake.lon),
      latitude: Cesium.Math.toRadians(quake.lat),
      distance: clampOrbitDistance(
        EARTH_RADIUS + Math.max(1200000, computeAltitude(quake) * 2.65)
      ),
    },
    {
      duration: 1.6,
      pauseDurationMs: 6000,
    }
  );
  setStatus(`镜头已定位到 ${quake.shortPlace}。`);
}

function pauseRotation(durationMs = 4000) {
  state.pauseRotationUntil = Date.now() + durationMs;
}

function setStatus(message, tone = "neutral") {
  const normalizedMessage = String(message || "").trim();
  if (!normalizedMessage) {
    return;
  }

  const timestamp = Date.now();
  const previousEntry = state.statusHistory[state.statusHistory.length - 1];
  if (
    previousEntry &&
    previousEntry.message === normalizedMessage &&
    previousEntry.tone === tone
  ) {
    previousEntry.timestamp = timestamp;
    previousEntry.repeat = (previousEntry.repeat || 1) + 1;
  } else {
    state.statusHistory.push({
      id: `status-${timestamp}-${state.statusHistory.length + 1}`,
      message: normalizedMessage,
      tone,
      timestamp,
      repeat: 1,
    });
    if (state.statusHistory.length > STATUS_HISTORY_LIMIT) {
      state.statusHistory = state.statusHistory.slice(-STATUS_HISTORY_LIMIT);
    }
  }

  dom.statusLine.textContent = normalizedMessage;
  dom.statusLine.dataset.tone = tone;
  persistStatusHistory();
  renderStatusHistory();
}

function renderStatusHistory() {
  if (!dom.statusHistory) {
    return;
  }

  const stickToTop = dom.statusHistory.scrollTop < 28;
  const historyEntries = state.statusHistory.slice(0, -1).reverse();

  if (!state.statusHistory.length) {
    dom.statusHistory.innerHTML =
      '<div class="empty-copy">当前尚无操作提示，执行筛选、切换或联动操作后将自动记录在此。</div>';
    return;
  }

  if (!historyEntries.length) {
    dom.statusHistory.innerHTML =
      '<div class="empty-copy">当前仅有最新一条操作记录；后续筛选、定位与联动操作将按时间顺序继续追加。</div>';
    dom.statusHistory.scrollTop = 0;
    return;
  }

  dom.statusHistory.innerHTML = historyEntries
    .map(
      (entry) => `
        <article class="status-entry" data-tone="${escapeAttribute(entry.tone || "neutral")}">
          <div class="status-entry-head">
            <div class="status-entry-meta">
              <span class="status-entry-time">${escapeHtml(formatStatusTimestamp(entry.timestamp))}</span>
            </div>
            ${
              entry.repeat > 1
                ? `<span class="status-entry-repeat">重复 ${formatNumber(entry.repeat)} 次</span>`
                : ""
            }
          </div>
          <div class="status-entry-message">${escapeHtml(entry.message)}</div>
        </article>
      `
    )
    .join("");

  if (stickToTop || historyEntries.length <= 1) {
    dom.statusHistory.scrollTop = 0;
  }
}

function restoreStatusHistory() {
  try {
    const raw = localStorage.getItem(STATUS_HISTORY_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return;
    }

    state.statusHistory = parsed
      .map((entry, index) => {
        const message = String(entry?.message || "").trim();
        if (!message) {
          return null;
        }

        const tone = entry?.tone === "warning" || entry?.tone === "error" ? entry.tone : "neutral";
        const timestamp = Number(entry?.timestamp);
        const repeat = Number(entry?.repeat);

        return {
          id: String(entry?.id || `status-restored-${index + 1}`),
          message,
          tone,
          timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
          repeat: Number.isFinite(repeat) && repeat > 0 ? Math.round(repeat) : 1,
        };
      })
      .filter(Boolean)
      .slice(-STATUS_HISTORY_LIMIT);

    const latestEntry = state.statusHistory[state.statusHistory.length - 1];
    if (latestEntry && dom.statusLine) {
      dom.statusLine.textContent = latestEntry.message;
      dom.statusLine.dataset.tone = latestEntry.tone || "neutral";
    }
  } catch (error) {
    console.warn("Failed to restore operation history", error);
    state.statusHistory = [];
  }
}

function persistStatusHistory() {
  try {
    localStorage.setItem(
      STATUS_HISTORY_STORAGE_KEY,
      JSON.stringify(
        state.statusHistory.slice(-STATUS_HISTORY_LIMIT).map((entry) => ({
          id: entry.id,
          message: entry.message,
          tone: entry.tone,
          timestamp: entry.timestamp,
          repeat: entry.repeat,
        }))
      )
    );
  } catch (error) {
    console.warn("Failed to persist operation history", error);
  }
}

function formatStatusTimestamp(timestamp) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

function purgeLegacyFeedCache() {
  try {
    const staleKeys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith("usgs-feed-")) {
        staleKeys.push(key);
      }
    }
    staleKeys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn("Failed to purge legacy feed cache", error);
  }
}

function buildQueryChunks(start, end, minMagnitude) {
  const spanYears = (end - start) / YEAR_MS;
  let stepYears = 1;

  if (spanYears > 20 && minMagnitude >= 5.5) {
    stepYears = 10;
  } else if (spanYears > 20 && minMagnitude >= 4) {
    stepYears = 5;
  } else if (spanYears > 20 && minMagnitude >= PROJECT_MIN_MAGNITUDE) {
    stepYears = 3;
  } else if (spanYears > 8) {
    stepYears = 2;
  }

  if (spanYears <= 1) {
    return [{ start, end }];
  }

  const chunks = [];
  let cursorYear = new Date(start).getUTCFullYear();
  const endYear = new Date(end).getUTCFullYear();

  while (cursorYear <= endYear) {
    const chunkStart = Math.max(start, Date.UTC(cursorYear, 0, 1));
    const chunkEnd = Math.min(end, Date.UTC(cursorYear + stepYears, 0, 1) - 1);
    chunks.push({
      start: chunkStart,
      end: chunkEnd,
    });
    cursorYear += stepYears;
  }

  return chunks;
}

function buildUsgsUrl(baseUrl, params) {
  const url = new URL(baseUrl, window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function buildQueryNote(queryPlan) {
  const rangeCopy = formatDateRange(queryPlan.start, queryPlan.end);
  const matchedCopy = formatNumber(queryPlan.matchedCount);
  if (queryPlan.matchedCount > POINT_CLOUD_THRESHOLD) {
    return `当前跨度覆盖 ${rangeCopy}；按 M${queryPlan.queryMinMagnitude.toFixed(
      1
    )}+ 全量查询，共匹配 ${matchedCopy} 条事件，场景已自动切换为点云模式以承载全部数据。`;
  }

  return `当前跨度覆盖 ${rangeCopy}；按 M${queryPlan.queryMinMagnitude.toFixed(
    1
  )}+ 查询，共匹配 ${matchedCopy} 条事件。`;
}

function buildLocalQueryNote(queryPlan, storedCount) {
  const sourceLabel = getCatalogSourceLabel();
  const syncCopy = buildSyncDetailCopy(state.catalogSyncStatus, { compact: true });
  const supplementCopy = buildStaticSupplementQueryCopy();
  return `${sourceLabel}摘要已就绪：目录总量 ${formatNumber(
    storedCount
  )} 条；本次计划分批载入 ${formatNumber(queryPlan.matchedCount)} 条。${
    syncCopy ? ` ${syncCopy}` : ""
  }${supplementCopy ? ` ${supplementCopy}` : ""}`;
}

function buildBatchLoadingQueryNote(queryPlan, batchIndex, loadedBeforeBatch = 0) {
  const total = queryPlan.matchedCount || state.catalogExpectedCount || 0;
  return `当前采用分批加载模式：${queryPlan.label} 共 ${formatNumber(
    total
  )} 条；正在加载第 ${formatNumber(batchIndex)} 批，已显示 ${formatNumber(
    loadedBeforeBatch
  )} / ${formatNumber(total)} 条。`;
}

function buildBatchLoadingStatusLine(queryPlan, batchIndex, loadedBeforeBatch = 0) {
  return `正在加载第 ${formatNumber(batchIndex)} 批数据：已加载 ${formatNumber(
    loadedBeforeBatch
  )} / ${formatNumber(queryPlan.matchedCount || state.catalogExpectedCount || 0)} 条。`;
}

function buildLocalAnalysisNote(scopedEvents) {
  const catalogRangeCopy = formatDateRange(state.catalogStart, state.catalogEnd);
  const catalogCopy = formatNumber(state.catalogLoadedCount || state.rawEvents.length);
  const expectedCopy = formatNumber(state.catalogExpectedCount || state.rawEvents.length);
  const scopeCopy = formatNumber(scopedEvents.length);
  const sourceLabel = getCatalogSourceLabel();
  const countryCopy =
    state.activeCountryKey === "all"
      ? "全球视图"
      : `${getCountryDisplayNameByKey(state.activeCountryKey)} 视图`;
  const coverageCopy = buildSyncDisplayCopy(state.catalogSyncStatus);
  const loadingCopy = state.catalogLoadComplete
    ? `已完成分批载入 ${catalogCopy} / ${expectedCopy} 条事件`
    : `正在分批载入 ${catalogCopy} / ${expectedCopy} 条事件`;

  return `当前采用渐进加载模式：${loadingCopy}，目录范围 ${catalogRangeCopy}，统计口径 M${PROJECT_MIN_MAGNITUDE.toFixed(
    1
  )}+；当前时间范围命中 ${scopeCopy} 条，区域为 ${countryCopy}；数据源：${sourceLabel}。${coverageCopy}`;
}

function buildLoadSuccessMessage(queryPlan) {
  const coverageSuffix = buildSyncDisplayCopy(state.catalogSyncStatus, { useRefreshHint: true });
  const sourceLabel = getCatalogSourceLabel();
  const supplementCopy = buildStaticSupplementResultCopy();

  return `已完成${sourceLabel}分批加载：${queryPlan.label} 共载入 ${formatNumber(
    state.catalogLoadedCount || state.rawEvents.length
  )} 条事件。${supplementCopy}${coverageSuffix}`;
}

function buildSyncDisplayCopy(syncStatus, options = {}) {
  if (state.catalogDatasetMode === "static") {
    const databaseCopy = buildLiveSupplementDatabaseSyncCopy();

    if (state.liveSupplementPhase === "running") {
      return `当前页面基于 GitHub Pages 静态历史分片，并正在补齐 ${formatUtcDateTime(
        state.liveSupplementStart
      )} UTC 之后的最新 USGS 事件。已抓取 ${formatNumber(state.liveSupplementFetchedCount)} 条。${
        databaseCopy ? ` ${databaseCopy}` : ""
      }`;
    }

    if (state.liveSupplementPhase === "completed") {
      return `当前页面基于 GitHub Pages 静态历史分片，并已补充最新 USGS 事件：抓取 ${formatNumber(
        state.liveSupplementFetchedCount
      )} 条，新增 ${formatNumber(state.liveSupplementInsertedCount)} 条，更新 ${formatNumber(
        state.liveSupplementUpdatedCount
      )} 条。${databaseCopy ? ` ${databaseCopy}` : ""}`;
    }

    if (state.liveSupplementPhase === "failed") {
      return `当前页面基于 GitHub Pages 静态历史分片；最近一次最新事件补充失败：${
        state.liveSupplementLastError || "未知错误"
      }。${databaseCopy ? ` ${databaseCopy}` : ""}`;
    }

    return `当前页面使用 GitHub Pages 静态历史分片；后续筛选与分析均在浏览器本地完成。${
      databaseCopy ? ` ${databaseCopy}` : ""
    }`;
  }

  if (!syncStatus) {
    return "当前页面统计基于当前已加载样本；后续筛选均在本地完成。";
  }

  const syncDetail = buildSyncDetailCopy(syncStatus);

  if (syncStatus.isRunning) {
    const modeLabel = syncStatus.isIncremental ? "增量同步" : "首次全量同步";
    const rangeLabel = buildSyncRangeLabel(syncStatus);
    return `后台正在执行${modeLabel}${rangeLabel ? `：补齐 ${rangeLabel}` : ""}。${syncDetail} 当前页面统计基于当前已加载样本。`;
  }

  if (syncStatus.phase === "failed") {
    return `最近一次目录同步失败：${syncStatus.lastError || "未知错误"}。当前页面统计基于当前已加载样本。`;
  }

  if (syncStatus.completedAt) {
    return options.useRefreshHint
      ? `后台目录同步已结束。${syncDetail} 当前页面统计基于当前已加载样本；如需最新总数，可点击“刷新数据”。`
      : `后台目录同步已结束。${syncDetail} 当前页面统计基于当前已加载样本。`;
  }

  return "当前页面统计基于当前已加载样本；后续筛选均在本地完成。";
}

function getCatalogSourceLabel() {
  if (state.catalogDatasetMode !== "static") {
    return "本地 SQLite 数据仓";
  }

  if (state.liveSupplementPhase === "running" || state.liveSupplementPhase === "completed") {
    return "GitHub Pages 静态历史目录 + USGS 最新补充";
  }

  return "GitHub Pages 静态历史目录";
}

function buildStaticSupplementQueryCopy() {
  if (state.catalogDatasetMode !== "static") {
    return "";
  }

  const databaseCopy = buildLiveSupplementDatabaseSyncCopy();

  if (state.liveSupplementPhase === "running") {
    return `正在补齐 ${formatUtcDateTime(state.liveSupplementStart)} UTC 之后的最新事件。${
      databaseCopy ? ` ${databaseCopy}` : ""
    }`;
  }

  if (state.liveSupplementPhase === "completed" && state.liveSupplementFetchedCount > 0) {
    return `已补充最新事件 ${formatNumber(state.liveSupplementFetchedCount)} 条。${
      databaseCopy ? ` ${databaseCopy}` : ""
    }`;
  }

  if (state.liveSupplementPhase === "failed") {
    return `最新事件补充失败：${state.liveSupplementLastError || "未知错误"}。${
      databaseCopy ? ` ${databaseCopy}` : ""
    }`;
  }

  return databaseCopy;
}

function buildStaticSupplementResultCopy() {
  if (state.catalogDatasetMode !== "static") {
    return "";
  }

  const databaseCopy = buildLiveSupplementDatabaseSyncCopy();

  if (state.liveSupplementPhase === "completed" && state.liveSupplementFetchedCount > 0) {
    return `并已补充最新 USGS 事件 ${formatNumber(state.liveSupplementFetchedCount)} 条（新增 ${formatNumber(
      state.liveSupplementInsertedCount
    )} 条，更新 ${formatNumber(state.liveSupplementUpdatedCount)} 条）。${
      databaseCopy ? ` ${databaseCopy}` : ""
    }`;
  }

  if (state.liveSupplementPhase === "failed") {
    return `最新事件补充失败：${state.liveSupplementLastError || "未知错误"}。${
      databaseCopy ? ` ${databaseCopy}` : ""
    }`;
  }

  return databaseCopy;
}

function buildLiveSupplementQueryNote(supplementPlan, chunkIndex, pageIndex) {
  return `当前静态历史目录已就绪，正在补齐 ${formatDateRange(
    supplementPlan.start,
    supplementPlan.end
  )} 的最新事件：第 ${formatNumber(chunkIndex + 1)}/${formatNumber(
    supplementPlan.chunks.length
  )} 段，第 ${formatNumber(pageIndex + 1)} 批；已抓取 ${formatNumber(state.liveSupplementFetchedCount)} 条。`;
}

function buildLiveSupplementStatusLine(supplementPlan, chunkIndex, pageIndex) {
  return `正在补齐最新事件：第 ${formatNumber(chunkIndex + 1)}/${formatNumber(
    supplementPlan.chunks.length
  )} 段，第 ${formatNumber(pageIndex + 1)} 批；已抓取 ${formatNumber(
    state.liveSupplementFetchedCount
  )} 条。`;
}

function buildLiveSupplementCompletedLine() {
  return `最新事件补充完成：抓取 ${formatNumber(state.liveSupplementFetchedCount)} 条，新增 ${formatNumber(
    state.liveSupplementInsertedCount
  )} 条，更新 ${formatNumber(state.liveSupplementUpdatedCount)} 条。`;
}

function buildLiveSupplementDatabaseSyncCopy() {
  if (!canPersistLiveSupplementToLocalDatabase()) {
    return "";
  }

  if (state.liveSupplementDbSyncPhase === "running") {
    return "最新补充事件正在同步到本地 SQLite 数据仓。";
  }

  if (state.liveSupplementDbSyncPhase === "completed") {
    return `最新补充事件已同步到本地 SQLite 数据仓：写入 ${formatNumber(
      state.liveSupplementDbFetchedCount
    )} 条，新增 ${formatNumber(state.liveSupplementDbInsertedCount)} 条，更新 ${formatNumber(
      state.liveSupplementDbUpdatedCount
    )} 条${
      state.liveSupplementDbStoredCount > 0
        ? `，库内总数 ${formatNumber(state.liveSupplementDbStoredCount)} 条`
        : ""
    }。`;
  }

  if (state.liveSupplementDbSyncPhase === "failed") {
    return `最新补充事件同步到本地 SQLite 数据仓失败：${
      state.liveSupplementDbLastError || "未知错误"
    }。`;
  }

  return "";
}

function buildLiveSupplementDatabaseSyncStatusLine() {
  return `最新事件已载入页面，正在同步到本地 SQLite 数据仓：待写入 ${formatNumber(
    state.liveSupplementDbFetchedCount
  )} 条。`;
}

function buildLiveSupplementDatabaseSyncCompletedLine() {
  return `最新事件已同步到本地 SQLite 数据仓：写入 ${formatNumber(
    state.liveSupplementDbFetchedCount
  )} 条，新增 ${formatNumber(state.liveSupplementDbInsertedCount)} 条，更新 ${formatNumber(
    state.liveSupplementDbUpdatedCount
  )} 条${
    state.liveSupplementDbStoredCount > 0
      ? `，库内总数 ${formatNumber(state.liveSupplementDbStoredCount)} 条`
      : ""
  }。`;
}

function buildSyncDetailCopy(syncStatus, options = {}) {
  if (!syncStatus) {
    return "";
  }

  const detail = [];
  if (Number.isFinite(syncStatus.fetchedCount) && syncStatus.fetchedCount > 0) {
    detail.push(`本次已抓取 ${formatNumber(syncStatus.fetchedCount)} 条`);
  }
  if (Number.isFinite(syncStatus.insertedCount) && syncStatus.insertedCount >= 0) {
    detail.push(`新增入库 ${formatNumber(syncStatus.insertedCount)} 条`);
  }
  if (Number.isFinite(syncStatus.updatedCount) && syncStatus.updatedCount >= 0) {
    detail.push(`更新已有事件 ${formatNumber(syncStatus.updatedCount)} 条`);
  }
  if (Number.isFinite(syncStatus.skippedCount) && syncStatus.skippedCount > 0 && !options.compact) {
    detail.push(`跳过 ${formatNumber(syncStatus.skippedCount)} 条`);
  }
  if (Number.isFinite(syncStatus.storedCount) && syncStatus.storedCount > 0 && !options.compact) {
    detail.push(`库内唯一事件总数 ${formatNumber(syncStatus.storedCount)} 条`);
  }

  return detail.length ? detail.join("，") + "。" : "";
}

function buildSyncRangeLabel(syncStatus) {
  const start = Number(syncStatus?.requestedStartTime || 0);
  const end = Number(syncStatus?.requestedEndTime || 0);
  if (!start || !end || end < start) {
    return "";
  }
  return `${formatUtcDateTime(start)} UTC 之后到 ${formatUtcDateTime(end)} UTC`;
}

function formatQueryDate(timestamp) {
  return `${new Date(timestamp).toISOString().slice(0, 19)}Z`;
}

function formatDateRange(start, end) {
  return `${formatShortDate(start)} 至 ${formatShortDate(end)}`;
}

function formatShortDate(timestamp) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
}

function clampYear(input, fallback) {
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(MIN_HISTORY_YEAR, Math.min(CURRENT_YEAR, Math.round(parsed)));
}

function clampProjectMagnitude(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return PROJECT_MIN_MAGNITUDE;
  }
  return Math.max(PROJECT_MIN_MAGNITUDE, numericValue);
}

function formatBucketLabel(timestamp, spanMs) {
  if (spanMs <= 2 * DAY_MS) {
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  }

  if (spanMs <= 120 * DAY_MS) {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(timestamp));
  }

  if (spanMs <= 12 * YEAR_MS) {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
    }).format(new Date(timestamp));
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
  }).format(new Date(timestamp));
}

function formatDateTime(timestamp) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatUtcDateTime(timestamp) {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatRelativeTime(timestamp) {
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) {
    return "刚刚";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 45) {
    return `${diffDays} 天前`;
  }

  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths < 24) {
    return `${diffMonths} 个月前`;
  }

  const diffYears = Math.round(diffDays / 365);
  if (diffYears >= 1) {
    return `${diffYears} 年前`;
  }

  return `${diffDays} 天前`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-CN").format(value || 0);
}

function truncate(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
