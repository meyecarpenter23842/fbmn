var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
var init_utils = __esm({
  "node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
    __name(notImplementedClass, "notImplementedClass");
  }
});

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance;
var init_performance = __esm({
  "node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
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
    PerformanceEntry = class {
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
    PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
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
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    PerformanceResourceTiming = class extends PerformanceEntry {
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
    PerformanceObserverEntryList = class {
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
    Performance = class {
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
    PerformanceObserver = class {
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
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});

// node_modules/unenv/dist/runtime/node/perf_hooks.mjs
var init_perf_hooks = __esm({
  "node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_performance();
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
var init_performance2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    globalThis.performance = performance;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default;
var init_noop = __esm({
  "node_modules/unenv/dist/runtime/mock/noop.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
  }
});

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";
var _console, _ignoreErrors, _stderr, _stdout, log, info, trace, debug, table, error, warn, createTask, clear, count, countReset, dir, dirxml, group, groupEnd, groupCollapsed, profile, profileEnd, time, timeEnd, timeLog, timeStamp, Console, _times, _stdoutErrorHandler, _stderrErrorHandler;
var init_console = __esm({
  "node_modules/unenv/dist/runtime/node/console.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_noop();
    init_utils();
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable();
    _stdout = new Writable();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
    _times = /* @__PURE__ */ new Map();
    _stdoutErrorHandler = noop_default;
    _stderrErrorHandler = noop_default;
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole, assert, clear2, context, count2, countReset2, createTask2, debug2, dir2, dirxml2, error2, group2, groupCollapsed2, groupEnd2, info2, log2, profile2, profileEnd2, table2, time2, timeEnd2, timeLog2, timeStamp2, trace2, warn2, console_default;
var init_console2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_console();
    workerdConsole = globalThis["console"];
    ({
      assert,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask2
      ),
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
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler,
      _stdout,
      _stdoutErrorHandler,
      _times
    });
    console_default = workerdConsole;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console"() {
    init_console2();
    globalThis.console = console_default;
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime;
var init_hrtime = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
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
  }
});

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream;
var init_read_stream = __esm({
  "node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ReadStream = class {
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
  }
});

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream;
var init_write_stream = __esm({
  "node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WriteStream = class {
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
      write(str2, encoding, cb) {
        if (str2 instanceof Uint8Array) {
          str2 = new TextDecoder().decode(str2);
        }
        try {
          console.log(str2);
        } catch {
        }
        cb && typeof cb === "function" && cb();
        return false;
      }
    };
  }
});

// node_modules/unenv/dist/runtime/node/tty.mjs
var init_tty = __esm({
  "node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION;
var init_node_version = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    NODE_VERSION = "22.14.0";
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";
var Process;
var init_process = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tty();
    init_utils();
    init_node_version();
    Process = class _Process extends EventEmitter {
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
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess, getBuiltinModule, exit, platform, nextTick, unenvProcess, abort, addListener, allowedNodeEnvironmentFlags, hasUncaughtExceptionCaptureCallback, setUncaughtExceptionCaptureCallback, loadEnvFile, sourceMapsEnabled, arch, argv, argv0, chdir, config, connected, constrainedMemory, availableMemory, cpuUsage, cwd, debugPort, dlopen, disconnect, emit, emitWarning, env, eventNames, execArgv, execPath, finalization, features, getActiveResourcesInfo, getMaxListeners, hrtime3, kill, listeners, listenerCount, memoryUsage, on, off, once, pid, ppid, prependListener, prependOnceListener, rawListeners, release, removeAllListeners, removeListener, report, resourceUsage, setMaxListeners, setSourceMapsEnabled, stderr, stdin, stdout, title, throwDeprecation, traceDeprecation, umask, uptime, version, versions, domain, initgroups, moduleLoadList, reallyExit, openStdin, assert2, binding, send, exitCode, channel, getegid, geteuid, getgid, getgroups, getuid, setegid, seteuid, setgid, setgroups, setuid, permission, mainModule, _events, _eventsCount, _exiting, _maxListeners, _debugEnd, _debugProcess, _fatalException, _getActiveHandles, _getActiveRequests, _kill, _preload_modules, _rawDebug, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, _disconnect, _handleQueue, _pendingMessage, _channel, _send, _linkedBinding, _process, process_default;
var init_process2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    ({ exit, platform, nextTick } = getBuiltinModule(
      "node:process"
    ));
    unenvProcess = new Process({
      env: globalProcess.env,
      hrtime,
      nextTick
    });
    ({
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
      finalization,
      features,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      on,
      off,
      once,
      pid,
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
    } = unenvProcess);
    _process = {
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
    process_default = _process;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});

// node-built-in-modules:events
import libDefault from "events";
var require_events = __commonJS({
  "node-built-in-modules:events"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault;
  }
});

// node_modules/postgres-array/index.js
var require_postgres_array = __commonJS({
  "node_modules/postgres-array/index.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    exports.parse = function(source, transform) {
      return new ArrayParser(source, transform).parse();
    };
    var ArrayParser = class _ArrayParser {
      static {
        __name(this, "ArrayParser");
      }
      constructor(source, transform) {
        this.source = source;
        this.transform = transform || identity;
        this.position = 0;
        this.entries = [];
        this.recorded = [];
        this.dimension = 0;
      }
      isEof() {
        return this.position >= this.source.length;
      }
      nextCharacter() {
        var character = this.source[this.position++];
        if (character === "\\") {
          return {
            value: this.source[this.position++],
            escaped: true
          };
        }
        return {
          value: character,
          escaped: false
        };
      }
      record(character) {
        this.recorded.push(character);
      }
      newEntry(includeEmpty) {
        var entry;
        if (this.recorded.length > 0 || includeEmpty) {
          entry = this.recorded.join("");
          if (entry === "NULL" && !includeEmpty) {
            entry = null;
          }
          if (entry !== null) entry = this.transform(entry);
          this.entries.push(entry);
          this.recorded = [];
        }
      }
      consumeDimensions() {
        if (this.source[0] === "[") {
          while (!this.isEof()) {
            var char = this.nextCharacter();
            if (char.value === "=") break;
          }
        }
      }
      parse(nested) {
        var character, parser, quote;
        this.consumeDimensions();
        while (!this.isEof()) {
          character = this.nextCharacter();
          if (character.value === "{" && !quote) {
            this.dimension++;
            if (this.dimension > 1) {
              parser = new _ArrayParser(this.source.substr(this.position - 1), this.transform);
              this.entries.push(parser.parse(true));
              this.position += parser.position - 2;
            }
          } else if (character.value === "}" && !quote) {
            this.dimension--;
            if (!this.dimension) {
              this.newEntry();
              if (nested) return this.entries;
            }
          } else if (character.value === '"' && !character.escaped) {
            if (quote) this.newEntry(true);
            quote = !quote;
          } else if (character.value === "," && !quote) {
            this.newEntry();
          } else {
            this.record(character.value);
          }
        }
        if (this.dimension !== 0) {
          throw new Error("array dimension not balanced");
        }
        return this.entries;
      }
    };
    function identity(value) {
      return value;
    }
    __name(identity, "identity");
  }
});

// node_modules/pg-types/lib/arrayParser.js
var require_arrayParser = __commonJS({
  "node_modules/pg-types/lib/arrayParser.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var array = require_postgres_array();
    module.exports = {
      create: /* @__PURE__ */ __name(function(source, transform) {
        return {
          parse: /* @__PURE__ */ __name(function() {
            return array.parse(source, transform);
          }, "parse")
        };
      }, "create")
    };
  }
});

// node_modules/postgres-date/index.js
var require_postgres_date = __commonJS({
  "node_modules/postgres-date/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var DATE_TIME = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/;
    var DATE = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/;
    var TIME_ZONE = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/;
    var INFINITY = /^-?infinity$/;
    module.exports = /* @__PURE__ */ __name(function parseDate(isoDate) {
      if (INFINITY.test(isoDate)) {
        return Number(isoDate.replace("i", "I"));
      }
      var matches = DATE_TIME.exec(isoDate);
      if (!matches) {
        return getDate(isoDate) || null;
      }
      var isBC = !!matches[8];
      var year = parseInt(matches[1], 10);
      if (isBC) {
        year = bcYearToNegativeYear(year);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day = matches[3];
      var hour = parseInt(matches[4], 10);
      var minute = parseInt(matches[5], 10);
      var second = parseInt(matches[6], 10);
      var ms = matches[7];
      ms = ms ? 1e3 * parseFloat(ms) : 0;
      var date;
      var offset = timeZoneOffset(isoDate);
      if (offset != null) {
        date = new Date(Date.UTC(year, month, day, hour, minute, second, ms));
        if (is0To99(year)) {
          date.setUTCFullYear(year);
        }
        if (offset !== 0) {
          date.setTime(date.getTime() - offset);
        }
      } else {
        date = new Date(year, month, day, hour, minute, second, ms);
        if (is0To99(year)) {
          date.setFullYear(year);
        }
      }
      return date;
    }, "parseDate");
    function getDate(isoDate) {
      var matches = DATE.exec(isoDate);
      if (!matches) {
        return;
      }
      var year = parseInt(matches[1], 10);
      var isBC = !!matches[4];
      if (isBC) {
        year = bcYearToNegativeYear(year);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day = matches[3];
      var date = new Date(year, month, day);
      if (is0To99(year)) {
        date.setFullYear(year);
      }
      return date;
    }
    __name(getDate, "getDate");
    function timeZoneOffset(isoDate) {
      if (isoDate.endsWith("+00")) {
        return 0;
      }
      var zone = TIME_ZONE.exec(isoDate.split(" ")[1]);
      if (!zone) return;
      var type = zone[1];
      if (type === "Z") {
        return 0;
      }
      var sign = type === "-" ? -1 : 1;
      var offset = parseInt(zone[2], 10) * 3600 + parseInt(zone[3] || 0, 10) * 60 + parseInt(zone[4] || 0, 10);
      return offset * sign * 1e3;
    }
    __name(timeZoneOffset, "timeZoneOffset");
    function bcYearToNegativeYear(year) {
      return -(year - 1);
    }
    __name(bcYearToNegativeYear, "bcYearToNegativeYear");
    function is0To99(num) {
      return num >= 0 && num < 100;
    }
    __name(is0To99, "is0To99");
  }
});

// node_modules/xtend/mutable.js
var require_mutable = __commonJS({
  "node_modules/xtend/mutable.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = extend;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function extend(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key2 in source) {
          if (hasOwnProperty.call(source, key2)) {
            target[key2] = source[key2];
          }
        }
      }
      return target;
    }
    __name(extend, "extend");
  }
});

// node_modules/postgres-interval/index.js
var require_postgres_interval = __commonJS({
  "node_modules/postgres-interval/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var extend = require_mutable();
    module.exports = PostgresInterval;
    function PostgresInterval(raw) {
      if (!(this instanceof PostgresInterval)) {
        return new PostgresInterval(raw);
      }
      extend(this, parse(raw));
    }
    __name(PostgresInterval, "PostgresInterval");
    var properties = ["seconds", "minutes", "hours", "days", "months", "years"];
    PostgresInterval.prototype.toPostgres = function() {
      var filtered = properties.filter(this.hasOwnProperty, this);
      if (this.milliseconds && filtered.indexOf("seconds") < 0) {
        filtered.push("seconds");
      }
      if (filtered.length === 0) return "0";
      return filtered.map(function(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/\.?0+$/, "");
        }
        return value + " " + property;
      }, this).join(" ");
    };
    var propertiesISOEquivalent = {
      years: "Y",
      months: "M",
      days: "D",
      hours: "H",
      minutes: "M",
      seconds: "S"
    };
    var dateProperties = ["years", "months", "days"];
    var timeProperties = ["hours", "minutes", "seconds"];
    PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO = function() {
      var datePart = dateProperties.map(buildProperty, this).join("");
      var timePart = timeProperties.map(buildProperty, this).join("");
      return "P" + datePart + "T" + timePart;
      function buildProperty(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/0+$/, "");
        }
        return value + propertiesISOEquivalent[property];
      }
      __name(buildProperty, "buildProperty");
    };
    var NUMBER = "([+-]?\\d+)";
    var YEAR = NUMBER + "\\s+years?";
    var MONTH = NUMBER + "\\s+mons?";
    var DAY = NUMBER + "\\s+days?";
    var TIME = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?";
    var INTERVAL = new RegExp([YEAR, MONTH, DAY, TIME].map(function(regexString) {
      return "(" + regexString + ")?";
    }).join("\\s*"));
    var positions = {
      years: 2,
      months: 4,
      days: 6,
      hours: 9,
      minutes: 10,
      seconds: 11,
      milliseconds: 12
    };
    var negatives = ["hours", "minutes", "seconds", "milliseconds"];
    function parseMilliseconds(fraction) {
      var microseconds = fraction + "000000".slice(fraction.length);
      return parseInt(microseconds, 10) / 1e3;
    }
    __name(parseMilliseconds, "parseMilliseconds");
    function parse(interval) {
      if (!interval) return {};
      var matches = INTERVAL.exec(interval);
      var isNegative = matches[8] === "-";
      return Object.keys(positions).reduce(function(parsed, property) {
        var position = positions[property];
        var value = matches[position];
        if (!value) return parsed;
        value = property === "milliseconds" ? parseMilliseconds(value) : parseInt(value, 10);
        if (!value) return parsed;
        if (isNegative && ~negatives.indexOf(property)) {
          value *= -1;
        }
        parsed[property] = value;
        return parsed;
      }, {});
    }
    __name(parse, "parse");
  }
});

// node_modules/postgres-bytea/index.js
var require_postgres_bytea = __commonJS({
  "node_modules/postgres-bytea/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var bufferFrom = Buffer.from || Buffer;
    module.exports = /* @__PURE__ */ __name(function parseBytea(input) {
      if (/^\\x/.test(input)) {
        return bufferFrom(input.substr(2), "hex");
      }
      var output = "";
      var i = 0;
      while (i < input.length) {
        if (input[i] !== "\\") {
          output += input[i];
          ++i;
        } else {
          if (/[0-7]{3}/.test(input.substr(i + 1, 3))) {
            output += String.fromCharCode(parseInt(input.substr(i + 1, 3), 8));
            i += 4;
          } else {
            var backslashes = 1;
            while (i + backslashes < input.length && input[i + backslashes] === "\\") {
              backslashes++;
            }
            for (var k = 0; k < Math.floor(backslashes / 2); ++k) {
              output += "\\";
            }
            i += Math.floor(backslashes / 2) * 2;
          }
        }
      }
      return bufferFrom(output, "binary");
    }, "parseBytea");
  }
});

// node_modules/pg-types/lib/textParsers.js
var require_textParsers = __commonJS({
  "node_modules/pg-types/lib/textParsers.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var array = require_postgres_array();
    var arrayParser = require_arrayParser();
    var parseDate = require_postgres_date();
    var parseInterval = require_postgres_interval();
    var parseByteA = require_postgres_bytea();
    function allowNull(fn) {
      return /* @__PURE__ */ __name(function nullAllowed(value) {
        if (value === null) return value;
        return fn(value);
      }, "nullAllowed");
    }
    __name(allowNull, "allowNull");
    function parseBool(value) {
      if (value === null) return value;
      return value === "TRUE" || value === "t" || value === "true" || value === "y" || value === "yes" || value === "on" || value === "1";
    }
    __name(parseBool, "parseBool");
    function parseBoolArray(value) {
      if (!value) return null;
      return array.parse(value, parseBool);
    }
    __name(parseBoolArray, "parseBoolArray");
    function parseBaseTenInt(string) {
      return parseInt(string, 10);
    }
    __name(parseBaseTenInt, "parseBaseTenInt");
    function parseIntegerArray(value) {
      if (!value) return null;
      return array.parse(value, allowNull(parseBaseTenInt));
    }
    __name(parseIntegerArray, "parseIntegerArray");
    function parseBigIntegerArray(value) {
      if (!value) return null;
      return array.parse(value, allowNull(function(entry) {
        return parseBigInteger(entry).trim();
      }));
    }
    __name(parseBigIntegerArray, "parseBigIntegerArray");
    var parsePointArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parsePoint(entry);
        }
        return entry;
      });
      return p.parse();
    }, "parsePointArray");
    var parseFloatArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseFloat(entry);
        }
        return entry;
      });
      return p.parse();
    }, "parseFloatArray");
    var parseStringArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value);
      return p.parse();
    }, "parseStringArray");
    var parseDateArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseDate(entry);
        }
        return entry;
      });
      return p.parse();
    }, "parseDateArray");
    var parseIntervalArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseInterval(entry);
        }
        return entry;
      });
      return p.parse();
    }, "parseIntervalArray");
    var parseByteAArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(parseByteA));
    }, "parseByteAArray");
    var parseInteger = /* @__PURE__ */ __name(function(value) {
      return parseInt(value, 10);
    }, "parseInteger");
    var parseBigInteger = /* @__PURE__ */ __name(function(value) {
      var valStr = String(value);
      if (/^\d+$/.test(valStr)) {
        return valStr;
      }
      return value;
    }, "parseBigInteger");
    var parseJsonArray = /* @__PURE__ */ __name(function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(JSON.parse));
    }, "parseJsonArray");
    var parsePoint = /* @__PURE__ */ __name(function(value) {
      if (value[0] !== "(") {
        return null;
      }
      value = value.substring(1, value.length - 1).split(",");
      return {
        x: parseFloat(value[0]),
        y: parseFloat(value[1])
      };
    }, "parsePoint");
    var parseCircle = /* @__PURE__ */ __name(function(value) {
      if (value[0] !== "<" && value[1] !== "(") {
        return null;
      }
      var point = "(";
      var radius = "";
      var pointParsed = false;
      for (var i = 2; i < value.length - 1; i++) {
        if (!pointParsed) {
          point += value[i];
        }
        if (value[i] === ")") {
          pointParsed = true;
          continue;
        } else if (!pointParsed) {
          continue;
        }
        if (value[i] === ",") {
          continue;
        }
        radius += value[i];
      }
      var result = parsePoint(point);
      result.radius = parseFloat(radius);
      return result;
    }, "parseCircle");
    var init = /* @__PURE__ */ __name(function(register) {
      register(20, parseBigInteger);
      register(21, parseInteger);
      register(23, parseInteger);
      register(26, parseInteger);
      register(700, parseFloat);
      register(701, parseFloat);
      register(16, parseBool);
      register(1082, parseDate);
      register(1114, parseDate);
      register(1184, parseDate);
      register(600, parsePoint);
      register(651, parseStringArray);
      register(718, parseCircle);
      register(1e3, parseBoolArray);
      register(1001, parseByteAArray);
      register(1005, parseIntegerArray);
      register(1007, parseIntegerArray);
      register(1028, parseIntegerArray);
      register(1016, parseBigIntegerArray);
      register(1017, parsePointArray);
      register(1021, parseFloatArray);
      register(1022, parseFloatArray);
      register(1231, parseFloatArray);
      register(1014, parseStringArray);
      register(1015, parseStringArray);
      register(1008, parseStringArray);
      register(1009, parseStringArray);
      register(1040, parseStringArray);
      register(1041, parseStringArray);
      register(1115, parseDateArray);
      register(1182, parseDateArray);
      register(1185, parseDateArray);
      register(1186, parseInterval);
      register(1187, parseIntervalArray);
      register(17, parseByteA);
      register(114, JSON.parse.bind(JSON));
      register(3802, JSON.parse.bind(JSON));
      register(199, parseJsonArray);
      register(3807, parseJsonArray);
      register(3907, parseStringArray);
      register(2951, parseStringArray);
      register(791, parseStringArray);
      register(1183, parseStringArray);
      register(1270, parseStringArray);
    }, "init");
    module.exports = {
      init
    };
  }
});

// node_modules/pg-int8/index.js
var require_pg_int8 = __commonJS({
  "node_modules/pg-int8/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var BASE = 1e6;
    function readInt8(buffer) {
      var high = buffer.readInt32BE(0);
      var low = buffer.readUInt32BE(4);
      var sign = "";
      if (high < 0) {
        high = ~high + (low === 0);
        low = ~low + 1 >>> 0;
        sign = "-";
      }
      var result = "";
      var carry;
      var t;
      var digits;
      var pad;
      var l;
      var i;
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        t = 4294967296 * carry + low;
        digits = "" + t % BASE;
        return sign + digits + result;
      }
    }
    __name(readInt8, "readInt8");
    module.exports = readInt8;
  }
});

// node_modules/pg-types/lib/binaryParsers.js
var require_binaryParsers = __commonJS({
  "node_modules/pg-types/lib/binaryParsers.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var parseInt64 = require_pg_int8();
    var parseBits = /* @__PURE__ */ __name(function(data, bits, offset, invert, callback) {
      offset = offset || 0;
      invert = invert || false;
      callback = callback || function(lastValue, newValue, bits2) {
        return lastValue * Math.pow(2, bits2) + newValue;
      };
      var offsetBytes = offset >> 3;
      var inv = /* @__PURE__ */ __name(function(value) {
        if (invert) {
          return ~value & 255;
        }
        return value;
      }, "inv");
      var mask = 255;
      var firstBits = 8 - offset % 8;
      if (bits < firstBits) {
        mask = 255 << 8 - bits & 255;
        firstBits = bits;
      }
      if (offset) {
        mask = mask >> offset % 8;
      }
      var result = 0;
      if (offset % 8 + bits >= 8) {
        result = callback(0, inv(data[offsetBytes]) & mask, firstBits);
      }
      var bytes2 = bits + offset >> 3;
      for (var i = offsetBytes + 1; i < bytes2; i++) {
        result = callback(result, inv(data[i]), 8);
      }
      var lastBits = (bits + offset) % 8;
      if (lastBits > 0) {
        result = callback(result, inv(data[bytes2]) >> 8 - lastBits, lastBits);
      }
      return result;
    }, "parseBits");
    var parseFloatFromBits = /* @__PURE__ */ __name(function(data, precisionBits, exponentBits) {
      var bias = Math.pow(2, exponentBits - 1) - 1;
      var sign = parseBits(data, 1);
      var exponent = parseBits(data, exponentBits, 1);
      if (exponent === 0) {
        return 0;
      }
      var precisionBitsCounter = 1;
      var parsePrecisionBits = /* @__PURE__ */ __name(function(lastValue, newValue, bits) {
        if (lastValue === 0) {
          lastValue = 1;
        }
        for (var i = 1; i <= bits; i++) {
          precisionBitsCounter /= 2;
          if ((newValue & 1 << bits - i) > 0) {
            lastValue += precisionBitsCounter;
          }
        }
        return lastValue;
      }, "parsePrecisionBits");
      var mantissa = parseBits(data, precisionBits, exponentBits + 1, false, parsePrecisionBits);
      if (exponent == Math.pow(2, exponentBits + 1) - 1) {
        if (mantissa === 0) {
          return sign === 0 ? Infinity : -Infinity;
        }
        return NaN;
      }
      return (sign === 0 ? 1 : -1) * Math.pow(2, exponent - bias) * mantissa;
    }, "parseFloatFromBits");
    var parseInt16 = /* @__PURE__ */ __name(function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 15, 1, true) + 1);
      }
      return parseBits(value, 15, 1);
    }, "parseInt16");
    var parseInt32 = /* @__PURE__ */ __name(function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 31, 1, true) + 1);
      }
      return parseBits(value, 31, 1);
    }, "parseInt32");
    var parseFloat32 = /* @__PURE__ */ __name(function(value) {
      return parseFloatFromBits(value, 23, 8);
    }, "parseFloat32");
    var parseFloat64 = /* @__PURE__ */ __name(function(value) {
      return parseFloatFromBits(value, 52, 11);
    }, "parseFloat64");
    var parseNumeric = /* @__PURE__ */ __name(function(value) {
      var sign = parseBits(value, 16, 32);
      if (sign == 49152) {
        return NaN;
      }
      var weight = Math.pow(1e4, parseBits(value, 16, 16));
      var result = 0;
      var digits = [];
      var ndigits = parseBits(value, 16);
      for (var i = 0; i < ndigits; i++) {
        result += parseBits(value, 16, 64 + 16 * i) * weight;
        weight /= 1e4;
      }
      var scale = Math.pow(10, parseBits(value, 16, 48));
      return (sign === 0 ? 1 : -1) * Math.round(result * scale) / scale;
    }, "parseNumeric");
    var parseDate = /* @__PURE__ */ __name(function(isUTC, value) {
      var sign = parseBits(value, 1);
      var rawValue = parseBits(value, 63, 1);
      var result = new Date((sign === 0 ? 1 : -1) * rawValue / 1e3 + 9466848e5);
      if (!isUTC) {
        result.setTime(result.getTime() + result.getTimezoneOffset() * 6e4);
      }
      result.usec = rawValue % 1e3;
      result.getMicroSeconds = function() {
        return this.usec;
      };
      result.setMicroSeconds = function(value2) {
        this.usec = value2;
      };
      result.getUTCMicroSeconds = function() {
        return this.usec;
      };
      return result;
    }, "parseDate");
    var parseArray = /* @__PURE__ */ __name(function(value) {
      var dim = parseBits(value, 32);
      var flags = parseBits(value, 32, 32);
      var elementType = parseBits(value, 32, 64);
      var offset = 96;
      var dims = [];
      for (var i = 0; i < dim; i++) {
        dims[i] = parseBits(value, 32, offset);
        offset += 32;
        offset += 32;
      }
      var parseElement = /* @__PURE__ */ __name(function(elementType2) {
        var length = parseBits(value, 32, offset);
        offset += 32;
        if (length == 4294967295) {
          return null;
        }
        var result;
        if (elementType2 == 23 || elementType2 == 20) {
          result = parseBits(value, length * 8, offset);
          offset += length * 8;
          return result;
        } else if (elementType2 == 25) {
          result = value.toString(this.encoding, offset >> 3, (offset += length << 3) >> 3);
          return result;
        } else {
          console.log("ERROR: ElementType not implemented: " + elementType2);
        }
      }, "parseElement");
      var parse = /* @__PURE__ */ __name(function(dimension, elementType2) {
        var array = [];
        var i2;
        if (dimension.length > 1) {
          var count3 = dimension.shift();
          for (i2 = 0; i2 < count3; i2++) {
            array[i2] = parse(dimension, elementType2);
          }
          dimension.unshift(count3);
        } else {
          for (i2 = 0; i2 < dimension[0]; i2++) {
            array[i2] = parseElement(elementType2);
          }
        }
        return array;
      }, "parse");
      return parse(dims, elementType);
    }, "parseArray");
    var parseText = /* @__PURE__ */ __name(function(value) {
      return value.toString("utf8");
    }, "parseText");
    var parseBool = /* @__PURE__ */ __name(function(value) {
      if (value === null) return null;
      return parseBits(value, 8) > 0;
    }, "parseBool");
    var init = /* @__PURE__ */ __name(function(register) {
      register(20, parseInt64);
      register(21, parseInt16);
      register(23, parseInt32);
      register(26, parseInt32);
      register(1700, parseNumeric);
      register(700, parseFloat32);
      register(701, parseFloat64);
      register(16, parseBool);
      register(1114, parseDate.bind(null, false));
      register(1184, parseDate.bind(null, true));
      register(1e3, parseArray);
      register(1007, parseArray);
      register(1016, parseArray);
      register(1008, parseArray);
      register(1009, parseArray);
      register(25, parseText);
    }, "init");
    module.exports = {
      init
    };
  }
});

// node_modules/pg-types/lib/builtins.js
var require_builtins = __commonJS({
  "node_modules/pg-types/lib/builtins.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = {
      BOOL: 16,
      BYTEA: 17,
      CHAR: 18,
      INT8: 20,
      INT2: 21,
      INT4: 23,
      REGPROC: 24,
      TEXT: 25,
      OID: 26,
      TID: 27,
      XID: 28,
      CID: 29,
      JSON: 114,
      XML: 142,
      PG_NODE_TREE: 194,
      SMGR: 210,
      PATH: 602,
      POLYGON: 604,
      CIDR: 650,
      FLOAT4: 700,
      FLOAT8: 701,
      ABSTIME: 702,
      RELTIME: 703,
      TINTERVAL: 704,
      CIRCLE: 718,
      MACADDR8: 774,
      MONEY: 790,
      MACADDR: 829,
      INET: 869,
      ACLITEM: 1033,
      BPCHAR: 1042,
      VARCHAR: 1043,
      DATE: 1082,
      TIME: 1083,
      TIMESTAMP: 1114,
      TIMESTAMPTZ: 1184,
      INTERVAL: 1186,
      TIMETZ: 1266,
      BIT: 1560,
      VARBIT: 1562,
      NUMERIC: 1700,
      REFCURSOR: 1790,
      REGPROCEDURE: 2202,
      REGOPER: 2203,
      REGOPERATOR: 2204,
      REGCLASS: 2205,
      REGTYPE: 2206,
      UUID: 2950,
      TXID_SNAPSHOT: 2970,
      PG_LSN: 3220,
      PG_NDISTINCT: 3361,
      PG_DEPENDENCIES: 3402,
      TSVECTOR: 3614,
      TSQUERY: 3615,
      GTSVECTOR: 3642,
      REGCONFIG: 3734,
      REGDICTIONARY: 3769,
      JSONB: 3802,
      REGNAMESPACE: 4089,
      REGROLE: 4096
    };
  }
});

// node_modules/pg-types/index.js
var require_pg_types = __commonJS({
  "node_modules/pg-types/index.js"(exports) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var textParsers = require_textParsers();
    var binaryParsers = require_binaryParsers();
    var arrayParser = require_arrayParser();
    var builtinTypes = require_builtins();
    exports.getTypeParser = getTypeParser;
    exports.setTypeParser = setTypeParser;
    exports.arrayParser = arrayParser;
    exports.builtins = builtinTypes;
    var typeParsers = {
      text: {},
      binary: {}
    };
    function noParse(val) {
      return String(val);
    }
    __name(noParse, "noParse");
    function getTypeParser(oid, format) {
      format = format || "text";
      if (!typeParsers[format]) {
        return noParse;
      }
      return typeParsers[format][oid] || noParse;
    }
    __name(getTypeParser, "getTypeParser");
    function setTypeParser(oid, format, parseFn) {
      if (typeof format == "function") {
        parseFn = format;
        format = "text";
      }
      typeParsers[format][oid] = parseFn;
    }
    __name(setTypeParser, "setTypeParser");
    textParsers.init(function(oid, converter) {
      typeParsers.text[oid] = converter;
    });
    binaryParsers.init(function(oid, converter) {
      typeParsers.binary[oid] = converter;
    });
  }
});

// node_modules/pg/lib/defaults.js
var require_defaults = __commonJS({
  "node_modules/pg/lib/defaults.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = {
      // database host. defaults to localhost
      host: "localhost",
      // database user's name
      user: process.platform === "win32" ? process.env.USERNAME : process.env.USER,
      // name of database to connect
      database: void 0,
      // database user's password
      password: null,
      // a Postgres connection string to be used instead of setting individual connection items
      // NOTE:  Setting this value will cause it to override any other value (such as database or user) defined
      // in the defaults object.
      connectionString: void 0,
      // database port
      port: 5432,
      // number of rows to return at a time from a prepared statement's
      // portal. 0 will return all rows at once
      rows: 0,
      // binary result mode
      binary: false,
      // Connection pool options - see https://github.com/brianc/node-pg-pool
      // number of connections to use in connection pool
      // 0 will disable connection pooling
      max: 10,
      // max milliseconds a client can go unused before it is removed
      // from the pool and destroyed
      idleTimeoutMillis: 3e4,
      client_encoding: "",
      ssl: false,
      application_name: void 0,
      fallback_application_name: void 0,
      options: void 0,
      parseInputDatesAsUTC: false,
      // max milliseconds any query using this connection will execute for before timing out in error.
      // false=unlimited
      statement_timeout: false,
      // Abort any statement that waits longer than the specified duration in milliseconds while attempting to acquire a lock.
      // false=unlimited
      lock_timeout: false,
      // Terminate any session with an open transaction that has been idle for longer than the specified duration in milliseconds
      // false=unlimited
      idle_in_transaction_session_timeout: false,
      // max milliseconds to wait for query to complete (client side)
      query_timeout: false,
      connect_timeout: 0,
      keepalives: 1,
      keepalives_idle: 0
    };
    var pgTypes = require_pg_types();
    var parseBigInteger = pgTypes.getTypeParser(20, "text");
    var parseBigIntegerArray = pgTypes.getTypeParser(1016, "text");
    module.exports.__defineSetter__("parseInt8", function(val) {
      pgTypes.setTypeParser(20, "text", val ? pgTypes.getTypeParser(23, "text") : parseBigInteger);
      pgTypes.setTypeParser(1016, "text", val ? pgTypes.getTypeParser(1007, "text") : parseBigIntegerArray);
    });
  }
});

