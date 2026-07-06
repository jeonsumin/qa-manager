// 콘솔/네트워크 에러 수집기.
// Provider 마운트 시 install(), 언마운트 시 uninstall()로 원복.
// 각 배열은 최대 50개의 링 버퍼 (오래된 것부터 버림).

const MAX = 50;

function nowIso() {
  return new Date().toISOString();
}

function stringifyArg(a) {
  if (a instanceof Error) return a.message;
  if (typeof a === 'string') return a;
  if (a === undefined) return 'undefined';
  if (a === null) return 'null';
  try {
    return JSON.stringify(a);
  } catch {
    try {
      return String(a);
    } catch {
      return '[unserializable]';
    }
  }
}

export function createCollectors() {
  const consoleErrors = [];
  const networkErrors = [];

  function pushConsole(item) {
    consoleErrors.push(item);
    if (consoleErrors.length > MAX) consoleErrors.shift();
  }
  function pushNetwork(item) {
    networkErrors.push(item);
    if (networkErrors.length > MAX) networkErrors.shift();
  }

  let installed = false;

  // 원본 보관
  const origConsoleError = window.console.error;
  const origFetch = window.fetch;
  const OrigXHROpen = window.XMLHttpRequest.prototype.open;
  const OrigXHRSend = window.XMLHttpRequest.prototype.send;

  function onWindowError(event) {
    try {
      const err = event.error;
      pushConsole({
        ts: nowIso(),
        message: event.message || (err && err.message) || '알 수 없는 에러',
        stack: err && err.stack ? err.stack : undefined,
      });
    } catch {
      /* 수집기 자체 에러는 무시 (무한 루프 방지) */
    }
  }

  function onRejection(event) {
    try {
      const reason = event.reason;
      pushConsole({
        ts: nowIso(),
        message:
          reason instanceof Error ? reason.message : stringifyArg(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    } catch {
      /* 무시 */
    }
  }

  function install() {
    if (installed) return;
    installed = true;

    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onRejection);

    // console.error 패치 — 원본은 항상 호출, 내부 에러로 루프 생기지 않게 try/catch
    window.console.error = function patchedConsoleError() {
      const args = Array.prototype.slice.call(arguments);
      try {
        const errArg = args.find((a) => a instanceof Error);
        pushConsole({
          ts: nowIso(),
          message: args.map(stringifyArg).join(' '),
          stack: errArg ? errArg.stack : undefined,
        });
      } catch {
        /* 무시 */
      }
      return origConsoleError.apply(window.console, args);
    };

    // fetch 패치 — 응답 바디는 절대 읽지 않는다 (스트림 소모 금지). 원본 응답/거부를 그대로 반환.
    window.fetch = function patchedFetch(input, init) {
      let method = 'GET';
      let url = '';
      try {
        method =
          (init && init.method) ||
          (input && typeof input === 'object' && input.method) ||
          'GET';
        url =
          typeof input === 'string'
            ? input
            : (input && input.url) || String(input);
      } catch {
        /* 무시 */
      }
      return origFetch.apply(this, arguments).then(
        (response) => {
          try {
            if (response && !response.ok) {
              pushNetwork({
                ts: nowIso(),
                method: String(method).toUpperCase(),
                url,
                status: response.status,
                statusText: response.statusText,
              });
            }
          } catch {
            /* 무시 */
          }
          return response;
        },
        (err) => {
          try {
            pushNetwork({
              ts: nowIso(),
              method: String(method).toUpperCase(),
              url,
              error: (err && err.message) || String(err),
            });
          } catch {
            /* 무시 */
          }
          throw err;
        }
      );
    };

    // XMLHttpRequest 패치 — open에서 method/url 기록, loadend/error에서 실패 기록
    window.XMLHttpRequest.prototype.open = function patchedOpen(method, url) {
      try {
        this.__qaMethod = method;
        this.__qaUrl = url;
      } catch {
        /* 무시 */
      }
      return OrigXHROpen.apply(this, arguments);
    };

    window.XMLHttpRequest.prototype.send = function patchedSend() {
      const xhr = this;
      try {
        xhr.addEventListener('loadend', function () {
          try {
            // status 0 (요청 실패/취소)은 error 이벤트에서 처리
            if (xhr.status >= 400) {
              pushNetwork({
                ts: nowIso(),
                method: String(xhr.__qaMethod || 'GET').toUpperCase(),
                url: xhr.__qaUrl || '',
                status: xhr.status,
                statusText: xhr.statusText,
              });
            }
          } catch {
            /* 무시 */
          }
        });
        xhr.addEventListener('error', function () {
          try {
            pushNetwork({
              ts: nowIso(),
              method: String(xhr.__qaMethod || 'GET').toUpperCase(),
              url: xhr.__qaUrl || '',
              error: '네트워크 요청 실패',
            });
          } catch {
            /* 무시 */
          }
        });
      } catch {
        /* 무시 */
      }
      return OrigXHRSend.apply(this, arguments);
    };
  }

  function uninstall() {
    if (!installed) return;
    installed = false;
    window.removeEventListener('error', onWindowError);
    window.removeEventListener('unhandledrejection', onRejection);
    window.console.error = origConsoleError;
    window.fetch = origFetch;
    window.XMLHttpRequest.prototype.open = OrigXHROpen;
    window.XMLHttpRequest.prototype.send = OrigXHRSend;
  }

  function getLogs() {
    return {
      consoleErrors: consoleErrors.slice(),
      networkErrors: networkErrors.slice(),
    };
  }

  return { install, uninstall, getLogs };
}
