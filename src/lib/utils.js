export function calculateOvertime(workingHoursArray) {
  if (!Array.isArray(workingHoursArray) || workingHoursArray.length === 0) return 0;

  const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const normalPeriods = [
    { start: timeToMinutes('08:00'), end: timeToMinutes('12:00') },
    { start: timeToMinutes('13:00'), end: timeToMinutes('17:00') }
  ];

  let totalWorked = 0;
  let totalNormal = 0;

  for (const wh of workingHoursArray) {
    if (!wh.start || !wh.end) continue;
    
    let startMin = timeToMinutes(wh.start);
    let endMin = timeToMinutes(wh.end);
    
    if (endMin < startMin) {
      endMin += 24 * 60; // 日またぎ対応
    }

    let worked = endMin - startMin;

    // 昼休憩（12:00〜13:00）アリの場合は、その時間を滞在時間からマイナスする
    const isLunchBreak = wh.hasLunch !== false; // 明示的にfalseでなければアリとみなす

    if (isLunchBreak) {
      const lunchStart = timeToMinutes('12:00');
      const lunchEnd = timeToMinutes('13:00');
      const lunchOverlapStart = Math.max(startMin, lunchStart);
      const lunchOverlapEnd = Math.min(endMin, lunchEnd);
      
      if (lunchOverlapEnd > lunchOverlapStart) {
        worked -= (lunchOverlapEnd - lunchOverlapStart);
      }
    }

    totalWorked += worked;

    for (const period of normalPeriods) {
      const overlapStart = Math.max(startMin, period.start);
      const overlapEnd = Math.min(endMin, period.end);
      
      if (overlapEnd > overlapStart) {
        totalNormal += (overlapEnd - overlapStart);
      }
    }
  }

  const overtimeMin = totalWorked - totalNormal;
  return Math.max(0, overtimeMin);
}

export function formatOvertime(minutes) {
  if (minutes <= 0) return '';
  const hours = minutes / 60;
  const formattedHours = parseFloat(hours.toFixed(2));
  return `残業${formattedHours}`;
}

export function formatWorkingHoursText(workingHoursArray) {
  if (!Array.isArray(workingHoursArray)) return '';
  
  const hoursText = workingHoursArray.map(h => {
    let text = `${h.start}〜${h.end}`;
    if (h.hasLunch !== undefined) {
      text += ` (昼休憩: ${h.hasLunch ? 'アリ' : 'ナシ'})`;
    }
    return text;
  }).join('、');
  const otMin = calculateOvertime(workingHoursArray);
  const otText = formatOvertime(otMin);
  
  if (otText) {
    return `${hoursText} （${otText}）`;
  }
  return hoursText;
}