// node-built-in-modules:util
import libDefault2 from "util";
var require_util = __commonJS({
  "node-built-in-modules:util"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault2;
  }
});

// node_modules/pg/lib/utils.js
var require_utils = __commonJS({
  "node_modules/pg/lib/utils.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var defaults2 = require_defaults();
    var util = require_util();
    var { isDate } = util.types || util;
    function escapeElement(elementRepresentation) {
      const escaped = elementRepresentation.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return '"' + escaped + '"';
    }
    __name(escapeElement, "escapeElement");
    function arrayString(val) {
      let result = "{";
      for (let i = 0; i < val.length; i++) {
        if (i > 0) {
          result = result + ",";
        }
        if (val[i] === null || typeof val[i] === "undefined") {
          result = result + "NULL";
        } else if (Array.isArray(val[i])) {
          result = result + arrayString(val[i]);
        } else if (ArrayBuffer.isView(val[i])) {
          let item = val[i];
          if (!(item instanceof Buffer)) {
            const buf = Buffer.from(item.buffer, item.byteOffset, item.byteLength);
            if (buf.length === item.byteLength) {
              item = buf;
            } else {
              item = buf.slice(item.byteOffset, item.byteOffset + item.byteLength);
            }
          }
          result += "\\\\x" + item.toString("hex");
        } else {
          result += escapeElement(prepareValue(val[i]));
        }
      }
      result = result + "}";
      return result;
    }
    __name(arrayString, "arrayString");
    var prepareValue = /* @__PURE__ */ __name(function(val, seen) {
      if (val == null) {
        return null;
      }
      if (typeof val === "object") {
        if (val instanceof Buffer) {
          return val;
        }
        if (ArrayBuffer.isView(val)) {
          const buf = Buffer.from(val.buffer, val.byteOffset, val.byteLength);
          if (buf.length === val.byteLength) {
            return buf;
          }
          return buf.slice(val.byteOffset, val.byteOffset + val.byteLength);
        }
        if (isDate(val)) {
          if (defaults2.parseInputDatesAsUTC) {
            return dateToStringUTC(val);
          } else {
            return dateToString(val);
          }
        }
        if (Array.isArray(val)) {
          return arrayString(val);
        }
        return prepareObject(val, seen);
      }
      return val.toString();
    }, "prepareValue");
    function prepareObject(val, seen) {
      if (val && typeof val.toPostgres === "function") {
        seen = seen || [];
        if (seen.indexOf(val) !== -1) {
          throw new Error('circular reference detected while preparing "' + val + '" for query');
        }
        seen.push(val);
        return prepareValue(val.toPostgres(prepareValue), seen);
      }
      return JSON.stringify(val);
    }
    __name(prepareObject, "prepareObject");
    function dateToString(date) {
      let offset = -date.getTimezoneOffset();
      let year = date.getFullYear();
      const isBCYear = year < 1;
      if (isBCYear) year = Math.abs(year) + 1;
      let ret = String(year).padStart(4, "0") + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0") + "T" + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":" + String(date.getSeconds()).padStart(2, "0") + "." + String(date.getMilliseconds()).padStart(3, "0");
      if (offset < 0) {
        ret += "-";
        offset *= -1;
      } else {
        ret += "+";
      }
      ret += String(Math.floor(offset / 60)).padStart(2, "0") + ":" + String(offset % 60).padStart(2, "0");
      if (isBCYear) ret += " BC";
      return ret;
    }
    __name(dateToString, "dateToString");
    function dateToStringUTC(date) {
      let year = date.getUTCFullYear();
      const isBCYear = year < 1;
      if (isBCYear) year = Math.abs(year) + 1;
      let ret = String(year).padStart(4, "0") + "-" + String(date.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date.getUTCDate()).padStart(2, "0") + "T" + String(date.getUTCHours()).padStart(2, "0") + ":" + String(date.getUTCMinutes()).padStart(2, "0") + ":" + String(date.getUTCSeconds()).padStart(2, "0") + "." + String(date.getUTCMilliseconds()).padStart(3, "0");
      ret += "+00:00";
      if (isBCYear) ret += " BC";
      return ret;
    }
    __name(dateToStringUTC, "dateToStringUTC");
    function normalizeQueryConfig(config2, values, callback) {
      config2 = typeof config2 === "string" ? { text: config2 } : config2;
      if (values) {
        if (typeof values === "function") {
          config2.callback = values;
        } else {
          config2.values = values;
        }
      }
      if (callback) {
        config2.callback = callback;
      }
      return config2;
    }
    __name(normalizeQueryConfig, "normalizeQueryConfig");
    var escapeIdentifier2 = /* @__PURE__ */ __name(function(str2) {
      return '"' + str2.replace(/"/g, '""') + '"';
    }, "escapeIdentifier");
    var escapeLiteral2 = /* @__PURE__ */ __name(function(str2) {
      let hasBackslash = false;
      let escaped = "'";
      if (str2 == null) {
        return "''";
      }
      if (typeof str2 !== "string") {
        return "''";
      }
      for (let i = 0; i < str2.length; i++) {
        const c = str2[i];
        if (c === "'") {
          escaped += c + c;
        } else if (c === "\\") {
          escaped += c + c;
          hasBackslash = true;
        } else {
          escaped += c;
        }
      }
      escaped += "'";
      if (hasBackslash === true) {
        escaped = " E" + escaped;
      }
      return escaped;
    }, "escapeLiteral");
    module.exports = {
      prepareValue: /* @__PURE__ */ __name(function prepareValueWrapper(value) {
        return prepareValue(value);
      }, "prepareValueWrapper"),
      normalizeQueryConfig,
      escapeIdentifier: escapeIdentifier2,
      escapeLiteral: escapeLiteral2
    };
  }
});

// node-built-in-modules:crypto
import libDefault3 from "crypto";
var require_crypto = __commonJS({
  "node-built-in-modules:crypto"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault3;
  }
});

// node_modules/pg/lib/crypto/utils-legacy.js
var require_utils_legacy = __commonJS({
  "node_modules/pg/lib/crypto/utils-legacy.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var nodeCrypto = require_crypto();
    function md5(string) {
      return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
    }
    __name(md5, "md5");
    function postgresMd5PasswordHash(user, password, salt) {
      const inner = md5(password + user);
      const outer = md5(Buffer.concat([Buffer.from(inner), salt]));
      return "md5" + outer;
    }
    __name(postgresMd5PasswordHash, "postgresMd5PasswordHash");
    function sha256(text2) {
      return nodeCrypto.createHash("sha256").update(text2).digest();
    }
    __name(sha256, "sha256");
    function hashByName(hashName, text2) {
      hashName = hashName.replace(/(\D)-/, "$1");
      return nodeCrypto.createHash(hashName).update(text2).digest();
    }
    __name(hashByName, "hashByName");
    function hmacSha256(key2, msg) {
      return nodeCrypto.createHmac("sha256", key2).update(msg).digest();
    }
    __name(hmacSha256, "hmacSha256");
    async function deriveKey(password, salt, iterations) {
      return nodeCrypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
    }
    __name(deriveKey, "deriveKey");
    module.exports = {
      postgresMd5PasswordHash,
      randomBytes: nodeCrypto.randomBytes,
      deriveKey,
      sha256,
      hashByName,
      hmacSha256,
      md5
    };
  }
});

// node_modules/pg/lib/crypto/utils-webcrypto.js
var require_utils_webcrypto = __commonJS({
  "node_modules/pg/lib/crypto/utils-webcrypto.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var nodeCrypto = require_crypto();
    module.exports = {
      postgresMd5PasswordHash,
      randomBytes,
      deriveKey,
      sha256,
      hashByName,
      hmacSha256,
      md5
    };
    var webCrypto = nodeCrypto.webcrypto || globalThis.crypto;
    var subtleCrypto = webCrypto.subtle;
    var textEncoder = new TextEncoder();
    function randomBytes(length) {
      return webCrypto.getRandomValues(Buffer.alloc(length));
    }
    __name(randomBytes, "randomBytes");
    async function md5(string) {
      try {
        return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
      } catch (e) {
        const data = typeof string === "string" ? textEncoder.encode(string) : string;
        const hash = await subtleCrypto.digest("MD5", data);
        return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    }
    __name(md5, "md5");
    async function postgresMd5PasswordHash(user, password, salt) {
      const inner = await md5(password + user);
      const outer = await md5(Buffer.concat([Buffer.from(inner), salt]));
      return "md5" + outer;
    }
    __name(postgresMd5PasswordHash, "postgresMd5PasswordHash");
    async function sha256(text2) {
      return await subtleCrypto.digest("SHA-256", text2);
    }
    __name(sha256, "sha256");
    async function hashByName(hashName, text2) {
      return await subtleCrypto.digest(hashName, text2);
    }
    __name(hashByName, "hashByName");
    async function hmacSha256(keyBuffer, msg) {
      const key2 = await subtleCrypto.importKey("raw", keyBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return await subtleCrypto.sign("HMAC", key2, textEncoder.encode(msg));
    }
    __name(hmacSha256, "hmacSha256");
    async function deriveKey(password, salt, iterations) {
      const key2 = await subtleCrypto.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
      const params = { name: "PBKDF2", hash: "SHA-256", salt, iterations };
      return await subtleCrypto.deriveBits(params, key2, 32 * 8, ["deriveBits"]);
    }
    __name(deriveKey, "deriveKey");
  }
});

// node_modules/pg/lib/crypto/utils.js
var require_utils2 = __commonJS({
  "node_modules/pg/lib/crypto/utils.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var useLegacyCrypto = parseInt(process.versions && process.versions.node && process.versions.node.split(".")[0]) < 15;
    if (useLegacyCrypto) {
      module.exports = require_utils_legacy();
    } else {
      module.exports = require_utils_webcrypto();
    }
  }
});

// node_modules/pg/lib/crypto/cert-signatures.js
var require_cert_signatures = __commonJS({
  "node_modules/pg/lib/crypto/cert-signatures.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    function x509Error(msg, cert) {
      return new Error("SASL channel binding: " + msg + " when parsing public certificate " + cert.toString("base64"));
    }
    __name(x509Error, "x509Error");
    function readASN1Length(data, index) {
      let length = data[index++];
      if (length < 128) return { length, index };
      const lengthBytes = length & 127;
      if (lengthBytes > 4) throw x509Error("bad length", data);
      length = 0;
      for (let i = 0; i < lengthBytes; i++) {
        length = length << 8 | data[index++];
      }
      return { length, index };
    }
    __name(readASN1Length, "readASN1Length");
    function readASN1OID(data, index) {
      if (data[index++] !== 6) throw x509Error("non-OID data", data);
      const { length: OIDLength, index: indexAfterOIDLength } = readASN1Length(data, index);
      index = indexAfterOIDLength;
      const lastIndex = index + OIDLength;
      const byte1 = data[index++];
      let oid = (byte1 / 40 >> 0) + "." + byte1 % 40;
      while (index < lastIndex) {
        let value = 0;
        while (index < lastIndex) {
          const nextByte = data[index++];
          value = value << 7 | nextByte & 127;
          if (nextByte < 128) break;
        }
        oid += "." + value;
      }
      return { oid, index };
    }
    __name(readASN1OID, "readASN1OID");
    function expectASN1Seq(data, index) {
      if (data[index++] !== 48) throw x509Error("non-sequence data", data);
      return readASN1Length(data, index);
    }
    __name(expectASN1Seq, "expectASN1Seq");
    function signatureAlgorithmHashFromCertificate(data, index) {
      if (index === void 0) index = 0;
      index = expectASN1Seq(data, index).index;
      const { length: certInfoLength, index: indexAfterCertInfoLength } = expectASN1Seq(data, index);
      index = indexAfterCertInfoLength + certInfoLength;
      index = expectASN1Seq(data, index).index;
      const { oid, index: indexAfterOID } = readASN1OID(data, index);
      switch (oid) {
        // RSA
        case "1.2.840.113549.1.1.4":
          return "MD5";
        case "1.2.840.113549.1.1.5":
          return "SHA-1";
        case "1.2.840.113549.1.1.11":
          return "SHA-256";
        case "1.2.840.113549.1.1.12":
          return "SHA-384";
        case "1.2.840.113549.1.1.13":
          return "SHA-512";
        case "1.2.840.113549.1.1.14":
          return "SHA-224";
        case "1.2.840.113549.1.1.15":
          return "SHA512-224";
        case "1.2.840.113549.1.1.16":
          return "SHA512-256";
        // ECDSA
        case "1.2.840.10045.4.1":
          return "SHA-1";
        case "1.2.840.10045.4.3.1":
          return "SHA-224";
        case "1.2.840.10045.4.3.2":
          return "SHA-256";
        case "1.2.840.10045.4.3.3":
          return "SHA-384";
        case "1.2.840.10045.4.3.4":
          return "SHA-512";
        // RSASSA-PSS: hash is indicated separately
        case "1.2.840.113549.1.1.10": {
          index = indexAfterOID;
          index = expectASN1Seq(data, index).index;
          if (data[index++] !== 160) throw x509Error("non-tag data", data);
          index = readASN1Length(data, index).index;
          index = expectASN1Seq(data, index).index;
          const { oid: hashOID } = readASN1OID(data, index);
          switch (hashOID) {
            // standalone hash OIDs
            case "1.2.840.113549.2.5":
              return "MD5";
            case "1.3.14.3.2.26":
              return "SHA-1";
            case "2.16.840.1.101.3.4.2.1":
              return "SHA-256";
            case "2.16.840.1.101.3.4.2.2":
              return "SHA-384";
            case "2.16.840.1.101.3.4.2.3":
              return "SHA-512";
          }
          throw x509Error("unknown hash OID " + hashOID, data);
        }
        // Ed25519 -- see https: return//github.com/openssl/openssl/issues/15477
        case "1.3.101.110":
        case "1.3.101.112":
          return "SHA-512";
        // Ed448 -- still not in pg 17.2 (if supported, digest would be SHAKE256 x 64 bytes)
        case "1.3.101.111":
        case "1.3.101.113":
          throw x509Error("Ed448 certificate channel binding is not currently supported by Postgres");
      }
      throw x509Error("unknown OID " + oid, data);
    }
    __name(signatureAlgorithmHashFromCertificate, "signatureAlgorithmHashFromCertificate");
    module.exports = { signatureAlgorithmHashFromCertificate };
  }
});

// node_modules/pg/lib/crypto/sasl.js
var require_sasl = __commonJS({
  "node_modules/pg/lib/crypto/sasl.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var crypto2 = require_utils2();
    var { signatureAlgorithmHashFromCertificate } = require_cert_signatures();
    function startSession(mechanisms, stream) {
      const candidates = ["SCRAM-SHA-256"];
      if (stream) candidates.unshift("SCRAM-SHA-256-PLUS");
      const mechanism = candidates.find((candidate) => mechanisms.includes(candidate));
      if (!mechanism) {
        throw new Error("SASL: Only mechanism(s) " + candidates.join(" and ") + " are supported");
      }
      if (mechanism === "SCRAM-SHA-256-PLUS" && typeof stream.getPeerCertificate !== "function") {
        throw new Error("SASL: Mechanism SCRAM-SHA-256-PLUS requires a certificate");
      }
      const clientNonce = crypto2.randomBytes(18).toString("base64");
      const gs2Header = mechanism === "SCRAM-SHA-256-PLUS" ? "p=tls-server-end-point" : stream ? "y" : "n";
      return {
        mechanism,
        clientNonce,
        response: gs2Header + ",,n=*,r=" + clientNonce,
        message: "SASLInitialResponse"
      };
    }
    __name(startSession, "startSession");
    async function continueSession(session, password, serverData, stream) {
      if (session.message !== "SASLInitialResponse") {
        throw new Error("SASL: Last message was not SASLInitialResponse");
      }
      if (typeof password !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
      }
      if (password === "") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a non-empty string");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
      }
      const sv = parseServerFirstMessage(serverData);
      if (!sv.nonce.startsWith(session.clientNonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
      } else if (sv.nonce.length === session.clientNonce.length) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
      }
      const clientFirstMessageBare = "n=*,r=" + session.clientNonce;
      const serverFirstMessage = "r=" + sv.nonce + ",s=" + sv.salt + ",i=" + sv.iteration;
      let channelBinding = stream ? "eSws" : "biws";
      if (session.mechanism === "SCRAM-SHA-256-PLUS") {
        const peerCert = stream.getPeerCertificate().raw;
        let hashName = signatureAlgorithmHashFromCertificate(peerCert);
        if (hashName === "MD5" || hashName === "SHA-1") hashName = "SHA-256";
        const certHash = await crypto2.hashByName(hashName, peerCert);
        const bindingData = Buffer.concat([Buffer.from("p=tls-server-end-point,,"), Buffer.from(certHash)]);
        channelBinding = bindingData.toString("base64");
      }
      const clientFinalMessageWithoutProof = "c=" + channelBinding + ",r=" + sv.nonce;
      const authMessage = clientFirstMessageBare + "," + serverFirstMessage + "," + clientFinalMessageWithoutProof;
      const saltBytes = Buffer.from(sv.salt, "base64");
      const saltedPassword = await crypto2.deriveKey(password, saltBytes, sv.iteration);
      const clientKey = await crypto2.hmacSha256(saltedPassword, "Client Key");
      const storedKey = await crypto2.sha256(clientKey);
      const clientSignature = await crypto2.hmacSha256(storedKey, authMessage);
      const clientProof = xorBuffers(Buffer.from(clientKey), Buffer.from(clientSignature)).toString("base64");
      const serverKey = await crypto2.hmacSha256(saltedPassword, "Server Key");
      const serverSignatureBytes = await crypto2.hmacSha256(serverKey, authMessage);
      session.message = "SASLResponse";
      session.serverSignature = Buffer.from(serverSignatureBytes).toString("base64");
      session.response = clientFinalMessageWithoutProof + ",p=" + clientProof;
    }
    __name(continueSession, "continueSession");
    function finalizeSession(session, serverData) {
      if (session.message !== "SASLResponse") {
        throw new Error("SASL: Last message was not SASLResponse");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
      }
      const { serverSignature } = parseServerFinalMessage(serverData);
      if (serverSignature !== session.serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
      }
    }
    __name(finalizeSession, "finalizeSession");
    function isPrintableChars(text2) {
      if (typeof text2 !== "string") {
        throw new TypeError("SASL: text must be a string");
      }
      return text2.split("").map((_, i) => text2.charCodeAt(i)).every((c) => c >= 33 && c <= 43 || c >= 45 && c <= 126);
    }
    __name(isPrintableChars, "isPrintableChars");
    function isBase64(text2) {
      return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(text2);
    }
    __name(isBase64, "isBase64");
    function parseAttributePairs(text2) {
      if (typeof text2 !== "string") {
        throw new TypeError("SASL: attribute pairs text must be a string");
      }
      return new Map(
        text2.split(",").map((attrValue) => {
          if (!/^.=/.test(attrValue)) {
            throw new Error("SASL: Invalid attribute pair entry");
          }
          const name = attrValue[0];
          const value = attrValue.substring(2);
          return [name, value];
        })
      );
    }
    __name(parseAttributePairs, "parseAttributePairs");
    function parseServerFirstMessage(data) {
      const attrPairs = parseAttributePairs(data);
      const nonce = attrPairs.get("r");
      if (!nonce) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
      } else if (!isPrintableChars(nonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
      }
      const salt = attrPairs.get("s");
      if (!salt) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
      } else if (!isBase64(salt)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
      }
      const iterationText = attrPairs.get("i");
      if (!iterationText) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
      } else if (!/^[1-9][0-9]*$/.test(iterationText)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
      }
      const iteration = parseInt(iterationText, 10);
      return {
        nonce,
        salt,
        iteration
      };
    }
    __name(parseServerFirstMessage, "parseServerFirstMessage");
    function parseServerFinalMessage(serverData) {
      const attrPairs = parseAttributePairs(serverData);
      const serverSignature = attrPairs.get("v");
      if (!serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
      } else if (!isBase64(serverSignature)) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
      }
      return {
        serverSignature
      };
    }
    __name(parseServerFinalMessage, "parseServerFinalMessage");
    function xorBuffers(a, b) {
      if (!Buffer.isBuffer(a)) {
        throw new TypeError("first argument must be a Buffer");
      }
      if (!Buffer.isBuffer(b)) {
        throw new TypeError("second argument must be a Buffer");
      }
      if (a.length !== b.length) {
        throw new Error("Buffer lengths must match");
      }
      if (a.length === 0) {
        throw new Error("Buffers cannot be empty");
      }
      return Buffer.from(a.map((_, i) => a[i] ^ b[i]));
    }
    __name(xorBuffers, "xorBuffers");
    module.exports = {
      startSession,
      continueSession,
      finalizeSession
    };
  }
});

// node_modules/pg/lib/type-overrides.js
var require_type_overrides = __commonJS({
  "node_modules/pg/lib/type-overrides.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var types2 = require_pg_types();
    function TypeOverrides2(userTypes) {
      this._types = userTypes || types2;
      this.text = {};
      this.binary = {};
    }
    __name(TypeOverrides2, "TypeOverrides");
    TypeOverrides2.prototype.getOverrides = function(format) {
      switch (format) {
        case "text":
          return this.text;
        case "binary":
          return this.binary;
        default:
          return {};
      }
    };
    TypeOverrides2.prototype.setTypeParser = function(oid, format, parseFn) {
      if (typeof format === "function") {
        parseFn = format;
        format = "text";
      }
      this.getOverrides(format)[oid] = parseFn;
    };
    TypeOverrides2.prototype.getTypeParser = function(oid, format) {
      format = format || "text";
      return this.getOverrides(format)[oid] || this._types.getTypeParser(oid, format);
    };
    module.exports = TypeOverrides2;
  }
});

// node-built-in-modules:dns
import libDefault4 from "dns";
var require_dns = __commonJS({
  "node-built-in-modules:dns"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault4;
  }
});

// node-built-in-modules:fs
import libDefault5 from "fs";
var require_fs = __commonJS({
  "node-built-in-modules:fs"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault5;
  }
});

// node_modules/pg-connection-string/index.js
var require_pg_connection_string = __commonJS({
  "node_modules/pg-connection-string/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    function parse(str2, options = {}) {
      if (str2.charAt(0) === "/") {
        const config3 = str2.split(" ");
        return { host: config3[0], database: config3[1] };
      }
      const config2 = /* @__PURE__ */ Object.create(null);
      let result;
      let dummyHost = false;
      if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str2)) {
        str2 = encodeURI(str2).replace(/%25(\d\d)/g, "%$1");
      }
      try {
        try {
          result = new URL(str2, "postgres://base");
        } catch (e) {
          result = new URL(str2.replace("@/", "@___DUMMY___/"), "postgres://base");
          dummyHost = true;
        }
      } catch (err) {
        err.input && (err.input = "*****REDACTED*****");
        throw err;
      }
      for (const entry of result.searchParams.entries()) {
        config2[entry[0]] = entry[1];
      }
      config2.user = config2.user || decodeURIComponent(result.username);
      config2.password = config2.password || decodeURIComponent(result.password);
      if (result.protocol == "socket:") {
        config2.host = decodeURI(result.pathname);
        config2.database = result.searchParams.get("db");
        config2.client_encoding = result.searchParams.get("encoding");
        return config2;
      }
      const hostname = (dummyHost ? "" : result.hostname).replace(/^\[(.+)\]$/, "$1");
      if (!config2.host) {
        config2.host = decodeURIComponent(hostname);
      } else if (hostname && /^%2f/i.test(hostname)) {
        result.pathname = hostname + result.pathname;
      }
      if (!config2.port) {
        config2.port = result.port;
      }
      const pathname = result.pathname.slice(1) || null;
      config2.database = pathname ? decodeURI(pathname) : null;
      if (config2.ssl === "true" || config2.ssl === "1") {
        config2.ssl = true;
      }
      if (config2.ssl === "0") {
        config2.ssl = false;
      }
      if (config2.sslcert || config2.sslkey || config2.sslrootcert || config2.sslmode) {
        config2.ssl = {};
      }
      if (config2.sslnegotiation === "direct" && config2.ssl === void 0) {
        config2.ssl = true;
      }
      const fs = config2.sslcert || config2.sslkey || config2.sslrootcert ? require_fs() : null;
      if (config2.sslcert) {
        config2.ssl.cert = fs.readFileSync(config2.sslcert).toString();
      }
      if (config2.sslkey) {
        config2.ssl.key = fs.readFileSync(config2.sslkey).toString();
      }
      if (config2.sslrootcert) {
        config2.ssl.ca = fs.readFileSync(config2.sslrootcert).toString();
      }
      if (options.useLibpqCompat && config2.uselibpqcompat) {
        throw new Error("Both useLibpqCompat and uselibpqcompat are set. Please use only one of them.");
      }
      if (config2.uselibpqcompat === "true" || options.useLibpqCompat) {
        switch (config2.sslmode) {
          case "disable": {
            config2.ssl = false;
            break;
          }
          case "prefer": {
            config2.ssl.rejectUnauthorized = false;
            break;
          }
          case "require": {
            if (config2.sslrootcert) {
              config2.ssl.checkServerIdentity = function() {
              };
            } else {
              config2.ssl.rejectUnauthorized = false;
            }
            break;
          }
          case "verify-ca": {
            if (!config2.ssl.ca) {
              throw new Error(
                "SECURITY WARNING: Using sslmode=verify-ca requires specifying a CA with sslrootcert. If a public CA is used, verify-ca allows connections to a server that somebody else may have registered with the CA, making you vulnerable to Man-in-the-Middle attacks. Either specify a custom CA certificate with sslrootcert parameter or use sslmode=verify-full for proper security."
              );
            }
            config2.ssl.checkServerIdentity = function() {
            };
            break;
          }
          case "verify-full": {
            break;
          }
        }
      } else {
        switch (config2.sslmode) {
          case "disable": {
            config2.ssl = false;
            break;
          }
          case "prefer":
          case "require":
          case "verify-ca":
          case "verify-full": {
            if (config2.sslmode !== "verify-full") {
              deprecatedSslModeWarning(config2.sslmode);
            }
            break;
          }
          case "no-verify": {
            config2.ssl.rejectUnauthorized = false;
            break;
          }
        }
      }
      return config2;
    }
    __name(parse, "parse");
    function toConnectionOptions(sslConfig) {
      const connectionOptions = Object.entries(sslConfig).reduce((c, [key2, value]) => {
        if (value !== void 0 && value !== null) {
          c[key2] = value;
        }
        return c;
      }, /* @__PURE__ */ Object.create(null));
      return connectionOptions;
    }
    __name(toConnectionOptions, "toConnectionOptions");
    function toClientConfig(config2) {
      const poolConfig = Object.entries(config2).reduce((c, [key2, value]) => {
        if (key2 === "ssl") {
          const sslConfig = value;
          if (typeof sslConfig === "boolean") {
            c[key2] = sslConfig;
          }
          if (typeof sslConfig === "object") {
            c[key2] = toConnectionOptions(sslConfig);
          }
        } else if (value !== void 0 && value !== null) {
          if (key2 === "port") {
            if (value !== "") {
              const v = parseInt(value, 10);
              if (isNaN(v)) {
                throw new Error(`Invalid ${key2}: ${value}`);
              }
              c[key2] = v;
            }
          } else {
            c[key2] = value;
          }
        }
        return c;
      }, /* @__PURE__ */ Object.create(null));
      return poolConfig;
    }
    __name(toClientConfig, "toClientConfig");
    function parseIntoClientConfig(str2) {
      return toClientConfig(parse(str2));
    }
    __name(parseIntoClientConfig, "parseIntoClientConfig");
    function deprecatedSslModeWarning(sslmode) {
      if (!deprecatedSslModeWarning.warned && typeof process !== "undefined" && process.emitWarning) {
        deprecatedSslModeWarning.warned = true;
        process.emitWarning(`SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=${sslmode}'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.`);
      }
    }
    __name(deprecatedSslModeWarning, "deprecatedSslModeWarning");
    module.exports = parse;
    parse.parse = parse;
    parse.toClientConfig = toClientConfig;
    parse.parseIntoClientConfig = parseIntoClientConfig;
  }
});

// node_modules/pg/lib/connection-parameters.js
var require_connection_parameters = __commonJS({
  "node_modules/pg/lib/connection-parameters.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var dns = require_dns();
    var defaults2 = require_defaults();
    var parse = require_pg_connection_string().parse;
    var val = /* @__PURE__ */ __name(function(key2, config2, envVar) {
      if (envVar === void 0) {
        envVar = process.env["PG" + key2.toUpperCase()];
      } else if (envVar === false) {
      } else {
        envVar = process.env[envVar];
      }
      return config2[key2] || envVar || defaults2[key2];
    }, "val");
    var readSSLConfigFromEnvironment = /* @__PURE__ */ __name(function() {
      switch (process.env.PGSSLMODE) {
        case "disable":
          return false;
        case "prefer":
        case "require":
        case "verify-ca":
        case "verify-full":
          return true;
        case "no-verify":
          return { rejectUnauthorized: false };
      }
      return defaults2.ssl;
    }, "readSSLConfigFromEnvironment");
    var quoteParamValue = /* @__PURE__ */ __name(function(value) {
      return "'" + ("" + value).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    }, "quoteParamValue");
    var add = /* @__PURE__ */ __name(function(params, config2, paramName) {
      const value = config2[paramName];
      if (value !== void 0 && value !== null) {
        params.push(paramName + "=" + quoteParamValue(value));
      }
    }, "add");
    var ConnectionParameters = class {
      static {
        __name(this, "ConnectionParameters");
      }
      constructor(config2) {
        config2 = typeof config2 === "string" ? parse(config2) : config2 || {};
        if (config2.connectionString) {
          config2 = Object.assign({}, config2, parse(config2.connectionString));
        }
        this.user = val("user", config2);
        this.database = val("database", config2);
        if (this.database === void 0) {
          this.database = this.user;
        }
        this.port = parseInt(val("port", config2), 10);
        this.host = val("host", config2);
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: val("password", config2)
        });
        this.binary = val("binary", config2);
        this.options = val("options", config2);
        this.ssl = typeof config2.ssl === "undefined" ? readSSLConfigFromEnvironment() : config2.ssl;
        if (typeof this.ssl === "string") {
          if (this.ssl === "true") {
            this.ssl = true;
          }
        }
        if (this.ssl === "no-verify") {
          this.ssl = { rejectUnauthorized: false };
        }
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this.client_encoding = val("client_encoding", config2);
        this.replication = val("replication", config2);
        this.isDomainSocket = !(this.host || "").indexOf("/");
        this.application_name = val("application_name", config2, "PGAPPNAME");
        this.fallback_application_name = val("fallback_application_name", config2, false);
        this.statement_timeout = val("statement_timeout", config2, false);
        this.lock_timeout = val("lock_timeout", config2, false);
        this.idle_in_transaction_session_timeout = val("idle_in_transaction_session_timeout", config2, false);
        this.query_timeout = val("query_timeout", config2, false);
        if (config2.connectionTimeoutMillis === void 0) {
          this.connect_timeout = process.env.PGCONNECT_TIMEOUT || 0;
        } else {
          this.connect_timeout = Math.floor(config2.connectionTimeoutMillis / 1e3);
        }
        if (config2.keepAlive === false) {
          this.keepalives = 0;
        } else if (config2.keepAlive === true) {
          this.keepalives = 1;
        }
        if (typeof config2.keepAliveInitialDelayMillis === "number") {
          this.keepalives_idle = Math.floor(config2.keepAliveInitialDelayMillis / 1e3);
        }
      }
      getLibpqConnectionString(cb) {
        const params = [];
        add(params, this, "user");
        add(params, this, "password");
        add(params, this, "port");
        add(params, this, "application_name");
        add(params, this, "fallback_application_name");
        add(params, this, "connect_timeout");
        add(params, this, "options");
        const ssl = typeof this.ssl === "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
        add(params, ssl, "sslmode");
        add(params, ssl, "sslca");
        add(params, ssl, "sslkey");
        add(params, ssl, "sslcert");
        add(params, ssl, "sslrootcert");
        if (this.database) {
          params.push("dbname=" + quoteParamValue(this.database));
        }
        if (this.replication) {
          params.push("replication=" + quoteParamValue(this.replication));
        }
        if (this.host) {
          params.push("host=" + quoteParamValue(this.host));
        }
        if (this.isDomainSocket) {
          return cb(null, params.join(" "));
        }
        if (this.client_encoding) {
          params.push("client_encoding=" + quoteParamValue(this.client_encoding));
        }
        dns.lookup(this.host, function(err, address) {
          if (err) return cb(err, null);
          params.push("hostaddr=" + quoteParamValue(address));
          return cb(null, params.join(" "));
        });
      }
    };
    module.exports = ConnectionParameters;
  }
});

