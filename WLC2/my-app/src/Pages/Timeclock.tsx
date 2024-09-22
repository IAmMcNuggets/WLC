import React, { useState, useEffect } from 'react';
import './Timeclock.css';

interface TimerResult {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
}

function Timeclock() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TimerResult[]>([]);
  const [startDateTime, setStartDateTime] = useState<Date | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setStartDateTime(new Date());
  };

  const handleStop = () => {
    setIsRunning(false);
    if (startDateTime) {
      const endDateTime = new Date();
      const newResult: TimerResult = {
        date: startDateTime.toLocaleDateString(),
        startTime: startDateTime.toLocaleTimeString(),
        endTime: endDateTime.toLocaleTimeString(),
        duration: time,
      };
      setResults(prevResults => [newResult, ...prevResults.slice(0, 5)]);
      setTime(0);
      setStartDateTime(null);
    }
  };

  return (
    <div className="timeclock-container">
      <h1>Timeclock</h1>
      <div className="stopwatch">
        <div className="time">{formatTime(time)}</div>
        <div className="buttons">
          <button onClick={handleStart} disabled={isRunning}>Start</button>
          <button onClick={handleStop} disabled={!isRunning}>Stop</button>
        </div>
      </div>
      <div className="results">
        <h2>Recent Time Entries</h2>
        <div className="results-table">
          <div className="results-header">
            <span>Date</span>
            <span>Start Time</span>
            <span>End Time</span>
            <span>Duration</span>
          </div>
          {results.map((result, index) => (
            <div key={index} className="results-row">
              <span>{result.date}</span>
              <span>{result.startTime}</span>
              <span>{result.endTime}</span>
              <span>{formatTime(result.duration)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Timeclock;