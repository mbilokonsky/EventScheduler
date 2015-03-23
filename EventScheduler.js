var createScheduler = function(dispatch) {
  if (!dispatch) {
    console.warn("Dispatch function not provided to scheduler, running in debug mode.");
    dispatch = function(topic, message) {
      console.log("[" + topic + "]", message);
    };
  } else {
    console.log("Scheduler created with dispatch function", dispatch);
  }

  var queue = [];
  var events = {};

  var scheduleProcess = setInterval(onTick, 100);

  function onTick() {
    while (queue[0] <= Date.now()) {
      processTimestamp(queue.shift());
    }
  }

  function processTimestamp(timestamp) {
    var pending = events[timestamp];
    if (pending) {
      pending.forEach(function(e) {
        dispatch(e.topic, e.message);
      });

      delete events[timestamp];
    }
  }

  function schedule(timestamp, topic, message) {
    queue.push(timestamp);
    queue.sort(function(a, b) {
      return a - b;
    });

    if (!events[timestamp]) {
      events[timestamp] = [];
    }

    events[timestamp].push({
      topic: topic,
      message: message
    });
  }

  function batch(source) {
    source.forEach(function(scheduledItem) {
      schedule(scheduledItem.timestamp, scheduledItem.topic, scheduledItem.payload);
    });
  }

  function report(fromTime, toTime) {
    if (!fromTime) {
      fromTime = Date.now();
    }

    if (!toTime) {
      toTime = Infinity;
    }

    var output = [];

    queue.every(function(ts) {
      // the queue is sorted, so if we hit a timestamp that's greater than our stopping time we can quit out of this.
      if (ts > toTime) {
        return false;
      }

      // ignore elements prior to our specified startTime
      if (ts >= fromTime) {
        var delta = ts - Date.now();
        output.push({
          after: delta,
          events: events[ts]
        });
      }

      return true;
    });

    return output;
  }

  function formatReport(fromTime, toTime) {
    var data = report(fromTime, toTime);
    console.log("Pending Scheduler events:");
    data.forEach(function(item) {
      console.log("\tIn " + item.after + "ms, scheduler will publish:");
      item.events.forEach(function(event) {
        console.log("\t\t[" + event.topic + "]", event.message);
      });
    });
  }

  return {
    schedule: schedule,
    batch: batch,
    report: report,
    formatReport: formatReport
  };
};
