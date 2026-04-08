// debug-store.ts
// 외부 프로젝트에 복사하여 사용하는 독립 유틸리티
// 의존성: html2canvas (npm install html2canvas)

import html2canvas from 'html2canvas';

class DebugStore {
  logs: any[] = [];
  errors: any[] = [];
  networks: any[] = [];
  breadcrumbs: any[] = [];
  listeners = new Set<any>();
  maxLogs = 300;
  maxBreadcrumbs = 40;
  sessionId = crypto.randomUUID();

  // 설정
  config = {
    qaManagerUrl: 'http://localhost:3001',  // QA Manager 백엔드 URL
    projectId: null as number | null,        // QA Manager 프로젝트 ID
  };

  configure(options: { qaManagerUrl?: string; projectId?: number }) {
    this.config = { ...this.config, ...options };
  }

  subscribe(listener: any) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((l: any) => l(this.logs));
  }

  addLog(log: any) {
    this.logs = [...this.logs.slice(-this.maxLogs), log];
    this.notify();
  }

  addError(error: any) {
    this.errors.push(error);
    this.addLog({
      type: 'error',
      message: [error.message],
      time: new Date().toLocaleTimeString(),
    });
  }

  addNetwork(net: any) {
    this.networks.push(net);
    this.addLog({
      type: 'network',
      message: net,
      time: new Date().toLocaleTimeString(),
    });
  }

  leaveBreadcrumb(action: string) {
    this.breadcrumbs.push({ action, time: Date.now() });
    this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    this.addLog({
      type: 'breadcrumb',
      message: action,
      time: new Date().toLocaleTimeString(),
    });
  }

  clear() {
    this.logs = [];
    this.notify();
  }

  async captureScreenshot(): Promise<string | null> {
    // html2canvas로 현재 document.body 캡처
    // 실패하면 null 반환
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5,  // 파일 크기 줄이기
        logging: false,
      });
      return canvas.toDataURL('image/jpeg', 0.6);
    } catch (e) {
      console.warn('[DebugStore] Screenshot failed:', e);
      return null;
    }
  }

  createBugReport(description?: string) {
    return {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      title: this.errors.length > 0
        ? `[${new Date().toLocaleDateString()}] ${this.errors[this.errors.length - 1]?.message || '오류 발생'}`
        : `[${new Date().toLocaleDateString()}] 버그 리포트`,
      description: description || null,
      lastError: this.errors.length > 0 ? this.errors[this.errors.length - 1] : null,
      recentNetworks: this.networks.slice(-10),
      breadcrumbs: this.breadcrumbs,
      env: {
        userAgent: navigator.userAgent,
        url: location.href,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      },
    };
  }

  async sendBugReport(description?: string) {
    if (!this.config.projectId) {
      console.warn('[DebugStore] projectId not configured. Call debugStore.configure({ projectId: N })');
      return;
    }

    // 1. 스크린샷 캡처
    const screenshot = await this.captureScreenshot();

    // 2. 리포트 데이터 생성
    const report = {
      ...this.createBugReport(description),
      screenshot,
      projectId: this.config.projectId,
    };

    // 3. QA Manager로 전송
    try {
      const response = await fetch(`${this.config.qaManagerUrl}/api/report-bug`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      this.addLog({
        type: 'bug-report',
        message: 'Bug report sent successfully',
        time: new Date().toLocaleTimeString(),
      });

      return await response.json();
    } catch (e) {
      this.addLog({
        type: 'error',
        message: ['Bug report failed to send', (e as Error).message],
        time: new Date().toLocaleTimeString(),
      });
      throw e;
    }
  }
}

export const debugStore = new DebugStore();
