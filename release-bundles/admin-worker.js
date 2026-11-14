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
var __esm = (fn, res2) => function __init() {
  return fn && (res2 = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res2;
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
    var DATE3 = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/;
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
      var year2 = parseInt(matches[1], 10);
      if (isBC) {
        year2 = bcYearToNegativeYear(year2);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day3 = matches[3];
      var hour2 = parseInt(matches[4], 10);
      var minute2 = parseInt(matches[5], 10);
      var second = parseInt(matches[6], 10);
      var ms = matches[7];
      ms = ms ? 1e3 * parseFloat(ms) : 0;
      var date4;
      var offset = timeZoneOffset(isoDate);
      if (offset != null) {
        date4 = new Date(Date.UTC(year2, month, day3, hour2, minute2, second, ms));
        if (is0To99(year2)) {
          date4.setUTCFullYear(year2);
        }
        if (offset !== 0) {
          date4.setTime(date4.getTime() - offset);
        }
      } else {
        date4 = new Date(year2, month, day3, hour2, minute2, second, ms);
        if (is0To99(year2)) {
          date4.setFullYear(year2);
        }
      }
      return date4;
    }, "parseDate");
    function getDate(isoDate) {
      var matches = DATE3.exec(isoDate);
      if (!matches) {
        return;
      }
      var year2 = parseInt(matches[1], 10);
      var isBC = !!matches[4];
      if (isBC) {
        year2 = bcYearToNegativeYear(year2);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day3 = matches[3];
      var date4 = new Date(year2, month, day3);
      if (is0To99(year2)) {
        date4.setFullYear(year2);
      }
      return date4;
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
    function bcYearToNegativeYear(year2) {
      return -(year2 - 1);
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
      return Object.keys(positions).reduce(function(parsed2, property) {
        var position = positions[property];
        var value = matches[position];
        if (!value) return parsed2;
        value = property === "milliseconds" ? parseMilliseconds(value) : parseInt(value, 10);
        if (!value) return parsed2;
        if (isNegative && ~negatives.indexOf(property)) {
          value *= -1;
        }
        parsed2[property] = value;
        return parsed2;
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
    var parseBits = /* @__PURE__ */ __name(function(data2, bits, offset, invert, callback) {
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
        result = callback(0, inv(data2[offsetBytes]) & mask, firstBits);
      }
      var bytes = bits + offset >> 3;
      for (var i = offsetBytes + 1; i < bytes; i++) {
        result = callback(result, inv(data2[i]), 8);
      }
      var lastBits = (bits + offset) % 8;
      if (lastBits > 0) {
        result = callback(result, inv(data2[bytes]) >> 8 - lastBits, lastBits);
      }
      return result;
    }, "parseBits");
    var parseFloatFromBits = /* @__PURE__ */ __name(function(data2, precisionBits, exponentBits) {
      var bias = Math.pow(2, exponentBits - 1) - 1;
      var sign = parseBits(data2, 1);
      var exponent = parseBits(data2, exponentBits, 1);
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
      var mantissa = parseBits(data2, precisionBits, exponentBits + 1, false, parsePrecisionBits);
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
          let item3 = val[i];
          if (!(item3 instanceof Buffer)) {
            const buf = Buffer.from(item3.buffer, item3.byteOffset, item3.byteLength);
            if (buf.length === item3.byteLength) {
              item3 = buf;
            } else {
              item3 = buf.slice(item3.byteOffset, item3.byteOffset + item3.byteLength);
            }
          }
          result += "\\\\x" + item3.toString("hex");
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
    function dateToString(date4) {
      let offset = -date4.getTimezoneOffset();
      let year2 = date4.getFullYear();
      const isBCYear = year2 < 1;
      if (isBCYear) year2 = Math.abs(year2) + 1;
      let ret = String(year2).padStart(4, "0") + "-" + String(date4.getMonth() + 1).padStart(2, "0") + "-" + String(date4.getDate()).padStart(2, "0") + "T" + String(date4.getHours()).padStart(2, "0") + ":" + String(date4.getMinutes()).padStart(2, "0") + ":" + String(date4.getSeconds()).padStart(2, "0") + "." + String(date4.getMilliseconds()).padStart(3, "0");
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
    function dateToStringUTC(date4) {
      let year2 = date4.getUTCFullYear();
      const isBCYear = year2 < 1;
      if (isBCYear) year2 = Math.abs(year2) + 1;
      let ret = String(year2).padStart(4, "0") + "-" + String(date4.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date4.getUTCDate()).padStart(2, "0") + "T" + String(date4.getUTCHours()).padStart(2, "0") + ":" + String(date4.getUTCMinutes()).padStart(2, "0") + ":" + String(date4.getUTCSeconds()).padStart(2, "0") + "." + String(date4.getUTCMilliseconds()).padStart(3, "0");
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
    var escapeIdentifier2 = /* @__PURE__ */ __name(function(str) {
      return '"' + str.replace(/"/g, '""') + '"';
    }, "escapeIdentifier");
    var escapeLiteral2 = /* @__PURE__ */ __name(function(str) {
      let hasBackslash = false;
      let escaped = "'";
      if (str == null) {
        return "''";
      }
      if (typeof str !== "string") {
        return "''";
      }
      for (let i = 0; i < str.length; i++) {
        const c = str[i];
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
    function sha256(text) {
      return nodeCrypto.createHash("sha256").update(text).digest();
    }
    __name(sha256, "sha256");
    function hashByName(hashName, text) {
      hashName = hashName.replace(/(\D)-/, "$1");
      return nodeCrypto.createHash(hashName).update(text).digest();
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
        const data2 = typeof string === "string" ? textEncoder.encode(string) : string;
        const hash2 = await subtleCrypto.digest("MD5", data2);
        return Array.from(new Uint8Array(hash2)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    }
    __name(md5, "md5");
    async function postgresMd5PasswordHash(user, password, salt) {
      const inner = await md5(password + user);
      const outer = await md5(Buffer.concat([Buffer.from(inner), salt]));
      return "md5" + outer;
    }
    __name(postgresMd5PasswordHash, "postgresMd5PasswordHash");
    async function sha256(text) {
      return await subtleCrypto.digest("SHA-256", text);
    }
    __name(sha256, "sha256");
    async function hashByName(hashName, text) {
      return await subtleCrypto.digest(hashName, text);
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
    function readASN1Length(data2, index) {
      let length = data2[index++];
      if (length < 128) return { length, index };
      const lengthBytes = length & 127;
      if (lengthBytes > 4) throw x509Error("bad length", data2);
      length = 0;
      for (let i = 0; i < lengthBytes; i++) {
        length = length << 8 | data2[index++];
      }
      return { length, index };
    }
    __name(readASN1Length, "readASN1Length");
    function readASN1OID(data2, index) {
      if (data2[index++] !== 6) throw x509Error("non-OID data", data2);
      const { length: OIDLength, index: indexAfterOIDLength } = readASN1Length(data2, index);
      index = indexAfterOIDLength;
      const lastIndex = index + OIDLength;
      const byte1 = data2[index++];
      let oid = (byte1 / 40 >> 0) + "." + byte1 % 40;
      while (index < lastIndex) {
        let value = 0;
        while (index < lastIndex) {
          const nextByte = data2[index++];
          value = value << 7 | nextByte & 127;
          if (nextByte < 128) break;
        }
        oid += "." + value;
      }
      return { oid, index };
    }
    __name(readASN1OID, "readASN1OID");
    function expectASN1Seq(data2, index) {
      if (data2[index++] !== 48) throw x509Error("non-sequence data", data2);
      return readASN1Length(data2, index);
    }
    __name(expectASN1Seq, "expectASN1Seq");
    function signatureAlgorithmHashFromCertificate(data2, index) {
      if (index === void 0) index = 0;
      index = expectASN1Seq(data2, index).index;
      const { length: certInfoLength, index: indexAfterCertInfoLength } = expectASN1Seq(data2, index);
      index = indexAfterCertInfoLength + certInfoLength;
      index = expectASN1Seq(data2, index).index;
      const { oid, index: indexAfterOID } = readASN1OID(data2, index);
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
          index = expectASN1Seq(data2, index).index;
          if (data2[index++] !== 160) throw x509Error("non-tag data", data2);
          index = readASN1Length(data2, index).index;
          index = expectASN1Seq(data2, index).index;
          const { oid: hashOID } = readASN1OID(data2, index);
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
          throw x509Error("unknown hash OID " + hashOID, data2);
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
      throw x509Error("unknown OID " + oid, data2);
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
    function isPrintableChars(text) {
      if (typeof text !== "string") {
        throw new TypeError("SASL: text must be a string");
      }
      return text.split("").map((_, i) => text.charCodeAt(i)).every((c) => c >= 33 && c <= 43 || c >= 45 && c <= 126);
    }
    __name(isPrintableChars, "isPrintableChars");
    function isBase64(text) {
      return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(text);
    }
    __name(isBase64, "isBase64");
    function parseAttributePairs(text) {
      if (typeof text !== "string") {
        throw new TypeError("SASL: attribute pairs text must be a string");
      }
      return new Map(
        text.split(",").map((attrValue) => {
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
    function parseServerFirstMessage(data2) {
      const attrPairs = parseAttributePairs(data2);
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
    function parse(str, options = {}) {
      if (str.charAt(0) === "/") {
        const config3 = str.split(" ");
        return { host: config3[0], database: config3[1] };
      }
      const config2 = /* @__PURE__ */ Object.create(null);
      let result;
      let dummyHost = false;
      if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str)) {
        str = encodeURI(str).replace(/%25(\d\d)/g, "%$1");
      }
      try {
        try {
          result = new URL(str, "postgres://base");
        } catch (e) {
          result = new URL(str.replace("@/", "@___DUMMY___/"), "postgres://base");
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
    function parseIntoClientConfig(str) {
      return toClientConfig(parse(str));
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
      _getRows(connection, rows) {
        connection.execute({
          portal: this.portal,
          rows
        });
        if (!rows) {
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
      constructor(message2, length, name) {
        super(message2);
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
      constructor(length, text) {
        this.length = length;
        this.text = text;
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
      constructor(length, message2) {
        this.length = length;
        this.message = message2;
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
      const response = Buffer.allocUnsafe(8);
      response.writeInt32BE(8, 0);
      response.writeInt32BE(80877103, 4);
      return response;
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
    var query = /* @__PURE__ */ __name((text) => {
      return writer.addCString(text).flush(
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
      const rows = config2.rows || 0;
      const portalLength = Buffer.byteLength(portal);
      const len = 4 + portalLength + 1 + 4;
      const buff = Buffer.allocUnsafe(1 + len);
      buff[0] = 69;
      buff.writeInt32BE(len, 1);
      buff.write(portal, 5, "utf-8");
      buff[portalLength + 5] = 0;
      buff.writeUInt32BE(rows, buff.length - 4);
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
      const text = `${msg.type}${msg.name || ""}`;
      return cstringMessage(67, text);
    }, "close");
    var copyData = /* @__PURE__ */ __name((chunk) => {
      return writer.add(chunk).flush(
        100
        /* code.copyFromChunk */
      );
    }, "copyData");
    var copyFail = /* @__PURE__ */ __name((message2) => {
      return cstringMessage(102, message2);
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
            const message2 = this.handlePacket(offset + HEADER_LENGTH, code, length, this.buffer);
            callback(message2);
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
      handlePacket(offset, code, length, bytes) {
        const { reader } = this;
        reader.setBuffer(offset, bytes);
        let message2;
        switch (code) {
          case 50:
            message2 = messages_1.bindComplete;
            break;
          case 49:
            message2 = messages_1.parseComplete;
            break;
          case 51:
            message2 = messages_1.closeComplete;
            break;
          case 110:
            message2 = messages_1.noData;
            break;
          case 115:
            message2 = messages_1.portalSuspended;
            break;
          case 99:
            message2 = messages_1.copyDone;
            break;
          case 87:
            message2 = messages_1.replicationStart;
            break;
          case 73:
            message2 = messages_1.emptyQuery;
            break;
          case 68:
            message2 = parseDataRowMessage(reader);
            break;
          case 67:
            message2 = parseCommandCompleteMessage(reader);
            break;
          case 90:
            message2 = parseReadyForQueryMessage(reader);
            break;
          case 65:
            message2 = parseNotificationMessage(reader);
            break;
          case 82:
            message2 = parseAuthenticationResponse(reader, length);
            break;
          case 83:
            message2 = parseParameterStatusMessage(reader);
            break;
          case 75:
            message2 = parseBackendKeyData(reader);
            break;
          case 69:
            message2 = parseErrorMessage(reader, "error");
            break;
          case 78:
            message2 = parseErrorMessage(reader, "notice");
            break;
          case 84:
            message2 = parseRowDescriptionMessage(reader);
            break;
          case 116:
            message2 = parseParameterDescriptionMessage(reader);
            break;
          case 71:
            message2 = parseCopyInMessage(reader);
            break;
          case 72:
            message2 = parseCopyOutMessage(reader);
            break;
          case 100:
            message2 = parseCopyData(reader, length);
            break;
          default:
            return new messages_1.DatabaseError("received invalid response: " + code.toString(16), length, "error");
        }
        reader.setBuffer(0, emptyBuffer);
        message2.length = length;
        return message2;
      }
    };
    exports.Parser = Parser;
    var parseReadyForQueryMessage = /* @__PURE__ */ __name((reader) => {
      const status = reader.string(1);
      return new messages_1.ReadyForQueryMessage(LATEINIT_LENGTH, status);
    }, "parseReadyForQueryMessage");
    var parseCommandCompleteMessage = /* @__PURE__ */ __name((reader) => {
      const text = reader.cstring();
      return new messages_1.CommandCompleteMessage(LATEINIT_LENGTH, text);
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
      const message2 = new messages_1.CopyResponse(LATEINIT_LENGTH, messageName, isBinary, columnCount);
      for (let i = 0; i < columnCount; i++) {
        message2.columnTypes[i] = reader.int16();
      }
      return message2;
    }, "parseCopyMessage");
    var parseNotificationMessage = /* @__PURE__ */ __name((reader) => {
      const processId = reader.int32();
      const channel2 = reader.cstring();
      const payload = reader.cstring();
      return new messages_1.NotificationResponseMessage(LATEINIT_LENGTH, processId, channel2, payload);
    }, "parseNotificationMessage");
    var parseRowDescriptionMessage = /* @__PURE__ */ __name((reader) => {
      const fieldCount = reader.int16();
      const message2 = new messages_1.RowDescriptionMessage(LATEINIT_LENGTH, fieldCount);
      for (let i = 0; i < fieldCount; i++) {
        message2.fields[i] = parseField(reader);
      }
      return message2;
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
      const message2 = new messages_1.ParameterDescriptionMessage(LATEINIT_LENGTH, parameterCount);
      for (let i = 0; i < parameterCount; i++) {
        message2.dataTypeIDs[i] = reader.uint32();
      }
      return message2;
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
      const message2 = {
        name: "authenticationOk",
        length
      };
      switch (code) {
        case 0:
          break;
        case 3:
          if (message2.length === 8) {
            message2.name = "authenticationCleartextPassword";
          }
          break;
        case 5:
          if (message2.length === 12) {
            message2.name = "authenticationMD5Password";
            const salt = reader.bytes(4);
            return new messages_1.AuthenticationMD5Password(LATEINIT_LENGTH, salt);
          }
          break;
        case 10:
          {
            message2.name = "authenticationSASL";
            message2.mechanisms = [];
            let mechanism;
            do {
              mechanism = reader.cstring();
              if (mechanism) {
                message2.mechanisms.push(mechanism);
              }
            } while (mechanism);
          }
          break;
        case 11:
          message2.name = "authenticationSASLContinue";
          message2.data = reader.string(length - 8);
          break;
        case 12:
          message2.name = "authenticationSASLFinal";
          message2.data = reader.string(length - 8);
          break;
        default:
          throw new Error("Unknown authenticationOk message type " + code);
      }
      return message2;
    }, "parseAuthenticationResponse");
    var parseErrorMessage = /* @__PURE__ */ __name((reader, name) => {
      const fields = {};
      let fieldType = reader.string(1);
      while (fieldType !== "\0") {
        fields[fieldType] = reader.cstring();
        fieldType = reader.string(1);
      }
      const messageValue = fields.M;
      const message2 = name === "notice" ? new messages_1.NoticeMessage(LATEINIT_LENGTH, messageValue) : new messages_1.DatabaseError(messageValue, LATEINIT_LENGTH, name);
      message2.severity = fields.S;
      message2.code = fields.C;
      message2.detail = fields.D;
      message2.hint = fields.H;
      message2.position = fields.P;
      message2.internalPosition = fields.p;
      message2.internalQuery = fields.q;
      message2.where = fields.W;
      message2.schema = fields.s;
      message2.table = fields.t;
      message2.column = fields.c;
      message2.dataType = fields.d;
      message2.constraint = fields.n;
      message2.file = fields.F;
      message2.line = fields.L;
      message2.routine = fields.R;
      return message2;
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
          log4("connecting");
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
          log4("socket ready");
          this.writable = true;
          this.emit("connect");
          return this;
        } catch (e) {
          this.emit("error", e);
        }
      }
      async _listen() {
        while (true) {
          log4("awaiting receive from CF socket");
          const { done, value } = await this._cfReader.read();
          log4("CF socket received:", done, value);
          if (done) {
            log4("done");
            break;
          }
          this.emit("data", Buffer.from(value));
        }
      }
      async _listenOnce() {
        log4("awaiting first receive from CF socket");
        const { done, value } = await this._cfReader.read();
        log4("First CF socket received:", done, value);
        this.emit("data", Buffer.from(value));
      }
      write(data2, encodingOrCallback = "utf8", callback = () => {
      }) {
        const encoding = typeof encodingOrCallback === "function" ? "utf8" : encodingOrCallback;
        if (typeof encodingOrCallback === "function")
          callback = encodingOrCallback;
        if (data2.length === 0)
          return callback();
        if (typeof data2 === "string")
          data2 = Buffer.from(data2, encoding);
        log4("sending data direct:", data2);
        this._cfWriter.write(data2).then(() => {
          log4("data sent");
          callback();
        }, (err) => {
          log4("send error", err);
          callback(err);
        });
        return true;
      }
      end(data2 = Buffer.alloc(0), encoding = "utf8", callback = () => {
      }) {
        log4("ending CF socket");
        this.write(data2, encoding, (err) => {
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
        log4("destroying CF socket", reason);
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
            log4("CF socket closed");
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
    function dump(data2) {
      if (data2 instanceof Uint8Array || data2 instanceof ArrayBuffer) {
        const buf = data2 instanceof Uint8Array ? Buffer.from(data2) : Buffer.from(data2);
        const hex2 = buf.toString("hex");
        const str = new TextDecoder().decode(data2);
        return `
>>> STR: "${str.replace(/\n/g, "\\n")}"
>>> HEX: ${hex2}
`;
      } else {
        return data2;
      }
    }
    __name(dump, "dump");
    function log4(...args) {
      debug3 && console.log(...args.map(dump));
    }
    __name(log4, "log");
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
        const reportStreamError = /* @__PURE__ */ __name(function(error7) {
          if (self._ending && (error7.code === "ECONNRESET" || error7.code === "EPIPE")) {
            return;
          }
          self.emit("error", error7);
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
      query(text) {
        this._send(serialize.query(text));
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
      let list2;
      if (this.overflow) {
        const buf = this[kDecoder].write(chunk);
        list2 = buf.split(this.matcher);
        if (list2.length === 1) return cb();
        list2.shift();
        this.overflow = false;
      } else {
        this[kLast] += this[kDecoder].write(chunk);
        list2 = this[kLast].split(this.matcher);
      }
      this[kLast] = list2.pop();
      for (let i = 0; i < list2.length; i++) {
        try {
          push(this, this.mapper(list2[i]));
        } catch (error7) {
          return cb(error7);
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
        } catch (error7) {
          return cb(error7);
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
    var path2 = require_path();
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
      var file = env2.PGPASSFILE || (isWin ? path2.join(env2.APPDATA || "./", "postgresql", "pgpass.conf") : path2.join(env2.HOME || "./", ".pgpass"));
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
        var res2 = rule(value);
        if (!res2) {
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
    var path2 = require_path();
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
          const error7 = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
          clearTimeout(this.connectionTimeoutHandle);
          this._errorAllQueries(error7);
          this._ended = true;
          if (!this._ending) {
            if (this._connecting && !this._connectionError) {
              if (this._connectionCallback) {
                this._connectionCallback(error7);
              } else {
                this._handleErrorEvent(error7);
              }
            } else if (!this._connectionError) {
              this._handleErrorEvent(error7);
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
          this._connect((error7) => {
            if (error7) {
              reject(error7);
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
          const error7 = new Error("Received unexpected commandComplete message from backend.");
          this._handleErrorEvent(error7);
          return;
        }
        this.activeQuery.handleCommandComplete(msg, this.connection);
      }
      _handleParseComplete() {
        if (this.activeQuery == null) {
          const error7 = new Error("Received unexpected parseComplete message from backend.");
          this._handleErrorEvent(error7);
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
        const data2 = {
          user: params.user,
          database: params.database
        };
        const appName = params.application_name || params.fallback_application_name;
        if (appName) {
          data2.application_name = appName;
        }
        if (params.replication) {
          data2.replication = "" + params.replication;
        }
        if (params.statement_timeout) {
          data2.statement_timeout = String(parseInt(params.statement_timeout, 10));
        }
        if (params.lock_timeout) {
          data2.lock_timeout = String(parseInt(params.lock_timeout, 10));
        }
        if (params.idle_in_transaction_session_timeout) {
          data2.idle_in_transaction_session_timeout = String(parseInt(params.idle_in_transaction_session_timeout, 10));
        }
        if (params.options) {
          data2.options = params.options;
        }
        return data2;
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
      escapeIdentifier(str) {
        return utils.escapeIdentifier(str);
      }
      escapeLiteral(str) {
        return utils.escapeLiteral(str);
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
              query.callback = (err, res2) => err ? reject(err) : resolve(res2);
            }).catch((err) => {
              Error.captureStackTrace(err);
              throw err;
            });
          }
        }
        if (readTimeout) {
          queryCallback = query.callback;
          readTimeoutTimer = setTimeout(() => {
            const error7 = new Error("Query read timeout");
            process.nextTick(() => {
              query.handleError(error7, this.connection);
            });
            queryCallback(error7);
            query.callback = () => {
            };
            const index = this.queryQueue.indexOf(query);
            if (index > -1) {
              this.queryQueue.splice(index, 1);
            }
            this._pulseQueryQueue();
          }, readTimeout);
          query.callback = (err, res2) => {
            clearTimeout(readTimeoutTimer);
            queryCallback(err, res2);
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
    var removeWhere = /* @__PURE__ */ __name((list2, predicate) => {
      const i = list2.findIndex(predicate);
      return i === -1 ? void 0 : list2.splice(i, 1)[0];
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
      let res2;
      const cb = /* @__PURE__ */ __name(function(err, client) {
        err ? rej(err) : res2(client);
      }, "cb");
      const result = new Promise2(function(resolve, reject) {
        res2 = resolve;
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
            this._idle.slice().map((item3) => {
              this._remove(item3.client);
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
        const removed = removeWhere(this._idle, (item3) => item3.client === client);
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
        const response = promisify(this.Promise, cb);
        const result = response.result;
        if (this._isFull() || this._idle.length) {
          if (this._idle.length) {
            process.nextTick(() => this._pulseQueue());
          }
          if (!this.options.connectionTimeoutMillis) {
            this._pendingQueue.push(new PendingItem(response.callback));
            return result;
          }
          const queueCallback = /* @__PURE__ */ __name((err, res2, done) => {
            clearTimeout(tid);
            response.callback(err, res2, done);
          }, "queueCallback");
          const pendingItem = new PendingItem(queueCallback);
          const tid = setTimeout(() => {
            removeWhere(this._pendingQueue, (i) => i.callback === queueCallback);
            pendingItem.timedOut = true;
            response.callback(new Error("timeout exceeded when trying to connect"));
          }, this.options.connectionTimeoutMillis);
          if (tid.unref) {
            tid.unref();
          }
          this._pendingQueue.push(pendingItem);
          return result;
        }
        this.newClient(new PendingItem(response.callback));
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
      query(text, values, cb) {
        if (typeof text === "function") {
          const response2 = promisify(this.Promise, text);
          setImmediate(function() {
            return response2.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
          });
          return response2.result;
        }
        if (typeof values === "function") {
          cb = values;
          values = void 0;
        }
        const response = promisify(this.Promise, cb);
        cb = response.callback;
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
            client.query(text, values, (err2, res2) => {
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
              return cb(void 0, res2);
            });
          } catch (err2) {
            client.release(err2);
            return cb(err2);
          }
        });
        return response.result;
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
      let after = /* @__PURE__ */ __name(function(err, rows, results) {
        client.native.arrayMode = false;
        setImmediate(function() {
          self.emit("_done");
        });
        if (err) {
          return self.handleError(err);
        }
        if (self._emitRowEvents) {
          if (results.length > 1) {
            rows.forEach((rowOfRows, i) => {
              rowOfRows.forEach((row) => {
                self.emit("row", row, results[i]);
              });
            });
          } else {
            rows.forEach(function(row) {
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
        this._connect((error7) => {
          if (error7) {
            reject(error7);
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
          query.callback = (err, res2) => err ? rejectOut(err) : resolveOut(res2);
        }
      }
      if (readTimeout) {
        queryCallback = query.callback;
        readTimeoutTimer = setTimeout(() => {
          const error7 = new Error("Query read timeout");
          process.nextTick(() => {
            query.handleError(error7, this.connection);
          });
          queryCallback(error7);
          query.callback = () => {
          };
          const index = this._queryQueue.indexOf(query);
          if (index > -1) {
            this._queryQueue.splice(index, 1);
          }
          this._pulseQueryQueue();
        }, readTimeout);
        query.callback = (err, res2) => {
          clearTimeout(readTimeoutTimer);
          queryCallback(err, res2);
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

// staging-worker.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// chatbot-credentials.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var hex = /^[0-9a-f]{64}$/;
var encoder = new TextEncoder();
var decoder = new TextDecoder("utf-8", { fatal: true });
var keyFor = /* @__PURE__ */ __name(async (secret) => {
  if (!hex.test(secret || "")) throw Error("credentials_storage_unavailable");
  return crypto.subtle.importKey("raw", Uint8Array.from(secret.match(/../g), (x) => parseInt(x, 16)), "AES-GCM", false, ["encrypt", "decrypt"]);
}, "keyFor");
var path = /* @__PURE__ */ __name((revision2) => "chatbot/credential-" + revision2, "path");
function createCredentialStore(bucket, secret) {
  if (!bucket || !hex.test(secret || "")) return void 0;
  return {
    async read(revision2) {
      const obj = await bucket.get(path(revision2));
      if (!obj) return void 0;
      if (obj.size > 2e4) throw Error("credentials_storage_unavailable");
      const bytes = new Uint8Array(await obj.arrayBuffer());
      if (bytes.length < 28) throw Error("credentials_storage_unavailable");
      return decoder.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12), additionalData: encoder.encode(path(revision2)) }, await keyFor(secret), bytes.slice(12)));
    },
    async write(revision2, value) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: encoder.encode(path(revision2)) }, await keyFor(secret), encoder.encode(value)));
      const bytes = new Uint8Array(12 + cipher.length);
      bytes.set(iv);
      bytes.set(cipher, 12);
      await bucket.put(path(revision2), bytes, { httpMetadata: { contentType: "application/octet-stream" } });
    }
  };
}
__name(createCredentialStore, "createCredentialStore");

// node_modules/jose/dist/webapi/index.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/jose/dist/webapi/util/base64url.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/jose/dist/webapi/lib/buffer_utils.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var encoder2 = new TextEncoder();
var decoder2 = new TextDecoder();
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
__name(concat, "concat");

// node_modules/jose/dist/webapi/lib/base64.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function decodeBase64(encoded) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(encoded);
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
__name(decodeBase64, "decodeBase64");

// node_modules/jose/dist/webapi/util/base64url.js
function decode(input) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(typeof input === "string" ? input : decoder2.decode(input), {
      alphabet: "base64url"
    });
  }
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder2.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}
__name(decode, "decode");

// node_modules/jose/dist/webapi/util/errors.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var JOSEError = class extends Error {
  static {
    __name(this, "JOSEError");
  }
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(message2, options) {
    super(message2, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var JWTClaimValidationFailed = class extends JOSEError {
  static {
    __name(this, "JWTClaimValidationFailed");
  }
  static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JWTExpired = class extends JOSEError {
  static {
    __name(this, "JWTExpired");
  }
  static code = "ERR_JWT_EXPIRED";
  code = "ERR_JWT_EXPIRED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
var JOSEAlgNotAllowed = class extends JOSEError {
  static {
    __name(this, "JOSEAlgNotAllowed");
  }
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
};
var JOSENotSupported = class extends JOSEError {
  static {
    __name(this, "JOSENotSupported");
  }
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
};
var JWSInvalid = class extends JOSEError {
  static {
    __name(this, "JWSInvalid");
  }
  static code = "ERR_JWS_INVALID";
  code = "ERR_JWS_INVALID";
};
var JWTInvalid = class extends JOSEError {
  static {
    __name(this, "JWTInvalid");
  }
  static code = "ERR_JWT_INVALID";
  code = "ERR_JWT_INVALID";
};
var JWKSInvalid = class extends JOSEError {
  static {
    __name(this, "JWKSInvalid");
  }
  static code = "ERR_JWKS_INVALID";
  code = "ERR_JWKS_INVALID";
};
var JWKSNoMatchingKey = class extends JOSEError {
  static {
    __name(this, "JWKSNoMatchingKey");
  }
  static code = "ERR_JWKS_NO_MATCHING_KEY";
  code = "ERR_JWKS_NO_MATCHING_KEY";
  constructor(message2 = "no applicable key found in the JSON Web Key Set", options) {
    super(message2, options);
  }
};
var JWKSMultipleMatchingKeys = class extends JOSEError {
  static {
    __name(this, "JWKSMultipleMatchingKeys");
  }
  [Symbol.asyncIterator];
  static code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options) {
    super(message2, options);
  }
};
var JWKSTimeout = class extends JOSEError {
  static {
    __name(this, "JWKSTimeout");
  }
  static code = "ERR_JWKS_TIMEOUT";
  code = "ERR_JWKS_TIMEOUT";
  constructor(message2 = "request timed out", options) {
    super(message2, options);
  }
};
var JWSSignatureVerificationFailed = class extends JOSEError {
  static {
    __name(this, "JWSSignatureVerificationFailed");
  }
  static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
  }
};

// node_modules/jose/dist/webapi/lib/crypto_key.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function unusable(name, prop = "algorithm.name") {
  return new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
}
__name(unusable, "unusable");
function isAlgorithm(algorithm, name) {
  return algorithm.name === name;
}
__name(isAlgorithm, "isAlgorithm");
function getHashLength(hash2) {
  return parseInt(hash2.name.slice(4), 10);
}
__name(getHashLength, "getHashLength");
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
__name(getNamedCurve, "getNamedCurve");
function checkUsage(key2, usage) {
  if (usage && !key2.usages.includes(usage)) {
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
  }
}
__name(checkUsage, "checkUsage");
function checkSigCryptoKey(key2, alg, usage) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key2.algorithm, "HMAC"))
        throw unusable("HMAC");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key2.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key2.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key2.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key2.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key2.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "Ed25519":
    case "EdDSA": {
      if (!isAlgorithm(key2.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87": {
      if (!isAlgorithm(key2.algorithm, alg))
        throw unusable(alg);
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key2.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key2.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key2, usage);
}
__name(checkSigCryptoKey, "checkSigCryptoKey");

// node_modules/jose/dist/webapi/lib/invalid_key_input.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function message(msg, actual, ...types2) {
  types2 = types2.filter(Boolean);
  if (types2.length > 2) {
    const last = types2.pop();
    msg += `one of type ${types2.join(", ")}, or ${last}.`;
  } else if (types2.length === 2) {
    msg += `one of type ${types2[0]} or ${types2[1]}.`;
  } else {
    msg += `of type ${types2[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
__name(message, "message");
var invalid_key_input_default = /* @__PURE__ */ __name((actual, ...types2) => {
  return message("Key must be ", actual, ...types2);
}, "default");
function withAlg(alg, actual, ...types2) {
  return message(`Key for the ${alg} algorithm must be `, actual, ...types2);
}
__name(withAlg, "withAlg");

// node_modules/jose/dist/webapi/lib/is_key_like.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function isCryptoKey(key2) {
  return key2?.[Symbol.toStringTag] === "CryptoKey";
}
__name(isCryptoKey, "isCryptoKey");
function isKeyObject(key2) {
  return key2?.[Symbol.toStringTag] === "KeyObject";
}
__name(isKeyObject, "isKeyObject");
var is_key_like_default = /* @__PURE__ */ __name((key2) => {
  return isCryptoKey(key2) || isKeyObject(key2);
}, "default");

// node_modules/jose/dist/webapi/lib/is_disjoint.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var is_disjoint_default = /* @__PURE__ */ __name((...headers2) => {
  const sources = headers2.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
}, "default");

// node_modules/jose/dist/webapi/lib/is_object.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function isObjectLike(value) {
  return typeof value === "object" && value !== null;
}
__name(isObjectLike, "isObjectLike");
var is_object_default = /* @__PURE__ */ __name((input) => {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}, "default");

// node_modules/jose/dist/webapi/lib/check_key_length.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var check_key_length_default = /* @__PURE__ */ __name((alg, key2) => {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key2.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
  }
}, "default");

// node_modules/jose/dist/webapi/key/import.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/jose/dist/webapi/lib/jwk_to_key.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "AKP": {
      switch (jwk.alg) {
        case "ML-DSA-44":
        case "ML-DSA-65":
        case "ML-DSA-87":
          algorithm = { name: jwk.alg };
          keyUsages = jwk.priv ? ["sign"] : ["verify"];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
          algorithm = { name: "ECDSA", namedCurve: "P-256" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES384":
          algorithm = { name: "ECDSA", namedCurve: "P-384" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES512":
          algorithm = { name: "ECDSA", namedCurve: "P-521" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
        case "EdDSA":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
__name(subtleMapping, "subtleMapping");
var jwk_to_key_default = /* @__PURE__ */ __name(async (jwk) => {
  if (!jwk.alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  }
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const keyData = { ...jwk };
  if (keyData.kty !== "AKP") {
    delete keyData.alg;
  }
  delete keyData.use;
  return crypto.subtle.importKey("jwk", keyData, algorithm, jwk.ext ?? (jwk.d || jwk.priv ? false : true), jwk.key_ops ?? keyUsages);
}, "default");

// node_modules/jose/dist/webapi/key/import.js
async function importJWK(jwk, alg, options) {
  if (!is_object_default(jwk)) {
    throw new TypeError("JWK must be an object");
  }
  let ext;
  alg ??= jwk.alg;
  ext ??= options?.extractable ?? jwk.ext;
  switch (jwk.kty) {
    case "oct":
      if (typeof jwk.k !== "string" || !jwk.k) {
        throw new TypeError('missing "k" (Key Value) Parameter value');
      }
      return decode(jwk.k);
    case "RSA":
      if ("oth" in jwk && jwk.oth !== void 0) {
        throw new JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');
      }
      return jwk_to_key_default({ ...jwk, alg, ext });
    case "AKP": {
      if (typeof jwk.alg !== "string" || !jwk.alg) {
        throw new TypeError('missing "alg" (Algorithm) Parameter value');
      }
      if (alg !== void 0 && alg !== jwk.alg) {
        throw new TypeError("JWK alg and alg option value mismatch");
      }
      return jwk_to_key_default({ ...jwk, ext });
    }
    case "EC":
    case "OKP":
      return jwk_to_key_default({ ...jwk, alg, ext });
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
  }
}
__name(importJWK, "importJWK");

// node_modules/jose/dist/webapi/lib/validate_crit.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var validate_crit_default = /* @__PURE__ */ __name((Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) => {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}, "default");

// node_modules/jose/dist/webapi/lib/validate_algorithms.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var validate_algorithms_default = /* @__PURE__ */ __name((option, algorithms) => {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return void 0;
  }
  return new Set(algorithms);
}, "default");

// node_modules/jose/dist/webapi/lib/normalize_key.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/jose/dist/webapi/lib/is_jwk.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function isJWK(key2) {
  return is_object_default(key2) && typeof key2.kty === "string";
}
__name(isJWK, "isJWK");
function isPrivateJWK(key2) {
  return key2.kty !== "oct" && (key2.kty === "AKP" && typeof key2.priv === "string" || typeof key2.d === "string");
}
__name(isPrivateJWK, "isPrivateJWK");
function isPublicJWK(key2) {
  return key2.kty !== "oct" && typeof key2.d === "undefined" && typeof key2.priv === "undefined";
}
__name(isPublicJWK, "isPublicJWK");
function isSecretJWK(key2) {
  return key2.kty === "oct" && typeof key2.k === "string";
}
__name(isSecretJWK, "isSecretJWK");

// node_modules/jose/dist/webapi/lib/normalize_key.js
var cache;
var handleJWK = /* @__PURE__ */ __name(async (key2, jwk, alg, freeze = false) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(key2);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const cryptoKey = await jwk_to_key_default({ ...jwk, alg });
  if (freeze)
    Object.freeze(key2);
  if (!cached) {
    cache.set(key2, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "handleJWK");
var handleKeyObject = /* @__PURE__ */ __name((keyObject, alg) => {
  cache ||= /* @__PURE__ */ new WeakMap();
  let cached = cache.get(keyObject);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const isPublic = keyObject.type === "public";
  const extractable = isPublic ? true : false;
  let cryptoKey;
  if (keyObject.asymmetricKeyType === "x25519") {
    switch (alg) {
      case "ECDH-ES":
      case "ECDH-ES+A128KW":
      case "ECDH-ES+A192KW":
      case "ECDH-ES+A256KW":
        break;
      default:
        throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, isPublic ? [] : ["deriveBits"]);
  }
  if (keyObject.asymmetricKeyType === "ed25519") {
    if (alg !== "EdDSA" && alg !== "Ed25519") {
      throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
      isPublic ? "verify" : "sign"
    ]);
  }
  switch (keyObject.asymmetricKeyType) {
    case "ml-dsa-44":
    case "ml-dsa-65":
    case "ml-dsa-87": {
      if (alg !== keyObject.asymmetricKeyType.toUpperCase()) {
        throw new TypeError("given KeyObject instance cannot be used for this algorithm");
      }
      cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
        isPublic ? "verify" : "sign"
      ]);
    }
  }
  if (keyObject.asymmetricKeyType === "rsa") {
    let hash2;
    switch (alg) {
      case "RSA-OAEP":
        hash2 = "SHA-1";
        break;
      case "RS256":
      case "PS256":
      case "RSA-OAEP-256":
        hash2 = "SHA-256";
        break;
      case "RS384":
      case "PS384":
      case "RSA-OAEP-384":
        hash2 = "SHA-384";
        break;
      case "RS512":
      case "PS512":
      case "RSA-OAEP-512":
        hash2 = "SHA-512";
        break;
      default:
        throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    if (alg.startsWith("RSA-OAEP")) {
      return keyObject.toCryptoKey({
        name: "RSA-OAEP",
        hash: hash2
      }, extractable, isPublic ? ["encrypt"] : ["decrypt"]);
    }
    cryptoKey = keyObject.toCryptoKey({
      name: alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5",
      hash: hash2
    }, extractable, [isPublic ? "verify" : "sign"]);
  }
  if (keyObject.asymmetricKeyType === "ec") {
    const nist = /* @__PURE__ */ new Map([
      ["prime256v1", "P-256"],
      ["secp384r1", "P-384"],
      ["secp521r1", "P-521"]
    ]);
    const namedCurve = nist.get(keyObject.asymmetricKeyDetails?.namedCurve);
    if (!namedCurve) {
      throw new TypeError("given KeyObject instance cannot be used for this algorithm");
    }
    if (alg === "ES256" && namedCurve === "P-256") {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg === "ES384" && namedCurve === "P-384") {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg === "ES512" && namedCurve === "P-521") {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDSA",
        namedCurve
      }, extractable, [isPublic ? "verify" : "sign"]);
    }
    if (alg.startsWith("ECDH-ES")) {
      cryptoKey = keyObject.toCryptoKey({
        name: "ECDH",
        namedCurve
      }, extractable, isPublic ? [] : ["deriveBits"]);
    }
  }
  if (!cryptoKey) {
    throw new TypeError("given KeyObject instance cannot be used for this algorithm");
  }
  if (!cached) {
    cache.set(keyObject, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "handleKeyObject");
var normalize_key_default = /* @__PURE__ */ __name(async (key2, alg) => {
  if (key2 instanceof Uint8Array) {
    return key2;
  }
  if (isCryptoKey(key2)) {
    return key2;
  }
  if (isKeyObject(key2)) {
    if (key2.type === "secret") {
      return key2.export();
    }
    if ("toCryptoKey" in key2 && typeof key2.toCryptoKey === "function") {
      try {
        return handleKeyObject(key2, alg);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
      }
    }
    let jwk = key2.export({ format: "jwk" });
    return handleJWK(key2, jwk, alg);
  }
  if (isJWK(key2)) {
    if (key2.k) {
      return decode(key2.k);
    }
    return handleJWK(key2, key2, alg, true);
  }
  throw new Error("unreachable");
}, "default");

// node_modules/jose/dist/webapi/lib/check_key_type.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var tag = /* @__PURE__ */ __name((key2) => key2?.[Symbol.toStringTag], "tag");
var jwkMatchesOp = /* @__PURE__ */ __name((alg, key2, usage) => {
  if (key2.use !== void 0) {
    let expected;
    switch (usage) {
      case "sign":
      case "verify":
        expected = "sig";
        break;
      case "encrypt":
      case "decrypt":
        expected = "enc";
        break;
    }
    if (key2.use !== expected) {
      throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
    }
  }
  if (key2.alg !== void 0 && key2.alg !== alg) {
    throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
  }
  if (Array.isArray(key2.key_ops)) {
    let expectedKeyOp;
    switch (true) {
      case (usage === "sign" || usage === "verify"):
      case alg === "dir":
      case alg.includes("CBC-HS"):
        expectedKeyOp = usage;
        break;
      case alg.startsWith("PBES2"):
        expectedKeyOp = "deriveBits";
        break;
      case /^A\d{3}(?:GCM)?(?:KW)?$/.test(alg):
        if (!alg.includes("GCM") && alg.endsWith("KW")) {
          expectedKeyOp = usage === "encrypt" ? "wrapKey" : "unwrapKey";
        } else {
          expectedKeyOp = usage;
        }
        break;
      case (usage === "encrypt" && alg.startsWith("RSA")):
        expectedKeyOp = "wrapKey";
        break;
      case usage === "decrypt":
        expectedKeyOp = alg.startsWith("RSA") ? "unwrapKey" : "deriveBits";
        break;
    }
    if (expectedKeyOp && key2.key_ops?.includes?.(expectedKeyOp) === false) {
      throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
    }
  }
  return true;
}, "jwkMatchesOp");
var symmetricTypeCheck = /* @__PURE__ */ __name((alg, key2, usage) => {
  if (key2 instanceof Uint8Array)
    return;
  if (isJWK(key2)) {
    if (isSecretJWK(key2) && jwkMatchesOp(alg, key2, usage))
      return;
    throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
  }
  if (!is_key_like_default(key2)) {
    throw new TypeError(withAlg(alg, key2, "CryptoKey", "KeyObject", "JSON Web Key", "Uint8Array"));
  }
  if (key2.type !== "secret") {
    throw new TypeError(`${tag(key2)} instances for symmetric algorithms must be of type "secret"`);
  }
}, "symmetricTypeCheck");
var asymmetricTypeCheck = /* @__PURE__ */ __name((alg, key2, usage) => {
  if (isJWK(key2)) {
    switch (usage) {
      case "decrypt":
      case "sign":
        if (isPrivateJWK(key2) && jwkMatchesOp(alg, key2, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation be a private JWK`);
      case "encrypt":
      case "verify":
        if (isPublicJWK(key2) && jwkMatchesOp(alg, key2, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation be a public JWK`);
    }
  }
  if (!is_key_like_default(key2)) {
    throw new TypeError(withAlg(alg, key2, "CryptoKey", "KeyObject", "JSON Web Key"));
  }
  if (key2.type === "secret") {
    throw new TypeError(`${tag(key2)} instances for asymmetric algorithms must not be of type "secret"`);
  }
  if (key2.type === "public") {
    switch (usage) {
      case "sign":
        throw new TypeError(`${tag(key2)} instances for asymmetric algorithm signing must be of type "private"`);
      case "decrypt":
        throw new TypeError(`${tag(key2)} instances for asymmetric algorithm decryption must be of type "private"`);
      default:
        break;
    }
  }
  if (key2.type === "private") {
    switch (usage) {
      case "verify":
        throw new TypeError(`${tag(key2)} instances for asymmetric algorithm verifying must be of type "public"`);
      case "encrypt":
        throw new TypeError(`${tag(key2)} instances for asymmetric algorithm encryption must be of type "public"`);
      default:
        break;
    }
  }
}, "asymmetricTypeCheck");
var check_key_type_default = /* @__PURE__ */ __name((alg, key2, usage) => {
  const symmetric = alg.startsWith("HS") || alg === "dir" || alg.startsWith("PBES2") || /^A(?:128|192|256)(?:GCM)?(?:KW)?$/.test(alg) || /^A(?:128|192|256)CBC-HS(?:256|384|512)$/.test(alg);
  if (symmetric) {
    symmetricTypeCheck(alg, key2, usage);
  } else {
    asymmetricTypeCheck(alg, key2, usage);
  }
}, "default");

// node_modules/jose/dist/webapi/jws/compact/verify.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/jose/dist/webapi/jws/flattened/verify.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/jose/dist/webapi/lib/verify.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/jose/dist/webapi/lib/subtle_dsa.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var subtle_dsa_default = /* @__PURE__ */ __name((alg, algorithm) => {
  const hash2 = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash: hash2, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash: hash2, name: "RSA-PSS", saltLength: parseInt(alg.slice(-3), 10) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash: hash2, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash: hash2, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
    case "EdDSA":
      return { name: "Ed25519" };
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      return { name: alg };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}, "default");

// node_modules/jose/dist/webapi/lib/get_sign_verify_key.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var get_sign_verify_key_default = /* @__PURE__ */ __name(async (alg, key2, usage) => {
  if (key2 instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalid_key_input_default(key2, "CryptoKey", "KeyObject", "JSON Web Key"));
    }
    return crypto.subtle.importKey("raw", key2, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  checkSigCryptoKey(key2, alg, usage);
  return key2;
}, "default");

// node_modules/jose/dist/webapi/lib/verify.js
var verify_default = /* @__PURE__ */ __name(async (alg, key2, signature, data2) => {
  const cryptoKey = await get_sign_verify_key_default(alg, key2, "verify");
  check_key_length_default(alg, cryptoKey);
  const algorithm = subtle_dsa_default(alg, cryptoKey.algorithm);
  try {
    return await crypto.subtle.verify(algorithm, cryptoKey, signature, data2);
  } catch {
    return false;
  }
}, "default");

// node_modules/jose/dist/webapi/jws/flattened/verify.js
async function flattenedVerify(jws, key2, options) {
  if (!is_object_default(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !is_object_default(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder2.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!is_disjoint_default(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validate_crit_default(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validate_algorithms_default("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key2 === "function") {
    key2 = await key2(parsedProt, jws);
    resolvedKey = true;
  }
  check_key_type_default(alg, key2, "verify");
  const data2 = concat(encoder2.encode(jws.protected ?? ""), encoder2.encode("."), typeof jws.payload === "string" ? encoder2.encode(jws.payload) : jws.payload);
  let signature;
  try {
    signature = decode(jws.signature);
  } catch {
    throw new JWSInvalid("Failed to base64url decode the signature");
  }
  const k = await normalize_key_default(key2, alg);
  const verified = await verify_default(alg, k, signature, data2);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    try {
      payload = decode(jws.payload);
    } catch {
      throw new JWSInvalid("Failed to base64url decode the payload");
    }
  } else if (typeof jws.payload === "string") {
    payload = encoder2.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key: k };
  }
  return result;
}
__name(flattenedVerify, "flattenedVerify");

// node_modules/jose/dist/webapi/jws/compact/verify.js
async function compactVerify(jws, key2, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder2.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key2, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key2 === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(compactVerify, "compactVerify");

// node_modules/jose/dist/webapi/jwt/verify.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/jose/dist/webapi/lib/jwt_claims_set.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// node_modules/jose/dist/webapi/lib/epoch.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var epoch_default = /* @__PURE__ */ __name((date4) => Math.floor(date4.getTime() / 1e3), "default");

// node_modules/jose/dist/webapi/lib/secs.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var week = day * 7;
var year = day * 365.25;
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
var secs_default = /* @__PURE__ */ __name((str) => {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
}, "default");

// node_modules/jose/dist/webapi/lib/jwt_claims_set.js
var normalizeTyp = /* @__PURE__ */ __name((value) => {
  if (value.includes("/")) {
    return value.toLowerCase();
  }
  return `application/${value.toLowerCase()}`;
}, "normalizeTyp");
var checkAudiencePresence = /* @__PURE__ */ __name((audPayload, audOption) => {
  if (typeof audPayload === "string") {
    return audOption.includes(audPayload);
  }
  if (Array.isArray(audPayload)) {
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
  }
  return false;
}, "checkAudiencePresence");
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(decoder2.decode(encodedPayload));
  } catch {
  }
  if (!is_object_default(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== void 0)
    presenceCheck.push("iat");
  if (audience !== void 0)
    presenceCheck.push("aud");
  if (subject !== void 0)
    presenceCheck.push("sub");
  if (issuer !== void 0)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs_default(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch_default(currentDate || /* @__PURE__ */ new Date());
  if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs_default(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
}
__name(validateClaimsSet, "validateClaimsSet");

// node_modules/jose/dist/webapi/jwt/verify.js
async function jwtVerify(jwt, key2, options) {
  const verified = await compactVerify(jwt, key2, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key2 === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(jwtVerify, "jwtVerify");

// node_modules/jose/dist/webapi/jwks/local.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function getKtyFromAlg(alg) {
  switch (typeof alg === "string" && alg.slice(0, 2)) {
    case "RS":
    case "PS":
      return "RSA";
    case "ES":
      return "EC";
    case "Ed":
      return "OKP";
    case "ML":
      return "AKP";
    default:
      throw new JOSENotSupported('Unsupported "alg" value for a JSON Web Key Set');
  }
}
__name(getKtyFromAlg, "getKtyFromAlg");
function isJWKSLike(jwks) {
  return jwks && typeof jwks === "object" && Array.isArray(jwks.keys) && jwks.keys.every(isJWKLike);
}
__name(isJWKSLike, "isJWKSLike");
function isJWKLike(key2) {
  return is_object_default(key2);
}
__name(isJWKLike, "isJWKLike");
var LocalJWKSet = class {
  static {
    __name(this, "LocalJWKSet");
  }
  #jwks;
  #cached = /* @__PURE__ */ new WeakMap();
  constructor(jwks) {
    if (!isJWKSLike(jwks)) {
      throw new JWKSInvalid("JSON Web Key Set malformed");
    }
    this.#jwks = structuredClone(jwks);
  }
  jwks() {
    return this.#jwks;
  }
  async getKey(protectedHeader, token) {
    const { alg, kid } = { ...protectedHeader, ...token?.header };
    const kty = getKtyFromAlg(alg);
    const candidates = this.#jwks.keys.filter((jwk2) => {
      let candidate = kty === jwk2.kty;
      if (candidate && typeof kid === "string") {
        candidate = kid === jwk2.kid;
      }
      if (candidate && (typeof jwk2.alg === "string" || kty === "AKP")) {
        candidate = alg === jwk2.alg;
      }
      if (candidate && typeof jwk2.use === "string") {
        candidate = jwk2.use === "sig";
      }
      if (candidate && Array.isArray(jwk2.key_ops)) {
        candidate = jwk2.key_ops.includes("verify");
      }
      if (candidate) {
        switch (alg) {
          case "ES256":
            candidate = jwk2.crv === "P-256";
            break;
          case "ES384":
            candidate = jwk2.crv === "P-384";
            break;
          case "ES512":
            candidate = jwk2.crv === "P-521";
            break;
          case "Ed25519":
          case "EdDSA":
            candidate = jwk2.crv === "Ed25519";
            break;
        }
      }
      return candidate;
    });
    const { 0: jwk, length } = candidates;
    if (length === 0) {
      throw new JWKSNoMatchingKey();
    }
    if (length !== 1) {
      const error7 = new JWKSMultipleMatchingKeys();
      const _cached = this.#cached;
      error7[Symbol.asyncIterator] = async function* () {
        for (const jwk2 of candidates) {
          try {
            yield await importWithAlgCache(_cached, jwk2, alg);
          } catch {
          }
        }
      };
      throw error7;
    }
    return importWithAlgCache(this.#cached, jwk, alg);
  }
};
async function importWithAlgCache(cache2, jwk, alg) {
  const cached = cache2.get(jwk) || cache2.set(jwk, {}).get(jwk);
  if (cached[alg] === void 0) {
    const key2 = await importJWK({ ...jwk, ext: true }, alg);
    if (key2 instanceof Uint8Array || key2.type !== "public") {
      throw new JWKSInvalid("JSON Web Key Set members must be public keys");
    }
    cached[alg] = key2;
  }
  return cached[alg];
}
__name(importWithAlgCache, "importWithAlgCache");
function createLocalJWKSet(jwks) {
  const set = new LocalJWKSet(jwks);
  const localJWKSet = /* @__PURE__ */ __name(async (protectedHeader, token) => set.getKey(protectedHeader, token), "localJWKSet");
  Object.defineProperties(localJWKSet, {
    jwks: {
      value: /* @__PURE__ */ __name(() => structuredClone(set.jwks()), "value"),
      enumerable: false,
      configurable: false,
      writable: false
    }
  });
  return localJWKSet;
}
__name(createLocalJWKSet, "createLocalJWKSet");

// node_modules/jose/dist/webapi/jwks/remote.js
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function isCloudflareWorkers() {
  return typeof WebSocketPair !== "undefined" || typeof navigator !== "undefined" && true || typeof EdgeRuntime !== "undefined" && EdgeRuntime === "vercel";
}
__name(isCloudflareWorkers, "isCloudflareWorkers");
var USER_AGENT;
if (typeof navigator === "undefined" || !"Cloudflare-Workers"?.startsWith?.("Mozilla/5.0 ")) {
  const NAME = "jose";
  const VERSION = "v6.1.0";
  USER_AGENT = `${NAME}/${VERSION}`;
}
var customFetch = Symbol();
async function fetchJwks(url, headers2, signal, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    method: "GET",
    signal,
    redirect: "manual",
    headers: headers2
  }).catch((err) => {
    if (err.name === "TimeoutError") {
      throw new JWKSTimeout();
    }
    throw err;
  });
  if (response.status !== 200) {
    throw new JOSEError("Expected 200 OK from the JSON Web Key Set HTTP response");
  }
  try {
    return await response.json();
  } catch {
    throw new JOSEError("Failed to parse the JSON Web Key Set HTTP response as JSON");
  }
}
__name(fetchJwks, "fetchJwks");
var jwksCache = Symbol();
function isFreshJwksCache(input, cacheMaxAge) {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  if (!("uat" in input) || typeof input.uat !== "number" || Date.now() - input.uat >= cacheMaxAge) {
    return false;
  }
  if (!("jwks" in input) || !is_object_default(input.jwks) || !Array.isArray(input.jwks.keys) || !Array.prototype.every.call(input.jwks.keys, is_object_default)) {
    return false;
  }
  return true;
}
__name(isFreshJwksCache, "isFreshJwksCache");
var RemoteJWKSet = class {
  static {
    __name(this, "RemoteJWKSet");
  }
  #url;
  #timeoutDuration;
  #cooldownDuration;
  #cacheMaxAge;
  #jwksTimestamp;
  #pendingFetch;
  #headers;
  #customFetch;
  #local;
  #cache;
  constructor(url, options) {
    if (!(url instanceof URL)) {
      throw new TypeError("url must be an instance of URL");
    }
    this.#url = new URL(url.href);
    this.#timeoutDuration = typeof options?.timeoutDuration === "number" ? options?.timeoutDuration : 5e3;
    this.#cooldownDuration = typeof options?.cooldownDuration === "number" ? options?.cooldownDuration : 3e4;
    this.#cacheMaxAge = typeof options?.cacheMaxAge === "number" ? options?.cacheMaxAge : 6e5;
    this.#headers = new Headers(options?.headers);
    if (USER_AGENT && !this.#headers.has("User-Agent")) {
      this.#headers.set("User-Agent", USER_AGENT);
    }
    if (!this.#headers.has("accept")) {
      this.#headers.set("accept", "application/json");
      this.#headers.append("accept", "application/jwk-set+json");
    }
    this.#customFetch = options?.[customFetch];
    if (options?.[jwksCache] !== void 0) {
      this.#cache = options?.[jwksCache];
      if (isFreshJwksCache(options?.[jwksCache], this.#cacheMaxAge)) {
        this.#jwksTimestamp = this.#cache.uat;
        this.#local = createLocalJWKSet(this.#cache.jwks);
      }
    }
  }
  pendingFetch() {
    return !!this.#pendingFetch;
  }
  coolingDown() {
    return typeof this.#jwksTimestamp === "number" ? Date.now() < this.#jwksTimestamp + this.#cooldownDuration : false;
  }
  fresh() {
    return typeof this.#jwksTimestamp === "number" ? Date.now() < this.#jwksTimestamp + this.#cacheMaxAge : false;
  }
  jwks() {
    return this.#local?.jwks();
  }
  async getKey(protectedHeader, token) {
    if (!this.#local || !this.fresh()) {
      await this.reload();
    }
    try {
      return await this.#local(protectedHeader, token);
    } catch (err) {
      if (err instanceof JWKSNoMatchingKey) {
        if (this.coolingDown() === false) {
          await this.reload();
          return this.#local(protectedHeader, token);
        }
      }
      throw err;
    }
  }
  async reload() {
    if (this.#pendingFetch && isCloudflareWorkers()) {
      this.#pendingFetch = void 0;
    }
    this.#pendingFetch ||= fetchJwks(this.#url.href, this.#headers, AbortSignal.timeout(this.#timeoutDuration), this.#customFetch).then((json2) => {
      this.#local = createLocalJWKSet(json2);
      if (this.#cache) {
        this.#cache.uat = Date.now();
        this.#cache.jwks = json2;
      }
      this.#jwksTimestamp = Date.now();
      this.#pendingFetch = void 0;
    }).catch((err) => {
      this.#pendingFetch = void 0;
      throw err;
    });
    await this.#pendingFetch;
  }
};
function createRemoteJWKSet(url, options) {
  const set = new RemoteJWKSet(url, options);
  const remoteJWKSet = /* @__PURE__ */ __name(async (protectedHeader, token) => set.getKey(protectedHeader, token), "remoteJWKSet");
  Object.defineProperties(remoteJWKSet, {
    coolingDown: {
      get: /* @__PURE__ */ __name(() => set.coolingDown(), "get"),
      enumerable: true,
      configurable: false
    },
    fresh: {
      get: /* @__PURE__ */ __name(() => set.fresh(), "get"),
      enumerable: true,
      configurable: false
    },
    reload: {
      value: /* @__PURE__ */ __name(() => set.reload(), "value"),
      enumerable: true,
      configurable: false,
      writable: false
    },
    reloading: {
      get: /* @__PURE__ */ __name(() => set.pendingFetch(), "get"),
      enumerable: true,
      configurable: false
    },
    jwks: {
      value: /* @__PURE__ */ __name(() => set.jwks(), "value"),
      enumerable: true,
      configurable: false,
      writable: false
    }
  });
  return remoteJWKSet;
}
__name(createRemoteJWKSet, "createRemoteJWKSet");

// verify-jwt.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
async function verifyManagedNeonJwt(token, jwks, issuer) {
  const { payload } = await jwtVerify(token, jwks, {
    issuer,
    algorithms: ["EdDSA", "ES256", "RS256"],
    maxTokenAge: "15 minutes"
  });
  if (typeof payload.exp !== "number" || typeof payload.iat !== "number") {
    throw new Error("Missing JWT lifetime");
  }
  if (typeof payload.sub !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(payload.sub)) {
    throw new Error("Invalid Managed Auth subject");
  }
  return payload.sub;
}
__name(verifyManagedNeonJwt, "verifyManagedNeonJwt");

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

// handler.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// catalogue-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// media-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// media-sku-sync.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var IMG = /\.(png|jpe?g|webp)$/i;
var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var INBOX_PREFIX = "private/catalogue/";
var MAX_SCAN = 1e3;
function detectSkuFromName(key2, companySkus) {
  if (typeof key2 !== "string" || !key2.startsWith(INBOX_PREFIX) || key2.length > 500)
    return { status: "invalid" };
  const filename = key2.slice(key2.lastIndexOf("/") + 1);
  if (key2 !== INBOX_PREFIX + filename) return { status: "nested_path" };
  if (!filename || !IMG.test(filename) || filename.includes("%") || filename.includes("\\"))
    return { status: "invalid" };
  const stem = filename.replace(IMG, "");
  if (UUID.test(stem)) return { status: "generated" };
  const options = [];
  if (companySkus.has(stem)) options.push(stem);
  const numbered = /^(.*)-([0-9]{2})$/.exec(stem);
  if (numbered && Number(numbered[2]) >= 1 && companySkus.has(numbered[1]))
    options.push(numbered[1]);
  if (options.length > 1) return { status: "ambiguous" };
  if (options.length === 0) return { status: "unmatched" };
  if (!/\.webp$/i.test(filename)) return { status: "needs_webp", sku: options[0], filename };
  const position = numbered && options[0] !== stem ? Number(numbered[2]) : 1;
  const canonical = INBOX_PREFIX + encodeURIComponent(options[0]) + (position === 1 ? "" : "-" + String(position).padStart(2, "0")) + ".webp";
  if (key2 !== canonical) return { status: "invalid_filename" };
  return { status: "matched", sku: options[0], filename };
}
__name(detectSkuFromName, "detectSkuFromName");
async function findR2SkuCandidates({ db, r2 }) {
  if (typeof r2.list !== "function") throw Error("r2_list_unavailable");
  const [listed, skus] = await Promise.all([
    r2.list({ prefix: INBOX_PREFIX, limit: MAX_SCAN }),
    db((c) => c.query("SELECT sku_cong_ty FROM fbmn_catalog.skus ORDER BY sku_cong_ty LIMIT 20000"))
  ]);
  const objects = listed?.objects ?? [];
  if (!Array.isArray(objects) || objects.length > MAX_SCAN) throw Error("invalid_r2_list");
  const known = new Set(skus.rows.map((row) => row.sku_cong_ty));
  const eligible = objects.filter((item3) => typeof item3?.key === "string" && !item3.key.includes("/renditions/") && IMG.test(item3.key));
  const keys = eligible.map((item3) => item3.key);
  const registered = keys.length ? await db((c) => c.query(
    "SELECT r2_key FROM fbmn_catalog.media_assets WHERE r2_key=ANY($1::text[])",
    [keys]
  )) : { rows: [] };
  const used = new Set(registered.rows.map((row) => row.r2_key));
  const items = eligible.filter((item3) => !used.has(item3.key)).map((item3) => ({
    key: item3.key,
    bytes: item3.size ?? null,
    ...detectSkuFromName(item3.key, known)
  }));
  return { items, truncated: Boolean(listed?.truncated), scanned: objects.length };
}
__name(findR2SkuCandidates, "findR2SkuCandidates");

// media-service.mjs
var ROLES = /* @__PURE__ */ new Set(["owner", "admin", "editor"]);
var HEADERS = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
var json = /* @__PURE__ */ __name((status, data2) => Response.json(data2, { status, headers: HEADERS }), "json");
var fail = /* @__PURE__ */ __name((status, code) => json(status, { error: { code } }), "fail");
var skuOk = /* @__PURE__ */ __name((value) => typeof value === "string" && value.length > 0 && value.length <= 80 && value.trim() === value && !/[\x00-\x1f\x7f]/.test(value), "skuOk");
var uuid = /* @__PURE__ */ __name((value) => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value), "uuid");
var canonicalKey = /* @__PURE__ */ __name((sku, index) => "private/catalogue/" + encodeURIComponent(sku) + (index === 1 ? "" : "-" + String(index).padStart(2, "0")) + ".webp", "canonicalKey");
var MAX_BYTES = 5 * 1024 * 1024;
var MAX_PER_SKU = 20;
function imageSize(bytes, mime, minEdge = 32) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const string = /* @__PURE__ */ __name((i, n) => String.fromCharCode(...bytes.subarray(i, i + n)), "string");
  let width = 0, height = 0;
  if (mime === "image/png" && bytes.length >= 33 && bytes.subarray(0, 8).every((v, i) => v === [137, 80, 78, 71, 13, 10, 26, 10][i]) && string(12, 4) === "IHDR") {
    width = dv.getUint32(16);
    height = dv.getUint32(20);
    let index = 8, hasIdat = false, hasIend = false;
    while (index + 12 <= bytes.length) {
      const len = dv.getUint32(index), type = string(index + 4, 4);
      if (len > MAX_BYTES || index + 12 + len > bytes.length) break;
      if (type === "IDAT" && len > 0) hasIdat = true;
      if (type === "IEND" && len === 0) {
        hasIend = index + 12 === bytes.length;
        break;
      }
      index += 12 + len;
    }
    if (!hasIdat || !hasIend) return null;
  } else if (mime === "image/webp" && bytes.length >= 26 && string(0, 4) === "RIFF" && string(8, 4) === "WEBP") {
    if (dv.getUint32(4, true) !== bytes.length - 8) return null;
    let at = 12, canvas = null, codec = null;
    while (at + 8 <= bytes.length) {
      const tag2 = string(at, 4), length = dv.getUint32(at + 4, true);
      const start = at + 8, end = start + length, next = end + (length & 1);
      if (!length || length > MAX_BYTES || next > bytes.length) return null;
      if (tag2 === "VP8X" && length >= 10) {
        canvas = {
          width: 1 + bytes[start + 4] + (bytes[start + 5] << 8) + (bytes[start + 6] << 16),
          height: 1 + bytes[start + 7] + (bytes[start + 8] << 8) + (bytes[start + 9] << 16)
        };
      } else if (tag2 === "VP8 " && length >= 10 && bytes[start + 3] === 157 && bytes[start + 4] === 1 && bytes[start + 5] === 42) {
        codec = {
          width: dv.getUint16(start + 6, true) & 16383,
          height: dv.getUint16(start + 8, true) & 16383
        };
      } else if (tag2 === "VP8L" && length >= 6 && bytes[start] === 47) {
        codec = {
          width: 1 + ((bytes[start + 2] & 63) << 8 | bytes[start + 1]),
          height: 1 + ((bytes[start + 4] & 15) << 10 | bytes[start + 3] << 2 | (bytes[start + 2] & 192) >> 6)
        };
      }
      at = next;
    }
    if (at !== bytes.length || !codec) return null;
    if (canvas && (canvas.width !== codec.width || canvas.height !== codec.height))
      return null;
    width = codec.width;
    height = codec.height;
  } else if (mime === "image/jpeg" && bytes.length > 12 && bytes[0] === 255 && bytes[1] === 216 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 255) break;
      let marker = bytes[i + 1];
      i += 2;
      while (marker === 255 && i < bytes.length) marker = bytes[i++];
      if (marker === 218 || marker === 217) break;
      if ([1, 208, 209, 210, 211, 212, 213, 214, 215].includes(marker)) continue;
      if (i + 2 > bytes.length) break;
      const size = dv.getUint16(i);
      if (size < 2 || i + size > bytes.length) break;
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker) && size >= 7) {
        height = dv.getUint16(i + 3);
        width = dv.getUint16(i + 5);
        break;
      }
      i += size;
    }
  }
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < minEdge || height < minEdge || width > 8192 || height > 8192) return null;
  return { width, height };
}
__name(imageSize, "imageSize");
var tx = /* @__PURE__ */ __name((db, fn) => db(async (c) => {
  await c.query("BEGIN");
  try {
    const result = await fn(c);
    await c.query("COMMIT");
    return result;
  } catch (error7) {
    await c.query("ROLLBACK");
    throw error7;
  }
}), "tx");
var txR2 = /* @__PURE__ */ __name((db, r2, fn) => db(async (c) => {
  await c.query("BEGIN");
  let newKey = null, commitAttempted = false;
  const guard = {
    async lock(key2) {
      await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))", [key2]);
    },
    track(key2) {
      newKey = key2;
    }
  };
  try {
    const data2 = await fn(c, guard);
    commitAttempted = true;
    await c.query("COMMIT");
    return data2;
  } catch (error7) {
    if (newKey && !commitAttempted && typeof r2.delete === "function")
      await r2.delete(newKey).catch(() => {
      });
    await c.query("ROLLBACK").catch(() => {
    });
    throw error7;
  }
}), "txR2");
async function finishCleanup(db, r2, assetId) {
  const observed = await db((c) => c.query(
    "SELECT j.r2_key FROM fbmn_catalog.media_cleanup_jobs j WHERE j.asset_id=$1",
    [assetId]
  ));
  if (!observed.rowCount) return { file_deleted: false, pending: false };
  const key2 = observed.rows[0].r2_key;
  if (typeof r2.delete !== "function") return { file_deleted: false, pending: true };
  return db(async (c) => {
    await c.query("BEGIN");
    try {
      const lockAsset = await c.query(
        "SELECT id FROM fbmn_catalog.media_assets WHERE id=$1 FOR UPDATE",
        [assetId]
      );
      if (!lockAsset.rowCount) {
        await c.query("COMMIT");
        return { file_deleted: false, pending: false };
      }
      await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))", [key2]);
      const job = await c.query(
        "SELECT j.r2_key FROM fbmn_catalog.media_cleanup_jobs j WHERE j.asset_id=$1 AND j.r2_key=$2 AND NOT EXISTS(SELECT 1 FROM fbmn_catalog.sku_media l WHERE l.asset_id=j.asset_id)",
        [assetId, key2]
      );
      if (!job.rowCount) {
        await c.query("COMMIT");
        return { file_deleted: false, pending: false };
      }
      await r2.delete(key2);
      const gone = await c.query(
        "DELETE FROM fbmn_catalog.media_assets a WHERE a.id=$1 AND a.r2_key=$2 AND NOT EXISTS(SELECT 1 FROM fbmn_catalog.sku_media l WHERE l.asset_id=a.id) AND EXISTS(SELECT 1 FROM fbmn_catalog.media_cleanup_jobs j WHERE j.asset_id=a.id AND j.r2_key=$2) RETURNING a.id",
        [assetId, key2]
      );
      if (!gone.rowCount) throw Error("cleanup_conflict");
      await c.query("COMMIT");
      return { file_deleted: true, pending: false };
    } catch {
      await c.query("ROLLBACK").catch(() => {
      });
      return { file_deleted: false, pending: true };
    }
  });
}
__name(finishCleanup, "finishCleanup");
var audit = /* @__PURE__ */ __name((c, actor, operation, detail2) => c.query(
  "INSERT INTO fbmn_catalog.audit_events(actor_subject,sku_cong_ty,operation,after_json) VALUES($1,$2,$3,$4::jsonb)",
  [actor.subject, detail2.sku_cong_ty, operation, JSON.stringify(detail2)]
), "audit");
var getJson = /* @__PURE__ */ __name(async (request) => {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
    throw Error("invalid_body");
  if (Number(request.headers.get("content-length") || 0) > 8e3) throw Error("invalid_body");
  const raw = await request.text();
  if (raw.length > 8e3) throw Error("invalid_body");
  return JSON.parse(raw);
}, "getJson");
async function handleMedia({ request, actor, db, r2 }) {
  if (!ROLES.has(actor?.role)) return fail(403, "forbidden");
  const url = new URL(request.url), action = url.pathname.slice("/v1/admin/catalogue/media/".length);
  if (!["list", "library", "upload", "file", "link", "order", "scan", "adopt", "cleanup"].includes(action))
    return fail(404, "not_found");
  if (!db) return fail(503, "media_db_unavailable");
  if (!r2 || typeof r2.put !== "function" || typeof r2.get !== "function")
    return fail(503, "media_storage_unavailable");
  const owner = actor.role === "owner";
  if (url.search && action !== "list" && action !== "file") return fail(400, "invalid_query");
  try {
    if (action === "scan" && request.method === "GET") {
      if (!owner) return fail(403, "owner_required");
      const results = await findR2SkuCandidates({ db, r2 });
      return json(200, { data: results });
    }
    if (action === "adopt" && request.method === "POST") {
      if (!owner) return fail(403, "owner_required");
      const input = await getJson(request);
      if (input?.confirm !== "GAN_ANH_R2" || !Array.isArray(input.keys) || input.keys.length < 1 || input.keys.length > 10 || new Set(input.keys).size !== input.keys.length || input.keys.some((key2) => typeof key2 !== "string" || key2.length > 500 || !key2.startsWith(INBOX_PREFIX) || !/\.webp$/i.test(key2)))
        return fail(400, "invalid_adopt_request");
      const known = await db((c) => c.query(
        "SELECT sku_cong_ty FROM fbmn_catalog.skus ORDER BY sku_cong_ty LIMIT 20000"
      ));
      const companySkus = new Set(known.rows.map((row) => row.sku_cong_ty));
      const resolved = input.keys.map((key2) => ({ key: key2, ...detectSkuFromName(key2, companySkus) }));
      if (resolved.some((item3) => item3.status !== "matched"))
        return fail(409, "sku_filename_conflict");
      const output = await tx(db, async (c) => {
        const inserted = [];
        for (const entry of [...resolved].sort((a, b) => a.sku.localeCompare(b.sku) || a.key.localeCompare(b.key))) {
          const sku = await c.query(
            "SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE sku_cong_ty=$1 FOR UPDATE",
            [entry.sku]
          );
          if (sku.rowCount !== 1) throw Error("sku_not_found");
          await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))", [entry.key]);
          const existing = await c.query(
            "SELECT id FROM fbmn_catalog.media_assets WHERE r2_key=$1",
            [entry.key]
          );
          if (existing.rowCount) throw Error("media_already_registered");
          const item3 = await r2.get(entry.key);
          if (!item3) throw Error("r2_image_not_found");
          if (item3.size > MAX_BYTES || item3.size < 32) throw Error("media_too_large");
          const bytes = new Uint8Array(await item3.arrayBuffer());
          if (bytes.length > MAX_BYTES || !imageSize(bytes, "image/webp", 1))
            throw Error("invalid_image_bytes");
          const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
          const hash2 = Array.from(digest, (x) => x.toString(16).padStart(2, "0")).join("");
          const duplicate = await c.query(
            "SELECT a.id FROM fbmn_catalog.media_assets a JOIN fbmn_catalog.sku_media l ON l.asset_id=a.id WHERE l.sku_cong_ty=$1 AND a.file_sha256=$2 LIMIT 1",
            [entry.sku, hash2]
          );
          if (duplicate.rowCount) throw Error("duplicate_sku_image");
          const linked = await c.query(
            "SELECT count(*)::int AS amount,coalesce(max(sort_order),-1)::int AS last_position FROM fbmn_catalog.sku_media WHERE sku_cong_ty=$1",
            [entry.sku]
          );
          if (Number(linked.rows[0].amount) >= MAX_PER_SKU) throw Error("media_limit");
          const assetId = crypto.randomUUID();
          await c.query(
            "INSERT INTO fbmn_catalog.media_assets(id,source_filename,r2_key,mime_type,file_sha256) VALUES($1,$2,$3,$4,$5)",
            [assetId, entry.filename, entry.key, "image/webp", hash2]
          );
          await c.query(
            "INSERT INTO fbmn_catalog.sku_media(sku_cong_ty,asset_id,media_role,sort_order,match_method) VALUES($1,$2,$3,$4,'filename_exact')",
            [
              entry.sku,
              assetId,
              Number(linked.rows[0].amount) === 0 ? "cover" : "detail",
              Number(linked.rows[0].last_position) + 1
            ]
          );
          await audit(
            c,
            actor,
            "media_adopt_from_r2",
            { sku_cong_ty: entry.sku, asset_id: assetId, published: false }
          );
          inserted.push({ sku: entry.sku, asset_id: assetId });
        }
        return inserted;
      });
      return json(201, { data: { items: output, count: output.length, published: 0 } });
    }
    if (action === "list" && request.method === "GET") {
      const sku = url.searchParams.get("sku");
      if (url.searchParams.size !== 1 || !skuOk(sku)) return fail(400, "invalid_sku");
      const rows = await db((c) => c.query(
        "SELECT a.id::text AS id,a.source_filename,a.mime_type,a.file_sha256,l.media_role,l.sort_order,s.sku_cong_ty FROM fbmn_catalog.sku_media l JOIN fbmn_catalog.media_assets a ON a.id=l.asset_id JOIN fbmn_catalog.skus s ON s.sku_cong_ty=l.sku_cong_ty WHERE l.sku_cong_ty=$1 ORDER BY l.sort_order,a.created_at,a.id LIMIT 20",
        [sku]
      ));
      return json(200, { data: { items: rows.rows } });
    }
    if (action === "library" && request.method === "GET") {
      const rows = await db((c) => c.query(
        "SELECT a.id::text AS id,a.source_filename,a.mime_type,count(l.sku_cong_ty)::int AS linked_skus FROM fbmn_catalog.media_assets a LEFT JOIN fbmn_catalog.sku_media l ON l.asset_id=a.id WHERE a.r2_key IS NOT NULL AND NOT EXISTS(SELECT 1 FROM fbmn_catalog.media_cleanup_jobs j WHERE j.asset_id=a.id) GROUP BY a.id ORDER BY a.created_at DESC LIMIT 1000"
      ));
      return json(200, { data: { items: rows.rows } });
    }
    if (action === "file" && request.method === "GET") {
      const asset = url.searchParams.get("id");
      if (!uuid(asset) || url.searchParams.size !== 1 || url.searchParams.getAll("id").length !== 1)
        return fail(400, "invalid_asset_id");
      const row = await db((c) => c.query(
        "SELECT a.r2_key,a.mime_type FROM fbmn_catalog.media_assets a WHERE a.id=$1 AND a.r2_key IS NOT NULL AND EXISTS(SELECT 1 FROM fbmn_catalog.sku_media l WHERE l.asset_id=a.id)",
        [asset]
      ));
      if (row.rowCount !== 1) return fail(404, "media_not_found");
      const object = await r2.get(row.rows[0].r2_key);
      if (!object) return fail(404, "media_not_found");
      return new Response(object.body, { status: 200, headers: {
        ...HEADERS,
        "Content-Type": row.rows[0].mime_type,
        "Content-Disposition": "inline",
        "Cross-Origin-Resource-Policy": "same-origin"
      } });
    }
    if (action === "upload" && request.method === "POST") {
      if (!owner) return fail(403, "owner_required");
      const sku = request.headers.get("x-fbmn-sku");
      const replacing = request.headers.get("x-fbmn-asset-id");
      const mime = request.headers.get("content-type")?.split(";")[0] || "";
      if (!skuOk(sku) || mime !== "image/webp" || replacing && !uuid(replacing))
        return fail(400, "webp_only");
      if (Number(request.headers.get("content-length") || 0) > MAX_BYTES || !request.body)
        return fail(413, "media_too_large");
      const bytes = new Uint8Array(await request.arrayBuffer());
      if (bytes.length < 32 || bytes.length > MAX_BYTES) return fail(413, "media_too_large");
      const dimensions = imageSize(bytes, "image/webp", 1);
      if (!dimensions || Math.max(dimensions.width, dimensions.height) > 1600)
        return fail(422, "invalid_webp_dimensions");
      const hash2 = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
        (b) => b.toString(16).padStart(2, "0")
      ).join("");
      const saved = await txR2(db, r2, async (c, guard) => {
        const selected2 = await c.query(
          "SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE sku_cong_ty=$1 FOR UPDATE",
          [sku]
        );
        if (!selected2.rowCount) throw Error("sku_not_found");
        const current = await c.query(
          "SELECT a.id::text AS id,a.r2_key,l.sort_order,l.media_role FROM fbmn_catalog.sku_media l JOIN fbmn_catalog.media_assets a ON a.id=l.asset_id WHERE l.sku_cong_ty=$1 ORDER BY l.sort_order",
          [sku]
        );
        let entry = null, key2 = "", assetId = "", index = 1;
        if (replacing) {
          entry = current.rows.find((r) => r.id === replacing);
          if (!entry || !entry.r2_key.startsWith("private/catalogue/") || !entry.r2_key.endsWith(".webp")) throw Error("media_not_found");
          const locked = await c.query(
            "SELECT id FROM fbmn_catalog.media_assets WHERE id=$1 FOR UPDATE",
            [replacing]
          );
          if (!locked.rowCount) throw Error("media_not_found");
          const uses = await c.query(
            "SELECT count(*)::int AS amount FROM fbmn_catalog.sku_media WHERE asset_id=$1",
            [replacing]
          );
          if (Number(uses.rows[0].amount) !== 1) throw Error("shared_media_replace_forbidden");
          key2 = entry.r2_key;
          assetId = replacing;
        } else {
          if (current.rowCount >= MAX_PER_SKU) throw Error("media_limit");
          const duplicate = await c.query(
            "SELECT a.id FROM fbmn_catalog.media_assets a JOIN fbmn_catalog.sku_media l ON l.asset_id=a.id WHERE l.sku_cong_ty=$1 AND a.file_sha256=$2 LIMIT 1",
            [sku, hash2]
          );
          if (duplicate.rowCount) throw Error("duplicate_sku_image");
          const names = new Set(current.rows.map((r) => r.r2_key));
          while (names.has(canonicalKey(sku, index)) && index <= MAX_PER_SKU) index++;
          if (index > MAX_PER_SKU) throw Error("media_limit");
          key2 = canonicalKey(sku, index);
          assetId = crypto.randomUUID();
        }
        await guard.lock(key2);
        if (!replacing) {
          const claimed = await c.query(
            "SELECT id FROM fbmn_catalog.media_assets WHERE r2_key=$1 LIMIT 1",
            [key2]
          );
          if (claimed.rowCount || typeof r2.head === "function" && await r2.head(key2))
            throw Error("r2_file_exists_use_scan");
        }
        await r2.put(key2, bytes, { httpMetadata: { contentType: "image/webp" }, customMetadata: { sha256: hash2 } });
        if (!replacing) guard.track(key2);
        if (replacing) {
          await c.query(
            "UPDATE fbmn_catalog.media_assets SET mime_type='image/webp',source_filename=$2,file_sha256=$3 WHERE id=$1",
            [assetId, key2.slice(key2.lastIndexOf("/") + 1), hash2]
          );
        } else {
          await c.query(
            "INSERT INTO fbmn_catalog.media_assets(id,source_filename,r2_key,mime_type,file_sha256) VALUES($1,$2,$3,'image/webp',$4)",
            [assetId, key2.slice(key2.lastIndexOf("/") + 1), key2, hash2]
          );
          const position = Math.max(-1, ...current.rows.map((r) => Number(r.sort_order))) + 1;
          await c.query(
            "INSERT INTO fbmn_catalog.sku_media(sku_cong_ty,asset_id,media_role,sort_order,match_method) VALUES($1,$2,$3,$4,'manual')",
            [sku, assetId, current.rowCount === 0 ? "cover" : "detail", position]
          );
        }
        await audit(
          c,
          actor,
          replacing ? "media_replace_webp" : "media_upload_webp",
          { sku_cong_ty: sku, asset_id: assetId, published: false }
        );
        return {
          id: assetId,
          source_filename: key2.slice(key2.lastIndexOf("/") + 1),
          mime_type: "image/webp",
          media_role: replacing ? entry.media_role : current.rowCount === 0 ? "cover" : "detail",
          replaced: Boolean(replacing),
          ...dimensions
        };
      });
      return json(replacing ? 200 : 201, { data: saved });
    }
    if (action === "link" && request.method === "POST") {
      if (!owner) return fail(403, "owner_required");
      const data2 = await getJson(request);
      if (!skuOk(data2?.sku_cong_ty) || !uuid(data2?.asset_id))
        return fail(400, "invalid_media_request");
      const linked = await tx(db, async (c) => {
        const sku = await c.query(
          "SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE sku_cong_ty=$1 FOR UPDATE",
          [data2.sku_cong_ty]
        );
        if (!sku.rowCount) throw Error("sku_not_found");
        const asset = await c.query(
          "SELECT id FROM fbmn_catalog.media_assets WHERE id=$1 AND r2_key IS NOT NULL FOR UPDATE",
          [data2.asset_id]
        );
        if (!asset.rowCount) throw Error("media_not_found");
        const cleanup = await c.query(
          "SELECT asset_id FROM fbmn_catalog.media_cleanup_jobs WHERE asset_id=$1",
          [data2.asset_id]
        );
        if (cleanup.rowCount) throw Error("media_cleanup_pending");
        const links = await c.query(
          "SELECT asset_id,sort_order FROM fbmn_catalog.sku_media WHERE sku_cong_ty=$1",
          [data2.sku_cong_ty]
        );
        if (links.rowCount >= MAX_PER_SKU) throw Error("media_limit");
        if (links.rows.some((row) => String(row.asset_id).toLowerCase() === data2.asset_id.toLowerCase()))
          throw Error("media_already_linked");
        await c.query(
          "INSERT INTO fbmn_catalog.sku_media(sku_cong_ty,asset_id,media_role,sort_order,match_method) VALUES($1,$2,$3,$4,'manual')",
          [
            data2.sku_cong_ty,
            data2.asset_id,
            links.rowCount === 0 ? "cover" : "detail",
            Math.max(-1, ...links.rows.map((row) => Number(row.sort_order))) + 1
          ]
        );
        await audit(
          c,
          actor,
          "media_link",
          { sku_cong_ty: data2.sku_cong_ty, asset_id: data2.asset_id, published: false }
        );
        return { linked: true };
      });
      return json(201, { data: linked });
    }
    if (action === "cleanup" && request.method === "POST") {
      if (!owner) return fail(403, "owner_required");
      const body4 = await getJson(request);
      if (body4?.confirm !== "DON_ANH_THUA") return fail(400, "invalid_body");
      const pending = await db((c) => c.query(
        "SELECT asset_id::text AS id FROM fbmn_catalog.media_cleanup_jobs ORDER BY created_at,asset_id LIMIT 50"
      ));
      let completed = 0, remaining = 0;
      for (const item3 of pending.rows) {
        const cleaned = await finishCleanup(db, r2, item3.id);
        if (cleaned.file_deleted) completed++;
        if (cleaned.pending) remaining++;
      }
      return json(200, { data: { completed, remaining } });
    }
    if (action === "link" && request.method === "DELETE") {
      if (!owner) return fail(403, "owner_required");
      const data2 = await getJson(request);
      if (!skuOk(data2?.sku_cong_ty) || !uuid(data2?.asset_id))
        return fail(400, "invalid_media_request");
      const detached = await tx(db, async (c) => {
        const row = await c.query("SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE sku_cong_ty=$1 FOR UPDATE", [data2.sku_cong_ty]);
        if (!row.rowCount) throw Error("sku_not_found");
        const lockedAsset = await c.query(
          "SELECT id FROM fbmn_catalog.media_assets WHERE id=$1 FOR UPDATE",
          [data2.asset_id]
        );
        if (!lockedAsset.rowCount) throw Error("media_not_found");
        const deleted = await c.query(
          "DELETE FROM fbmn_catalog.sku_media WHERE sku_cong_ty=$1 AND asset_id=$2 RETURNING media_role",
          [data2.sku_cong_ty, data2.asset_id]
        );
        if (!deleted.rowCount) throw Error("media_not_found");
        if (deleted.rows[0].media_role === "cover") {
          await c.query(
            "UPDATE fbmn_catalog.sku_media SET media_role='cover' WHERE (sku_cong_ty,asset_id) IN (SELECT sku_cong_ty,asset_id FROM fbmn_catalog.sku_media WHERE sku_cong_ty=$1 ORDER BY sort_order,asset_id LIMIT 1)",
            [data2.sku_cong_ty]
          );
        }
        const unused = await c.query(
          "SELECT a.r2_key FROM fbmn_catalog.media_assets a WHERE a.id=$1 AND NOT EXISTS(SELECT 1 FROM fbmn_catalog.sku_media l WHERE l.asset_id=a.id) FOR UPDATE",
          [data2.asset_id]
        );
        if (unused.rowCount) {
          await c.query(
            "INSERT INTO fbmn_catalog.media_cleanup_jobs(asset_id,r2_key,sku_cong_ty) VALUES($1,$2,$3) ON CONFLICT(asset_id) DO NOTHING",
            [data2.asset_id, unused.rows[0].r2_key, data2.sku_cong_ty]
          );
        }
        await audit(
          c,
          actor,
          "media_unlink",
          { sku_cong_ty: data2.sku_cong_ty, asset_id: data2.asset_id, published: false }
        );
        return { orphan: unused.rowCount === 1 };
      });
      const cleaned = detached.orphan ? await finishCleanup(db, r2, data2.asset_id) : { file_deleted: false, pending: false };
      return json(200, { data: { unlinked: true, ...cleaned } });
    }
    if (action === "order" && request.method === "PATCH") {
      if (!owner) return fail(403, "owner_required");
      const data2 = await getJson(request);
      if (!skuOk(data2?.sku_cong_ty) || !Array.isArray(data2?.asset_ids) || !data2.asset_ids.length || data2.asset_ids.length > MAX_PER_SKU || data2.asset_ids.some((id) => !uuid(id)) || new Set(data2.asset_ids).size !== data2.asset_ids.length || !data2.asset_ids.includes(data2.cover_id)) return fail(400, "invalid_media_order");
      const result = await tx(db, async (c) => {
        const sku = await c.query("SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE sku_cong_ty=$1 FOR UPDATE", [data2.sku_cong_ty]);
        if (!sku.rowCount) throw Error("sku_not_found");
        const current = await c.query(
          "SELECT asset_id::text AS id FROM fbmn_catalog.sku_media WHERE sku_cong_ty=$1 FOR UPDATE",
          [data2.sku_cong_ty]
        );
        const set = new Set(current.rows.map((row) => row.id));
        if (set.size !== data2.asset_ids.length || data2.asset_ids.some((id) => !set.has(id))) throw Error("media_conflict");
        await c.query("UPDATE fbmn_catalog.sku_media SET media_role='detail' WHERE sku_cong_ty=$1", [data2.sku_cong_ty]);
        for (let i = 0; i < data2.asset_ids.length; i++) {
          await c.query(
            "UPDATE fbmn_catalog.sku_media SET sort_order=$3 WHERE sku_cong_ty=$1 AND asset_id=$2",
            [data2.sku_cong_ty, data2.asset_ids[i], i]
          );
        }
        await c.query("UPDATE fbmn_catalog.sku_media SET media_role='cover' WHERE sku_cong_ty=$1 AND asset_id=$2", [data2.sku_cong_ty, data2.cover_id]);
        await audit(
          c,
          actor,
          "media_reorder",
          { sku_cong_ty: data2.sku_cong_ty, cover_id: data2.cover_id, count: data2.asset_ids.length, published: false }
        );
        return { ordered: data2.asset_ids.length };
      });
      return json(200, { data: result });
    }
    return fail(405, "method_not_allowed");
  } catch (error7) {
    if (["sku_not_found", "media_not_found", "r2_image_not_found"].includes(error7?.message)) return fail(404, error7.message);
    if (error7?.message === "media_limit") return fail(409, "media_limit");
    if (error7?.message === "media_too_large") return fail(413, "media_too_large");
    if (error7?.message === "invalid_image_bytes") return fail(422, "invalid_image_bytes");
    if (["media_conflict", "media_already_linked", "media_already_registered", "duplicate_sku_image", "media_cleanup_pending", "r2_file_exists_use_scan", "shared_media_replace_forbidden", "webp_only"].includes(error7?.message)) return fail(409, error7.message);
    if (error7?.message === "invalid_body") return fail(400, "invalid_body");
    return fail(503, "media_unavailable");
  }
}
__name(handleMedia, "handleMedia");

// catalogue-service.mjs
var roles = /* @__PURE__ */ new Set(["owner", "admin", "editor"]);
var reply = /* @__PURE__ */ __name((status, data2) => new Response(JSON.stringify(data2), { status, headers: {
  "Content-Type": "application/json",
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff"
} }), "reply");
var fail2 = /* @__PURE__ */ __name((code, status = 400) => reply(status, { error: { code } }), "fail");
var validSku = /* @__PURE__ */ __name((x) => typeof x === "string" && x.length > 0 && x.length <= 80 && x.trim() === x && !/[^\P{Cc}]/u.test(x), "validSku");
var validText = /* @__PURE__ */ __name((x, max = 500) => x === void 0 || x === null || typeof x === "string" && x.length <= max && !Array.from(x).some((char) => char.charCodeAt(0) < 32 && ![9, 10, 13].includes(char.charCodeAt(0))), "validText");
var validTaxonomyCode = /* @__PURE__ */ __name((x) => typeof x === "string" && /^[A-Z0-9][A-Z0-9_-]{1,31}$/.test(x), "validTaxonomyCode");
var uuid2 = /* @__PURE__ */ __name((x) => typeof x === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x), "uuid");
var SPEC_FIELDS = /* @__PURE__ */ new Set(["pages", "ruling", "gsm", "cover_type", "unit", "packaging", "units_per_pack", "short_description", "long_description"]);
function safeProductSpec(spec) {
  if (spec === void 0) return {};
  if (!spec || typeof spec !== "object" || Array.isArray(spec)) throw Error("invalid_product_spec");
  const out = {};
  for (const [key2, value] of Object.entries(spec)) {
    if (!SPEC_FIELDS.has(key2) || !(value === null || typeof value === "string" && validText(value, key2 === "long_description" ? 6e3 : key2 === "short_description" ? 600 : ["pages", "ruling"].includes(key2) ? 1200 : 160)))
      throw Error("invalid_product_spec");
    if (value !== null && key2 === "gsm" && value !== "" && !/^\d{1,4}(?:\.\d{1,2})?$/.test(value))
      throw Error("invalid_product_spec");
    if (value !== null && key2 === "units_per_pack" && value !== "" && !/^[1-9]\d{0,4}$/.test(value))
      throw Error("invalid_product_spec");
    out[key2] = value === "" ? null : value;
  }
  return out;
}
__name(safeProductSpec, "safeProductSpec");
var validCategory = /* @__PURE__ */ __name((value) => value === void 0 || value === null || uuid2(value), "validCategory");
var needsReview = /* @__PURE__ */ new Set([
  "negative_stock",
  "stock_snapshot_missing",
  "packaging_promotion_review",
  "similar_sku_review",
  "regional_channel_review",
  "shared_media_review",
  "source_spec_conflict",
  "suspected_company_code",
  "merged_pdf_price_cell_verify"
]);
function safeDraft(row) {
  if (!row || typeof row !== "object" || !validSku(row.sku_cong_ty)) throw Error("invalid_sku");
  for (const name of ["ten_san_pham", "ten_goc_xnt", "barcode", "paper_size", "pages", "ruling"])
    if (!validText(row[name], 1200)) throw Error("invalid_field");
  if (!(row.ten_san_pham?.trim() || row.ten_goc_xnt?.trim())) throw Error("missing_name");
  if (!validCategory(row.category_id)) throw Error("invalid_category");
  if (!validCategory(row.family_id)) throw Error("invalid_family");
  const product_spec = safeProductSpec(row.product_spec);
  if (row.warnings !== void 0 && (!Array.isArray(row.warnings) || row.warnings.length > 30 || row.warnings.some((x) => !validText(x, 80))))
    throw Error("invalid_warning_codes");
  return {
    sku_cong_ty: row.sku_cong_ty,
    ten_san_pham: row.ten_san_pham || null,
    ten_goc_xnt: row.ten_goc_xnt || null,
    barcode: row.barcode || null,
    paper_size: row.paper_size || null,
    pages: row.pages || null,
    ruling: row.ruling || null,
    category_id: row.category_id ?? null,
    family_id: row.family_id ?? null,
    product_spec,
    warnings: row.warnings || [],
    review_status: (row.warnings || []).some((x) => needsReview.has(x)) ? "needs_review" : "draft"
  };
}
__name(safeDraft, "safeDraft");
var rowsSql = "SELECT s.sku_cong_ty,s.ten_goc_xnt,s.ten_goc_bang_gia,s.ten_san_pham,s.barcode,s.paper_size,s.product_spec,s.review_status,s.revision,s.family_id,f.family_label,f.family_code,s.category_id,c.category_label,c.category_code, (SELECT count(*)::int FROM fbmn_catalog.sku_media m WHERE m.sku_cong_ty=s.sku_cong_ty) AS media_count, photo.cover_asset_id,photo.cover_sha256 FROM fbmn_catalog.skus s LEFT JOIN fbmn_catalog.families f ON f.id=s.family_id LEFT JOIN fbmn_catalog.categories c ON c.id=s.category_id LEFT JOIN LATERAL (SELECT a.id::text AS cover_asset_id,a.file_sha256 AS cover_sha256 FROM fbmn_catalog.sku_media m JOIN fbmn_catalog.media_assets a ON a.id=m.asset_id WHERE m.sku_cong_ty=s.sku_cong_ty ORDER BY CASE WHEN m.media_role='cover' THEN 0 ELSE 1 END,m.sort_order,a.id LIMIT 1) photo ON TRUE ORDER BY s.sku_cong_ty LIMIT 20000";
async function transactional(db, work) {
  return db(async (c) => {
    await c.query("BEGIN");
    try {
      const data2 = await work(c);
      await c.query("COMMIT");
      return data2;
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    }
  });
}
__name(transactional, "transactional");
var audit2 = /* @__PURE__ */ __name((c, subject, action, data2) => c.query(
  "INSERT INTO fbmn_catalog.audit_events(actor_subject,operation,after_json) VALUES($1,$2,$3::jsonb)",
  [subject, action, JSON.stringify(data2)]
), "audit");
async function parsed(request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw Error("invalid_type");
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 65e4) throw Error("too_large");
  const body4 = await request.text();
  if (body4.length > 65e4) throw Error("too_large");
  return JSON.parse(body4);
}
__name(parsed, "parsed");
async function handleCatalogue({ request, actor, db, r2 }) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/v1/admin/catalogue/media/"))
    return handleMedia({ request, actor, db, r2 });
  const route = url.pathname.slice("/v1/admin/catalogue/".length);
  if (!["snapshot", "skus", "families", "categories", "apply", "sync", "group", "visibility", "visibility-bulk", "membership"].includes(route))
    return fail2("not_found", 404);
  if (!roles.has(actor?.role)) return fail2("forbidden", 403);
  if (url.search) return fail2("invalid_query");
  if (!db) return fail2("catalogue_db_unavailable", 503);
  if (!["GET", "POST", "PATCH"].includes(request.method)) return fail2("method_not_allowed", 405);
  if (["apply", "sync", "group", "membership"].includes(route) && actor.role !== "owner")
    return fail2("owner_required", 403);
  if (request.method === "GET") {
    if (!["snapshot", "skus", "families", "categories", "visibility"].includes(route)) return fail2("method_not_allowed", 405);
    try {
      const sql = route === "visibility" ? "SELECT sku_cong_ty,channel_code,state,revision FROM fbmn_catalog.publications ORDER BY sku_cong_ty,channel_code LIMIT 30000" : route === "families" ? "SELECT id::text AS id,family_code,family_label,revision FROM fbmn_catalog.families ORDER BY family_code LIMIT 3000" : route === "categories" ? "SELECT id::text AS id,parent_id::text AS parent_id,category_code,category_label FROM fbmn_catalog.categories ORDER BY category_code LIMIT 1000" : rowsSql;
      const result = await db((c) => c.query(sql));
      return reply(200, { data: { items: result.rows, database_queried: true } });
    } catch {
      return fail2("catalogue_db_unavailable", 503);
    }
  }
  let input;
  try {
    input = await parsed(request);
  } catch {
    return fail2("invalid_body");
  }
  try {
    if (route === "visibility-bulk" && request.method === "POST") {
      if (actor.role !== "owner") return fail2("owner_required", 403);
      const entries = input?.entries;
      if (!Array.isArray(entries) || entries.length < 1 || entries.length > 600 || typeof input.visible !== "boolean" || input.confirm !== "CAP_NHAT_HIEN_THI_HANG_LOAT" || entries.some((row) => !row || !validSku(row.sku_cong_ty) || !["public_web", "dealer_app", "consumer_app"].includes(row.channel_code) || !Number.isSafeInteger(row.expected_revision) || row.expected_revision < 0))
        return fail2("invalid_visibility_batch");
      const skus = [...new Set(entries.map((row) => row.sku_cong_ty))];
      const channels = [...new Set(entries.map((row) => row.channel_code))];
      const keys = entries.map((row) => row.sku_cong_ty.toUpperCase() + ":" + row.channel_code);
      if (skus.length > 200 || channels.length > 3 || new Set(keys).size !== entries.length)
        return fail2("invalid_visibility_batch");
      const saved = await transactional(db, async (c) => {
        const found = await c.query(
          "SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE sku_cong_ty=ANY($1::text[]) ORDER BY sku_cong_ty FOR UPDATE",
          [skus]
        );
        if (found.rowCount !== skus.length) throw Error("sku_not_found");
        const current = await c.query(
          "SELECT sku_cong_ty,channel_code,revision FROM fbmn_catalog.publications WHERE sku_cong_ty=ANY($1::text[]) AND channel_code=ANY($2::text[]) FOR UPDATE",
          [skus, channels]
        );
        const revisions = new Map(current.rows.map((row) => [row.sku_cong_ty + ":" + row.channel_code, row.revision]));
        if (entries.some((row) => (revisions.get(row.sku_cong_ty + ":" + row.channel_code) ?? 0) !== row.expected_revision))
          throw Error("catalogue_conflict");
        const result = await c.query(
          "INSERT INTO fbmn_catalog.publications (sku_cong_ty,channel_code,state,approved_by,approved_at,published_at,revision) SELECT x.sku_cong_ty,x.channel_code,CASE WHEN $2::boolean THEN 'published' ELSE 'hidden' END,$3,now(),CASE WHEN $2::boolean THEN now() ELSE NULL END,x.expected_revision+1 FROM jsonb_to_recordset($1::jsonb) AS x(sku_cong_ty text,channel_code text,expected_revision integer) ON CONFLICT(sku_cong_ty,channel_code) DO UPDATE SET state=EXCLUDED.state,approved_by=EXCLUDED.approved_by,approved_at=EXCLUDED.approved_at,published_at=EXCLUDED.published_at,revision=fbmn_catalog.publications.revision+1 WHERE fbmn_catalog.publications.revision=EXCLUDED.revision-1 RETURNING sku_cong_ty,channel_code,state,revision",
          [JSON.stringify(entries), input.visible, actor.subject]
        );
        if (result.rowCount !== entries.length) throw Error("catalogue_conflict");
        await audit2(c, actor.subject, "channel_visibility_bulk", {
          sku_count: skus.length,
          channels,
          visible: input.visible,
          pairs: result.rowCount,
          sku_cong_ty: skus
        });
        return result.rows;
      });
      return reply(200, { data: { items: saved, updated: saved.length, sku_count: skus.length } });
    }
    if (route === "visibility" && request.method === "POST") {
      if (actor.role !== "owner") return fail2("owner_required", 403);
      if (!validSku(input?.sku_cong_ty) || !["public_web", "dealer_app", "consumer_app"].includes(input.channel_code) || typeof input.visible !== "boolean" || !Number.isSafeInteger(input.expected_revision) || input.expected_revision < 0 || input.confirm !== "CAP_NHAT_HIEN_THI")
        return fail2("invalid_visibility");
      const result = await transactional(db, async (c) => {
        const exists = await c.query(
          "SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE sku_cong_ty=$1 FOR UPDATE",
          [input.sku_cong_ty]
        );
        if (exists.rowCount !== 1) throw Error("sku_not_found");
        const saved = input.expected_revision === 0 ? await c.query(
          "INSERT INTO fbmn_catalog.publications (sku_cong_ty,channel_code,state,approved_by,approved_at,published_at,revision) VALUES($1,$2,CASE WHEN $3 THEN 'published' ELSE 'hidden' END,$4,now(),CASE WHEN $3 THEN now() ELSE NULL END,1) ON CONFLICT(sku_cong_ty,channel_code) DO NOTHING RETURNING sku_cong_ty,channel_code,state,revision",
          [input.sku_cong_ty, input.channel_code, input.visible, actor.subject]
        ) : await c.query(
          "UPDATE fbmn_catalog.publications SET state=CASE WHEN $3 THEN 'published' ELSE 'hidden' END,approved_by=$5,approved_at=now(),published_at=CASE WHEN $3 THEN now() ELSE NULL END,revision=revision+1 WHERE sku_cong_ty=$1 AND channel_code=$2 AND revision=$4 RETURNING sku_cong_ty,channel_code,state,revision",
          [input.sku_cong_ty, input.channel_code, input.visible, input.expected_revision, actor.subject]
        );
        if (saved.rowCount !== 1) throw Error("catalogue_conflict");
        await audit2(c, actor.subject, "channel_visibility", {
          sku_cong_ty: input.sku_cong_ty,
          channel_code: input.channel_code,
          visible: input.visible
        });
        return saved.rows[0];
      });
      return reply(200, { data: result });
    }
    if (route === "apply" && request.method === "POST") {
      if (input?.confirm !== "NHAP_BAN_NHAP" || !Array.isArray(input?.rows) || !input.rows.length || input.rows.length > 1e3 || input.expectedCreate !== input.rows.length)
        return fail2("owner_confirmation_required");
      const records = input.rows.map(safeDraft);
      const keys = records.map((x) => x.sku_cong_ty.toUpperCase());
      if (new Set(keys).size !== keys.length) return fail2("duplicate_company_sku", 409);
      const count3 = await transactional(db, async (c) => {
        const existing = await c.query(
          "SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE upper(sku_cong_ty)=ANY($1::text[])",
          [keys]
        );
        if (existing.rowCount) throw Error("catalogue_conflict");
        const sql = "INSERT INTO fbmn_catalog.skus (sku_cong_ty,ten_goc_xnt,ten_san_pham,barcode,paper_size,product_spec,evidence,review_status) SELECT x.sku_cong_ty,x.ten_goc_xnt,x.ten_san_pham,x.barcode,x.paper_size, jsonb_build_object('pages',x.pages,'ruling',x.ruling), jsonb_build_object('warnings',x.warnings,'source','owner_file_approved'),x.review_status FROM jsonb_to_recordset($1::jsonb) AS x(sku_cong_ty text,ten_goc_xnt text, ten_san_pham text,barcode text,paper_size text,pages text,ruling text, warnings jsonb,review_status text) RETURNING sku_cong_ty";
        const saved = await c.query(sql, [JSON.stringify(records)]);
        if (saved.rowCount !== records.length) throw Error("catalogue_conflict");
        await audit2(c, actor.subject, "draft_import", { count: saved.rowCount, published: false });
        return saved.rowCount;
      });
      return reply(201, { data: { drafts_saved: count3, published: 0 } });
    }
    if (route === "sync" && request.method === "POST") {
      const ops = input?.operations;
      if (input?.confirm !== "SYNC_SAN_PHAM" || !Array.isArray(ops) || ops.length < 1 || ops.length > 1e3 || !Number.isSafeInteger(input.expectedCreate) || !Number.isSafeInteger(input.expectedUpdate) || input.expectedCreate < 0 || input.expectedUpdate < 0 || input.expectedCreate + input.expectedUpdate !== ops.length)
        return fail2("invalid_sync_request");
      let createRows = [], updateRows = [];
      try {
        const seen = /* @__PURE__ */ new Set();
        for (const op of ops) {
          if (!validSku(op?.sku_cong_ty) || !["create", "update"].includes(op.kind))
            throw Error("invalid_sync");
          const key2 = op.sku_cong_ty.toUpperCase();
          if (seen.has(key2)) throw Error("duplicate_company_sku");
          seen.add(key2);
          if (op.kind === "create") {
            const row = safeDraft(op);
            createRows.push(row);
          } else {
            if (!Number.isSafeInteger(op.expected_revision) || op.expected_revision < 1 || !op.changes || typeof op.changes !== "object" || Array.isArray(op.changes))
              throw Error("invalid_sync");
            const keys = Object.keys(op.changes);
            if (!keys.length || keys.some((k) => !["ten_san_pham", "barcode", "paper_size", "product_spec", "category_id", "family_id"].includes(k)))
              throw Error("invalid_sync");
            for (const key3 of ["ten_san_pham", "barcode", "paper_size"]) {
              if (!(key3 in op.changes)) continue;
              const value = op.changes[key3];
              if (key3 !== "ten_san_pham" && value === null) continue;
              if (typeof value !== "string" || !value.trim() || !validText(value, 1200))
                throw Error("invalid_sync");
            }
            if ("family_id" in op.changes && !validCategory(op.changes.family_id))
              throw Error("invalid_family");
            if ("category_id" in op.changes && !validCategory(op.changes.category_id))
              throw Error("invalid_category");
            const specs = "product_spec" in op.changes ? safeProductSpec(op.changes.product_spec) : {};
            if ("product_spec" in op.changes && !Object.keys(specs).length)
              throw Error("invalid_sync");
            updateRows.push({
              sku_cong_ty: op.sku_cong_ty,
              expected_revision: op.expected_revision,
              changes: { ...op.changes, ..."product_spec" in op.changes ? { product_spec: specs } : {} }
            });
          }
        }
      } catch {
        return fail2("invalid_sync_request");
      }
      if (createRows.length !== input.expectedCreate || updateRows.length !== input.expectedUpdate)
        return fail2("invalid_sync_request");
      const result = await transactional(db, async (c) => {
        const categoryIds = [...new Set([
          ...createRows.map((row) => row.category_id),
          ...updateRows.map((row) => row.changes.category_id)
        ].filter(Boolean))];
        const familyIds = [...new Set([
          ...createRows.map((row) => row.family_id),
          ...updateRows.map((row) => row.changes.family_id)
        ].filter(Boolean))];
        if (categoryIds.length) {
          const found = await c.query(
            "SELECT id::text FROM fbmn_catalog.categories WHERE id::text=ANY($1::text[])",
            [categoryIds]
          );
          if (found.rowCount !== categoryIds.length) throw Error("invalid_category");
        }
        if (familyIds.length) {
          const found = await c.query(
            "SELECT id::text FROM fbmn_catalog.families WHERE id::text=ANY($1::text[])",
            [familyIds]
          );
          if (found.rowCount !== familyIds.length) throw Error("invalid_family");
        }
        if (updateRows.length) {
          const saved = await c.query(
            "UPDATE fbmn_catalog.skus s SET ten_san_pham=CASE WHEN x.changes ? 'ten_san_pham' THEN x.changes->>'ten_san_pham' ELSE s.ten_san_pham END,barcode=CASE WHEN x.changes ? 'barcode' THEN x.changes->>'barcode' ELSE s.barcode END,paper_size=CASE WHEN x.changes ? 'paper_size' THEN x.changes->>'paper_size' ELSE s.paper_size END,category_id=CASE WHEN x.changes ? 'category_id' THEN (x.changes->>'category_id')::uuid ELSE s.category_id END,family_id=CASE WHEN x.changes ? 'family_id' THEN (x.changes->>'family_id')::uuid ELSE s.family_id END,product_spec=s.product_spec || COALESCE(x.changes->'product_spec','{}'::jsonb),revision=s.revision+1,updated_at=now() FROM jsonb_to_recordset($1::jsonb) AS x(sku_cong_ty text,expected_revision integer,changes jsonb) WHERE s.sku_cong_ty=x.sku_cong_ty AND s.revision=x.expected_revision AND s.review_status IN ('draft','needs_review') RETURNING s.sku_cong_ty",
            [JSON.stringify(updateRows)]
          );
          if (saved.rowCount !== updateRows.length) throw Error("catalogue_conflict");
        }
        if (createRows.length) {
          const saved = await c.query(
            "INSERT INTO fbmn_catalog.skus (sku_cong_ty,ten_san_pham,barcode,paper_size,product_spec,category_id,family_id,review_status) SELECT x.sku_cong_ty,x.ten_san_pham,x.barcode,x.paper_size,x.product_spec,x.category_id,x.family_id,'draft' FROM jsonb_to_recordset($1::jsonb) AS x(sku_cong_ty text,ten_san_pham text,barcode text,paper_size text,product_spec jsonb,category_id uuid,family_id uuid) RETURNING sku_cong_ty",
            [JSON.stringify(createRows)]
          );
          if (saved.rowCount !== createRows.length) throw Error("catalogue_conflict");
        }
        await audit2(c, actor.subject, "one_sheet_sync", {
          created: createRows.length,
          updated: updateRows.length,
          published: false
        });
        return { created: createRows.length, updated: updateRows.length, published: 0 };
      });
      return reply(201, { data: result });
    }
    if (route === "skus" && request.method === "POST") {
      const row = safeDraft(input);
      const result = await transactional(db, async (c) => {
        if (row.category_id) {
          const selected2 = await c.query("SELECT id FROM fbmn_catalog.categories WHERE id=$1", [row.category_id]);
          if (!selected2.rowCount) throw Error("invalid_category");
        }
        const saved = await c.query(
          "INSERT INTO fbmn_catalog.skus(sku_cong_ty,ten_goc_xnt,ten_san_pham,barcode,paper_size,review_status,category_id,product_spec) VALUES($1,$2,$3,$4,$5,'draft',$6,$7::jsonb) RETURNING sku_cong_ty",
          [row.sku_cong_ty, row.ten_goc_xnt, row.ten_san_pham, row.barcode, row.paper_size, row.category_id, JSON.stringify(row.product_spec)]
        );
        await audit2(c, actor.subject, "draft_create", { sku_cong_ty: row.sku_cong_ty });
        return saved.rows[0];
      });
      return reply(201, { data: result });
    }
    if (route === "skus" && request.method === "PATCH") {
      if (!validSku(input?.sku_cong_ty) || !Number.isSafeInteger(input?.expected_revision) || input.expected_revision < 1 || typeof input?.ten_san_pham !== "string" || !validText(input?.ten_san_pham, 1200) || !["draft", "needs_review", "withdrawn"].includes(input.review_status) || !validText(input.barcode, 1200) || !validText(input.paper_size, 1200) || !validCategory(input.category_id)) return fail2("invalid_update");
      let spec;
      try {
        spec = safeProductSpec(input.product_spec);
      } catch {
        return fail2("invalid_product_spec");
      }
      const has = /* @__PURE__ */ __name((k) => Object.prototype.hasOwnProperty.call(input, k), "has");
      const result = await transactional(db, async (c) => {
        if (input.category_id) {
          const selected2 = await c.query("SELECT id FROM fbmn_catalog.categories WHERE id=$1", [input.category_id]);
          if (!selected2.rowCount) throw Error("invalid_category");
        }
        const saved = await c.query(
          "UPDATE fbmn_catalog.skus SET ten_san_pham=NULLIF($3,''),review_status=$4,barcode=CASE WHEN $5::boolean THEN NULLIF($6::text,'') ELSE barcode END,paper_size=CASE WHEN $7::boolean THEN NULLIF($8::text,'') ELSE paper_size END,category_id=CASE WHEN $9::boolean THEN $10::uuid ELSE category_id END,product_spec=product_spec || $11::jsonb,revision=revision+1,updated_at=now() WHERE sku_cong_ty=$1 AND revision=$2 AND review_status IN ('draft','needs_review') AND (NULLIF(BTRIM($3),'') IS NOT NULL OR NULLIF(BTRIM(ten_goc_xnt),'') IS NOT NULL OR NULLIF(BTRIM(ten_goc_bang_gia),'') IS NOT NULL) RETURNING sku_cong_ty,revision",
          [
            input.sku_cong_ty,
            input.expected_revision,
            input.ten_san_pham,
            input.review_status,
            has("barcode"),
            input.barcode ?? null,
            has("paper_size"),
            input.paper_size ?? null,
            has("category_id"),
            input.category_id ?? null,
            JSON.stringify(spec)
          ]
        );
        if (!saved.rowCount) throw Error("catalogue_conflict");
        await audit2(c, actor.subject, "draft_update", { sku_cong_ty: input.sku_cong_ty });
        return saved.rows[0];
      });
      return reply(200, { data: result });
    }
    if (route === "membership" && request.method === "POST") {
      if (actor.role !== "owner") return fail2("owner_required", 403);
      if (!validSku(input?.sku_cong_ty) || !Number.isSafeInteger(input.expected_revision) || input.expected_revision < 1 || !(input.family_id === null || uuid2(input.family_id)) || input.confirm !== "CAP_NHAT_NHOM_MAU") return fail2("invalid_membership");
      const result = await transactional(db, async (c) => {
        if (input.family_id) {
          const family = await c.query("SELECT id FROM fbmn_catalog.families WHERE id=$1", [input.family_id]);
          if (family.rowCount !== 1) throw Error("catalogue_conflict");
        }
        const saved = await c.query(
          "UPDATE fbmn_catalog.skus SET family_id=$1::uuid,revision=revision+1,updated_at=now() WHERE sku_cong_ty=$2 AND revision=$3 AND review_status IN ('draft','needs_review') AND family_id IS DISTINCT FROM $1::uuid RETURNING sku_cong_ty,revision,family_id::text AS family_id",
          [input.family_id, input.sku_cong_ty, input.expected_revision]
        );
        if (saved.rowCount !== 1) throw Error("catalogue_conflict");
        await audit2(c, actor.subject, "family_membership_change", {
          sku_cong_ty: input.sku_cong_ty,
          family_id: input.family_id
        });
        return saved.rows[0];
      });
      return reply(200, { data: result });
    }
    if (route === "categories" && request.method === "PATCH") {
      if (actor.role !== "owner") return fail2("owner_required", 403);
      if (input && Object.hasOwn(input, "category_code")) {
        if (!uuid2(input.id) || !validTaxonomyCode(input.category_code) || !validTaxonomyCode(input.expected_code) || input.category_code === input.expected_code)
          return fail2("invalid_category_code");
        const changed = await transactional(db, async (c) => {
          const saved = await c.query(
            "UPDATE fbmn_catalog.categories SET category_code=$1 WHERE id=$2 AND category_code=$3 RETURNING id::text AS id,parent_id::text AS parent_id,category_code,category_label",
            [input.category_code, input.id, input.expected_code]
          );
          if (saved.rowCount !== 1) throw Error("catalogue_conflict");
          await audit2(c, actor.subject, "category_code_change", {
            id: input.id,
            old_code: input.expected_code,
            new_code: input.category_code
          });
          return saved.rows[0];
        });
        return reply(200, { data: changed });
      }
      if (!uuid2(input?.id) || typeof input.expected_label !== "string" || !input.expected_label.trim() || typeof input.category_label !== "string" || !input.category_label.trim() || !validText(input.category_label, 160) || input.category_label.trim() === input.expected_label.trim())
        return fail2("invalid_category");
      const result = await transactional(db, async (c) => {
        const saved = await c.query(
          "UPDATE fbmn_catalog.categories SET category_label=$1 WHERE id=$2 AND category_label=$3 RETURNING id::text AS id,parent_id::text AS parent_id,category_label",
          [input.category_label.trim(), input.id, input.expected_label]
        );
        if (saved.rowCount !== 1) throw Error("catalogue_conflict");
        await audit2(c, actor.subject, "category_rename", { id: input.id });
        return saved.rows[0];
      });
      return reply(200, { data: result });
    }
    if (route === "categories" && request.method === "POST") {
      if (actor.role !== "owner") return fail2("owner_required", 403);
      if (typeof input?.category_label !== "string" || !input.category_label.trim() || !validText(input.category_label, 160) || !validCategory(input.parent_id) || !validTaxonomyCode(input.category_code))
        return fail2("invalid_category");
      const result = await transactional(db, async (c) => {
        if (input.parent_id) {
          const parent = await c.query(
            "SELECT id FROM fbmn_catalog.categories WHERE id=$1 AND parent_id IS NULL",
            [input.parent_id]
          );
          if (!parent.rowCount) throw Error("invalid_category");
        }
        const saved = await c.query(
          "INSERT INTO fbmn_catalog.categories(category_label,parent_id,category_code) VALUES($1,$2,$3) RETURNING id::text AS id,parent_id::text AS parent_id,category_code,category_label",
          [input.category_label.trim(), input.parent_id ?? null, input.category_code]
        );
        await audit2(c, actor.subject, "category_create", { id: saved.rows[0].id });
        return saved.rows[0];
      });
      return reply(201, { data: result });
    }
    if (route === "families" && request.method === "PATCH") {
      if (actor.role !== "owner") return fail2("owner_required", 403);
      if (input && Object.hasOwn(input, "family_code")) {
        if (!uuid2(input.id) || !validTaxonomyCode(input.family_code) || !validTaxonomyCode(input.expected_code) || !Number.isSafeInteger(input.expected_revision) || input.expected_revision < 1 || input.family_code === input.expected_code)
          return fail2("invalid_family_code");
        const changed = await transactional(db, async (c) => {
          const saved = await c.query(
            "UPDATE fbmn_catalog.families SET family_code=$1,revision=revision+1 WHERE id=$2 AND family_code=$3 AND revision=$4 RETURNING id::text AS id,family_code,family_label,revision",
            [input.family_code, input.id, input.expected_code, input.expected_revision]
          );
          if (saved.rowCount !== 1) throw Error("catalogue_conflict");
          await audit2(c, actor.subject, "family_code_change", {
            id: input.id,
            old_code: input.expected_code,
            new_code: input.family_code
          });
          return saved.rows[0];
        });
        return reply(200, { data: changed });
      }
      if (!uuid2(input?.id) || !Number.isSafeInteger(input.expected_revision) || input.expected_revision < 1 || typeof input.family_label !== "string" || !input.family_label.trim() || !validText(input.family_label, 160))
        return fail2("invalid_family_label");
      const result = await transactional(db, async (c) => {
        await c.query("SELECT pg_advisory_xact_lock(723204)");
        const duplicate = await c.query(
          "SELECT id FROM fbmn_catalog.families WHERE lower(btrim(family_label))=lower($1) AND id<>$2",
          [input.family_label.trim(), input.id]
        );
        if (duplicate.rowCount) throw Error("catalogue_conflict");
        const saved = await c.query(
          "UPDATE fbmn_catalog.families SET family_label=$1,revision=revision+1 WHERE id=$2 AND revision=$3 RETURNING id::text AS id,family_code,family_label,revision",
          [input.family_label.trim(), input.id, input.expected_revision]
        );
        if (saved.rowCount !== 1) throw Error("catalogue_conflict");
        await audit2(c, actor.subject, "family_rename", { id: input.id });
        return saved.rows[0];
      });
      return reply(200, { data: result });
    }
    if (route === "families" && request.method === "POST") {
      if (actor.role !== "owner") return fail2("owner_required", 403);
      if (typeof input?.family_label !== "string" || !input.family_label.trim() || !validText(input.family_label, 160) || !validTaxonomyCode(input.family_code))
        return fail2("invalid_family_label");
      const result = await transactional(db, async (c) => {
        await c.query("SELECT pg_advisory_xact_lock(723204)");
        const duplicate = await c.query("SELECT id FROM fbmn_catalog.families WHERE lower(btrim(family_label))=lower($1)", [input.family_label.trim()]);
        if (duplicate.rowCount) throw Error("catalogue_conflict");
        const saved = await c.query(
          "INSERT INTO fbmn_catalog.families(family_label,family_code) VALUES ($1,$2) RETURNING id::text AS id,family_code,family_label,revision",
          [input.family_label.trim(), input.family_code]
        );
        await audit2(c, actor.subject, "family_create", { id: saved.rows[0].id });
        return saved.rows[0];
      });
      return reply(201, { data: result });
    }
    if (route === "group" && request.method === "POST") {
      const codes = input?.sku_cong_ty;
      if (typeof input?.family_id !== "string" || !/^[0-9a-f-]{36}$/i.test(input.family_id) || !Array.isArray(codes) || codes.length < 2 || codes.length > 200 || codes.some((x) => !validSku(x)) || new Set(codes.map((x) => x.toUpperCase())).size !== codes.length)
        return fail2("invalid_family_assignment");
      const count3 = await transactional(db, async (c) => {
        const family = await c.query(
          "SELECT id FROM fbmn_catalog.families WHERE id=$1",
          [input.family_id]
        );
        if (!family.rowCount) throw Error("catalogue_conflict");
        const saved = await c.query(
          "UPDATE fbmn_catalog.skus SET family_id=$1,revision=revision+1,updated_at=now() WHERE sku_cong_ty=ANY($2::text[]) AND review_status IN ('draft','needs_review') RETURNING sku_cong_ty",
          [input.family_id, codes]
        );
        if (saved.rowCount !== codes.length) throw Error("catalogue_conflict");
        await audit2(c, actor.subject, "family_group", { family_id: input.family_id, count: saved.rowCount });
        return saved.rowCount;
      });
      return reply(200, { data: { grouped: count3, published: 0 } });
    }
    return fail2("method_not_allowed", 405);
  } catch (e) {
    if (e?.message === "invalid_category") return fail2("invalid_category");
    if (e?.message === "sku_not_found") return fail2("sku_not_found", 404);
    if (e?.message === "invalid_product_spec") return fail2("invalid_product_spec");
    const collision = e?.message === "catalogue_conflict" || e?.code === "23505";
    return fail2(collision ? "catalogue_conflict" : "catalogue_db_unavailable", collision ? 409 : 503);
  }
}
__name(handleCatalogue, "handleCatalogue");

// cms-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// cms-publication-policy.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
function parseCmsTimestamp(value) {
  if (typeof value !== "string" || !TIMESTAMP.test(value)) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [year2, month, day3, hour2, minute2, second] = match.slice(1).map(Number);
  const leap = year2 % 4 === 0 && (year2 % 100 !== 0 || year2 % 400 === 0);
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year2 < 1 || month < 1 || month > 12 || day3 < 1 || day3 > monthDays[month - 1] || hour2 > 23 || minute2 > 59 || second > 59) return null;
  const parsed2 = Date.parse(value);
  return Number.isFinite(parsed2) ? parsed2 : null;
}
__name(parseCmsTimestamp, "parseCmsTimestamp");

// cms-placement-contract.mjs
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
var SAFE_CH = /* @__PURE__ */ new Set(["public_web", "dealer_app", "consumer_app"]);
function validCmsPlacements(kind, channels, placements) {
  if (!Array.isArray(channels) || channels.some((c) => !SAFE_CH.has(c)) || !placements || typeof placements !== "object" || Array.isArray(placements)) return false;
  const allowed = CMS_PLACEMENTS[kind];
  if (!allowed) return false;
  if (Object.keys(placements).some((c) => !channels.includes(c))) return false;
  return Object.entries(placements).every(([channel2, slot]) => typeof slot === "string" && allowed[channel2]?.includes(slot));
}
__name(validCmsPlacements, "validCmsPlacements");
function cmsPlacementIsReady(kind, channels, placements) {
  return validCmsPlacements(kind, channels, placements) && channels.length > 0 && channels.every((ch) => typeof placements[ch] === "string");
}
__name(cmsPlacementIsReady, "cmsPlacementIsReady");
function validatePopupFrequency(input) {
  return Number.isSafeInteger(input?.popupDelaySeconds) && input.popupDelaySeconds >= 0 && input.popupDelaySeconds <= 120 && Number.isSafeInteger(input?.popupCooldownMinutes) && input.popupCooldownMinutes >= 0 && input.popupCooldownMinutes <= 43200 && Number.isSafeInteger(input?.popupMaxPerSession) && input.popupMaxPerSession >= 1 && input.popupMaxPerSession <= 20;
}
__name(validatePopupFrequency, "validatePopupFrequency");

// cms-media-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var TABLE = "fbmn_catalog_private.cms_entries";
var MEDIA = "fbmn_catalog_private.cms_entry_media";
var AUDIT = "fbmn_catalog_private.cms_entry_audit";
var LIMIT = 5 * 1024 * 1024;
var UUID2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var CHANNEL = /* @__PURE__ */ new Set(["public_web", "dealer_app", "consumer_app"]);
var DEVICE = /* @__PURE__ */ new Set(["desktop", "mobile"]);
var H = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
var fail3 = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, { status, headers: H }), "fail");
var ok = /* @__PURE__ */ __name((data2) => Response.json({ data: data2 }, { headers: H }), "ok");
var one = /* @__PURE__ */ __name((u, keys) => u.searchParams.size === keys.length && keys.every((k) => u.searchParams.getAll(k).length === 1), "one");
function selected(u) {
  const id = u.searchParams.get("id"), channel2 = u.searchParams.get("channel"), device = u.searchParams.get("device");
  if (!UUID2.test(id) || !CHANNEL.has(channel2) || !DEVICE.has(device)) return null;
  return { id, channel: channel2, device };
}
__name(selected, "selected");
async function handleCmsMedia({ request, db, r2, actor, action }) {
  const u = new URL(request.url);
  if (!r2?.get || !r2?.put) return fail3(503, "media_store_unavailable");
  if (request.method === "GET" && action === "assets") {
    if (!one(u, ["id"]) || !UUID2.test(u.searchParams.get("id"))) return fail3(400, "invalid_query");
    try {
      const rows = await db((c) => c.query("SELECT channel,device,width,height,updated_at FROM " + MEDIA + " WHERE entry_id=$1::uuid ORDER BY channel,device", [u.searchParams.get("id")]));
      return ok({ items: rows.rows });
    } catch {
      return fail3(503, "cms_unavailable");
    }
  }
  if (request.method === "GET" && action === "image") {
    if (!one(u, ["id", "channel", "device"])) return fail3(400, "invalid_query");
    const q = selected(u);
    if (!q) return fail3(400, "invalid_query");
    try {
      const result = await db((c) => c.query("SELECT r2_key FROM " + MEDIA + " WHERE entry_id=$1::uuid AND channel=$2 AND device=$3", [q.id, q.channel, q.device]));
      if (result.rowCount !== 1) return fail3(404, "not_found");
      const object = await r2.get(result.rows[0].r2_key);
      if (!object || !object.body || object.size > LIMIT) return fail3(404, "not_found");
      return new Response(object.body, { status: 200, headers: {
        ...H,
        "Content-Type": "image/webp",
        "Content-Disposition": "inline",
        "Cross-Origin-Resource-Policy": "same-origin"
      } });
    } catch {
      return fail3(503, "cms_unavailable");
    }
  }
  if (request.method !== "POST" || action !== "image-upload") return fail3(405, "method_not_allowed");
  if (u.search) return fail3(400, "invalid_query");
  const id = request.headers.get("x-cms-id"), channel2 = request.headers.get("x-cms-channel"), device = request.headers.get("x-cms-device"), rev = Number(request.headers.get("x-cms-revision"));
  if (!UUID2.test(id) || !CHANNEL.has(channel2) || !DEVICE.has(device) || request.headers.get("content-type")?.split(";")[0] !== "image/webp" || !Number.isSafeInteger(rev) || rev < 1) return fail3(400, "invalid_upload");
  if (Number(request.headers.get("content-length") || 0) > LIMIT) return fail3(413, "image_too_large");
  let bytes;
  try {
    bytes = new Uint8Array(await request.arrayBuffer());
  } catch {
    return fail3(400, "invalid_image");
  }
  if (bytes.length < 100 || bytes.length > LIMIT) return fail3(413, "image_too_large");
  const dimensions = imageSize(bytes, "image/webp", 64);
  if (!dimensions || dimensions.width > 6e3 || dimensions.height > 6e3) return fail3(400, "invalid_image");
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((v) => v.toString(16).padStart(2, "0")).join("");
  const key2 = "cms/" + id + "/" + channel2 + "/" + device + "/" + crypto.randomUUID() + ".webp";
  let inserted = false, committed = false, commitAttempted = false, oldKey = null;
  try {
    const result = await db(async (c) => {
      await c.query("BEGIN");
      try {
        const current = await c.query("SELECT * FROM " + TABLE + " WHERE id=$1::uuid FOR UPDATE", [id]);
        if (current.rowCount !== 1) throw Error("not_found");
        const entry = current.rows[0];
        if (entry.revision !== rev) throw Error("revision_conflict");
        if (entry.status === "published") throw Error("hide_before_edit");
        if (!entry.channel_targets.includes(channel2)) throw Error("channel_not_selected");
        const former = await c.query("SELECT r2_key FROM " + MEDIA + " WHERE entry_id=$1::uuid AND channel=$2 AND device=$3 FOR UPDATE", [id, channel2, device]);
        oldKey = former.rows[0]?.r2_key ?? null;
        await r2.put(key2, bytes, { httpMetadata: { contentType: "image/webp" }, customMetadata: { sha256: digest } });
        inserted = true;
        await c.query("INSERT INTO " + MEDIA + " (entry_id,channel,device,r2_key,width,height,file_sha256,uploaded_by) VALUES($1::uuid,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(entry_id,channel,device) DO UPDATE SET r2_key=excluded.r2_key,width=excluded.width,height=excluded.height,file_sha256=excluded.file_sha256,uploaded_by=excluded.uploaded_by,updated_at=now()", [
          id,
          channel2,
          device,
          key2,
          dimensions.width,
          dimensions.height,
          digest,
          actor.subject
        ]);
        const updated = await c.query("UPDATE " + TABLE + " SET revision=revision+1,updated_by=$2,updated_at=now() WHERE id=$1::uuid RETURNING revision", [id, actor.subject]);
        await c.query("INSERT INTO " + AUDIT + " (entry_id,actor_subject,action,before_data,after_data) VALUES($1::uuid,$2,'media_upload',$3::jsonb,$4::jsonb)", [
          id,
          actor.subject,
          JSON.stringify({ channel: channel2, device, previous: key2 === oldKey ? null : oldKey }),
          JSON.stringify({ channel: channel2, device, width: dimensions.width, height: dimensions.height, sha256: digest })
        ]);
        commitAttempted = true;
        await c.query("COMMIT");
        committed = true;
        return { channel: channel2, device, width: dimensions.width, height: dimensions.height, revision: updated.rows[0].revision };
      } catch (e) {
        await c.query("ROLLBACK").catch(() => {
        });
        throw e;
      }
    });
    if (oldKey && oldKey !== key2) await r2.delete(oldKey).catch(() => {
    });
    return ok(result);
  } catch (e) {
    if (inserted && !commitAttempted) await r2.delete(key2).catch(() => {
    });
    if (e?.message === "revision_conflict" || e?.message === "hide_before_edit") return fail3(409, e.message);
    if (e?.message === "not_found") return fail3(404, "not_found");
    if (e?.message === "channel_not_selected") return fail3(400, "channel_not_selected");
    return fail3(503, "cms_unavailable");
  }
}
__name(handleCmsMedia, "handleCmsMedia");

// cms-slides-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var ENTRIES = "fbmn_catalog_private.cms_entries";
var EXTRA = "fbmn_catalog_private.cms_banner_slide_media";
var SETTINGS = "fbmn_catalog_private.cms_banner_settings";
var AUDIT2 = "fbmn_catalog_private.cms_entry_audit";
var UUID3 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var LIMIT2 = 5 * 1024 * 1024;
var H2 = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
var fail4 = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, { status, headers: H2 }), "fail");
var ok2 = /* @__PURE__ */ __name((data2) => Response.json({ data: data2 }, { headers: H2 }), "ok");
var validSlide = /* @__PURE__ */ __name((n) => Number.isSafeInteger(n) && n >= 2 && n <= 5, "validSlide");
var validDevice = /* @__PURE__ */ __name((v) => v === "desktop" || v === "mobile", "validDevice");
var defaultSettings = {
  enabled: true,
  autoplay: true,
  effect: "fade-slide",
  interval_ms: 7e3,
  duration_ms: 480,
  slide_order: [1, 2, 3, 4, 5]
};
var validSettings = /* @__PURE__ */ __name((d) => d && typeof d === "object" && !Array.isArray(d) && typeof d.enabled === "boolean" && typeof d.autoplay === "boolean" && ["fade", "slide", "fade-slide"].includes(d.effect) && Number.isInteger(d.intervalMs) && d.intervalMs >= 3e3 && d.intervalMs <= 15e3 && Number.isInteger(d.durationMs) && d.durationMs >= 300 && d.durationMs <= 800 && Array.isArray(d.order) && d.order.length === 5 && d.order.every(Number.isInteger) && new Set(d.order).size === 5 && [1, 2, 3, 4, 5].every((i) => d.order.includes(i)), "validSettings");
function getOne(u, expected) {
  const keys = [...u.searchParams.keys()];
  return keys.length === expected.length && new Set(keys).size === keys.length && expected.every((k) => u.searchParams.getAll(k).length === 1);
}
__name(getOne, "getOne");
function error3(ex) {
  const msg = ex?.message;
  if (["revision_conflict", "hide_before_edit"].includes(msg)) return fail4(409, msg);
  if (msg === "not_found") return fail4(404, msg);
  if (["not_hero_banner", "missing_main_images"].includes(msg)) return fail4(400, msg);
  return fail4(503, "cms_unavailable");
}
__name(error3, "error");
async function data(request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return null;
  const bytes = await request.text();
  if (bytes.length > 12e3) return null;
  try {
    const obj = JSON.parse(bytes);
    return obj && typeof obj === "object" && !Array.isArray(obj) ? obj : null;
  } catch {
    return null;
  }
}
__name(data, "data");
async function tx2(db, work) {
  return db(async (c) => {
    await c.query("BEGIN");
    try {
      const v = await work(c);
      await c.query("COMMIT");
      return v;
    } catch (ex) {
      await c.query("ROLLBACK").catch(() => {
      });
      throw ex;
    }
  });
}
__name(tx2, "tx");
async function banner(c, id, rev) {
  const r = await c.query("SELECT id,kind,status,revision,channel_targets,placements FROM " + ENTRIES + " WHERE id=$1::uuid FOR UPDATE", [id]);
  if (r.rowCount !== 1) throw Error("not_found");
  const item3 = r.rows[0];
  if (item3.revision !== rev) throw Error("revision_conflict");
  if (item3.status === "published") throw Error("hide_before_edit");
  if (item3.kind !== "banner" || item3.placements?.public_web !== "home.hero" || !item3.channel_targets.includes("public_web")) throw Error("not_hero_banner");
  return item3;
}
__name(banner, "banner");
async function audit3(c, id, actor, action, before, after) {
  await c.query(
    "INSERT INTO " + AUDIT2 + " (entry_id,actor_subject,action,before_data,after_data) VALUES($1::uuid,$2,$3,$4::jsonb,$5::jsonb)",
    [id, actor, action, JSON.stringify(before), JSON.stringify(after)]
  );
}
__name(audit3, "audit");
async function handleCmsSlides({ request, db, r2, actor, action }) {
  if (actor?.role !== "owner") return fail4(403, "owner_required");
  const u = new URL(request.url);
  if (request.method === "GET" && action === "slides") {
    if (!getOne(u, ["id"]) || !UUID3.test(u.searchParams.get("id"))) return fail4(400, "invalid_query");
    const id = u.searchParams.get("id");
    try {
      const result = await db(async (c) => {
        const entry = await c.query("SELECT kind,status,revision FROM " + ENTRIES + " WHERE id=$1::uuid", [id]);
        if (entry.rowCount !== 1) return null;
        const [settings, legacy, extras] = await Promise.all([
          c.query("SELECT enabled,autoplay,effect,interval_ms,duration_ms,slide_order FROM " + SETTINGS + " WHERE entry_id=$1::uuid", [id]),
          c.query("SELECT 1::integer AS slide_no,device,width,height,updated_at FROM fbmn_catalog_private.cms_entry_media WHERE entry_id=$1::uuid AND channel='public_web'", [id]),
          c.query("SELECT slide_no::integer,device,width,height,updated_at FROM " + EXTRA + " WHERE entry_id=$1::uuid ORDER BY slide_no,device", [id])
        ]);
        return {
          kind: entry.rows[0].kind,
          status: entry.rows[0].status,
          revision: entry.rows[0].revision,
          settings: settings.rows[0] ?? defaultSettings,
          images: [...legacy.rows, ...extras.rows]
        };
      });
      return result ? ok2(result) : fail4(404, "not_found");
    } catch {
      return fail4(503, "cms_unavailable");
    }
  }
  if (request.method === "GET" && action === "slide-image") {
    if (!getOne(u, ["id", "slide", "device"])) return fail4(400, "invalid_query");
    const id = u.searchParams.get("id"), slide = Number(u.searchParams.get("slide")), device = u.searchParams.get("device");
    if (!UUID3.test(id) || !validSlide(slide) || !validDevice(device)) return fail4(400, "invalid_query");
    if (!r2?.get) return fail4(503, "media_store_unavailable");
    try {
      const rows = await db((c) => c.query("SELECT r2_key FROM " + EXTRA + " WHERE entry_id=$1::uuid AND slide_no=$2 AND device=$3", [id, slide, device]));
      if (rows.rowCount !== 1) return fail4(404, "not_found");
      const object = await r2.get(rows.rows[0].r2_key);
      if (!object?.body || object.size > LIMIT2) return fail4(404, "not_found");
      return new Response(object.body, { headers: {
        ...H2,
        "Content-Type": "image/webp",
        "Content-Disposition": "inline",
        "Cross-Origin-Resource-Policy": "same-origin"
      } });
    } catch {
      return fail4(503, "cms_unavailable");
    }
  }
  if (request.method !== "POST" || u.search) return fail4(405, "method_not_allowed");
  if (action === "slide-upload") {
    if (!r2?.get || !r2?.put || !r2?.delete) return fail4(503, "media_store_unavailable");
    const id = request.headers.get("x-cms-id"), slide = Number(request.headers.get("x-cms-slide")), device = request.headers.get("x-cms-device"), rev = Number(request.headers.get("x-cms-revision"));
    if (!UUID3.test(id) || !validSlide(slide) || !validDevice(device) || !Number.isSafeInteger(rev) || rev < 1 || request.headers.get("content-type")?.split(";")[0] !== "image/webp") return fail4(400, "invalid_upload");
    if (Number(request.headers.get("content-length") || 0) > LIMIT2) return fail4(413, "image_too_large");
    const bytes = new Uint8Array(await request.arrayBuffer().catch(() => new ArrayBuffer(0)));
    if (bytes.length < 100 || bytes.length > LIMIT2) return fail4(413, "image_too_large");
    const size = imageSize(bytes, "image/webp", 64);
    if (!size || size.width > 6e3 || size.height > 6e3) return fail4(400, "invalid_image");
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((v) => v.toString(16).padStart(2, "0")).join("");
    const key2 = "cms/" + id + "/public_web/" + device + "/" + crypto.randomUUID() + ".webp";
    let inserted = false, commitAttempted = false, oldKey = null;
    try {
      const result = await db(async (c) => {
        await c.query("BEGIN");
        try {
          await banner(c, id, rev);
          const old = await c.query("SELECT r2_key FROM " + EXTRA + " WHERE entry_id=$1::uuid AND slide_no=$2 AND device=$3 FOR UPDATE", [id, slide, device]);
          oldKey = old.rows[0]?.r2_key ?? null;
          await r2.put(key2, bytes, { httpMetadata: { contentType: "image/webp" }, customMetadata: { sha256: digest } });
          inserted = true;
          await c.query(
            "INSERT INTO " + EXTRA + " (entry_id,slide_no,device,r2_key,width,height,file_sha256,uploaded_by) VALUES($1::uuid,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(entry_id,slide_no,device) DO UPDATE SET r2_key=excluded.r2_key,width=excluded.width,height=excluded.height,file_sha256=excluded.file_sha256,uploaded_by=excluded.uploaded_by,updated_at=now()",
            [id, slide, device, key2, size.width, size.height, digest, actor.subject]
          );
          const updated = await c.query(
            "UPDATE " + ENTRIES + " SET revision=revision+1,updated_at=now(),updated_by=$2 WHERE id=$1::uuid RETURNING revision",
            [id, actor.subject]
          );
          await audit3(
            c,
            id,
            actor.subject,
            "banner_slide_upload",
            { slide, device, hadPrevious: !!oldKey },
            { slide, device, width: size.width, height: size.height, sha256: digest }
          );
          commitAttempted = true;
          await c.query("COMMIT");
          return { revision: updated.rows[0].revision, slide, device, width: size.width, height: size.height };
        } catch (ex) {
          await c.query("ROLLBACK").catch(() => {
          });
          throw ex;
        }
      });
      if (oldKey && oldKey !== key2) await r2.delete(oldKey).catch(() => {
      });
      return ok2(result);
    } catch (ex) {
      if (inserted && !commitAttempted) await r2.delete(key2).catch(() => {
      });
      return error3(ex);
    }
  }
  const input = await data(request);
  if (!input || !UUID3.test(input.id) || !Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) return fail4(400, "invalid_body");
  if (action === "slide-settings") {
    if (!validSettings(input)) return fail4(400, "invalid_settings");
    try {
      const result = await tx2(db, async (c) => {
        await banner(c, input.id, input.expectedRevision);
        const before = await c.query("SELECT * FROM " + SETTINGS + " WHERE entry_id=$1::uuid", [input.id]);
        await c.query(
          "INSERT INTO " + SETTINGS + " (entry_id,enabled,autoplay,effect,interval_ms,duration_ms,slide_order) VALUES($1::uuid,$2,$3,$4,$5,$6,$7::smallint[]) ON CONFLICT(entry_id) DO UPDATE SET enabled=excluded.enabled,autoplay=excluded.autoplay,effect=excluded.effect,interval_ms=excluded.interval_ms,duration_ms=excluded.duration_ms,slide_order=excluded.slide_order",
          [input.id, input.enabled, input.autoplay, input.effect, input.intervalMs, input.durationMs, input.order]
        );
        const updated = await c.query(
          "UPDATE " + ENTRIES + " SET revision=revision+1,updated_at=now(),updated_by=$2 WHERE id=$1::uuid RETURNING revision",
          [input.id, actor.subject]
        );
        await audit3(
          c,
          input.id,
          actor.subject,
          "banner_slide_settings",
          before.rows[0] ?? defaultSettings,
          {
            enabled: input.enabled,
            autoplay: input.autoplay,
            effect: input.effect,
            intervalMs: input.intervalMs,
            durationMs: input.durationMs,
            order: input.order
          }
        );
        return { revision: updated.rows[0].revision };
      });
      return ok2(result);
    } catch (ex) {
      return error3(ex);
    }
  }
  if (action === "slide-remove") {
    const slide = input.slide;
    if (!validSlide(slide) || !r2?.delete) return fail4(400, "invalid_slide");
    try {
      const result = await tx2(db, async (c) => {
        await banner(c, input.id, input.expectedRevision);
        const removed = await c.query("DELETE FROM " + EXTRA + " WHERE entry_id=$1::uuid AND slide_no=$2 RETURNING device,r2_key", [input.id, slide]);
        const updated = await c.query(
          "UPDATE " + ENTRIES + " SET revision=revision+1,updated_at=now(),updated_by=$2 WHERE id=$1::uuid RETURNING revision",
          [input.id, actor.subject]
        );
        await audit3(
          c,
          input.id,
          actor.subject,
          "banner_slide_remove",
          { slide, devices: removed.rows.map((x) => x.device) },
          { slide, removed: true }
        );
        return { revision: updated.rows[0].revision, keys: removed.rows.map((x) => x.r2_key) };
      });
      for (const key2 of result.keys) await r2.delete(key2).catch(() => {
      });
      return ok2({ revision: result.revision, slide });
    } catch (ex) {
      return error3(ex);
    }
  }
  return fail4(404, "not_found");
}
__name(handleCmsSlides, "handleCmsSlides");

// cms-service.mjs
var ROOT = "/v1/admin/cms";
var KIND = /* @__PURE__ */ new Set(["banner", "popup", "article", "promotion"]);
var CHANNEL2 = /* @__PURE__ */ new Set(["public_web", "dealer_app", "consumer_app"]);
var SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var IDENTIFIER = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var TABLE2 = "fbmn_catalog_private.cms_entries";
var AUDIT3 = "fbmn_catalog_private.cms_entry_audit";
var EXTRA2 = "fbmn_catalog_private.cms_banner_slide_media";
var HEADERS2 = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
var ok3 = /* @__PURE__ */ __name((data2) => Response.json({ data: data2 }, { headers: HEADERS2 }), "ok");
var fail5 = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, { status, headers: HEADERS2 }), "fail");
var clean = /* @__PURE__ */ __name((v, min, max) => typeof v === "string" && v === v.trim() && v.length >= min && v.length <= max && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v), "clean");
var plain = /* @__PURE__ */ __name((s) => !/<\/?[a-z][^>]*>/i.test(s), "plain");
var date = /* @__PURE__ */ __name((value) => value === null ? null : typeof value === "string" && parseCmsTimestamp(value) !== null ? new Date(parseCmsTimestamp(value)).toISOString() : void 0, "date");
function urlSafe(value) {
  if (value === null) return true;
  if (typeof value !== "string" || value.length > 500 || value !== value.trim()) return false;
  if (/^\/(?!\/)/.test(value)) return !value.includes("\\") && !/\.\./.test(value);
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password && !u.hash && u.href === value && u.hostname.includes(".");
  } catch {
    return false;
  }
}
__name(urlSafe, "urlSafe");
function validate(input, creating = false) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  if (creating && (!KIND.has(input.kind) || !SLUG.test(input.slug) || input.slug.length > 100)) return null;
  if (!clean(input.title, 2, 160) || !plain(input.title) || !clean(input.summary, 0, 400) || !plain(input.summary) || !Array.isArray(input.paragraphs) || input.paragraphs.length > 30 || !input.paragraphs.every((p) => clean(p, 1, 3e3) && plain(p)) || !urlSafe(input.ctaUrl) || !Array.isArray(input.channelTargets) || input.channelTargets.length > 3 || new Set(input.channelTargets).size !== input.channelTargets.length || !input.channelTargets.every((c) => CHANNEL2.has(c)) || !Number.isSafeInteger(input.sortOrder) || input.sortOrder < 0 || input.sortOrder > 1e4 || input.sourceRef !== "" && !clean(input.sourceRef, 1, 500) || date(input.startsAt) === void 0 || date(input.endsAt) === void 0 || !validCmsPlacements(input.kind ?? "article", input.channelTargets, input.placements ?? {}) || !validatePopupFrequency({
    popupDelaySeconds: input.popupDelaySeconds ?? 3,
    popupCooldownMinutes: input.popupCooldownMinutes ?? 1440,
    popupMaxPerSession: input.popupMaxPerSession ?? 1
  }))
    return null;
  const starts = date(input.startsAt), ends = date(input.endsAt);
  if (starts !== null && ends !== null && starts > ends) return null;
  if (creating && ["article", "promotion"].includes(input.kind) && !input.paragraphs.length) return null;
  return {
    title: input.title,
    summary: input.summary,
    paragraphs: input.paragraphs,
    cta_url: input.ctaUrl,
    channel_targets: input.channelTargets,
    sort_order: input.sortOrder,
    starts_at: starts,
    ends_at: ends,
    source_ref: input.sourceRef,
    placements: input.placements ?? {},
    popup_delay_seconds: input.popupDelaySeconds ?? 3,
    popup_cooldown_minutes: input.popupCooldownMinutes ?? 1440,
    popup_max_per_session: input.popupMaxPerSession ?? 1
  };
}
__name(validate, "validate");
async function body(request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return null;
  if (Number(request.headers.get("content-length") || 0) > 105e3) return null;
  const raw = await request.text();
  if (raw.length > 105e3) return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
__name(body, "body");
async function transaction(db, work) {
  return db(async (client) => {
    await client.query("BEGIN");
    try {
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  });
}
__name(transaction, "transaction");
async function record(client, id, subject, action, before, after) {
  await client.query(
    "INSERT INTO " + AUDIT3 + " (entry_id,actor_subject,action,before_data,after_data) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb)",
    [id, subject, action, before ? JSON.stringify(before) : null, JSON.stringify(after)]
  );
}
__name(record, "record");
function errorFor(e) {
  if (e?.message === "surface_unavailable") return fail5(409, "surface_unavailable");
  if (e?.message === "revision_conflict" || e?.message === "hide_before_edit" || e?.message === "already_published" || e?.message === "already_hidden") return fail5(409, e.message);
  if (e?.message === "source_required" || e?.message === "channels_required" || e?.message === "placements_required" || e?.message === "media_required" || e?.message === "ends_at_required" || e?.message === "slides_incomplete") return fail5(400, e.message);
  return fail5(e?.code === "23505" ? 409 : 503, e?.code === "23505" ? "slug_conflict" : "cms_unavailable");
}
__name(errorFor, "errorFor");
async function list(db, mode, page, { kind = null, status = null, search = null } = {}) {
  const result = await db((client) => client.query(
    "SELECT id::text,kind,slug,title,summary,channel_targets,sort_order,starts_at,ends_at,source_ref,placements,popup_delay_seconds,popup_cooldown_minutes,popup_max_per_session,status,revision,created_at,updated_at,EXISTS (SELECT 1 FROM fbmn_catalog_private.cms_entry_media m WHERE m.entry_id=c.id AND m.channel='public_web' AND m.device='desktop' AND m.mime_type='image/webp') AS has_desktop,EXISTS (SELECT 1 FROM fbmn_catalog_private.cms_entry_media m WHERE m.entry_id=c.id AND m.channel='public_web' AND m.device='mobile' AND m.mime_type='image/webp') AS has_mobile,(SELECT count(*)::integer FROM (SELECT slide_no FROM " + EXTRA2 + " m WHERE m.entry_id=c.id GROUP BY slide_no HAVING count(DISTINCT device)<>2) x) AS incomplete_slide_count FROM " + TABLE2 + " c WHERE (($1::text='marketing' AND kind IN ('banner','popup')) OR ($1::text='editorial' AND kind IN ('article','promotion'))) AND ($3::text IS NULL OR kind=$3::text) AND ($4::text IS NULL OR status=$4::text) AND ($5::text IS NULL OR strpos(lower(title),lower($5::text))>0 OR strpos(lower(slug),lower($5::text))>0) ORDER BY updated_at DESC,id LIMIT 51 OFFSET $2",
    [mode, (page - 1) * 50, kind, status, search]
  ));
  return ok3({ items: result.rows.slice(0, 50), page, hasNext: result.rows.length > 50 });
}
__name(list, "list");
async function detail(db, id) {
  const result = await db((client) => client.query(
    "SELECT id::text,kind,slug,title,summary,paragraphs,cta_url,channel_targets,sort_order,starts_at,ends_at,source_ref,placements,popup_delay_seconds,popup_cooldown_minutes,popup_max_per_session,status,revision,created_at,updated_at,EXISTS (SELECT 1 FROM fbmn_catalog_private.cms_entry_media m WHERE m.entry_id=c.id AND m.channel='public_web' AND m.device='desktop' AND m.mime_type='image/webp') AS has_desktop,EXISTS (SELECT 1 FROM fbmn_catalog_private.cms_entry_media m WHERE m.entry_id=c.id AND m.channel='public_web' AND m.device='mobile' AND m.mime_type='image/webp') AS has_mobile,(SELECT count(*)::integer FROM (SELECT slide_no FROM " + EXTRA2 + " m WHERE m.entry_id=c.id GROUP BY slide_no HAVING count(DISTINCT device)<>2) x) AS incomplete_slide_count FROM " + TABLE2 + " c WHERE id=$1::uuid LIMIT 1",
    [id]
  ));
  if (result.rowCount !== 1) return fail5(404, "cms_not_found");
  return ok3({ item: result.rows[0] });
}
__name(detail, "detail");
async function create(db, input, subject) {
  const item3 = validate(input, true);
  if (!item3) return fail5(400, "invalid_cms_entry");
  try {
    const result = await transaction(db, async (c) => {
      const columns = "kind,slug,title,summary,paragraphs,cta_url,channel_targets,sort_order,starts_at,ends_at,source_ref,placements,popup_delay_seconds,popup_cooldown_minutes,popup_max_per_session,created_by,updated_by";
      const values = [
        input.kind,
        input.slug,
        item3.title,
        item3.summary,
        item3.paragraphs,
        item3.cta_url,
        item3.channel_targets,
        item3.sort_order,
        item3.starts_at,
        item3.ends_at,
        item3.source_ref,
        JSON.stringify(item3.placements),
        item3.popup_delay_seconds,
        item3.popup_cooldown_minutes,
        item3.popup_max_per_session,
        subject,
        subject
      ];
      const added = await c.query("INSERT INTO " + TABLE2 + " (" + columns + ") VALUES (" + values.map((_, i) => "$" + (i + 1)).join(",") + ") RETURNING *", values);
      await record(c, added.rows[0].id, subject, "create", null, added.rows[0]);
      return added.rows[0];
    });
    return ok3({ item: result });
  } catch (e) {
    return errorFor(e);
  }
}
__name(create, "create");
async function mutate(db, input, subject, action, publicSurfaceReady = false) {
  if (!IDENTIFIER.test(input?.id) || !Number.isSafeInteger(input?.expectedRevision) || input.expectedRevision < 1) return fail5(400, "invalid_revision");
  const next = action === "update" ? validate(input) : null;
  if (action === "update" && !next) return fail5(400, "invalid_cms_entry");
  try {
    const changed = await transaction(db, async (c) => {
      const prev = await c.query("SELECT * FROM " + TABLE2 + " WHERE id=$1::uuid FOR UPDATE", [input.id]);
      if (prev.rowCount !== 1 || prev.rows[0].revision !== input.expectedRevision) throw Error("revision_conflict");
      const old = prev.rows[0];
      if (action === "update" && old.status === "published") throw Error("hide_before_edit");
      if (action === "publish" && old.status === "published") throw Error("already_published");
      if (action === "hide" && old.status === "hidden") throw Error("already_hidden");
      if (action === "publish" && !old.source_ref.trim()) throw Error("source_required");
      if (action === "publish" && old.kind === "promotion" && !old.ends_at) throw Error("ends_at_required");
      if (action === "publish" && !old.channel_targets.length) throw Error("channels_required");
      if (action === "publish" && !cmsPlacementIsReady(old.kind, old.channel_targets, old.placements))
        throw Error("placements_required");
      if (action === "publish" && (!publicSurfaceReady || old.channel_targets.some((c2) => c2 !== "public_web")))
        throw Error("surface_unavailable");
      if (action === "publish" && ["banner", "popup"].includes(old.kind)) {
        const media = await c.query("SELECT channel,device FROM fbmn_catalog_private.cms_entry_media WHERE entry_id=$1::uuid", [input.id]);
        if (!["desktop", "mobile"].every((device) => media.rows.some((m) => m.channel === "public_web" && m.device === device)))
          throw Error("media_required");
      }
      if (action === "publish" && old.kind === "banner" && old.placements?.public_web === "home.hero") {
        const incomplete = await c.query("SELECT slide_no FROM " + EXTRA2 + " WHERE entry_id=$1::uuid GROUP BY slide_no HAVING count(DISTINCT device)<>2 LIMIT 1", [input.id]);
        if (incomplete.rowCount) throw Error("slides_incomplete");
      }
      let result;
      if (action === "update") {
        result = await c.query("UPDATE " + TABLE2 + " SET title=$2,summary=$3,paragraphs=$4,cta_url=$5,channel_targets=$6,sort_order=$7,starts_at=$8,ends_at=$9,source_ref=$10,placements=$11::jsonb,popup_delay_seconds=$12,popup_cooldown_minutes=$13,popup_max_per_session=$14,status='draft',revision=revision+1,updated_by=$15,updated_at=now() WHERE id=$1::uuid RETURNING *", [
          input.id,
          next.title,
          next.summary,
          next.paragraphs,
          next.cta_url,
          next.channel_targets,
          next.sort_order,
          next.starts_at,
          next.ends_at,
          next.source_ref,
          JSON.stringify(next.placements),
          next.popup_delay_seconds,
          next.popup_cooldown_minutes,
          next.popup_max_per_session,
          subject
        ]);
      } else if (action === "publish") {
        result = await c.query("UPDATE " + TABLE2 + " SET status='published',verified_by=$2,verified_at=now(),approved_by=$2,approved_at=now(),published_at=now(),withdrawn_at=NULL,revision=revision+1,updated_by=$2,updated_at=now() WHERE id=$1::uuid RETURNING *", [input.id, subject]);
      } else {
        result = await c.query(
          "UPDATE " + TABLE2 + " SET status='hidden',withdrawn_at=now(),revision=revision+1,updated_by=$2,updated_at=now() WHERE id=$1::uuid RETURNING *",
          [input.id, subject]
        );
      }
      const item3 = result.rows[0];
      await record(c, input.id, subject, action, old, item3);
      return item3;
    });
    return ok3({ item: changed });
  } catch (e) {
    return errorFor(e);
  }
}
__name(mutate, "mutate");
async function handleCms({ request, actor, db, r2, publicSurfaceReady = false }) {
  if (actor?.role !== "owner") return fail5(403, "owner_required");
  const u = new URL(request.url);
  const action = u.pathname === ROOT ? "" : u.pathname.startsWith(ROOT + "/") ? u.pathname.slice(ROOT.length + 1) : "unknown";
  if (["assets", "image", "image-upload"].includes(action))
    return handleCmsMedia({ request, db, r2, actor, action });
  if (["slides", "slide-image", "slide-upload", "slide-settings", "slide-remove"].includes(action))
    return handleCmsSlides({ request, db, r2, actor, action });
  if (request.method === "GET") {
    if (action === "capability") {
      if (u.search) return fail5(400, "invalid_query");
      return ok3({ ready: publicSurfaceReady === true, channel: "public_web" });
    }
    const keys = [...u.searchParams.keys()];
    if (keys.length !== new Set(keys).size) return fail5(400, "invalid_query");
    if (action === "entry") {
      if (keys.length !== 1 || keys[0] !== "id") return fail5(400, "invalid_query");
      const id = u.searchParams.get("id");
      if (!IDENTIFIER.test(id)) return fail5(400, "invalid_id");
      try {
        return await detail(db, id);
      } catch {
        return fail5(503, "cms_unavailable");
      }
    }
    if (action !== "" || keys.some((k) => !["mode", "page", "kind", "status", "search"].includes(k))) return fail5(400, "invalid_query");
    const mode = u.searchParams.get("mode") ?? "editorial";
    const rawPage = u.searchParams.get("page") ?? "1";
    if (!["marketing", "editorial"].includes(mode) || !/^[1-9]\d{0,3}$/.test(rawPage))
      return fail5(400, "invalid_query");
    const kind = u.searchParams.get("kind"), status = u.searchParams.get("status"), search = u.searchParams.get("search");
    if (mode !== "editorial" && (kind !== null || status !== null || search !== null) || kind !== null && !["article", "promotion"].includes(kind) || status !== null && !["draft", "published", "hidden"].includes(status) || search !== null && (search !== search.trim() || search.length < 1 || search.length > 80 || /[\x00-\x1f\x7f]/.test(search)))
      return fail5(400, "invalid_query");
    try {
      return await list(db, mode, Number(rawPage), { kind, status, search });
    } catch {
      return fail5(503, "cms_unavailable");
    }
  }
  if (request.method !== "POST") return fail5(405, "method_not_allowed");
  if (u.search) return fail5(400, "invalid_query");
  if (!["create", "update", "publish", "hide"].includes(action)) return fail5(404, "not_found");
  const input = await body(request);
  if (!input) return fail5(400, "invalid_body");
  if (action === "create") return create(db, input, actor.subject);
  return mutate(db, input, actor.subject, action, publicSurfaceReady);
}
__name(handleCms, "handleCms");

// home-layout-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var TABLE3 = "fbmn_catalog_private.web_home_layout";
var AUDIT4 = "fbmn_catalog_private.web_home_layout_audit";
var HEADERS3 = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
var ok4 = /* @__PURE__ */ __name((data2) => Response.json({ data: data2 }, { headers: HEADERS3 }), "ok");
var fail6 = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, { status, headers: HEADERS3 }), "fail");
var DEFAULT_HOME_LAYOUT = Object.freeze({
  categoryIds: [],
  featuredSkus: [],
  categoryLimit: 6,
  productLimit: 4,
  sectionOrder: ["categories", "products"],
  revision: 1
});
var LAYOUT_SQL = "SELECT category_ids,featured_skus,category_limit,product_limit,section_order,revision FROM " + TABLE3 + " WHERE singleton=true";
var ELIGIBLE_SQL = "SELECT s.sku_cong_ty AS sku, COALESCE(NULLIF(BTRIM(s.ten_san_pham),''),NULLIF(BTRIM(s.ten_goc_xnt),''),s.sku_cong_ty) AS name,s.category_id::text AS category_id,c.category_label,s.family_id::text AS family_id FROM fbmn_catalog.skus s JOIN fbmn_catalog.publications p ON p.sku_cong_ty=s.sku_cong_ty LEFT JOIN fbmn_catalog.categories c ON c.id=s.category_id WHERE p.channel_code='public_web' AND p.state='published' AND p.published_at IS NOT NULL ORDER BY s.sku_cong_ty LIMIT 10001";
function fromRow(row) {
  if (!row) throw Error("layout_missing");
  return {
    categoryIds: row.category_ids,
    featuredSkus: row.featured_skus,
    categoryLimit: Number(row.category_limit),
    productLimit: Number(row.product_limit),
    sectionOrder: row.section_order,
    revision: Number(row.revision)
  };
}
__name(fromRow, "fromRow");
function eligibleHomeLayout(rows) {
  if (rows.length > 1e4) throw Error("too_many_skus");
  const labels = /* @__PURE__ */ new Map(), groups = /* @__PURE__ */ new Map(), counts = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const sku = String(row.sku);
    const categoryId = row.category_id ? "p5-" + String(row.category_id) : "p5-uncategorized";
    if (!labels.has(categoryId)) labels.set(categoryId, { name: String(row.category_label || "Ch\u01B0a ph\xE2n lo\u1EA1i"), sortOrder: labels.size + 100 });
    const key2 = row.family_id ? "family:" + String(row.family_id) : "sku:" + sku;
    const count3 = counts.get(key2) ?? 0;
    counts.set(key2, count3 + 1);
    const pageKey = key2 + "|part:" + Math.floor(count3 / 100);
    let group3 = groups.get(pageKey);
    if (!group3) {
      group3 = { categoryId, skus: [] };
      groups.set(pageKey, group3);
    }
    if (row.category_id && group3.categoryId === "p5-uncategorized") group3.categoryId = categoryId;
    group3.skus.push({ sku, name: String(row.name) });
  }
  const categories = /* @__PURE__ */ new Map(), skus = [];
  for (const group3 of groups.values()) {
    const id = group3.categoryId;
    const existing = categories.get(id);
    if (existing) existing.productCount++;
    else categories.set(id, { id, name: labels.get(id)?.name || "Ch\u01B0a ph\xE2n lo\u1EA1i", productCount: 1, sortOrder: labels.get(id)?.sortOrder ?? 100 });
    for (const item3 of group3.skus) skus.push({ ...item3, categoryId: id });
  }
  return { categories: [...categories.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "vi") || a.id.localeCompare(b.id)), skus };
}
__name(eligibleHomeLayout, "eligibleHomeLayout");
function uniqueStrings(x, max, length) {
  return Array.isArray(x) && x.length <= max && x.every((v) => typeof v === "string" && v.length > 0 && v.length <= length && v.trim() === v && !/[\x00-\x1f\x7f]/.test(v)) && new Set(x).size === x.length;
}
__name(uniqueStrings, "uniqueStrings");
function validateHomeLayout(input, available) {
  if (!input || typeof input !== "object" || Array.isArray(input) || !uniqueStrings(input.categoryIds, 6, 80) || !uniqueStrings(input.featuredSkus, 12, 100) || !Number.isSafeInteger(input.categoryLimit) || input.categoryLimit < 1 || input.categoryLimit > 6 || !Number.isSafeInteger(input.productLimit) || input.productLimit < 1 || input.productLimit > 12 || !Array.isArray(input.sectionOrder) || input.sectionOrder.length !== 2 || new Set(input.sectionOrder).size !== 2 || !input.sectionOrder.includes("categories") || !input.sectionOrder.includes("products") || !Number.isSafeInteger(input.revision) || input.revision < 1) return false;
  const categories = new Set(available.categories.map((c) => c.id));
  const skus = new Set(available.skus.map((s) => s.sku));
  return input.categoryIds.every((id) => categories.has(id)) && input.featuredSkus.every((sku) => skus.has(sku));
}
__name(validateHomeLayout, "validateHomeLayout");
async function readBody(request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json" || Number(request.headers.get("content-length") || 0) > 15e3) return null;
  const text = await request.text();
  if (text.length > 15e3) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
__name(readBody, "readBody");
async function handleHomeLayout({ request, actor, db }) {
  const url = new URL(request.url);
  if (url.pathname !== "/v1/admin/website/home-layout") return fail6(404, "not_found");
  if (url.search) return fail6(400, "invalid_query");
  if (!["GET", "POST"].includes(request.method)) return fail6(405, "method_not_allowed");
  if (typeof db !== "function") return fail6(503, "layout_unavailable");
  try {
    if (request.method === "GET") {
      const result = await db(async (client) => {
        const [layout, eligible] = await Promise.all([client.query(LAYOUT_SQL), client.query(ELIGIBLE_SQL)]);
        return { layout: fromRow(layout.rows[0]), available: eligibleHomeLayout(eligible.rows) };
      });
      return ok4(result);
    }
    const body4 = await readBody(request);
    if (!body4 || typeof body4 !== "object" || Array.isArray(body4)) return fail6(400, "invalid_layout");
    if (body4.operation !== "save" && body4.operation !== "reset") return fail6(400, "invalid_layout");
    if (!Number.isSafeInteger(body4.revision) || body4.revision < 1) return fail6(400, "invalid_layout");
    const saved = await db(async (client) => {
      await client.query("BEGIN");
      try {
        const before = fromRow((await client.query(LAYOUT_SQL)).rows[0]);
        if (before.revision !== body4.revision) throw Error("revision_conflict");
        const selected2 = body4.operation === "reset" ? { ...DEFAULT_HOME_LAYOUT, revision: body4.revision } : body4;
        const available = eligibleHomeLayout((await client.query(ELIGIBLE_SQL)).rows);
        if (!validateHomeLayout(selected2, available)) throw Error("invalid_layout");
        const args = [
          selected2.categoryIds,
          selected2.featuredSkus,
          selected2.categoryLimit,
          selected2.productLimit,
          selected2.sectionOrder,
          body4.revision,
          actor.subject
        ];
        const updated = await client.query("UPDATE " + TABLE3 + " SET category_ids=$1,featured_skus=$2,category_limit=$3,product_limit=$4,section_order=$5,revision=revision+1,updated_by=$7,updated_at=now() WHERE singleton=true AND revision=$6 RETURNING category_ids,featured_skus,category_limit,product_limit,section_order,revision", args);
        if (updated.rows.length !== 1) throw Error("revision_conflict");
        const after = fromRow(updated.rows[0]);
        await client.query(
          "INSERT INTO " + AUDIT4 + "(revision,actor_subject,operation,before_data,after_data) VALUES($1,$2,$3,$4::jsonb,$5::jsonb)",
          [after.revision, actor.subject, body4.operation, JSON.stringify(before), JSON.stringify(after)]
        );
        await client.query("COMMIT");
        return after;
      } catch (error7) {
        await client.query("ROLLBACK");
        throw error7;
      }
    });
    return ok4({ layout: saved });
  } catch (error7) {
    if (error7?.message === "revision_conflict") return fail6(409, "revision_conflict");
    if (error7?.message === "invalid_layout") return fail6(400, "invalid_layout");
    return fail6(503, "layout_unavailable");
  }
}
__name(handleHomeLayout, "handleHomeLayout");

// app-download-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var TABLE4 = "fbmn_catalog_private.web_app_download_settings";
var AUDIT5 = "fbmn_catalog_private.web_app_download_settings_audit";
var HEADERS4 = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
var good = /* @__PURE__ */ __name((data2) => Response.json({ data: data2 }, { headers: HEADERS4 }), "good");
var fail7 = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, { status, headers: HEADERS4 }), "fail");
var READ = "SELECT popup_enabled,button_enabled,first_delay_ms,cooldown_minutes,title,message,ios_url,android_url,revision FROM " + TABLE4 + " WHERE singleton=true";
var DEFAULT_APP_DOWNLOAD = Object.freeze({
  popupEnabled: true,
  buttonEnabled: true,
  firstDelayMs: 1400,
  cooldownMinutes: 120,
  title: "\u1EE8ng d\u1EE5ng Futurebook",
  message: "\u1EE8ng d\u1EE5ng ch\u01B0a ph\xE1t h\xE0nh. \u0110\u01B0\u1EDDng d\u1EABn t\u1EA3i s\u1EBD c\u1EADp nh\u1EADt khi c\xF3 b\u1EA3n ch\xEDnh th\u1EE9c.",
  iosUrl: null,
  androidUrl: null,
  revision: 1
});
function fromRow2(r) {
  if (!r) throw Error("config_unavailable");
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
}
__name(fromRow2, "fromRow");
function validateStoreUrl(value, platform2) {
  if (value === null) return true;
  if (typeof value !== "string" || value.length > 500) return false;
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" || u.username || u.password || u.port || u.hash || u.searchParams.has("redirect")) return false;
    if (platform2 === "ios") return u.hostname === "apps.apple.com" && u.pathname.length > 2;
    return u.hostname === "play.google.com" && u.pathname === "/store/apps/details" && u.searchParams.has("id") && /^[a-zA-Z0-9_.]+$/.test(u.searchParams.get("id") || "");
  } catch {
    return false;
  }
}
__name(validateStoreUrl, "validateStoreUrl");
function validateAppDownload(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  const fields = [
    "popupEnabled",
    "buttonEnabled",
    "firstDelayMs",
    "cooldownMinutes",
    "title",
    "message",
    "iosUrl",
    "androidUrl",
    "revision"
  ];
  if (Object.keys(input).some((k) => !fields.includes(k))) return false;
  return typeof input.popupEnabled === "boolean" && typeof input.buttonEnabled === "boolean" && Number.isSafeInteger(input.firstDelayMs) && input.firstDelayMs >= 500 && input.firstDelayMs <= 15e3 && Number.isSafeInteger(input.cooldownMinutes) && input.cooldownMinutes >= 30 && input.cooldownMinutes <= 1440 && typeof input.title === "string" && input.title.length > 0 && input.title.length <= 80 && typeof input.message === "string" && input.message.length > 0 && input.message.length <= 240 && !/[<>]/.test(input.title + input.message) && !/[\x00-\x1f\x7f]/.test(input.title) && !/[\x00-\x09\x0b-\x1f\x7f]/.test(input.message) && validateStoreUrl(input.iosUrl, "ios") && validateStoreUrl(input.androidUrl, "android") && Number.isSafeInteger(input.revision) && input.revision >= 1;
}
__name(validateAppDownload, "validateAppDownload");
async function bodyJson(request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json" || Number(request.headers.get("content-length") || 0) > 3e3) return null;
  const body4 = await request.text();
  if (body4.length > 3e3) return null;
  try {
    return JSON.parse(body4);
  } catch {
    return null;
  }
}
__name(bodyJson, "bodyJson");
async function handleAppDownloadSettings({ request, actor, db }) {
  const url = new URL(request.url);
  if (url.pathname !== "/v1/admin/website/app-download") return fail7(404, "not_found");
  if (url.search) return fail7(400, "invalid_query");
  if (!["GET", "POST"].includes(request.method)) return fail7(405, "method_not_allowed");
  if (actor?.role !== "owner" || !actor.subject) return fail7(403, "owner_only");
  if (typeof db !== "function") return fail7(503, "config_unavailable");
  try {
    if (request.method === "GET") {
      const row = await db(async (client) => (await client.query(READ)).rows[0]);
      return good({ settings: fromRow2(row) });
    }
    const req = await bodyJson(request);
    if (!req || !["save", "reset"].includes(req.operation) || !Number.isSafeInteger(req.revision) || req.revision < 1) return fail7(400, "invalid_settings");
    const { operation, ...settings } = req;
    const candidate = operation === "reset" ? { ...DEFAULT_APP_DOWNLOAD, revision: req.revision } : settings;
    if (!validateAppDownload(candidate)) return fail7(400, "invalid_settings");
    const saved = await db(async (client) => {
      await client.query("BEGIN");
      try {
        const current = fromRow2((await client.query(READ)).rows[0]);
        if (current.revision !== req.revision) throw Error("revision_conflict");
        const args = [
          candidate.popupEnabled,
          candidate.buttonEnabled,
          candidate.firstDelayMs,
          candidate.cooldownMinutes,
          candidate.title,
          candidate.message,
          candidate.iosUrl,
          candidate.androidUrl,
          current.revision,
          actor.subject
        ];
        const update = await client.query("UPDATE " + TABLE4 + " SET popup_enabled=$1,button_enabled=$2,first_delay_ms=$3,cooldown_minutes=$4,title=$5,message=$6,ios_url=$7,android_url=$8,revision=revision+1,updated_by=$10,updated_at=now() WHERE singleton=true AND revision=$9 RETURNING popup_enabled,button_enabled,first_delay_ms,cooldown_minutes,title,message,ios_url,android_url,revision", args);
        if (update.rows.length !== 1) throw Error("revision_conflict");
        const after = fromRow2(update.rows[0]);
        await client.query(
          "INSERT INTO " + AUDIT5 + "(revision,actor_subject,operation,before_data,after_data) VALUES($1,$2,$3,$4::jsonb,$5::jsonb)",
          [after.revision, actor.subject, req.operation, JSON.stringify(current), JSON.stringify(after)]
        );
        await client.query("COMMIT");
        return after;
      } catch (error7) {
        await client.query("ROLLBACK");
        throw error7;
      }
    });
    return good({ settings: saved });
  } catch (error7) {
    if (error7?.message === "revision_conflict") return fail7(409, "revision_conflict");
    return fail7(503, "config_unavailable");
  }
}
__name(handleAppDownloadSettings, "handleAppDownloadSettings");

// category-display-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var TABLE5 = "fbmn_catalog_private.web_category_display";
var AUDIT6 = "fbmn_catalog_private.web_category_display_audit";
var HEADERS5 = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
var ok5 = /* @__PURE__ */ __name((data2) => Response.json({ data: data2 }, { headers: HEADERS5 }), "ok");
var fail8 = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, { status, headers: HEADERS5 }), "fail");
var CATEGORY = /^p5-(?:[0-9a-f-]{36}|uncategorized)$/;
var LIST_SQL = "SELECT category_id,mode,revision FROM " + TABLE5 + " ORDER BY category_id LIMIT 2001";
var ELIGIBLE_SQL2 = "SELECT s.category_id::text AS category_id,c.category_label FROM fbmn_catalog.skus s JOIN fbmn_catalog.publications p ON p.sku_cong_ty=s.sku_cong_ty LEFT JOIN fbmn_catalog.categories c ON c.id=s.category_id WHERE p.channel_code='public_web' AND p.state='published' AND p.published_at IS NOT NULL ORDER BY s.sku_cong_ty LIMIT 10001";
function categoriesFrom(rows) {
  if (rows.length > 1e4) throw Error("too_many_skus");
  const categories = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const categoryId = row.category_id ? "p5-" + String(row.category_id) : "p5-uncategorized";
    if (!CATEGORY.test(categoryId)) throw Error("invalid_public_category");
    const previous = categories.get(categoryId);
    if (previous) previous.skuCount++;
    else categories.set(categoryId, { categoryId, name: String(row.category_label || "Ch\u01B0a ph\xE2n lo\u1EA1i"), skuCount: 1 });
  }
  return [...categories.values()];
}
__name(categoriesFrom, "categoriesFrom");
async function readBody2(request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json" || Number(request.headers.get("content-length") || 0) > 3e3) return null;
  const body4 = await request.text();
  if (body4.length > 3e3) return null;
  try {
    return JSON.parse(body4);
  } catch {
    return null;
  }
}
__name(readBody2, "readBody");
async function handleCategoryDisplay({ request, actor, db }) {
  const url = new URL(request.url);
  if (url.pathname !== "/v1/admin/website/category-display") return fail8(404, "not_found");
  if (url.search) return fail8(400, "invalid_query");
  if (!["GET", "POST"].includes(request.method)) return fail8(405, "method_not_allowed");
  if (typeof db !== "function") return fail8(503, "display_unavailable");
  try {
    if (request.method === "GET") {
      const data2 = await db(async (client) => {
        const [rows, eligible] = await Promise.all([client.query(LIST_SQL), client.query(ELIGIBLE_SQL2)]);
        if (rows.rows.length > 2e3) throw Error("too_many_categories");
        const byId = new Map(rows.rows.map((row) => [String(row.category_id), row]));
        return categoriesFrom(eligible.rows).map((category) => {
          const row = byId.get(category.categoryId);
          return { ...category, mode: row?.mode === "sku" ? "sku" : "family", revision: row ? Number(row.revision) : 0 };
        });
      });
      return ok5({ categories: data2 });
    }
    const body4 = await readBody2(request);
    if (!body4 || typeof body4 !== "object" || Array.isArray(body4) || body4.operation !== "save" || typeof body4.categoryId !== "string" || !CATEGORY.test(body4.categoryId) || !["family", "sku"].includes(body4.mode) || !Number.isSafeInteger(body4.revision) || body4.revision < 0)
      return fail8(400, "invalid_display");
    const saved = await db(async (client) => {
      await client.query("BEGIN");
      try {
        const available = categoriesFrom((await client.query(ELIGIBLE_SQL2)).rows);
        if (!available.some((x) => x.categoryId === body4.categoryId)) throw Error("invalid_display");
        const old = (await client.query("SELECT mode,revision FROM " + TABLE5 + " WHERE category_id=$1 FOR UPDATE", [body4.categoryId])).rows[0];
        const previous = { categoryId: body4.categoryId, mode: old?.mode ?? "family", revision: old ? Number(old.revision) : 0 };
        if (previous.revision !== body4.revision) throw Error("revision_conflict");
        const updated = old ? await client.query(
          "UPDATE " + TABLE5 + " SET mode=$2,revision=revision+1,updated_by=$3,updated_at=now() WHERE category_id=$1 AND revision=$4 RETURNING category_id,mode,revision",
          [body4.categoryId, body4.mode, actor.subject, body4.revision]
        ) : await client.query("INSERT INTO " + TABLE5 + "(category_id,mode,revision,updated_by) VALUES($1,$2,1,$3) RETURNING category_id,mode,revision", [body4.categoryId, body4.mode, actor.subject]);
        if (updated.rows.length !== 1) throw Error("revision_conflict");
        const row = updated.rows[0];
        const after = { categoryId: String(row.category_id), mode: String(row.mode), revision: Number(row.revision) };
        await client.query(
          "INSERT INTO " + AUDIT6 + "(category_id,revision,actor_subject,before_data,after_data) VALUES($1,$2,$3,$4::jsonb,$5::jsonb)",
          [after.categoryId, after.revision, actor.subject, JSON.stringify(previous), JSON.stringify(after)]
        );
        await client.query("COMMIT");
        return after;
      } catch (error7) {
        await client.query("ROLLBACK");
        throw error7;
      }
    });
    return ok5({ category: saved });
  } catch (error7) {
    if (error7?.message === "revision_conflict") return fail8(409, "revision_conflict");
    if (error7?.message === "invalid_display") return fail8(400, "invalid_display");
    return fail8(503, "display_unavailable");
  }
}
__name(handleCategoryDisplay, "handleCategoryDisplay");

// seo-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var TABLE6 = "fbmn_catalog_private.web_seo_settings";
var AUDIT7 = "fbmn_catalog_private.web_seo_settings_audit";
var HEADERS6 = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
var ok6 = /* @__PURE__ */ __name((data2) => Response.json({ data: data2 }, { headers: HEADERS6 }), "ok");
var fail9 = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, { status, headers: HEADERS6 }), "fail");
var KINDS = /* @__PURE__ */ new Set(["product", "category", "article", "promotion"]);
var MODES = /* @__PURE__ */ new Set(["auto", "custom", "noindex"]);
var SLUG2 = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var validSlug = /* @__PURE__ */ __name((kind, slug) => typeof slug === "string" && slug.length <= 100 && SLUG2.test(slug) && (kind === "product" ? /^sku-[a-f0-9]{32}$/.test(slug) : kind === "category" ? /^cat-[a-f0-9]{32}$/.test(slug) || slug === "chua-phan-loai" : true), "validSlug");
var plain2 = /* @__PURE__ */ __name((v, max) => typeof v === "string" && v.length <= max && v === v.trim() && !/[<>\x00-\x1f\x7f]/.test(v), "plain");
var validMedia = /* @__PURE__ */ __name((path2) => path2 === null || typeof path2 === "string" && /^\/api\/catalogue-image\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(path2), "validMedia");
function parseSeoSetting(body4) {
  if (!body4 || typeof body4 !== "object" || Array.isArray(body4) || body4.operation !== "save" || !KINDS.has(body4.kind) || !validSlug(body4.kind, body4.slug) || !MODES.has(body4.mode) || !Number.isSafeInteger(body4.revision) || body4.revision < 0 || body4.revision > 2147483646 || !plain2(body4.title, 180) || !plain2(body4.description, 400) || !validMedia(body4.ogImagePath ?? null)) return null;
  if (body4.mode === "auto" && (body4.title || body4.description || body4.ogImagePath)) return null;
  if (body4.kind !== "product" && body4.ogImagePath) return null;
  if (body4.mode === "custom" && !(body4.title || body4.description || body4.ogImagePath)) return null;
  return {
    kind: body4.kind,
    slug: body4.slug,
    mode: body4.mode,
    title: body4.title,
    description: body4.description,
    image: body4.ogImagePath ?? null,
    revision: body4.revision
  };
}
__name(parseSeoSetting, "parseSeoSetting");
async function body2(request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json" || Number(request.headers.get("content-length") || 0) > 4e3) return null;
  const raw = await request.text();
  if (raw.length > 4e3) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
__name(body2, "body");
async function handleSeoSettings({ request, actor, db }) {
  if (actor?.role !== "owner") return fail9(403, "owner_required");
  const url = new URL(request.url);
  if (url.pathname !== "/v1/admin/website/seo") return fail9(400, "invalid_route");
  if (request.method !== "GET" && url.search) return fail9(400, "invalid_query");
  const pageRaw = url.searchParams.get("page");
  if (request.method === "GET" && (url.searchParams.size > 1 || pageRaw !== null && (!/^[1-9]\d{0,1}$/.test(pageRaw) || Number(pageRaw) > 50)))
    return fail9(400, "invalid_page");
  const page = pageRaw === null ? 1 : Number(pageRaw);
  if (typeof db !== "function") return fail9(503, "seo_unavailable");
  if (request.method === "GET") {
    try {
      const result = await db((c) => c.query('SELECT kind,slug,mode,seo_title AS title,meta_description AS description,og_image_path AS "ogImagePath",revision,updated_at FROM ' + TABLE6 + " ORDER BY kind,slug LIMIT 201 OFFSET $1", [200 * (page - 1)]));
      return ok6({ items: result.rows.slice(0, 200), page, hasMore: result.rows.length > 200 });
    } catch {
      return fail9(503, "seo_unavailable");
    }
  }
  if (request.method !== "POST") return fail9(405, "method_not_allowed");
  const input = parseSeoSetting(await body2(request));
  if (!input) return fail9(400, "invalid_seo_setting");
  try {
    const record3 = await db(async (c) => {
      await c.query("BEGIN");
      try {
        const previous = await c.query("SELECT * FROM " + TABLE6 + " WHERE kind=$1 AND slug=$2 FOR UPDATE", [input.kind, input.slug]);
        const old = previous.rows[0] ?? null;
        if (Number(old?.revision ?? 0) !== input.revision) throw Error("revision_conflict");
        const params = [input.kind, input.slug, input.mode, input.title, input.description, input.image, actor.subject];
        const result = old ? await c.query("UPDATE " + TABLE6 + " SET mode=$3,seo_title=$4,meta_description=$5,og_image_path=$6,revision=revision+1,updated_by=$7,updated_at=now() WHERE kind=$1 AND slug=$2 RETURNING *", params) : await c.query("INSERT INTO " + TABLE6 + "(kind,slug,mode,seo_title,meta_description,og_image_path,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *", params);
        const next = result.rows[0];
        if (!next) throw Error("seo_unavailable");
        await c.query(
          "INSERT INTO " + AUDIT7 + " (kind,slug,actor_subject,revision,before_data,after_data) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb)",
          [
            input.kind,
            input.slug,
            actor.subject,
            Number(next.revision),
            old ? JSON.stringify(old) : null,
            JSON.stringify(next)
          ]
        );
        await c.query("COMMIT");
        return next;
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      }
    });
    return ok6({ item: {
      kind: record3.kind,
      slug: record3.slug,
      mode: record3.mode,
      title: record3.seo_title,
      description: record3.meta_description,
      ogImagePath: record3.og_image_path,
      revision: Number(record3.revision),
      updated_at: record3.updated_at
    } });
  } catch (e) {
    return e?.message === "revision_conflict" ? fail9(409, "revision_conflict") : fail9(503, "seo_unavailable");
  }
}
__name(handleSeoSettings, "handleSeoSettings");

// chat-history-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var C = "fbmn_catalog_private.chat_conversations";
var T = "fbmn_catalog_private.chat_turns";
var SESSION = /^[0-9a-f]{36}$/;
var HEADERS7 = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
var ok7 = /* @__PURE__ */ __name((data2) => Response.json({ data: data2 }, { headers: HEADERS7 }), "ok");
var fail10 = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, { status, headers: HEADERS7 }), "fail");
function safeChatText(value, max) {
  return value.replace(/[\u0000]/g, "").replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*/gi, "[\u0111\xE3 \u1EA9n]").replace(/(?:private_key|access_token|refresh_token|authorization|password|mật khẩu)\s*["']?\s*[:=]\s*["']?[^\s,}]+/gi, "[\u0111\xE3 \u1EA9n]").replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "[\u0111\xE3 \u1EA9n]").replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[\u0111\xE3 \u1EA9n]").replace(/\bya29\.[A-Za-z0-9_-]+/g, "[\u0111\xE3 \u1EA9n]").replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[\u0111\xE3 \u1EA9n]").replace(/(?<![A-Za-z0-9])(?:[a-f0-9]{0,4}:){2,}[a-f0-9:]{0,39}(?![A-Za-z0-9])/gi, "[\u0111\xE3 \u1EA9n]").trim().slice(0, max) || "[\u0111\xE3 \u1EA9n]";
}
__name(safeChatText, "safeChatText");
async function saveChatTurn(client, { session, question, answer }) {
  if (!SESSION.test(session)) throw Error("invalid_session");
  await client.query(
    "WITH conversation AS (INSERT INTO " + C + "(session_id) VALUES($1) ON CONFLICT(session_id) DO UPDATE SET updated_at=now() RETURNING session_id) INSERT INTO " + T + "(session_id,question,answer) SELECT session_id,$2,$3 FROM conversation",
    [session, safeChatText(question, 300), answer === null ? null : safeChatText(answer, 3e3)]
  );
}
__name(saveChatTurn, "saveChatTurn");
var date2 = /* @__PURE__ */ __name((v) => new Date(v).toISOString(), "date");
function day2(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = /* @__PURE__ */ new Date(v + "T00:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v ? v : null;
}
__name(day2, "day");
function parseQuery(url) {
  const q = url.searchParams, allowed = ["page", "q", "from", "to", "session"];
  if ([...q.keys()].some((k) => !allowed.includes(k) || q.getAll(k).length !== 1)) return null;
  const page = q.has("page") ? Number(q.get("page")) : 1, search = (q.get("q") || "").trim();
  const from = q.get("from"), to = q.get("to"), session = q.get("session");
  if (!Number.isSafeInteger(page) || page < 1 || page > 1e4 || search.length > 100 || from !== null && !day2(from) || to !== null && !day2(to) || from && to && from > to || session !== null && (!SESSION.test(session) || q.has("q") || from !== null || to !== null)) return null;
  return { page, search, from, to, session };
}
__name(parseQuery, "parseQuery");
async function handleChatHistory({ request, actor, db }) {
  const url = new URL(request.url);
  if (url.pathname !== "/v1/admin/website/chat-history") return fail10(404, "not_found");
  if (actor?.role !== "owner") return fail10(403, "forbidden");
  if (!["GET", "POST"].includes(request.method)) return fail10(405, "method_not_allowed");
  if (typeof db !== "function") return fail10(503, "history_unavailable");
  try {
    if (request.method === "POST") {
      if (url.search || request.headers.get("content-type")?.split(";")[0] !== "application/json" || Number(request.headers.get("content-length") || 0) > 512) return fail10(400, "invalid_request");
      const raw = await request.text();
      if (raw.length > 512) return fail10(400, "invalid_request");
      let body4;
      try {
        body4 = JSON.parse(raw);
      } catch {
        return fail10(400, "invalid_request");
      }
      if (!body4 || Object.keys(body4).length !== 2 || body4.operation !== "delete" || typeof body4.session !== "string" || !SESSION.test(body4.session)) return fail10(400, "invalid_request");
      const deleted = await db(async (client) => (await client.query("DELETE FROM " + C + " WHERE session_id=$1 RETURNING session_id", [body4.session])).rows.length === 1);
      return deleted ? ok7({ deleted: true }) : fail10(404, "not_found");
    }
    const filter = parseQuery(url);
    if (!filter) return fail10(400, "invalid_query");
    const { page, search, from, to, session } = filter;
    if (session) {
      const data3 = await db(async (client) => {
        const rows = (await client.query("SELECT id::text,question,answer,created_at FROM " + T + " WHERE session_id=$1 ORDER BY id LIMIT 26 OFFSET $2", [session, (page - 1) * 25])).rows;
        const exists = rows.length > 0 || (await client.query("SELECT session_id FROM " + C + " WHERE session_id=$1", [session])).rows.length > 0;
        return exists ? { session, page, hasMore: rows.length > 25, turns: rows.slice(0, 25).map((row) => ({ id: row.id, question: row.question, answer: row.answer, createdAt: date2(row.created_at) })) } : null;
      });
      return data3 ? ok7(data3) : fail10(404, "not_found");
    }
    const data2 = await db(async (client) => {
      const rows = (await client.query("SELECT c.session_id,c.created_at,c.updated_at, (SELECT count(*)+count(answer) FROM " + T + " WHERE session_id=c.session_id)::int AS message_count, (SELECT left(coalesce(answer,question),240) FROM " + T + " WHERE session_id=c.session_id ORDER BY id DESC LIMIT 1) AS latest FROM " + C + " c WHERE ($1::text='' OR strpos(c.session_id,lower($1))>0 OR EXISTS (SELECT 1 FROM " + T + " t WHERE t.session_id=c.session_id AND (to_tsvector('simple'::regconfig,t.question || ' ' || coalesce(t.answer,'')) @@ plainto_tsquery('simple'::regconfig,$1) OR strpos(lower(t.question || ' ' || coalesce(t.answer,'')),lower($1))>0))) AND ($2::date IS NULL OR c.updated_at >= ($2::date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')) AND ($3::date IS NULL OR c.updated_at < (($3::date+1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')) ORDER BY c.updated_at DESC,c.session_id LIMIT 31 OFFSET $4", [search, from, to, (page - 1) * 30])).rows;
      return { page, hasMore: rows.length > 30, conversations: rows.slice(0, 30).map((row) => ({ session: row.session_id, createdAt: date2(row.created_at), updatedAt: date2(row.updated_at), messageCount: row.message_count, latest: row.latest })) };
    });
    return ok7(data2);
  } catch {
    return fail10(503, "history_unavailable");
  }
}
__name(handleChatHistory, "handleChatHistory");

// chatbot-config-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var TABLE7 = "fbmn_catalog_private.website_chatbot_config";
var HEADERS8 = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
var ok8 = /* @__PURE__ */ __name((data2) => Response.json({ data: data2 }, { headers: HEADERS8 }), "ok");
var fail11 = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, { status, headers: HEADERS8 }), "fail");
var KEYS = ["projectId", "location", "agentId", "environmentId", "model"];
var SUPPORTED = ["agent-default", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite"];
var LOCATIONS = /* @__PURE__ */ new Set(["global", "asia-south1", "asia-southeast1", "asia-southeast2", "asia-northeast1", "australia-southeast1", "eu", "europe-west1", "europe-west2", "europe-west3", "europe-west4", "europe-west6", "northamerica-northeast1", "us", "us-central1", "us-east1", "us-west1"]);
var UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function normalizeConfig(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some((k) => !KEYS.includes(k))) return null;
  if (!KEYS.every((k) => typeof input[k] === "string")) return null;
  const c = Object.fromEntries(KEYS.map((k) => [k, input[k].trim()]));
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(c.projectId) || !LOCATIONS.has(c.location) || !UUID4.test(c.agentId) || c.environmentId !== "draft" && !UUID4.test(c.environmentId) || c.model !== "" && !SUPPORTED.includes(c.model)) return null;
  return c;
}
__name(normalizeConfig, "normalizeConfig");
function parseConfigFile(raw) {
  if (typeof raw !== "string" || raw.length > 16384) return null;
  let s = raw.replace(/^\uFEFF/, "").trim();
  s = s.replace(/^(?:export\s+default\s+|module\.exports\s*=\s*)/, "").replace(/;\s*$/, "");
  try {
    return normalizeConfig(JSON.parse(s));
  } catch {
    return null;
  }
}
__name(parseConfigFile, "parseConfigFile");
var PROJECT = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;
function parseServiceAccount(raw) {
  if (typeof raw !== "string" || raw.length > 16384) return null;
  try {
    const v = JSON.parse(raw.replace(/^\uFEFF/, "").trim().replace(/^(?:export\s+default\s+|module\.exports\s*=\s*)/, "").replace(/;\s*$/, ""));
    if (v?.type !== "service_account" || !PROJECT.test(v.project_id || "") || typeof v.client_email !== "string" || !/^[a-z0-9._-]+@[a-z0-9.-]+\.iam\.gserviceaccount\.com$/i.test(v.client_email) || typeof v.private_key !== "string" || !/^-----BEGIN PRIVATE KEY-----\r?\n[\s\S]+-----END PRIVATE KEY-----\r?\n?$/.test(v.private_key)) return null;
    return { type: "service_account", project_id: v.project_id, client_email: v.client_email, private_key: v.private_key };
  } catch {
    return null;
  }
}
__name(parseServiceAccount, "parseServiceAccount");
function cxHost(location) {
  return location === "global" ? "dialogflow.googleapis.com" : location + "-dialogflow.googleapis.com";
}
__name(cxHost, "cxHost");
async function listPages(root, field, token, fetcher, signal) {
  const rows = [];
  let page = "";
  for (let i = 0; i < 10; i++) {
    const query = new URLSearchParams({ pageSize: "100", ...page ? { pageToken: page } : {} });
    const data2 = await googleJson(root + "?" + query, token, fetcher, signal);
    rows.push(...Array.isArray(data2[field]) ? data2[field] : []);
    page = typeof data2.nextPageToken === "string" ? data2.nextPageToken : "";
    if (!page) return rows;
  }
  throw Error("google_unavailable");
}
__name(listPages, "listPages");
async function listCxAgents(projectId, secret, fetcher = fetch, selectedLocation = "all") {
  if (!PROJECT.test(projectId) || !(selectedLocation === "all" || LOCATIONS.has(selectedLocation))) throw Error("invalid_config");
  const token = await tokenFor(secret, fetcher), signal = AbortSignal.timeout(45e3);
  let regions = [selectedLocation], locationDiscoveryFailed = false;
  if (selectedLocation === "all") {
    try {
      const locations = await listPages("https://dialogflow.googleapis.com/v3/projects/" + projectId + "/locations", "locations", token, fetcher, signal);
      regions = [.../* @__PURE__ */ new Set(["global", ...locations.map((x) => x.locationId || x.name?.split("/").pop()).filter((x) => LOCATIONS.has(x))])];
    } catch (e) {
      if (!["google_permission_denied", "google_resource_not_found", "google_unavailable"].includes(e?.message)) throw e;
      regions = [...LOCATIONS];
      locationDiscoveryFailed = true;
    }
  }
  const agents = [], failedLocations = [], errors = [];
  for (let i = 0; i < regions.length; i += 4) await Promise.all(regions.slice(i, i + 4).map(async (location) => {
    const parent = "projects/" + projectId + "/locations/" + location + "/agents";
    try {
      const rows = await listPages("https://" + cxHost(location) + "/v3/" + parent, "agents", token, fetcher, signal);
      for (const row of rows) {
        const id = row.name?.startsWith(parent + "/") ? row.name.slice(parent.length + 1) : "";
        if (UUID4.test(id)) agents.push({ id, location, name: typeof row.displayName === "string" ? row.displayName.slice(0, 200) : id });
      }
    } catch (e) {
      failedLocations.push(location);
      errors.push(e?.message);
    }
  }));
  if (failedLocations.length === regions.length || !agents.length && failedLocations.length) {
    for (const code of ["google_api_disabled", "google_auth_failed", "google_permission_denied", "google_quota", "google_timeout", "google_network_error", "google_resource_not_found"])
      if (errors.includes(code)) throw Error(code);
    if (failedLocations.length === regions.length) throw Error("google_unavailable");
  }
  return { agents: agents.sort((a, b) => a.name.localeCompare(b.name)), failedLocations, locationDiscoveryFailed };
}
__name(listCxAgents, "listCxAgents");
async function listCxEnvironments(config2, secret, fetcher = fetch) {
  const token = await tokenFor(secret, fetcher), signal = AbortSignal.timeout(25e3);
  const parent = "projects/" + config2.projectId + "/locations/" + config2.location + "/agents/" + config2.agentId + "/environments";
  const rows = await listPages("https://" + cxHost(config2.location) + "/v3/" + parent, "environments", token, fetcher, signal);
  return { environments: rows.flatMap((row) => {
    const id = row.name?.startsWith(parent + "/") ? row.name.slice(parent.length + 1) : "";
    return UUID4.test(id) ? [{ id, name: typeof row.displayName === "string" ? row.displayName.slice(0, 200) : id }] : [];
  }) };
}
__name(listCxEnvironments, "listCxEnvironments");
function fromRow3(row) {
  if (!row) throw Error("config_unavailable");
  return { config: row.config, revision: Number(row.revision) };
}
__name(fromRow3, "fromRow");
async function googleError(response, stage) {
  if (response.status >= 300 && response.status < 400) return Error("google_unavailable");
  if (response.status === 429) return Error("google_quota");
  if (response.status === 401) return Error("google_auth_failed");
  if (stage === "oauth" && response.status === 400) return Error("google_auth_failed");
  if (response.status === 403) {
    let payload;
    try {
      payload = await response.json();
    } catch {
    }
    const details = payload?.error?.details;
    if (Array.isArray(details) && details.some((d) => d?.reason === "SERVICE_DISABLED")) return Error("google_api_disabled");
    return Error("google_permission_denied");
  }
  if (response.status === 404) return Error("google_resource_not_found");
  return Error("google_unavailable");
}
__name(googleError, "googleError");
async function googleJson(url, token, fetcher, signal) {
  let response;
  try {
    response = await fetcher(url, { headers: { Authorization: "Bearer " + token, Accept: "application/json" }, redirect: "manual", signal });
  } catch (e) {
    throw Error(e?.name === "TimeoutError" || e?.name === "AbortError" ? "google_timeout" : "google_network_error");
  }
  if (!response.ok) throw await googleError(response, "api");
  try {
    return await response.json();
  } catch {
    throw Error("google_unavailable");
  }
}
__name(googleJson, "googleJson");
var b64url = /* @__PURE__ */ __name((bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), "b64url");
var utf8 = new TextEncoder();
async function tokenFor(secret, fetcher = fetch) {
  let key2;
  try {
    key2 = JSON.parse(secret);
  } catch {
    throw Error("credentials_missing");
  }
  if (key2?.type !== "service_account" || typeof key2.client_email !== "string" || typeof key2.private_key !== "string") throw Error("credentials_missing");
  let jwt;
  try {
    const der = key2.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
    const bytes = Uint8Array.from(atob(der), (c) => c.charCodeAt(0));
    const pk = await crypto.subtle.importKey("pkcs8", bytes, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
    const now = Math.floor(Date.now() / 1e3);
    const input = b64url(utf8.encode(JSON.stringify({ alg: "RS256", typ: "JWT" }))) + "." + b64url(utf8.encode(JSON.stringify({
      iss: key2.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 300
    })));
    jwt = input + "." + b64url(new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pk, utf8.encode(input))));
  } catch {
    throw Error("google_invalid_key");
  }
  let response;
  try {
    response = await fetcher("https://oauth2.googleapis.com/token", {
      method: "POST",
      redirect: "manual",
      signal: AbortSignal.timeout(12e3),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt })
    });
  } catch (e) {
    throw Error(e?.name === "TimeoutError" || e?.name === "AbortError" ? "google_timeout" : "google_network_error");
  }
  if (!response.ok) throw await googleError(response, "oauth");
  let data2;
  try {
    data2 = await response.json();
  } catch {
    throw Error("google_auth_failed");
  }
  if (typeof data2.access_token !== "string" || !data2.access_token) throw Error("google_auth_failed");
  return data2.access_token;
}
__name(tokenFor, "tokenFor");
async function discoverCx(config2, secret, fetcher = fetch) {
  const signal = AbortSignal.timeout(25e3);
  const token = await tokenFor(secret, fetcher);
  const host = config2.location === "global" ? "dialogflow.googleapis.com" : config2.location + "-dialogflow.googleapis.com";
  const path2 = "projects/" + config2.projectId + "/locations/" + config2.location + "/agents/" + config2.agentId;
  const root = "https://" + host + "/v3beta1/" + path2;
  const agent = await googleJson(root, token, fetcher, signal);
  if (agent.name !== path2) throw Error("google_unavailable");
  if (config2.environmentId !== "draft") {
    const env2 = await googleJson(root + "/environments/" + config2.environmentId, token, fetcher, signal);
    if (env2.name !== path2 + "/environments/" + config2.environmentId) throw Error("google_unavailable");
  }
  const lang = typeof agent.defaultLanguageCode === "string" ? agent.defaultLanguageCode : "vi";
  let current = "";
  try {
    const settings = await googleJson(root + "/generativeSettings?languageCode=" + encodeURIComponent(lang), token, fetcher, signal);
    const value = settings.llmModelSettings?.model;
    if (typeof value === "string" && /^[a-z0-9-]{1,80}$/.test(value)) current = value;
  } catch (e) {
    if (!["google_resource_not_found", "google_permission_denied"].includes(e?.message)) throw e;
  }
  const models = ["agent-default", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
  if (SUPPORTED.includes(current) && !models.includes(current)) models.push(current);
  return { models, currentModel: current };
}
__name(discoverCx, "discoverCx");
async function handleChatbotConfig({ request, actor, db, googleSecret, credentialStore, discover = discoverCx, listAgents = listCxAgents, listEnvironments = listCxEnvironments }) {
  const url = new URL(request.url);
  if (url.pathname !== "/v1/admin/website/chatbot-config") return fail11(404, "not_found");
  if (actor?.role !== "owner") return fail11(403, "forbidden");
  if (url.search) return fail11(400, "invalid_query");
  if (!["GET", "POST"].includes(request.method)) return fail11(405, "method_not_allowed");
  if (typeof db !== "function") return fail11(503, "config_unavailable");
  try {
    if (request.method === "GET") {
      const data3 = await db(async (client) => fromRow3((await client.query("SELECT config,revision FROM " + TABLE7 + " WHERE singleton=true")).rows[0]));
      return ok8({ ...data3, credentialsConfigured: Boolean(await credentialStore?.read(data3.revision) || googleSecret) });
    }
    if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return fail11(415, "invalid_content_type");
    if (Number(request.headers.get("content-length") || 0) > 2e4) return fail11(413, "too_large");
    const raw = await request.text();
    if (raw.length > 2e4) return fail11(413, "too_large");
    let body4;
    try {
      body4 = JSON.parse(raw);
    } catch {
      return fail11(400, "invalid_config");
    }
    if (!body4 || typeof body4 !== "object" || Array.isArray(body4)) return fail11(400, "invalid_config");
    const account = body4.credential === void 0 ? null : parseServiceAccount(body4.credential);
    if (body4.credential !== void 0 && !account) return fail11(400, "invalid_config");
    const readStored = /* @__PURE__ */ __name(async () => {
      const row = await db(async (client) => fromRow3((await client.query("SELECT config,revision FROM " + TABLE7 + " WHERE singleton=true")).rows[0]));
      return await credentialStore?.read(row.revision) || googleSecret;
    }, "readStored");
    const getSecret = /* @__PURE__ */ __name(async () => account ? JSON.stringify(account) : await readStored(), "getSecret");
    if (body4.operation === "list_agents") {
      if (Object.keys(body4).some((k) => !["operation", "projectId", "credential", "location"].includes(k)) || !PROJECT.test(body4.projectId || "") || account && account.project_id !== body4.projectId) return fail11(400, "invalid_config");
      const secret = await getSecret();
      if (!secret) return fail11(503, "credentials_missing");
      const location = body4.location ?? "all";
      if (location !== "all" && !LOCATIONS.has(location)) return fail11(400, "invalid_config");
      return ok8(await listAgents(body4.projectId, secret, fetch, location));
    }
    if (body4.operation === "import") {
      if (Object.keys(body4).some((k) => !["operation", "raw"].includes(k))) return fail11(400, "invalid_config");
      const config3 = parseConfigFile(body4.raw);
      return config3 ? ok8({ config: config3 }) : fail11(400, "invalid_config");
    }
    if (Object.keys(body4).some((k) => !["operation", "config", "revision", "credential"].includes(k))) return fail11(400, "invalid_config");
    const config2 = normalizeConfig(body4.config);
    if (!config2 || account && account.project_id !== config2.projectId) return fail11(400, "invalid_config");
    if (body4.operation === "list_environments") {
      const secret = await getSecret();
      if (!secret) return fail11(503, "credentials_missing");
      return ok8(await listEnvironments(config2, secret));
    }
    if (body4.operation === "discover") {
      const secret = await getSecret();
      if (!secret) return fail11(503, "credentials_missing");
      return ok8(await discover(config2, secret));
    }
    if (body4.operation !== "save" || !Number.isSafeInteger(body4.revision) || body4.revision < 1) return fail11(400, "invalid_config");
    if (account && (!credentialStore || !config2.model)) return fail11(400, "invalid_config");
    if (config2.model) {
      const secret = await getSecret();
      if (!secret) return fail11(503, "credentials_missing");
      const result = await discover(config2, secret);
      if (!result.models.includes(config2.model)) return fail11(400, "model_unavailable");
    }
    const data2 = await db(async (client) => {
      await client.query("BEGIN");
      try {
        const before = fromRow3((await client.query("SELECT config,revision FROM " + TABLE7 + " WHERE singleton=true FOR UPDATE")).rows[0]);
        if (before.revision !== body4.revision) throw Error("revision_conflict");
        const retained = account ? JSON.stringify(account) : await credentialStore?.read(before.revision);
        if (credentialStore) await credentialStore.write(before.revision + 1, retained || "");
        const after = fromRow3((await client.query("UPDATE " + TABLE7 + " SET config=$1::jsonb,revision=revision+1,updated_by=$2,updated_at=now() WHERE singleton=true RETURNING config,revision", [JSON.stringify(config2), actor.subject])).rows[0]);
        await client.query("INSERT INTO " + TABLE7 + "_audit(revision,actor_subject,before_data,after_data) VALUES($1,$2,$3::jsonb,$4::jsonb)", [after.revision, actor.subject, JSON.stringify(before.config), JSON.stringify(after.config)]);
        await client.query("COMMIT");
        return after;
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    });
    return ok8(data2);
  } catch (e) {
    if (e?.message === "revision_conflict") return fail11(409, "revision_conflict");
    if (e?.message === "credentials_missing") return fail11(503, "credentials_missing");
    return fail11(503, bodyUnavailable(e));
  }
}
__name(handleChatbotConfig, "handleChatbotConfig");
function bodyUnavailable(e) {
  return ["google_unavailable", "google_invalid_key", "google_auth_failed", "google_api_disabled", "google_permission_denied", "google_resource_not_found", "google_quota", "google_timeout", "google_network_error", "credentials_storage_unavailable"].includes(e?.message) ? e.message : "config_unavailable";
}
__name(bodyUnavailable, "bodyUnavailable");

// contact-requests-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var TABLE8 = "fbmn_catalog_private.contact_requests";
var AUDIT8 = "fbmn_catalog_private.contact_request_audit";
var HEADERS9 = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
var ok9 = /* @__PURE__ */ __name((data2) => Response.json({ data: data2 }, { headers: HEADERS9 }), "ok");
var fail12 = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, { status, headers: HEADERS9 }), "fail");
var UUID5 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var LIST = "SELECT id::text,name,company,email,phone,province,customer_group,interests,message,status,consent_at,created_at,updated_at FROM " + TABLE8 + " ORDER BY created_at DESC,id DESC LIMIT 51 OFFSET $1";
function item(row) {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone),
    company: String(row.company),
    province: String(row.province),
    customerGroup: String(row.customer_group),
    interests: row.interests,
    message: String(row.message),
    status: String(row.status),
    consentAt: new Date(row.consent_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}
__name(item, "item");
async function readJson(request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json" || Number(request.headers.get("content-length") || 0) > 2048) return null;
  const text = await request.text();
  if (text.length > 2048) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
__name(readJson, "readJson");
async function handleContactRequests({ request, actor, db }) {
  const url = new URL(request.url);
  if (url.pathname !== "/v1/admin/website/contact-requests") return fail12(404, "not_found");
  if (actor?.role !== "owner") return fail12(403, "forbidden");
  if (!["GET", "POST"].includes(request.method)) return fail12(405, "method_not_allowed");
  if (typeof db !== "function") return fail12(503, "inbox_unavailable");
  try {
    if (request.method === "GET") {
      if ([...url.searchParams.keys()].some((k) => k !== "page") || url.searchParams.getAll("page").length > 1)
        return fail12(400, "invalid_query");
      const page = url.searchParams.has("page") ? Number(url.searchParams.get("page")) : 1;
      if (!Number.isSafeInteger(page) || page < 1 || page > 100) return fail12(400, "invalid_page");
      const data3 = await db(async (client) => {
        await client.query("BEGIN");
        try {
          const expired = await client.query("DELETE FROM " + TABLE8 + " WHERE created_at<now()-interval '90 days' RETURNING id");
          for (const row of expired.rows) await client.query(
            "INSERT INTO " + AUDIT8 + "(request_id,operation,actor_subject) VALUES($1,'expire',$2)",
            [row.id, actor.subject]
          );
          const result = await client.query(LIST, [(page - 1) * 50]);
          await client.query("COMMIT");
          return { requests: result.rows.slice(0, 50).map(item), page, hasMore: result.rows.length > 50 };
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        }
      });
      return ok9(data3);
    }
    if (url.search) return fail12(400, "invalid_query");
    const body4 = await readJson(request);
    if (!body4 || typeof body4 !== "object" || Array.isArray(body4) || typeof body4.id !== "string" || !UUID5.test(body4.id) || !["set_status", "delete"].includes(body4.operation) || !["new", "handled"].includes(body4.expectedStatus)) return fail12(400, "invalid_operation");
    if (body4.operation === "set_status" && (!["new", "handled"].includes(body4.status) || Object.keys(body4).some((k) => !["id", "operation", "expectedStatus", "status"].includes(k))))
      return fail12(400, "invalid_status");
    if (body4.operation === "delete" && Object.keys(body4).some((k) => !["id", "operation", "expectedStatus"].includes(k)))
      return fail12(400, "invalid_operation");
    const data2 = await db(async (client) => {
      await client.query("BEGIN");
      try {
        const current = (await client.query("SELECT status FROM " + TABLE8 + " WHERE id=$1 FOR UPDATE", [body4.id])).rows[0];
        if (!current) {
          await client.query("ROLLBACK");
          return { error: "not_found" };
        }
        if (current.status !== body4.expectedStatus) {
          await client.query("ROLLBACK");
          return { error: "revision_conflict" };
        }
        if (body4.operation === "delete") {
          await client.query("DELETE FROM " + TABLE8 + " WHERE id=$1", [body4.id]);
          await client.query(
            "INSERT INTO " + AUDIT8 + "(request_id,operation,actor_subject) VALUES($1,'delete',$2)",
            [body4.id, actor.subject]
          );
          await client.query("COMMIT");
          return { deleted: true };
        }
        if (body4.status === current.status) {
          await client.query("COMMIT");
          return { id: body4.id, status: current.status };
        }
        await client.query(
          "UPDATE " + TABLE8 + " SET status=$2,updated_by=$3,updated_at=now() WHERE id=$1",
          [body4.id, body4.status, actor.subject]
        );
        await client.query(
          "INSERT INTO " + AUDIT8 + "(request_id,operation,actor_subject) VALUES($1,$2,$3)",
          [body4.id, body4.status === "handled" ? "handled" : "reopen", actor.subject]
        );
        await client.query("COMMIT");
        return { id: body4.id, status: body4.status };
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    });
    if (data2.error) return fail12(data2.error === "not_found" ? 404 : 409, data2.error);
    return ok9(data2);
  } catch {
    return fail12(503, "inbox_unavailable");
  }
}
__name(handleContactRequests, "handleContactRequests");

// outsourcing-requests-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var TABLE9 = "fbmn_catalog_private.outsourcing_requests";
var AUDIT9 = "fbmn_catalog_private.outsourcing_request_audit";
var HEADERS10 = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
var ok10 = /* @__PURE__ */ __name((data2) => Response.json({ data: data2 }, { headers: HEADERS10 }), "ok");
var fail13 = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, { status, headers: HEADERS10 }), "fail");
var UUID6 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var LIST2 = "SELECT id::text,name,email,phone,product_type,specifications,quantity,desired_date,details,status,consent_at,created_at,updated_at FROM " + TABLE9 + " ORDER BY created_at DESC,id DESC LIMIT 51 OFFSET $1";
function item2(row) {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone),
    productType: String(row.product_type),
    specifications: String(row.specifications),
    quantity: String(row.quantity),
    desiredDate: String(row.desired_date),
    details: String(row.details),
    status: String(row.status),
    consentAt: new Date(row.consent_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}
__name(item2, "item");
async function readJson2(request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json" || Number(request.headers.get("content-length") || 0) > 2048) return null;
  const text = await request.text();
  if (text.length > 2048) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
__name(readJson2, "readJson");
async function handleOutsourcingRequests({ request, actor, db }) {
  const url = new URL(request.url);
  if (url.pathname !== "/v1/admin/website/outsourcing-requests") return fail13(404, "not_found");
  if (actor?.role !== "owner") return fail13(403, "forbidden");
  if (!["GET", "POST"].includes(request.method)) return fail13(405, "method_not_allowed");
  if (typeof db !== "function") return fail13(503, "inbox_unavailable");
  try {
    if (request.method === "GET") {
      if ([...url.searchParams.keys()].some((k) => k !== "page") || url.searchParams.getAll("page").length > 1)
        return fail13(400, "invalid_query");
      const page = url.searchParams.has("page") ? Number(url.searchParams.get("page")) : 1;
      if (!Number.isSafeInteger(page) || page < 1 || page > 100) return fail13(400, "invalid_page");
      const data3 = await db(async (client) => {
        await client.query("BEGIN");
        try {
          const expired = await client.query("DELETE FROM " + TABLE9 + " WHERE created_at<now()-interval '90 days' RETURNING id");
          for (const row of expired.rows) await client.query(
            "INSERT INTO " + AUDIT9 + "(request_id,operation,actor_subject) VALUES($1,'expire',$2)",
            [row.id, actor.subject]
          );
          const result = await client.query(LIST2, [(page - 1) * 50]);
          await client.query("COMMIT");
          return { requests: result.rows.slice(0, 50).map(item2), page, hasMore: result.rows.length > 50 };
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        }
      });
      return ok10(data3);
    }
    if (url.search) return fail13(400, "invalid_query");
    const body4 = await readJson2(request);
    if (!body4 || typeof body4 !== "object" || Array.isArray(body4) || typeof body4.id !== "string" || !UUID6.test(body4.id) || !["set_status", "delete"].includes(body4.operation) || !["new", "handled"].includes(body4.expectedStatus)) return fail13(400, "invalid_operation");
    if (body4.operation === "set_status" && (!["new", "handled"].includes(body4.status) || Object.keys(body4).some((k) => !["id", "operation", "expectedStatus", "status"].includes(k))))
      return fail13(400, "invalid_status");
    if (body4.operation === "delete" && Object.keys(body4).some((k) => !["id", "operation", "expectedStatus"].includes(k)))
      return fail13(400, "invalid_operation");
    const data2 = await db(async (client) => {
      await client.query("BEGIN");
      try {
        const current = (await client.query("SELECT status FROM " + TABLE9 + " WHERE id=$1 FOR UPDATE", [body4.id])).rows[0];
        if (!current) {
          await client.query("ROLLBACK");
          return { error: "not_found" };
        }
        if (current.status !== body4.expectedStatus) {
          await client.query("ROLLBACK");
          return { error: "revision_conflict" };
        }
        if (body4.operation === "delete") {
          await client.query("DELETE FROM " + TABLE9 + " WHERE id=$1", [body4.id]);
          await client.query(
            "INSERT INTO " + AUDIT9 + "(request_id,operation,actor_subject) VALUES($1,'delete',$2)",
            [body4.id, actor.subject]
          );
          await client.query("COMMIT");
          return { deleted: true };
        }
        if (body4.status === current.status) {
          await client.query("COMMIT");
          return { id: body4.id, status: current.status };
        }
        await client.query(
          "UPDATE " + TABLE9 + " SET status=$2,updated_by=$3,updated_at=now() WHERE id=$1",
          [body4.id, body4.status, actor.subject]
        );
        await client.query(
          "INSERT INTO " + AUDIT9 + "(request_id,operation,actor_subject) VALUES($1,$2,$3)",
          [body4.id, body4.status === "handled" ? "handled" : "reopen", actor.subject]
        );
        await client.query("COMMIT");
        return { id: body4.id, status: body4.status };
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    });
    if (data2.error) return fail13(data2.error === "not_found" ? 404 : 409, data2.error);
    return ok10(data2);
  } catch {
    return fail13(503, "inbox_unavailable");
  }
}
__name(handleOutsourcingRequests, "handleOutsourcingRequests");

// catalogue-books-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// catalogue-pdf-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var BOOKS = "fbmn_catalog_private.website_catalogue_books";
var PDFS = "fbmn_catalog_private.website_catalogue_pdfs";
var AUDIT10 = "fbmn_catalog_private.website_catalogue_audit";
var UUID7 = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
var MAX_CATALOGUE_PDF = 20 * 1024 * 1024;
var PRIVATE = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
var fail14 = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, { status, headers: PRIVATE }), "fail");
var ok11 = /* @__PURE__ */ __name((data2) => Response.json({ data: data2 }, { headers: PRIVATE }), "ok");
var validId = /* @__PURE__ */ __name((v) => typeof v === "string" && UUID7.test(v), "validId");
var validRevision = /* @__PURE__ */ __name((v) => Number.isSafeInteger(v) && v > 0, "validRevision");
function cataloguePdfKey(bookId, fileId) {
  return validId(bookId) && validId(fileId) ? "books/" + bookId + "/pdf/" + fileId + ".pdf" : null;
}
__name(cataloguePdfKey, "cataloguePdfKey");
function validateCataloguePdf(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 100 || bytes.length > MAX_CATALOGUE_PDF) return false;
  const beginning = new TextDecoder("ascii").decode(bytes.subarray(0, 8));
  if (!/^%PDF-[12]\.\d/.test(beginning)) return false;
  const end = new TextDecoder("ascii").decode(bytes.subarray(Math.max(0, bytes.length - 1024)));
  return /%%EOF\s*$/.test(end);
}
__name(validateCataloguePdf, "validateCataloguePdf");
var expose = /* @__PURE__ */ __name((x) => x ? {
  byteSize: Number(x.byte_size),
  visible: x.visible === true,
  downloadEnabled: x.download_enabled === true,
  updatedAt: x.updated_at
} : null, "expose");
async function queryCataloguePdf(client, bookId) {
  const q = await client.query("SELECT byte_size,visible,download_enabled,updated_at FROM " + PDFS + " WHERE book_id=$1::uuid LIMIT 1", [bookId]);
  return expose(q.rows[0]);
}
__name(queryCataloguePdf, "queryCataloguePdf");
var validSettings2 = /* @__PURE__ */ __name((x) => x && typeof x === "object" && !Array.isArray(x) && Object.keys(x).sort().join(",") === "downloadEnabled,id,revision,visible" && validId(x.id) && validRevision(x.revision) && typeof x.visible === "boolean" && typeof x.downloadEnabled === "boolean" && (!x.downloadEnabled || x.visible), "validSettings");
var secureError = /* @__PURE__ */ __name((e) => {
  if (e?.message === "not_found") return fail14(404, "not_found");
  if (["ready_locked", "revision_conflict"].includes(e?.message)) return fail14(409, e.message);
  if (e?.message === "pdf_required") return fail14(422, "pdf_required");
  if (e?.message === "invalid_pdf_settings") return fail14(400, "invalid_pdf_settings");
  return fail14(503, "catalogue_unavailable");
}, "secureError");
async function lock(client, id, revision2) {
  const r = await client.query("SELECT id,title,edition,state,revision,updated_at FROM " + BOOKS + " WHERE id=$1::uuid FOR UPDATE", [id]);
  if (r.rowCount !== 1) throw Error("not_found");
  if (Number(r.rows[0].revision) !== revision2) throw Error("revision_conflict");
  if (r.rows[0].state === "ready") throw Error("ready_locked");
  return r.rows[0];
}
__name(lock, "lock");
async function record2(client, bookId, actor, action, before, after) {
  const rev = await client.query("UPDATE " + BOOKS + " SET revision=revision+1,updated_at=now(),updated_by=$2 WHERE id=$1::uuid RETURNING id,title,edition,state,revision,updated_at", [bookId, actor]);
  const book = { ...rev.rows[0], revision: Number(rev.rows[0].revision) };
  await client.query(
    "INSERT INTO " + AUDIT10 + "(book_id,revision,actor_subject,operation,before_data,after_data) VALUES($1::uuid,$2,$3,$4,$5::jsonb,$6::jsonb)",
    [bookId, book.revision, actor, action, JSON.stringify(before), JSON.stringify(after)]
  );
  return book;
}
__name(record2, "record");
async function jsonBody(request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json" || Number(request.headers.get("content-length") || 0) > 2e4) return null;
  try {
    const raw = await request.text();
    return raw.length <= 2e4 ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
__name(jsonBody, "jsonBody");
async function transaction2(db, work) {
  return db(async (c) => {
    await c.query("BEGIN");
    try {
      const value = await work(c);
      await c.query("COMMIT");
      return value;
    } catch (e) {
      await c.query("ROLLBACK").catch(() => {
      });
      throw e;
    }
  });
}
__name(transaction2, "transaction");
async function changeSettings(db, actor, data2) {
  if (!validSettings2(data2)) return fail14(400, "invalid_pdf_settings");
  try {
    const saved = await transaction2(db, async (c) => {
      const old = await lock(c, data2.id, data2.revision);
      const before = await queryCataloguePdf(c, data2.id);
      if (!before) throw Error("pdf_required");
      const result = await c.query(
        "UPDATE " + PDFS + " SET visible=$2,download_enabled=$3,updated_at=now() WHERE book_id=$1::uuid RETURNING byte_size,visible,download_enabled,updated_at",
        [data2.id, data2.visible, data2.downloadEnabled]
      );
      const pdf = expose(result.rows[0]);
      const book = await record2(
        c,
        data2.id,
        actor,
        "save",
        { state: old.state, pdf: before },
        { pdf }
      );
      return { book, pdf };
    });
    return ok11(saved);
  } catch (e) {
    return secureError(e);
  }
}
__name(changeSettings, "changeSettings");
async function remove(db, r2, actor, data2) {
  if (!validId(data2?.id) || !validRevision(data2?.revision)) return fail14(400, "invalid_book");
  let key2 = null, committed = false;
  try {
    const saved = await transaction2(db, async (c) => {
      const old = await lock(c, data2.id, data2.revision);
      const before = await queryCataloguePdf(c, data2.id);
      if (!before) throw Error("pdf_required");
      const deleted = await c.query("DELETE FROM " + PDFS + " WHERE book_id=$1::uuid RETURNING r2_key", [data2.id]);
      key2 = deleted.rows[0].r2_key;
      const book = await record2(c, data2.id, actor, "remove", { state: old.state, pdf: before }, { pdf: null });
      return { book, pdf: null };
    });
    committed = true;
    if (key2) await r2.delete(key2).catch(() => {
    });
    return ok11(saved);
  } catch (e) {
    return secureError(e);
  }
}
__name(remove, "remove");
async function upload(db, r2, actor, request) {
  const id = request.headers.get("x-catalogue-book-id"), rev = Number(request.headers.get("x-catalogue-revision"));
  if (!validId(id) || !validRevision(rev) || request.headers.get("content-type")?.split(";")[0] !== "application/pdf")
    return fail14(400, "invalid_upload");
  if (Number(request.headers.get("content-length") || 0) > MAX_CATALOGUE_PDF) return fail14(413, "too_large");
  let bytes;
  try {
    bytes = new Uint8Array(await request.arrayBuffer());
  } catch {
    return fail14(400, "invalid_pdf");
  }
  if (!validateCataloguePdf(bytes)) return fail14(400, "invalid_pdf");
  const fileId = crypto.randomUUID(), key2 = cataloguePdfKey(id, fileId);
  const hash2 = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((v) => v.toString(16).padStart(2, "0")).join("");
  let inserted = false, committed = false, commitAttempted = false, oldKey = null;
  try {
    const saved = await transaction2(db, async (c) => {
      const before = await lock(c, id, rev);
      const old = await c.query("SELECT r2_key,byte_size,visible,download_enabled,updated_at FROM " + PDFS + " WHERE book_id=$1::uuid FOR UPDATE", [id]);
      oldKey = old.rows[0]?.r2_key || null;
      await r2.put(key2, bytes, {
        httpMetadata: { contentType: "application/pdf" },
        customMetadata: { sha256: hash2 }
      });
      inserted = true;
      const next = await c.query("INSERT INTO " + PDFS + "(book_id,r2_key,byte_size,file_sha256,uploaded_by,visible,download_enabled) VALUES($1::uuid,$2,$3,$4,$5,false,false) ON CONFLICT(book_id) DO UPDATE SET r2_key=excluded.r2_key,byte_size=excluded.byte_size, file_sha256=excluded.file_sha256,uploaded_by=excluded.uploaded_by,uploaded_at=now(), visible=false,download_enabled=false,updated_at=now() RETURNING byte_size,visible,download_enabled,updated_at", [id, key2, bytes.length, hash2, actor]);
      const pdf = expose(next.rows[0]);
      const book = await record2(
        c,
        id,
        actor,
        "upload",
        { state: before.state, pdf: expose(old.rows[0]) },
        { pdf }
      );
      commitAttempted = true;
      return { book, pdf };
    });
    committed = true;
    if (oldKey) await r2.delete(oldKey).catch(() => {
    });
    return ok11(saved);
  } catch (e) {
    if (inserted && !commitAttempted) await r2.delete(key2).catch(() => {
    });
    return secureError(e);
  }
}
__name(upload, "upload");
async function handleCataloguePdf({ request, action, actor, db, r2 }) {
  if (actor?.role !== "owner") return fail14(403, "owner_required");
  if (typeof db !== "function" || !r2?.put || !r2?.delete) return fail14(503, "catalogue_storage_unavailable");
  if (action === "pdf-upload") {
    if (request.method !== "POST" || new URL(request.url).search) return fail14(405, "method_not_allowed");
    return upload(db, r2, actor.subject, request);
  }
  if (request.method !== "POST" || new URL(request.url).search) return fail14(405, "method_not_allowed");
  const input = await jsonBody(request);
  if (!input || typeof input !== "object" || Array.isArray(input)) return fail14(400, "invalid_body");
  if (action === "pdf-settings") return changeSettings(db, actor.subject, input);
  if (action === "pdf-remove") return remove(db, r2, actor.subject, input);
  return fail14(404, "not_found");
}
__name(handleCataloguePdf, "handleCataloguePdf");

// catalogue-books-service.mjs
var ROOT2 = "/v1/admin/website/catalogue";
var BOOKS2 = "fbmn_catalog_private.website_catalogue_books";
var ASSETS = "fbmn_catalog_private.website_catalogue_assets";
var AUDIT11 = "fbmn_catalog_private.website_catalogue_audit";
var VIEWER = "fbmn_catalog_private.website_catalogue_viewer_settings";
var VIEWER_AUDIT = "fbmn_catalog_private.website_catalogue_viewer_settings_audit";
var UUID8 = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
var KINDS2 = /* @__PURE__ */ new Set(["page", "cover"]);
var LIMIT3 = 5 * 1024 * 1024;
var MAX_PAGES = 200;
var HEADERS11 = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
var fail15 = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, { status, headers: HEADERS11 }), "fail");
var ok12 = /* @__PURE__ */ __name((data2) => Response.json({ data: data2 }, { headers: HEADERS11 }), "ok");
var validId2 = /* @__PURE__ */ __name((id) => typeof id === "string" && UUID8.test(id), "validId");
var textField = /* @__PURE__ */ __name((s, max, min = 0) => typeof s === "string" && s.trim() === s && s.length >= min && s.length <= max && !/[\x00-\x1f\x7f]/.test(s), "textField");
var revision = /* @__PURE__ */ __name((n) => Number.isSafeInteger(n) && n > 0, "revision");
var one2 = /* @__PURE__ */ __name((u, key2) => u.searchParams.size === 1 && u.searchParams.getAll(key2).length === 1, "one");
function catalogueObjectKey(bookId, kind, fileId) {
  if (!validId2(bookId) || !validId2(fileId) || !KINDS2.has(kind)) return null;
  if (kind === "page") return "books/" + bookId + "/pages/" + fileId + ".webp";
  return "books/" + bookId + "/covers/" + fileId + ".webp";
}
__name(catalogueObjectKey, "catalogueObjectKey");
function validateCatalogueBook(input) {
  return input && typeof input === "object" && !Array.isArray(input) && textField(input.title, 120, 1) && textField(input.edition, 80);
}
__name(validateCatalogueBook, "validateCatalogueBook");
function validCatalogueViewerSettings(x) {
  return x && typeof x === "object" && !Array.isArray(x) && Object.keys(x).sort().join(",") === "flipDurationMs,revision,shadowOpacity,soundEnabled,soundVolume" && Number.isSafeInteger(x.flipDurationMs) && x.flipDurationMs >= 750 && x.flipDurationMs <= 1500 && x.flipDurationMs % 50 === 0 && typeof x.soundEnabled === "boolean" && Number.isInteger(x.soundVolume) && x.soundVolume >= 0 && x.soundVolume <= 100 && typeof x.shadowOpacity === "number" && Number.isFinite(x.shadowOpacity) && x.shadowOpacity >= 0.1 && x.shadowOpacity <= 0.5 && Math.abs(x.shadowOpacity * 100 - Math.round(x.shadowOpacity * 100)) < 1e-8 && revision(x.revision);
}
__name(validCatalogueViewerSettings, "validCatalogueViewerSettings");
var exposeViewer = /* @__PURE__ */ __name((x) => ({
  flipDurationMs: Number(x.flip_duration_ms),
  soundEnabled: x.sound_enabled === true,
  soundVolume: Number(x.sound_volume),
  shadowOpacity: Number(x.shadow_opacity),
  revision: Number(x.revision)
}), "exposeViewer");
async function readViewer(db) {
  return db(async (c) => {
    const r = await c.query("SELECT flip_duration_ms,sound_enabled,shadow_opacity,revision,sound_volume FROM " + VIEWER + " WHERE singleton=true");
    if (r.rowCount !== 1) throw Error("viewer_unavailable");
    return { settings: exposeViewer(r.rows[0]) };
  });
}
__name(readViewer, "readViewer");
async function saveViewer(db, actor, input) {
  if (!validCatalogueViewerSettings(input)) throw Error("invalid_settings");
  return transact(db, async (c) => {
    const old = await c.query("SELECT flip_duration_ms,sound_enabled,shadow_opacity,revision,sound_volume FROM " + VIEWER + " WHERE singleton=true FOR UPDATE");
    if (old.rowCount !== 1) throw Error("viewer_unavailable");
    const before = exposeViewer(old.rows[0]);
    if (before.revision !== input.revision) throw Error("revision_conflict");
    const updated = await c.query(
      "UPDATE " + VIEWER + " SET flip_duration_ms=$1,sound_enabled=$2,shadow_opacity=$3,revision=revision+1,updated_at=now(),updated_by=$4,sound_volume=$5 WHERE singleton=true RETURNING flip_duration_ms,sound_enabled,shadow_opacity,revision,sound_volume",
      [input.flipDurationMs, input.soundEnabled, input.shadowOpacity, actor, input.soundVolume]
    );
    const after = exposeViewer(updated.rows[0]);
    await c.query(
      "INSERT INTO " + VIEWER_AUDIT + "(revision,actor_subject,before_data,after_data) VALUES ($1,$2,$3::jsonb,$4::jsonb)",
      [after.revision, actor, JSON.stringify(before), JSON.stringify(after)]
    );
    return { settings: after };
  });
}
__name(saveViewer, "saveViewer");
function validateCatalogueImage(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 100 || bytes.length > LIMIT3) return null;
  const d = imageSize(bytes, "image/webp", 64);
  return d && d.width <= 6e3 && d.height <= 6e3 ? d : null;
}
__name(validateCatalogueImage, "validateCatalogueImage");
var exposeBook = /* @__PURE__ */ __name((r) => ({
  id: r.id,
  title: r.title,
  edition: r.edition,
  state: r.state,
  revision: Number(r.revision),
  updated_at: r.updated_at
}), "exposeBook");
var exposeAsset = /* @__PURE__ */ __name((r) => ({
  id: r.id,
  kind: r.kind,
  sort_order: Number(r.sort_order),
  width: Number(r.width),
  height: Number(r.height),
  byte_size: Number(r.byte_size)
}), "exposeAsset");
function errorCode(e) {
  const m = e?.message;
  if (["revision_conflict", "ready_locked"].includes(m)) return [409, m];
  if (m === "not_found") return [404, m];
  if (m === "pages_required") return [422, m];
  if (["bad_order", "page_limit", "invalid_book", "invalid_settings"].includes(m)) return [400, m];
  return [503, "catalogue_unavailable"];
}
__name(errorCode, "errorCode");
async function transact(db, fn) {
  return db(async (c) => {
    await c.query("BEGIN");
    try {
      const result = await fn(c);
      await c.query("COMMIT");
      return result;
    } catch (e) {
      await c.query("ROLLBACK").catch(() => {
      });
      throw e;
    }
  });
}
__name(transact, "transact");
async function lockBook(c, id, rev) {
  const found = await c.query("SELECT id,title,edition,state,revision,updated_at FROM " + BOOKS2 + " WHERE id=$1::uuid FOR UPDATE", [id]);
  if (found.rowCount !== 1) throw Error("not_found");
  const b = found.rows[0];
  if (Number(b.revision) !== rev) throw Error("revision_conflict");
  return b;
}
__name(lockBook, "lockBook");
async function tick(c, id, actor) {
  const a = await c.query("UPDATE " + BOOKS2 + " SET revision=revision+1,updated_at=now(),updated_by=$2 WHERE id=$1::uuid RETURNING id,title,edition,state,revision,updated_at", [id, actor]);
  return exposeBook(a.rows[0]);
}
__name(tick, "tick");
async function audit4(c, id, actor, op, revision2, before, after) {
  await c.query(
    "INSERT INTO " + AUDIT11 + "(book_id,revision,actor_subject,operation,before_data,after_data) VALUES($1::uuid,$2,$3,$4,$5::jsonb,$6::jsonb)",
    [id, revision2, actor, op, JSON.stringify(before), JSON.stringify(after)]
  );
}
__name(audit4, "audit");
async function bodyJson2(request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json" || Number(request.headers.get("content-length") || 0) > 2e4) return null;
  const raw = await request.text();
  if (raw.length > 2e4) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
__name(bodyJson2, "bodyJson");
function parseCataloguePage(value) {
  return typeof value === "string" && /^[1-9][0-9]{0,4}$/.test(value) ? Number(value) : null;
}
__name(parseCataloguePage, "parseCataloguePage");
async function queryList(db, requestedPage = 1) {
  return db(async (c) => {
    const counter = await c.query("SELECT count(*)::integer AS total FROM " + BOOKS2);
    const total = Number(counter.rows[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / 50));
    const page = Math.min(requestedPage, totalPages);
    const q = await c.query("SELECT id,title,edition,state,revision,updated_at FROM " + BOOKS2 + " ORDER BY updated_at DESC,id DESC LIMIT 50 OFFSET $1", [(page - 1) * 50]);
    return { books: q.rows.map(exposeBook), page, totalPages, total };
  });
}
__name(queryList, "queryList");
async function queryDetail(db, id) {
  const v = await db(async (c) => {
    const b = await c.query("SELECT id,title,edition,state,revision,updated_at FROM " + BOOKS2 + " WHERE id=$1::uuid", [id]);
    if (b.rowCount !== 1) throw Error("not_found");
    const files = await c.query("SELECT id,kind,sort_order,width,height,byte_size FROM " + ASSETS + " WHERE book_id=$1::uuid AND kind IN ('page','cover') ORDER BY CASE kind WHEN 'cover' THEN 0 ELSE 1 END,sort_order,id LIMIT 201", [id]);
    return {
      book: exposeBook(b.rows[0]),
      assets: files.rows.map(exposeAsset),
      pdf: await queryCataloguePdf(c, id)
    };
  });
  return v;
}
__name(queryDetail, "queryDetail");
async function createBook(db, actor, payload) {
  if (!validateCatalogueBook(payload)) throw Error("invalid_book");
  const id = crypto.randomUUID();
  return transact(db, async (c) => {
    const b = await c.query(
      "INSERT INTO " + BOOKS2 + "(id,title,edition,created_by,updated_by) VALUES($1::uuid,$2,$3,$4,$4) RETURNING id,title,edition,state,revision,updated_at",
      [id, payload.title, payload.edition, actor]
    );
    const book = exposeBook(b.rows[0]);
    await audit4(c, id, actor, "create", 1, {}, book);
    return { book };
  });
}
__name(createBook, "createBook");
async function mutate2(db, r2, actor, action, data2) {
  if (!validId2(data2?.id) || !revision(data2?.revision)) throw Error("invalid_book");
  const id = data2.id, rev = data2.revision;
  let removedKey = null, commitAttempted = false;
  const result = await db(async (c) => {
    await c.query("BEGIN");
    try {
      const before = await lockBook(c, id, rev);
      const safeBefore = exposeBook(before);
      if (before.state === "ready" && action !== "hide") throw Error("ready_locked");
      let afterData = {};
      if (action === "save") {
        if (!validateCatalogueBook(data2)) throw Error("invalid_book");
        await c.query(
          "UPDATE " + BOOKS2 + " SET title=$2,edition=$3 WHERE id=$1::uuid",
          [id, data2.title, data2.edition]
        );
        afterData = { title: data2.title, edition: data2.edition };
      } else if (action === "ready") {
        const n = await c.query("SELECT count(*)::integer AS n FROM " + ASSETS + " WHERE book_id=$1::uuid AND kind='page'", [id]);
        if (Number(n.rows[0].n) < 1) {
          const p = await c.query("SELECT 1 FROM fbmn_catalog_private.website_catalogue_pdfs WHERE book_id=$1::uuid AND visible=true LIMIT 1", [id]);
          if (p.rowCount !== 1) throw Error("pages_required");
        }
        await c.query("UPDATE " + BOOKS2 + " SET state='ready' WHERE id=$1::uuid", [id]);
        afterData = { state: "ready" };
      } else if (action === "hide") {
        await c.query("UPDATE " + BOOKS2 + " SET state='hidden' WHERE id=$1::uuid", [id]);
        afterData = { state: "hidden" };
      } else if (action === "reorder") {
        const pages = await c.query("SELECT id FROM " + ASSETS + " WHERE book_id=$1::uuid AND kind='page' ORDER BY sort_order,id FOR UPDATE", [id]);
        const ids = data2.assetIds;
        if (!Array.isArray(ids) || ids.length !== pages.rowCount || ids.length > MAX_PAGES || !ids.every(validId2) || new Set(ids).size !== ids.length || !ids.every((x) => pages.rows.some((row) => row.id === x))) throw Error("bad_order");
        for (let i = 0; i < ids.length; i++) await c.query("UPDATE " + ASSETS + " SET sort_order=$2 WHERE id=$1::uuid", [ids[i], i]);
        afterData = { page_order: ids };
      } else if (action === "remove") {
        if (!validId2(data2.assetId)) throw Error("invalid_book");
        const row = await c.query(
          "DELETE FROM " + ASSETS + " WHERE id=$1::uuid AND book_id=$2::uuid AND kind IN ('page','cover') RETURNING kind,r2_key",
          [data2.assetId, id]
        );
        if (row.rowCount !== 1) throw Error("not_found");
        removedKey = row.rows[0].r2_key;
        afterData = { removed_asset: data2.assetId, kind: row.rows[0].kind };
      } else throw Error("invalid_book");
      const book = await tick(c, id, actor);
      await audit4(c, id, actor, action, book.revision, safeBefore, afterData);
      commitAttempted = true;
      await c.query("COMMIT");
      return { book };
    } catch (e) {
      await c.query("ROLLBACK").catch(() => {
      });
      throw e;
    }
  });
  if (removedKey && commitAttempted) await r2.delete(removedKey).catch(() => {
  });
  return result;
}
__name(mutate2, "mutate");
async function upload2(db, r2, actor, request) {
  const id = request.headers.get("x-catalogue-book-id");
  const kind = request.headers.get("x-catalogue-kind");
  const rev = Number(request.headers.get("x-catalogue-revision"));
  if (!validId2(id) || !KINDS2.has(kind) || !revision(rev) || request.headers.get("content-type")?.split(";")[0] !== "image/webp")
    return fail15(400, "invalid_upload");
  if (Number(request.headers.get("content-length") || 0) > LIMIT3) return fail15(413, "too_large");
  let bytes;
  try {
    bytes = new Uint8Array(await request.arrayBuffer());
  } catch {
    return fail15(400, "invalid_image");
  }
  const d = validateCatalogueImage(bytes);
  if (!d) return fail15(400, "invalid_image");
  const fileId = crypto.randomUUID(), key2 = catalogueObjectKey(id, kind, fileId);
  const hash2 = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((v) => v.toString(16).padStart(2, "0")).join("");
  let inserted = false, commitAttempted = false, formerKey = null;
  try {
    const saved = await db(async (c) => {
      await c.query("BEGIN");
      try {
        const before = await lockBook(c, id, rev);
        if (before.state === "ready") throw Error("ready_locked");
        let order = 0;
        if (kind === "page") {
          const counter = await c.query("SELECT count(*)::integer AS n, COALESCE(max(sort_order),-1)+1 AS next FROM " + ASSETS + " WHERE book_id=$1::uuid AND kind='page'", [id]);
          if (Number(counter.rows[0].n) >= MAX_PAGES) throw Error("page_limit");
          order = Number(counter.rows[0].next);
        } else {
          const former = await c.query("SELECT r2_key FROM " + ASSETS + " WHERE book_id=$1::uuid AND kind=$2 FOR UPDATE", [id, kind]);
          formerKey = former.rows[0]?.r2_key ?? null;
        }
        await r2.put(key2, bytes, { httpMetadata: { contentType: "image/webp" }, customMetadata: { sha256: hash2 } });
        inserted = true;
        if (kind !== "page") await c.query("DELETE FROM " + ASSETS + " WHERE book_id=$1::uuid AND kind=$2", [id, kind]);
        await c.query(
          "INSERT INTO " + ASSETS + "(id,book_id,kind,sort_order,r2_key,byte_size,width,height,file_sha256,uploaded_by) VALUES($1::uuid,$2::uuid,$3,$4,$5,$6,$7,$8,$9,$10)",
          [fileId, id, kind, order, key2, bytes.length, d.width, d.height, hash2, actor]
        );
        const book = await tick(c, id, actor);
        await audit4(
          c,
          id,
          actor,
          "upload",
          book.revision,
          exposeBook(before),
          { asset: fileId, kind, width: d.width, height: d.height }
        );
        commitAttempted = true;
        await c.query("COMMIT");
        return { book, asset: { id: fileId, kind, sort_order: order, width: d.width, height: d.height, byte_size: bytes.length } };
      } catch (e) {
        await c.query("ROLLBACK").catch(() => {
        });
        throw e;
      }
    });
    if (formerKey) await r2.delete(formerKey).catch(() => {
    });
    return ok12(saved);
  } catch (e) {
    if (inserted && !commitAttempted) await r2.delete(key2).catch(() => {
    });
    const [status, code] = errorCode(e);
    return fail15(status, code);
  }
}
__name(upload2, "upload");
async function handleCatalogueBooks({ request, actor, db, r2 }) {
  if (actor?.role !== "owner") return fail15(403, "owner_required");
  if (typeof db !== "function" || !r2?.get || !r2?.put || !r2?.delete)
    return fail15(503, "catalogue_storage_unavailable");
  const u = new URL(request.url);
  if (u.pathname !== ROOT2 && !u.pathname.startsWith(ROOT2 + "/")) return fail15(404, "not_found");
  const action = u.pathname === ROOT2 ? "" : u.pathname.slice(ROOT2.length + 1);
  if (action.includes("/") || !["", "image", "settings", "create", "save", "ready", "hide", "upload", "reorder", "remove", "pdf-upload", "pdf-settings", "pdf-remove"].includes(action))
    return fail15(404, "not_found");
  if (["pdf-upload", "pdf-settings", "pdf-remove"].includes(action))
    return handleCataloguePdf({ request, action, actor, db, r2 });
  try {
    if (request.method === "GET" && action === "") {
      if (!u.search) return ok12(await queryList(db));
      if (one2(u, "page")) {
        const page = parseCataloguePage(u.searchParams.get("page"));
        if (page === null) return fail15(400, "invalid_query");
        return ok12(await queryList(db, page));
      }
      if (!one2(u, "id") || !validId2(u.searchParams.get("id"))) return fail15(400, "invalid_query");
      return ok12(await queryDetail(db, u.searchParams.get("id")));
    }
    if (request.method === "GET" && action === "settings") {
      if (u.search) return fail15(400, "invalid_query");
      return ok12(await readViewer(db));
    }
    if (request.method === "GET" && action === "image") {
      if (!one2(u, "asset") || !validId2(u.searchParams.get("asset"))) return fail15(400, "invalid_query");
      const found = await db((c) => c.query("SELECT r2_key,byte_size FROM " + ASSETS + " WHERE id=$1::uuid", [u.searchParams.get("asset")]));
      if (found.rowCount !== 1) return fail15(404, "not_found");
      const object = await r2.get(found.rows[0].r2_key);
      if (!object?.body || object.size > LIMIT3 || object.size !== Number(found.rows[0].byte_size))
        return fail15(404, "not_found");
      return new Response(object.body, { status: 200, headers: {
        ...HEADERS11,
        "Content-Type": "image/webp",
        "Content-Disposition": "inline",
        "Cross-Origin-Resource-Policy": "same-origin"
      } });
    }
    if (request.method !== "POST" || u.search) return fail15(405, "method_not_allowed");
    if (action === "upload") return upload2(db, r2, actor.subject, request);
    const input = await bodyJson2(request);
    if (!input || typeof input !== "object" || Array.isArray(input))
      return fail15(400, action === "settings" ? "invalid_settings" : "invalid_book");
    if (action === "settings") return ok12(await saveViewer(db, actor.subject, input));
    if (action === "create") return ok12(await createBook(db, actor.subject, input));
    if (["save", "ready", "hide", "reorder", "remove"].includes(action))
      return ok12(await mutate2(db, r2, actor.subject, action, input));
    return fail15(405, "method_not_allowed");
  } catch (e) {
    const [status, code] = errorCode(e);
    return fail15(status, code);
  }
}
__name(handleCatalogueBooks, "handleCatalogueBooks");

// pricebook-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var kinds = /* @__PURE__ */ new Set(["source", "net_internal", "retail_public", "dealer_contract"]);
var canRead = /* @__PURE__ */ new Set(["owner", "admin", "pricing"]);
var skuOk2 = /* @__PURE__ */ __name((x) => typeof x === "string" && x.length >= 1 && x.length <= 80 && x.trim() === x && !/[\x00-\x1f\x7f]/.test(x), "skuOk");
var uuid3 = /* @__PURE__ */ __name((x) => typeof x === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(x), "uuid");
var dateOk = /* @__PURE__ */ __name((x) => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x)) && (/* @__PURE__ */ new Date(x + "T00:00:00Z")).toISOString().slice(0, 10) === x, "dateOk");
var error4 = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, {
  status,
  headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" }
}), "error");
var reply2 = /* @__PURE__ */ __name((status, data2) => Response.json({ data: data2 }, {
  status,
  headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" }
}), "reply");
async function tx3(db, fn) {
  return db(async (c) => {
    await c.query("BEGIN");
    try {
      const value = await fn(c);
      await c.query("COMMIT");
      return value;
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    }
  });
}
__name(tx3, "tx");
var parseBody = /* @__PURE__ */ __name(async (request) => {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return null;
  if (Number(request.headers.get("content-length") || 0) > 4096) return null;
  const body4 = await request.text();
  if (body4.length > 4096) return null;
  try {
    return JSON.parse(body4);
  } catch {
    return null;
  }
}, "parseBody");
function validSource(x) {
  return typeof x === "string" && x.trim() === x && x.length >= 1 && x.length <= 300 && !/[\x00-\x1f\x7f]/.test(x);
}
__name(validSource, "validSource");
function validAmount(x) {
  return Number.isSafeInteger(x) && x >= 0 && x <= 1e12;
}
__name(validAmount, "validAmount");
function validEntry(x) {
  return x && typeof x === "object" && !Array.isArray(x) && skuOk2(x.sku_cong_ty) && kinds.has(x.price_kind) && (x.price_kind === "dealer_contract" ? uuid3(x.customer_id) : x.customer_id === null) && validAmount(x.amount_vnd) && x.currency === "VND" && typeof x.vat_included === "boolean" && (x.vat_rate_bps === null || Number.isInteger(x.vat_rate_bps) && x.vat_rate_bps >= 0 && x.vat_rate_bps <= 1e4) && validSource(x.source_document) && dateOk(x.effective_from) && (x.effective_until === null || dateOk(x.effective_until) && x.effective_until >= x.effective_from) && x.confirm === "LUU_GIA_NHAP";
}
__name(validEntry, "validEntry");
function validEdit(x) {
  return x && typeof x === "object" && !Array.isArray(x) && uuid3(x.id) && Number.isSafeInteger(x.expected_revision) && x.expected_revision >= 1 && validAmount(x.amount_vnd) && typeof x.vat_included === "boolean" && (x.vat_rate_bps === null || Number.isInteger(x.vat_rate_bps) && x.vat_rate_bps >= 0 && x.vat_rate_bps <= 1e4) && validSource(x.source_document) && (x.effective_until === null || dateOk(x.effective_until)) && x.confirm === "CAP_NHAT_GIA_NHAP";
}
__name(validEdit, "validEdit");
async function handlePricebook({ request, actor, db }) {
  if (!canRead.has(actor?.role) || typeof actor.subject !== "string") return error4(403, "pricing_forbidden");
  const url = new URL(request.url);
  if (url.pathname !== "/v1/admin/pricing/entries") return error4(404, "not_found");
  if (request.method === "GET") {
    if ([...url.searchParams.keys()].some((k) => k !== "sku") || url.searchParams.getAll("sku").length !== 1 || !skuOk2(url.searchParams.get("sku")))
      return error4(400, "invalid_sku");
    try {
      const result = await db((c) => c.query(
        "SELECT id::text AS id,sku_cong_ty,price_kind,customer_id::text AS customer_id,amount_vnd::text AS amount_vnd,currency,vat_included,vat_rate_bps,source_document,effective_from::text AS effective_from,effective_until::text AS effective_until,approval_state,revision FROM fbmn_catalog_private.pricebook_entries WHERE sku_cong_ty=$1 AND (price_kind<>'dealer_contract' OR $2::boolean) ORDER BY price_kind,customer_id,effective_from DESC LIMIT 101",
        [url.searchParams.get("sku"), actor.role === "owner"]
      ));
      if (result.rows.length > 100) return error4(503, "too_many_price_versions");
      return reply2(200, { entries: result.rows, currency: "VND", empty: result.rows.length === 0 });
    } catch {
      return error4(503, "pricebook_unavailable");
    }
  }
  if (!["POST", "PATCH"].includes(request.method)) return error4(405, "method_not_allowed");
  if (actor.role !== "owner") return error4(403, "owner_required");
  if (url.search !== "") return error4(400, "invalid_query");
  const input = await parseBody(request);
  if (request.method === "POST" && !validEntry(input)) return error4(400, "invalid_price_draft");
  if (request.method === "PATCH" && !validEdit(input)) return error4(400, "invalid_price_revision");
  try {
    if (request.method === "POST") {
      const saved2 = await tx3(db, async (c) => {
        const result = await c.query(
          "INSERT INTO fbmn_catalog_private.pricebook_entries (sku_cong_ty,price_kind,customer_id,amount_vnd,currency,vat_included,vat_rate_bps,source_document,effective_from,effective_until,updated_by) VALUES($1,$2,$3,$4,'VND',$5,$6,$7,$8,$9,$10) RETURNING id::text AS id,revision,approval_state",
          [
            input.sku_cong_ty,
            input.price_kind,
            input.customer_id,
            input.amount_vnd,
            input.vat_included,
            input.vat_rate_bps,
            input.source_document,
            input.effective_from,
            input.effective_until,
            actor.subject
          ]
        );
        await c.query(
          "INSERT INTO fbmn_catalog_private.pricebook_audit (entry_id,actor_subject,action,old_revision,new_revision,old_amount_vnd,new_amount_vnd,old_vat_included,new_vat_included,source_document) VALUES($1,$2,'create_draft',NULL,1,NULL,$3,NULL,$4,$5)",
          [result.rows[0].id, actor.subject, input.amount_vnd, input.vat_included, input.source_document]
        );
        return result.rows[0];
      });
      return reply2(201, saved2);
    }
    const saved = await tx3(db, async (c) => {
      const previous = await c.query(
        "SELECT amount_vnd::text AS amount_vnd,vat_included FROM fbmn_catalog_private.pricebook_entries WHERE id=$1 AND revision=$2 AND approval_state='draft' FOR UPDATE",
        [input.id, input.expected_revision]
      );
      if (previous.rowCount !== 1) throw new Error("pricebook_conflict");
      const result = await c.query(
        "UPDATE fbmn_catalog_private.pricebook_entries SET amount_vnd=$1,vat_included=$2,vat_rate_bps=$3,source_document=$4,effective_until=$5,revision=revision+1,updated_by=$6,updated_at=now() WHERE id=$7 AND revision=$8 AND approval_state='draft' AND ($5::date IS NULL OR $5::date>=effective_from) RETURNING id::text AS id,revision,approval_state",
        [
          input.amount_vnd,
          input.vat_included,
          input.vat_rate_bps,
          input.source_document,
          input.effective_until,
          actor.subject,
          input.id,
          input.expected_revision
        ]
      );
      if (result.rowCount !== 1) throw new Error("pricebook_conflict");
      await c.query(
        "INSERT INTO fbmn_catalog_private.pricebook_audit (entry_id,actor_subject,action,old_revision,new_revision,old_amount_vnd,new_amount_vnd,old_vat_included,new_vat_included,source_document) VALUES($1,$2,'update_draft',$3,$4,$5,$6,$7,$8,$9)",
        [
          input.id,
          actor.subject,
          input.expected_revision,
          result.rows[0].revision,
          previous.rows[0].amount_vnd,
          input.amount_vnd,
          previous.rows[0].vat_included,
          input.vat_included,
          input.source_document
        ]
      );
      return result.rows[0];
    });
    return reply2(200, saved);
  } catch (e) {
    if (e?.code === "23505" || e?.code === "23503" || e?.code === "23514" || e?.message === "pricebook_conflict") return error4(409, "pricebook_conflict");
    return error4(503, "pricebook_unavailable");
  }
}
__name(handlePricebook, "handlePricebook");

// pricebook-bulk-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var KINDS3 = /* @__PURE__ */ new Set(["source", "net_internal", "retail_public", "dealer_contract"]);
var SKU = /* @__PURE__ */ __name((x) => typeof x === "string" && x.length > 0 && x.length <= 80 && x === x.trim() && !/[\x00-\x1f\x7f]/.test(x), "SKU");
var UUID9 = /* @__PURE__ */ __name((x) => typeof x === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x), "UUID");
var DATE = /* @__PURE__ */ __name((x) => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x)) && (/* @__PURE__ */ new Date(x + "T00:00:00Z")).toISOString().slice(0, 10) === x, "DATE");
var VALID_SOURCE = /* @__PURE__ */ __name((x) => typeof x === "string" && x.length >= 1 && x.length <= 300 && x === x.trim() && !/[\x00-\x1f\x7f]/.test(x), "VALID_SOURCE");
var MAX_ROWS = 1e3;
var PRESERVABLE = /* @__PURE__ */ new Set(["vat_included", "vat_rate_bps", "source_document", "effective_until"]);
var headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
var error5 = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, { status, headers }), "error");
var reply3 = /* @__PURE__ */ __name((status, data2) => Response.json({ data: data2 }, { status, headers }), "reply");
var vnDay = /* @__PURE__ */ __name(() => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(/* @__PURE__ */ new Date());
  const val = /* @__PURE__ */ __name((k) => parts.find((p) => p.type === k)?.value, "val");
  return val("year") + "-" + val("month") + "-" + val("day");
}, "vnDay");
var valueStr = /* @__PURE__ */ __name((x) => typeof x === "number" && Number.isSafeInteger(x) ? String(x) : x, "valueStr");
var amountOk = /* @__PURE__ */ __name((x) => typeof x === "string" && /^(0|[1-9][0-9]{0,12})$/.test(x) && BigInt(x) <= 1000000000000n, "amountOk");
async function hash(data2) {
  const bytes = new TextEncoder().encode(JSON.stringify(data2));
  const result = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(result), (v) => v.toString(16).padStart(2, "0")).join("");
}
__name(hash, "hash");
async function readBody3(request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return null;
  if (Number(request.headers.get("content-length") || 0) > 35e4) return null;
  const txt = await request.text();
  if (txt.length > 35e4) return null;
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}
__name(readBody3, "readBody");
function normalize(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || !Array.isArray(input.rows) || input.rows.length < 1 || input.rows.length > MAX_ROWS) return null;
  const today2 = vnDay();
  const defaults2 = {
    price_kind: input.price_kind,
    customer_id: input.customer_id ?? null,
    vat_included: input.vat_included,
    vat_rate_bps: input.vat_rate_bps ?? null,
    source_document: input.source_document,
    effective_from: input.effective_from || today2,
    effective_until: input.effective_until || null
  };
  const rows = input.rows.map((raw, index) => {
    const r = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const value = valueStr(r.amount_vnd);
    const preserve = Array.isArray(r.preserve_existing_fields) ? r.preserve_existing_fields : [];
    const validPreserve = preserve.length <= PRESERVABLE.size && new Set(preserve).size === preserve.length && preserve.every((field) => PRESERVABLE.has(field));
    const item3 = {
      line: Number.isInteger(r.line) && r.line >= 2 ? r.line : index + 2,
      sku_cong_ty: r.sku_cong_ty,
      amount_vnd: value,
      price_kind: Object.hasOwn(r, "price_kind") ? r.price_kind : defaults2.price_kind,
      customer_id: Object.hasOwn(r, "customer_id") ? r.customer_id : defaults2.customer_id,
      vat_included: Object.hasOwn(r, "vat_included") ? r.vat_included : defaults2.vat_included,
      vat_rate_bps: Object.hasOwn(r, "vat_rate_bps") ? r.vat_rate_bps : defaults2.vat_rate_bps,
      source_document: Object.hasOwn(r, "source_document") ? r.source_document : defaults2.source_document,
      effective_from: Object.hasOwn(r, "effective_from") ? r.effective_from : defaults2.effective_from,
      effective_until: Object.hasOwn(r, "effective_until") ? r.effective_until : defaults2.effective_until,
      preserve_existing_fields: preserve
    };
    if (UUID9(item3.customer_id)) item3.customer_id = item3.customer_id.toLowerCase();
    let fault = null;
    if (!validPreserve) fault = "invalid_preserve_fields";
    else if (!SKU(item3.sku_cong_ty)) fault = "invalid_company_sku";
    else if (value === null || value === void 0 || value === "") fault = "empty_skip";
    else if (!amountOk(value)) fault = "invalid_price";
    else if (!KINDS3.has(item3.price_kind)) fault = "invalid_price_kind";
    else if (item3.price_kind === "dealer_contract" ? !UUID9(item3.customer_id) : item3.customer_id !== null)
      fault = "invalid_customer_scope";
    else if (item3.vat_included !== null && item3.vat_included !== void 0 && typeof item3.vat_included !== "boolean") fault = "vat_required";
    else if (item3.vat_rate_bps !== null && (!Number.isInteger(item3.vat_rate_bps) || item3.vat_rate_bps < 0 || item3.vat_rate_bps > 1e4)) fault = "invalid_vat_rate";
    else if (!VALID_SOURCE(item3.source_document)) fault = "source_document_required";
    else if (!DATE(item3.effective_from) || item3.effective_until !== null && (!DATE(item3.effective_until) || item3.effective_until < item3.effective_from))
      fault = "invalid_effective_period";
    return { ...item3, fault };
  });
  return rows;
}
__name(normalize, "normalize");
function key(x) {
  return [x.sku_cong_ty, x.price_kind, x.customer_id || "", x.effective_from].join("");
}
__name(key, "key");
async function snapshot(c, rows) {
  const skus = [...new Set(rows.filter((r) => SKU(r.sku_cong_ty)).map((r) => r.sku_cong_ty))];
  if (skus.length === 0) return { found: /* @__PURE__ */ new Set(), names: /* @__PURE__ */ new Map(), entries: [] };
  const [s, p] = await Promise.all([
    c.query("SELECT sku_cong_ty,ten_san_pham,ten_goc_xnt,ten_goc_bang_gia FROM fbmn_catalog.skus WHERE sku_cong_ty=ANY($1::text[])", [skus]),
    c.query("SELECT id::text AS id,sku_cong_ty,price_kind,customer_id::text AS customer_id,amount_vnd::text AS amount_vnd,vat_included,vat_rate_bps,source_document,effective_from::text AS effective_from,effective_until::text AS effective_until,approval_state,revision FROM fbmn_catalog_private.pricebook_entries WHERE sku_cong_ty=ANY($1::text[]) ORDER BY sku_cong_ty,price_kind,customer_id,effective_from,id", [skus])
  ]);
  if (p.rows.length > 15e3) throw Error("too_many_versions");
  return { found: new Set(s.rows.map((r) => r.sku_cong_ty)), names: new Map(s.rows.map((r) => [
    r.sku_cong_ty,
    r.ten_san_pham || r.ten_goc_xnt || r.ten_goc_bang_gia || null
  ])), entries: p.rows };
}
__name(snapshot, "snapshot");
function plan(rows, state) {
  const used = /* @__PURE__ */ new Set();
  const changes = [];
  let bad = 0;
  for (const r of rows) {
    const k = SKU(r.sku_cong_ty) ? key(r) : "invalid:" + r.line;
    let issue = r.fault;
    if (!issue && used.has(k)) issue = "duplicate_row";
    if (!issue) used.add(k);
    if (!issue && !state.found.has(r.sku_cong_ty)) issue = "sku_not_found";
    const scope = state.entries.filter((e) => e.sku_cong_ty === r.sku_cong_ty && e.price_kind === r.price_kind && (e.customer_id || null) === (r.customer_id || null));
    const exact = scope.find((e) => e.effective_from === r.effective_from) || null;
    const resolved = { ...r };
    if (exact) for (const field of r.preserve_existing_fields) {
      resolved[field] = exact[field];
    }
    const old = exact || scope.filter((e) => e.effective_from <= r.effective_from).sort((a, b) => b.effective_from.localeCompare(a.effective_from))[0] || null;
    if ((resolved.vat_included === null || resolved.vat_included === void 0) && old) {
      resolved.vat_included = old.vat_included;
      if (resolved.vat_rate_bps === null || resolved.vat_rate_bps === void 0)
        resolved.vat_rate_bps = old.vat_rate_bps;
    }
    if (!issue && typeof resolved.vat_included !== "boolean") issue = "vat_required";
    if (!issue && exact?.approval_state === "approved") issue = "approved_price_locked";
    if (!issue && scope.some((e) => e.approval_state === "approved" && e.id !== exact?.id && e.effective_from <= (resolved.effective_until || "9999-12-31") && (e.effective_until || "9999-12-31") >= r.effective_from)) issue = "approved_period_overlap";
    const same = !!exact && exact.amount_vnd === resolved.amount_vnd && exact.vat_included === resolved.vat_included && exact.vat_rate_bps === resolved.vat_rate_bps && exact.source_document === resolved.source_document && exact.effective_until === resolved.effective_until;
    const status = issue === "empty_skip" ? "unchanged" : issue ? "invalid" : same ? "unchanged" : exact ? "updated" : "new";
    if (status === "invalid") bad++;
    changes.push({
      ...resolved,
      status,
      issue: issue || null,
      ten_san_pham: state.names?.get(r.sku_cong_ty) || null,
      old_amount_vnd: old?.amount_vnd ?? null,
      entry_id: exact?.id ?? null,
      expected_revision: exact?.revision ?? null,
      previous_revision: old?.revision ?? null
    });
  }
  return {
    changes,
    invalid: bad,
    updated: changes.filter((r) => r.status === "updated").length,
    created: changes.filter((r) => r.status === "new").length,
    unchanged: changes.filter((r) => r.status === "unchanged").length
  };
}
__name(plan, "plan");
async function fingerprint(rows, state) {
  return hash({ rows, state: state.entries.map((e) => [
    e.id,
    e.revision,
    e.amount_vnd,
    e.vat_included,
    e.vat_rate_bps,
    e.source_document,
    e.effective_from,
    e.effective_until,
    e.approval_state
  ]) });
}
__name(fingerprint, "fingerprint");
async function transaction3(db, fn) {
  return db(async (c) => {
    await c.query("BEGIN");
    try {
      const value = await fn(c);
      await c.query("COMMIT");
      return value;
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    }
  });
}
__name(transaction3, "transaction");
async function getExport(db, url) {
  if ([...url.searchParams.keys()].some((k) => !["kind", "customer_id"].includes(k)) || url.searchParams.getAll("kind").length !== 1) return error5(400, "invalid_query");
  const kind = url.searchParams.get("kind");
  const customer = url.searchParams.get("customer_id");
  if (!KINDS3.has(kind) || (kind === "dealer_contract" ? !UUID9(customer) : customer !== null))
    return error5(400, "invalid_price_scope");
  const result = await db((c) => c.query(
    "SELECT s.sku_cong_ty,s.ten_san_pham,s.ten_goc_xnt,s.ten_goc_bang_gia,p.id::text AS id,p.amount_vnd::text AS amount_vnd,p.vat_included,p.vat_rate_bps,p.source_document,p.effective_from::text AS effective_from,p.effective_until::text AS effective_until,p.revision,p.approval_state FROM fbmn_catalog.skus s LEFT JOIN LATERAL (SELECT * FROM fbmn_catalog_private.pricebook_entries p WHERE p.sku_cong_ty=s.sku_cong_ty AND p.price_kind=$1 AND p.customer_id IS NOT DISTINCT FROM $2::uuid ORDER BY p.effective_from DESC LIMIT 1) p ON true ORDER BY s.sku_cong_ty LIMIT 10001",
    [kind, customer || null]
  ));
  if (result.rows.length > 1e4) return error5(503, "export_too_large");
  return reply3(200, { kind, customer_id: customer || null, items: result.rows });
}
__name(getExport, "getExport");
async function getHistory(db, url) {
  if ([...url.searchParams.keys()].some((k) => !["sku", "limit"].includes(k))) return error5(400, "invalid_query");
  const sku = url.searchParams.get("sku"), limit = Number(url.searchParams.get("limit") || 50);
  if (sku !== null && !SKU(sku) || !Number.isInteger(limit) || limit < 1 || limit > 100) return error5(400, "invalid_query");
  const result = await db((c) => c.query(
    "SELECT a.id::text,a.created_at::text,a.actor_subject,a.action,a.old_revision,a.new_revision,a.old_amount_vnd::text,a.new_amount_vnd::text,a.old_vat_included,a.new_vat_included,a.source_document,a.batch_id::text AS batch_id,e.sku_cong_ty,e.price_kind,e.customer_id::text AS customer_id,e.effective_from::text,e.effective_until::text,e.approval_state FROM fbmn_catalog_private.pricebook_audit a JOIN fbmn_catalog_private.pricebook_entries e ON e.id=a.entry_id WHERE ($1::text IS NULL OR e.sku_cong_ty=$1) ORDER BY a.id DESC LIMIT $2",
    [sku, limit]
  ));
  const batches = await db((c) => c.query("SELECT id::text,created_at::text,actor_subject,source_document,rows_total,created_count,updated_count,unchanged_count FROM fbmn_catalog_private.pricebook_import_batches ORDER BY created_at DESC LIMIT 20"));
  return reply3(200, { events: result.rows, batches: batches.rows });
}
__name(getHistory, "getHistory");
async function approve(db, input, actor) {
  if (!UUID9(input?.id) || !Number.isInteger(input?.expected_revision) || input.expected_revision < 1 || input.confirm !== "DUYET_GIA_NOI_BO") return error5(400, "invalid_approval");
  try {
    const result = await transaction3(db, async (c) => {
      const scope = await c.query("SELECT sku_cong_ty FROM fbmn_catalog_private.pricebook_entries WHERE id=$1", [input.id]);
      if (scope.rowCount !== 1) throw Error("revision_conflict");
      await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["fbmn-price:" + scope.rows[0].sku_cong_ty]);
      const old = await c.query("SELECT * FROM fbmn_catalog_private.pricebook_entries WHERE id=$1 FOR UPDATE", [input.id]);
      const e = old.rows[0];
      if (!e || e.approval_state !== "draft" || e.revision !== input.expected_revision) throw Error("revision_conflict");
      const overlapping = await c.query(
        "SELECT id FROM fbmn_catalog_private.pricebook_entries WHERE id<>$1 AND sku_cong_ty=$2 AND price_kind=$3 AND customer_id IS NOT DISTINCT FROM $4::uuid AND approval_state='approved' AND daterange(effective_from,effective_until,'[]') && daterange($5::date,$6::date,'[]') LIMIT 1",
        [e.id, e.sku_cong_ty, e.price_kind, e.customer_id, e.effective_from, e.effective_until]
      );
      if (overlapping.rowCount) throw Error("effective_period_conflict");
      const res2 = await c.query(
        "UPDATE fbmn_catalog_private.pricebook_entries SET approval_state='approved',revision=revision+1,updated_by=$1,updated_at=now() WHERE id=$2 AND revision=$3 AND approval_state='draft' RETURNING revision",
        [actor.subject, e.id, e.revision]
      );
      if (res2.rowCount !== 1) throw Error("revision_conflict");
      await c.query(
        "INSERT INTO fbmn_catalog_private.pricebook_audit (entry_id,actor_subject,action,old_revision,new_revision,old_amount_vnd,new_amount_vnd,old_vat_included,new_vat_included,source_document) VALUES($1,$2,'approve_draft',$3,$4,$5,$5,$6,$6,$7)",
        [e.id, actor.subject, e.revision, e.revision + 1, e.amount_vnd, e.vat_included, e.source_document]
      );
      return { id: e.id, revision: e.revision + 1, approval_state: "approved", publicly_published: false };
    });
    return reply3(200, result);
  } catch (e) {
    return error5(
      e.message === "revision_conflict" || e.message === "effective_period_conflict" ? 409 : 503,
      e.message === "effective_period_conflict" ? "effective_period_conflict" : "pricebook_conflict"
    );
  }
}
__name(approve, "approve");
async function handleBulkPricebook({ request, actor, db }) {
  if (!actor || actor.role !== "owner" || typeof actor.subject !== "string") return error5(403, "owner_required");
  const url = new URL(request.url), path2 = url.pathname;
  try {
    if (request.method === "GET") {
      if (path2 === "/v1/admin/pricing/bulk") return getExport(db, url);
      if (path2 === "/v1/admin/pricing/history") return getHistory(db, url);
      return error5(405, "method_not_allowed");
    }
    if (request.method !== "POST" || url.search !== "") return error5(405, "method_not_allowed");
    if (![
      "/v1/admin/pricing/bulk/preview",
      "/v1/admin/pricing/bulk/apply",
      "/v1/admin/pricing/approve"
    ].includes(path2)) return error5(404, "not_found");
    const input = await readBody3(request);
    if (path2 === "/v1/admin/pricing/approve") return approve(db, input, actor);
    const rows = normalize(input);
    if (!rows) return error5(400, "invalid_batch");
    if (path2.endsWith("/apply") && (!UUID9(input.request_id) || input.confirm !== "XAC_NHAN_GIA_NHAP" || !/^[a-f0-9]{64}$/.test(input.preview_fingerprint || "")))
      return error5(400, "confirmation_required");
    if (path2.endsWith("/preview")) {
      const state = await db((c) => snapshot(c, rows)), result = plan(rows, state);
      return reply3(200, {
        ...result,
        preview_fingerprint: await fingerprint(rows, state),
        saved: false,
        privacy: "internal_only",
        default_effective_date: vnDay()
      });
    }
    const response = await transaction3(db, async (c) => {
      await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["fbmn-batch:" + input.request_id]);
      const existing = await c.query("SELECT payload_sha256,created_count,updated_count,unchanged_count FROM fbmn_catalog_private.pricebook_import_batches WHERE id=$1", [input.request_id]);
      const payloadHash = await hash(rows);
      if (existing.rowCount) {
        if (existing.rows[0].payload_sha256 !== payloadHash) throw Error("idempotency_conflict");
        return { ...existing.rows[0], replayed: true, publicly_published: false };
      }
      for (const s of [...new Set(rows.filter((r) => SKU(r.sku_cong_ty)).map((r) => r.sku_cong_ty))].sort()) {
        await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["fbmn-price:" + s]);
      }
      const state = await snapshot(c, rows), result = plan(rows, state);
      if (result.invalid) throw Error("invalid_rows");
      if (await fingerprint(rows, state) !== input.preview_fingerprint) throw Error("stale_preview");
      await c.query(
        "INSERT INTO fbmn_catalog_private.pricebook_import_batches (id,payload_sha256,actor_subject,source_document,rows_total,created_count,updated_count,unchanged_count) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          input.request_id,
          payloadHash,
          actor.subject,
          input.source_document || "Mixed source",
          rows.length,
          result.created,
          result.updated,
          result.unchanged
        ]
      );
      for (const row of result.changes) {
        if (!["new", "updated"].includes(row.status)) continue;
        let entryId = row.entry_id, newRevision;
        if (row.status === "new") {
          const saved = await c.query(
            "INSERT INTO fbmn_catalog_private.pricebook_entries (sku_cong_ty,price_kind,customer_id,amount_vnd,currency,vat_included,vat_rate_bps,source_document,effective_from,effective_until,updated_by) VALUES($1,$2,$3,$4,'VND',$5,$6,$7,$8,$9,$10) RETURNING id::text AS id,revision",
            [
              row.sku_cong_ty,
              row.price_kind,
              row.customer_id,
              row.amount_vnd,
              row.vat_included,
              row.vat_rate_bps,
              row.source_document,
              row.effective_from,
              row.effective_until,
              actor.subject
            ]
          );
          entryId = saved.rows[0].id;
          newRevision = saved.rows[0].revision;
        } else {
          const saved = await c.query(
            "UPDATE fbmn_catalog_private.pricebook_entries SET amount_vnd=$1,vat_included=$2,vat_rate_bps=$3,source_document=$4,effective_until=$5,revision=revision+1,updated_by=$6,updated_at=now() WHERE id=$7 AND revision=$8 AND approval_state='draft' RETURNING revision",
            [
              row.amount_vnd,
              row.vat_included,
              row.vat_rate_bps,
              row.source_document,
              row.effective_until,
              actor.subject,
              row.entry_id,
              row.expected_revision
            ]
          );
          if (saved.rowCount !== 1) throw Error("stale_preview");
          newRevision = saved.rows[0].revision;
        }
        await c.query(
          "INSERT INTO fbmn_catalog_private.pricebook_audit (entry_id,actor_subject,action,old_revision,new_revision,old_amount_vnd,new_amount_vnd,old_vat_included,new_vat_included,source_document,batch_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
          [
            entryId,
            actor.subject,
            row.status === "new" ? "create_draft" : "update_draft",
            row.expected_revision,
            newRevision,
            row.status === "new" ? null : row.old_amount_vnd,
            row.amount_vnd,
            row.status === "new" ? null : state.entries.find((e) => e.id === entryId)?.vat_included,
            row.vat_included,
            row.source_document,
            input.request_id
          ]
        );
      }
      return {
        created_count: result.created,
        updated_count: result.updated,
        unchanged_count: result.unchanged,
        rows_total: rows.length,
        replayed: false,
        publicly_published: false
      };
    });
    return reply3(200, response);
  } catch (e) {
    if (["stale_preview", "invalid_rows", "idempotency_conflict", "pricebook_conflict"].includes(e?.message) || ["23503", "23505", "23514", "40001"].includes(e?.code))
      return error5(409, e.message === "invalid_rows" ? "invalid_rows" : "pricebook_conflict");
    return error5(503, "pricebook_unavailable");
  }
}
__name(handleBulkPricebook, "handleBulkPricebook");

// managed-price-lists-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// managed-price-import-service.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var NS = "fbmn_catalog_private";
var uuid4 = /* @__PURE__ */ __name((s) => typeof s === "string" && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(s), "uuid");
var date3 = /* @__PURE__ */ __name((s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && (/* @__PURE__ */ new Date(s + "T00:00:00Z")).toISOString().slice(0, 10) === s, "date");
var money = /* @__PURE__ */ __name((s) => typeof s === "string" && /^(0|[1-9][0-9]{0,12})$/.test(s) && BigInt(s) <= 1000000000000n, "money");
var res = /* @__PURE__ */ __name((status, data2) => Response.json(status === 200 ? { data: data2 } : { error: { code: data2 } }, { status, headers: { "Cache-Control": "private, no-store" } }), "res");
function invalid(input) {
  if (!input || !uuid4(input.list_id) || !Array.isArray(input.rows) || input.rows.length < 1 || input.rows.length > 1e3 || !date3(input.valid_from) || input.valid_until !== null && input.valid_until !== void 0 && (!date3(input.valid_until) || input.valid_until < input.valid_from) || typeof input.source_document !== "string" || input.source_document.trim().length < 1 || input.source_document.length > 300 || input.vat_included !== null && input.vat_included !== void 0 && typeof input.vat_included !== "boolean") return "invalid_bulk_input";
  if (input.rows.some((r) => !r || !Number.isInteger(r.line) || r.line < 2 || r.line > 2e3 || typeof r.sku_cong_ty !== "string" || r.sku_cong_ty.length > 80 || typeof r.amount_vnd !== "string" || r.amount_vnd.length > 32)) return "invalid_bulk_row";
  return null;
}
__name(invalid, "invalid");
async function fingerprint2(input, revision2, changes) {
  const canonical = JSON.stringify({
    list_id: input.list_id,
    list_revision: revision2,
    source_document: input.source_document,
    valid_from: input.valid_from,
    valid_until: input.valid_until ?? null,
    vat_included: input.vat_included ?? null,
    rows: changes.map((r) => [
      r.line,
      r.sku_cong_ty,
      r.amount_vnd,
      r.status,
      r.old_amount_vnd,
      r.old_revision,
      r.vat_included,
      r.valid_until,
      r.issue
    ])
  });
  const hash2 = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(hash2)).map((x) => x.toString(16).padStart(2, "0")).join("");
}
__name(fingerprint2, "fingerprint");
async function inspect(c, input, lock2) {
  const list2 = await c.query("SELECT id::text,list_code,list_name,approval_state,revision,valid_from::text,valid_until::text FROM " + NS + ".managed_price_lists WHERE id=$1" + (lock2 ? " FOR UPDATE" : ""), [input.list_id]);
  if (list2.rowCount !== 1) return { error: "price_list_not_found" };
  const target = list2.rows[0];
  if (target.approval_state === "inactive") return { error: "list_not_editable" };
  if (input.valid_from < target.valid_from || target.valid_until !== null && (input.valid_from > target.valid_until || input.valid_until !== null && input.valid_until !== void 0 && input.valid_until > target.valid_until))
    return { error: "period_outside_price_list" };
  const keys = [...new Set(input.rows.map((r) => r.sku_cong_ty).filter(Boolean))];
  const skus = await c.query("SELECT sku_cong_ty,ten_san_pham,ten_goc_xnt FROM fbmn_catalog.skus WHERE sku_cong_ty=ANY($1::text[])", [keys]);
  const names = new Map(skus.rows.map((r) => [r.sku_cong_ty, r.ten_san_pham || r.ten_goc_xnt || null]));
  const old = await c.query("SELECT DISTINCT ON (sku_cong_ty) id::text,sku_cong_ty,amount_vnd::text,vat_included,revision,approval_state,valid_from::text,valid_until::text FROM " + NS + ".managed_price_list_prices WHERE list_id=$1 AND sku_cong_ty=ANY($2::text[]) AND valid_from<=$3::date ORDER BY sku_cong_ty,valid_from DESC", [input.list_id, keys, input.valid_from]);
  const existing = new Map(old.rows.map((r) => [r.sku_cong_ty, r]));
  const approved = await c.query("SELECT sku_cong_ty,valid_from::text,valid_until::text FROM " + NS + ".managed_price_list_prices WHERE list_id=$1 AND sku_cong_ty=ANY($2::text[]) AND approval_state='approved' AND daterange(valid_from,valid_until,'[]') && daterange($3::date,$4::date,'[]')", [
    input.list_id,
    keys,
    input.valid_from,
    input.valid_until ?? null
  ]);
  const approvedBySku = /* @__PURE__ */ new Map();
  for (const r of approved.rows) {
    if (!approvedBySku.has(r.sku_cong_ty)) approvedBySku.set(r.sku_cong_ty, []);
    approvedBySku.get(r.sku_cong_ty).push(r);
  }
  const seen = /* @__PURE__ */ new Set();
  const changes = input.rows.map((r) => {
    const sku = r.sku_cong_ty, amount = r.amount_vnd.trim(), before = existing.get(sku) || null;
    const vat = typeof input.vat_included === "boolean" ? input.vat_included : typeof before?.vat_included === "boolean" ? before.vat_included : null;
    const until = before?.valid_from === input.valid_from ? before.valid_until ?? null : input.valid_until ?? null;
    const overlaps = (approvedBySku.get(sku) || []).some((p) => (p.valid_from !== input.valid_from || target.approval_state !== "approved") && p.valid_from <= (until ?? "9999-12-31") && (p.valid_until === null || p.valid_until >= input.valid_from));
    let status = "new", issue = null;
    if (!sku || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/.test(sku)) issue = "invalid_sku";
    else if (seen.has(sku)) issue = "duplicate_sku";
    else if (!names.has(sku)) issue = "sku_not_found";
    else if (amount === "") status = "skipped";
    else if (!money(amount)) issue = "invalid_amount";
    else if (overlaps) issue = "approved_price_locked";
    else if (vat === null) issue = "vat_required";
    else if (before && before.valid_from === input.valid_from && before.amount_vnd === amount && before.vat_included === vat) status = "unchanged";
    else if (before?.valid_from === input.valid_from) status = "updated";
    if (sku) seen.add(sku);
    if (issue) status = "invalid";
    return {
      line: r.line,
      sku_cong_ty: sku,
      ten_san_pham: names.get(sku) || null,
      amount_vnd: amount,
      old_amount_vnd: before?.amount_vnd ?? null,
      old_revision: before?.revision ?? null,
      vat_included: vat,
      valid_until: until,
      status,
      issue
    };
  });
  const invalidCount = changes.filter((r) => r.status === "invalid").length;
  const created = changes.filter((r) => r.status === "new").length;
  const updated = changes.filter((r) => r.status === "updated").length;
  const unchanged = changes.filter((r) => r.status === "unchanged").length;
  const skipped = changes.filter((r) => r.status === "skipped").length;
  const hash2 = await fingerprint2(input, target.revision, changes);
  return {
    target,
    changes,
    invalid: invalidCount,
    created,
    updated,
    unchanged,
    skipped,
    preview_fingerprint: hash2
  };
}
__name(inspect, "inspect");
async function transaction4(db, fn) {
  return db(async (c) => {
    await c.query("BEGIN");
    try {
      const result = await fn(c);
      await c.query("COMMIT");
      return result;
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    }
  });
}
__name(transaction4, "transaction");
async function handleManagedPriceImport({ action, input, actor, db }) {
  if (actor?.role !== "owner") return res(403, "owner_required");
  const bad = invalid(input);
  if (bad) return res(400, bad);
  if (action !== "bulk-preview" && action !== "bulk-apply") return res(404, "not_found");
  if (action === "bulk-apply" && (!/^[0-9a-f]{64}$/.test(input.preview_fingerprint || "") || input.confirm !== "XAC_NHAN_GIA_NHAP")) return res(400, "missing_confirmation");
  if (action === "bulk-apply" && /TEST|KHONG_AP_DUNG/i.test(input.source_document))
    return res(409, "test_file_preview_only");
  try {
    if (action === "bulk-preview") {
      const preview = await db((c) => inspect(c, input, false));
      return preview.error ? res(409, preview.error) : res(200, preview);
    }
    const result = await transaction4(db, async (c) => {
      const preview = await inspect(c, input, true);
      if (preview.error) throw Error(preview.error);
      if (preview.invalid || preview.created + preview.updated === 0 || preview.preview_fingerprint !== input.preview_fingerprint)
        throw Error("preview_stale");
      const modified = preview.changes.filter((r) => r.status === "new" || r.status === "updated");
      const writeRows = modified.map((r) => ({
        sku: r.sku_cong_ty,
        amount: r.amount_vnd,
        vat: r.vat_included,
        until_date: r.valid_until
      }));
      const appliedState = preview.target.approval_state === "approved" ? "approved" : "draft";
      const saved = await c.query("INSERT INTO " + NS + ".managed_price_list_prices (list_id,sku_cong_ty,amount_vnd,vat_included,source_document,valid_from,valid_until,updated_by,approval_state,approved_by,approved_at) SELECT $1::uuid,rec.sku,rec.amount::bigint,rec.vat::boolean,$3,$4::date,rec.until_date::date,$5,$6::text,CASE WHEN $6::text='approved' THEN $5 ELSE NULL END,CASE WHEN $6::text='approved' THEN now() ELSE NULL END FROM jsonb_to_recordset($2::jsonb) AS rec(sku text,amount text,vat boolean,until_date text) ON CONFLICT (list_id,sku_cong_ty,valid_from) DO UPDATE SET amount_vnd=EXCLUDED.amount_vnd,vat_included=EXCLUDED.vat_included,source_document=EXCLUDED.source_document,valid_until=EXCLUDED.valid_until,approval_state=EXCLUDED.approval_state,approved_by=EXCLUDED.approved_by,approved_at=EXCLUDED.approved_at,revision=managed_price_list_prices.revision+1,updated_by=EXCLUDED.updated_by,updated_at=now() WHERE " + NS + ".managed_price_list_prices.approval_state='draft' OR $6::text='approved' RETURNING id::text,sku_cong_ty", [
        input.list_id,
        JSON.stringify(writeRows),
        input.source_document,
        input.valid_from,
        actor.subject,
        appliedState
      ]);
      if (saved.rowCount !== modified.length) throw Error("preview_stale");
      const ids = new Map(saved.rows.map((r) => [r.sku_cong_ty, r.id]));
      const audit5 = modified.map((r) => ({
        price_id: ids.get(r.sku_cong_ty),
        action: r.status === "new" ? "price.create" : "price.update",
        old_value: r.old_amount_vnd === null ? null : {
          sku_cong_ty: r.sku_cong_ty,
          amount_vnd: r.old_amount_vnd,
          revision: r.old_revision
        },
        new_value: {
          sku_cong_ty: r.sku_cong_ty,
          amount_vnd: r.amount_vnd,
          vat_included: r.vat_included,
          source_document: input.source_document,
          valid_from: input.valid_from,
          valid_until: r.valid_until,
          approval_state: appliedState
        }
      }));
      await c.query("INSERT INTO " + NS + ".managed_price_audit (actor_subject,action,list_id,price_id,old_value,new_value) SELECT $1,row.action,$2::uuid,row.price_id::uuid,row.old_value,row.new_value FROM jsonb_to_recordset($3::jsonb) AS row(price_id text,action text,old_value jsonb,new_value jsonb)", [
        actor.subject,
        input.list_id,
        JSON.stringify(audit5)
      ]);
      return {
        created: preview.created,
        updated: preview.updated,
        unchanged: preview.unchanged,
        skipped: preview.skipped,
        applied: modified.length,
        list_code: preview.target.list_code,
        approval_state: appliedState
      };
    });
    return res(200, result);
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    return res(
      ["preview_stale", "list_not_editable", "price_list_not_found", "period_outside_price_list"].includes(code) ? 409 : 503,
      ["preview_stale", "list_not_editable", "price_list_not_found", "period_outside_price_list"].includes(code) ? code : "managed_bulk_unavailable"
    );
  }
}
__name(handleManagedPriceImport, "handleManagedPriceImport");

// managed-price-lists-service.mjs
var S = "fbmn_catalog_private";
var UUID10 = /* @__PURE__ */ __name((v) => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v), "UUID");
var CODE = /* @__PURE__ */ __name((v) => typeof v === "string" && /^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(v), "CODE");
var DATE2 = /* @__PURE__ */ __name((v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && (/* @__PURE__ */ new Date(v + "T00:00:00Z")).toISOString().slice(0, 10) === v, "DATE");
var TEXT = /* @__PURE__ */ __name((v, min, max) => typeof v === "string" && v === v.trim() && v.length >= min && v.length <= max && !/[\x00-\x1f\x7f]/.test(v), "TEXT");
var CHANNELS = /* @__PURE__ */ new Set(["public_web", "consumer_app", "dealer_app"]);
var CUSTOMER_TYPES = /* @__PURE__ */ new Set(["distributor", "dealer", "bookstore", "school", "enterprise", "factory", "other"]);
var ERR = /* @__PURE__ */ __name((status, code) => Response.json({ error: { code } }, { status, headers: { "Cache-Control": "private, no-store" } }), "ERR");
var OK = /* @__PURE__ */ __name((data2) => Response.json({ data: data2 }, { headers: { "Cache-Control": "private, no-store" } }), "OK");
var today = /* @__PURE__ */ __name(() => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(/* @__PURE__ */ new Date());
  const get = /* @__PURE__ */ __name((key2) => parts.find((part) => part.type === key2)?.value, "get");
  return get("year") + "-" + get("month") + "-" + get("day");
}, "today");
async function body3(request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return null;
  const text = await request.text();
  if (text.length > 48e4) return null;
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
__name(body3, "body");
var AUDIT12 = "INSERT INTO " + S + ".managed_price_audit(actor_subject,action,list_id,price_id,old_value,new_value) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb)";
var snapshot2 = /* @__PURE__ */ __name((record3) => record3 ? JSON.stringify(record3) : null, "snapshot");
async function log3(c, actor, action, id, price, previous, next) {
  await c.query(AUDIT12, [actor.subject, action, id || null, price || null, snapshot2(previous), snapshot2(next)]);
}
__name(log3, "log");
async function tx4(db, fn) {
  return db(async (c) => {
    await c.query("BEGIN");
    try {
      const result = await fn(c);
      await c.query("COMMIT");
      return result;
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    }
  });
}
__name(tx4, "tx");
function validateList(input, creating = false) {
  if (!input || creating && !CODE(input.list_code) || !TEXT(input.list_name, 2, 120) || typeof input.note !== "string" || input.note.length > 500 || !["internal", "consumer", "dealer", "mixed"].includes(input.audience) || !Array.isArray(input.channel_codes) || input.channel_codes.length > 3 || new Set(input.channel_codes).size !== input.channel_codes.length || !input.channel_codes.every((x) => CHANNELS.has(x)) || !Number.isInteger(input.priority) || input.priority < 0 || input.priority > 1e4 || !DATE2(input.valid_from) || input.valid_until !== null && (!DATE2(input.valid_until) || input.valid_until < input.valid_from))
    return "invalid_price_list";
  const channels = input.channel_codes;
  const type = input.scope_customer_type ?? null, id = input.scope_customer_id ?? null;
  if (type !== null && !CUSTOMER_TYPES.has(type) || id !== null && !UUID10(id) || type && id) return "invalid_customer_scope";
  if (input.audience === "internal" && (channels.length !== 0 || type || id) || input.audience === "consumer" && (channels.length === 0 || channels.some((x) => x === "dealer_app") || type || id) || input.audience === "dealer" && (channels.length !== 1 || channels[0] !== "dealer_app") || input.audience === "mixed" && (channels.length < 2 || !channels.includes("dealer_app") || !channels.some((x) => x === "public_web" || x === "consumer_app") || type || id))
    return "invalid_channel_scope";
  return null;
}
__name(validateList, "validateList");
async function customerExists(c, id) {
  if (!id) return true;
  const r = await c.query("SELECT id FROM futurebook.customers WHERE id=$1 AND status='active'", [id]);
  return r.rowCount === 1;
}
__name(customerExists, "customerExists");
async function getLists(db) {
  const result = await db((c) => c.query("SELECT l.id::text,l.list_code,l.list_name,l.note,l.audience,l.channel_codes,l.scope_customer_type,l.scope_customer_id::text,l.priority,l.valid_from::text,l.valid_until::text,l.approval_state,l.revision,l.created_at::text,c.customer_code,c.display_name AS customer_name,(SELECT count(*)::int FROM " + S + ".managed_price_list_prices p WHERE p.list_id=l.id) price_count, (SELECT count(*)::int FROM " + S + ".managed_price_list_prices p WHERE p.list_id=l.id AND p.approval_state='draft') draft_count FROM " + S + ".managed_price_lists l LEFT JOIN futurebook.customers c ON c.id=l.scope_customer_id ORDER BY l.created_at DESC,l.list_code LIMIT 1000"));
  return OK({ items: result.rows });
}
__name(getLists, "getLists");
async function getCustomers(db, url) {
  const keys = [...url.searchParams.keys()];
  if (keys.some((k) => k !== "q") || keys.length > 1) return ERR(400, "invalid_query");
  const q = (url.searchParams.get("q") || "").trim();
  if (q.length > 80) return ERR(400, "invalid_query");
  const result = await db((c) => c.query("SELECT id::text,customer_code,display_name,customer_type,status FROM futurebook.customers WHERE (position(lower($1) in lower(customer_code))>0 OR position(lower($1) in lower(display_name))>0) ORDER BY CASE WHEN status='active' THEN 0 ELSE 1 END,customer_code LIMIT 60", [q]));
  return OK({ items: result.rows });
}
__name(getCustomers, "getCustomers");
async function createList(db, input, actor) {
  const problem = validateList(input, true);
  if (problem) return ERR(400, problem);
  try {
    const value = await tx4(db, async (c) => {
      if (!await customerExists(c, input.scope_customer_id)) throw Error("customer_not_found");
      const result = await c.query("INSERT INTO " + S + ".managed_price_lists (list_code,list_name,note,audience,channel_codes,scope_customer_type,scope_customer_id,priority,valid_from,valid_until,created_by,updated_by) VALUES ($1,$2,$3,$4,$5::text[],$6,$7::uuid,$8,$9::date,$10::date,$11,$11) RETURNING id::text,list_code,list_name,revision,approval_state", [
        input.list_code,
        input.list_name,
        input.note,
        input.audience,
        input.channel_codes,
        input.scope_customer_type || null,
        input.scope_customer_id || null,
        input.priority,
        input.valid_from,
        input.valid_until,
        actor.subject
      ]);
      await log3(c, actor, "list.create", result.rows[0].id, null, null, result.rows[0]);
      return result.rows[0];
    });
    return OK(value);
  } catch (e) {
    return ERR(e?.code === "23505" ? 409 : 503, e?.code === "23505" ? "duplicate_price_list_code" : "price_list_write_failed");
  }
}
__name(createList, "createList");
async function updateList(db, input, actor, mode) {
  if (!UUID10(input?.id) || !Number.isInteger(input.expected_revision) || input.expected_revision < 1 || mode === "edit" && validateList(input)) return ERR(400, "invalid_price_list_update");
  try {
    const result = await tx4(db, async (c) => {
      const old = await c.query("SELECT * FROM " + S + ".managed_price_lists WHERE id=$1 FOR UPDATE", [input.id]);
      if (old.rowCount !== 1 || old.rows[0].revision !== input.expected_revision) throw Error("revision_conflict");
      const previous = old.rows[0];
      if (mode === "edit" && previous.approval_state === "approved" && (previous.audience !== input.audience || JSON.stringify(previous.channel_codes) !== JSON.stringify(input.channel_codes) || (previous.scope_customer_type || null) !== (input.scope_customer_type || null) || (previous.scope_customer_id || null) !== (input.scope_customer_id || null)))
        throw Error("active_scope_locked");
      if (mode === "apply") {
        const all = await c.query("SELECT * FROM " + S + ".managed_price_list_prices WHERE list_id=$1 FOR UPDATE", [input.id]);
        if (!all.rowCount) throw Error("price_required");
        const overlap = await c.query("SELECT 1 FROM " + S + ".managed_price_list_prices a JOIN " + S + ".managed_price_list_prices b ON b.list_id=a.list_id AND b.sku_cong_ty=a.sku_cong_ty AND b.id>a.id AND daterange(a.valid_from,a.valid_until,'[]') && daterange(b.valid_from,b.valid_until,'[]') WHERE a.list_id=$1 LIMIT 1", [input.id]);
        if (overlap.rowCount) throw Error("price_period_overlap");
        const changed = await c.query("UPDATE " + S + ".managed_price_list_prices SET approval_state='approved',approved_by=$2,approved_at=now(),revision=revision+1,updated_by=$2,updated_at=now() WHERE list_id=$1 AND approval_state='draft' RETURNING *", [
          input.id,
          actor.subject
        ]);
        if (previous.approval_state === "approved" && !changed.rowCount) throw Error("already_applied");
        if (changed.rowCount) {
          const original = new Map(all.rows.map((row) => [String(row.id), row]));
          const audit5 = changed.rows.map((row) => ({
            price_id: row.id,
            old_value: original.get(String(row.id)),
            new_value: row
          }));
          await c.query("INSERT INTO " + S + ".managed_price_audit (actor_subject,action,list_id,price_id,old_value,new_value) SELECT $1,'price.apply',$2::uuid,row.price_id::uuid,row.old_value,row.new_value FROM jsonb_to_recordset($3::jsonb) AS row(price_id text,old_value jsonb,new_value jsonb)", [
            actor.subject,
            input.id,
            JSON.stringify(audit5)
          ]);
        }
      }
      if (mode === "deactivate" && previous.approval_state === "inactive") throw Error("already_inactive");
      if (mode === "edit" && !await customerExists(c, input.scope_customer_id)) throw Error("customer_not_found");
      let updated;
      if (mode === "edit") {
        const query = await c.query("UPDATE " + S + ".managed_price_lists SET list_name=$1,note=$2,audience=$3,channel_codes=$4::text[],scope_customer_type=$5,scope_customer_id=$6::uuid,priority=$7,valid_from=$8::date,valid_until=$9::date,revision=revision+1,updated_by=$10,updated_at=now() WHERE id=$11 RETURNING *", [
          input.list_name,
          input.note,
          input.audience,
          input.channel_codes,
          input.scope_customer_type || null,
          input.scope_customer_id || null,
          input.priority,
          input.valid_from,
          input.valid_until,
          actor.subject,
          input.id
        ]);
        updated = query.rows[0];
      } else {
        const next = mode === "apply" ? "approved" : "inactive";
        updated = (await c.query("UPDATE " + S + ".managed_price_lists SET approval_state=$1,approved_by=$2,approved_at=$3,revision=revision+1,updated_by=$4,updated_at=now() WHERE id=$5 RETURNING *", [
          next,
          next === "approved" ? actor.subject : null,
          next === "approved" ? (/* @__PURE__ */ new Date()).toISOString() : null,
          actor.subject,
          input.id
        ])).rows[0];
      }
      await log3(
        c,
        actor,
        "list." + (mode === "edit" ? "update" : mode === "apply" ? "apply" : "deactivate"),
        input.id,
        null,
        previous,
        updated
      );
      return { id: input.id, revision: updated.revision, approval_state: updated.approval_state };
    });
    return OK(result);
  } catch (e) {
    const c = e?.message;
    return ERR(
      [
        "revision_conflict",
        "active_scope_locked",
        "price_required",
        "price_period_overlap",
        "already_applied",
        "already_inactive",
        "customer_not_found"
      ].includes(c) ? 409 : 503,
      [
        "revision_conflict",
        "active_scope_locked",
        "price_required",
        "price_period_overlap",
        "already_applied",
        "already_inactive",
        "customer_not_found"
      ].includes(c) ? c : "price_list_write_failed"
    );
  }
}
__name(updateList, "updateList");
async function getPrices(db, url) {
  const id = url.searchParams.get("list_id");
  if ([...url.searchParams.keys()].some((k) => k !== "list_id") || !UUID10(id)) return ERR(400, "invalid_query");
  const result = await db((c) => c.query("SELECT p.id::text,p.list_id::text,p.sku_cong_ty,s.ten_san_pham,s.ten_goc_xnt,p.amount_vnd::text,p.vat_included,p.source_document,p.valid_from::text,p.valid_until::text,p.approval_state,p.revision FROM " + S + ".managed_price_list_prices p JOIN fbmn_catalog.skus s ON s.sku_cong_ty=p.sku_cong_ty WHERE p.list_id=$1 ORDER BY p.sku_cong_ty,p.valid_from DESC LIMIT 2000", [id]));
  return OK({ items: result.rows });
}
__name(getPrices, "getPrices");
async function getExportPrices(db, url) {
  const id = url.searchParams.get("list_id"), period = url.searchParams.get("period");
  if ([...url.searchParams.keys()].some((k) => !["list_id", "period"].includes(k)) || !UUID10(id) || !DATE2(period)) return ERR(400, "invalid_query");
  const result = await db((c) => c.query("SELECT p.sku_cong_ty,p.amount_vnd::text,p.valid_from::text FROM " + S + ".managed_price_list_prices p WHERE p.list_id=$1 AND p.valid_from=$2::date ORDER BY p.sku_cong_ty LIMIT 10001", [id, period]));
  if (result.rows.length > 1e4) return ERR(409, "export_too_large");
  return OK({ items: result.rows });
}
__name(getExportPrices, "getExportPrices");
var MONEY = /* @__PURE__ */ __name((v) => typeof v === "string" && /^(0|[1-9][0-9]{0,12})$/.test(v) && BigInt(v) <= 1000000000000n, "MONEY");
async function setPrice(db, input, actor) {
  if (!UUID10(input?.list_id) || !Number.isInteger(input.expected_list_revision) || input.expected_list_revision < 1 || !TEXT(input.sku_cong_ty, 1, 80) || !MONEY(input.amount_vnd) || typeof input.vat_included !== "boolean" || !TEXT(input.source_document, 1, 300) || !DATE2(input.valid_from) || input.valid_until !== null && (!DATE2(input.valid_until) || input.valid_until < input.valid_from))
    return ERR(400, "invalid_price");
  try {
    const value = await tx4(db, async (c) => {
      await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["managed-price:" + input.list_id + ":" + input.sku_cong_ty]);
      const list2 = await c.query("SELECT approval_state,revision FROM " + S + ".managed_price_lists WHERE id=$1 FOR UPDATE", [input.list_id]);
      if (list2.rowCount !== 1 || list2.rows[0].approval_state === "inactive") throw Error("list_not_editable");
      if (list2.rows[0].revision !== input.expected_list_revision) throw Error("revision_conflict");
      const sku = await c.query("SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE sku_cong_ty=$1", [input.sku_cong_ty]);
      if (sku.rowCount !== 1) throw Error("sku_not_found");
      const previous = await c.query("SELECT * FROM " + S + ".managed_price_list_prices WHERE list_id=$1 AND sku_cong_ty=$2 AND valid_from=$3::date FOR UPDATE", [
        input.list_id,
        input.sku_cong_ty,
        input.valid_from
      ]);
      const old = previous.rows[0] || null;
      if (list2.rows[0].approval_state === "approved") {
        const overlaps = await c.query("SELECT 1 FROM " + S + ".managed_price_list_prices WHERE list_id=$1 AND sku_cong_ty=$2 AND approval_state='approved' AND id IS DISTINCT FROM $3::uuid AND daterange(valid_from,valid_until,'[]') && daterange($4::date,$5::date,'[]') LIMIT 1", [
          input.list_id,
          input.sku_cong_ty,
          old?.id || null,
          input.valid_from,
          input.valid_until
        ]);
        if (overlaps.rowCount) throw Error("price_period_overlap");
      }
      let updated;
      if (old) {
        if (!Number.isInteger(input.expected_revision) || old.revision !== input.expected_revision)
          throw Error("revision_conflict");
        updated = (await c.query("UPDATE " + S + ".managed_price_list_prices SET amount_vnd=$1,vat_included=$2,source_document=$3,valid_until=$4::date,approval_state=$7,approved_by=$8,approved_at=$9,revision=revision+1,updated_by=$5,updated_at=now() WHERE id=$6 RETURNING *", [
          input.amount_vnd,
          input.vat_included,
          input.source_document,
          input.valid_until,
          actor.subject,
          old.id,
          list2.rows[0].approval_state === "approved" ? "approved" : old.approval_state,
          list2.rows[0].approval_state === "approved" ? actor.subject : old.approved_by || null,
          list2.rows[0].approval_state === "approved" ? (/* @__PURE__ */ new Date()).toISOString() : old.approved_at || null
        ])).rows[0];
      } else {
        updated = (await c.query("INSERT INTO " + S + ".managed_price_list_prices (list_id,sku_cong_ty,amount_vnd,vat_included,source_document,valid_from,valid_until,updated_by,approval_state,approved_by,approved_at) VALUES($1,$2,$3,$4,$5,$6::date,$7::date,$8,$9,$10,$11) RETURNING *", [
          input.list_id,
          input.sku_cong_ty,
          input.amount_vnd,
          input.vat_included,
          input.source_document,
          input.valid_from,
          input.valid_until,
          actor.subject,
          list2.rows[0].approval_state === "approved" ? "approved" : "draft",
          list2.rows[0].approval_state === "approved" ? actor.subject : null,
          list2.rows[0].approval_state === "approved" ? (/* @__PURE__ */ new Date()).toISOString() : null
        ])).rows[0];
      }
      await log3(c, actor, old ? "price.update" : "price.create", input.list_id, updated.id, old, updated);
      return { id: updated.id, revision: updated.revision, approval_state: updated.approval_state };
    });
    return OK(value);
  } catch (e) {
    const code = e?.message;
    return ERR(
      [
        "list_not_editable",
        "sku_not_found",
        "price_period_overlap",
        "revision_conflict"
      ].includes(code) ? 409 : 503,
      ["list_not_editable", "sku_not_found", "price_period_overlap", "revision_conflict"].includes(code) ? code : "price_write_failed"
    );
  }
}
__name(setPrice, "setPrice");
async function resolvePrice(db, input) {
  if (!input || !TEXT(input.sku_cong_ty, 1, 80) || !CHANNELS.has(input.channel_code) || input.price_at !== void 0 && input.price_at !== null && !DATE2(input.price_at))
    return ERR(400, "invalid_resolution");
  const dealer = input.channel_code === "dealer_app";
  if (dealer ? !TEXT(input.customer_code, 1, 80) : Boolean(input.customer_code))
    return ERR(400, "customer_required_for_dealer");
  try {
    const result = await db(async (c) => {
      let customer = null;
      if (dealer) {
        const found = await c.query("SELECT id::text,customer_code,customer_type FROM futurebook.customers WHERE customer_code=$1 AND status='active'", [input.customer_code]);
        if (found.rowCount !== 1) return { status: "customer_not_found" };
        customer = found.rows[0];
      }
      const at = input.price_at || today();
      const rows = await c.query(
        "SELECT l.id::text AS list_id,l.list_code,l.list_name,l.audience,l.priority,l.scope_customer_id::text AS scope_customer_id,l.scope_customer_type,p.id::text AS price_id,p.amount_vnd::text AS amount_vnd,p.vat_included,p.source_document,p.valid_from::text AS valid_from,CASE WHEN l.scope_customer_id IS NOT NULL THEN 3 WHEN l.scope_customer_type IS NOT NULL THEN 2 ELSE 1 END AS specificity FROM " + S + ".managed_price_lists l JOIN " + S + ".managed_price_list_prices p ON p.list_id=l.id WHERE l.approval_state='approved' AND p.approval_state='approved' AND p.sku_cong_ty=$1 AND $2::text=ANY(l.channel_codes) AND l.valid_from<=$3::date AND (l.valid_until IS NULL OR l.valid_until>=$3::date) AND p.valid_from<=$3::date AND (p.valid_until IS NULL OR p.valid_until>=$3::date) AND ((l.audience IN ('consumer','mixed') AND $2::text IN ('public_web','consumer_app') AND l.scope_customer_id IS NULL AND l.scope_customer_type IS NULL) OR (l.audience IN ('dealer','mixed') AND $2::text='dealer_app' AND (l.scope_customer_id IS NULL OR l.scope_customer_id=$4::uuid) AND (l.scope_customer_type IS NULL OR l.scope_customer_type=$5::text))) ORDER BY specificity DESC,l.priority DESC,p.valid_from DESC,l.list_code LIMIT 51",
        [
          input.sku_cong_ty,
          input.channel_code,
          at,
          customer?.id || null,
          customer?.customer_type || null
        ]
      );
      if (rows.rows.length > 50) return { status: "too_many_matches" };
      if (!rows.rows.length) return { status: "no_price", sku_cong_ty: input.sku_cong_ty };
      const first = rows.rows[0], next = rows.rows[1];
      if (next && Number(first.specificity) === Number(next.specificity) && first.priority === next.priority && first.valid_from === next.valid_from) {
        return {
          status: "ambiguous_price",
          sku_cong_ty: input.sku_cong_ty,
          conflicting_list_codes: [first.list_code, next.list_code]
        };
      }
      return {
        status: "resolved",
        sku_cong_ty: input.sku_cong_ty,
        channel_code: input.channel_code,
        customer_code: customer?.customer_code || null,
        at,
        matched_list_id: first.list_id,
        matched_list_code: first.list_code,
        matched_list_name: first.list_name,
        amount_vnd: first.amount_vnd,
        vat_included: first.vat_included,
        source_document: first.source_document,
        precedence: first.specificity,
        priority: first.priority
      };
    });
    return OK(result);
  } catch {
    return ERR(503, "price_resolution_unavailable");
  }
}
__name(resolvePrice, "resolvePrice");
async function handleManagedPriceLists({ request, actor, db }) {
  if (actor?.role !== "owner") return ERR(403, "owner_required");
  const u = new URL(request.url), prefix = "/v1/admin/pricing/managed";
  const action = u.pathname === prefix ? "" : u.pathname.startsWith(prefix + "/") ? u.pathname.slice(prefix.length + 1) : "unknown";
  if (request.method === "GET") {
    try {
      if (action === "" && u.search === "") return await getLists(db);
      if (action === "customers") return await getCustomers(db, u);
      if (action === "prices") return await getPrices(db, u);
      if (action === "prices-export") return await getExportPrices(db, u);
      return ERR(404, "not_found");
    } catch {
      return ERR(503, "pricing_unavailable");
    }
  }
  if (request.method !== "POST" || u.search) return ERR(405, "method_not_allowed");
  const input = await body3(request);
  if (!input) return ERR(400, "invalid_body");
  if (action === "create") return createList(db, input, actor);
  if (action === "update") return updateList(db, input, actor, "edit");
  if (action === "apply") return updateList(db, input, actor, "apply");
  if (action === "deactivate") return updateList(db, input, actor, "deactivate");
  if (action === "price") return setPrice(db, input, actor);
  if (action === "resolve") return resolvePrice(db, input);
  if (action === "bulk-preview" || action === "bulk-apply") return handleManagedPriceImport({ action, input, actor, db });
  return ERR(404, "not_found");
}
__name(handleManagedPriceLists, "handleManagedPriceLists");

// handler.mjs
var ROUTES = /* @__PURE__ */ new Map([
  ["/v1/admin/session", "session.read"],
  ["/v1/admin/channels", "channels.read"],
  ["/v1/admin/publish-capability", "publish.check"],
  ["/v1/admin/pricing-capability", "pricing.check"]
]);
var ROLES2 = /* @__PURE__ */ new Set(["viewer", "editor", "publisher", "pricing", "admin", "owner"]);
var PERMITTED = Object.freeze({
  "session.read": ROLES2,
  "channels.read": ROLES2,
  "publish.check": /* @__PURE__ */ new Set(["publisher", "admin", "owner"]),
  "pricing.check": /* @__PURE__ */ new Set(["pricing", "admin", "owner"]),
  "catalogue.manage": /* @__PURE__ */ new Set(["owner", "admin", "editor"]),
  "cms.manage": /* @__PURE__ */ new Set(["owner"]),
  "website.layout": /* @__PURE__ */ new Set(["owner"]),
  "website.catalogue": /* @__PURE__ */ new Set(["owner"]),
  "pricing.private": /* @__PURE__ */ new Set(["owner", "admin", "pricing"])
});
var error6 = /* @__PURE__ */ __name((status, code, corsOrigin) => reply4(status, { error: { code, message: "Y\xEAu c\u1EA7u kh\xF4ng th\u1EC3 x\u1EED l\xFD." } }, corsOrigin), "error");
function reply4(status, body4, corsOrigin) {
  const headers2 = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Vary": "Origin"
  });
  if (corsOrigin) headers2.set("Access-Control-Allow-Origin", corsOrigin);
  return new Response(JSON.stringify(body4), { status, headers: headers2 });
}
__name(reply4, "reply");
function createAdminApi({ verifyToken, loadActor, listChannels, recordAudit, catalogueDb, catalogueR2, catalogueBookR2, googleSecret, credentialStore, cmsPublicSurfaceReady = false, allowedOrigins = [] }) {
  if (![verifyToken, loadActor, listChannels, recordAudit].every((f) => typeof f === "function")) {
    throw new Error("ADM-01 dependencies required");
  }
  if (!Array.isArray(allowedOrigins) || !allowedOrigins.every((origin) => {
    try {
      return new URL(origin).origin === origin && origin.startsWith("https://");
    } catch {
      return false;
    }
  })) throw new Error("Invalid admin origin allowlist");
  const origins = new Set(allowedOrigins);
  return {
    async fetch(request) {
      const origin = request.headers.get("Origin");
      const corsOrigin = origin && origins.has(origin) ? origin : null;
      if (origin && !corsOrigin) return error6(403, "origin_forbidden", null);
      const url = new URL(request.url);
      const isPdfUpload = url.pathname === "/v1/admin/website/catalogue/pdf-upload";
      const action = url.pathname === "/v1/admin/website/catalogue" || url.pathname.startsWith("/v1/admin/website/catalogue/") ? "website.catalogue" : url.pathname === "/v1/admin/website/home-layout" || url.pathname === "/v1/admin/website/app-download" || url.pathname === "/v1/admin/website/category-display" || url.pathname === "/v1/admin/website/seo" || url.pathname === "/v1/admin/website/outsourcing-requests" || url.pathname === "/v1/admin/website/contact-requests" || url.pathname === "/v1/admin/website/chatbot-config" || url.pathname === "/v1/admin/website/chat-history" ? "website.layout" : url.pathname === "/v1/admin/cms" || url.pathname.startsWith("/v1/admin/cms/") ? "cms.manage" : url.pathname.startsWith("/v1/admin/catalogue/") ? "catalogue.manage" : url.pathname.startsWith("/v1/admin/pricing/") ? "pricing.private" : ROUTES.get(url.pathname);
      if (!action) return error6(404, "not_found", corsOrigin);
      if (request.method === "OPTIONS") {
        if (!corsOrigin) return error6(403, "origin_forbidden", null);
        const resp = new Response(null, { status: 204, headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": isPdfUpload ? "POST, OPTIONS" : "GET, OPTIONS",
          "Access-Control-Allow-Headers": isPdfUpload ? "Authorization, Content-Type, X-Catalogue-Book-Id, X-Catalogue-Revision" : "Authorization, Content-Type",
          "Cache-Control": "no-store",
          "Vary": "Origin"
        } });
        return resp;
      }
      const authorization = request.headers.get("Authorization") || "";
      const match = /^Bearer ([A-Za-z0-9._~+/-]+=*)$/.exec(authorization);
      if (!match) return error6(401, "unauthenticated", corsOrigin);
      let subject;
      try {
        subject = await verifyToken(match[1]);
      } catch {
        return error6(401, "unauthenticated", corsOrigin);
      }
      if (typeof subject !== "string" || subject.length < 1 || subject.length > 200) {
        return error6(401, "unauthenticated", corsOrigin);
      }
      let actor;
      try {
        actor = await loadActor(subject);
      } catch {
        return error6(503, "service_unavailable", corsOrigin);
      }
      if (!actor || !ROLES2.has(actor.role) || actor.enabled !== true) {
        try {
          await recordAudit({ subject, action, outcome: "denied" });
        } catch {
          return error6(503, "service_unavailable", corsOrigin);
        }
        return error6(403, "forbidden", corsOrigin);
      }
      if (!PERMITTED[action].has(actor.role)) {
        try {
          await recordAudit({ subject, action, outcome: "denied" });
        } catch {
          return error6(503, "service_unavailable", corsOrigin);
        }
        return error6(403, "forbidden", corsOrigin);
      }
      if (action === "website.catalogue") {
        const response = await handleCatalogueBooks({
          request,
          actor: { ...actor, subject },
          db: catalogueDb,
          r2: catalogueBookR2
        });
        if (isPdfUpload && corsOrigin) {
          const headers2 = new Headers(response.headers);
          headers2.set("Access-Control-Allow-Origin", corsOrigin);
          headers2.set("Vary", "Origin");
          return new Response(response.body, { status: response.status, headers: headers2 });
        }
        return response;
      }
      if (action === "website.layout") {
        const params = { request, actor: { ...actor, subject }, db: catalogueDb };
        if (url.pathname === "/v1/admin/website/chat-history") return handleChatHistory(params);
        if (url.pathname === "/v1/admin/website/seo") return handleSeoSettings(params);
        if (url.pathname === "/v1/admin/website/app-download") return handleAppDownloadSettings(params);
        if (url.pathname === "/v1/admin/website/chatbot-config") return handleChatbotConfig({ ...params, googleSecret, credentialStore });
        return url.pathname === "/v1/admin/website/category-display" ? handleCategoryDisplay(params) : url.pathname === "/v1/admin/website/outsourcing-requests" ? handleOutsourcingRequests(params) : url.pathname === "/v1/admin/website/contact-requests" ? handleContactRequests(params) : handleHomeLayout(params);
      }
      if (action === "cms.manage") {
        return handleCms({ request, actor: { ...actor, subject }, db: catalogueDb, r2: catalogueR2, publicSurfaceReady: cmsPublicSurfaceReady });
      }
      if (action === "pricing.private") {
        if (url.pathname === "/v1/admin/pricing/managed" || url.pathname.startsWith("/v1/admin/pricing/managed/")) {
          return handleManagedPriceLists({ request, actor: { ...actor, subject }, db: catalogueDb });
        }
        if (url.pathname !== "/v1/admin/pricing/entries") {
          return handleBulkPricebook({ request, actor: { ...actor, subject }, db: catalogueDb });
        }
        return handlePricebook({ request, actor: { ...actor, subject }, db: catalogueDb });
      }
      if (action === "catalogue.manage") {
        const result = await handleCatalogue({ request, actor: { ...actor, subject }, db: catalogueDb, r2: catalogueR2 });
        return result;
      }
      if (request.method !== "GET") return error6(405, "method_not_allowed", corsOrigin);
      if (url.search !== "") return error6(400, "invalid_query", corsOrigin);
      try {
        let data2;
        if (action === "session.read") {
          data2 = { role: actor.role, channels: ["admin", "owner"].includes(actor.role) ? ["public_web", "dealer_app", "consumer_app"] : actor.channels };
        } else if (action === "channels.read") {
          data2 = await listChannels(subject, ["admin", "owner"].includes(actor.role));
        } else {
          data2 = { allowed: true };
        }
        await recordAudit({ subject, action, outcome: "allowed" });
        return reply4(200, { data: data2 }, corsOrigin);
      } catch {
        return error6(503, "service_unavailable", corsOrigin);
      }
    }
  };
}
__name(createAdminApi, "createAdminApi");

// staging-worker.mjs
var ACCOUNT = "SELECT role::text AS role, enabled FROM fbmn_admin.principals WHERE auth_subject = $1";
var SCOPES = "SELECT channel_code FROM fbmn_admin.principal_channels WHERE auth_subject = $1 ORDER BY channel_code";
var CHANNELS2 = "SELECT code, label FROM fbmn_admin.channels ORDER BY code";
var AUDIT13 = "INSERT INTO fbmn_admin.audit_events (auth_subject, action, outcome) VALUES ($1, $2, $3)";
var unavailable = /* @__PURE__ */ __name(() => new Response(JSON.stringify({ error: { code: "service_unavailable", message: "Y\xEAu c\u1EA7u kh\xF4ng th\u1EC3 x\u1EED l\xFD." } }), {
  status: 503,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
}), "unavailable");
function httpsUrl(input) {
  try {
    return typeof input === "string" && new URL(input).protocol === "https:";
  } catch {
    return false;
  }
}
__name(httpsUrl, "httpsUrl");
function createAdminStagingWorker({ createDbClient = /* @__PURE__ */ __name((opts) => new Client(opts), "createDbClient"), fetchJwks: fetchJwks2 = createRemoteJWKSet }) {
  const jwksCache2 = /* @__PURE__ */ new Map();
  return {
    async fetch(request, env2) {
      if (!env2?.ADMIN_HYPERDRIVE?.connectionString || env2.EXPECTED_ADMIN_DB_ROLE !== "fbmn_admin_http_staging" || !httpsUrl(env2.NEON_AUTH_JWKS_URL) || !httpsUrl(env2.NEON_AUTH_ISSUER) || !httpsUrl(env2.NEON_AUTH_AUDIENCE) || !env2.ADMIN_ALLOWED_ORIGINS || // Require an exact branch-scoped JWKS; no untrusted key sources.
      new URL(env2.NEON_AUTH_AUDIENCE).origin !== env2.NEON_AUTH_ISSUER || env2.NEON_AUTH_JWKS_URL !== env2.NEON_AUTH_AUDIENCE.replace(/\/$/, "") + "/.well-known/jwks.json" || typeof env2.ADMIN_RATE_LIMITER?.limit !== "function") return unavailable();
      let limit;
      try {
        limit = await env2.ADMIN_RATE_LIMITER.limit({ key: (request.headers.get("CF-Connecting-IP") || "unknown").slice(0, 100) });
      } catch {
        return unavailable();
      }
      if (limit?.success !== true) return new Response(JSON.stringify({ error: { code: "rate_limited", message: "Y\xEAu c\u1EA7u kh\xF4ng th\u1EC3 x\u1EED l\xFD." } }), {
        status: 429,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
      });
      let jwks = jwksCache2.get(env2.NEON_AUTH_JWKS_URL);
      if (!jwks) {
        if (jwksCache2.size >= 3) jwksCache2.clear();
        jwks = fetchJwks2(new URL(env2.NEON_AUTH_JWKS_URL));
        jwksCache2.set(env2.NEON_AUTH_JWKS_URL, jwks);
      }
      const db = /* @__PURE__ */ __name(async (work) => {
        const client = createDbClient({
          connectionString: env2.ADMIN_HYPERDRIVE.connectionString,
          connectionTimeoutMillis: 3500,
          query_timeout: 3500,
          statement_timeout: 3500
        });
        try {
          await client.connect();
          const result = await client.query("SELECT current_user AS role_name");
          if (result.rows?.[0]?.role_name !== env2.EXPECTED_ADMIN_DB_ROLE) throw new Error("Unsafe database identity");
          return await work(client);
        } finally {
          await client.end();
        }
      }, "db");
      const api = createAdminApi({
        allowedOrigins: env2.ADMIN_ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
        verifyToken: /* @__PURE__ */ __name((token) => verifyManagedNeonJwt(token, jwks, env2.NEON_AUTH_ISSUER), "verifyToken"),
        loadActor: /* @__PURE__ */ __name((subject) => db(async (client) => {
          const result = await client.query(ACCOUNT, [subject]);
          if (result.rows.length !== 1) return null;
          const scopes = await client.query(SCOPES, [subject]);
          return {
            role: result.rows[0].role,
            enabled: result.rows[0].enabled,
            channels: scopes.rows.map((r) => r.channel_code)
          };
        }), "loadActor"),
        listChannels: /* @__PURE__ */ __name((subject, isAdmin) => db(async (client) => {
          const rows = await client.query(CHANNELS2);
          if (isAdmin) return rows.rows;
          const scopes = await client.query(SCOPES, [subject]);
          const permitted = new Set(scopes.rows.map((r) => r.channel_code));
          return rows.rows.filter((row) => permitted.has(row.code));
        }), "listChannels"),
        recordAudit: /* @__PURE__ */ __name(({ subject, action, outcome }) => db(async (client) => {
          await client.query(AUDIT13, [subject, action, outcome]);
        }), "recordAudit"),
        catalogueDb: db,
        googleSecret: env2.DIALOGFLOW_SERVICE_ACCOUNT_JSON,
        credentialStore: createCredentialStore(env2.CHATBOT_CREDENTIALS_R2, env2.CHATBOT_CREDENTIAL_KEY),
        catalogueR2: env2.ADMIN_MEDIA_R2,
        catalogueBookR2: env2.CATALOGUE_MEDIA_R2,
        cmsPublicSurfaceReady: env2.ADMIN_CMS_PUBLIC_READY === "true"
      });
      return api.fetch(request);
    }
  };
}
__name(createAdminStagingWorker, "createAdminStagingWorker");

// worker-entry.mjs
import { WorkerEntrypoint } from "cloudflare:workers";

// ceo-push-cron.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var URL2 = "https://ceo.fbmn.vn/api/ceo/push/dispatch";
async function deliverScheduledPush(env2, send2 = fetch) {
  const secret = env2?.FBMN_CEO_PUSH_DISPATCH_SECRET;
  if (typeof secret !== "string" || secret.length < 32) return false;
  const response = await send2(URL2, {
    method: "GET",
    redirect: "manual",
    cache: "no-store",
    headers: { Authorization: "Bearer " + secret },
    signal: AbortSignal.timeout(2e4)
  });
  if (response.status !== 200 || !response.ok) throw Error("CEO push dispatcher unavailable");
  return true;
}
__name(deliverScheduledPush, "deliverScheduledPush");

// chatbot-runtime.mjs
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../../lib/chatbot/chat-request.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function parseChatRequest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value;
  if (Object.keys(v).length !== 2 || typeof v.session !== "string" || typeof v.text !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v.session)) return null;
  const text = v.text.trim();
  if (!text || text.length > 300 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text)) return null;
  return { session: v.session, text };
}
__name(parseChatRequest, "parseChatRequest");

// chatbot-runtime.mjs
var HEX = /^[0-9a-f]{64}$/;
var encoder3 = new TextEncoder();
async function cxSessionId(visitor, session, revision2) {
  if (!HEX.test(visitor) || !Number.isSafeInteger(revision2) || revision2 < 1) throw Error("invalid_session");
  const hash2 = await crypto.subtle.digest("SHA-256", encoder3.encode(visitor + ":" + session + ":" + revision2));
  return Array.from(new Uint8Array(hash2), (v) => v.toString(16).padStart(2, "0")).join("").slice(0, 36);
}
__name(cxSessionId, "cxSessionId");
async function detectCx({ config: config2, secret, session, text, fetcher = fetch, getToken = tokenFor }) {
  const c = normalizeConfig(config2);
  if (!c || !c.model || !secret) throw Error("chat_unavailable");
  const host = c.location === "global" ? "dialogflow.googleapis.com" : c.location + "-dialogflow.googleapis.com";
  const resource = "projects/" + c.projectId + "/locations/" + c.location + "/agents/" + c.agentId + (c.environmentId === "draft" ? "" : "/environments/" + c.environmentId) + "/sessions/" + session;
  const token = await getToken(secret, fetcher);
  const response = await fetcher("https://" + host + "/v3beta1/" + resource + ":detectIntent", {
    method: "POST",
    redirect: "manual",
    signal: AbortSignal.timeout(15e3),
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ queryInput: { text: { text }, languageCode: "vi" }, queryParams: {
      timeZone: "Asia/Ho_Chi_Minh",
      sessionTtl: "1800s",
      disableWebhook: true,
      ...c.model === "agent-default" ? {} : { llmModelSettings: { model: c.model } }
    } })
  });
  if (!response.ok) throw Error("chat_unavailable");
  const result = await response.json();
  const messages = result?.queryResult?.responseMessages;
  if (!Array.isArray(messages)) throw Error("chat_unavailable");
  const reply5 = messages.flatMap((m) => Array.isArray(m?.text?.text) ? m.text.text : []).filter((t) => typeof t === "string").map((t) => t.trim()).filter(Boolean).join("\n").slice(0, 3e3);
  if (!reply5) throw Error("chat_unavailable");
  return reply5;
}
__name(detectCx, "detectCx");
async function runChat({ request, visitor, db, secret, loadSecret, saveTurn, detect = detectCx }) {
  const checked = parseChatRequest(request);
  if (!checked || !HEX.test(visitor) || typeof db !== "function" || !secret && !loadSecret) return { ok: false };
  try {
    const row = await db();
    const config2 = normalizeConfig(row?.config), revision2 = Number(row?.revision);
    if (!config2 || !config2.model) return { ok: false };
    const session = await cxSessionId(visitor, checked.session, revision2);
    const credential = loadSecret ? await loadSecret(revision2) || secret : secret;
    if (!credential) return { ok: false };
    let text = null;
    try {
      text = await detect({ config: config2, secret: credential, session, text: checked.text });
    } catch {
    }
    if (typeof text !== "string" || !text.trim() || text.length > 3e3) text = null;
    if (saveTurn) {
      try {
        await saveTurn({ session, question: checked.text, answer: text });
      } catch {
        console.warn("DL10C transcript write failed");
      }
    }
    return text === null ? { ok: false } : { ok: true, text };
  } catch {
    return { ok: false };
  }
}
__name(runChat, "runChat");

// worker-entry.mjs
var adminWorker = createAdminStagingWorker({});
var worker_entry_default = {
  fetch(request, env2, ctx) {
    return adminWorker.fetch(request, env2, ctx);
  },
  scheduled(_controller, env2, ctx) {
    ctx.waitUntil(deliverScheduledPush(env2));
  }
};
var ChatbotGateway = class extends WorkerEntrypoint {
  static {
    __name(this, "ChatbotGateway");
  }
  async chat(request, visitor) {
    const env2 = this.env;
    const db = /* @__PURE__ */ __name(async (work) => {
      if (env2.EXPECTED_ADMIN_DB_ROLE !== "fbmn_admin_http_staging" || !env2.ADMIN_HYPERDRIVE?.connectionString) throw Error("unavailable");
      const client = new Client({ connectionString: env2.ADMIN_HYPERDRIVE.connectionString, connectionTimeoutMillis: 3500, query_timeout: 3500, statement_timeout: 3500 });
      try {
        await client.connect();
        const identity = await client.query("SELECT current_user AS role_name");
        if (identity.rows?.[0]?.role_name !== env2.EXPECTED_ADMIN_DB_ROLE) throw Error("unavailable");
        return await work(client);
      } finally {
        await client.end();
      }
    }, "db");
    return runChat({ request, visitor, saveTurn: /* @__PURE__ */ __name((turn) => db((client) => saveChatTurn(client, turn)), "saveTurn"), secret: env2.DIALOGFLOW_SERVICE_ACCOUNT_JSON, loadSecret: /* @__PURE__ */ __name((revision2) => createCredentialStore(env2.CHATBOT_CREDENTIALS_R2, env2.CHATBOT_CREDENTIAL_KEY)?.read(revision2), "loadSecret"), db: /* @__PURE__ */ __name(() => db(async (client) => (await client.query("SELECT config,revision FROM fbmn_catalog_private.website_chatbot_config WHERE singleton=true")).rows[0]), "db") });
  }
};
export {
  ChatbotGateway,
  worker_entry_default as default
};
//# sourceMappingURL=worker-entry.js.map