// node_modules/pg/lib/result.js
var require_result = __commonJS({
  "node_modules/pg/lib/result.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var types2 = require_pg_types();
    var matchRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/;
    var Result2 = class {
      static {
        __name(this, "Result");
      }
      constructor(rowMode, types3) {
        this.command = null;
        this.rowCount = null;
        this.oid = null;
        this.rows = [];
        this.fields = [];
        this._parsers = void 0;
        this._types = types3;
        this.RowCtor = null;
        this.rowAsArray = rowMode === "array";
        if (this.rowAsArray) {
          this.parseRow = this._parseRowAsArray;
        }
        this._prebuiltEmptyResultObject = null;
      }
      // adds a command complete message
      addCommandComplete(msg) {
        let match;
        if (msg.text) {
          match = matchRegexp.exec(msg.text);
        } else {
          match = matchRegexp.exec(msg.command);
        }
        if (match) {
          this.command = match[1];
          if (match[3]) {
            this.oid = parseInt(match[2], 10);
            this.rowCount = parseInt(match[3], 10);
          } else if (match[2]) {
            this.rowCount = parseInt(match[2], 10);
          }
        }
      }
      _parseRowAsArray(rowData) {
        const row = new Array(rowData.length);
        for (let i = 0, len = rowData.length; i < len; i++) {
          const rawValue = rowData[i];
          if (rawValue !== null) {
            row[i] = this._parsers[i](rawValue);
          } else {
            row[i] = null;
          }
        }
        return row;
      }
      parseRow(rowData) {
        const row = { ...this._prebuiltEmptyResultObject };
        for (let i = 0, len = rowData.length; i < len; i++) {
          const rawValue = rowData[i];
          const field = this.fields[i].name;
          if (rawValue !== null) {
            const v = this.fields[i].format === "binary" ? Buffer.from(rawValue) : rawValue;
            row[field] = this._parsers[i](v);
          } else {
            row[field] = null;
          }
        }
        return row;
      }
      addRow(row) {
        this.rows.push(row);
      }
      addFields(fieldDescriptions) {
        this.fields = fieldDescriptions;
        if (this.fields.length) {
          this._parsers = new Array(fieldDescriptions.length);
        }
        const row = {};
        for (let i = 0; i < fieldDescriptions.length; i++) {
          const desc = fieldDescriptions[i];
          row[desc.name] = null;
          if (this._types) {
            this._parsers[i] = this._types.getTypeParser(desc.dataTypeID, desc.format || "text");
          } else {
            this._parsers[i] = types2.getTypeParser(desc.dataTypeID, desc.format || "text");
          }
        }
        this._prebuiltEmptyResultObject = { ...row };
      }
    };
    module.exports = Result2;
  }
});

// node_modules/pg/lib/query.js
var require_query = __commonJS({
  "node_modules/pg/lib/query.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var { EventEmitter: EventEmitter2 } = require_events();
    var Result2 = require_result();
    var utils = require_utils();
    var Query2 = class extends EventEmitter2 {
      static {
        __name(this, "Query");
      }
      constructor(config2, values, callback) {
        super();
        config2 = utils.normalizeQueryConfig(config2, values, callback);
        this.text = config2.text;
        this.values = config2.values;
        this.rows = config2.rows;
        this.types = config2.types;
        this.name = config2.name;
        this.queryMode = config2.queryMode;
        this.binary = config2.binary;
        this.portal = config2.portal || "";
        this.callback = config2.callback;
        this._rowMode = config2.rowMode;
        if (process.domain && config2.callback) {
          this.callback = process.domain.bind(config2.callback);
        }
        this._result = new Result2(this._rowMode, this.types);
        this._results = this._result;
        this._canceledDueToError = false;
      }
      requiresPreparation() {
        if (this.queryMode === "extended") {
          return true;
        }
        if (this.name) {
          return true;
        }
        if (this.rows) {
          return true;
        }
        if (!this.text) {
          return false;
        }
        if (!this.values) {
          return false;
        }
        return this.values.length > 0;
      }
      _checkForMultirow() {
        if (this._result.command) {
          if (!Array.isArray(this._results)) {
            this._results = [this._result];
          }
          this._result = new Result2(this._rowMode, this._result._types);
          this._results.push(this._result);
        }
      }
      // associates row metadata from the supplied
      // message with this query object
      // metadata used when parsing row results
      handleRowDescription(msg) {
        this._checkForMultirow();
        this._result.addFields(msg.fields);
        this._accumulateRows = this.callback || !this.listeners("row").length;
      }
      handleDataRow(msg) {
        let row;
        if (this._canceledDueToError) {
          return;
        }
        try {
          row = this._result.parseRow(msg.fields);
        } catch (err) {
          this._canceledDueToError = err;
          return;
        }
        this.emit("row", row, this._result);
        if (this._accumulateRows) {
          this._result.addRow(row);
        }
      }
      handleCommandComplete(msg, connection) {
        this._checkForMultirow();
        this._result.addCommandComplete(msg);
        if (this.rows) {
          connection.sync();
        }
      }
      // if a named prepared statement is created with empty query text
      // the backend will send an emptyQuery message but *not* a command complete message
      // since we pipeline sync immediately after execute we don't need to do anything here
      // unless we have rows specified, in which case we did not pipeline the initial sync call
      handleEmptyQuery(connection) {
        if (this.rows) {
          connection.sync();
        }
      }
      handleError(err, connection) {
        if (this._canceledDueToError) {
          err = this._canceledDueToError;
          this._canceledDueToError = false;
        }
        if (this.callback) {
          return this.callback(err);
        }
        this.emit("error", err);
      }
      handleReadyForQuery(con) {
        if (this._canceledDueToError) {
          return this.handleError(this._canceledDueToError, con);
        }
        if (this.callback) {
          try {
            this.callback(null, this._results);
          } catch (err) {
            process.nextTick(() => {
              throw err;
            });
          }
        }
        this.emit("end", this._results);
      }
      submit(connection) {
        if (typeof this.text !== "string" && typeof this.name !== "string") {
          return new Error("A query must have either text or a name. Supplying neither is unsupported.");
        }
        const previous = connection.parsedStatements[this.name];
        if (this.text && previous && this.text !== previous) {
          return new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
        }
        if (this.values && !Array.isArray(this.values)) {
          return new Error("Query values must be an array");
        }
        if (this.requiresPreparation()) {
          connection.stream.cork && connection.stream.cork();
          try {
            this.prepare(connection);
          } finally {
            connection.stream.uncork && connection.stream.uncork();
          }
        } else {
          connection.query(this.text);
        }
        return null;
      }
      hasBeenParsed(connection) {
        return this.name && connection.parsedStatements[this.name];
      }
      handlePortalSuspended(connection) {
        this._getRows(connection, this.rows);
      }
      _getRows(connection, rows2) {
        connection.execute({
          portal: this.portal,
          rows: rows2
        });
        if (!rows2) {
          connection.sync();
        } else {
          connection.flush();
        }
      }
      // http://developer.postgresql.org/pgdocs/postgres/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY
      prepare(connection) {
        if (!this.hasBeenParsed(connection)) {
          connection.parse({
            text: this.text,
            name: this.name,
            types: this.types
          });
        }
        try {
          connection.bind({
            portal: this.portal,
            statement: this.name,
            values: this.values,
            binary: this.binary,
            valueMapper: utils.prepareValue
          });
        } catch (err) {
          this.handleError(err, connection);
          return;
        }
        connection.describe({
          type: "P",
          name: this.portal || ""
        });
        this._getRows(connection, this.rows);
      }
      handleCopyInResponse(connection) {
        connection.sendCopyFail("No source stream defined");
      }
      handleCopyData(msg, connection) {
      }
    };
    module.exports = Query2;
  }
});

// node_modules/pg-protocol/dist/messages.js
var require_messages = __commonJS({
  "node_modules/pg-protocol/dist/messages.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoticeMessage = exports.DataRowMessage = exports.CommandCompleteMessage = exports.ReadyForQueryMessage = exports.NotificationResponseMessage = exports.BackendKeyDataMessage = exports.AuthenticationMD5Password = exports.ParameterStatusMessage = exports.ParameterDescriptionMessage = exports.RowDescriptionMessage = exports.Field = exports.CopyResponse = exports.CopyDataMessage = exports.DatabaseError = exports.copyDone = exports.emptyQuery = exports.replicationStart = exports.portalSuspended = exports.noData = exports.closeComplete = exports.bindComplete = exports.parseComplete = void 0;
    exports.parseComplete = {
      name: "parseComplete",
      length: 5
    };
    exports.bindComplete = {
      name: "bindComplete",
      length: 5
    };
    exports.closeComplete = {
      name: "closeComplete",
      length: 5
    };
    exports.noData = {
      name: "noData",
      length: 5
    };
    exports.portalSuspended = {
      name: "portalSuspended",
      length: 5
    };
    exports.replicationStart = {
      name: "replicationStart",
      length: 4
    };
    exports.emptyQuery = {
      name: "emptyQuery",
      length: 4
    };
    exports.copyDone = {
      name: "copyDone",
      length: 4
    };
    var DatabaseError2 = class extends Error {
      static {
        __name(this, "DatabaseError");
      }
      constructor(message, length, name) {
        super(message);
        this.length = length;
        this.name = name;
      }
    };
    exports.DatabaseError = DatabaseError2;
    var CopyDataMessage = class {
      static {
        __name(this, "CopyDataMessage");
      }
      constructor(length, chunk) {
        this.length = length;
        this.chunk = chunk;
        this.name = "copyData";
      }
    };
    exports.CopyDataMessage = CopyDataMessage;
    var CopyResponse = class {
      static {
        __name(this, "CopyResponse");
      }
      constructor(length, name, binary, columnCount) {
        this.length = length;
        this.name = name;
        this.binary = binary;
        this.columnTypes = new Array(columnCount);
      }
    };
    exports.CopyResponse = CopyResponse;
    var Field = class {
      static {
        __name(this, "Field");
      }
      constructor(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, format) {
        this.name = name;
        this.tableID = tableID;
        this.columnID = columnID;
        this.dataTypeID = dataTypeID;
        this.dataTypeSize = dataTypeSize;
        this.dataTypeModifier = dataTypeModifier;
        this.format = format;
      }
    };
    exports.Field = Field;
    var RowDescriptionMessage = class {
      static {
        __name(this, "RowDescriptionMessage");
      }
      constructor(length, fieldCount) {
        this.length = length;
        this.fieldCount = fieldCount;
        this.name = "rowDescription";
        this.fields = new Array(this.fieldCount);
      }
    };
    exports.RowDescriptionMessage = RowDescriptionMessage;
    var ParameterDescriptionMessage = class {
      static {
        __name(this, "ParameterDescriptionMessage");
      }
      constructor(length, parameterCount) {
        this.length = length;
        this.parameterCount = parameterCount;
        this.name = "parameterDescription";
        this.dataTypeIDs = new Array(this.parameterCount);
      }
    };
    exports.ParameterDescriptionMessage = ParameterDescriptionMessage;
    var ParameterStatusMessage = class {
      static {
        __name(this, "ParameterStatusMessage");
      }
      constructor(length, parameterName, parameterValue) {
        this.length = length;
        this.parameterName = parameterName;
        this.parameterValue = parameterValue;
        this.name = "parameterStatus";
      }
    };
    exports.ParameterStatusMessage = ParameterStatusMessage;
    var AuthenticationMD5Password = class {
      static {
        __name(this, "AuthenticationMD5Password");
      }
      constructor(length, salt) {
        this.length = length;
        this.salt = salt;
        this.name = "authenticationMD5Password";
      }
    };
    exports.AuthenticationMD5Password = AuthenticationMD5Password;
    var BackendKeyDataMessage = class {
      static {
        __name(this, "BackendKeyDataMessage");
      }
      constructor(length, processID, secretKey) {
        this.length = length;
        this.processID = processID;
        this.secretKey = secretKey;
        this.name = "backendKeyData";
      }
    };
    exports.BackendKeyDataMessage = BackendKeyDataMessage;
    var NotificationResponseMessage = class {
      static {
        __name(this, "NotificationResponseMessage");
      }
      constructor(length, processId, channel2, payload) {
        this.length = length;
        this.processId = processId;
        this.channel = channel2;
        this.payload = payload;
        this.name = "notification";
      }
    };
    exports.NotificationResponseMessage = NotificationResponseMessage;
    var ReadyForQueryMessage = class {
      static {
        __name(this, "ReadyForQueryMessage");
      }
      constructor(length, status) {
        this.length = length;
        this.status = status;
        this.name = "readyForQuery";
      }
    };
    exports.ReadyForQueryMessage = ReadyForQueryMessage;
    var CommandCompleteMessage = class {
      static {
        __name(this, "CommandCompleteMessage");
      }
      constructor(length, text2) {
        this.length = length;
        this.text = text2;
        this.name = "commandComplete";
      }
    };
    exports.CommandCompleteMessage = CommandCompleteMessage;
    var DataRowMessage = class {
      static {
        __name(this, "DataRowMessage");
      }
      constructor(length, fields) {
        this.length = length;
        this.fields = fields;
        this.name = "dataRow";
        this.fieldCount = fields.length;
      }
    };
    exports.DataRowMessage = DataRowMessage;
    var NoticeMessage = class {
      static {
        __name(this, "NoticeMessage");
      }
      constructor(length, message) {
        this.length = length;
        this.message = message;
        this.name = "notice";
      }
    };
    exports.NoticeMessage = NoticeMessage;
  }
});

// node_modules/pg-protocol/dist/buffer-writer.js
var require_buffer_writer = __commonJS({
  "node_modules/pg-protocol/dist/buffer-writer.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Writer = void 0;
    var Writer = class {
      static {
        __name(this, "Writer");
      }
      constructor(size = 256) {
        this.size = size;
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(size);
      }
      ensure(size) {
        const remaining = this.buffer.length - this.offset;
        if (remaining < size) {
          const oldBuffer = this.buffer;
          const newSize = oldBuffer.length + (oldBuffer.length >> 1) + size;
          this.buffer = Buffer.allocUnsafe(newSize);
          oldBuffer.copy(this.buffer, 0, 0, this.offset);
        }
      }
      addInt32(num) {
        this.ensure(4);
        this.buffer[this.offset++] = num >>> 24 & 255;
        this.buffer[this.offset++] = num >>> 16 & 255;
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addInt16(num) {
        this.ensure(2);
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addCString(string) {
        if (!string) {
          this.ensure(1);
        } else {
          const len = Buffer.byteLength(string);
          this.ensure(len + 1);
          this.buffer.write(string, this.offset, "utf-8");
          this.offset += len;
        }
        this.buffer[this.offset++] = 0;
        return this;
      }
      addString(string = "") {
        const len = Buffer.byteLength(string);
        this.ensure(len);
        this.buffer.write(string, this.offset);
        this.offset += len;
        return this;
      }
      // Write an Int32 byte-length prefix immediately followed by the string's UTF-8
      // bytes. Postgres' Bind wire format prefixes every parameter with its length,
      // and doing it in one method computes Buffer.byteLength ONCE — the previous
      // `addInt32(Buffer.byteLength(s)).addString(s)` pairing scanned the string
      // three times (byteLength for the prefix, byteLength again inside addString,
      // then the encode), which is costly for large text parameters.
      addInt32PrefixedString(string) {
        const len = Buffer.byteLength(string);
        this.ensure(4 + len);
        const buffer = this.buffer;
        let offset = this.offset;
        buffer[offset++] = len >>> 24 & 255;
        buffer[offset++] = len >>> 16 & 255;
        buffer[offset++] = len >>> 8 & 255;
        buffer[offset++] = len >>> 0 & 255;
        buffer.write(string, offset, "utf-8");
        this.offset = offset + len;
        return this;
      }
      add(otherBuffer) {
        this.ensure(otherBuffer.length);
        otherBuffer.copy(this.buffer, this.offset);
        this.offset += otherBuffer.length;
        return this;
      }
      /**
       * Appends an uninitialized block of {@link size} bytes to the buffer and returns its offset.
       */
      reserveUnsafe(size) {
        const offset = this.offset;
        this.ensure(size);
        this.offset += size;
        return offset;
      }
      join(code) {
        if (code) {
          this.buffer[this.headerPosition] = code;
          const length = this.offset - (this.headerPosition + 1);
          this.buffer.writeInt32BE(length, this.headerPosition + 1);
        }
        return this.buffer.slice(code ? 0 : 5, this.offset);
      }
      flush(code) {
        const result = this.join(code);
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(this.size);
        return result;
      }
      clear() {
        this.offset = 5;
        this.headerPosition = 0;
      }
    };
    exports.Writer = Writer;
  }
});

// node_modules/pg-protocol/dist/serializer.js
var require_serializer = __commonJS({
  "node_modules/pg-protocol/dist/serializer.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.serialize = void 0;
    var buffer_writer_1 = require_buffer_writer();
    var writer = new buffer_writer_1.Writer();
    var startup = /* @__PURE__ */ __name((opts) => {
      writer.addInt16(3).addInt16(0);
      for (const key2 of Object.keys(opts)) {
        writer.addCString(key2).addCString(opts[key2]);
      }
      writer.addCString("client_encoding").addCString("UTF8");
      const bodyBuffer = writer.addCString("").flush();
      const length = bodyBuffer.length + 4;
      return new buffer_writer_1.Writer().addInt32(length).add(bodyBuffer).flush();
    }, "startup");
    var requestSsl = /* @__PURE__ */ __name(() => {
      const response2 = Buffer.allocUnsafe(8);
      response2.writeInt32BE(8, 0);
      response2.writeInt32BE(80877103, 4);
      return response2;
    }, "requestSsl");
    var password = /* @__PURE__ */ __name((password2) => {
      return writer.addCString(password2).flush(
        112
        /* code.startup */
      );
    }, "password");
    var sendSASLInitialResponseMessage = /* @__PURE__ */ __name(function(mechanism, initialResponse) {
      writer.addCString(mechanism).addInt32PrefixedString(initialResponse);
      return writer.flush(
        112
        /* code.startup */
      );
    }, "sendSASLInitialResponseMessage");
    var sendSCRAMClientFinalMessage = /* @__PURE__ */ __name(function(additionalData) {
      return writer.addString(additionalData).flush(
        112
        /* code.startup */
      );
    }, "sendSCRAMClientFinalMessage");
    var query = /* @__PURE__ */ __name((text2) => {
      return writer.addCString(text2).flush(
        81
        /* code.query */
      );
    }, "query");
    var emptyArray = [];
    var parse = /* @__PURE__ */ __name((query2) => {
      const name = query2.name || "";
      if (name.length > 63) {
        console.error("Warning! Postgres only supports 63 characters for query names.");
        console.error("You supplied %s (%s)", name, name.length);
        console.error("This can cause conflicts and silent errors executing queries");
      }
      const types2 = query2.types || emptyArray;
      const len = types2.length;
      const buffer = writer.addCString(name).addCString(query2.text).addInt16(len);
      for (let i = 0; i < len; i++) {
        buffer.addInt32(types2[i]);
      }
      return writer.flush(
        80
        /* code.parse */
      );
    }, "parse");
    var writeValues = /* @__PURE__ */ __name(function(values, valueMapper, formatsOffset) {
      const len = values.length;
      for (let i = 0; i < len; i++) {
        const mappedVal = valueMapper ? valueMapper(values[i], i) : values[i];
        let formatByte = 0;
        if (mappedVal == null) {
          writer.addInt32(-1);
        } else if (mappedVal instanceof Buffer) {
          formatByte = 1;
          writer.addInt32(mappedVal.length);
          writer.add(mappedVal);
        } else {
          writer.addInt32PrefixedString(mappedVal);
        }
        const buf = writer.buffer;
        buf[formatsOffset++] = 0;
        buf[formatsOffset++] = formatByte;
      }
    }, "writeValues");
    var bind = /* @__PURE__ */ __name((config2 = {}) => {
      const portal = config2.portal || "";
      const statement = config2.statement || "";
      const binary = config2.binary || false;
      const values = config2.values || emptyArray;
      const len = values.length;
      writer.addCString(portal).addCString(statement);
      writer.addInt16(len);
      const formatsOffset = writer.reserveUnsafe(len * 2);
      writer.addInt16(len);
      try {
        writeValues(values, config2.valueMapper, formatsOffset);
      } catch (err) {
        writer.clear();
        throw err;
      }
      writer.addInt16(1);
      writer.addInt16(
        binary ? 1 : 0
        /* ParamType.STRING */
      );
      return writer.flush(
        66
        /* code.bind */
      );
    }, "bind");
    var emptyExecute = Buffer.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]);
    var execute = /* @__PURE__ */ __name((config2) => {
      if (!config2 || !config2.portal && !config2.rows) {
        return emptyExecute;
      }
      const portal = config2.portal || "";
      const rows2 = config2.rows || 0;
      const portalLength = Buffer.byteLength(portal);
      const len = 4 + portalLength + 1 + 4;
      const buff = Buffer.allocUnsafe(1 + len);
      buff[0] = 69;
      buff.writeInt32BE(len, 1);
      buff.write(portal, 5, "utf-8");
      buff[portalLength + 5] = 0;
      buff.writeUInt32BE(rows2, buff.length - 4);
      return buff;
    }, "execute");
    var cancel = /* @__PURE__ */ __name((processID, secretKey) => {
      const buffer = Buffer.allocUnsafe(16);
      buffer.writeInt32BE(16, 0);
      buffer.writeInt16BE(1234, 4);
      buffer.writeInt16BE(5678, 6);
      buffer.writeInt32BE(processID, 8);
      buffer.writeInt32BE(secretKey, 12);
      return buffer;
    }, "cancel");
    var cstringMessage = /* @__PURE__ */ __name((code, string) => {
      const stringLen = Buffer.byteLength(string);
      const len = 4 + stringLen + 1;
      const buffer = Buffer.allocUnsafe(1 + len);
      buffer[0] = code;
      buffer.writeInt32BE(len, 1);
      buffer.write(string, 5, "utf-8");
      buffer[len] = 0;
      return buffer;
    }, "cstringMessage");
    var emptyDescribePortal = writer.addCString("P").flush(
      68
      /* code.describe */
    );
    var emptyDescribeStatement = writer.addCString("S").flush(
      68
      /* code.describe */
    );
    var describe = /* @__PURE__ */ __name((msg) => {
      return msg.name ? cstringMessage(68, `${msg.type}${msg.name || ""}`) : msg.type === "P" ? emptyDescribePortal : emptyDescribeStatement;
    }, "describe");
    var close = /* @__PURE__ */ __name((msg) => {
      const text2 = `${msg.type}${msg.name || ""}`;
      return cstringMessage(67, text2);
    }, "close");
    var copyData = /* @__PURE__ */ __name((chunk) => {
      return writer.add(chunk).flush(
        100
        /* code.copyFromChunk */
      );
    }, "copyData");
    var copyFail = /* @__PURE__ */ __name((message) => {
      return cstringMessage(102, message);
    }, "copyFail");
    var codeOnlyBuffer = /* @__PURE__ */ __name((code) => Buffer.from([code, 0, 0, 0, 4]), "codeOnlyBuffer");
    var flushBuffer = codeOnlyBuffer(
      72
      /* code.flush */
    );
    var syncBuffer = codeOnlyBuffer(
      83
      /* code.sync */
    );
    var endBuffer = codeOnlyBuffer(
      88
      /* code.end */
    );
    var copyDoneBuffer = codeOnlyBuffer(
      99
      /* code.copyDone */
    );
    var serialize = {
      startup,
      password,
      requestSsl,
      sendSASLInitialResponseMessage,
      sendSCRAMClientFinalMessage,
      query,
      parse,
      bind,
      execute,
      describe,
      close,
      flush: /* @__PURE__ */ __name(() => flushBuffer, "flush"),
      sync: /* @__PURE__ */ __name(() => syncBuffer, "sync"),
      end: /* @__PURE__ */ __name(() => endBuffer, "end"),
      copyData,
      copyDone: /* @__PURE__ */ __name(() => copyDoneBuffer, "copyDone"),
      copyFail,
      cancel
    };
    exports.serialize = serialize;
  }
});

