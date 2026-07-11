var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// src/data/orders.json
var orders_default = [
  {
    order_id: "LB10234",
    customer_name: "Riya Sharma",
    phone: "919876543210",
    item: "Emerald Bodycon Dress, Size M",
    order_date: "2026-06-18",
    status: "processing",
    dispatch_date: null,
    expected_dispatch_by: "2026-07-02",
    expected_delivery: null,
    tracking_id: null,
    tracking_url: null,
    payment_mode: "prepaid",
    amount: 1499,
    shipping_city: "Bangalore",
    notes: "Overdue: still processing past 14-day production window. Demo script for angry delay message."
  },
  {
    order_id: "LB10235",
    customer_name: "Ananya Patel",
    phone: "919811122233",
    item: "Black Corset Top, Size S",
    order_date: "2026-07-05",
    status: "processing",
    dispatch_date: null,
    expected_dispatch_by: "2026-07-19",
    expected_delivery: null,
    tracking_id: null,
    tracking_url: null,
    payment_mode: "cod",
    amount: 899,
    shipping_city: "Mumbai",
    notes: "Within normal 7\u201314 day production window."
  },
  {
    order_id: "LB10236",
    customer_name: "Meera Iyer",
    phone: "919900112233",
    item: "Floral Midi Dress, Size L",
    order_date: "2026-06-28",
    status: "dispatched",
    dispatch_date: "2026-07-08",
    expected_dispatch_by: "2026-07-12",
    expected_delivery: "2026-07-13",
    tracking_id: "BLUEDART99221",
    tracking_url: "https://www.bluedart.com/tracking/BLUEDART99221",
    payment_mode: "prepaid",
    amount: 1799,
    shipping_city: "Chennai",
    notes: "In transit. Cancel not allowed \u2014 return after delivery only."
  },
  {
    order_id: "LB10237",
    customer_name: "Sneha Reddy",
    phone: "919700556677",
    item: "Plus-Curve Wrap Dress, Size XL",
    order_date: "2026-06-22",
    status: "delivered",
    dispatch_date: "2026-06-30",
    expected_dispatch_by: "2026-07-06",
    expected_delivery: "2026-07-05",
    delivered_at: "2026-07-10T09:15:00+05:30",
    tracking_id: "DELHIVERY44881",
    tracking_url: "https://www.delhivery.com/track/DELHIVERY44881",
    payment_mode: "prepaid",
    amount: 1699,
    shipping_city: "Hyderabad",
    notes: "Marked delivered recently \u2014 within 24h window for not-received claims (demo clock: treat as same day)."
  },
  {
    order_id: "LB10238",
    customer_name: "Kavya Nair",
    phone: "919655443322",
    item: "Satin Slip Dress, Size M",
    order_date: "2026-06-10",
    status: "delivered",
    dispatch_date: "2026-06-18",
    expected_dispatch_by: "2026-06-24",
    expected_delivery: "2026-06-23",
    delivered_at: "2026-06-22T14:00:00+05:30",
    tracking_id: "ECOM77102",
    tracking_url: "https://ecomexpress.in/tracking/?awb=ECOM77102",
    payment_mode: "cod",
    amount: 1299,
    shipping_city: "Delhi",
    notes: "Delivered long ago \u2014 past 24h not-received window; past 48h damage window; still inside 7-day return if unused."
  },
  {
    order_id: "LB10239",
    customer_name: "Priya Desai",
    phone: "919812345678",
    item: "Olive Cargo Pants, Size 28",
    order_date: "2026-06-25",
    status: "delivered",
    dispatch_date: "2026-07-02",
    expected_dispatch_by: "2026-07-09",
    expected_delivery: "2026-07-07",
    delivered_at: "2026-07-09T11:30:00+05:30",
    tracking_id: "XPRESSBEES33001",
    tracking_url: "https://www.xpressbees.com/track?awb=XPRESSBEES33001",
    payment_mode: "prepaid",
    amount: 1199,
    shipping_city: "Pune",
    notes: "Damaged item scenario \u2014 customer can report within 48h of delivery with photos."
  }
];

