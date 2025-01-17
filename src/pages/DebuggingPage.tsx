import { EntrypointReply, Feed, ListFeedsReply } from "../api/types";
import { useHttpData } from "../hooks/http";
import { feedsURL, entrypointURL } from "../api/api";
import { ErrorMessage, LoadingPanel } from "../elements/BasicPage";

export default function DebuggingPage() {
  const feedData = useHttpData(feedsURL(), 5000, ListFeedsReply.fromJSON);
  const transiterData = useHttpData(
    entrypointURL(),
    null,
    EntrypointReply.fromJSON,
  );

  let error = feedData.error ?? transiterData.error;
  if (error !== null) {
    return (
      <ErrorMessage
        key="errorMessage"
        tryAgainFunction={() => {
          feedData.poll();
          transiterData.poll();
        }}
      >
        {error}
      </ErrorMessage>
    );
  }

  let loaded = feedData.response !== null && transiterData.response !== null;
  // TODO: the header and report suggestion should appear even if the HTTP request errors our
  return (
    <div className="DebugPage">
      <h1>Debugging</h1>
      <h3>
        To report a problem with the app, please{" "}
        <a href="https://github.com/jamespfennell/realtimerail.nyc/issues">
          open an issue on the GitHub respository
        </a>{" "}
        Thank you in advance!
      </h3>
      <LoadingPanel loaded={loaded}>
        <Body
          feedData={feedData.response!}
          transiterData={transiterData.response!}
        />
      </LoadingPanel>
    </div>
  );
}

type BodyProps = {
  feedData: ListFeedsReply;
  transiterData: EntrypointReply;
};

function Body(props: BodyProps) {
  let currentTime = Math.round(new Date().getTime());
  let subwayFeeds = [];
  for (const feed of props.feedData.feeds) {
    // TODO: would be nice to expose the feed parser via the Transiter public API
    if (feed.id === "gtfsstatic" || feed.id === "subwaycsv") {
      continue;
    }
    subwayFeeds.push(
      <tr>
        <td>
          <Dot
            className={statusColor(
              feed,
              currentTime,
              feed.lastSuccessfulUpdateMs!,
            )}
          />
        </td>
        <td>{feed.id}</td>
        <td>
          {prettyPrintDuration(currentTime, feed.lastSuccessfulUpdateMs!)}
        </td>
      </tr>,
    );
  }
  return (
    <div>
      <h2>UI</h2>
      <p className="Center">Build: #</p>
      <h2>Transiter</h2>
      <p className="Center">
        Version: {props.transiterData.transiter?.version}
      </p>
      <h2>Subway feeds</h2>
      <table>
        <tr>
          <td></td>
          <th>feed</th>
          <th>latest data</th>
        </tr>
        {subwayFeeds}
      </table>
      <h3>Legend</h3>
      <table>
        <tr>
          <td>
            <Dot className="Green" />
          </td>
          <td>
            new data less than 20 seconds ago (20 minutes for the alerts feed)
          </td>
        </tr>
        <tr>
          <td>
            <Dot className="Orange" />
          </td>
          <td>
            new data 20-60 seconds ago (20-60 minutes for the alerts feed)
          </td>
        </tr>
        <tr>
          <td>
            <Dot className="Red" />
          </td>
          <td>
            new data more than 1 minute ago (more than 1 hour for the alerts
            feed)
          </td>
        </tr>
      </table>
    </div>
  );
}

function Dot(props: { className: string }) {
  return <span className={props.className}>●</span>;
}

function prettyPrintDuration(currentTimeMs: number, eventTimeMs: number) {
  let seconds = Math.round((currentTimeMs - eventTimeMs) / 1000);
  if (seconds < 2) {
    return "1 second";
  }
  if (seconds <= 60) {
    return seconds + " seconds";
  }
  let minutes = Math.round(seconds / 60);
  if (minutes <= 60) {
    return minutes + " minutes";
  }
  let hours = Math.round(minutes / 60);
  if (hours < 60) {
    return hours + " hours";
  }
  return "more than a day";
}

function statusColor(feed: Feed, currentTimeMs: number, eventTimeMs: number) {
  let seconds = Math.round((currentTimeMs - eventTimeMs) / 1000);
  if (feed.id === "alerts") {
    seconds = seconds / 60;
  }
  if (seconds >= 60) {
    return "Red";
  }
  if (seconds >= 20) {
    return "Orange";
  }
  return "Green";
}