// node_modules/pg-protocol/dist/buffer-reader.js
var require_buffer_reader = __commonJS({
  "node_modules/pg-protocol/dist/buffer-reader.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BufferReader = void 0;
    var BufferReader = class {
      static {
        __name(this, "BufferReader");
      }
      constructor(offset = 0) {
        this.offset = offset;
        this.buffer = Buffer.allocUnsafe(0);
        this.encoding = "utf-8";
      }
      setBuffer(offset, buffer) {
        this.offset = offset;
        this.buffer = buffer;
      }
      int16() {
        const result = this.buffer.readInt16BE(this.offset);
        this.offset += 2;
        return result;
      }
      byte() {
        const result = this.buffer[this.offset];
        this.offset++;
        return result;
      }
      int32() {
        const result = this.buffer.readInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      uint32() {
        const result = this.buffer.readUInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      string(length) {
        const result = this.buffer.toString(this.encoding, this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
      cstring() {
        const start = this.offset;
        let end = start;
        while (this.buffer[end++]) {
        }
        this.offset = end;
        return this.buffer.toString(this.encoding, start, end - 1);
      }
      bytes(length) {
        const result = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
    };
    exports.BufferReader = BufferReader;
  }
});

// node_modules/pg-protocol/dist/parser.js
var require_parser = __commonJS({
  "node_modules/pg-protocol/dist/parser.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Parser = void 0;
    var messages_1 = require_messages();
    var buffer_reader_1 = require_buffer_reader();
    var CODE_LENGTH = 1;
    var LEN_LENGTH = 4;
    var HEADER_LENGTH = CODE_LENGTH + LEN_LENGTH;
    var LATEINIT_LENGTH = -1;
    var emptyBuffer = Buffer.allocUnsafe(0);
    var Parser = class {
      static {
        __name(this, "Parser");
      }
      constructor(opts) {
        this.buffer = emptyBuffer;
        this.bufferLength = 0;
        this.bufferOffset = 0;
        this.reader = new buffer_reader_1.BufferReader();
        if ((opts === null || opts === void 0 ? void 0 : opts.mode) === "binary") {
          throw new Error("Binary mode not supported yet");
        }
        this.mode = (opts === null || opts === void 0 ? void 0 : opts.mode) || "text";
      }
      parse(buffer, callback) {
        this.mergeBuffer(buffer);
        const bufferFullLength = this.bufferOffset + this.bufferLength;
        let offset = this.bufferOffset;
        while (offset + HEADER_LENGTH <= bufferFullLength) {
          const code = this.buffer[offset];
          const length = this.buffer.readUInt32BE(offset + CODE_LENGTH);
          const fullMessageLength = CODE_LENGTH + length;
          if (fullMessageLength + offset <= bufferFullLength) {
            const message = this.handlePacket(offset + HEADER_LENGTH, code, length, this.buffer);
            callback(message);
            offset += fullMessageLength;
          } else {
            break;
          }
        }
        if (offset === bufferFullLength) {
          this.buffer = emptyBuffer;
          this.bufferLength = 0;
          this.bufferOffset = 0;
        } else {
          this.bufferLength = bufferFullLength - offset;
          this.bufferOffset = offset;
        }
      }
      mergeBuffer(buffer) {
        if (this.bufferLength > 0) {
          const newLength = this.bufferLength + buffer.byteLength;
          const newFullLength = newLength + this.bufferOffset;
          if (newFullLength > this.buffer.byteLength) {
            let newBuffer;
            if (newLength <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) {
              newBuffer = this.buffer;
            } else {
              let newBufferLength = this.buffer.byteLength * 2;
              while (newLength >= newBufferLength) {
                newBufferLength *= 2;
              }
              newBuffer = Buffer.allocUnsafe(newBufferLength);
            }
            this.buffer.copy(newBuffer, 0, this.bufferOffset, this.bufferOffset + this.bufferLength);
            this.buffer = newBuffer;
            this.bufferOffset = 0;
          }
          buffer.copy(this.buffer, this.bufferOffset + this.bufferLength);
          this.bufferLength = newLength;
        } else {
          this.buffer = buffer;
          this.bufferOffset = 0;
          this.bufferLength = buffer.byteLength;
        }
      }
      handlePacket(offset, code, length, bytes2) {
        const { reader } = this;
        reader.setBuffer(offset, bytes2);
        let message;
        switch (code) {
          case 50:
            message = messages_1.bindComplete;
            break;
          case 49:
            message = messages_1.parseComplete;
            break;
          case 51:
            message = messages_1.closeComplete;
            break;
          case 110:
            message = messages_1.noData;
            break;
          case 115:
            message = messages_1.portalSuspended;
            break;
          case 99:
            message = messages_1.copyDone;
            break;
          case 87:
            message = messages_1.replicationStart;
            break;
          case 73:
            message = messages_1.emptyQuery;
            break;
          case 68:
            message = parseDataRowMessage(reader);
            break;
          case 67:
            message = parseCommandCompleteMessage(reader);
            break;
          case 90:
            message = parseReadyForQueryMessage(reader);
            break;
          case 65:
            message = parseNotificationMessage(reader);
            break;
          case 82:
            message = parseAuthenticationResponse(reader, length);
            break;
          case 83:
            message = parseParameterStatusMessage(reader);
            break;
          case 75:
            message = parseBackendKeyData(reader);
            break;
          case 69:
            message = parseErrorMessage(reader, "error");
            break;
          case 78:
            message = parseErrorMessage(reader, "notice");
            break;
          case 84:
            message = parseRowDescriptionMessage(reader);
            break;
          case 116:
            message = parseParameterDescriptionMessage(reader);
            break;
          case 71:
            message = parseCopyInMessage(reader);
            break;
          case 72:
            message = parseCopyOutMessage(reader);
            break;
          case 100:
            message = parseCopyData(reader, length);
            break;
          default:
            return new messages_1.DatabaseError("received invalid response: " + code.toString(16), length, "error");
        }
        reader.setBuffer(0, emptyBuffer);
        message.length = length;
        return message;
      }
    };
    exports.Parser = Parser;
    var parseReadyForQueryMessage = /* @__PURE__ */ __name((reader) => {
      const status = reader.string(1);
      return new messages_1.ReadyForQueryMessage(LATEINIT_LENGTH, status);
    }, "parseReadyForQueryMessage");
    var parseCommandCompleteMessage = /* @__PURE__ */ __name((reader) => {
      const text2 = reader.cstring();
      return new messages_1.CommandCompleteMessage(LATEINIT_LENGTH, text2);
    }, "parseCommandCompleteMessage");
    var parseCopyData = /* @__PURE__ */ __name((reader, length) => {
      const chunk = reader.bytes(length - 4);
      return new messages_1.CopyDataMessage(LATEINIT_LENGTH, chunk);
    }, "parseCopyData");
    var parseCopyInMessage = /* @__PURE__ */ __name((reader) => parseCopyMessage(reader, "copyInResponse"), "parseCopyInMessage");
    var parseCopyOutMessage = /* @__PURE__ */ __name((reader) => parseCopyMessage(reader, "copyOutResponse"), "parseCopyOutMessage");
    var parseCopyMessage = /* @__PURE__ */ __name((reader, messageName) => {
      const isBinary = reader.byte() !== 0;
      const columnCount = reader.int16();
      const message = new messages_1.CopyResponse(LATEINIT_LENGTH, messageName, isBinary, columnCount);
      for (let i = 0; i < columnCount; i++) {
        message.columnTypes[i] = reader.int16();
      }
      return message;
    }, "parseCopyMessage");
    var parseNotificationMessage = /* @__PURE__ */ __name((reader) => {
      const processId = reader.int32();
      const channel2 = reader.cstring();
      const payload = reader.cstring();
      return new messages_1.NotificationResponseMessage(LATEINIT_LENGTH, processId, channel2, payload);
    }, "parseNotificationMessage");
    var parseRowDescriptionMessage = /* @__PURE__ */ __name((reader) => {
      const fieldCount = reader.int16();
      const message = new messages_1.RowDescriptionMessage(LATEINIT_LENGTH, fieldCount);
      for (let i = 0; i < fieldCount; i++) {
        message.fields[i] = parseField(reader);
      }
      return message;
    }, "parseRowDescriptionMessage");
    var parseField = /* @__PURE__ */ __name((reader) => {
      const name = reader.cstring();
      const tableID = reader.uint32();
      const columnID = reader.int16();
      const dataTypeID = reader.uint32();
      const dataTypeSize = reader.int16();
      const dataTypeModifier = reader.int32();
      const mode = reader.int16() === 0 ? "text" : "binary";
      return new messages_1.Field(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, mode);
    }, "parseField");
    var parseParameterDescriptionMessage = /* @__PURE__ */ __name((reader) => {
      const parameterCount = reader.int16();
      const message = new messages_1.ParameterDescriptionMessage(LATEINIT_LENGTH, parameterCount);
      for (let i = 0; i < parameterCount; i++) {
        message.dataTypeIDs[i] = reader.uint32();
      }
      return message;
    }, "parseParameterDescriptionMessage");
    var parseDataRowMessage = /* @__PURE__ */ __name((reader) => {
      const fieldCount = reader.int16();
      const fields = new Array(fieldCount);
      for (let i = 0; i < fieldCount; i++) {
        const len = reader.int32();
        fields[i] = len === -1 ? null : reader.string(len);
      }
      return new messages_1.DataRowMessage(LATEINIT_LENGTH, fields);
    }, "parseDataRowMessage");
    var parseParameterStatusMessage = /* @__PURE__ */ __name((reader) => {
      const name = reader.cstring();
      const value = reader.cstring();
      return new messages_1.ParameterStatusMessage(LATEINIT_LENGTH, name, value);
    }, "parseParameterStatusMessage");
    var parseBackendKeyData = /* @__PURE__ */ __name((reader) => {
      const processID = reader.int32();
      const secretKey = reader.int32();
      return new messages_1.BackendKeyDataMessage(LATEINIT_LENGTH, processID, secretKey);
    }, "parseBackendKeyData");
    var parseAuthenticationResponse = /* @__PURE__ */ __name((reader, length) => {
      const code = reader.int32();
      const message = {
        name: "authenticationOk",
        length
      };
      switch (code) {
        case 0:
          break;
        case 3:
          if (message.length === 8) {
            message.name = "authenticationCleartextPassword";
          }
          break;
        case 5:
          if (message.length === 12) {
            message.name = "authenticationMD5Password";
            const salt = reader.bytes(4);
            return new messages_1.AuthenticationMD5Password(LATEINIT_LENGTH, salt);
          }
          break;
        case 10:
          {
            message.name = "authenticationSASL";
            message.mechanisms = [];
            let mechanism;
            do {
              mechanism = reader.cstring();
              if (mechanism) {
                message.mechanisms.push(mechanism);
              }
            } while (mechanism);
          }
          break;
        case 11:
          message.name = "authenticationSASLContinue";
          message.data = reader.string(length - 8);
          break;
        case 12:
          message.name = "authenticationSASLFinal";
          message.data = reader.string(length - 8);
          break;
        default:
          throw new Error("Unknown authenticationOk message type " + code);
      }
      return message;
    }, "parseAuthenticationResponse");
    var parseErrorMessage = /* @__PURE__ */ __name((reader, name) => {
      const fields = {};
      let fieldType = reader.string(1);
      while (fieldType !== "\0") {
        fields[fieldType] = reader.cstring();
        fieldType = reader.string(1);
      }
      const messageValue = fields.M;
      const message = name === "notice" ? new messages_1.NoticeMessage(LATEINIT_LENGTH, messageValue) : new messages_1.DatabaseError(messageValue, LATEINIT_LENGTH, name);
      message.severity = fields.S;
      message.code = fields.C;
      message.detail = fields.D;
      message.hint = fields.H;
      message.position = fields.P;
      message.internalPosition = fields.p;
      message.internalQuery = fields.q;
      message.where = fields.W;
      message.schema = fields.s;
      message.table = fields.t;
      message.column = fields.c;
      message.dataType = fields.d;
      message.constraint = fields.n;
      message.file = fields.F;
      message.line = fields.L;
      message.routine = fields.R;
      return message;
    }, "parseErrorMessage");
  }
});

// node_modules/pg-protocol/dist/index.js
var require_dist = __commonJS({
  "node_modules/pg-protocol/dist/index.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DatabaseError = exports.serialize = void 0;
    exports.parse = parse;
    var messages_1 = require_messages();
    Object.defineProperty(exports, "DatabaseError", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return messages_1.DatabaseError;
    }, "get") });
    var serializer_1 = require_serializer();
    Object.defineProperty(exports, "serialize", { enumerable: true, get: /* @__PURE__ */ __name(function() {
      return serializer_1.serialize;
    }, "get") });
    var parser_1 = require_parser();
    function parse(stream, callback) {
      const parser = new parser_1.Parser();
      stream.on("data", (buffer) => parser.parse(buffer, callback));
      return new Promise((resolve) => stream.on("end", () => resolve()));
    }
    __name(parse, "parse");
  }
});

// node-built-in-modules:net
import libDefault6 from "net";
var require_net = __commonJS({
  "node-built-in-modules:net"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault6;
  }
});

// node-built-in-modules:tls
import libDefault7 from "tls";
var require_tls = __commonJS({
  "node-built-in-modules:tls"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault7;
  }
});

// node_modules/pg-cloudflare/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/pg-cloudflare/dist/index.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CloudflareSocket = void 0;
    var events_1 = require_events();
    var CloudflareSocket = class extends events_1.EventEmitter {
      static {
        __name(this, "CloudflareSocket");
      }
      constructor(ssl) {
        super();
        this.ssl = ssl;
        this.writable = false;
        this.destroyed = false;
        this._upgrading = false;
        this._upgraded = false;
        this._cfSocket = null;
        this._cfWriter = null;
        this._cfReader = null;
      }
      setNoDelay() {
        return this;
      }
      setKeepAlive() {
        return this;
      }
      ref() {
        return this;
      }
      unref() {
        return this;
      }
      async connect(port, host, connectListener) {
        try {
          log3("connecting");
          if (connectListener)
            this.once("connect", connectListener);
          const options = this.ssl ? { secureTransport: "starttls" } : {};
          const mod = await import("cloudflare:sockets");
          const connect = mod.connect;
          this._cfSocket = connect(`${host}:${port}`, options);
          this._cfWriter = this._cfSocket.writable.getWriter();
          this._addClosedHandler();
          this._cfReader = this._cfSocket.readable.getReader();
          if (this.ssl) {
            this._listenOnce().catch((e) => this.emit("error", e));
          } else {
            this._listen().catch((e) => this.emit("error", e));
          }
          await this._cfWriter.ready;
          log3("socket ready");
          this.writable = true;
          this.emit("connect");
          return this;
        } catch (e) {
          this.emit("error", e);
        }
      }
      async _listen() {
        while (true) {
          log3("awaiting receive from CF socket");
          const { done, value } = await this._cfReader.read();
          log3("CF socket received:", done, value);
          if (done) {
            log3("done");
            break;
          }
          this.emit("data", Buffer.from(value));
        }
      }
      async _listenOnce() {
        log3("awaiting first receive from CF socket");
        const { done, value } = await this._cfReader.read();
        log3("First CF socket received:", done, value);
        this.emit("data", Buffer.from(value));
      }
      write(data, encodingOrCallback = "utf8", callback = () => {
      }) {
        const encoding = typeof encodingOrCallback === "function" ? "utf8" : encodingOrCallback;
        if (typeof encodingOrCallback === "function")
          callback = encodingOrCallback;
        if (data.length === 0)
          return callback();
        if (typeof data === "string")
          data = Buffer.from(data, encoding);
        log3("sending data direct:", data);
        this._cfWriter.write(data).then(() => {
          log3("data sent");
          callback();
        }, (err) => {
          log3("send error", err);
          callback(err);
        });
        return true;
      }
      end(data = Buffer.alloc(0), encoding = "utf8", callback = () => {
      }) {
        log3("ending CF socket");
        this.write(data, encoding, (err) => {
          const socket = this._cfSocket;
          const closePromise = socket?.close();
          closePromise?.then(() => {
            if (this._cfSocket === socket) {
              this._cfSocket = null;
              this.emit("close");
            }
          }).catch((e) => this.emit("error", e));
          if (callback)
            callback(err);
        });
        return this;
      }
      destroy(reason) {
        log3("destroying CF socket", reason);
        this.destroyed = true;
        return this.end();
      }
      startTls(options) {
        if (this._upgraded) {
          this.emit("error", "Cannot call `startTls()` more than once on a socket");
          return;
        }
        this._cfWriter.releaseLock();
        this._cfReader.releaseLock();
        this._upgrading = true;
        this._cfSocket = this._cfSocket.startTls(options);
        this._cfWriter = this._cfSocket.writable.getWriter();
        this._cfReader = this._cfSocket.readable.getReader();
        this._addClosedHandler();
        this._listen().catch((e) => this.emit("error", e));
      }
      _addClosedHandler() {
        const socket = this._cfSocket;
        socket.closed.then(() => {
          if (!this._upgrading) {
            log3("CF socket closed");
            if (this._cfSocket === socket) {
              this._cfSocket = null;
              this.emit("close");
            }
          } else {
            this._upgrading = false;
            this._upgraded = true;
          }
        }).catch((e) => this.emit("error", e));
      }
    };
    exports.CloudflareSocket = CloudflareSocket;
    var debug3 = false;
    function dump(data) {
      if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
        const buf = data instanceof Uint8Array ? Buffer.from(data) : Buffer.from(data);
        const hex2 = buf.toString("hex");
        const str2 = new TextDecoder().decode(data);
        return `
>>> STR: "${str2.replace(/\n/g, "\\n")}"
>>> HEX: ${hex2}
`;
      } else {
        return data;
      }
    }
    __name(dump, "dump");
    function log3(...args) {
      debug3 && console.log(...args.map(dump));
    }
    __name(log3, "log");
  }
});

// node_modules/pg/lib/stream.js
var require_stream = __commonJS({
  "node_modules/pg/lib/stream.js"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var { getStream, getSecureStream } = getStreamFuncs();
    module.exports = {
      /**
       * Get a socket stream compatible with the current runtime environment.
       * @returns {Duplex}
       */
      getStream,
      /**
       * Get a TLS secured socket, compatible with the current environment,
       * using the socket and other settings given in `options`.
       * @returns {Duplex}
       */
      getSecureStream
    };
    function getNodejsStreamFuncs() {
      function getStream2(ssl) {
        const net = require_net();
        return new net.Socket();
      }
      __name(getStream2, "getStream");
      function getSecureStream2(options) {
        const tls = require_tls();
        return tls.connect(options);
      }
      __name(getSecureStream2, "getSecureStream");
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    __name(getNodejsStreamFuncs, "getNodejsStreamFuncs");
    function getCloudflareStreamFuncs() {
      function getStream2(ssl) {
        const { CloudflareSocket } = require_dist2();
        return new CloudflareSocket(ssl);
      }
      __name(getStream2, "getStream");
      function getSecureStream2(options) {
        options.socket.startTls(options);
        return options.socket;
      }
      __name(getSecureStream2, "getSecureStream");
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    __name(getCloudflareStreamFuncs, "getCloudflareStreamFuncs");
    function isCloudflareRuntime() {
      if (typeof navigator === "object" && navigator !== null && true) {
        return true;
      }
      if (typeof Response === "function") {
        const resp = new Response(null, { cf: { thing: true } });
        if (typeof resp.cf === "object" && resp.cf !== null && resp.cf.thing) {
          return true;
        }
      }
      return false;
    }
    __name(isCloudflareRuntime, "isCloudflareRuntime");
    function getStreamFuncs() {
      if (isCloudflareRuntime()) {
        return getCloudflareStreamFuncs();
      }
      return getNodejsStreamFuncs();
    }
    __name(getStreamFuncs, "getStreamFuncs");
  }
});

// node_modules/pg/lib/connection.js
var require_connection = __commonJS({
  "node_modules/pg/lib/connection.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var EventEmitter2 = require_events().EventEmitter;
    var { parse, serialize } = require_dist();
    var { getStream, getSecureStream } = require_stream();
    var flushBuffer = serialize.flush();
    var syncBuffer = serialize.sync();
    var endBuffer = serialize.end();
    var Connection2 = class extends EventEmitter2 {
      static {
        __name(this, "Connection");
      }
      constructor(config2) {
        super();
        config2 = config2 || {};
        this.stream = config2.stream || getStream(config2.ssl);
        if (typeof this.stream === "function") {
          this.stream = this.stream(config2);
        }
        this._keepAlive = config2.keepAlive;
        this._keepAliveInitialDelayMillis = config2.keepAliveInitialDelayMillis;
        this.lastBuffer = false;
        this.parsedStatements = {};
        this.ssl = config2.ssl || false;
        this._ending = false;
        this._emitMessage = false;
        const self = this;
        this.on("newListener", function(eventName) {
          if (eventName === "message") {
            self._emitMessage = true;
          }
        });
      }
      connect(port, host) {
        const self = this;
        this._connecting = true;
        this.stream.setNoDelay(true);
        this.stream.connect(port, host);
        this.stream.once("connect", function() {
          if (self._keepAlive) {
            self.stream.setKeepAlive(true, self._keepAliveInitialDelayMillis);
          }
          self.emit("connect");
        });
        const reportStreamError = /* @__PURE__ */ __name(function(error4) {
          if (self._ending && (error4.code === "ECONNRESET" || error4.code === "EPIPE")) {
            return;
          }
          self.emit("error", error4);
        }, "reportStreamError");
        this.stream.on("error", reportStreamError);
        this.stream.on("close", function() {
          self.emit("end");
        });
        if (!this.ssl) {
          return this.attachListeners(this.stream);
        }
        this.stream.once("data", function(buffer) {
          const responseCode = buffer.toString("utf8");
          switch (responseCode) {
            case "S":
              break;
            case "N":
              self.stream.end();
              return self.emit("error", new Error("The server does not support SSL connections"));
            default:
              self.stream.end();
              return self.emit("error", new Error("There was an error establishing an SSL connection"));
          }
          const options = {
            socket: self.stream
          };
          if (self.ssl !== true) {
            Object.assign(options, self.ssl);
            if ("key" in self.ssl) {
              options.key = self.ssl.key;
            }
          }
          const net = require_net();
          if (net.isIP && net.isIP(host) === 0) {
            options.servername = host;
          }
          try {
            self.stream = getSecureStream(options);
          } catch (err) {
            return self.emit("error", err);
          }
          self.attachListeners(self.stream);
          self.stream.on("error", reportStreamError);
          self.emit("sslconnect");
        });
      }
      attachListeners(stream) {
        parse(stream, (msg) => {
          const eventName = msg.name === "error" ? "errorMessage" : msg.name;
          if (this._emitMessage) {
            this.emit("message", msg);
          }
          this.emit(eventName, msg);
        });
      }
      requestSsl() {
        this.stream.write(serialize.requestSsl());
      }
      startup(config2) {
        this.stream.write(serialize.startup(config2));
      }
      cancel(processID, secretKey) {
        this._send(serialize.cancel(processID, secretKey));
      }
      password(password) {
        this._send(serialize.password(password));
      }
      sendSASLInitialResponseMessage(mechanism, initialResponse) {
        this._send(serialize.sendSASLInitialResponseMessage(mechanism, initialResponse));
      }
      sendSCRAMClientFinalMessage(additionalData) {
        this._send(serialize.sendSCRAMClientFinalMessage(additionalData));
      }
      _send(buffer) {
        if (!this.stream.writable) {
          return false;
        }
        return this.stream.write(buffer);
      }
      query(text2) {
        this._send(serialize.query(text2));
      }
      // send parse message
      parse(query) {
        this._send(serialize.parse(query));
      }
      // send bind message
      bind(config2) {
        this._send(serialize.bind(config2));
      }
      // send execute message
      execute(config2) {
        this._send(serialize.execute(config2));
      }
      flush() {
        if (this.stream.writable) {
          this.stream.write(flushBuffer);
        }
      }
      sync() {
        this._ending = true;
        this._send(syncBuffer);
      }
      ref() {
        this.stream.ref();
      }
      unref() {
        this.stream.unref();
      }
      end() {
        this._ending = true;
        if (!this._connecting || !this.stream.writable) {
          this.stream.end();
          return;
        }
        return this.stream.write(endBuffer, () => {
          this.stream.end();
        });
      }
      close(msg) {
        this._send(serialize.close(msg));
      }
      describe(msg) {
        this._send(serialize.describe(msg));
      }
      sendCopyFromChunk(chunk) {
        this._send(serialize.copyData(chunk));
      }
      endCopyFrom() {
        this._send(serialize.copyDone());
      }
      sendCopyFail(msg) {
        this._send(serialize.copyFail(msg));
      }
    };
    module.exports = Connection2;
  }
});

// node-built-in-modules:path
import libDefault8 from "path";
var require_path = __commonJS({
  "node-built-in-modules:path"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault8;
  }
});

// node-built-in-modules:stream
import libDefault9 from "stream";
var require_stream2 = __commonJS({
  "node-built-in-modules:stream"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault9;
  }
});

// node-built-in-modules:string_decoder
import libDefault10 from "string_decoder";
var require_string_decoder = __commonJS({
  "node-built-in-modules:string_decoder"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = libDefault10;
  }
});

// node_modules/split2/index.js
var require_split2 = __commonJS({
  "node_modules/split2/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var { Transform } = require_stream2();
    var { StringDecoder } = require_string_decoder();
    var kLast = Symbol("last");
    var kDecoder = Symbol("decoder");
    function transform(chunk, enc, cb) {
      let list;
      if (this.overflow) {
        const buf = this[kDecoder].write(chunk);
        list = buf.split(this.matcher);
        if (list.length === 1) return cb();
        list.shift();
        this.overflow = false;
      } else {
        this[kLast] += this[kDecoder].write(chunk);
        list = this[kLast].split(this.matcher);
      }
      this[kLast] = list.pop();
      for (let i = 0; i < list.length; i++) {
        try {
          push(this, this.mapper(list[i]));
        } catch (error4) {
          return cb(error4);
        }
      }
      this.overflow = this[kLast].length > this.maxLength;
      if (this.overflow && !this.skipOverflow) {
        cb(new Error("maximum buffer reached"));
        return;
      }
      cb();
    }
    __name(transform, "transform");
    function flush(cb) {
      this[kLast] += this[kDecoder].end();
      if (this[kLast]) {
        try {
          push(this, this.mapper(this[kLast]));
        } catch (error4) {
          return cb(error4);
        }
      }
      cb();
    }
    __name(flush, "flush");
    function push(self, val) {
      if (val !== void 0) {
        self.push(val);
      }
    }
    __name(push, "push");
    function noop(incoming) {
      return incoming;
    }
    __name(noop, "noop");
    function split(matcher, mapper, options) {
      matcher = matcher || /\r?\n/;
      mapper = mapper || noop;
      options = options || {};
      switch (arguments.length) {
        case 1:
          if (typeof matcher === "function") {
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof matcher === "object" && !(matcher instanceof RegExp) && !matcher[Symbol.split]) {
            options = matcher;
            matcher = /\r?\n/;
          }
          break;
        case 2:
          if (typeof matcher === "function") {
            options = mapper;
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof mapper === "object") {
            options = mapper;
            mapper = noop;
          }
      }
      options = Object.assign({}, options);
      options.autoDestroy = true;
      options.transform = transform;
      options.flush = flush;
      options.readableObjectMode = true;
      const stream = new Transform(options);
      stream[kLast] = "";
      stream[kDecoder] = new StringDecoder("utf8");
      stream.matcher = matcher;
      stream.mapper = mapper;
      stream.maxLength = options.maxLength;
      stream.skipOverflow = options.skipOverflow || false;
      stream.overflow = false;
      stream._destroy = function(err, cb) {
        this._writableState.errorEmitted = false;
        cb(err);
      };
      return stream;
    }
    __name(split, "split");
    module.exports = split;
  }
});

// node_modules/pgpass/lib/helper.js
var require_helper = __commonJS({
  "node_modules/pgpass/lib/helper.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var path = require_path();
    var Stream = require_stream2().Stream;
    var split = require_split2();
    var util = require_util();
    var defaultPort = 5432;
    var isWin = process.platform === "win32";
    var warnStream = process.stderr;
    var S_IRWXG = 56;
    var S_IRWXO = 7;
    var S_IFMT = 61440;
    var S_IFREG = 32768;
    function isRegFile(mode) {
      return (mode & S_IFMT) == S_IFREG;
    }
    __name(isRegFile, "isRegFile");
    var fieldNames = ["host", "port", "database", "user", "password"];
    var nrOfFields = fieldNames.length;
    var passKey = fieldNames[nrOfFields - 1];
    function warn3() {
      var isWritable = warnStream instanceof Stream && true === warnStream.writable;
      if (isWritable) {
        var args = Array.prototype.slice.call(arguments).concat("\n");
        warnStream.write(util.format.apply(util, args));
      }
    }
    __name(warn3, "warn");
    Object.defineProperty(module.exports, "isWin", {
      get: /* @__PURE__ */ __name(function() {
        return isWin;
      }, "get"),
      set: /* @__PURE__ */ __name(function(val) {
        isWin = val;
      }, "set")
    });
    module.exports.warnTo = function(stream) {
      var old = warnStream;
      warnStream = stream;
      return old;
    };
    module.exports.getFileName = function(rawEnv) {
      var env2 = rawEnv || process.env;
      var file = env2.PGPASSFILE || (isWin ? path.join(env2.APPDATA || "./", "postgresql", "pgpass.conf") : path.join(env2.HOME || "./", ".pgpass"));
      return file;
    };
    module.exports.usePgPass = function(stats, fname) {
      if (Object.prototype.hasOwnProperty.call(process.env, "PGPASSWORD")) {
        return false;
      }
      if (isWin) {
        return true;
      }
      fname = fname || "<unkn>";
      if (!isRegFile(stats.mode)) {
        warn3('WARNING: password file "%s" is not a plain file', fname);
        return false;
      }
      if (stats.mode & (S_IRWXG | S_IRWXO)) {
        warn3('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', fname);
        return false;
      }
      return true;
    };
    var matcher = module.exports.match = function(connInfo, entry) {
      return fieldNames.slice(0, -1).reduce(function(prev, field, idx) {
        if (idx == 1) {
          if (Number(connInfo[field] || defaultPort) === Number(entry[field])) {
            return prev && true;
          }
        }
        return prev && (entry[field] === "*" || entry[field] === connInfo[field]);
      }, true);
    };
    module.exports.getPassword = function(connInfo, stream, cb) {
      var pass;
      var lineStream = stream.pipe(split());
      function onLine(line) {
        var entry = parseLine(line);
        if (entry && isValidEntry(entry) && matcher(connInfo, entry)) {
          pass = entry[passKey];
          lineStream.end();
        }
      }
      __name(onLine, "onLine");
      var onEnd = /* @__PURE__ */ __name(function() {
        stream.destroy();
        cb(pass);
      }, "onEnd");
      var onErr = /* @__PURE__ */ __name(function(err) {
        stream.destroy();
        warn3("WARNING: error on reading file: %s", err);
        cb(void 0);
      }, "onErr");
      stream.on("error", onErr);
      lineStream.on("data", onLine).on("end", onEnd).on("error", onErr);
    };
    var parseLine = module.exports.parseLine = function(line) {
      if (line.length < 11 || line.match(/^\s+#/)) {
        return null;
      }
      var curChar = "";
      var prevChar = "";
      var fieldIdx = 0;
      var startIdx = 0;
      var endIdx = 0;
      var obj = {};
      var isLastField = false;
      var addToObj = /* @__PURE__ */ __name(function(idx, i0, i1) {
        var field = line.substring(i0, i1);
        if (!Object.hasOwnProperty.call(process.env, "PGPASS_NO_DEESCAPE")) {
          field = field.replace(/\\([:\\])/g, "$1");
        }
        obj[fieldNames[idx]] = field;
      }, "addToObj");
      for (var i = 0; i < line.length - 1; i += 1) {
        curChar = line.charAt(i + 1);
        prevChar = line.charAt(i);
        isLastField = fieldIdx == nrOfFields - 1;
        if (isLastField) {
          addToObj(fieldIdx, startIdx);
          break;
        }
        if (i >= 0 && curChar == ":" && prevChar !== "\\") {
          addToObj(fieldIdx, startIdx, i + 1);
          startIdx = i + 2;
          fieldIdx += 1;
        }
      }
      obj = Object.keys(obj).length === nrOfFields ? obj : null;
      return obj;
    };
    var isValidEntry = module.exports.isValidEntry = function(entry) {
      var rules = {
        // host
        0: function(x) {
          return x.length > 0;
        },
        // port
        1: function(x) {
          if (x === "*") {
            return true;
          }
          x = Number(x);
          return isFinite(x) && x > 0 && x < 9007199254740992 && Math.floor(x) === x;
        },
        // database
        2: function(x) {
          return x.length > 0;
        },
        // username
        3: function(x) {
          return x.length > 0;
        },
        // password
        4: function(x) {
          return x.length > 0;
        }
      };
      for (var idx = 0; idx < fieldNames.length; idx += 1) {
        var rule = rules[idx];
        var value = entry[fieldNames[idx]] || "";
        var res = rule(value);
        if (!res) {
          return false;
        }
      }
      return true;
    };
  }
});

// node_modules/pgpass/lib/index.js
var require_lib = __commonJS({
  "node_modules/pgpass/lib/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var path = require_path();
    var fs = require_fs();
    var helper = require_helper();
    module.exports = function(connInfo, cb) {
      var file = helper.getFileName();
      fs.stat(file, function(err, stat) {
        if (err || !helper.usePgPass(stat, file)) {
          return cb(void 0);
        }
        var st = fs.createReadStream(file);
        helper.getPassword(connInfo, st, cb);
      });
    };
    module.exports.warnTo = helper.warnTo;
  }
});