// src/lib/orders.ts
var ORDERS = orders_default;
function normalizePhone(phone) {
  return phone.replace(/\D/g, "").replace(/^0+/, "");
}
__name(normalizePhone, "normalizePhone");
function daysBetween(isoDate, now = /* @__PURE__ */ new Date()) {
  const start = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T00:00:00+05:30`);
  const ms = now.getTime() - start.getTime();
  return Math.floor(ms / (1e3 * 60 * 60 * 24));
}
__name(daysBetween, "daysBetween");
function hoursBetween(isoDate, now = /* @__PURE__ */ new Date()) {
  const start = new Date(isoDate);
  return Math.floor((now.getTime() - start.getTime()) / (1e3 * 60 * 60));
}
__name(hoursBetween, "hoursBetween");
function enrichOrder(order, now = /* @__PURE__ */ new Date()) {
  const daysSinceOrder = daysBetween(order.order_date, now);
  const daysSinceDispatch = order.dispatch_date ? daysBetween(order.dispatch_date, now) : null;
  const hoursSinceDelivered = order.delivered_at ? hoursBetween(order.delivered_at, now) : null;
  const daysSinceDelivered = order.delivered_at ? daysBetween(order.delivered_at, now) : null;
  const productionWindowDays = 14;
  const isPastProductionWindow = order.status === "processing" && daysSinceOrder > productionWindowDays;
  const withinProductionWindow = order.status === "processing" && daysSinceOrder <= productionWindowDays;
  const canCancel = !["dispatched", "in_transit", "delivered", "cancelled"].includes(
    String(order.status)
  );
  const within24hNotReceived = order.status === "delivered" && hoursSinceDelivered !== null && hoursSinceDelivered <= 24;
  const within48hDamage = order.status === "delivered" && hoursSinceDelivered !== null && hoursSinceDelivered <= 48;
  const within7DayReturn = order.status === "delivered" && daysSinceDelivered !== null && daysSinceDelivered <= 7;
  const trackingStale = (order.status === "dispatched" || order.status === "in_transit") && daysSinceDispatch !== null && daysSinceDispatch >= 4;
  return {
    ...order,
    computed: {
      today_ist: now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      days_since_order: daysSinceOrder,
      days_since_dispatch: daysSinceDispatch,
      hours_since_delivered: hoursSinceDelivered,
      days_since_delivered: daysSinceDelivered,
      is_past_production_window: isPastProductionWindow,
      within_production_window: withinProductionWindow,
      can_cancel_pre_dispatch: canCancel,
      within_24h_not_received_window: within24hNotReceived,
      within_48h_damage_window: within48hDamage,
      within_7_day_return_window: within7DayReturn,
      tracking_stale_4_plus_business_days: trackingStale,
      policy_hint: isPastProductionWindow ? "Escalate: processing >14 days \u2014 tell customer to raise ticket with order number; offer cancel if still pre-dispatch." : withinProductionWindow ? "Normal processing \u2014 explain made-to-order 7\u201314 day production, then 4\u20135 day delivery." : canCancel ? "Pre-dispatch \u2014 cancellation possible with full refund to original payment in 5\u20137 business days if prepaid." : order.status === "delivered" ? "Delivered \u2014 no cancel; returns = store credit only; check 24h/48h/7-day windows via computed flags." : "Dispatched \u2014 cancel not possible; track package; returns after delivery."
    }
  };
}
__name(enrichOrder, "enrichOrder");
function getOrderById(orderId) {
  const id = orderId.trim().toUpperCase();
  const order = ORDERS.find((o) => o.order_id.toUpperCase() === id);
  return order ? enrichOrder(order) : null;
}
__name(getOrderById, "getOrderById");
function getOrdersByPhone(phone) {
  const p = normalizePhone(phone);
  return ORDERS.filter((o) => {
    const op = normalizePhone(o.phone);
    return op === p || op.endsWith(p.slice(-10)) || p.endsWith(op.slice(-10));
  }).map((o) => enrichOrder(o));
}
__name(getOrdersByPhone, "getOrdersByPhone");
function listDemoOrdersSummary() {
  return ORDERS.map((o) => ({
    order_id: o.order_id,
    status: o.status,
    item: o.item,
    customer_name: o.customer_name,
    phone_last4: o.phone.slice(-4),
    notes: o.notes
  }));
}
__name(listDemoOrdersSummary, "listDemoOrdersSummary");
function extractOrderIdFromText(text) {
  const m = text.match(/\b(LB\s*-?\s*\d{4,6})\b/i) || text.match(/\border\s*(?:id|number|#)?\s*[:#]?\s*(LB\s*-?\s*\d{4,6}|\d{5,6})\b/i);
  if (!m) return null;
  let id = m[1].replace(/\s|-/g, "").toUpperCase();
  if (/^\d+$/.test(id)) id = `LB${id}`;
  if (!id.startsWith("LB")) id = `LB${id}`;
  return id;
}
__name(extractOrderIdFromText, "extractOrderIdFromText");

// src/lib/openrouter.ts
var TOOLS = [
  {
    type: "function",
    function: {
      name: "lookup_order",
      description: "Look up a mock Littlebox order by order_id (e.g. LB10234) and/or customer phone. Returns order details and policy window flags.",
      parameters: {
        type: "object",
        properties: {
          order_id: {
            type: "string",
            description: "Order ID like LB10234"
          },
          phone: {
            type: "string",
            description: "Customer phone with country code if available"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_orders_for_phone",
      description: "List all mock orders linked to a phone number.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string" }
        },
        required: ["phone"]
      }
    }
  }
];
async function chatWithTools(opts) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/dhrubasumatary/littlebox-support-demo",
      "X-OpenRouter-Title": "Littlebox Support AI Demo"
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      tools: TOOLS,
      tool_choice: "auto",
      temperature: opts.temperature ?? 0.4,
      max_tokens: 800
    })
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.error?.message || `OpenRouter HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
__name(chatWithTools, "chatWithTools");
async function chatSimple(opts) {
  const system = opts.extraContext ? `${opts.system}

## Live order context (from system lookup \u2014 treat as facts)
${opts.extraContext}` : opts.system;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/dhrubasumatary/littlebox-support-demo",
      "X-OpenRouter-Title": "Littlebox Support AI Demo"
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [{ role: "system", content: system }, ...opts.messages],
      temperature: 0.4,
      max_tokens: 700
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `OpenRouter HTTP ${res.status}`);
  }
  return data.choices?.[0]?.message?.content?.trim() || "";
}
__name(chatSimple, "chatSimple");

