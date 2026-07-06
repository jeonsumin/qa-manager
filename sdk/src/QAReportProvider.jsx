// QAReportProvider — 수집기 설치/원복, 플로팅 버튼, 리포트 폼을 묶는다.
// 사용법: <QAReportProvider projectId="qa_..." apiBaseUrl="http://localhost:3000">{children}</QAReportProvider>
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createCollectors } from './collectors.js';
import { captureScreenshot } from './capture.js';
import FloatingButton from './FloatingButton.jsx';
import ReportForm from './ReportForm.jsx';

const QAReportContext = createContext(null);

export function useQAReport() {
  return useContext(QAReportContext);
}

export function QAReportProvider({
  projectId,
  apiBaseUrl = 'http://localhost:3000',
  children,
}) {
  const collectorsRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [screenshot, setScreenshot] = useState(null);

  // 마운트 시 수집기 설치, 언마운트 시 원복
  useEffect(() => {
    const collectors = createCollectors();
    collectors.install();
    collectorsRef.current = collectors;
    return () => {
      collectors.uninstall();
      collectorsRef.current = null;
    };
  }, []);

  const getLogs = () =>
    collectorsRef.current
      ? collectorsRef.current.getLogs()
      : { consoleErrors: [], networkErrors: [] };

  // 클릭 → 모달 열기 전에 캡처 먼저 (모달이 스크린샷에 찍히지 않도록)
  async function handleOpen() {
    if (busy || open) return;
    setBusy(true);
    const shot = await captureScreenshot();
    setScreenshot(shot);
    setBusy(false);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setScreenshot(null);
  }

  const value = { projectId, apiBaseUrl, getLogs, openReport: handleOpen };

  return (
    <QAReportContext.Provider value={value}>
      {children}
      <FloatingButton onClick={handleOpen} busy={busy} />
      {open && (
        <ReportForm
          projectId={projectId}
          apiBaseUrl={apiBaseUrl}
          screenshot={screenshot}
          getLogs={getLogs}
          onClose={handleClose}
        />
      )}
    </QAReportContext.Provider>
  );
}