// node_modules/pg/lib/client.js
var require_client = __commonJS({
  "node_modules/pg/lib/client.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var EventEmitter2 = require_events().EventEmitter;
    var utils = require_utils();
    var sasl = require_sasl();
    var TypeOverrides2 = require_type_overrides();
    var ConnectionParameters = require_connection_parameters();
    var Query2 = require_query();
    var defaults2 = require_defaults();
    var Connection2 = require_connection();
    var crypto2 = require_utils2();
    var Client2 = class extends EventEmitter2 {
      static {
        __name(this, "Client");
      }
      constructor(config2) {
        super();
        this.connectionParameters = new ConnectionParameters(config2);
        this.user = this.connectionParameters.user;
        this.database = this.connectionParameters.database;
        this.port = this.connectionParameters.port;
        this.host = this.connectionParameters.host;
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: this.connectionParameters.password
        });
        this.replication = this.connectionParameters.replication;
        const c = config2 || {};
        this._Promise = c.Promise || global.Promise;
        this._types = new TypeOverrides2(c.types);
        this._ending = false;
        this._ended = false;
        this._connecting = false;
        this._connected = false;
        this._connectionError = false;
        this._queryable = true;
        this.enableChannelBinding = Boolean(c.enableChannelBinding);
        this.connection = c.connection || new Connection2({
          stream: c.stream,
          ssl: this.connectionParameters.ssl,
          keepAlive: c.keepAlive || false,
          keepAliveInitialDelayMillis: c.keepAliveInitialDelayMillis || 0,
          encoding: this.connectionParameters.client_encoding || "utf8"
        });
        this.queryQueue = [];
        this.binary = c.binary || defaults2.binary;
        this.processID = null;
        this.secretKey = null;
        this.ssl = this.connectionParameters.ssl || false;
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this._connectionTimeoutMillis = c.connectionTimeoutMillis || 0;
      }
      _errorAllQueries(err) {
        const enqueueError = /* @__PURE__ */ __name((query) => {
          process.nextTick(() => {
            query.handleError(err, this.connection);
          });
        }, "enqueueError");
        if (this.activeQuery) {
          enqueueError(this.activeQuery);
          this.activeQuery = null;
        }
        this.queryQueue.forEach(enqueueError);
        this.queryQueue.length = 0;
      }
      _connect(callback) {
        const self = this;
        const con = this.connection;
        this._connectionCallback = callback;
        if (this._connecting || this._connected) {
          const err = new Error("Client has already been connected. You cannot reuse a client.");
          process.nextTick(() => {
            callback(err);
          });
          return;
        }
        this._connecting = true;
        if (this._connectionTimeoutMillis > 0) {
          this.connectionTimeoutHandle = setTimeout(() => {
            con._ending = true;
            con.stream.destroy(new Error("timeout expired"));
          }, this._connectionTimeoutMillis);
          if (this.connectionTimeoutHandle.unref) {
            this.connectionTimeoutHandle.unref();
          }
        }
        if (this.host && this.host.indexOf("/") === 0) {
          con.connect(this.host + "/.s.PGSQL." + this.port);
        } else {
          con.connect(this.port, this.host);
        }
        con.on("connect", function() {
          if (self.ssl) {
            con.requestSsl();
          } else {
            con.startup(self.getStartupConf());
          }
        });
        con.on("sslconnect", function() {
          con.startup(self.getStartupConf());
        });
        this._attachListeners(con);
        con.once("end", () => {
          const error4 = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
          clearTimeout(this.connectionTimeoutHandle);
          this._errorAllQueries(error4);
          this._ended = true;
          if (!this._ending) {
            if (this._connecting && !this._connectionError) {
              if (this._connectionCallback) {
                this._connectionCallback(error4);
              } else {
                this._handleErrorEvent(error4);
              }
            } else if (!this._connectionError) {
              this._handleErrorEvent(error4);
            }
          }
          process.nextTick(() => {
            this.emit("end");
          });
        });
      }
      connect(callback) {
        if (callback) {
          this._connect(callback);
          return;
        }
        return new this._Promise((resolve, reject) => {
          this._connect((error4) => {
            if (error4) {
              reject(error4);
            } else {
              resolve();
            }
          });
        });
      }
      _attachListeners(con) {
        con.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this));
        con.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this));
        con.on("authenticationSASL", this._handleAuthSASL.bind(this));
        con.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this));
        con.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this));
        con.on("backendKeyData", this._handleBackendKeyData.bind(this));
        con.on("error", this._handleErrorEvent.bind(this));
        con.on("errorMessage", this._handleErrorMessage.bind(this));
        con.on("readyForQuery", this._handleReadyForQuery.bind(this));
        con.on("notice", this._handleNotice.bind(this));
        con.on("rowDescription", this._handleRowDescription.bind(this));
        con.on("dataRow", this._handleDataRow.bind(this));
        con.on("portalSuspended", this._handlePortalSuspended.bind(this));
        con.on("emptyQuery", this._handleEmptyQuery.bind(this));
        con.on("commandComplete", this._handleCommandComplete.bind(this));
        con.on("parseComplete", this._handleParseComplete.bind(this));
        con.on("copyInResponse", this._handleCopyInResponse.bind(this));
        con.on("copyData", this._handleCopyData.bind(this));
        con.on("notification", this._handleNotification.bind(this));
      }
      // TODO(bmc): deprecate pgpass "built in" integration since this.password can be a function
      // it can be supplied by the user if required - this is a breaking change!
      _checkPgPass(cb) {
        const con = this.connection;
        if (typeof this.password === "function") {
          this._Promise.resolve().then(() => this.password()).then((pass) => {
            if (pass !== void 0) {
              if (typeof pass !== "string") {
                con.emit("error", new TypeError("Password must be a string"));
                return;
              }
              this.connectionParameters.password = this.password = pass;
            } else {
              this.connectionParameters.password = this.password = null;
            }
            cb();
          }).catch((err) => {
            con.emit("error", err);
          });
        } else if (this.password !== null) {
          cb();
        } else {
          try {
            const pgPass = require_lib();
            pgPass(this.connectionParameters, (pass) => {
              if (void 0 !== pass) {
                this.connectionParameters.password = this.password = pass;
              }
              cb();
            });
          } catch (e) {
            this.emit("error", e);
          }
        }
      }
      _handleAuthCleartextPassword(msg) {
        this._checkPgPass(() => {
          this.connection.password(this.password);
        });
      }
      _handleAuthMD5Password(msg) {
        this._checkPgPass(async () => {
          try {
            const hashedPassword = await crypto2.postgresMd5PasswordHash(this.user, this.password, msg.salt);
            this.connection.password(hashedPassword);
          } catch (e) {
            this.emit("error", e);
          }
        });
      }
      _handleAuthSASL(msg) {
        this._checkPgPass(() => {
          try {
            this.saslSession = sasl.startSession(msg.mechanisms, this.enableChannelBinding && this.connection.stream);
            this.connection.sendSASLInitialResponseMessage(this.saslSession.mechanism, this.saslSession.response);
          } catch (err) {
            this.connection.emit("error", err);
          }
        });
      }
      async _handleAuthSASLContinue(msg) {
        try {
          await sasl.continueSession(
            this.saslSession,
            this.password,
            msg.data,
            this.enableChannelBinding && this.connection.stream
          );
          this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleAuthSASLFinal(msg) {
        try {
          sasl.finalizeSession(this.saslSession, msg.data);
          this.saslSession = null;
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleBackendKeyData(msg) {
        this.processID = msg.processID;
        this.secretKey = msg.secretKey;
      }
      _handleReadyForQuery(msg) {
        if (this._connecting) {
          this._connecting = false;
          this._connected = true;
          clearTimeout(this.connectionTimeoutHandle);
          if (this._connectionCallback) {
            this._connectionCallback(null, this);
            this._connectionCallback = null;
          }
          this.emit("connect");
        }
        const { activeQuery } = this;
        this.activeQuery = null;
        this.readyForQuery = true;
        if (activeQuery) {
          activeQuery.handleReadyForQuery(this.connection);
        }
        this._pulseQueryQueue();
      }
      // if we receive an error event or error message
      // during the connection process we handle it here
      _handleErrorWhileConnecting(err) {
        if (this._connectionError) {
          return;
        }
        this._connectionError = true;
        clearTimeout(this.connectionTimeoutHandle);
        if (this._connectionCallback) {
          return this._connectionCallback(err);
        }
        this.emit("error", err);
      }
      // if we're connected and we receive an error event from the connection
      // this means the socket is dead - do a hard abort of all queries and emit
      // the socket error on the client as well
      _handleErrorEvent(err) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(err);
        }
        this._queryable = false;
        this._errorAllQueries(err);
        this.emit("error", err);
      }
      // handle error messages from the postgres backend
      _handleErrorMessage(msg) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(msg);
        }
        const activeQuery = this.activeQuery;
        if (!activeQuery) {
          this._handleErrorEvent(msg);
          return;
        }
        this.activeQuery = null;
        activeQuery.handleError(msg, this.connection);
      }
      _handleRowDescription(msg) {
        this.activeQuery.handleRowDescription(msg);
      }
      _handleDataRow(msg) {
        this.activeQuery.handleDataRow(msg);
      }
      _handlePortalSuspended(msg) {
        this.activeQuery.handlePortalSuspended(this.connection);
      }
      _handleEmptyQuery(msg) {
        this.activeQuery.handleEmptyQuery(this.connection);
      }
      _handleCommandComplete(msg) {
        if (this.activeQuery == null) {
          const error4 = new Error("Received unexpected commandComplete message from backend.");
          this._handleErrorEvent(error4);
          return;
        }
        this.activeQuery.handleCommandComplete(msg, this.connection);
      }
      _handleParseComplete() {
        if (this.activeQuery == null) {
          const error4 = new Error("Received unexpected parseComplete message from backend.");
          this._handleErrorEvent(error4);
          return;
        }
        if (this.activeQuery.name) {
          this.connection.parsedStatements[this.activeQuery.name] = this.activeQuery.text;
        }
      }
      _handleCopyInResponse(msg) {
        this.activeQuery.handleCopyInResponse(this.connection);
      }
      _handleCopyData(msg) {
        this.activeQuery.handleCopyData(msg, this.connection);
      }
      _handleNotification(msg) {
        this.emit("notification", msg);
      }
      _handleNotice(msg) {
        this.emit("notice", msg);
      }
      getStartupConf() {
        const params = this.connectionParameters;
        const data = {
          user: params.user,
          database: params.database
        };
        const appName = params.application_name || params.fallback_application_name;
        if (appName) {
          data.application_name = appName;
        }
        if (params.replication) {
          data.replication = "" + params.replication;
        }
        if (params.statement_timeout) {
          data.statement_timeout = String(parseInt(params.statement_timeout, 10));
        }
        if (params.lock_timeout) {
          data.lock_timeout = String(parseInt(params.lock_timeout, 10));
        }
        if (params.idle_in_transaction_session_timeout) {
          data.idle_in_transaction_session_timeout = String(parseInt(params.idle_in_transaction_session_timeout, 10));
        }
        if (params.options) {
          data.options = params.options;
        }
        return data;
      }
      cancel(client, query) {
        if (client.activeQuery === query) {
          const con = this.connection;
          if (this.host && this.host.indexOf("/") === 0) {
            con.connect(this.host + "/.s.PGSQL." + this.port);
          } else {
            con.connect(this.port, this.host);
          }
          con.on("connect", function() {
            con.cancel(client.processID, client.secretKey);
          });
        } else if (client.queryQueue.indexOf(query) !== -1) {
          client.queryQueue.splice(client.queryQueue.indexOf(query), 1);
        }
      }
      setTypeParser(oid, format, parseFn) {
        return this._types.setTypeParser(oid, format, parseFn);
      }
      getTypeParser(oid, format) {
        return this._types.getTypeParser(oid, format);
      }
      // escapeIdentifier and escapeLiteral moved to utility functions & exported
      // on PG
      // re-exported here for backwards compatibility
      escapeIdentifier(str2) {
        return utils.escapeIdentifier(str2);
      }
      escapeLiteral(str2) {
        return utils.escapeLiteral(str2);
      }
      _pulseQueryQueue() {
        if (this.readyForQuery === true) {
          this.activeQuery = this.queryQueue.shift();
          if (this.activeQuery) {
            this.readyForQuery = false;
            this.hasExecuted = true;
            const queryError = this.activeQuery.submit(this.connection);
            if (queryError) {
              process.nextTick(() => {
                this.activeQuery.handleError(queryError, this.connection);
                this.readyForQuery = true;
                this._pulseQueryQueue();
              });
            }
          } else if (this.hasExecuted) {
            this.activeQuery = null;
            this.emit("drain");
          }
        }
      }
      query(config2, values, callback) {
        let query;
        let result;
        let readTimeout;
        let readTimeoutTimer;
        let queryCallback;
        if (config2 === null || config2 === void 0) {
          throw new TypeError("Client was passed a null or undefined query");
        } else if (typeof config2.submit === "function") {
          readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
          result = query = config2;
          if (typeof values === "function") {
            query.callback = query.callback || values;
          }
        } else {
          readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
          query = new Query2(config2, values, callback);
          if (!query.callback) {
            result = new this._Promise((resolve, reject) => {
              query.callback = (err, res) => err ? reject(err) : resolve(res);
            }).catch((err) => {
              Error.captureStackTrace(err);
              throw err;
            });
          }
        }
        if (readTimeout) {
          queryCallback = query.callback;
          readTimeoutTimer = setTimeout(() => {
            const error4 = new Error("Query read timeout");
            process.nextTick(() => {
              query.handleError(error4, this.connection);
            });
            queryCallback(error4);
            query.callback = () => {
            };
            const index = this.queryQueue.indexOf(query);
            if (index > -1) {
              this.queryQueue.splice(index, 1);
            }
            this._pulseQueryQueue();
          }, readTimeout);
          query.callback = (err, res) => {
            clearTimeout(readTimeoutTimer);
            queryCallback(err, res);
          };
        }
        if (this.binary && !query.binary) {
          query.binary = true;
        }
        if (query._result && !query._result._types) {
          query._result._types = this._types;
        }
        if (!this._queryable) {
          process.nextTick(() => {
            query.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
          });
          return result;
        }
        if (this._ending) {
          process.nextTick(() => {
            query.handleError(new Error("Client was closed and is not queryable"), this.connection);
          });
          return result;
        }
        this.queryQueue.push(query);
        this._pulseQueryQueue();
        return result;
      }
      ref() {
        this.connection.ref();
      }
      unref() {
        this.connection.unref();
      }
      end(cb) {
        this._ending = true;
        if (!this.connection._connecting || this._ended) {
          if (cb) {
            cb();
          } else {
            return this._Promise.resolve();
          }
        }
        if (this.activeQuery || !this._queryable) {
          this.connection.stream.destroy();
        } else {
          this.connection.end();
        }
        if (cb) {
          this.connection.once("end", cb);
        } else {
          return new this._Promise((resolve) => {
            this.connection.once("end", resolve);
          });
        }
      }
    };
    Client2.Query = Query2;
    module.exports = Client2;
  }
});

// node_modules/pg-pool/index.js
var require_pg_pool = __commonJS({
  "node_modules/pg-pool/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var EventEmitter2 = require_events().EventEmitter;
    var NOOP = /* @__PURE__ */ __name(function() {
    }, "NOOP");
    var removeWhere = /* @__PURE__ */ __name((list, predicate) => {
      const i = list.findIndex(predicate);
      return i === -1 ? void 0 : list.splice(i, 1)[0];
    }, "removeWhere");
    var IdleItem = class {
      static {
        __name(this, "IdleItem");
      }
      constructor(client, idleListener, timeoutId) {
        this.client = client;
        this.idleListener = idleListener;
        this.timeoutId = timeoutId;
      }
    };
    var PendingItem = class {
      static {
        __name(this, "PendingItem");
      }
      constructor(callback) {
        this.callback = callback;
      }
    };
    function throwOnDoubleRelease() {
      throw new Error("Release called on client which has already been released to the pool.");
    }
    __name(throwOnDoubleRelease, "throwOnDoubleRelease");
    function promisify(Promise2, callback) {
      if (callback) {
        return { callback, result: void 0 };
      }
      let rej;
      let res;
      const cb = /* @__PURE__ */ __name(function(err, client) {
        err ? rej(err) : res(client);
      }, "cb");
      const result = new Promise2(function(resolve, reject) {
        res = resolve;
        rej = reject;
      }).catch((err) => {
        Error.captureStackTrace(err);
        throw err;
      });
      return { callback: cb, result };
    }
    __name(promisify, "promisify");
    function makeIdleListener(pool, client) {
      return /* @__PURE__ */ __name(function idleListener(err) {
        err.client = client;
        client.removeListener("error", idleListener);
        client.on("error", () => {
          pool.log("additional client error after disconnection due to error", err);
        });
        pool._remove(client);
        pool.emit("error", err, client);
      }, "idleListener");
    }
    __name(makeIdleListener, "makeIdleListener");
    var Pool2 = class extends EventEmitter2 {
      static {
        __name(this, "Pool");
      }
      constructor(options, Client2) {
        super();
        this.options = Object.assign({}, options);
        if (options != null && "password" in options) {
          Object.defineProperty(this.options, "password", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: options.password
          });
        }
        if (options != null && options.ssl && options.ssl.key) {
          Object.defineProperty(this.options.ssl, "key", {
            enumerable: false
          });
        }
        this.options.max = this.options.max || this.options.poolSize || 10;
        this.options.min = this.options.min || 0;
        this.options.maxUses = this.options.maxUses || Infinity;
        this.options.allowExitOnIdle = this.options.allowExitOnIdle || false;
        this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0;
        this.log = this.options.log || function() {
        };
        this.Client = this.options.Client || Client2 || require_lib2().Client;
        this.Promise = this.options.Promise || global.Promise;
        if (typeof this.options.idleTimeoutMillis === "undefined") {
          this.options.idleTimeoutMillis = 1e4;
        }
        this._clients = [];
        this._idle = [];
        this._expired = /* @__PURE__ */ new WeakSet();
        this._pendingQueue = [];
        this._endCallback = void 0;
        this.ending = false;
        this.ended = false;
      }
      _promiseTry(f) {
        const Promise2 = this.Promise;
        if (typeof Promise2.try === "function") {
          return Promise2.try(f);
        }
        return new Promise2((resolve) => resolve(f()));
      }
      _isFull() {
        return this._clients.length >= this.options.max;
      }
      _isAboveMin() {
        return this._clients.length > this.options.min;
      }
      _pulseQueue() {
        this.log("pulse queue");
        if (this.ended) {
          this.log("pulse queue ended");
          return;
        }
        if (this.ending) {
          this.log("pulse queue on ending");
          if (this._idle.length) {
            this._idle.slice().map((item) => {
              this._remove(item.client);
            });
          }
          if (!this._clients.length) {
            this.ended = true;
            this._endCallback();
          }
          return;
        }
        if (!this._pendingQueue.length) {
          this.log("no queued requests");
          return;
        }
        if (!this._idle.length && this._isFull()) {
          return;
        }
        const pendingItem = this._pendingQueue.shift();
        if (this._idle.length) {
          const idleItem = this._idle.pop();
          clearTimeout(idleItem.timeoutId);
          const client = idleItem.client;
          client.ref && client.ref();
          const idleListener = idleItem.idleListener;
          return this._acquireClient(client, pendingItem, idleListener, false);
        }
        if (!this._isFull()) {
          return this.newClient(pendingItem);
        }
        throw new Error("unexpected condition");
      }
      _remove(client, callback) {
        const removed = removeWhere(this._idle, (item) => item.client === client);
        if (removed !== void 0) {
          clearTimeout(removed.timeoutId);
        }
        this._clients = this._clients.filter((c) => c !== client);
        const context2 = this;
        client.end(() => {
          context2.emit("remove", client);
          if (typeof callback === "function") {
            callback();
          }
        });
      }
      connect(cb) {
        if (this.ending) {
          const err = new Error("Cannot use a pool after calling end on the pool");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        const response2 = promisify(this.Promise, cb);
        const result = response2.result;
        if (this._isFull() || this._idle.length) {
          if (this._idle.length) {
            process.nextTick(() => this._pulseQueue());
          }
          if (!this.options.connectionTimeoutMillis) {
            this._pendingQueue.push(new PendingItem(response2.callback));
            return result;
          }
          const queueCallback = /* @__PURE__ */ __name((err, res, done) => {
            clearTimeout(tid);
            response2.callback(err, res, done);
          }, "queueCallback");
          const pendingItem = new PendingItem(queueCallback);
          const tid = setTimeout(() => {
            removeWhere(this._pendingQueue, (i) => i.callback === queueCallback);
            pendingItem.timedOut = true;
            response2.callback(new Error("timeout exceeded when trying to connect"));
          }, this.options.connectionTimeoutMillis);
          if (tid.unref) {
            tid.unref();
          }
          this._pendingQueue.push(pendingItem);
          return result;
        }
        this.newClient(new PendingItem(response2.callback));
        return result;
      }
      newClient(pendingItem) {
        const client = new this.Client(this.options);
        this._clients.push(client);
        const idleListener = makeIdleListener(this, client);
        this.log("checking client timeout");
        let tid;
        let timeoutHit = false;
        if (this.options.connectionTimeoutMillis) {
          tid = setTimeout(() => {
            if (client.connection) {
              this.log("ending client due to timeout");
              timeoutHit = true;
              client.connection.stream.destroy();
            } else if (!client.isConnected()) {
              this.log("ending client due to timeout");
              timeoutHit = true;
              client.end();
            }
          }, this.options.connectionTimeoutMillis);
        }
        this.log("connecting new client");
        client.connect((err) => {
          if (tid) {
            clearTimeout(tid);
          }
          client.on("error", idleListener);
          if (err) {
            this.log("client failed to connect", err);
            this._clients = this._clients.filter((c) => c !== client);
            if (timeoutHit) {
              err = new Error("Connection terminated due to connection timeout", { cause: err });
            }
            this._pulseQueue();
            if (!pendingItem.timedOut) {
              pendingItem.callback(err, void 0, NOOP);
            }
          } else {
            this.log("new client connected");
            if (this.options.onConnect) {
              this._promiseTry(() => this.options.onConnect(client)).then(
                () => {
                  this._afterConnect(client, pendingItem, idleListener);
                },
                (hookErr) => {
                  this._clients = this._clients.filter((c) => c !== client);
                  client.end(() => {
                    this._pulseQueue();
                    if (!pendingItem.timedOut) {
                      pendingItem.callback(hookErr, void 0, NOOP);
                    }
                  });
                }
              );
              return;
            }
            return this._afterConnect(client, pendingItem, idleListener);
          }
        });
      }
      _afterConnect(client, pendingItem, idleListener) {
        if (this.options.maxLifetimeSeconds !== 0) {
          const maxLifetimeTimeout = setTimeout(() => {
            this.log("ending client due to expired lifetime");
            this._expired.add(client);
            const idleIndex = this._idle.findIndex((idleItem) => idleItem.client === client);
            if (idleIndex !== -1) {
              this._acquireClient(
                client,
                new PendingItem((err, client2, clientRelease) => clientRelease()),
                idleListener,
                false
              );
            }
          }, this.options.maxLifetimeSeconds * 1e3);
          maxLifetimeTimeout.unref();
          client.once("end", () => clearTimeout(maxLifetimeTimeout));
        }
        return this._acquireClient(client, pendingItem, idleListener, true);
      }
      // acquire a client for a pending work item
      _acquireClient(client, pendingItem, idleListener, isNew) {
        if (isNew) {
          this.emit("connect", client);
        }
        this.emit("acquire", client);
        client.release = this._releaseOnce(client, idleListener);
        client.removeListener("error", idleListener);
        if (!pendingItem.timedOut) {
          if (isNew && this.options.verify) {
            this.options.verify(client, (err) => {
              if (err) {
                client.release(err);
                return pendingItem.callback(err, void 0, NOOP);
              }
              pendingItem.callback(void 0, client, client.release);
            });
          } else {
            pendingItem.callback(void 0, client, client.release);
          }
        } else {
          if (isNew && this.options.verify) {
            this.options.verify(client, client.release);
          } else {
            client.release();
          }
        }
      }
      // returns a function that wraps _release and throws if called more than once
      _releaseOnce(client, idleListener) {
        let released = false;
        return (err) => {
          if (released) {
            throwOnDoubleRelease();
          }
          released = true;
          this._release(client, idleListener, err);
        };
      }
      // release a client back to the poll, include an error
      // to remove it from the pool
      _release(client, idleListener, err) {
        client.on("error", idleListener);
        client._poolUseCount = (client._poolUseCount || 0) + 1;
        this.emit("release", err, client);
        if (err || this.ending || !client._queryable || client._ending || client._poolUseCount >= this.options.maxUses) {
          if (client._poolUseCount >= this.options.maxUses) {
            this.log("remove expended client");
          }
          return this._remove(client, this._pulseQueue.bind(this));
        }
        const isExpired = this._expired.has(client);
        if (isExpired) {
          this.log("remove expired client");
          this._expired.delete(client);
          return this._remove(client, this._pulseQueue.bind(this));
        }
        let tid;
        if (this.options.idleTimeoutMillis && this._isAboveMin()) {
          tid = setTimeout(() => {
            if (this._isAboveMin()) {
              this.log("remove idle client");
              this._remove(client, this._pulseQueue.bind(this));
            }
          }, this.options.idleTimeoutMillis);
          if (this.options.allowExitOnIdle) {
            tid.unref();
          }
        }
        if (this.options.allowExitOnIdle) {
          client.unref();
        }
        this._idle.push(new IdleItem(client, idleListener, tid));
        this._pulseQueue();
      }
      query(text2, values, cb) {
        if (typeof text2 === "function") {
          const response3 = promisify(this.Promise, text2);
          setImmediate(function() {
            return response3.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
          });
          return response3.result;
        }
        if (typeof values === "function") {
          cb = values;
          values = void 0;
        }
        const response2 = promisify(this.Promise, cb);
        cb = response2.callback;
        this.connect((err, client) => {
          if (err) {
            return cb(err);
          }
          let clientReleased = false;
          const onError = /* @__PURE__ */ __name((err2) => {
            if (clientReleased) {
              return;
            }
            clientReleased = true;
            client.release(err2);
            cb(err2);
          }, "onError");
          client.once("error", onError);
          this.log("dispatching query");
          try {
            client.query(text2, values, (err2, res) => {
              this.log("query dispatched");
              client.removeListener("error", onError);
              if (clientReleased) {
                return;
              }
              clientReleased = true;
              client.release(err2);
              if (err2) {
                return cb(err2);
              }
              return cb(void 0, res);
            });
          } catch (err2) {
            client.release(err2);
            return cb(err2);
          }
        });
        return response2.result;
      }
      end(cb) {
        this.log("ending");
        if (this.ending) {
          const err = new Error("Called end on pool more than once");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        this.ending = true;
        const promised = promisify(this.Promise, cb);
        this._endCallback = promised.callback;
        this._pulseQueue();
        return promised.result;
      }
      get waitingCount() {
        return this._pendingQueue.length;
      }
      get idleCount() {
        return this._idle.length;
      }
      get expiredCount() {
        return this._clients.reduce((acc, client) => acc + (this._expired.has(client) ? 1 : 0), 0);
      }
      get totalCount() {
        return this._clients.length;
      }
    };
    module.exports = Pool2;
  }
});

// node_modules/pg/lib/native/query.js
var require_query2 = __commonJS({
  "node_modules/pg/lib/native/query.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var EventEmitter2 = require_events().EventEmitter;
    var util = require_util();
    var utils = require_utils();
    var NativeQuery = module.exports = function(config2, values, callback) {
      EventEmitter2.call(this);
      config2 = utils.normalizeQueryConfig(config2, values, callback);
      this.text = config2.text;
      this.values = config2.values;
      this.name = config2.name;
      this.queryMode = config2.queryMode;
      this.callback = config2.callback;
      this.state = "new";
      this._arrayMode = config2.rowMode === "array";
      this._emitRowEvents = false;
      this.on(
        "newListener",
        function(event) {
          if (event === "row") this._emitRowEvents = true;
        }.bind(this)
      );
    };
    util.inherits(NativeQuery, EventEmitter2);
    var errorFieldMap = {
      sqlState: "code",
      statementPosition: "position",
      messagePrimary: "message",
      context: "where",
      schemaName: "schema",
      tableName: "table",
      columnName: "column",
      dataTypeName: "dataType",
      constraintName: "constraint",
      sourceFile: "file",
      sourceLine: "line",
      sourceFunction: "routine"
    };
    NativeQuery.prototype.handleError = function(err) {
      const fields = this.native.pq.resultErrorFields();
      if (fields) {
        for (const key2 in fields) {
          const normalizedFieldName = errorFieldMap[key2] || key2;
          err[normalizedFieldName] = fields[key2];
        }
      }
      if (this.callback) {
        this.callback(err);
      } else {
        this.emit("error", err);
      }
      this.state = "error";
    };
    NativeQuery.prototype.then = function(onSuccess, onFailure) {
      return this._getPromise().then(onSuccess, onFailure);
    };
    NativeQuery.prototype.catch = function(callback) {
      return this._getPromise().catch(callback);
    };
    NativeQuery.prototype._getPromise = function() {
      if (this._promise) return this._promise;
      this._promise = new Promise(
        function(resolve, reject) {
          this._once("end", resolve);
          this._once("error", reject);
        }.bind(this)
      );
      return this._promise;
    };
    NativeQuery.prototype.submit = function(client) {
      this.state = "running";
      const self = this;
      this.native = client.native;
      client.native.arrayMode = this._arrayMode;
      let after = /* @__PURE__ */ __name(function(err, rows2, results) {
        client.native.arrayMode = false;
        setImmediate(function() {
          self.emit("_done");
        });
        if (err) {
          return self.handleError(err);
        }
        if (self._emitRowEvents) {
          if (results.length > 1) {
            rows2.forEach((rowOfRows, i) => {
              rowOfRows.forEach((row) => {
                self.emit("row", row, results[i]);
              });
            });
          } else {
            rows2.forEach(function(row) {
              self.emit("row", row, results);
            });
          }
        }
        self.state = "end";
        self.emit("end", results);
        if (self.callback) {
          self.callback(null, results);
        }
      }, "after");
      if (process.domain) {
        after = process.domain.bind(after);
      }
      if (this.name) {
        if (this.name.length > 63) {
          console.error("Warning! Postgres only supports 63 characters for query names.");
          console.error("You supplied %s (%s)", this.name, this.name.length);
          console.error("This can cause conflicts and silent errors executing queries");
        }
        const values = (this.values || []).map(utils.prepareValue);
        if (client.namedQueries[this.name]) {
          if (this.text && client.namedQueries[this.name] !== this.text) {
            const err = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
            return after(err);
          }
          return client.native.execute(this.name, values, after);
        }
        return client.native.prepare(this.name, this.text, values.length, function(err) {
          if (err) return after(err);
          client.namedQueries[self.name] = self.text;
          return self.native.execute(self.name, values, after);
        });
      } else if (this.values) {
        if (!Array.isArray(this.values)) {
          const err = new Error("Query values must be an array");
          return after(err);
        }
        const vals = this.values.map(utils.prepareValue);
        client.native.query(this.text, vals, after);
      } else if (this.queryMode === "extended") {
        client.native.query(this.text, [], after);
      } else {
        client.native.query(this.text, after);
      }
    };
  }
});

// node_modules/pg/lib/native/client.js
var require_client2 = __commonJS({
  "node_modules/pg/lib/native/client.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var Native;
    try {
      Native = __require("pg-native");
    } catch (e) {
      throw e;
    }
    var TypeOverrides2 = require_type_overrides();
    var EventEmitter2 = require_events().EventEmitter;
    var util = require_util();
    var ConnectionParameters = require_connection_parameters();
    var NativeQuery = require_query2();
    var Client2 = module.exports = function(config2) {
      EventEmitter2.call(this);
      config2 = config2 || {};
      this._Promise = config2.Promise || global.Promise;
      this._types = new TypeOverrides2(config2.types);
      this.native = new Native({
        types: this._types
      });
      this._queryQueue = [];
      this._ending = false;
      this._connecting = false;
      this._connected = false;
      this._queryable = true;
      const cp = this.connectionParameters = new ConnectionParameters(config2);
      if (config2.nativeConnectionString) cp.nativeConnectionString = config2.nativeConnectionString;
      this.user = cp.user;
      Object.defineProperty(this, "password", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: cp.password
      });
      this.database = cp.database;
      this.host = cp.host;
      this.port = cp.port;
      this.namedQueries = {};
    };
    Client2.Query = NativeQuery;
    util.inherits(Client2, EventEmitter2);
    Client2.prototype._errorAllQueries = function(err) {
      const enqueueError = /* @__PURE__ */ __name((query) => {
        process.nextTick(() => {
          query.native = this.native;
          query.handleError(err);
        });
      }, "enqueueError");
      if (this._hasActiveQuery()) {
        enqueueError(this._activeQuery);
        this._activeQuery = null;
      }
      this._queryQueue.forEach(enqueueError);
      this._queryQueue.length = 0;
    };
    Client2.prototype._connect = function(cb) {
      const self = this;
      if (this._connecting) {
        process.nextTick(() => cb(new Error("Client has already been connected. You cannot reuse a client.")));
        return;
      }
      this._connecting = true;
      this.connectionParameters.getLibpqConnectionString(function(err, conString) {
        if (self.connectionParameters.nativeConnectionString) conString = self.connectionParameters.nativeConnectionString;
        if (err) return cb(err);
        self.native.connect(conString, function(err2) {
          if (err2) {
            self.native.end();
            return cb(err2);
          }
          self._connected = true;
          self.native.on("error", function(err3) {
            self._queryable = false;
            self._errorAllQueries(err3);
            self.emit("error", err3);
          });
          self.native.on("notification", function(msg) {
            self.emit("notification", {
              channel: msg.relname,
              payload: msg.extra
            });
          });
          self.emit("connect");
          self._pulseQueryQueue(true);
          cb();
        });
      });
    };
    Client2.prototype.connect = function(callback) {
      if (callback) {
        this._connect(callback);
        return;
      }
      return new this._Promise((resolve, reject) => {
        this._connect((error4) => {
          if (error4) {
            reject(error4);
          } else {
            resolve();
          }
        });
      });
    };
    Client2.prototype.query = function(config2, values, callback) {
      let query;
      let result;
      let readTimeout;
      let readTimeoutTimer;
      let queryCallback;
      if (config2 === null || config2 === void 0) {
        throw new TypeError("Client was passed a null or undefined query");
      } else if (typeof config2.submit === "function") {
        readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
        result = query = config2;
        if (typeof values === "function") {
          config2.callback = values;
        }
      } else {
        readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
        query = new NativeQuery(config2, values, callback);
        if (!query.callback) {
          let resolveOut, rejectOut;
          result = new this._Promise((resolve, reject) => {
            resolveOut = resolve;
            rejectOut = reject;
          }).catch((err) => {
            Error.captureStackTrace(err);
            throw err;
          });
          query.callback = (err, res) => err ? rejectOut(err) : resolveOut(res);
        }
      }
      if (readTimeout) {
        queryCallback = query.callback;
        readTimeoutTimer = setTimeout(() => {
          const error4 = new Error("Query read timeout");
          process.nextTick(() => {
            query.handleError(error4, this.connection);
          });
          queryCallback(error4);
          query.callback = () => {
          };
          const index = this._queryQueue.indexOf(query);
          if (index > -1) {
            this._queryQueue.splice(index, 1);
          }
          this._pulseQueryQueue();
        }, readTimeout);
        query.callback = (err, res) => {
          clearTimeout(readTimeoutTimer);
          queryCallback(err, res);
        };
      }
      if (!this._queryable) {
        query.native = this.native;
        process.nextTick(() => {
          query.handleError(new Error("Client has encountered a connection error and is not queryable"));
        });
        return result;
      }
      if (this._ending) {
        query.native = this.native;
        process.nextTick(() => {
          query.handleError(new Error("Client was closed and is not queryable"));
        });
        return result;
      }
      this._queryQueue.push(query);
      this._pulseQueryQueue();
      return result;
    };
    Client2.prototype.end = function(cb) {
      const self = this;
      this._ending = true;
      if (!this._connected) {
        this.once("connect", this.end.bind(this, cb));
      }
      let result;
      if (!cb) {
        result = new this._Promise(function(resolve, reject) {
          cb = /* @__PURE__ */ __name((err) => err ? reject(err) : resolve(), "cb");
        });
      }
      this.native.end(function() {
        self._errorAllQueries(new Error("Connection terminated"));
        process.nextTick(() => {
          self.emit("end");
          if (cb) cb();
        });
      });
      return result;
    };
    Client2.prototype._hasActiveQuery = function() {
      return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
    };
    Client2.prototype._pulseQueryQueue = function(initialConnection) {
      if (!this._connected) {
        return;
      }
      if (this._hasActiveQuery()) {
        return;
      }
      const query = this._queryQueue.shift();
      if (!query) {
        if (!initialConnection) {
          this.emit("drain");
        }
        return;
      }
      this._activeQuery = query;
      query.submit(this);
      const self = this;
      query.once("_done", function() {
        self._pulseQueryQueue();
      });
    };
    Client2.prototype.cancel = function(query) {
      if (this._activeQuery === query) {
        this.native.cancel(function() {
        });
      } else if (this._queryQueue.indexOf(query) !== -1) {
        this._queryQueue.splice(this._queryQueue.indexOf(query), 1);
      }
    };
    Client2.prototype.ref = function() {
    };
    Client2.prototype.unref = function() {
    };
    Client2.prototype.setTypeParser = function(oid, format, parseFn) {
      return this._types.setTypeParser(oid, format, parseFn);
    };
    Client2.prototype.getTypeParser = function(oid, format) {
      return this._types.getTypeParser(oid, format);
    };
  }
});