// src/lib/prompt.ts
var SYSTEM_PROMPT = `You are Maya, WhatsApp support for Littlebox India (Good Tribe Pvt Ltd) \u2014 a DEMO prototype with mock orders only.

## Who you are
- Sound like a sharp, kind human texting on WhatsApp. Short. Clear. Warm without sugar.
- NOT a corporate bot. No "As per our policy document\u2026" openings. No over-apologizing.
- Never force button menus. Free text is enough. You may suggest next steps in plain words.
- Always prefer the customer's order number \u2014 it speeds resolution (their own guidance).
- This is a sandboxed pitch demo: order data comes only from tools / context. Never invent order facts.

## Brand context (facts customers care about)
- D2C fashion: dresses, tops, footwear, co-ords, Plus-Curve. Own manufacturing ~40k sq ft Noida.
- Made-to-order / just-in-time: items stitched after order, not pulled from huge pre-stock.
- Shopify checkout: TLS, Level 1 PCI DSS, 256-bit SSL, 3D Secure. Card details not stored on Littlebox servers.
- Prepaid: 5% off + free shipping. COD available. Prepaid is NOT less safe than COD.
- Support hours: Mon\u2013Fri 9 AM\u20136 PM IST. Digital support (no phone line).

## How customers reach support (real channels \u2014 guide them accurately)
1. Website / in-app support chat at littleboxindia.com (often fastest first response ~24h)
2. WhatsApp (this channel) \u2014 automated routing historically; YOU are the AI upgrade
3. Email: cx@littleboxindia.com \u2014 order number in subject line
4. Support ticket via My Account \u2192 My Orders \u2192 order \u2192 help (best paper trail for returns/refunds/undelivered)

First response norms they publish: chat/tickets ~24h; WhatsApp/email ~24\u201348h after categorisation; resolution 1\u20135 business days by complexity.
One channel per issue. Don't spam multiple channels. Follow up on the same thread.

## Shipping / production timelines (canonical framing)
- Production + processing: 7\u201314 days from order placement (warehouse Mon\u2013Sat; holidays excluded).
- After dispatch: 4\u20135 business days delivery (location/courier dependent; remote areas may take longer).
- Total standard window: about 11\u201314 days order\u2192delivery (FAQ sometimes cites up to ~11\u201319 days outer bound).
- Sale periods: dispatch may +2\u20134 days.
- "Processing" = active production, NOT with courier. Normal up to 14 days.
- Multi-item orders: usually dispatch together when all items ready.
- Address cannot be changed after order is placed / once processing starts toward dispatch \u2014 must be correct at checkout. Before dispatch, customer can verify address in My Account.
- Tracking: emailed + in My Account after dispatch. Allow ~24h after dispatch scan for tracking to populate.
- No tracking movement 4+ business days post-dispatch \u2192 raise ticket with order number + tracking ID.
- If processing >14 days with no dispatch notification \u2192 raise ticket with order number; cancel still possible if not dispatched.

## Cancellation
- ONLY if not yet dispatched.
- Path: My Account \u2192 My Orders \u2192 select order \u2192 cancel/support with order number.
- Approved prepaid cancel: full refund to original payment method in 5\u20137 business days.
- Once dispatched: no cancel \u2014 use return after delivery if eligible.

## Returns & exchanges (delivered orders)
- NO cash/bank/UPI refund on successful delivery returns \u2014 store credit only, valid 1 year, site-wide.
- Return window: 7 days from delivery.
- Condition: unused, unwashed, original packaging, tags intact; clear photos of product + tags.
- Return handling fee: flat \u20B999 per order (pickup, QC, processing). Shipping & COD charges non-refundable.
- Size/product exchange: within 7 days, \u20B999 handling fee; pay difference if new item costs more; if less \u2192 balance as store credit.
- Partial returns/exchanges OK; fee once per order.
- Reverse pickup most locations; else self-ship, reimburse courier up to \u20B9200 with proof (\u20B999 fee still applies).
- Store credit typically within ~24h after pickup passes QC; follow up if not within 48h of pickup confirmation.
- Return window measured from request date if raised in time, even if pickup is late \u2014 customer should screenshot request.
- NOT eligible: personalized/custom, innerwear, swimwear, beauty, final sale, B1G1 offer orders (no partial cancel/return/exchange).
- Store credit CANNOT be converted to cash.

## Damaged / wrong / not received
- Damaged or wrong item: report within 48 hours of delivery with clear photos of product + packaging \u2192 replacement or store credit.
- Marked delivered but not received: contact within 24 hours of delivered status \u2014 beyond this, investigation often not possible. Check neighbour/security/door first; verify address/PIN.

## Payments & safety talking points
- COD is not safer than prepaid from a payment-security standpoint. Prepaid uses Shopify Level 1 PCI DSS etc.
- Prepaid thank-you: 5% off + free shipping (reduces RTO).
- Legit brand signals if asked: registered company Good Tribe Private Limited, Shark Tank India S3, institutional funding, 1.2M+ orders (as of Jul 2025 public coverage), own factory \u2014 never overclaim beyond public facts.

## Your tools
- lookup_order: by order_id and/or phone. Use before answering status/cancel/delay/delivery questions.
- list_orders_for_phone: when customer has multiple mock orders.
- If no order found: say so honestly, ask for correct LB order id, still answer pure policy questions.

## Response rules
1. Free-form intent. Never demand COD vs Prepaid buttons first.
2. Use real item names, dates, cities from tool results when available.
3. For overdue processing: empathy + facts + next step (ticket / cancel if pre-dispatch). Don't gaslight.
4. For bank/UPI/cash refund on a RETURN of a delivered order: ALWAYS say store credit only (1 year), \u20B999 fee \u2014 never invent bank refunds, never invent fake emails like support@brand.com. Real email is cx@littleboxindia.com. Only pre-dispatch CANCEL gets money back to original payment (5\u20137 business days).
5. For "is COD safer?": prepaid is equally/more secure infrastructure-wise; COD is preference not safety.
6. Escalate language when windows passed or judgment needed: guide to ticket / cx@littleboxindia.com / My Account with order number.
7. Keep replies WhatsApp-length: usually 2\u20136 short sentences or short bullets. No walls of text.
8. Never claim you are Littlebox staff in a legal sense for a production system \u2014 if asked what this is, you can say you're an AI support assistant demo using mock order data.
9. Never invent tracking IDs, refunds filed, or tickets created unless a tool said so. This demo is guidance + mock lookup; for "cancel" explain eligibility and the My Account path (you may say you'll note the request in demo context only if order is cancellable).
10. Indian English is fine (order number, pls, etc.) but stay clear.
11. On simple greetings ("hi"), do NOT dump order status unless they already mentioned an order. Just greet and ask how you can help.
12. Never invent phone numbers or email addresses. Only use: cx@littleboxindia.com, littleboxindia.com/account, WhatsApp support as described in policy.

## Demo order IDs (for your awareness if customer is testing)
LB10234 overdue processing \xB7 LB10235 normal processing \xB7 LB10236 dispatched \xB7 LB10237 delivered recent \xB7 LB10238 delivered old \xB7 LB10239 damage scenario

Today's date context will be provided in user messages. Use computed flags from tools as ground truth for windows.`;

