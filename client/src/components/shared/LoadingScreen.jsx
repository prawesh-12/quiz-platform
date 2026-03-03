const SEGMENT_COUNT = 16;

export default function LoadingScreen({ slowNotice = "" }) {
  return (
    <div className="startup-loading-screen" role="status" aria-live="polite">
      <div className="startup-loading-inner">
        <p className="startup-loading-title">Loading...</p>

        <div className="startup-progress-track" aria-hidden="true">
          {Array.from({ length: SEGMENT_COUNT }).map((_, index) => (
            <span
              key={index}
              className="startup-progress-segment"
              style={{ animationDelay: `${index * 90}ms` }}
            />
          ))}
        </div>

        <p className="startup-loading-status">Waking up server, please wait...</p>
        {slowNotice ? <p className="startup-loading-status startup-loading-status-long-wait">{slowNotice}</p> : null}
      </div>
    </div>
  );
}