// node_modules/pg/lib/native/index.js
var require_native = __commonJS({
  "node_modules/pg/lib/native/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    module.exports = require_client2();
  }
});

// node_modules/pg/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/pg/lib/index.js"(exports, module) {
    "use strict";
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    var Client2 = require_client();
    var defaults2 = require_defaults();
    var Connection2 = require_connection();
    var Result2 = require_result();
    var utils = require_utils();
    var Pool2 = require_pg_pool();
    var TypeOverrides2 = require_type_overrides();
    var { DatabaseError: DatabaseError2 } = require_dist();
    var { escapeIdentifier: escapeIdentifier2, escapeLiteral: escapeLiteral2 } = require_utils();
    var poolFactory = /* @__PURE__ */ __name((Client3) => {
      return class BoundPool extends Pool2 {
        static {
          __name(this, "BoundPool");
        }
        constructor(options) {
          super(options, Client3);
        }
      };
    }, "poolFactory");
    var PG = /* @__PURE__ */ __name(function(clientConstructor) {
      this.defaults = defaults2;
      this.Client = clientConstructor;
      this.Query = this.Client.Query;
      this.Pool = poolFactory(this.Client);
      this._pools = [];
      this.Connection = Connection2;
      this.types = require_pg_types();
      this.DatabaseError = DatabaseError2;
      this.TypeOverrides = TypeOverrides2;
      this.escapeIdentifier = escapeIdentifier2;
      this.escapeLiteral = escapeLiteral2;
      this.Result = Result2;
      this.utils = utils;
    }, "PG");
    if (typeof process.env.NODE_PG_FORCE_NATIVE !== "undefined") {
      module.exports = new PG(require_native());
    } else {
      module.exports = new PG(Client2);
      Object.defineProperty(module.exports, "native", {
        configurable: true,
        enumerable: false,
        get() {
          let native = null;
          try {
            native = new PG(require_native());
          } catch (err) {
            if (err.code !== "MODULE_NOT_FOUND") {
              throw err;
            }
          }
          Object.defineProperty(module.exports, "native", {
            value: native
          });
          return native;
        }
      });
    }
  }
});

// worker-entry.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/pg/esm/index.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var import_lib = __toESM(require_lib2(), 1);
var Client = import_lib.default.Client;
var Pool = import_lib.default.Pool;
var Connection = import_lib.default.Connection;
var types = import_lib.default.types;
var Query = import_lib.default.Query;
var DatabaseError = import_lib.default.DatabaseError;
var escapeIdentifier = import_lib.default.escapeIdentifier;
var escapeLiteral = import_lib.default.escapeLiteral;
var Result = import_lib.default.Result;
var TypeOverrides = import_lib.default.TypeOverrides;
var defaults = import_lib.default.defaults;

// staging-worker.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// handler.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// cms-public.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../admin-api/cms-placement-contract.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var CMS_PLACEMENTS = Object.freeze({
  banner: Object.freeze({
    public_web: Object.freeze(["home.hero", "home.after_products", "category.header"]),
    dealer_app: Object.freeze(["home.banner"]),
    consumer_app: Object.freeze(["home.banner"])
  }),
  popup: Object.freeze({
    public_web: Object.freeze(["home.entry", "category.entry", "all.entry"]),
    dealer_app: Object.freeze(["home.entry"]),
    consumer_app: Object.freeze(["home.entry"])
  }),
  article: Object.freeze({
    public_web: Object.freeze(["news.list", "home.news_featured"]),
    dealer_app: Object.freeze(["news.list"]),
    consumer_app: Object.freeze(["news.list"])
  }),
  promotion: Object.freeze({
    public_web: Object.freeze(["promotions.list", "home.promotion_featured"]),
    dealer_app: Object.freeze(["promotions.list"]),
    consumer_app: Object.freeze(["promotions.list"])
  })
});

// cms-public.mjs
var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var KINDS = /* @__PURE__ */ new Set(["banner", "popup", "article", "promotion"]);
var ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/;
function validDate(s) {
  return typeof s === "string" && ISO.test(s) && Number.isFinite(Date.parse(s));
}
__name(validDate, "validDate");
function str(v, max, { empty = false } = {}) {
  if (typeof v !== "string" || v.length > max || !empty && !v.trim() || /<\/?[a-z][^>]*>/i.test(v))
    throw Error("Invalid public CMS value");
  return v;
}
__name(str, "str");
function boundedInt(value, lo, hi) {
  if (!Number.isSafeInteger(value) || value < lo || value > hi) throw Error("Invalid public CMS integer");
  return value;
}
__name(boundedInt, "boundedInt");
function projectPublicCms(raw) {
  if (!Array.isArray(raw) || raw.length > 500) throw Error("Invalid public CMS snapshot");
  const seen = /* @__PURE__ */ new Set();
  return raw.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row) || !KINDS.has(row.kind) || !UUID.test(row.id) || !SLUG.test(row.slug) || row.slug.length > 100 || !CMS_PLACEMENTS[row.kind].public_web.includes(row.slot) || !validDate(row.publishedAt) || row.startsAt != null && !validDate(row.startsAt) || row.endsAt != null && !validDate(row.endsAt)) throw Error("Invalid public CMS row");
    const key2 = row.kind + ":" + row.slug;
    if (seen.has(key2)) throw Error("Duplicate public CMS row");
    seen.add(key2);
    const paragraphs = row.paragraphs;
    if (!Array.isArray(paragraphs) || paragraphs.length > 30 || !paragraphs.every((p) => typeof p === "string")) throw Error("Invalid public CMS paragraphs");
    if (["article", "promotion"].includes(row.kind) && paragraphs.length === 0)
      throw Error("Missing public CMS text");
    const result = {
      id: row.id,
      kind: row.kind,
      slug: row.slug,
      title: str(row.title, 160),
      summary: str(row.summary, 400, { empty: true }),
      paragraphs: paragraphs.map((p) => str(p, 3e3)),
      ctaUrl: row.ctaUrl == null ? null : str(row.ctaUrl, 500, { empty: true }),
      slot: row.slot,
      sortOrder: boundedInt(row.sortOrder, 0, 1e4),
      publishedAt: row.publishedAt,
      startsAt: row.startsAt ?? null,
      endsAt: row.endsAt ?? null,
      hasDesktop: row.hasDesktop === true,
      hasMobile: row.hasMobile === true,
      popupDelaySeconds: boundedInt(row.popupDelaySeconds, 0, 120),
      popupCooldownMinutes: boundedInt(row.popupCooldownMinutes, 0, 43200),
      popupMaxPerSession: boundedInt(row.popupMaxPerSession, 1, 20)
    };
    if (row.kind === "banner" && row.slot === "home.hero" && row.slides !== void 0) {
      if (!Array.isArray(row.slides) || row.slides.length < 1 || row.slides.length > 5 || !row.slides.includes(1) || new Set(row.slides).size !== row.slides.length || row.slides.some((n) => !Number.isInteger(n) || n < 1 || n > 5))
        throw Error("Invalid CMS hero slides");
      const m = row.motion;
      if (!m || typeof m !== "object" || Array.isArray(m) || typeof m.enabled !== "boolean" || typeof m.autoplay !== "boolean" || !["fade", "slide", "fade-slide"].includes(m.effect))
        throw Error("Invalid CMS motion");
      result.slides = [...row.slides];
      result.motion = {
        enabled: m.enabled,
        autoplay: m.autoplay,
        effect: m.effect,
        intervalMs: boundedInt(m.intervalMs, 3e3, 15e3),
        durationMs: boundedInt(m.durationMs, 300, 800)
      };
    }
    if (row.kind === "promotion" && !result.endsAt) throw Error("Promotion without expiry");
    if (["banner", "popup"].includes(row.kind) && (!result.hasDesktop || !result.hasMobile))
      throw Error("Missing public CMS images");
    if (result.ctaUrl && !/^\/(?!\/)(?!.*\.\.)[^\\]*$/.test(result.ctaUrl)) {
      try {
        const u = new URL(result.ctaUrl);
        if (u.protocol !== "https:" || u.username || u.password || u.hash || u.href !== result.ctaUrl) throw Error();
      } catch {
        throw Error("Invalid public CMS action URL");
      }
    }
    return result;
  }).sort((a, b) => a.sortOrder - b.sortOrder || a.publishedAt.localeCompare(b.publishedAt) || a.id.localeCompare(b.id));
}
__name(projectPublicCms, "projectPublicCms");

