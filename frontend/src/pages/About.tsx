export default function About() {
  return (
    <div className="static-page">
      <div className="static-doc-header">
        <div className="doc-meta"><strong>DOCUMENT ID</strong> DT-ABT-001</div>
        <div className="doc-meta"><strong>SUBJECT</strong> ABOUT DIGITAK</div>
        <div className="doc-meta"><strong>CLASSIFICATION</strong> PUBLIC</div>
      </div>
      
      <div className="static-doc-content">
        <p>
          DigiTak delivers rapid, AI-summarized financial intelligence sourced
          from established global news outlets. Our automated pipeline monitors
          real-time RSS feeds from Reuters, CNBC, Yahoo Finance, MarketWatch,
          and Bloomberg, processing each story into a concise summary with
          actionable market impact analysis.
        </p>

        <h2>How it works</h2>
        <ul>
          <li>
            An automated system scans financial news feeds every 60 minutes,
            identifying new stories as they are published.
          </li>
          <li>
            Each article is processed through a resilient 17-model AI summarization pipeline that
            extracts the essential context and identifies potential market
            implications.
          </li>
          <li>
            Summaries are stored and served through a highly-concurrent REST API,
            keeping the feed current with minimal latency.
          </li>
        </ul>

        <h2>Why it exists</h2>
        <p>
          Financial professionals and individual investors alike face
          information overload. Dozens of outlets publish overlapping coverage
          of the same events, making it difficult to quickly assess what
          matters. DigiTak reduces that noise by presenting one summary per
          story alongside its potential market effects.
        </p>

        <h2>What it is not</h2>
        <p>
          DigiTak is an informational aggregator. It does not provide financial
          advice, investment recommendations, or trading signals. All
          summaries are AI-generated and should be verified against original
          sources before making any financial decisions.
        </p>
      </div>
    </div>
  );
}