// src/lib/agent.ts
function runTool(name, argsJson, defaultPhone) {
  let args = {};
  try {
    args = JSON.parse(argsJson || "{}");
  } catch {
    args = {};
  }
  if (name === "lookup_order") {
    const orderId = typeof args.order_id === "string" ? args.order_id : void 0;
    const phone = typeof args.phone === "string" ? args.phone : defaultPhone || void 0;
    if (orderId) {
      const order = getOrderById(orderId);
      if (order) return JSON.stringify({ found: true, order });
    }
    if (phone) {
      const list = getOrdersByPhone(phone);
      if (list.length === 1) return JSON.stringify({ found: true, order: list[0] });
      if (list.length > 1) {
        return JSON.stringify({
          found: true,
          multiple: true,
          orders: list,
          hint: "Ask which order if needed"
        });
      }
    }
    return JSON.stringify({
      found: false,
      message: "No matching mock order. Ask for order ID like LB10234.",
      demo_orders: listDemoOrdersSummary()
    });
  }
  if (name === "list_orders_for_phone") {
    const phone = typeof args.phone === "string" ? args.phone : defaultPhone || "";
    const list = getOrdersByPhone(phone);
    return JSON.stringify({ count: list.length, orders: list });
  }
  return JSON.stringify({ error: `Unknown tool: ${name}` });
}
__name(runTool, "runTool");
function isOrderIntent(text) {
  const t = text.toLowerCase();
  return /\b(lb\s*-?\s*\d{4,6}|\border\b|cancel|ship|dispatch|track|deliver|late|delay|weeks|return|exchange|damaged|wrong item|processing)\b/i.test(
    t
  ) || Boolean(extractOrderIdFromText(text));
}
__name(isOrderIntent, "isOrderIntent");
function isPurePolicyQuestion(text) {
  const t = text.toLowerCase();
  if (extractOrderIdFromText(text)) return false;
  return t.includes("cod") && (t.includes("safe") || t.includes("safer")) || t.includes("refund") && (t.includes("bank") || t.includes("upi") || t.includes("cash") || t.includes("return")) || t.includes("store credit") || t.includes("how long") && t.includes("support");
}
__name(isPurePolicyQuestion, "isPurePolicyQuestion");
function buildPrefetchContext(userText, phone, session) {
  const extracted = extractOrderIdFromText(userText);
  const orderId = extracted || (isPurePolicyQuestion(userText) ? void 0 : session?.lastOrderId);
  const chunks = [];
  if (orderId) {
    const order = getOrderById(orderId);
    if (order) {
      chunks.push(`Matched order ${orderId}:
${JSON.stringify(order, null, 2)}`);
    } else {
      chunks.push(`Order id ${orderId} not found in mock data.`);
    }
  }
  if (isOrderIntent(userText) && !isPurePolicyQuestion(userText)) {
    const byPhone = getOrdersByPhone(phone);
    if (byPhone.length) {
      chunks.push(
        `Orders for this WhatsApp number (${phone}):
${JSON.stringify(byPhone, null, 2)}`
      );
    }
  }
  return {
    context: chunks.join("\n\n"),
    lastOrderId: orderId || session?.lastOrderId
  };
}
__name(buildPrefetchContext, "buildPrefetchContext");
async function generateAgentReply(opts) {
  const { apiKey, model, userText, phone, session } = opts;
  const nowLine = `Current datetime (IST): ${(/* @__PURE__ */ new Date()).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata"
  })}`;
  const prefetch = buildPrefetchContext(userText, phone, session);
  if (isPurePolicyQuestion(userText)) {
    const det = deterministicFallback(userText, phone, prefetch.lastOrderId);
    if (det && !det.startsWith("Got it.")) {
      return { reply: det, lastOrderId: prefetch.lastOrderId };
    }
  }
  if (/^\s*(hi|hello|hey|hii|hlo|yo)\b[!.,\s]*$/i.test(userText.trim())) {
    return {
      reply: "Hey! I'm Maya \u2014 Littlebox support. What's going on: order delay, cancel, return, missing package, or something else? Order number helps if you have it.",
      lastOrderId: session?.lastOrderId
    };
  }
  const history = (session?.history || []).slice(-8);
  const userContent = [
    nowLine,
    `Customer WhatsApp: ${phone}`,
    prefetch.context ? `Prefetched system context:
${prefetch.context}` : "",
    `Customer message:
${userText}`
  ].filter(Boolean).join("\n\n");
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((h) => ({
      role: h.role,
      content: h.content
    })),
    { role: "user", content: userContent }
  ];
  try {
    let lastOrderId = prefetch.lastOrderId;
    for (let i = 0; i < 4; i++) {
      const completion = await chatWithTools({ apiKey, model, messages });
      const msg = completion.choices?.[0]?.message;
      if (!msg) break;
      if (msg.tool_calls?.length) {
        messages.push({
          role: "assistant",
          content: msg.content,
          tool_calls: msg.tool_calls
        });
        for (const tc of msg.tool_calls) {
          const result = runTool(tc.function.name, tc.function.arguments, phone);
          try {
            const parsed = JSON.parse(result);
            if (parsed.order?.order_id) lastOrderId = parsed.order.order_id;
            else if (parsed.orders?.[0]?.order_id)
              lastOrderId = parsed.orders[0].order_id;
          } catch {
          }
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            name: tc.function.name,
            content: result
          });
        }
        continue;
      }
      const text = (msg.content || "").trim();
      if (text) {
        return { reply: text, lastOrderId };
      }
      break;
    }
  } catch (err) {
    console.error("tool_loop_failed", err);
  }
  if (isPurePolicyQuestion(userText)) {
    const det = deterministicFallback(userText, phone, prefetch.lastOrderId);
    if (det && !det.startsWith("Got it.")) {
      return { reply: det, lastOrderId: prefetch.lastOrderId };
    }
  }
  try {
    const reply = await chatSimple({
      apiKey,
      model,
      system: SYSTEM_PROMPT,
      messages: [
        ...history,
        {
          role: "user",
          content: userContent
        }
      ],
      extraContext: prefetch.context || void 0
    });
    if (reply) {
      if (/return/i.test(userText) && /bank|upi|cash/i.test(userText) && /refund to your (bank|original)/i.test(reply) && !/store credit/i.test(reply)) {
        return {
          reply: deterministicFallback(userText, phone, prefetch.lastOrderId),
          lastOrderId: prefetch.lastOrderId
        };
      }
      return { reply, lastOrderId: prefetch.lastOrderId };
    }
  } catch (err) {
    console.error("simple_chat_failed", err);
  }
  return {
    reply: deterministicFallback(userText, phone, prefetch.lastOrderId),
    lastOrderId: prefetch.lastOrderId
  };
}
__name(generateAgentReply, "generateAgentReply");
function deterministicFallback(userText, phone, orderId) {
  const t = userText.toLowerCase();
  const order = orderId ? getOrderById(orderId) : getOrdersByPhone(phone)[0];
  if (/^\s*(hi|hello|hey|hii|hlo)\b/i.test(userText.trim())) {
    return "Hey! I'm Maya from Littlebox support. Share your order number (like LB10234) or tell me what's up \u2014 delay, cancel, return, missing package \u2014 and I'll sort it.";
  }
  if (t.includes("cod") && (t.includes("safe") || t.includes("safer"))) {
    return "Prepaid isn't less safe than COD here \u2014 checkout runs on Shopify with Level 1 PCI DSS, TLS, and 3D Secure. Card details aren't stored on Littlebox servers. COD is fine if you prefer it, but it's a preference, not a security upgrade. Prepaid also gets 5% off + free shipping.";
  }
  if (t.includes("return") && (t.includes("refund") || t.includes("bank") || t.includes("upi") || t.includes("cash"))) {
    return "For a return after delivery: Littlebox issues store credit only \u2014 not bank/UPI/cash. Credit is valid 1 year site-wide, and there's a flat \u20B999 return handling fee per order. Cash back to your original payment only happens if you cancel before dispatch. Want steps to raise a return from My Account?";
  }
  if (t.includes("bank") || t.includes("refund") || t.includes("upi")) {
    return "Two different paths: (1) Cancel before dispatch \u2192 prepaid refund to original payment in 5\u20137 business days. (2) Return after delivery \u2192 store credit only (1 year), \u20B999 handling fee \u2014 no bank/UPI. Share your order number if you want me to check which applies.";
  }
  if (t.includes("cancel")) {
    if (order?.computed.can_cancel_pre_dispatch) {
      return `Your ${order.item} (${order.order_id}) is still ${order.status}, so cancellation is possible. Go to My Account \u2192 My Orders \u2192 that order and raise cancel, or tell me to walk you through it. Prepaid refunds hit the original method in 5\u20137 business days if approved.`;
    }
    if (order && !order.computed.can_cancel_pre_dispatch) {
      return `${order.order_id} is already ${order.status}, so it can't be cancelled. After delivery you can return within 7 days for store credit (\u20B999 fee). Want the return steps?`;
    }
    return "I can check cancel eligibility \u2014 drop your order number (e.g. LB10234). Cancel works only before dispatch.";
  }
  if (t.includes("delivered") && (t.includes("not") || t.includes("never") || t.includes("didn't") || t.includes("didnt"))) {
    return "If tracking says delivered but you don't have the parcel: check security/neighbours/door first, then raise a ticket in My Account within 24 hours of the delivered update with your order number \u2014 after that window courier investigation usually can't start. Share your order ID and I'll check the mock status.";
  }
  if (t.includes("late") || t.includes("long") || t.includes("delay") || t.includes("weeks") || t.includes("ship")) {
    if (order) {
      if (order.computed.is_past_production_window) {
        return `Totally fair you're frustrated \u2014 ${order.order_id} (${order.item}) has been in processing for ${order.computed.days_since_order} days, past the usual 7\u201314 day production window. Raise a ticket with that order number via My Account or chat so the team can pull a real update. It's still pre-dispatch, so you can also cancel for a full prepaid refund (5\u20137 business days) if you don't want to wait.`;
      }
      return `${order.order_id} is ${order.status}. Littlebox stitches made-to-order: usually 7\u201314 days to dispatch, then 4\u20135 business days to deliver. You're about day ${order.computed.days_since_order} \u2014 I can keep an eye with you; if it crosses 14 days with no dispatch, we escalate.`;
    }
    return "Littlebox makes pieces after you order (not pre-stocked), so production is usually 7\u201314 days, then 4\u20135 days courier. Share your order number and I'll check where yours sits.";
  }
  return "Got it. Send your order number (like LB10234) and what you need \u2014 status, cancel, return, missing package, or a policy question \u2014 and I'll help right away.";
}
__name(deterministicFallback, "deterministicFallback");
function updateSession(prev, phone, userText, reply, lastOrderId) {
  const history = [...prev?.history || []];
  history.push({ role: "user", content: userText });
  history.push({ role: "assistant", content: reply });
  while (history.length > 12) history.shift();
  return {
    phone,
    lastOrderId: lastOrderId || prev?.lastOrderId,
    history,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(updateSession, "updateSession");

// src/lib/kapso.ts
function parseInboundWebhook(body) {
  if (!body || typeof body !== "object") return null;
  const root = body;
  const data = root.data || root;
  const message = data.message || root.message || data;
  if (!message || typeof message !== "object") return null;
  const type = String(message.type || root.type || "");
  if (type.includes("status") || root.event === "whatsapp.message.sent" || root.event === "whatsapp.message.delivered" || root.event === "whatsapp.message.read") {
    if (!message.from && !message.text && !message.text) {
      return null;
    }
  }
  const from = String(
    message.from || message.wa_id || message.kapso?.phone_number || data.from || ""
  ).replace(/\D/g, "");
  let text = "";
  if (typeof message.text === "string") text = message.text;
  else if (message.text && typeof message.text === "object") {
    text = String(message.text.body || "");
  } else if (typeof message.body === "string") {
    text = message.body;
  } else if (message.interactive && typeof message.interactive === "object") {
    const interactive = message.interactive;
    const button = interactive.button_reply;
    const list = interactive.list_reply;
    text = button?.title || button?.id || list?.title || list?.id || "";
  } else if (message.button && typeof message.button === "object") {
    text = String(message.button.text || "");
  } else if (typeof message.content === "string") {
    text = String(message.content);
  }
  const kapso = message.kapso;
  if (!text && kapso?.content && typeof kapso.content === "string") {
    text = kapso.content;
  }
  const direction = String(
    kapso?.direction || data.direction || root.direction || "inbound"
  ).toLowerCase();
  if (direction === "outbound" || direction === "outbound_message") {
    return null;
  }
  if (!from || !text.trim()) {
    const altText = root.text || data.text || "";
    if (!from || !String(altText).trim()) return null;
    return {
      from,
      text: String(altText).trim(),
      messageId: String(message.id || message.wamid || ""),
      rawType: type
    };
  }
  return {
    from,
    text: text.trim(),
    messageId: String(message.id || message.wamid || ""),
    conversationId: String(
      data.conversation?.id || message.conversation_id || ""
    ),
    rawType: type
  };
}
__name(parseInboundWebhook, "parseInboundWebhook");
async function verifyKapsoSignature(request, rawBody, secret) {
  if (!secret) return true;
  const header = request.headers.get("X-Webhook-Signature") || request.headers.get("x-webhook-signature") || "";
  if (!header) return false;
  const provided = header.replace(/^sha256=/i, "").trim();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody)
  );
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== provided.length) return false;
  let ok = 0;
  for (let i = 0; i < hex.length; i++) {
    ok |= hex.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return ok === 0;
}
__name(verifyKapsoSignature, "verifyKapsoSignature");
async function sendWhatsAppText(env2, to, body) {
  const phoneNumberId = env2.KAPSO_PHONE_NUMBER_ID;
  const apiKey = env2.KAPSO_API_KEY;
  if (!phoneNumberId || !apiKey) {
    return { ok: false, detail: "Missing KAPSO_PHONE_NUMBER_ID or KAPSO_API_KEY" };
  }
  const url = `https://api.kapso.ai/meta/whatsapp/v24.0/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ""),
      type: "text",
      text: { body: body.slice(0, 4e3) }
    })
  });
  const text = await res.text();
  if (!res.ok) {
    const alt = await fetch(
      `https://app.kapso.ai/api/meta/v24.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.replace(/\D/g, ""),
          type: "text",
          text: { body: body.slice(0, 4e3) }
        })
      }
    );
    const altText = await alt.text();
    if (!alt.ok) {
      return {
        ok: false,
        detail: `send failed ${res.status}: ${text.slice(0, 300)} | alt ${alt.status}: ${altText.slice(0, 200)}`
      };
    }
    return { ok: true, detail: altText.slice(0, 200) };
  }
  return { ok: true, detail: text.slice(0, 200) };
}
__name(sendWhatsAppText, "sendWhatsAppText");
async function markRead(env2, messageId) {
  if (!messageId) return;
  try {
    await fetch(
      `https://api.kapso.ai/meta/whatsapp/v24.0/${env2.KAPSO_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": env2.KAPSO_API_KEY
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId
        })
      }
    );
  } catch {
  }
}
__name(markRead, "markRead");

// src/index.ts
var index_default = {
  async fetch(request, env2, ctx) {
    const url = new URL(request.url);
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({
        ok: true,
        service: env2.DEMO_NAME || "littlebox-support-demo",
        endpoints: {
          webhook: "POST /webhooks/kapso",
          simulate: "POST /demo/simulate",
          health: "GET /health"
        },
        model: env2.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
        note: "Pitch prototype with mock orders only. Not affiliated with Littlebox India."
      });
    }
    if (request.method === "POST" && url.pathname === "/demo/simulate") {
      try {
        const body = await request.json();
        const phone = (body.phone || "919876543210").replace(/\D/g, "");
        const message = (body.message || "").trim();
        if (!message) return json({ error: "message required" }, 400);
        if (body.reset && env2.SESSIONS) {
          await env2.SESSIONS.delete(sessionKey(phone));
        }
        const session = await loadSession(env2, phone);
        const { reply, lastOrderId } = await generateAgentReply({
          apiKey: env2.OPENROUTER_API_KEY,
          model: env2.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
          userText: message,
          phone,
          session
        });
        const next = updateSession(session, phone, message, reply, lastOrderId);
        await saveSession(env2, next);
        return json({ phone, message, reply, lastOrderId: next.lastOrderId });
      } catch (err) {
        return json(
          { error: err instanceof Error ? err.message : "simulate failed" },
          500
        );
      }
    }
    if (request.method === "POST" && url.pathname === "/webhooks/kapso") {
      const rawBody = await request.text();
      const valid = await verifyKapsoSignature(
        request,
        rawBody,
        env2.KAPSO_WEBHOOK_SECRET
      );
      if (!valid) {
        return json({ error: "invalid signature" }, 401);
      }
      let payload;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return json({ error: "invalid json" }, 400);
      }
      ctx.waitUntil(handleInbound(env2, payload));
      return json({ received: true }, 200);
    }
    return json({ error: "not found" }, 404);
  }
};
async function handleInbound(env2, payload) {
  try {
    const inbound = parseInboundWebhook(payload);
    if (!inbound) {
      console.log("skip_non_inbound", JSON.stringify(payload).slice(0, 400));
      return;
    }
    if (inbound.messageId) {
      await markRead(env2, inbound.messageId);
    }
    const session = await loadSession(env2, inbound.from);
    const { reply, lastOrderId } = await generateAgentReply({
      apiKey: env2.OPENROUTER_API_KEY,
      model: env2.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
      userText: inbound.text,
      phone: inbound.from,
      session
    });
    const next = updateSession(
      session,
      inbound.from,
      inbound.text,
      reply,
      lastOrderId
    );
    await saveSession(env2, next);
    const sent = await sendWhatsAppText(env2, inbound.from, reply);
    if (!sent.ok) {
      console.error("send_failed", sent.detail);
    } else {
      console.log("replied", inbound.from, reply.slice(0, 80));
    }
  } catch (err) {
    console.error("handle_inbound_error", err);
  }
}
__name(handleInbound, "handleInbound");
function sessionKey(phone) {
  return `session:${phone.replace(/\D/g, "")}`;
}
__name(sessionKey, "sessionKey");
async function loadSession(env2, phone) {
  if (!env2.SESSIONS) return void 0;
  try {
    const raw = await env2.SESSIONS.get(sessionKey(phone));
    if (!raw) return void 0;
    return JSON.parse(raw);
  } catch {
    return void 0;
  }
}
__name(loadSession, "loadSession");
async function saveSession(env2, session) {
  if (!env2.SESSIONS) return;
  try {
    await env2.SESSIONS.put(sessionKey(session.phone), JSON.stringify(session), {
      expirationTtl: 60 * 60 * 24 * 7
    });
  } catch (err) {
    console.error("session_save_failed", err);
  }
}
__name(saveSession, "saveSession");
function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
__name(json, "json");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