// handler.mjs
var MAX_PUBLIC_PRODUCTS = 1e4;
var GROUPS = /* @__PURE__ */ new Set(["school_notebook", "student_notebook", "memo_book", "stationery"]);
var IDENTIFIER = /^[a-z0-9][a-z0-9_-]*$/i;
function guard(condition) {
  if (!condition) throw new Error("Invalid public read model");
}
__name(guard, "guard");
function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(object, "object");
function text(value, max = 3e3) {
  guard(typeof value === "string" && value.length > 0 && value.length <= max);
  return value;
}
__name(text, "text");
function optionalText(value, max = 3e3) {
  return value === void 0 || value === null ? void 0 : text(value, max);
}
__name(optionalText, "optionalText");
function strings(values, maxItems, maxLength) {
  guard(Array.isArray(values) && values.length <= maxItems);
  return values.map((value) => text(value, maxLength));
}
__name(strings, "strings");
function positiveInt(value) {
  guard(Number.isSafeInteger(value) && value > 0);
  return value;
}
__name(positiveInt, "positiveInt");
function nonnegativeInt(value) {
  guard(Number.isSafeInteger(value) && value >= 0);
  return value;
}
__name(nonnegativeInt, "nonnegativeInt");
function positiveNumber(value) {
  guard(typeof value === "number" && Number.isFinite(value) && value > 0);
  return value;
}
__name(positiveNumber, "positiveNumber");
function copySpecifications(specs) {
  guard(object(specs));
  const result = {};
  for (const name of ["paperSize", "binding", "coverFinish", "ruling"]) {
    if (specs[name] !== void 0) result[name] = text(specs[name], 120);
  }
  for (const name of ["pageCount"]) {
    if (specs[name] !== void 0) result[name] = positiveInt(specs[name]);
  }
  if (specs.paperWeightGsm !== void 0) result.paperWeightGsm = positiveNumber(specs.paperWeightGsm);
  if (specs.packaging !== void 0) {
    guard(object(specs.packaging));
    result.packaging = { saleUnit: text(specs.packaging.saleUnit, 80) };
    for (const name of ["unitsPerPack", "unitsPerCarton"]) {
      if (specs.packaging[name] !== void 0) result.packaging[name] = positiveInt(specs.packaging[name]);
    }
  }
  return result;
}
__name(copySpecifications, "copySpecifications");
function projectPublicCatalog(raw) {
  guard(object(raw) && Array.isArray(raw.categories) && Array.isArray(raw.products));
  guard(raw.categories.length <= 2e3 && raw.products.length <= MAX_PUBLIC_PRODUCTS);
  const categories = raw.categories.map((c) => {
    guard(object(c) && GROUPS.has(c.group) && Number.isSafeInteger(c.sortOrder));
    return {
      id: text(c.id, 80),
      slug: text(c.slug, 80),
      name: text(c.name, 160),
      group: c.group,
      sortOrder: c.sortOrder
    };
  });
  const ids = new Set(categories.map((c) => c.id));
  const products = raw.products.map((p) => {
    guard(object(p) && ids.has(p.categoryId));
    guard(Array.isArray(p.variants) && p.variants.length <= 100);
    guard(Array.isArray(p.media) && p.media.length <= 2e3);
    const variants = p.variants.map((v) => {
      guard(object(v));
      let price = null;
      if (v.price !== null && v.price !== void 0) {
        guard(object(v.price) && v.price.kind === "retail" && v.price.currency === "VND");
        price = { kind: "retail", amountVnd: nonnegativeInt(v.price.amountVnd), currency: "VND" };
      }
      return {
        sku: text(v.sku, 100),
        name: text(v.name, 160),
        ...v.categoryId === void 0 ? {} : { categoryId: (() => {
          const id = text(v.categoryId, 80);
          guard(ids.has(id));
          return id;
        })() },
        specifications: copySpecifications(v.specifications),
        price
      };
    });
    const allowedSkus = new Set(variants.map((v) => v.sku));
    const media = p.media.map((m) => {
      guard(object(m) && Number.isSafeInteger(m.position) && m.position >= 0);
      const r2Key = text(m.r2Key, 400);
      guard(/^products\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+-v[1-9]\d*\.(webp|png|jpg|jpeg|avif)$/i.test(r2Key));
      const sku = m.sku == null ? void 0 : text(m.sku, 100);
      guard(sku === void 0 || allowedSkus.has(sku));
      return {
        r2Key,
        alt: text(m.alt, 240),
        position: m.position,
        ...sku === void 0 ? {} : { sku }
      };
    });
    guard(p.priceLabel === null || p.priceLabel === "Li\xEAn h\u1EC7 b\xE1o gi\xE1");
    const legacySlugs = p.legacySlugs === void 0 ? void 0 : strings(p.legacySlugs, 100, 80);
    if (legacySlugs) guard(legacySlugs.every((s) => /^sku-[0-9a-f]{32}$/.test(s)));
    return {
      id: text(p.id, 80),
      categoryId: text(p.categoryId, 80),
      name: text(p.name, 160),
      slug: text(p.slug, 80),
      ...legacySlugs?.length ? { legacySlugs } : {},
      ...optionalText(p.description, 3e3) ? { description: p.description } : {},
      priceLabel: p.priceLabel,
      variants,
      media
    };
  });
  return { categories, products };
}
__name(projectPublicCatalog, "projectPublicCatalog");
function projectPublicContent(raw) {
  guard(object(raw) && Array.isArray(raw.articles) && Array.isArray(raw.promotions));
  guard(raw.articles.length <= 500 && raw.promotions.length <= 200);
  const company = raw.company === null ? null : (() => {
    guard(object(raw.company));
    const result = {};
    for (const name of ["legalName", "address", "phone", "email", "hours"]) {
      if (raw.company[name] !== void 0) result[name] = text(raw.company[name], 300);
    }
    return result;
  })();
  const articles = raw.articles.map((a) => {
    guard(object(a));
    return {
      slug: text(a.slug, 80),
      title: text(a.title, 160),
      summary: text(a.summary, 400),
      paragraphs: strings(a.paragraphs, 30, 3e3),
      publishedAt: text(a.publishedAt, 50)
    };
  });
  const promotions = raw.promotions.map((p) => {
    guard(object(p));
    return {
      slug: text(p.slug, 80),
      title: text(p.title, 160),
      summary: text(p.summary, 400),
      detail: text(p.detail, 3e3),
      endsAt: text(p.endsAt, 50)
    };
  });
  const dealerInformation = raw.dealerInformation === null ? null : (() => {
    guard(object(raw.dealerInformation));
    return {
      title: text(raw.dealerInformation.title, 160),
      paragraphs: strings(raw.dealerInformation.paragraphs, 25, 3e3),
      contactInstructions: text(raw.dealerInformation.contactInstructions, 800)
    };
  })();
  return { company, articles, promotions, dealerInformation };
}
__name(projectPublicContent, "projectPublicContent");
var ROUTES = /* @__PURE__ */ new Set(["/v1/public/categories", "/v1/public/products", "/v1/public/catalog", "/v1/public/content", "/v1/public/cms", "/v1/public/home-layout", "/v1/public/app-download", "/v1/public/category-display", "/v1/public/seo"]);
var QUERY_KEYS = {
  "/v1/public/categories": /* @__PURE__ */ new Set(["slug"]),
  "/v1/public/products": /* @__PURE__ */ new Set(["slug", "categoryId", "page", "limit"]),
  "/v1/public/catalog": /* @__PURE__ */ new Set(["page", "limit"]),
  "/v1/public/content": /* @__PURE__ */ new Set(),
  "/v1/public/cms": /* @__PURE__ */ new Set(),
  "/v1/public/home-layout": /* @__PURE__ */ new Set(),
  "/v1/public/app-download": /* @__PURE__ */ new Set(),
  "/v1/public/category-display": /* @__PURE__ */ new Set(),
  "/v1/public/seo": /* @__PURE__ */ new Set(["contentSource"])
};
function integerParam(input, defaultValue, max) {
  if (input === null) return defaultValue;
  if (!/^[1-9]\d{0,4}$/.test(input)) return null;
  const value = Number(input);
  return value <= max ? value : null;
}
__name(integerParam, "integerParam");
function validQuery(url) {
  const keys = QUERY_KEYS[url.pathname];
  for (const key2 of url.searchParams.keys()) {
    if (!keys.has(key2) || url.searchParams.getAll(key2).length !== 1) return false;
    const value = url.searchParams.get(key2);
    if (key2 === "slug" || key2 === "categoryId") {
      if (!value || value.length > 80 || !IDENTIFIER.test(value)) return false;
    }
  }
  if (url.pathname === "/v1/public/products" || url.pathname === "/v1/public/catalog") {
    return integerParam(url.searchParams.get("page"), 1, MAX_PUBLIC_PRODUCTS) !== null && integerParam(url.searchParams.get("limit"), 20, 1e3) !== null;
  }
  return true;
}
__name(validQuery, "validQuery");
function response(status, data, origin, cache = "no-store") {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": cache,
    "X-Content-Type-Options": "nosniff",
    "Vary": "Origin"
  });
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  return new Response(JSON.stringify(data), { status, headers });
}
__name(response, "response");
function failure(status, code, origin) {
  return response(status, { error: { code, message: "Y\xEAu c\u1EA7u kh\xF4ng th\u1EC3 x\u1EED l\xFD." } }, origin);
}
__name(failure, "failure");
function projectPublicHomeLayout(raw) {
  guard(object(raw) && Array.isArray(raw.categoryIds) && Array.isArray(raw.featuredSkus) && raw.categoryIds.length <= 6 && raw.featuredSkus.length <= 12 && raw.categoryIds.every((id) => typeof id === "string" && /^p5-(?:[0-9a-f-]{36}|uncategorized)$/.test(id)) && raw.featuredSkus.every((s) => typeof s === "string" && s.length > 0 && s.length <= 100) && new Set(raw.categoryIds).size === raw.categoryIds.length && new Set(raw.featuredSkus).size === raw.featuredSkus.length && Number.isSafeInteger(raw.categoryLimit) && raw.categoryLimit >= 1 && raw.categoryLimit <= 6 && Number.isSafeInteger(raw.productLimit) && raw.productLimit >= 1 && raw.productLimit <= 12 && Array.isArray(raw.sectionOrder) && raw.sectionOrder.length === 2 && raw.sectionOrder.includes("categories") && raw.sectionOrder.includes("products") && new Set(raw.sectionOrder).size === 2 && Number.isSafeInteger(raw.revision) && raw.revision >= 1);
  return {
    categoryIds: [...raw.categoryIds],
    featuredSkus: [...raw.featuredSkus],
    categoryLimit: raw.categoryLimit,
    productLimit: raw.productLimit,
    sectionOrder: [...raw.sectionOrder],
    revision: raw.revision
  };
}
__name(projectPublicHomeLayout, "projectPublicHomeLayout");
function projectPublicAppDownload(raw) {
  guard(object(raw) && typeof raw.popupEnabled === "boolean" && typeof raw.buttonEnabled === "boolean" && Number.isSafeInteger(raw.firstDelayMs) && raw.firstDelayMs >= 500 && raw.firstDelayMs <= 15e3 && Number.isSafeInteger(raw.cooldownMinutes) && raw.cooldownMinutes >= 30 && raw.cooldownMinutes <= 1440 && typeof raw.title === "string" && raw.title.length > 0 && raw.title.length <= 80 && typeof raw.message === "string" && raw.message.length > 0 && raw.message.length <= 240 && !/[<>]/.test(raw.title + raw.message) && !/[\x00-\x1f\x7f]/.test(raw.title) && !/[\x00-\x09\x0b-\x1f\x7f]/.test(raw.message) && Number.isSafeInteger(raw.revision) && raw.revision > 0);
  const url = /* @__PURE__ */ __name((value, platform2) => {
    if (value == null) return null;
    guard(typeof value === "string" && value.length <= 500);
    const uri = new URL(value);
    guard(uri.protocol === "https:" && !uri.username && !uri.password && !uri.port && !uri.hash);
    if (platform2 === "ios") guard(uri.hostname === "apps.apple.com" && uri.pathname.length > 2);
    else guard(uri.hostname === "play.google.com" && uri.pathname === "/store/apps/details" && /^[a-zA-Z0-9_.]+$/.test(uri.searchParams.get("id") || "") && !uri.searchParams.has("redirect"));
    return uri.toString();
  }, "url");
  return {
    popupEnabled: raw.popupEnabled,
    buttonEnabled: raw.buttonEnabled,
    firstDelayMs: raw.firstDelayMs,
    cooldownMinutes: raw.cooldownMinutes,
    title: raw.title,
    message: raw.message,
    iosUrl: url(raw.iosUrl, "ios"),
    androidUrl: url(raw.androidUrl, "android"),
    revision: raw.revision
  };
}
__name(projectPublicAppDownload, "projectPublicAppDownload");
function projectPublicCategoryDisplay(raw) {
  guard(object(raw) && Array.isArray(raw.modes) && raw.modes.length <= 2e3);
  const seen = /* @__PURE__ */ new Set();
  return { modes: raw.modes.map((item) => {
    guard(object(item) && typeof item.categoryId === "string" && /^p5-(?:[0-9a-f-]{36}|uncategorized)$/.test(item.categoryId) && item.mode === "sku" && !seen.has(item.categoryId));
    seen.add(item.categoryId);
    return { categoryId: item.categoryId, mode: "sku" };
  }) };
}
__name(projectPublicCategoryDisplay, "projectPublicCategoryDisplay");
function createPublicApi({ getPublicCatalog, getPublicContent, getPublicCms, getPublicHomeLayout, getPublicAppDownload, getPublicCategoryDisplay, getPublicSeoSettings, cmsEnabled = false, homeLayoutEnabled = false, categoryDisplayEnabled = false, seoEnabled = false, allowedOrigins = [] }) {
  guard(typeof getPublicCatalog === "function" && typeof getPublicContent === "function");
  guard(Array.isArray(allowedOrigins) && allowedOrigins.every((o) => {
    try {
      const u = new URL(o);
      return u.protocol === "https:" && u.origin === o;
    } catch {
      return false;
    }
  }));
  const allow = new Set(allowedOrigins);
  return {
    async fetch(request) {
      const origin = request.headers.get("Origin");
      const corsOrigin = origin && allow.has(origin) ? origin : null;
      if (origin && !corsOrigin) return failure(403, "origin_forbidden", null);
      const url = new URL(request.url);
      if (!ROUTES.has(url.pathname)) return failure(404, "not_found", corsOrigin);
      if (request.method === "OPTIONS") {
        const headers = new Headers({
          "Allow": "GET, OPTIONS",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "no-store",
          "Vary": "Origin"
        });
        if (corsOrigin) headers.set("Access-Control-Allow-Origin", corsOrigin);
        return new Response(null, { status: 204, headers });
      }
      if (request.method !== "GET") {
        const result = failure(405, "method_not_allowed", corsOrigin);
        result.headers.set("Allow", "GET, OPTIONS");
        return result;
      }
      if (!validQuery(url)) return failure(400, "invalid_query", corsOrigin);
      try {
        if (url.pathname === "/v1/public/seo") {
          if (!seoEnabled || typeof getPublicSeoSettings !== "function")
            return failure(404, "not_found", corsOrigin);
          const contentSource = url.searchParams.get("contentSource");
          if (!["cms", "legacy"].includes(contentSource)) return failure(400, "invalid_query", corsOrigin);
          const settings = await getPublicSeoSettings({ contentSource });
          guard(Array.isArray(settings) && settings.length <= 1e4);
          const seen = /* @__PURE__ */ new Set();
          const items2 = settings.map((s) => {
            guard(s && typeof s === "object" && !Array.isArray(s) && ["product", "category", "article", "promotion"].includes(s.kind) && typeof s.slug === "string" && /^[a-z0-9][a-z0-9-]{0,99}$/.test(s.slug) && ["custom", "noindex"].includes(s.mode));
            const id = s.kind + ":" + s.slug;
            guard(!seen.has(id));
            seen.add(id);
            const entry = { kind: s.kind, slug: s.slug, mode: s.mode };
            if (s.mode === "custom") {
              if (typeof s.title === "string" && s.title.length <= 180 && !/[<>]/.test(s.title))
                entry.title = s.title;
              if (typeof s.description === "string" && s.description.length <= 400 && !/[<>]/.test(s.description))
                entry.description = s.description;
              if (s.kind === "product" && typeof s.image === "string" && /^\/api\/catalogue-image\/[0-9a-f-]{36}$/.test(s.image)) entry.image = s.image;
            }
            return entry;
          });
          return response(200, { data: { items: items2 } }, corsOrigin, "no-store");
        }
        if (url.pathname === "/v1/public/category-display") {
          if (!categoryDisplayEnabled || typeof getPublicCategoryDisplay !== "function") return failure(404, "not_found", corsOrigin);
          return response(200, { data: projectPublicCategoryDisplay(await getPublicCategoryDisplay()) }, corsOrigin, "no-store");
        }
        if (url.pathname === "/v1/public/app-download") {
          if (typeof getPublicAppDownload !== "function") return failure(404, "not_found", corsOrigin);
          const config2 = await getPublicAppDownload();
          return response(200, { data: projectPublicAppDownload(config2) }, corsOrigin, "no-store");
        }
        if (url.pathname === "/v1/public/home-layout") {
          if (!homeLayoutEnabled || typeof getPublicHomeLayout !== "function") return failure(404, "not_found", corsOrigin);
          const layout = projectPublicHomeLayout(await getPublicHomeLayout());
          return response(200, { data: layout }, corsOrigin, "no-store");
        }
        if (url.pathname === "/v1/public/cms") {
          if (!cmsEnabled || typeof getPublicCms !== "function")
            return failure(503, "cms_unavailable", corsOrigin);
          const items2 = projectPublicCms(await getPublicCms());
          return response(200, { data: { items: items2 } }, corsOrigin, "no-store");
        }
        if (url.pathname === "/v1/public/content") {
          const content = projectPublicContent(await getPublicContent());
          return response(200, { data: content }, corsOrigin, "public, max-age=60");
        }
        const catalog = projectPublicCatalog(await getPublicCatalog());
        if (url.pathname === "/v1/public/categories") {
          const slug2 = url.searchParams.get("slug");
          const data = slug2 ? catalog.categories.filter((c) => c.slug === slug2) : catalog.categories;
          if (slug2 && !data.length) return failure(404, "not_found", corsOrigin);
          return response(200, { data }, corsOrigin, "no-store");
        }
        const slug = url.searchParams.get("slug");
        const categoryId = url.searchParams.get("categoryId");
        const page = integerParam(url.searchParams.get("page"), 1, MAX_PUBLIC_PRODUCTS);
        const limit = integerParam(url.searchParams.get("limit"), 20, 1e3);
        const items = catalog.products.filter((p) => (!slug || p.slug === slug || p.legacySlugs?.includes(slug)) && (!categoryId || p.categoryId === categoryId));
        if (slug && !items.length) return failure(404, "not_found", corsOrigin);
        const total = items.length;
        const pagination = { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
        const batch = items.slice((page - 1) * limit, page * limit);
        if (url.pathname === "/v1/public/catalog") {
          return response(
            200,
            { data: { categories: catalog.categories, products: batch }, pagination },
            corsOrigin,
            "no-store"
          );
        }
        return response(200, { data: batch, pagination }, corsOrigin, "no-store");
      } catch {
        return failure(503, "read_model_unavailable", corsOrigin);
      }
    }
  };
}
__name(createPublicApi, "createPublicApi");

// read-model.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var SQL = Object.freeze({
  categories: "SELECT id,slug,name,product_group,sort_order FROM fbmn_public.v_categories ORDER BY sort_order,id LIMIT 2001",
  products: "SELECT id,category_id,slug,name,description,public_price_mode FROM fbmn_public.v_products ORDER BY slug LIMIT 10001",
  variants: "SELECT product_id,sku,name,paper_size,page_count,paper_weight_gsm,binding,cover_finish,sale_unit,units_per_pack,units_per_carton,retail_price_vnd FROM fbmn_public.v_variants ORDER BY sku LIMIT 10001",
  media: "SELECT product_id,r2_key,alt,position FROM fbmn_public.v_media ORDER BY product_id,position LIMIT 10001",
  articles: "SELECT slug,title,summary,paragraphs,published_at FROM fbmn_public.v_articles ORDER BY published_at DESC LIMIT 501",
  promotions: "SELECT slug,title,summary,detail,ends_at FROM fbmn_public.v_promotions ORDER BY slug LIMIT 201",
  company: "SELECT legal_name,address,phone,email,hours FROM fbmn_public.v_company LIMIT 2",
  p5Skus: "SELECT sku_cong_ty,name,paper_size,product_spec,category_id,category_label,family_id,family_label FROM fbmn_public.v_p5_visible_skus ORDER BY sku_cong_ty LIMIT 10001",
  p5Media: "SELECT sku_cong_ty,asset_id,media_role,sort_order FROM fbmn_public.v_p5_visible_media WHERE (sku_cong_ty,sort_order,asset_id)>($1::text,$2::integer,$3::text) ORDER BY sku_cong_ty,sort_order,asset_id LIMIT 1000",
  p5ImageKey: "SELECT r2_key FROM fbmn_public.v_p5_image_assets WHERE asset_id=$1 LIMIT 1",
  dealer: "SELECT title,paragraphs,contact_instructions FROM fbmn_public.v_dealer_information LIMIT 2",
  homeLayout: "SELECT category_ids,featured_skus,category_limit,product_limit,section_order,revision FROM fbmn_public.v_web_home_layout LIMIT 2",
  appDownload: "SELECT popup_enabled,button_enabled,first_delay_ms,cooldown_minutes,title,message,ios_url,android_url,revision FROM fbmn_public.v_web_app_download_settings LIMIT 2",
  categoryDisplay: "SELECT category_id,mode FROM fbmn_public.v_web_category_display ORDER BY category_id LIMIT 2001",
  seoSettings: "SELECT kind,slug,mode,title,description,image FROM fbmn_public.v_web_seo_settings ORDER BY kind,slug LIMIT 10001",
  cmsEntries: "SELECT e.id,kind,slug,title,summary,paragraphs,cta_url,slot,sort_order,published_at,starts_at,ends_at,popup_delay_seconds,popup_cooldown_minutes,popup_max_per_session,has_desktop,has_mobile,(SELECT json_agg(json_build_object('slideNo',s.slide_no,'ordinal',s.ordinal,'enabled',s.enabled,'autoplay',s.autoplay,'effect',s.effect,'intervalMs',s.interval_ms,'durationMs',s.duration_ms) ORDER BY s.ordinal) FROM fbmn_public.v_cms_web_banner_slides s WHERE s.id=e.id) AS hero_slides FROM fbmn_public.v_cms_web_entries e ORDER BY sort_order,published_at,id LIMIT 501",
  cmsImageKey: "SELECT r2_key FROM fbmn_public.v_cms_web_images WHERE id=$1 AND device=$2 LIMIT 1",
  cmsSlideImageKey: "SELECT r2_key FROM fbmn_public.v_cms_web_banner_slide_images WHERE id=$1 AND device=$2 AND slide_no=$3 LIMIT 1",
  catalogueViewerSettings: "SELECT flip_duration_ms,sound_enabled,shadow_opacity,sound_volume FROM fbmn_public.v_catalogue_viewer_settings LIMIT 2",
  catalogueBooks: "SELECT b.id,b.title,b.edition,EXISTS(SELECT 1 FROM fbmn_public.v_catalogue_ready_assets a WHERE a.book_id=b.id AND a.kind='page') AS has_pages,EXISTS(SELECT 1 FROM fbmn_public.v_catalogue_ready_pdfs p WHERE p.book_id=b.id) AS has_pdf,EXISTS(SELECT 1 FROM fbmn_public.v_catalogue_ready_pdfs p WHERE p.book_id=b.id AND p.download_enabled=true) AS pdf_download_enabled FROM fbmn_public.v_catalogue_ready_books b ORDER BY b.updated_at DESC,b.id LIMIT 101",
  catalogueBook: "SELECT b.id,b.title,b.edition,EXISTS(SELECT 1 FROM fbmn_public.v_catalogue_ready_assets a WHERE a.book_id=b.id AND a.kind='page') AS has_pages,EXISTS(SELECT 1 FROM fbmn_public.v_catalogue_ready_pdfs p WHERE p.book_id=b.id) AS has_pdf,EXISTS(SELECT 1 FROM fbmn_public.v_catalogue_ready_pdfs p WHERE p.book_id=b.id AND p.download_enabled=true) AS pdf_download_enabled FROM fbmn_public.v_catalogue_ready_books b WHERE b.id=$1::uuid LIMIT 1",
  catalogueAssets: "SELECT id,kind,sort_order,width,height FROM fbmn_public.v_catalogue_ready_assets WHERE book_id=$1::uuid AND kind IN ('page','cover') ORDER BY kind,sort_order,id LIMIT 202",
  catalogueAssetKey: "SELECT r2_key,byte_size FROM fbmn_public.v_catalogue_ready_assets WHERE id=$1::uuid AND kind IN ('page','cover') LIMIT 1",
  cataloguePdf: "SELECT r2_key,byte_size,mime_type FROM fbmn_public.v_catalogue_ready_pdfs WHERE book_id=$1::uuid AND ($2::boolean=false OR download_enabled=true) LIMIT 1"
});
function rows(value, max) {
  if (!Array.isArray(value) || value.length > max) throw new Error("Invalid SQL read result");
  return value;
}
__name(rows, "rows");
var asString = /* @__PURE__ */ __name((x) => x == null ? null : String(x), "asString");
var asNumeric = /* @__PURE__ */ __name((x) => {
  if (x == null) return null;
  const n = Number(x);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error("Invalid retail value");
  return n;
}, "asNumeric");
var asDate = /* @__PURE__ */ __name((x) => x instanceof Date ? x.toISOString() : String(x), "asDate");
function specifications(row) {
  const s = {};
  for (const [column, field] of [["paper_size", "paperSize"], ["page_count", "pageCount"], ["paper_weight_gsm", "paperWeightGsm"], ["binding", "binding"], ["cover_finish", "coverFinish"]]) {
    if (row[column] != null) {
      const value = column === "page_count" || column === "paper_weight_gsm" ? Number(row[column]) : String(row[column]);
      s[field] = value;
    }
  }
  if (row.sale_unit != null) {
    s.packaging = { saleUnit: String(row.sale_unit) };
    if (row.units_per_pack != null) s.packaging.unitsPerPack = Number(row.units_per_pack);
    if (row.units_per_carton != null) s.packaging.unitsPerCarton = Number(row.units_per_carton);
  }
  return s;
}
__name(specifications, "specifications");
function createReadModel(query, { enableP5 = false } = {}) {
  if (typeof query !== "function") throw new Error("Missing read-only SQL executor");
  const execute = /* @__PURE__ */ __name(async (key2, max) => rows(await query(SQL[key2]), max), "execute");
  const normalized = /* @__PURE__ */ __name((value, max = 160) => String(value ?? "").trim().slice(0, max), "normalized");
  const positive = /* @__PURE__ */ __name((value) => {
    const n = Number(String(value ?? "").match(/^\s*(\d{1,4})/)?.[1] ?? NaN);
    return Number.isSafeInteger(n) && n > 0 ? n : null;
  }, "positive");
  const strictCount = /* @__PURE__ */ __name((value) => {
    if (!/^[1-9]\d{0,4}$/.test(String(value ?? ""))) return null;
    const n = Number(value);
    return Number.isSafeInteger(n) && n > 0 ? n : null;
  }, "strictCount");
  const strictGsm = /* @__PURE__ */ __name((value) => {
    if (!/^\d{1,4}(?:\.\d{1,2})?$/.test(String(value ?? ""))) return null;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, "strictGsm");
  const groupFor = /* @__PURE__ */ __name((name) => {
    const n = normalized(name).toLocaleLowerCase("vi-VN");
    return /học sinh|hoc sinh|vở hs|tập hs/.test(n) ? "school_notebook" : /sinh viên|sinh vien|sv/.test(n) ? "student_notebook" : /sổ|so tay|ghi chép/.test(n) ? "memo_book" : "stationery";
  }, "groupFor");
  const makeSlug = /* @__PURE__ */ __name(async (id) => {
    const bytes2 = new TextEncoder().encode(id);
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes2));
    return "sku-" + Array.from(hash.slice(0, 16), (x) => x.toString(16).padStart(2, "0")).join("");
  }, "makeSlug");
  const p5MediaPages = /* @__PURE__ */ __name(async () => {
    const images = [];
    let cursor = ["", -1, ""];
    for (let page = 0; page < 201; page++) {
      const batch = rows(await query(SQL.p5Media, cursor), 1e3);
      if (!batch.length) return images;
      for (const item of batch) images.push(item);
      if (images.length > 2e5) throw Error("P5 media volume exceeded");
      const last = batch[batch.length - 1];
      const next = [String(last.sku_cong_ty), Number(last.sort_order), String(last.asset_id)];
      if (next[0] === cursor[0] && next[1] === cursor[1] && next[2] === cursor[2])
        throw Error("Non-advancing P5 media cursor");
      cursor = next;
      if (batch.length < 1e3) return images;
    }
    throw Error("P5 media page limit exceeded");
  }, "p5MediaPages");
  const p5Catalog = /* @__PURE__ */ __name(async () => {
    const [skus, images] = await Promise.all([execute("p5Skus", 1e4), p5MediaPages()]);
    const bySku = /* @__PURE__ */ new Map();
    for (const m of images) {
      const id = String(m.asset_id);
      if (!/^[0-9a-f-]{36}$/i.test(id)) continue;
      const arr = bySku.get(String(m.sku_cong_ty)) ?? [];
      arr.push({
        r2Key: "products/catalogue/" + id + "-v1.webp",
        position: Number(m.sort_order),
        cover: m.media_role === "cover"
      });
      bySku.set(String(m.sku_cong_ty), arr);
    }
    const categories = /* @__PURE__ */ new Map(), groups = /* @__PURE__ */ new Map(), familyCounts = /* @__PURE__ */ new Map(), oldCategoryCounts = /* @__PURE__ */ new Map();
    for (const row of skus) {
      const sku = String(row.sku_cong_ty), name = normalized(row.name) || sku;
      const categoryId = row.category_id ? "p5-" + String(row.category_id) : "p5-uncategorized";
      const label = normalized(row.category_label) || "Ch\u01B0a ph\xE2n lo\u1EA1i";
      if (!categories.has(categoryId)) {
        categories.set(categoryId, {
          id: categoryId,
          slug: row.category_id ? "cat-" + String(row.category_id).replaceAll("-", "") : "chua-phan-loai",
          name: label,
          group: groupFor(label),
          sortOrder: categories.size + 100
        });
      }
      const key2 = row.family_id ? "family:" + String(row.family_id) : "sku:" + sku;
      const oldKey = String(row.family_id ?? sku) + "|" + categoryId;
      const oldCount = oldCategoryCounts.get(oldKey) ?? 0;
      oldCategoryCounts.set(oldKey, oldCount + 1);
      const oldPageKey = oldKey + "|part:" + Math.floor(oldCount / 100);
      const spec = row.product_spec && typeof row.product_spec === "object" ? row.product_spec : {};
      const values = {};
      const paperSize = normalized(row.paper_size, 120);
      if (paperSize) values.paperSize = paperSize;
      const pages = positive(spec.pages);
      if (pages) values.pageCount = pages;
      const gsm = strictGsm(spec.gsm);
      if (gsm) values.paperWeightGsm = gsm;
      const coverFinish = normalized(spec.cover_type, 120);
      if (coverFinish) values.coverFinish = coverFinish;
      const ruling = normalized(spec.ruling, 120);
      if (ruling) values.ruling = ruling;
      const unit = normalized(spec.unit, 80);
      if (unit) values.packaging = { saleUnit: unit };
      if (values.packaging && strictCount(spec.units_per_pack))
        values.packaging.unitsPerPack = strictCount(spec.units_per_pack);
      const count3 = familyCounts.get(key2) ?? 0;
      const part = Math.floor(count3 / 100);
      familyCounts.set(key2, count3 + 1);
      const pageKey = key2 + "|part:" + part;
      let group3 = groups.get(pageKey);
      if (!group3) {
        group3 = {
          id: pageKey,
          categoryId,
          name: (normalized(row.family_label) || name).slice(0, 160 - (part ? (" \xB7 Ph\u1EA7n " + (part + 1)).length : 0)) + (part ? " \xB7 Ph\u1EA7n " + (part + 1) : ""),
          sourceSku: sku,
          slug: "",
          priceLabel: "Li\xEAn h\u1EC7 b\xE1o gi\xE1",
          variants: [],
          media: [],
          legacyKeys: /* @__PURE__ */ new Map()
        };
        groups.set(pageKey, group3);
      }
      if (row.category_id && group3.categoryId === "p5-uncategorized") group3.categoryId = categoryId;
      group3.legacyKeys.set(oldPageKey, (group3.legacyKeys.get(oldPageKey) ?? 0) + 1);
      group3.variants.push({ sku, name, categoryId, specifications: values, price: null });
      const ownImages = (bySku.get(sku) ?? []).sort((a, b) => Number(b.cover) - Number(a.cover) || a.position - b.position);
      for (const media of ownImages) {
        if (group3.media.length >= 2e3) throw Error("P5 family media limit exceeded");
        group3.media.push({ r2Key: media.r2Key, alt: name, position: group3.media.length, sku });
      }
    }
    const products = [...groups.values()];
    const legacyOwners = /* @__PURE__ */ new Map();
    for (const group3 of products) {
      for (const [oldKey, count3] of group3.legacyKeys) {
        const oldOwner = legacyOwners.get(oldKey);
        if (!oldOwner || count3 > oldOwner.count) legacyOwners.set(oldKey, { group: group3, count: count3 });
      }
    }
    for (let offset = 0; offset < products.length; offset += 32) {
      await Promise.all(products.slice(offset, offset + 32).map(async (group3) => {
        const owned = [...group3.legacyKeys.keys()].filter((k) => legacyOwners.get(k)?.group === group3);
        const canonicalKey = group3.legacyKeys.size === 1 && owned.length === 1 ? owned[0] : group3.id;
        group3.slug = await makeSlug(canonicalKey);
        group3.id = group3.slug;
        const aliases = (await Promise.all(owned.map(makeSlug))).filter((slug) => slug !== group3.slug);
        if (aliases.length) group3.legacySlugs = aliases;
        delete group3.legacyKeys;
        delete group3.sourceSku;
      }));
    }
    return { categories: [...categories.values()], products };
  }, "p5Catalog");
  return {
    async getPublicImageKey(assetId) {
      if (!enableP5 || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(assetId)) return null;
      const results = await query(SQL.p5ImageKey, [assetId]);
      return Array.isArray(results) && results.length === 1 ? String(results[0].r2_key) : null;
    },
    async getPublicCatalog() {
      const [cs, ps, vs, ms] = await Promise.all([execute("categories", 2e3), execute("products", 1e4), execute("variants", 1e4), execute("media", 1e4)]);
      const categories = cs.map((c) => ({ id: String(c.id), slug: String(c.slug), name: String(c.name), group: String(c.product_group), sortOrder: Number(c.sort_order) }));
      const products = ps.flatMap((p) => {
        const variants = vs.filter((v) => v.product_id === p.id).map((v) => ({
          sku: String(v.sku),
          name: String(v.name),
          specifications: specifications(v),
          price: v.retail_price_vnd != null && p.public_price_mode === "retail" ? { kind: "retail", amountVnd: asNumeric(v.retail_price_vnd), currency: "VND" } : null
        }));
        if (!variants.length) return [];
        return [{
          id: String(p.id),
          categoryId: String(p.category_id),
          slug: String(p.slug),
          name: String(p.name),
          ...p.description == null ? {} : { description: String(p.description) },
          priceLabel: variants.every((v) => v.price === null) ? "Li\xEAn h\u1EC7 b\xE1o gi\xE1" : null,
          variants,
          media: ms.filter((m) => m.product_id === p.id).map((m) => ({ r2Key: String(m.r2_key), alt: String(m.alt), position: Number(m.position) }))
        }];
      });
      if (enableP5) {
        const fresh = await p5Catalog();
        const mapped = new Set(categories.map((c) => c.id));
        for (const c of fresh.categories) if (!mapped.has(c.id)) categories.push(c);
        products.push(...fresh.products);
      }
      return { categories, products };
    },
    async getPublicCategoryDisplay() {
      const items = await execute("categoryDisplay", 2e3);
      return { modes: items.map((row) => ({ categoryId: String(row.category_id), mode: String(row.mode) })) };
    },
    async getPublicAppDownload() {
      const records = await execute("appDownload", 2);
      if (records.length !== 1) throw Error("Invalid public app-download config");
      const r = records[0];
      return {
        popupEnabled: r.popup_enabled,
        buttonEnabled: r.button_enabled,
        firstDelayMs: Number(r.first_delay_ms),
        cooldownMinutes: Number(r.cooldown_minutes),
        title: r.title,
        message: r.message,
        iosUrl: r.ios_url,
        androidUrl: r.android_url,
        revision: Number(r.revision)
      };
    },
    async getPublicHomeLayout() {
      const record = await execute("homeLayout", 2);
      if (record.length !== 1) throw Error("Missing public home layout");
      const row = record[0];
      return {
        categoryIds: row.category_ids,
        featuredSkus: row.featured_skus,
        categoryLimit: Number(row.category_limit),
        productLimit: Number(row.product_limit),
        sectionOrder: row.section_order,
        revision: Number(row.revision)
      };
    },
    async getPublicCms() {
      const entries = await execute("cmsEntries", 500);
      return entries.map((row) => ({
        id: String(row.id),
        kind: String(row.kind),
        slug: String(row.slug),
        title: String(row.title),
        summary: String(row.summary),
        paragraphs: row.paragraphs,
        ctaUrl: row.cta_url,
        slot: String(row.slot),
        sortOrder: Number(row.sort_order),
        publishedAt: asDate(row.published_at),
        startsAt: row.starts_at == null ? null : asDate(row.starts_at),
        endsAt: row.ends_at == null ? null : asDate(row.ends_at),
        popupDelaySeconds: Number(row.popup_delay_seconds),
        popupCooldownMinutes: Number(row.popup_cooldown_minutes),
        popupMaxPerSession: Number(row.popup_max_per_session),
        hasDesktop: row.has_desktop === true,
        hasMobile: row.has_mobile === true,
        ...Array.isArray(row.hero_slides) && row.hero_slides.length ? {
          slides: row.hero_slides.map((s) => Number(s.slideNo)),
          motion: {
            enabled: row.hero_slides[0].enabled === true,
            autoplay: row.hero_slides[0].autoplay === true,
            effect: String(row.hero_slides[0].effect),
            intervalMs: Number(row.hero_slides[0].intervalMs),
            durationMs: Number(row.hero_slides[0].durationMs)
          }
        } : {}
      }));
    },
    async getPublicCmsImageKey(id, device, slide = 1) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || !["desktop", "mobile"].includes(device) || !Number.isInteger(slide) || slide < 1 || slide > 5) return null;
      const entries = rows(await query(
        slide === 1 ? SQL.cmsImageKey : SQL.cmsSlideImageKey,
        slide === 1 ? [id, device] : [id, device, slide]
      ), 1);
      return entries.length === 1 && /^cms\/[0-9a-f-]{36}\/public_web\/(desktop|mobile)\/[0-9a-f-]{36}\.webp$/i.test(String(entries[0].r2_key)) ? String(entries[0].r2_key) : null;
    },
    async getCatalogueViewerSettings() {
      const result = rows(await query(SQL.catalogueViewerSettings), 2);
      if (result.length !== 1) throw Error("Missing viewer settings");
      const r = result[0];
      const value = {
        flipDurationMs: Number(r.flip_duration_ms),
        soundEnabled: r.sound_enabled === true,
        soundVolume: Number(r.sound_volume),
        shadowOpacity: Number(r.shadow_opacity)
      };
      if (!Number.isSafeInteger(value.flipDurationMs) || value.flipDurationMs < 750 || value.flipDurationMs > 1500 || value.flipDurationMs % 50 !== 0 || !Number.isInteger(value.soundVolume) || value.soundVolume < 0 || value.soundVolume > 100 || !Number.isFinite(value.shadowOpacity) || value.shadowOpacity < 0.1 || value.shadowOpacity > 0.5 || typeof r.sound_enabled !== "boolean")
        throw Error("Invalid viewer settings");
      return value;
    },
    async getReadyCatalogueBooks() {
      const result = rows(await query(SQL.catalogueBooks), 101);
      if (result.length > 100) throw Error("Too many public books");
      return result.map((b) => ({
        id: String(b.id),
        title: String(b.title),
        edition: String(b.edition),
        ...typeof b.has_pages === "boolean" ? {
          hasPages: b.has_pages === true,
          hasPdf: b.has_pdf === true,
          pdfDownloadEnabled: b.pdf_download_enabled === true
        } : {}
      }));
    },
    async getReadyCatalogueBook(id) {
      if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return null;
      const result = rows(await query(SQL.catalogueBook, [id]), 1);
      return result.length === 1 ? {
        id: String(result[0].id),
        title: String(result[0].title),
        edition: String(result[0].edition),
        ...typeof result[0].has_pages === "boolean" ? {
          hasPages: result[0].has_pages === true,
          hasPdf: result[0].has_pdf === true,
          pdfDownloadEnabled: result[0].pdf_download_enabled === true
        } : {}
      } : null;
    },
    async getReadyCatalogueAssets(id) {
      if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return [];
      const result = rows(await query(SQL.catalogueAssets, [id]), 202);
      if (result.length > 201) throw Error("Too many public pages");
      return result.map((a) => ({
        id: String(a.id),
        kind: String(a.kind),
        sortOrder: Number(a.sort_order),
        width: Number(a.width),
        height: Number(a.height)
      }));
    },
    async getReadyCatalogueAssetKey(id) {
      if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return null;
      const result = rows(await query(SQL.catalogueAssetKey, [id]), 1);
      return result.length === 1 ? { key: String(result[0].r2_key), bytes: Number(result[0].byte_size) } : null;
    },
    async getReadyCataloguePdf(id, download = false) {
      if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id) || typeof download !== "boolean") return null;
      const result = rows(await query(SQL.cataloguePdf, [id, download]), 1);
      return result.length === 1 ? {
        key: String(result[0].r2_key),
        bytes: Number(result[0].byte_size),
        mime: String(result[0].mime_type)
      } : null;
    },
    async getPublicSeoSettings({ contentSource = "legacy" } = {}) {
      if (!["legacy", "cms"].includes(contentSource)) throw Error("Invalid SEO content source");
      const [rows2, catalog, content] = await Promise.all([
        execute("seoSettings", 1e4),
        this.getPublicCatalog(),
        contentSource === "cms" ? this.getPublicCms() : this.getPublicContent()
      ]);
      const products = /* @__PURE__ */ new Map(), activeCategoryIds = /* @__PURE__ */ new Set();
      for (const product of catalog.products) {
        products.set(product.slug, product);
        for (const alias of product.legacySlugs || []) products.set(alias, product);
        activeCategoryIds.add(product.categoryId);
        for (const variant of product.variants) {
          if (variant.categoryId) activeCategoryIds.add(variant.categoryId);
        }
      }
      const categories = new Set(catalog.categories.filter((c) => activeCategoryIds.has(c.id)).map((c) => c.slug));
      const articles = new Set((contentSource === "cms" ? content.filter((c) => c.kind === "article") : content.articles).map((c) => c.slug));
      const promotions = new Set((contentSource === "cms" ? content.filter((c) => c.kind === "promotion") : content.promotions).map((c) => c.slug));
      const settings = /* @__PURE__ */ new Map();
      for (const row of rows2) {
        const kind = String(row.kind), requested = String(row.slug), mode = String(row.mode);
        if (!["product", "category", "article", "promotion"].includes(kind) || !["auto", "custom", "noindex"].includes(mode)) continue;
        const product = kind === "product" ? products.get(requested) : null;
        if (kind === "product" && !product || kind === "category" && !categories.has(requested) || kind === "article" && !articles.has(requested) || kind === "promotion" && !promotions.has(requested)) continue;
        const slug = product ? product.slug : requested, id = kind + ":" + slug;
        const item = {
          kind,
          slug,
          mode,
          title: mode === "custom" ? String(row.title || "") : "",
          description: mode === "custom" ? String(row.description || "") : "",
          image: null
        };
        if (mode === "custom" && kind === "product" && typeof row.image === "string") {
          const approved = product.media.some((media) => {
            const match = /^products\/catalogue\/([0-9a-f-]{36})-v1\.webp$/i.exec(media.r2Key);
            return match && row.image === "/api/catalogue-image/" + match[1];
          });
          if (approved) item.image = row.image;
        }
        if (!settings.has(id) || requested === slug) settings.set(id, item);
      }
      return [...settings.values()].filter((item) => item.mode !== "auto");
    },
    async getPublicContent() {
      const [articles, promotions, companies, dealers] = await Promise.all([
        execute("articles", 500),
        execute("promotions", 200),
        execute("company", 1),
        execute("dealer", 1)
      ]);
      const company = companies.length ? Object.fromEntries(
        ["legal_name", "address", "phone", "email", "hours"].filter((k) => companies[0][k] != null).map((k) => [{ "legal_name": "legalName" }[k] ?? k, asString(companies[0][k])])
      ) : null;
      return {
        company,
        articles: articles.map((a) => ({ slug: String(a.slug), title: String(a.title), summary: String(a.summary), paragraphs: a.paragraphs.map(String), publishedAt: asDate(a.published_at) })),
        promotions: promotions.map((p) => ({ slug: String(p.slug), title: String(p.title), summary: String(p.summary), detail: String(p.detail), endsAt: asDate(p.ends_at) })),
        dealerInformation: dealers.length ? { title: String(dealers[0].title), paragraphs: dealers[0].paragraphs.map(String), contactInstructions: String(dealers[0].contact_instructions) } : null
      };
    }
  };
}
__name(createReadModel, "createReadModel");

// catalogue-books-public.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var UUID2 = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
var MAX_IMAGE = 5 * 1024 * 1024;
var MAX_PDF = 20 * 1024 * 1024;
var HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Vary": "Origin" };
var fail = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, { status, headers: HEADERS }), "fail");
var ok = /* @__PURE__ */ __name((data) => Response.json({ data }, { headers: HEADERS }), "ok");
function cataloguePublicAssetKey(key2) {
  return typeof key2 === "string" && /^books\/[0-9a-f-]{36}\/(pages|covers)\/[0-9a-f-]{36}\.webp$/.test(key2);
}
__name(cataloguePublicAssetKey, "cataloguePublicAssetKey");
function cataloguePublicPdfKey(key2) {
  return typeof key2 === "string" && /^books\/[0-9a-f-]{36}\/pdf\/[0-9a-f-]{36}\.pdf$/.test(key2);
}
__name(cataloguePublicPdfKey, "cataloguePublicPdfKey");
function parseCataloguePublicQuery(url) {
  const u = url instanceof URL ? url : new URL(url);
  if (u.pathname === "/v1/public/catalogue-books") {
    if (!u.search) return { kind: "list" };
    if (u.searchParams.size !== 1 || u.searchParams.getAll("id").length !== 1 || !UUID2.test(u.searchParams.get("id") || "")) return null;
    return { kind: "detail", id: u.searchParams.get("id") };
  }
  if (u.pathname === "/v1/public/catalogue-pdf") {
    const entries = [...u.searchParams.keys()];
    if (entries.length < 1 || entries.length > 2 || new Set(entries).size !== entries.length || entries.some((key2) => !["book", "download"].includes(key2)) || u.searchParams.getAll("book").length !== 1 || !UUID2.test(u.searchParams.get("book") || "") || u.searchParams.has("download") && u.searchParams.get("download") !== "1") return null;
    return {
      kind: "pdf",
      book: u.searchParams.get("book"),
      download: u.searchParams.get("download") === "1"
    };
  }
  if (u.pathname === "/v1/public/catalogue-image") {
    if (u.searchParams.size !== 1 || u.searchParams.getAll("asset").length !== 1 || !UUID2.test(u.searchParams.get("asset") || "")) return null;
    return { kind: "image", asset: u.searchParams.get("asset") };
  }
  return null;
}
__name(parseCataloguePublicQuery, "parseCataloguePublicQuery");
async function handlePublicCatalogueRequest({ request, enabled, pdfEnabled = false, allowedOrigins, r2, listBooks, getSettings, getBook, getAssets, getKey, getPdf }) {
  if (!enabled) return fail(404, "not_found");
  if (request.method !== "GET") return fail(405, "method_not_allowed");
  const origin = request.headers.get("origin");
  if (origin && (!Array.isArray(allowedOrigins) || !allowedOrigins.includes(origin))) return fail(403, "origin_forbidden");
  const parsed = parseCataloguePublicQuery(new URL(request.url));
  if (!parsed) return fail(400, "invalid_query");
  try {
    if (parsed.kind === "list") {
      if (typeof listBooks !== "function" || typeof getSettings !== "function")
        return fail(503, "catalogue_unavailable");
      const [books, settings] = await Promise.all([listBooks(), getSettings()]);
      if (!Array.isArray(books) || books.length > 100 || !Number.isSafeInteger(settings?.flipDurationMs) || settings.flipDurationMs < 750 || settings.flipDurationMs > 1500 || settings.flipDurationMs % 50 !== 0 || typeof settings.soundEnabled !== "boolean" || !Number.isInteger(settings.soundVolume) || settings.soundVolume < 0 || settings.soundVolume > 100 || typeof settings.shadowOpacity !== "number" || settings.shadowOpacity < 0.1 || settings.shadowOpacity > 0.5) return fail(503, "catalogue_unavailable");
      return ok({
        books: books.filter((b) => pdfEnabled || b.hasPages !== false).map((b) => ({
          id: b.id,
          title: b.title,
          edition: b.edition,
          ...typeof b.hasPages === "boolean" ? {
            hasPages: b.hasPages !== false,
            hasPdf: pdfEnabled && b.hasPdf === true,
            pdfDownloadEnabled: pdfEnabled && b.hasPdf === true && b.pdfDownloadEnabled === true
          } : {}
        })),
        viewerSettings: {
          flipDurationMs: settings.flipDurationMs,
          soundEnabled: settings.soundEnabled,
          soundVolume: settings.soundVolume,
          shadowOpacity: settings.shadowOpacity
        }
      });
    }
    if (parsed.kind === "detail") {
      if (typeof getBook !== "function" || typeof getAssets !== "function")
        return fail(503, "catalogue_unavailable");
      const book = await getBook(parsed.id);
      if (!book || !pdfEnabled && book.hasPages === false) return fail(404, "not_found");
      const assets = await getAssets(parsed.id);
      if (!Array.isArray(assets) || assets.length > 201) return fail(503, "catalogue_unavailable");
      const pages = assets.filter((a) => a.kind === "page").sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
      if (!pages.length && !(pdfEnabled && book.hasPdf) || pages.length > 200) return fail(404, "not_found");
      const cover = assets.find((a) => a.kind === "cover");
      const assetDTO = /* @__PURE__ */ __name((a) => ({ id: a.id, width: a.width, height: a.height }), "assetDTO");
      return ok({
        book: {
          id: book.id,
          title: book.title,
          edition: book.edition,
          ...typeof book.hasPages === "boolean" ? {
            hasPages: pages.length > 0,
            hasPdf: pdfEnabled && book.hasPdf === true,
            pdfDownloadEnabled: pdfEnabled && book.hasPdf === true && book.pdfDownloadEnabled === true
          } : {}
        },
        pages: pages.map(assetDTO),
        cover: cover ? assetDTO(cover) : null
      });
    }
    if (parsed.kind === "pdf") {
      if (!pdfEnabled) return fail(404, "not_found");
      if (typeof getPdf !== "function" || !r2?.get) return fail(503, "catalogue_unavailable");
      const found = await getPdf(parsed.book, parsed.download);
      if (!found || !cataloguePublicPdfKey(found.key) || found.mime !== "application/pdf" || !Number.isSafeInteger(found.bytes) || found.bytes < 100 || found.bytes > MAX_PDF)
        return fail(404, "not_found");
      const pdf = await r2.get(found.key);
      if (!pdf?.body || pdf.size !== found.bytes || pdf.httpMetadata?.contentType !== "application/pdf")
        return fail(404, "not_found");
      return new Response(pdf.body, { status: 200, headers: {
        ...HEADERS,
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.size),
        "Content-Disposition": (parsed.download ? "attachment" : "inline") + '; filename="futurebook-catalogue-' + parsed.book + '.pdf"',
        "Cross-Origin-Resource-Policy": "same-origin"
      } });
    }
    if (typeof getKey !== "function" || !r2?.get) return fail(503, "catalogue_unavailable");
    const record = await getKey(parsed.asset);
    if (!record || !cataloguePublicAssetKey(record.key) || !Number.isSafeInteger(record.bytes) || record.bytes < 100 || record.bytes > MAX_IMAGE)
      return fail(404, "not_found");
    const image = await r2.get(record.key);
    if (!image?.body || image.size !== record.bytes || image.httpMetadata?.contentType !== "image/webp")
      return fail(404, "not_found");
    return new Response(image.body, { status: 200, headers: {
      ...HEADERS,
      "Content-Type": "image/webp",
      "Content-Length": String(image.size),
      "Cross-Origin-Resource-Policy": "same-origin"
    } });
  } catch {
    return fail(503, "catalogue_unavailable");
  }
}
__name(handlePublicCatalogueRequest, "handlePublicCatalogueRequest");

// chat-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../lib/chatbot/chat-request.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var CHAT_PATH = "/v1/public/chat";
var CHAT_MAX_BYTES = 2048;
var CHAT_PROOF_PREFIX = "dl10b:";
function parseChatRequest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value;
  if (Object.keys(v).length !== 2 || typeof v.session !== "string" || typeof v.text !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v.session)) return null;
  const text2 = v.text.trim();
  if (!text2 || text2.length > 300 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text2)) return null;
  return { session: v.session, text: text2 };
}
__name(parseChatRequest, "parseChatRequest");
async function readChatRequest(request) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json" || Number(request.headers.get("content-length") || 0) > CHAT_MAX_BYTES || !request.body) return null;
  const reader = request.body.getReader(), decoder = new TextDecoder("utf-8", { fatal: true });
  let raw = "", size = 0;
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > CHAT_MAX_BYTES) {
        await reader.cancel();
        return null;
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    return parseChatRequest(JSON.parse(raw));
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
__name(readChatRequest, "readChatRequest");

// chat-service.mjs
var HEADERS2 = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Vary": "Origin" };
var fail2 = /* @__PURE__ */ __name((status, code) => Response.json({ ok: false, error: { code } }, { status, headers: HEADERS2 }), "fail");
async function handleChat({ request, allowedOrigins, verifyProxy, limitVisitor, limitGlobal, chat }) {
  const url = new URL(request.url);
  if (url.pathname !== CHAT_PATH) return fail2(404, "not_found");
  if (request.method !== "POST") return fail2(405, "method_not_allowed");
  if (url.search) return fail2(400, "invalid_query");
  if (!allowedOrigins.includes(request.headers.get("Origin"))) return fail2(403, "origin_forbidden");
  const data = await readChatRequest(request);
  if (!data) return fail2(400, "invalid_request");
  try {
    const visitor = await verifyProxy(request, CHAT_PROOF_PREFIX + JSON.stringify(data));
    if (!visitor) return fail2(403, "untrusted_proxy");
    if ((await limitVisitor(visitor))?.success !== true || (await limitGlobal())?.success !== true) return fail2(429, "request_limited");
    const result = await chat(data, visitor);
    if (result?.ok !== true || typeof result.text !== "string" || !result.text.trim() || result.text.length > 3e3)
      return fail2(503, "chat_unavailable");
    return Response.json({ ok: true, text: result.text }, { headers: HEADERS2 });
  } catch {
    return fail2(503, "chat_unavailable");
  }
}
__name(handleChat, "handleChat");

// contact-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../lib/contact/dl9-validation.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../apps/admin/lib/contact-options.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var PROVINCES = [["01", "H\xE0 N\u1ED9i"], ["04", "Cao B\u1EB1ng"], ["08", "Tuy\xEAn Quang"], ["11", "\u0110i\u1EC7n Bi\xEAn"], ["12", "Lai Ch\xE2u"], ["14", "S\u01A1n La"], ["15", "L\xE0o Cai"], ["19", "Th\xE1i Nguy\xEAn"], ["20", "L\u1EA1ng S\u01A1n"], ["22", "Qu\u1EA3ng Ninh"], ["24", "B\u1EAFc Ninh"], ["25", "Ph\xFA Th\u1ECD"], ["31", "H\u1EA3i Ph\xF2ng"], ["33", "H\u01B0ng Y\xEAn"], ["37", "Ninh B\xECnh"], ["38", "Thanh H\xF3a"], ["40", "Ngh\u1EC7 An"], ["42", "H\xE0 T\u0129nh"], ["44", "Qu\u1EA3ng Tr\u1ECB"], ["46", "Hu\u1EBF"], ["48", "\u0110\xE0 N\u1EB5ng"], ["51", "Qu\u1EA3ng Ng\xE3i"], ["52", "Gia Lai"], ["56", "Kh\xE1nh H\xF2a"], ["66", "\u0110\u1EAFk L\u1EAFk"], ["68", "L\xE2m \u0110\u1ED3ng"], ["75", "\u0110\u1ED3ng Nai"], ["79", "H\u1ED3 Ch\xED Minh"], ["80", "T\xE2y Ninh"], ["82", "\u0110\u1ED3ng Th\xE1p"], ["86", "V\u0129nh Long"], ["91", "An Giang"], ["92", "C\u1EA7n Th\u01A1"], ["96", "C\xE0 Mau"]];
var CUSTOMER_GROUPS = ["Nh\xE0 ph\xE2n ph\u1ED1i", "\u0110\u1EA1i l\xFD", "Nh\xE0 s\xE1ch", "C\u1EEDa h\xE0ng v\u0103n ph\xF2ng ph\u1EA9m", "Tr\u01B0\u1EDDng h\u1ECDc", "Doanh nghi\u1EC7p", "Nh\xE0 m\xE1y", "Kh\xE1c"];
var INTERESTS = ["T\u1EADp v\u1EDF h\u1ECDc sinh", "T\u1EADp sinh vi\xEAn", "S\u1ED5 tay / Notebook", "Gi\u1EA5y in / gi\u1EA5y v\u0103n ph\xF2ng", "Gi\u1EA5y v\xE0 t\u1EADp v\u1EDF kh\xE1c", "V\u0103n ph\xF2ng ph\u1EA9m", "Gia c\xF4ng theo y\xEAu c\u1EA7u", "Kh\xE1c"];

// ../../lib/contact/dl9-validation.ts
function validateContactRequest(value, now = Date.now()) {
  const fail5 = /* @__PURE__ */ __name((error4) => ({ ok: false, error: error4 }), "fail");
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail5("invalid_payload");
  const v = value;
  const keys = ["name", "company", "email", "phone", "province", "customerGroup", "interests", "message", "consent", "website", "startedAt"];
  if (Object.keys(v).some((k) => !keys.includes(k))) return fail5("invalid_field");
  const clean2 = /* @__PURE__ */ __name((x, max) => typeof x === "string" && x.length <= max ? x.trim() : null, "clean");
  const name = clean2(v.name, 100), company = clean2(v.company, 150), email = clean2(v.email, 254)?.toLowerCase() ?? null, phone = clean2(v.phone, 30), message = clean2(v.message, 2e3);
  const province = clean2(v.province, 2), customerGroup = clean2(v.customerGroup, 80);
  if (!name || name.length < 2 || company === null || email === null || phone === null || message === null || !email && !phone || email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || phone && (!/^\+?[0-9 ().-]+$/.test(phone) || phone.replace(/\D/g, "").length < 8 || phone.replace(/\D/g, "").length > 15) || !province || !PROVINCES.some((p) => p[0] === province) || !customerGroup || !CUSTOMER_GROUPS.some((g) => g === customerGroup) || !Array.isArray(v.interests) || v.interests.length < 1 || v.interests.length > INTERESTS.length || !v.interests.every((x) => typeof x === "string" && INTERESTS.some((i) => i === x)) || new Set(v.interests).size !== v.interests.length) return fail5("invalid_fields");
  if (v.consent !== true) return fail5("consent_required");
  if (v.website !== "" || typeof v.startedAt !== "number" || !Number.isSafeInteger(v.startedAt) || v.startedAt > now - 3e3 || now - v.startedAt > 864e5) return fail5("anti_spam");
  return { ok: true, data: { name, company, email, phone, province, customerGroup, interests: v.interests, message, consent: true, website: "", startedAt: v.startedAt } };
}
__name(validateContactRequest, "validateContactRequest");

// contact-service.mjs
var HEADERS3 = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Vary": "Origin"
};
var fail3 = /* @__PURE__ */ __name((status, code) => Response.json({ ok: false, error: { code } }, { status, headers: HEADERS3 }), "fail");
async function limitedJson(request) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return null;
  if (Number(request.headers.get("content-length") || 0) > 8192 || !request.body) return null;
  const reader = request.body.getReader(), decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0, raw = "";
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) {
        await reader.cancel();
        return null;
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    return JSON.parse(raw);
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
__name(limitedJson, "limitedJson");
async function handleContactRequest({ request, enabled, allowedOrigins, submit, verifyProxy, limitVisitor }) {
  const url = new URL(request.url);
  if (url.pathname !== "/v1/public/contact-requests") return fail3(404, "not_found");
  if (!enabled || typeof submit !== "function" || typeof verifyProxy !== "function" || typeof limitVisitor !== "function") return fail3(503, "intake_unavailable");
  const origin = request.headers.get("Origin");
  if (!origin || !allowedOrigins.includes(origin)) return fail3(403, "origin_forbidden");
  if (url.search) return fail3(400, "invalid_query");
  if (request.method !== "POST") return fail3(405, "method_not_allowed");
  const body = await limitedJson(request), validated = validateContactRequest(body);
  if (!validated.ok) return fail3(400, validated.error);
  try {
    const visitor = await verifyProxy(request, JSON.stringify(validated.data));
    if (!visitor) return fail3(403, "untrusted_proxy");
    const limit = await limitVisitor(visitor);
    if (limit?.success !== true) return fail3(429, "request_limited");
    await submit(validated.data);
    return Response.json({ ok: true }, { status: 201, headers: HEADERS3 });
  } catch (error4) {
    if (error4?.code === "P0001") return fail3(429, "request_limited");
    return fail3(503, "intake_unavailable");
  }
}
__name(handleContactRequest, "handleContactRequest");

// outsourcing-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../lib/outsourcing/validation.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
var KEYS = /* @__PURE__ */ new Set(["name", "email", "phone", "productType", "specifications", "quantity", "desiredDate", "details", "consent", "website", "startedAt"]);
function clean(value, max) {
  return typeof value === "string" && value.length <= max ? value.trim() : null;
}
__name(clean, "clean");
function validateOutsourcingRequest(value, now = Date.now()) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "invalid_payload" };
  const v = value;
  if (Object.keys(v).some((k) => !KEYS.has(k))) return { ok: false, error: "invalid_field" };
  const name = clean(v.name, 120), email = clean(v.email, 260)?.toLowerCase() ?? null;
  const phone = clean(v.phone, 40), productType = clean(v.productType, 100);
  const specifications2 = clean(v.specifications, 600), quantity = clean(v.quantity, 80);
  const desiredDate = clean(v.desiredDate, 80), details = clean(v.details, 2500);
  if (!name || name.length < 2 || name.length > 100 || !email || email.length > 254 || !EMAIL.test(email) || phone === null || phone !== "" && !/^[0-9+(). \-]{7,30}$/.test(phone) || !productType || productType.length < 2 || productType.length > 80 || specifications2 === null || quantity === null || desiredDate === null || !details || details.length < 10 || details.length > 2e3)
    return { ok: false, error: "invalid_fields" };
  if (v.consent !== true) return { ok: false, error: "consent_required" };
  if (v.website !== "" || !Number.isSafeInteger(v.startedAt) || typeof v.startedAt !== "number" || !Number.isSafeInteger(now) || v.startedAt > now - 3e3 || now - v.startedAt > 864e5)
    return { ok: false, error: "anti_spam" };
  return { ok: true, data: {
    name,
    email,
    phone,
    productType,
    specifications: specifications2,
    quantity,
    desiredDate,
    details,
    consent: true,
    website: "",
    startedAt: v.startedAt
  } };
}
__name(validateOutsourcingRequest, "validateOutsourcingRequest");

// outsourcing-service.mjs
var HEADERS4 = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Vary": "Origin"
};
var fail4 = /* @__PURE__ */ __name((status, code) => Response.json({ ok: false, error: { code } }, { status, headers: HEADERS4 }), "fail");
async function limitedJson2(request) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return null;
  if (Number(request.headers.get("content-length") || 0) > 8192 || !request.body) return null;
  const reader = request.body.getReader(), decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0, raw = "";
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) {
        await reader.cancel();
        return null;
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    return JSON.parse(raw);
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
__name(limitedJson2, "limitedJson");
async function handleOutsourcingRequest({ request, enabled, allowedOrigins, submit, verifyProxy, limitVisitor }) {
  const url = new URL(request.url);
  if (url.pathname !== "/v1/public/outsourcing-requests") return fail4(404, "not_found");
  if (!enabled || typeof submit !== "function" || typeof verifyProxy !== "function" || typeof limitVisitor !== "function") return fail4(503, "intake_unavailable");
  const origin = request.headers.get("Origin");
  if (!origin || !allowedOrigins.includes(origin)) return fail4(403, "origin_forbidden");
  if (url.search) return fail4(400, "invalid_query");
  if (request.method !== "POST") return fail4(405, "method_not_allowed");
  const body = await limitedJson2(request), validated = validateOutsourcingRequest(body);
  if (!validated.ok) return fail4(400, validated.error);
  try {
    const visitor = await verifyProxy(request, JSON.stringify(validated.data));
    if (!visitor) return fail4(403, "untrusted_proxy");
    const limit = await limitVisitor(visitor);
    if (limit?.success !== true) return fail4(429, "request_limited");
    await submit(validated.data);
    return Response.json({ ok: true }, { status: 201, headers: HEADERS4 });
  } catch (error4) {
    if (error4?.code === "P0001") return fail4(429, "request_limited");
    return fail4(503, "intake_unavailable");
  }
}
__name(handleOutsourcingRequest, "handleOutsourcingRequest");

// ../../lib/outsourcing/proxy-proof.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var HEX = /^[0-9a-f]{64}$/;
var CLOCK = /^[1-9][0-9]{9}$/;
var encoder = new TextEncoder();
var hex = /* @__PURE__ */ __name((buf) => Array.from(new Uint8Array(buf), (x) => x.toString(16).padStart(2, "0")).join(""), "hex");
function bytes(value) {
  return Uint8Array.from(value.match(/../g).map((x) => parseInt(x, 16)));
}
__name(bytes, "bytes");
async function key(secret) {
  if (!HEX.test(secret)) throw Error("Missing DL6 proxy secret");
  return crypto.subtle.importKey("raw", bytes(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
__name(key, "key");
async function payloadHash(body) {
  return hex(await crypto.subtle.digest("SHA-256", encoder.encode(body)));
}
__name(payloadHash, "payloadHash");
async function verifyIntakeProof(secret, headers, body, now = Date.now()) {
  const visitor = headers.get("x-fbmn-dl6-visitor") || "";
  const time3 = headers.get("x-fbmn-dl6-time") || "";
  const signature = headers.get("x-fbmn-dl6-signature") || "";
  if (!HEX.test(secret) || !HEX.test(visitor) || !CLOCK.test(time3) || !HEX.test(signature) || Math.abs(Math.floor(now / 1e3) - Number(time3)) > 45) return null;
  const signingKey = await key(secret);
  const hash = await payloadHash(body);
  const valid = await crypto.subtle.verify(
    "HMAC",
    signingKey,
    bytes(signature),
    encoder.encode(visitor + "." + time3 + "." + hash)
  );
  return valid ? visitor : null;
}
__name(verifyIntakeProof, "verifyIntakeProof");

// staging-worker.mjs
var ALLOWED_SQL = new Set(Object.values(SQL));
var ROUTES2 = /* @__PURE__ */ new Set(["/v1/public/categories", "/v1/public/products", "/v1/public/catalog", "/v1/public/content", "/v1/public/cms", "/v1/public/home-layout", "/v1/public/app-download", "/v1/public/category-display", "/v1/public/catalogue-books", "/v1/public/outsourcing-requests", "/v1/public/contact-requests", "/v1/public/chat"]);
var DECORATIVE_ROUTE = "/v1/public/decorative-background";
var CMS_IMAGE_ROUTE = "/v1/public/cms/image";
var CATALOGUE_IMAGE_ROUTE = "/v1/public/catalogue-image";
var CATALOGUE_PDF_ROUTE = "/v1/public/catalogue-pdf";
var CATALOGUE_BOOKS_ROUTE = "/v1/public/catalogue-books";
var OUTSOURCING_ROUTE = "/v1/public/outsourcing-requests";
var DECORATIVE_KEY = "banners/G04/backdrop-v1.webp";
var error3 = /* @__PURE__ */ __name((status, code) => new Response(
  JSON.stringify({ error: { code, message: "Y\xEAu c\u1EA7u kh\xF4ng th\u1EC3 x\u1EED l\xFD." } }),
  { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } }
), "error");
function createStagingWorker({ createDbClient }) {
  if (typeof createDbClient !== "function") throw new Error("Missing DB driver");
  async function readModel(env2, read) {
    const client = createDbClient({
      connectionString: env2.HYPERDRIVE.connectionString,
      connectionTimeoutMillis: 3500,
      query_timeout: 3500,
      statement_timeout: 3500
    });
    try {
      await client.connect();
      const identity = await client.query("SELECT current_user AS role_name");
      if (identity.rows?.length !== 1 || identity.rows[0].role_name !== env2.EXPECTED_DB_ROLE) {
        throw new Error("Unsafe database role");
      }
      const model = createReadModel(async (sql, args = []) => {
        if (!ALLOWED_SQL.has(sql)) throw new Error("Unapproved SQL");
        return (await client.query(sql, args)).rows;
      }, { enableP5: env2.PUBLIC_P5_ENABLED === "true" });
      return await read(model);
    } finally {
      await client.end();
    }
  }
  __name(readModel, "readModel");
  return {
    async fetch(request, env2) {
      const requiredRole = env2?.PUBLIC_P5_ENABLED === "true" ? "fbmn_p5_public_login" : "fbmn_public_http_staging";
      if (!env2?.HYPERDRIVE?.connectionString || typeof env2.RATE_LIMITER?.limit !== "function" || env2.EXPECTED_DB_ROLE !== requiredRole || typeof env2.PUBLIC_ALLOWED_ORIGINS !== "string") return error3(503, "service_unavailable");
      const url = new URL(request.url);
      const isDecorative = url.pathname === DECORATIVE_ROUTE;
      const isCmsImage = url.pathname === CMS_IMAGE_ROUTE;
      const isCatalogueImage = url.pathname === CATALOGUE_IMAGE_ROUTE;
      const isCataloguePdf = url.pathname === CATALOGUE_PDF_ROUTE;
      const isCatalogueRequest = isCatalogueImage || isCataloguePdf || url.pathname === CATALOGUE_BOOKS_ROUTE;
      const isImage = url.pathname === "/v1/public/image" || isDecorative || isCmsImage || isCatalogueImage || isCataloguePdf;
      if (isImage && typeof env2.IMAGE_RATE_LIMITER?.limit !== "function")
        return error3(503, "service_unavailable");
      let rate;
      try {
        const actor = (request.headers.get("CF-Connecting-IP") || "unknown").slice(0, 100);
        const key2 = isImage ? "media:" + actor + ":" + (isDecorative ? "g04-backdrop" : (isCataloguePdf ? url.searchParams.get("book") : isCatalogueImage ? url.searchParams.get("asset") : url.searchParams.get("id"))?.slice(0, 40)) : actor + ":" + (ROUTES2.has(url.pathname) ? url.pathname : "other");
        rate = await (isImage ? env2.IMAGE_RATE_LIMITER : env2.RATE_LIMITER).limit({ key: key2 });
      } catch {
        return error3(503, "service_unavailable");
      }
      if (rate?.success !== true) return error3(429, "rate_limited");
      try {
        const origins = env2.PUBLIC_ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
        if (url.pathname === "/v1/public/chat") {
          if (typeof env2.CHATBOT_GATEWAY?.chat !== "function" || typeof env2.OUTSOURCING_RATE_LIMITER?.limit !== "function" || !/^[0-9a-f]{64}$/.test(env2.DL6_PROXY_SECRET || "")) return error3(503, "chat_unavailable");
          return handleChat({
            request,
            allowedOrigins: origins,
            verifyProxy: /* @__PURE__ */ __name((req, payload) => verifyIntakeProof(env2.DL6_PROXY_SECRET, req.headers, payload), "verifyProxy"),
            limitVisitor: /* @__PURE__ */ __name((visitor) => env2.OUTSOURCING_RATE_LIMITER.limit({ key: "dl10b:" + visitor }), "limitVisitor"),
            limitGlobal: /* @__PURE__ */ __name(() => env2.RATE_LIMITER.limit({ key: "dl10b-global" }), "limitGlobal"),
            chat: /* @__PURE__ */ __name((data, visitor) => env2.CHATBOT_GATEWAY.chat(data, visitor), "chat")
          });
        }
        if (url.pathname === OUTSOURCING_ROUTE) {
          if (env2.PUBLIC_DL6_ENABLED !== "true" || typeof env2.OUTSOURCING_RATE_LIMITER?.limit !== "function" || !/^[0-9a-f]{64}$/.test(env2.DL6_PROXY_SECRET || ""))
            return error3(503, "intake_unavailable");
          return handleOutsourcingRequest({
            request,
            enabled: true,
            allowedOrigins: origins,
            verifyProxy: /* @__PURE__ */ __name((req, payload) => verifyIntakeProof(env2.DL6_PROXY_SECRET, req.headers, payload), "verifyProxy"),
            limitVisitor: /* @__PURE__ */ __name((visitor) => env2.OUTSOURCING_RATE_LIMITER.limit({ key: "dl6:" + visitor }), "limitVisitor"),
            submit: /* @__PURE__ */ __name(async (data) => {
              const client = createDbClient({
                connectionString: env2.HYPERDRIVE.connectionString,
                connectionTimeoutMillis: 3500,
                query_timeout: 3500,
                statement_timeout: 3500
              });
              try {
                await client.connect();
                const identity = await client.query("SELECT current_user AS role_name");
                if (identity.rows?.[0]?.role_name !== env2.EXPECTED_DB_ROLE) throw Error("Unsafe database role");
                await client.query(
                  "SELECT fbmn_public.submit_outsourcing_request($1,$2,$3,$4,$5,$6,$7,$8,$9)",
                  [
                    data.name,
                    data.email,
                    data.phone,
                    data.productType,
                    data.specifications,
                    data.quantity,
                    data.desiredDate,
                    data.details,
                    data.consent
                  ]
                );
              } finally {
                await client.end();
              }
            }, "submit")
          });
        }
        if (url.pathname === "/v1/public/contact-requests") {
          if (env2.PUBLIC_DL6_ENABLED !== "true" || typeof env2.OUTSOURCING_RATE_LIMITER?.limit !== "function" || !/^[0-9a-f]{64}$/.test(env2.DL6_PROXY_SECRET || ""))
            return error3(503, "intake_unavailable");
          return handleContactRequest({
            request,
            enabled: true,
            allowedOrigins: origins,
            verifyProxy: /* @__PURE__ */ __name((req, payload) => verifyIntakeProof(env2.DL6_PROXY_SECRET, req.headers, payload), "verifyProxy"),
            limitVisitor: /* @__PURE__ */ __name((visitor) => env2.OUTSOURCING_RATE_LIMITER.limit({ key: "dl9:" + visitor }), "limitVisitor"),
            submit: /* @__PURE__ */ __name(async (data) => {
              const client = createDbClient({
                connectionString: env2.HYPERDRIVE.connectionString,
                connectionTimeoutMillis: 3500,
                query_timeout: 3500,
                statement_timeout: 3500
              });
              try {
                await client.connect();
                const identity = await client.query("SELECT current_user AS role_name");
                if (identity.rows?.[0]?.role_name !== env2.EXPECTED_DB_ROLE) throw Error("Unsafe database role");
                await client.query(
                  "SELECT fbmn_public.submit_contact_request($1,$2,$3,$4,$5,$6,$7,$8,$9)",
                  [data.name, data.company, data.email, data.phone, data.province, data.customerGroup, data.interests, data.message, data.consent]
                );
              } finally {
                await client.end();
              }
            }, "submit")
          });
        }
        if (isCatalogueRequest) {
          return handlePublicCatalogueRequest({
            request,
            enabled: env2.PUBLIC_DL7C_ENABLED === "true",
            pdfEnabled: env2.PUBLIC_DL7A_PDF_ENABLED === "true",
            allowedOrigins: origins,
            r2: env2.CATALOGUE_MEDIA_R2,
            listBooks: /* @__PURE__ */ __name(() => readModel(env2, (m) => m.getReadyCatalogueBooks()), "listBooks"),
            getSettings: /* @__PURE__ */ __name(() => readModel(env2, (m) => m.getCatalogueViewerSettings()), "getSettings"),
            getBook: /* @__PURE__ */ __name((id) => readModel(env2, (m) => m.getReadyCatalogueBook(id)), "getBook"),
            getAssets: /* @__PURE__ */ __name((id) => readModel(env2, (m) => m.getReadyCatalogueAssets(id)), "getAssets"),
            getKey: /* @__PURE__ */ __name((id) => readModel(env2, (m) => m.getReadyCatalogueAssetKey(id)), "getKey"),
            getPdf: /* @__PURE__ */ __name((id, download) => readModel(env2, (m) => m.getReadyCataloguePdf(id, download)), "getPdf")
          });
        }
        if (isDecorative) {
          const origin = request.headers.get("Origin");
          if (origin && !origins.includes(origin)) return error3(403, "origin_forbidden");
          if (request.method !== "GET") return error3(405, "method_not_allowed");
          if (url.searchParams.size !== 0) return error3(400, "invalid_query");
          if (typeof env2.PUBLIC_MEDIA_R2?.get !== "function") return error3(503, "service_unavailable");
          const image = await env2.PUBLIC_MEDIA_R2.get(DECORATIVE_KEY);
          if (!image || !image.body || image.size < 16 || image.size > 5 * 1024 * 1024 || image.httpMetadata?.contentType !== "image/webp")
            return error3(404, "not_found");
          return new Response(image.body, { status: 200, headers: {
            "Content-Type": "image/webp",
            "Content-Length": String(image.size),
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
            "Cross-Origin-Resource-Policy": "same-origin"
          } });
        }
        if (isCmsImage) {
          if (env2.PUBLIC_CMS_ENABLED !== "true" || request.method !== "GET" || typeof env2.PUBLIC_MEDIA_R2?.get !== "function") return error3(404, "not_found");
          const origin = request.headers.get("Origin");
          if (origin && !origins.includes(origin)) return error3(403, "origin_forbidden");
          const keys = [...url.searchParams.keys()];
          if (keys.length < 2 || keys.length > 3 || new Set(keys).size !== keys.length || keys.some((k) => !["id", "device", "slide"].includes(k)) || url.searchParams.getAll("id").length !== 1 || url.searchParams.getAll("device").length !== 1 || url.searchParams.has("slide") && url.searchParams.getAll("slide").length !== 1)
            return error3(400, "invalid_query");
          const id = url.searchParams.get("id") || "", device = url.searchParams.get("device") || "";
          const slide = url.searchParams.has("slide") ? Number(url.searchParams.get("slide")) : 1;
          if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || !["desktop", "mobile"].includes(device) || !Number.isInteger(slide) || slide < 1 || slide > 5 || url.searchParams.has("slide") && !/^[1-5]$/.test(url.searchParams.get("slide") || ""))
            return error3(400, "invalid_query");
          const key2 = await readModel(env2, (m) => m.getPublicCmsImageKey(id, device, slide));
          if (!key2) return error3(404, "not_found");
          const object2 = await env2.PUBLIC_MEDIA_R2.get(key2);
          if (!object2?.body || object2.size < 100 || object2.size > 5 * 1024 * 1024 || object2.httpMetadata?.contentType !== "image/webp") return error3(404, "not_found");
          return new Response(object2.body, { status: 200, headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
            "Cross-Origin-Resource-Policy": "same-origin"
          } });
        }
        if (url.pathname === "/v1/public/image") {
          if (request.method !== "GET" || !env2.PUBLIC_MEDIA_R2?.get || env2.PUBLIC_P5_ENABLED !== "true")
            return error3(404, "not_found");
          const origin = request.headers.get("Origin");
          if (origin && !origins.includes(origin)) return error3(403, "origin_forbidden");
          if (url.searchParams.size !== 1 || url.searchParams.getAll("id").length !== 1)
            return error3(400, "invalid_query");
          const assetId = url.searchParams.get("id") || "";
          if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(assetId))
            return error3(400, "invalid_query");
          const key2 = await readModel(env2, (m) => m.getPublicImageKey(assetId));
          if (!key2) return error3(404, "not_found");
          const image = await env2.PUBLIC_MEDIA_R2.get(key2);
          if (!image || image.size > 5 * 1024 * 1024) return error3(404, "not_found");
          return new Response(image.body, { status: 200, headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
            "Cross-Origin-Resource-Policy": "same-origin"
          } });
        }
        const api = createPublicApi({
          getPublicCatalog: /* @__PURE__ */ __name(() => readModel(env2, (m) => m.getPublicCatalog()), "getPublicCatalog"),
          getPublicContent: /* @__PURE__ */ __name(() => readModel(env2, (m) => m.getPublicContent()), "getPublicContent"),
          getPublicCms: /* @__PURE__ */ __name(() => readModel(env2, (m) => m.getPublicCms()), "getPublicCms"),
          getPublicHomeLayout: /* @__PURE__ */ __name(() => readModel(env2, (m) => m.getPublicHomeLayout()), "getPublicHomeLayout"),
          getPublicAppDownload: /* @__PURE__ */ __name(() => readModel(env2, (m) => m.getPublicAppDownload()), "getPublicAppDownload"),
          getPublicCategoryDisplay: /* @__PURE__ */ __name(() => readModel(env2, (m) => m.getPublicCategoryDisplay()), "getPublicCategoryDisplay"),
          getPublicSeoSettings: /* @__PURE__ */ __name(({ contentSource }) => {
            if (contentSource === "cms" && env2.PUBLIC_CMS_ENABLED !== "true")
              throw Error("CMS source unavailable for SEO");
            return readModel(env2, (m) => m.getPublicSeoSettings({ contentSource }));
          }, "getPublicSeoSettings"),
          categoryDisplayEnabled: env2.PUBLIC_P5_ENABLED === "true",
          seoEnabled: env2.PUBLIC_SEO02_ENABLED === "true",
          homeLayoutEnabled: env2.PUBLIC_DL4_ENABLED === "true",
          cmsEnabled: env2.PUBLIC_CMS_ENABLED === "true",
          allowedOrigins: origins
        });
        return await api.fetch(request);
      } catch {
        return error3(503, "service_unavailable");
      }
    }
  };
}
__name(createStagingWorker, "createStagingWorker");

// worker-entry.mjs
var worker_entry_default = createStagingWorker({ createDbClient: /* @__PURE__ */ __name((config2) => new Client(config2), "createDbClient") });
export {
  worker_entry_default as default
};
//# sourceMappingURL=worker-entry.js.map
